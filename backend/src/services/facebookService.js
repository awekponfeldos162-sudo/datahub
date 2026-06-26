const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v18.0';

async function getPageInsights(accessToken, pageId, since, until) {
  const metrics = [
    'page_impressions', 'page_reach', 'page_engaged_users',
    'page_fans', 'page_post_engagements', 'page_views_total',
  ];

  const { data } = await axios.get(`${BASE_URL}/${pageId}/insights`, {
    params: {
      metric: metrics.join(','),
      period: 'day',
      since,
      until,
      access_token: accessToken,
    },
  });

  return data.data;
}

async function getPagePosts(accessToken, pageId, limit = 25) {
  const fields = 'id,message,story,created_time,full_picture,permalink_url,type,likes.summary(true),comments.summary(true),shares';

  const { data } = await axios.get(`${BASE_URL}/${pageId}/posts`, {
    params: { fields, limit, access_token: accessToken },
  });

  return data.data.map((post) => ({
    platformPostId: post.id,
    type: post.type || 'post',
    title: post.message?.slice(0, 255) || post.story || '',
    thumbnailUrl: post.full_picture,
    url: post.permalink_url,
    publishedAt: new Date(post.created_time),
    likes: post.likes?.summary?.total_count || 0,
    comments: post.comments?.summary?.total_count || 0,
    shares: post.shares?.count || 0,
  }));
}

async function getPostInsights(accessToken, postId) {
  const metrics = 'post_impressions,post_reach,post_engaged_users,post_reactions_by_type_total';

  const { data } = await axios.get(`${BASE_URL}/${postId}/insights`, {
    params: { metric: metrics, access_token: accessToken },
  });

  const result = {};
  data.data.forEach((m) => { result[m.name] = m.values?.[0]?.value || 0; });
  return result;
}

async function getUserPages(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/me/accounts`, {
    params: { access_token: accessToken, fields: 'id,name,category,fan_count,picture' },
  });
  return data.data;
}

async function getAccountInfo(accessToken) {
  const { data } = await axios.get(`${BASE_URL}/me`, {
    params: { access_token: accessToken, fields: 'id,name,picture,email' },
  });
  return data;
}

module.exports = { getPageInsights, getPagePosts, getPostInsights, getUserPages, getAccountInfo };
