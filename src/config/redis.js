const { createClient } = require('redis');
const { logger } = require('./logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max retries reached. Stopping reconnection.');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  },
  tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis Client Reconnecting');
});

const connectRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not provided, using default localhost');
    }
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis Connection Error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

connectRedis();

module.exports = redisClient;