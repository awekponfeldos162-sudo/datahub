const axios = require('axios');

const BASE_URL = 'https://open.tiktokapis.com/v2';

async function getUserInfo(accessToken) {
  const { data } = await axios.post(
    `${BASE_URL}/user/info/`,
    { fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'follower_count', 'following_count', 'likes_count', 'video_count'] },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return data.data?.user;
}

async function getVideoList(accessToken, cursor = 0, maxCount = 20) {
  const { data } = await axios.post(
    `${BASE_URL}/video/list/`,
    {
      fields: ['id', 'title', 'create_time', 'cover_image_url', 'share_url', 'view_count', 'like_count', 'comment_count', 'share_count', 'duration'],
      cursor,
      max_count: maxCount,
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  return (data.data?.videos || []).map((v) => ({
    platformPostId: v.id,
    type: 'video',
    title: v.title || '',
    thumbnailUrl: v.cover_image_url,
    url: v.share_url,
    publishedAt: new Date(v.create_time * 1000),
    views: v.view_count || 0,
    likes: v.like_count || 0,
    comments: v.comment_count || 0,
    shares: v.share_count || 0,
    watchTimeSeconds: v.duration || 0,
  }));
}

async function getVideoQuery(accessToken, videoIds) {
  const { data } = await axios.post(
    `${BASE_URL}/video/query/`,
    {
      filters: { video_ids: videoIds },
      fields: ['id', 'view_count', 'like_count', 'comment_count', 'share_count'],
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return data.data?.videos || [];
}

module.exports = { getUserInfo, getVideoList, getVideoQuery };
