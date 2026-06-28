const axios = require('axios');

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function getChannelStats(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/channels`, {
    params: {
      part: 'statistics,snippet,brandingSettings',
      mine: true,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const channel = data.items?.[0];
  if (!channel) return null;

  return {
    platformUserId: channel.id,
    platformUsername: channel.snippet.title,
    platformAvatar: channel.snippet.thumbnails?.default?.url,
    followerCount: parseInt(channel.statistics.subscriberCount) || 0,
    videoCount: parseInt(channel.statistics.videoCount) || 0,
    viewCount: parseInt(channel.statistics.viewCount) || 0,
  };
}

async function getChannelVideos(accessToken, maxResults = 25) {
  const { data: searchData } = await axios.get(`${BASE_URL}/search`, {
    params: { part: 'snippet', forMine: true, type: 'video', maxResults, order: 'date' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchData.items?.length) return [];

  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');

  const { data: videosData } = await axios.get(`${BASE_URL}/videos`, {
    params: {
      part: 'statistics,snippet,contentDetails',
      id: videoIds,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return videosData.items.map((video) => ({
    platformPostId: video.id,
    type: 'video',
    title: video.snippet.title,
    thumbnailUrl: video.snippet.thumbnails?.medium?.url,
    url: `https://youtube.com/watch?v=${video.id}`,
    publishedAt: new Date(video.snippet.publishedAt),
    views: parseInt(video.statistics.viewCount) || 0,
    likes: parseInt(video.statistics.likeCount) || 0,
    comments: parseInt(video.statistics.commentCount) || 0,
    watchTimeSeconds: parseDuration(video.contentDetails.duration),
  }));
}

async function getVideoAnalytics(accessToken, videoId, startDate, endDate) {
  const { data } = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
    params: {
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,likes,dislikes,comments,shares,estimatedMinutesWatched,averageViewDuration',
      dimensions: 'day',
      filters: `video==${videoId}`,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data.rows || [];
}

// Retourne les métriques jour par jour pour une vidéo donnée
async function getVideoDailyAnalytics(accessToken, videoId, startDate, endDate) {
  const { data } = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
    params: {
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,likes,comments,shares,estimatedMinutesWatched',
      dimensions: 'day',
      filters: `video==${videoId}`,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!data.rows?.length) return [];

  // columns: day, views, likes, comments, shares, estimatedMinutesWatched
  return data.rows.map(([day, views, likes, comments, shares, watchMinutes]) => ({
    metricDate: new Date(day),
    views: views || 0,
    likes: likes || 0,
    comments: comments || 0,
    shares: shares || 0,
    watchTimeSeconds: Math.round((watchMinutes || 0) * 60),
  }));
}

async function getChannelAnalytics(accessToken, startDate, endDate) {
  const { data } = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
    params: {
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,likes,comments,shares,subscribersGained,subscribersLost,estimatedMinutesWatched',
      dimensions: 'day',
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data;
}

function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

module.exports = { getChannelStats, getChannelVideos, getVideoAnalytics, getChannelAnalytics, getVideoDailyAnalytics };
