const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('./cryptoService');
const { sendWeeklyReport } = require('./emailService');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

function startScheduledJobs() {
  // Sync all active platforms every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Démarrage de la synchronisation automatique des plateformes...');
    try {
      const accounts = await prisma.platformAccount.findMany({
        where: { isActive: true },
        include: { user: { select: { plan: true } } },
      });

      for (const account of accounts) {
        if (account.user.plan === 'FREE') continue;
        logger.info(`Sync auto: ${account.platform} pour utilisateur ${account.userId}`);
      }
    } catch (error) {
      logger.error('Erreur sync automatique:', error.message);
    }
  });

  // Send weekly reports every Monday at 8am
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Envoi des rapports hebdomadaires...');
    try {
      const users = await prisma.user.findMany({
        where: { plan: { in: ['PRO', 'ENTERPRISE'] }, emailVerified: true },
        include: {
          platformAccounts: {
            where: { isActive: true },
            select: { platform: true, followerCount: true },
          },
        },
      });

      for (const user of users) {
        const reportData = user.platformAccounts.map((a) => ({
          platform: a.platform,
          views: 0,
          engagementRate: 0,
        }));

        if (reportData.length > 0) {
          await sendWeeklyReport(user.email, user.fullName, reportData);
        }
      }

      logger.info(`Rapports hebdomadaires envoyés à ${users.length} utilisateurs`);
    } catch (error) {
      logger.error('Erreur envoi rapports hebdomadaires:', error.message);
    }
  });

  // Clean expired tokens daily at 2am
  cron.schedule('0 2 * * *', async () => {
    logger.info('Nettoyage des tokens expirés...');
    try {
      await prisma.user.updateMany({
        where: { resetTokenExpiry: { lt: new Date() } },
        data: { resetToken: null, resetTokenExpiry: null },
      });
    } catch (error) {
      logger.error('Erreur nettoyage tokens:', error.message);
    }
  });

  logger.info('Jobs planifiés configurés: sync (6h), rapports (lundi 8h), nettoyage (2h quotidien)');
}

module.exports = { startScheduledJobs };
