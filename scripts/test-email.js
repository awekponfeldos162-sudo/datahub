#!/usr/bin/env node
// Test SMTP configuration: node scripts/test-email.js
require('dotenv').config({ path: './backend/.env' });
const nodemailer = require('./backend/node_modules/nodemailer');

const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

console.log('\n=== DATAhub SMTP Test ===');
console.log(`Host: ${config.host}:${config.port}`);
console.log(`User: ${config.auth.user || '(non configuré)'}`);

if (!config.auth.user || !config.auth.pass) {
  console.error('\n❌ SMTP_USER et SMTP_PASS non configurés dans backend/.env');
  console.log('\nConfiguration Gmail requise:');
  console.log('  1. Activer la vérification en 2 étapes sur Google');
  console.log('  2. Créer un "Mot de passe d\'application" (Sécurité > Mots de passe des applications)');
  console.log('  3. Ajouter dans backend/.env:');
  console.log('     SMTP_HOST=smtp.gmail.com');
  console.log('     SMTP_PORT=587');
  console.log('     SMTP_USER=votre@gmail.com');
  console.log('     SMTP_PASS=xxxx xxxx xxxx xxxx  (app password 16 chars)');
  console.log('     EMAIL_FROM=noreply@datahub.app');
  process.exit(1);
}

const transporter = nodemailer.createTransport(config);

(async () => {
  try {
    console.log('\nVérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');

    const recipient = process.argv[2] || config.auth.user;
    console.log(`\nEnvoi d'un email de test à: ${recipient}`);

    const info = await transporter.sendMail({
      from: `"DATAhub Test" <${config.auth.user}>`,
      to: recipient,
      subject: 'DATAhub — Test SMTP ✅',
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 30px;">
          <div style="background: #1e3a5f; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #fff; margin: 0;">DATAhub</h1>
          </div>
          <h2 style="color: #1e293b;">Configuration SMTP réussie ✅</h2>
          <p style="color: #475569;">Votre configuration email est correctement établie.</p>
          <p style="color: #94a3b8; font-size: 12px;">Envoyé le: ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      `,
    });

    console.log(`✅ Email envoyé! MessageID: ${info.messageId}`);
    if (info.accepted?.length) console.log(`   Accepté par: ${info.accepted.join(', ')}`);
  } catch (error) {
    console.error('\n❌ Erreur SMTP:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\nProblème d\'authentification. Pour Gmail:');
      console.log('  - Utilisez un "Mot de passe d\'application" (pas votre mot de passe Gmail)');
      console.log('  - La vérification en 2 étapes doit être activée');
    }
    process.exit(1);
  }
})();
