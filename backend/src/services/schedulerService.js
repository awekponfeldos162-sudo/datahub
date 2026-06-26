const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWeeklyReport } = require('./emailService');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function getWeeklyMetricsForUser(userId) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const metrics = await prisma.metric.groupBy({
    by: ['platform'],
    where: {
      userId,
      recordedAt: { gte: weekAgo, lte: now },
    },
    _sum: { views: true, likes: true, comments: true, shares: true },
    _count: { id: true },
  });

  const accounts = await prisma.platformAccount.findMany({
    where: { userId, isActive: true },
    select: { platform: true, followerCount: true },
  });

  const followerMap = Object.fromEntries(accounts.map((a) => [a.platform, a.followerCount]));

  return metrics.map((m) => {
    const totalInteractions = (m._sum.likes || 0) + (m._sum.comments || 0) + (m._sum.shares || 0);
    const followers = followerMap[m.platform] || 1;
    const engagementRate = m._count.id > 0
      ? ((totalInteractions / (m._count.id * followers)) * 100).toFixed(2)
      : '0.00';

    return {
      platform: m.platform,
      views: m._sum.views || 0,
      likes: m._sum.likes || 0,
      comments: m._sum.comments || 0,
      shares: m._sum.shares || 0,
      engagementRate: parseFloat(engagementRate),
    };
  });
}

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

  // Send weekly reports every Monday at 8am with real metrics
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Envoi des rapports hebdomadaires...');
    try {
      const users = await prisma.user.findMany({
        where: { plan: { in: ['PRO', 'ENTERPRISE'] }, emailVerified: true },
      });

      let sentCount = 0;
      for (const user of users) {
        const reportData = await getWeeklyMetricsForUser(user.id);
        if (reportData.length > 0) {
          await sendWeeklyReport(user.email, user.fullName, reportData);
          sentCount++;
        }
      }

      logger.info(`Rapports hebdomadaires envoyés à ${sentCount} utilisateurs`);
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
