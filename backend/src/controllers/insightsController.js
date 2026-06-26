const { PrismaClient } = require('@prisma/client');
const { cacheGet, cacheSet } = require('../config/redis');

const prisma = new PrismaClient();

async function getInsights(req, res, next) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}:insights`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const accounts = await prisma.platformAccount.findMany({
      where: { userId, isActive: true },
      include: {
        posts: {
          include: { metrics: { where: { metricDate: { gte: since90 } } } },
        },
      },
    });

    const insights = {
      bestPostingTimes: getBestPostingTimes(accounts),
      bestContentTypes: getBestContentTypes(accounts),
      platformRanking: getPlatformRanking(accounts),
      growthTrend: getGrowthTrend(accounts),
      recommendations: [],
      alerts: [],
    };

    insights.recommendations = generateRecommendations(insights, accounts);
    insights.alerts = generateAlerts(accounts);

    await cacheSet(cacheKey, insights, 3600);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
}

function getBestPostingTimes(accounts) {
  const hourEngagement = Array(24).fill(0);
  const hourCounts = Array(24).fill(0);
  const dayEngagement = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);

  for (const account of accounts) {
    for (const post of account.posts) {
      const date = new Date(post.publishedAt);
      const hour = date.getHours();
      const day = date.getDay();
      const totalEngagement = post.metrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares, 0
      );
      if (totalEngagement > 0) {
        hourEngagement[hour] += totalEngagement;
        hourCounts[hour]++;
        dayEngagement[day] += totalEngagement;
        dayCounts[day]++;
      }
    }
  }

  const avgByHour = hourEngagement.map((v, i) => ({
    hour: i,
    label: `${i}h`,
    avgEngagement: hourCounts[i] > 0 ? Math.round(v / hourCounts[i]) : 0,
  })).sort((a, b) => b.avgEngagement - a.avgEngagement);

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const avgByDay = dayEngagement.map((v, i) => ({
    day: i,
    label: days[i],
    avgEngagement: dayCounts[i] > 0 ? Math.round(v / dayCounts[i]) : 0,
  })).sort((a, b) => b.avgEngagement - a.avgEngagement);

  return {
    bestHours: avgByHour.slice(0, 3),
    bestDays: avgByDay.slice(0, 3),
    hourlyChart: hourEngagement.map((v, i) => ({ hour: i, value: hourCounts[i] > 0 ? Math.round(v / hourCounts[i]) : 0 })),
  };
}

function getBestContentTypes(accounts) {
  const typeStats = {};

  for (const account of accounts) {
    for (const post of account.posts) {
      const type = post.type || 'post';
      if (!typeStats[type]) typeStats[type] = { count: 0, totalEngagement: 0, totalViews: 0 };
      typeStats[type].count++;
      const eng = post.metrics.reduce((sum, m) => sum + m.likes + m.comments + m.shares, 0);
      const views = post.metrics.reduce((sum, m) => sum + m.views, 0);
      typeStats[type].totalEngagement += eng;
      typeStats[type].totalViews += views;
    }
  }

  return Object.entries(typeStats).map(([type, stats]) => ({
    type,
    count: stats.count,
    avgEngagement: stats.count > 0 ? Math.round(stats.totalEngagement / stats.count) : 0,
    avgViews: stats.count > 0 ? Math.round(stats.totalViews / stats.count) : 0,
    engagementRate: stats.totalViews > 0
      ? ((stats.totalEngagement / stats.totalViews) * 100).toFixed(2)
      : 0,
  })).sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function getPlatformRanking(accounts) {
  return accounts.map((account) => {
    const totalViews = account.posts.reduce((sum, p) => sum + p.metrics.reduce((s, m) => s + m.views, 0), 0);
    const totalEng = account.posts.reduce((sum, p) => sum + p.metrics.reduce((s, m) => s + m.likes + m.comments + m.shares, 0), 0);
    return {
      platform: account.platform,
      username: account.platformUsername,
      followers: account.followerCount,
      totalViews,
      totalEngagement: totalEng,
      engagementRate: totalViews > 0 ? ((totalEng / totalViews) * 100).toFixed(2) : 0,
      score: totalViews * 0.3 + totalEng * 0.5 + account.followerCount * 0.2,
    };
  }).sort((a, b) => b.score - a.score);
}

function getGrowthTrend(accounts) {
  const weeklyData = {};

  for (const account of accounts) {
    for (const post of account.posts) {
      for (const metric of post.metrics) {
        const week = getWeekKey(metric.metricDate);
        if (!weeklyData[week]) weeklyData[week] = { views: 0, engagement: 0 };
        weeklyData[week].views += metric.views;
        weeklyData[week].engagement += metric.likes + metric.comments + metric.shares;
      }
    }
  }

  return Object.entries(weeklyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }));
}

function generateRecommendations(insights, accounts) {
  const recs = [];

  if (insights.bestPostingTimes.bestHours.length > 0) {
    const bestHour = insights.bestPostingTimes.bestHours[0];
    recs.push({
      type: 'timing',
      priority: 'high',
      title: 'Meilleur horaire de publication',
      description: `Publiez à ${bestHour.label} pour maximiser l'engagement. Vos posts à cet horaire obtiennent en moyenne ${bestHour.avgEngagement} interactions.`,
      icon: 'clock',
    });
  }

  if (insights.bestContentTypes.length > 0) {
    const bestType = insights.bestContentTypes[0];
    recs.push({
      type: 'content',
      priority: 'high',
      title: `Les "${bestType.type}" performent mieux`,
      description: `Les publications de type "${bestType.type}" génèrent ${bestType.avgEngagement} interactions en moyenne. Produisez-en davantage.`,
      icon: 'star',
    });
  }

  const lowEngPlatforms = insights.platformRanking.filter((p) => parseFloat(p.engagementRate) < 1);
  if (lowEngPlatforms.length > 0) {
    recs.push({
      type: 'platform',
      priority: 'medium',
      title: 'Plateforme avec faible engagement',
      description: `${lowEngPlatforms.map((p) => p.platform).join(', ')} affiche un taux d'engagement inférieur à 1%. Révisez votre stratégie de contenu sur ces plateformes.`,
      icon: 'alert',
    });
  }

  const totalPosts = accounts.reduce((sum, a) => sum + a.posts.length, 0);
  const avgPostsPerWeek = totalPosts / 12;
  if (avgPostsPerWeek < 3) {
    recs.push({
      type: 'frequency',
      priority: 'medium',
      title: 'Augmentez votre fréquence de publication',
      description: `Vous publiez en moyenne ${avgPostsPerWeek.toFixed(1)} posts/semaine. Visez 3-5 publications par semaine pour maintenir l'algorithme actif.`,
      icon: 'trending-up',
    });
  }

  return recs;
}

function generateAlerts(accounts) {
  const alerts = [];
  const now = new Date();
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

  for (const account of accounts) {
    if (account.lastSyncAt && account.lastSyncAt < threeDaysAgo) {
      alerts.push({
        type: 'sync',
        severity: 'warning',
        platform: account.platform,
        message: `Les données de ${account.platform} n'ont pas été synchronisées depuis ${Math.round((now - account.lastSyncAt) / 86400000)} jours.`,
      });
    }

    const recentMetrics = account.posts.flatMap((p) => p.metrics).slice(-10);
    if (recentMetrics.length >= 5) {
      const avgEngagement = recentMetrics.reduce((sum, m) => sum + m.likes + m.comments + m.shares, 0) / recentMetrics.length;
      if (avgEngagement < 5) {
        alerts.push({
          type: 'engagement_drop',
          severity: 'warning',
          platform: account.platform,
          message: `Baisse d'engagement détectée sur ${account.platform}. Engagement moyen récent: ${avgEngagement.toFixed(0)} interactions.`,
        });
      }
    }
  }

  return alerts;
}

function getWeekKey(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  return monday.toISOString().split('T')[0];
}

module.exports = { getInsights };
