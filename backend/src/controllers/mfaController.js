const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function setupMFA(req, res, next) {
  try {
    const secret = speakeasy.generateSecret({
      name: `DATAhub (${req.user.email})`,
      issuer: 'DATAhub',
      length: 32,
    });

    // Store secret temporarily — only persisted after verification
    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaSecret: secret.base32 },
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
        otpauth: secret.otpauth_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyMFA(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Code TOTP requis' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'MFA non initialisé' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ success: false, message: 'Code TOTP invalide' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaEnabled: true },
    });

    logger.info(`MFA activé pour: ${user.email}`);
    res.json({ success: true, message: 'Authentification à deux facteurs activée' });
  } catch (error) {
    next(error);
  }
}

async function disableMFA(req, res, next) {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    res.json({ success: true, message: 'MFA désactivé' });
  } catch (error) {
    next(error);
  }
}

module.exports = { setupMFA, verifyMFA, disableMFA };
