const axios = require('axios');

const BASE_URL = 'https://api.pinterest.com/v5';

function apiHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function getUserAccount(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/user_account`, {
    headers: apiHeaders(accessToken),
  });

  return {
    platformUserId: data.id,
    platformUsername: data.username,
    platformAvatar: data.profile_image,
    followerCount: data.follower_count || 0,
    followingCount: data.following_count || 0,
    pinCount: data.pin_count || 0,
    boardCount: data.board_count || 0,
    accountType: data.account_type,
    websiteUrl: data.website_url || null,
  };
}

async function getUserAnalytics(accessToken, startDate, endDate) {
  const metrics = [
    'IMPRESSION',
    'SAVE',
    'PIN_CLICK',
    'OUTBOUND_CLICK',
    'ENGAGEMENT',
    'ENGAGEMENT_RATE',
    'CLOSEUP_RATE',
  ].join(',');

  const { data } = await axios.get(`${BASE_URL}/user_account/analytics`, {
    headers: apiHeaders(accessToken),
    params: {
      start_date: startDate,
      end_date: endDate,
      metric_types: metrics,
      granularity: 'DAY',
    },
  });

  return data;
}

async function getBoards(accessToken, maxResults = 25) {
  const { data } = await axios.get(`${BASE_URL}/boards`, {
    headers: apiHeaders(accessToken),
    params: { page_size: maxResults },
  });

  return (data.items || []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description,
    pinCount: board.pin_count || 0,
    followerCount: board.follower_count || 0,
    url: `https://www.pinterest.com/${board.owner?.username}/`,
    coverImageUrl: board.media?.image_cover_url || null,
  }));
}

async function getPins(accessToken, maxResults = 25) {
  const { data } = await axios.get(`${BASE_URL}/pins`, {
    headers: apiHeaders(accessToken),
    params: { page_size: maxResults },
  });

  return (data.items || []).map((pin) => ({
    platformPostId: pin.id,
    type: 'pin',
    title: pin.title || null,
    description: pin.description || null,
    thumbnailUrl: pin.media?.images?.['400x300']?.url || pin.media?.images?.originals?.url || null,
    url: `https://www.pinterest.com/pin/${pin.id}/`,
    publishedAt: pin.created_at ? new Date(pin.created_at) : new Date(),
  }));
}

async function getPinAnalytics(accessToken, pinId, startDate, endDate) {
  const metrics = [
    'IMPRESSION',
    'SAVE',
    'PIN_CLICK',
    'OUTBOUND_CLICK',
    'ENGAGEMENT',
  ].join(',');

  const { data } = await axios.get(`${BASE_URL}/pins/${pinId}/analytics`, {
    headers: apiHeaders(accessToken),
    params: {
      start_date: startDate,
      end_date: endDate,
      metric_types: metrics,
      granularity: 'DAY',
      app_types: 'ALL',
    },
  });

  return data;
}

// Échange le code contre les tokens (Basic Auth avec APP_ID:APP_SECRET)
async function exchangeCodeForTokens(code, redirectUri) {
  const appId = process.env.PINTEREST_APP_ID;
  const appSecret = process.env.PINTEREST_APP_SECRET;

  if (!appId || !appSecret) throw new Error('PINTEREST_APP_ID/SECRET non configuré');

  const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const { data } = await axios.post(
    `${BASE_URL}/oauth/token`,
    params.toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return data;
}

// Rafraîchit le token d'accès avec le refresh token
async function refreshAccessToken(refreshToken) {
  const appId = process.env.PINTEREST_APP_ID;
  const appSecret = process.env.PINTEREST_APP_SECRET;
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { data } = await axios.post(
    `${BASE_URL}/oauth/token`,
    params.toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return data;
}

module.exports = {
  getUserAccount,
  getUserAnalytics,
  getBoards,
  getPins,
  getPinAnalytics,
  exchangeCodeForTokens,
  refreshAccessToken,
};
