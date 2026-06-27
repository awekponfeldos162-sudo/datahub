const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { generateSecureToken } = require('../services/cryptoService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');

// Hash un token avant stockage DB (défense en profondeur si la DB est compromise)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { email, password, fullName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verificationToken = generateSecureToken(); // envoyé à l'utilisateur par email
    const verificationTokenHash = hashToken(verificationToken); // stocké en DB

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        verificationToken: verificationTokenHash,
      },
      select: { id: true, email: true, fullName: true, plan: true, emailVerified: true, createdAt: true },
    });

    await sendVerificationEmail(user.email, user.fullName, verificationToken);

    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info(`Nouvel utilisateur inscrit: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Compte créé. Vérifiez votre email.',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true, email: true, fullName: true, passwordHash: true,
        plan: true, emailVerified: true, avatar: true,
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    const { passwordHash: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: { user: userSafe, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token requis' });

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, plan: true },
    });

    if (!user) return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });

    const tokens = generateTokens(user.id);
    res.json({ success: true, data: tokens });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
    }
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({ where: { verificationToken: tokenHash } });
    if (!user) return res.status(400).json({ success: false, message: 'Token de vérification invalide' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    res.json({ success: true, message: 'Email vérifié avec succès' });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      const resetToken = generateSecureToken(); // 256 bits aléatoires → envoyé à l'utilisateur
      const resetTokenHash = hashToken(resetToken); // stocké en DB (hachage SHA-256)
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: resetTokenHash, resetTokenExpiry },
      });

      await sendPasswordResetEmail(user.email, user.fullName, resetToken);
    }

    res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const tokenHash = hashToken(token); // Comparer avec le hash stocké en DB
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, fullName: true, avatar: true,
      plan: true, emailVerified: true, mfaEnabled: true,
      createdAt: true, lastLoginAt: true,
      platformAccounts: {
        select: { platform: true, platformUsername: true, isActive: true, lastSyncAt: true, followerCount: true },
      },
    },
  });
  res.json({ success: true, data: user });
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName, avatar },
      select: { id: true, email: true, fullName: true, avatar: true, plan: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau requis' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Nouveau mot de passe minimum 8 caractères' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Compte OAuth — pas de mot de passe à changer' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    logger.info(`Mot de passe changé pour: ${user.email}`);
    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
      }
    }

    await prisma.user.delete({ where: { id: req.user.id } });
    logger.info(`Compte supprimé: ${user.email}`);
    res.json({ success: true, message: 'Compte supprimé définitivement' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refreshToken, verifyEmail, forgotPassword, resetPassword, getProfile, updateProfile, changePassword, deleteAccount };
