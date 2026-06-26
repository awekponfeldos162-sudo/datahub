const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendWeeklyReport } = require('./emailService');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function getWeeklyMetricsForUser(userId) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const accounts = await prisma.platformAccount.findMany({
    where: { userId, isActive: true },
    select: {
      platform: true,
      followerCount: true,
      posts: {
        select: {
          metrics: {
            where: { metricDate: { gte: weekAgo, lte: now } },
            select: { views: true, likes: true, comments: true, shares: true },
          },
        },
      },
    },
  });

  return accounts
    .map((account) => {
      const totals = account.posts.flatMap((p) => p.metrics).reduce(
        (acc, m) => ({
          views: acc.views + m.views,
          likes: acc.likes + m.likes,
          comments: acc.comments + m.comments,
          shares: acc.shares + m.shares,
          count: acc.count + 1,
        }),
        { views: 0, likes: 0, comments: 0, shares: 0, count: 0 }
      );

      const totalInteractions = totals.likes + totals.comments + totals.shares;
      const followers = account.followerCount || 1;
      const engagementRate = totals.count > 0
        ? ((totalInteractions / (totals.count * followers)) * 100).toFixed(2)
        : '0.00';

      return {
        platform: account.platform,
        views: totals.views,
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares,
        engagementRate: parseFloat(engagementRate),
      };
    })
    .filter((r) => r.views > 0 || r.likes > 0);
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
