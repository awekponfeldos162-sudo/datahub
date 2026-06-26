const Redis = require('ioredis');
const { logger } = require('../utils/logger');

let redisClient;

let redisAvailable = true;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 3) { redisAvailable = false; return null; }
        return Math.min(times * 200, 1000);
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', () => { redisAvailable = false; });
    redisClient.on('connect', () => { redisAvailable = true; logger.info('Redis connecté'); });
  }
  return redisClient;
}

async function connectRedis() {
  const client = getRedisClient();
  await client.connect();
  await client.ping();
  return client;
}

async function cacheGet(key) {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* cache indisponible, on continue */ }
}

async function cacheDel(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch { /* ignore */ }
}

async function cacheDelPattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch { /* ignore */ }
}

module.exports = { getRedisClient, connectRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
