const express = require('express');
const passport = require('passport');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');

router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), authController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    const { generateTokens } = require('../middleware/auth');
    const { accessToken, refreshToken } = generateTokens(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }
);

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
