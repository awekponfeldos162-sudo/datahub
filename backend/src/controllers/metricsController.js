const { PrismaClient } = require('@prisma/client');
const { cacheGet, cacheSet } = require('../config/redis');

const prisma = new PrismaClient();

async function getDashboardOverview(req, res, next) {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    const cacheKey = `user:${userId}:dashboard:${period}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const since = getPeriodDate(period);

    const accounts = await prisma.platformAccount.findMany({
      where: { userId, isActive: true },
      include: {
        posts: {
          include: {
            metrics: {
              where: { metricDate: { gte: since } },
            },
          },
        },
      },
    });

    const overview = {
      totalPlatforms: accounts.length,
      totalFollowers: accounts.reduce((sum, a) => sum + a.followerCount, 0),
      totalPosts: accounts.reduce((sum, a) => sum + a.posts.length, 0),
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgEngagementRate: 0,
      platformBreakdown: [],
      dailyTrend: {},
    };

    const dailyData = {};

    for (const account of accounts) {
      let platformViews = 0, platformLikes = 0, platformComments = 0, platformShares = 0;

      for (const post of account.posts) {
        for (const metric of post.metrics) {
          overview.totalViews += metric.views;
          overview.totalLikes += metric.likes;
          overview.totalComments += metric.comments;
          overview.totalShares += metric.shares;
          platformViews += metric.views;
          platformLikes += metric.likes;
          platformComments += metric.comments;
          platformShares += metric.shares;

          const day = metric.metricDate.toISOString().split('T')[0];
          if (!dailyData[day]) dailyData[day] = { views: 0, likes: 0, engagement: 0 };
          dailyData[day].views += metric.views;
          dailyData[day].likes += metric.likes;
        }
      }

      overview.platformBreakdown.push({
        platform: account.platform,
        username: account.platformUsername,
        followers: account.followerCount,
        views: platformViews,
        likes: platformLikes,
        comments: platformComments,
        shares: platformShares,
        engagement: platformViews > 0
          ? (((platformLikes + platformComments + platformShares) / platformViews) * 100).toFixed(2)
          : 0,
      });
    }

    overview.dailyTrend = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    if (overview.totalViews > 0) {
      overview.avgEngagementRate = (
        ((overview.totalLikes + overview.totalComments + overview.totalShares) / overview.totalViews) * 100
      ).toFixed(2);
    }

    await cacheSet(cacheKey, overview, 300);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

async function getPlatformMetrics(req, res, next) {
  try {
    const userId = req.user.id;
    const { platform } = req.params;
    const { period = '30d', page = 1, limit = 20 } = req.query;

    const since = getPeriodDate(period);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const account = await prisma.platformAccount.findFirst({
      where: { userId, platform: platform.toUpperCase(), isActive: true },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Plateforme non connectée' });
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { platformAccountId: account.id, publishedAt: { gte: since } },
        include: {
          metrics: {
            where: { metricDate: { gte: since } },
            orderBy: { metricDate: 'desc' },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({
        where: { platformAccountId: account.id, publishedAt: { gte: since } },
      }),
    ]);

    const postsWithTotals = posts.map((post) => {
      const totals = post.metrics.reduce(
        (acc, m) => ({
          views: acc.views + m.views,
          likes: acc.likes + m.likes,
          comments: acc.comments + m.comments,
          shares: acc.shares + m.shares,
          reach: acc.reach + m.reach,
        }),
        { views: 0, likes: 0, comments: 0, shares: 0, reach: 0 }
      );
      const engagementRate = totals.views > 0
        ? (((totals.likes + totals.comments + totals.shares) / totals.views) * 100).toFixed(2)
        : 0;
      return { ...post, totals, engagementRate };
    });

    res.json({
      success: true,
      data: {
        account: {
          platform: account.platform,
          username: account.platformUsername,
          avatar: account.platformAvatar,
          followers: account.followerCount,
          lastSync: account.lastSyncAt,
        },
        posts: postsWithTotals,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: totalCount },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getTopPosts(req, res, next) {
  try {
    const userId = req.user.id;
    const { period = '30d', metric = 'views', limit = 10, platform } = req.query;
    const since = getPeriodDate(period);

    const whereClause = {
      platformAccount: { userId, isActive: true },
      publishedAt: { gte: since },
    };

    if (platform) whereClause.platformAccount = { ...whereClause.platformAccount, platform: platform.toUpperCase() };

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        platformAccount: { select: { platform: true, platformUsername: true } },
        metrics: { where: { metricDate: { gte: since } } },
      },
      take: parseInt(limit) * 3,
    });

    const postsWithTotals = posts.map((post) => {
      const totals = post.metrics.reduce(
        (acc, m) => ({
          views: acc.views + m.views,
          likes: acc.likes + m.likes,
          comments: acc.comments + m.comments,
          shares: acc.shares + m.shares,
        }),
        { views: 0, likes: 0, comments: 0, shares: 0 }
      );
      return { ...post, totals };
    });

    const sorted = postsWithTotals
      .sort((a, b) => (b.totals[metric] || 0) - (a.totals[metric] || 0))
      .slice(0, parseInt(limit));

    res.json({ success: true, data: sorted });
  } catch (error) {
    next(error);
  }
}

async function getEngagementHeatmap(req, res, next) {
  try {
    const userId = req.user.id;
    const { period = '90d' } = req.query;
    const since = getPeriodDate(period);

    const metrics = await prisma.metric.findMany({
      where: {
        post: { platformAccount: { userId, isActive: true } },
        metricDate: { gte: since },
      },
      include: { post: { select: { publishedAt: true } } },
    });

    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const metric of metrics) {
      const date = new Date(metric.post.publishedAt);
      const day = date.getDay();
      const hour = date.getHours();
      const engagement = metric.likes + metric.comments + metric.shares;
      heatmap[day][hour] += engagement;
      counts[day][hour] += 1;
    }

    const avgHeatmap = heatmap.map((dayRow, d) =>
      dayRow.map((val, h) => (counts[d][h] > 0 ? Math.round(val / counts[d][h]) : 0))
    );

    res.json({ success: true, data: { heatmap: avgHeatmap, days: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] } });
  } catch (error) {
    next(error);
  }
}

async function getComparisonData(req, res, next) {
  try {
    const userId = req.user.id;
    const { period = '30d', platforms } = req.query;
    const since = getPeriodDate(period);

    const platformFilter = platforms
      ? platforms.split(',').map((p) => p.toUpperCase())
      : undefined;

    const accounts = await prisma.platformAccount.findMany({
      where: {
        userId,
        isActive: true,
        ...(platformFilter && { platform: { in: platformFilter } }),
      },
      include: {
        posts: {
          include: { metrics: { where: { metricDate: { gte: since } } } },
        },
      },
    });

    const comparison = accounts.map((account) => {
      const totals = { views: 0, likes: 0, comments: 0, shares: 0, posts: account.posts.length };
      const dailyData = {};

      for (const post of account.posts) {
        for (const metric of post.metrics) {
          totals.views += metric.views;
          totals.likes += metric.likes;
          totals.comments += metric.comments;
          totals.shares += metric.shares;

          const day = metric.metricDate.toISOString().split('T')[0];
          if (!dailyData[day]) dailyData[day] = { views: 0, engagement: 0 };
          dailyData[day].views += metric.views;
          dailyData[day].engagement += metric.likes + metric.comments + metric.shares;
        }
      }

      return {
        platform: account.platform,
        username: account.platformUsername,
        followers: account.followerCount,
        ...totals,
        engagementRate: totals.views > 0
          ? (((totals.likes + totals.comments + totals.shares) / totals.views) * 100).toFixed(2)
          : 0,
        trend: Object.entries(dailyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({ date, ...data })),
      };
    });

    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
}

function getPeriodDate(period) {
  const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
  const d = days[period] || 30;
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
}

module.exports = { getDashboardOverview, getPlatformMetrics, getTopPosts, getEngagementHeatmap, getComparisonData };
