const axios = require('axios');

const BASE_URL = 'https://adsapi.snapchat.com/v1';
const AUTH_URL = 'https://accounts.snapchat.com/login/oauth2';

async function getAccountInfo(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.me;
}

async function getAdAccounts(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/me/adaccounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.adaccounts || [];
}

async function getCampaignStats(accessToken, adAccountId, startDate, endDate) {
  const { data } = await axios.get(
    `${BASE_URL}/adaccounts/${adAccountId}/campaigns`,
    {
      params: {
        fields: 'id,name,status,impressions,swipes,swipe_up_rate,spend',
        start_time: startDate,
        end_time: endDate,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return (data.campaigns || []).map((c) => ({
    platformPostId: c.id,
    type: 'campaign',
    title: c.name || '',
    publishedAt: new Date(startDate),
    views: c.stats?.impressions || 0,
    likes: c.stats?.swipes || 0,
    shares: 0,
    comments: 0,
    reach: c.stats?.reach || 0,
    engagementRate: c.stats?.swipe_up_rate || 0,
  }));
}

async function getPublicProfileStats(accessToken, username) {
  const { data } = await axios.get(`${BASE_URL}/public/profile/${username}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    platformUserId: data.id,
    platformUsername: data.username,
    followerCount: data.subscriber_count || 0,
    platformAvatar: data.bitmoji?.selfie,
  };
}

async function getStoryInsights(accessToken, storyId) {
  const { data } = await axios.get(`${BASE_URL}/stories/${storyId}/insights`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    views: data.impressions || 0,
    reach: data.reach || 0,
    replies: data.replies || 0,
    screenshots: data.screenshots || 0,
  };
}

function getOAuthUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'snapchat-marketing-api',
    state,
  });
  return `${AUTH_URL}/token?${params.toString()}`;
}

async function exchangeCode(clientId, clientSecret, code, redirectUri) {
  const { data } = await axios.post(
    `${AUTH_URL}/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const { data } = await axios.post(
    `${AUTH_URL}/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data;
}

module.exports = {
  getAccountInfo,
  getAdAccounts,
  getCampaignStats,
  getPublicProfileStats,
  getStoryInsights,
  getOAuthUrl,
  exchangeCode,
  refreshAccessToken,
};
