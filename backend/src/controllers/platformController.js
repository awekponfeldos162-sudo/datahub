const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../services/cryptoService');
const facebookService = require('../services/facebookService');
const youtubeService = require('../services/youtubeService');
const instagramService = require('../services/instagramService');
const tiktokService = require('../services/tiktokService');
const pinterestService = require('../services/pinterestService');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function getConnectedPlatforms(req, res, next) {
  try {
    const platforms = await prisma.platformAccount.findMany({
      where: { userId: req.user.id },
      select: {
        id: true, platform: true, platformUsername: true, platformAvatar: true,
        isActive: true, lastSyncAt: true, followerCount: true, createdAt: true,
      },
    });
    res.json({ success: true, data: platforms });
  } catch (error) {
    next(error);
  }
}

async function connectPlatform(req, res, next) {
  try {
    const { platform, accessToken, refreshToken, expiresAt, platformUserId, platformUsername, platformAvatar } = req.body;

    const accessTokenEnc = encrypt(accessToken);
    const refreshTokenEnc = refreshToken ? encrypt(refreshToken) : null;

    const account = await prisma.platformAccount.upsert({
      where: { userId_platform: { userId: req.user.id, platform } },
      update: {
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
        platformUserId,
        platformUsername,
        platformAvatar,
        isActive: true,
      },
      create: {
        userId: req.user.id,
        platform,
        platformUserId,
        platformUsername,
        platformAvatar,
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await cacheDel(`user:${req.user.id}:platforms`);
    logger.info(`Plateforme ${platform} connectée pour utilisateur ${req.user.id}`);

    res.json({ success: true, message: `${platform} connecté avec succès`, data: { id: account.id, platform, platformUsername } });
  } catch (error) {
    next(error);
  }
}

async function disconnectPlatform(req, res, next) {
  try {
    const { platform } = req.params;

    await prisma.platformAccount.updateMany({
      where: { userId: req.user.id, platform: platform.toUpperCase() },
      data: { isActive: false, accessTokenEnc: '', refreshTokenEnc: null },
    });

    await cacheDel(`user:${req.user.id}:platforms`);
    res.json({ success: true, message: `${platform} déconnecté` });
  } catch (error) {
    next(error);
  }
}

async function syncPlatform(req, res, next) {
  try {
    const { platform } = req.params;

    const account = await prisma.platformAccount.findFirst({
      where: { userId: req.user.id, platform: platform.toUpperCase(), isActive: true },
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Compte non trouvé ou inactif' });
    }

    const accessToken = decrypt(account.accessTokenEnc);
    let syncResult = {};

    switch (account.platform) {
      case 'FACEBOOK': {
        const pages = await facebookService.getUserPages(accessToken);
        if (pages.length > 0) {
          const posts = await facebookService.getPagePosts(accessToken, pages[0].id);
          syncResult = { posts: posts.length, platform: 'FACEBOOK' };
          await savePosts(account.id, posts);
        }
        break;
      }
      case 'YOUTUBE': {
        const stats = await youtubeService.getChannelStats(accessToken);
        const videos = await youtubeService.getChannelVideos(accessToken);
        syncResult = { posts: videos.length, platform: 'YOUTUBE', followers: stats?.followerCount };
        await savePosts(account.id, videos);
        if (stats) {
          await prisma.platformAccount.update({
            where: { id: account.id },
            data: { followerCount: stats.followerCount },
          });
        }
        break;
      }
      case 'INSTAGRAM': {
        const info = await instagramService.getAccountInfo(accessToken);
        const media = await instagramService.getMedia(accessToken);
        syncResult = { posts: media.length, platform: 'INSTAGRAM', followers: info.followers_count };
        await savePosts(account.id, media);
        await prisma.platformAccount.update({
          where: { id: account.id },
          data: { followerCount: info.followers_count || 0, platformUsername: info.username },
        });
        break;
      }
      case 'TIKTOK': {
        const userInfo = await tiktokService.getUserInfo(accessToken);
        const videos = await tiktokService.getVideoList(accessToken);
        syncResult = { posts: videos.length, platform: 'TIKTOK', followers: userInfo?.follower_count };
        await savePosts(account.id, videos);
        if (userInfo) {
          await prisma.platformAccount.update({
            where: { id: account.id },
            data: { followerCount: userInfo.follower_count || 0, platformUsername: userInfo.display_name },
          });
        }
        break;
      }
      case 'PINTEREST': {
        const userAccount = await pinterestService.getUserAccount(accessToken);
        const pins = await pinterestService.getPins(accessToken, 25);
        syncResult = { posts: pins.length, platform: 'PINTEREST', followers: userAccount?.followerCount };
        await savePosts(account.id, pins);
        if (userAccount) {
          await prisma.platformAccount.update({
            where: { id: account.id },
            data: {
              followerCount: userAccount.followerCount || 0,
              platformUsername: userAccount.platformUsername,
              platformAvatar: userAccount.platformAvatar,
            },
          });
        }
        break;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedAccount = await prisma.platformAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    // Save follower snapshot for growth rate tracking
    if (updatedAccount.followerCount > 0) {
      await prisma.followerSnapshot.upsert({
        where: { platformAccountId_snapshotDate: { platformAccountId: account.id, snapshotDate: today } },
        update: { followerCount: updatedAccount.followerCount },
        create: { platformAccountId: account.id, followerCount: updatedAccount.followerCount, snapshotDate: today },
      });
    }

    await cacheDel(`user:${req.user.id}:metrics:*`);

    res.json({ success: true, message: 'Synchronisation réussie', data: syncResult });
  } catch (error) {
    logger.error(`Erreur sync ${req.params.platform}:`, error.message);
    next(error);
  }
}

async function savePosts(platformAccountId, posts) {
  for (const post of posts) {
    const { views, likes, comments, shares, watchTimeSeconds, ...postData } = post;

    const saved = await prisma.post.upsert({
      where: { platformAccountId_platformPostId: { platformAccountId, platformPostId: post.platformPostId } },
      update: { title: postData.title, thumbnailUrl: postData.thumbnailUrl, url: postData.url },
      create: { platformAccountId, ...postData },
    });

    await prisma.metric.upsert({
      where: { postId_metricDate: { postId: saved.id, metricDate: new Date(post.publishedAt.toDateString()) } },
      update: { views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0, watchTimeSeconds: watchTimeSeconds || 0 },
      create: {
        postId: saved.id,
        metricDate: new Date(post.publishedAt.toDateString()),
        views: views || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        watchTimeSeconds: watchTimeSeconds || 0,
      },
    });
  }
}

module.exports = { getConnectedPlatforms, connectPlatform, disconnectPlatform, syncPlatform };
