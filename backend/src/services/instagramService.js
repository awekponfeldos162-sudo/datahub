const axios = require('axios');

const BASE_URL = 'https://graph.instagram.com';

async function getAccountInfo(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/me`, {
    params: {
      fields: 'id,username,name,profile_picture_url,followers_count,media_count,biography,website',
      access_token: accessToken,
    },
  });
  return data;
}

async function getMedia(accessToken, limit = 25) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';

  const { data } = await axios.get(`${BASE_URL}/me/media`, {
    params: { fields, limit, access_token: accessToken },
  });

  return (data.data || []).map((media) => ({
    platformPostId: media.id,
    type: media.media_type?.toLowerCase() || 'image',
    title: media.caption?.slice(0, 255) || '',
    thumbnailUrl: media.thumbnail_url || media.media_url,
    url: media.permalink,
    publishedAt: new Date(media.timestamp),
    likes: media.like_count || 0,
    comments: media.comments_count || 0,
  }));
}

async function getMediaInsights(accessToken, mediaId) {
  const { data } = await axios.get(`${BASE_URL}/${mediaId}/insights`, {
    params: {
      metric: 'impressions,reach,engagement,saved',
      access_token: accessToken,
    },
  });

  const result = {};
  data.data?.forEach((m) => { result[m.name] = m.values?.[0]?.value || m.value || 0; });
  return result;
}

async function getInsightsOverview(accessToken, userId, period = 'day', since, until) {
  const metrics = 'impressions,reach,profile_views,follower_count,email_contacts,phone_call_clicks';

  const { data } = await axios.get(`${BASE_URL}/${userId}/insights`, {
    params: { metric: metrics, period, since, until, access_token: accessToken },
  });

  return data.data || [];
}

module.exports = { getAccountInfo, getMedia, getMediaInsights, getInsightsOverview };
