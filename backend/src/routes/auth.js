const express = require('express');
const passport = require('passport');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');
const { encrypt } = require('../services/cryptoService');
const youtubeService = require('../services/youtubeService');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), authController.resetPassword);

// Google OAuth (connexion compte utilisateur)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    const { generateTokens } = require('../middleware/auth');
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

// ─── YouTube OAuth (connexion chaîne YouTube) ─────────────────────────────
const YT_CLIENT_ID = () => process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const YT_CLIENT_SECRET = () => process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const YT_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ');

// Initiation : l'utilisateur clique "Connecter YouTube"
router.get('/youtube', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.redirect(`${process.env.FRONTEND_URL}/settings?error=no_token`);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=invalid_token`);
    }

    if (!YT_CLIENT_ID()) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=youtube_not_configured`);
    }

    // Encode le userId dans le state (signé, 10 min)
    const state = jwt.sign(
      { userId: decoded.sub, platform: 'YOUTUBE' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const params = new URLSearchParams({
      client_id: YT_CLIENT_ID(),
      redirect_uri: `${process.env.APP_URL}/api/auth/youtube/callback`,
      response_type: 'code',
      scope: YT_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (error) {
    logger.error('YouTube OAuth init error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=oauth_init_failed`);
  }
});

// Callback Google → échange le code → sauvegarde dans PlatformAccount
router.get('/youtube/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) return res.redirect(`${process.env.FRONTEND_URL}/settings?error=access_denied`);
    if (!code || !state) return res.redirect(`${process.env.FRONTEND_URL}/settings?error=missing_params`);

    let stateData;
    try {
      stateData = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=invalid_state`);
    }

    const { userId } = stateData;

    // Échange le code contre les tokens
    const { data: tokens } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: YT_CLIENT_ID(),
      client_secret: YT_CLIENT_SECRET(),
      redirect_uri: `${process.env.APP_URL}/api/auth/youtube/callback`,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = tokens;

    // Récupère les infos de la chaîne
    const channelStats = await youtubeService.getChannelStats(access_token);
    if (!channelStats) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=no_channel`);
    }

    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    await prisma.platformAccount.upsert({
      where: { userId_platform: { userId, platform: 'YOUTUBE' } },
      update: {
        accessTokenEnc: encrypt(access_token),
        refreshTokenEnc: refresh_token ? encrypt(refresh_token) : undefined,
        tokenExpiresAt: expiresAt,
        platformUserId: channelStats.platformUserId,
        platformUsername: channelStats.platformUsername,
        platformAvatar: channelStats.platformAvatar,
        followerCount: channelStats.followerCount,
        isActive: true,
      },
      create: {
        userId,
        platform: 'YOUTUBE',
        platformUserId: channelStats.platformUserId,
        platformUsername: channelStats.platformUsername,
        platformAvatar: channelStats.platformAvatar,
        followerCount: channelStats.followerCount,
        accessTokenEnc: encrypt(access_token),
        refreshTokenEnc: refresh_token ? encrypt(refresh_token) : null,
        tokenExpiresAt: expiresAt,
      },
    });

    logger.info(`YouTube connecté pour userId=${userId}, chaîne: ${channelStats.platformUsername}`);
    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=YOUTUBE`);
  } catch (error) {
    logger.error('YouTube OAuth callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=oauth_failed`);
  }
});

// Protected
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, validate(schemas.updateProfile), authController.updateProfile);
router.patch('/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);
router.delete('/account', authenticate, authController.deleteAccount);

// MFA / TOTP
const mfaController = require('../controllers/mfaController');
router.post('/mfa/setup', authenticate, mfaController.setupMFA);
router.post('/mfa/verify', authenticate, mfaController.verifyMFA);
router.delete('/mfa', authenticate, mfaController.disableMFA);

module.exports = router;
