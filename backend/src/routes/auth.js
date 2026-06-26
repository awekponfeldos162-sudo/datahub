const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Nom complet requis'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authLimiter, body('email').isEmail(), authController.forgotPassword);
router.post('/reset-password', authLimiter, [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], authController.resetPassword);

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
router.patch('/profile', authenticate, authController.updateProfile);

// MFA / TOTP
const mfaController = require('../controllers/mfaController');
router.post('/mfa/setup', authenticate, mfaController.setupMFA);
router.post('/mfa/verify', authenticate, mfaController.verifyMFA);
router.delete('/mfa', authenticate, mfaController.disableMFA);
router.patch('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], authController.changePassword);
router.delete('/account', authenticate, authController.deleteAccount);

module.exports = router;
