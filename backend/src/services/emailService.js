const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

let transporter;

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    if (process.env.NODE_ENV === 'test' || !isSmtpConfigured()) {
      // Ethereal preview account for dev/test
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: 'ethereal@example.com', pass: 'preview' },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
      });
    }
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    logger.warn(`[EMAIL DEV] Vers: ${to} | Sujet: ${subject} (SMTP non configuré — email non envoyé)`);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"${process.env.APP_NAME || 'DATAhub'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email envoyé à ${to}: ${subject} [${info.messageId}]`);
  } catch (error) {
    logger.error('Erreur envoi email:', error.message);
  }
}

async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail({
    to: email,
    subject: 'Vérifiez votre compte DATAhub',
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
        <div style="background: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">DATAhub</h1>
          <p style="color: #94a3b8; margin: 8px 0 0;">Plateforme d'Analyse Multi-Réseaux Sociaux</p>
        </div>
        <div style="background: #fff; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Bonjour ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">Merci de vous être inscrit sur DATAhub. Veuillez vérifier votre adresse email pour activer votre compte.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: #1e3a5f; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Vérifier mon email
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: email,
    subject: 'Réinitialisation de mot de passe DATAhub',
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
        <div style="background: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0;">DATAhub</h1>
        </div>
        <div style="background: #fff; padding: 40px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Bonjour ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #dc2626; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      </div>
    `,
  });
}

async function sendWeeklyReport(email, name, reportData) {
  await sendEmail({
    to: email,
    subject: `Votre rapport hebdomadaire DATAhub — ${new Date().toLocaleDateString('fr-FR')}`,
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">DATAhub — Rapport Hebdomadaire</h1>
        </div>
        <div style="background: #fff; padding: 40px;">
          <p>Bonjour ${name},</p>
          <p>Voici votre résumé de performances de la semaine :</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f1f5f9;">
              <th style="padding: 12px; text-align: left; color: #1e3a5f;">Plateforme</th>
              <th style="padding: 12px; text-align: right;">Vues</th>
              <th style="padding: 12px; text-align: right;">Engagement</th>
            </tr>
            ${reportData.map((p) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${p.platform}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${p.views?.toLocaleString() || 0}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${p.engagementRate || 0}%</td>
              </tr>
            `).join('')}
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #1e3a5f; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
              Voir mon tableau de bord
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendWeeklyReport };
