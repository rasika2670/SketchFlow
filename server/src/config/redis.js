const Redis = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let redis = null;
let isConnected = false;

/**
 * Initialize Redis client with graceful fallback.
 * If REDIS_URL is not set or connection fails, the API continues without Redis.
 */
function createRedisClient() {
  if (!config.redis.url) {
    logger.warn('⚠️  REDIS_URL not set — running without Redis (no caching, locks, or presence)');
    return null;
  }

  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) {
        logger.error('Redis: max retries reached, giving up');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
  });

  client.on('connect', () => {
    logger.info('✅ Redis connected');
    isConnected = true;
  });

  client.on('ready', () => {
    isConnected = true;
  });

  client.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
    isConnected = false;
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
    isConnected = false;
  });

  client.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return client;
}

/**
 * Connect to Redis. If connection fails, log warning and continue.
 */
async function connectRedis() {
  redis = createRedisClient();

  if (!redis) return;

  try {
    await redis.connect();
  } catch (err) {
    logger.warn('⚠️  Redis connection failed — continuing without Redis', {
      error: err.message,
    });
    redis = null;
    isConnected = false;
  }
}

/**
 * Check if Redis is currently available.
 * @returns {boolean}
 */
function isRedisAvailable() {
  return redis !== null && isConnected;
}

/**
 * Get the Redis client instance.
 * @returns {Redis|null}
 */
function getRedis() {
  return redis;
}

/**
 * Gracefully disconnect Redis.
 */
async function disconnectRedis() {
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis disconnected gracefully');
    } catch (err) {
      logger.warn('Redis disconnect error', { error: err.message });
    }
  }
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedis,
  isRedisAvailable,
};
