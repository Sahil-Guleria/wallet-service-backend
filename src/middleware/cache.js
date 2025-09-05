const redisClient = require('../config/redis');
const { logger } = require('../config/logger');

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not connected
    if (!redisClient.isReady) {
      return next();
    }

    try {
      const key = `cache:${req.originalUrl}`;
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store the original json method
      const originalJson = res.json;

      // Override json method
      res.json = async function(body) {
        // Restore original json method
        res.json = originalJson;

        try {
          // Cache the response
          await redisClient.setEx(key, duration, JSON.stringify(body));
        } catch (error) {
          logger.error('Redis Cache Set Error:', error);
        }

        // Send the response
        return res.json(body);
      };

      next();
    } catch (error) {
      logger.error('Redis Cache Middleware Error:', error);
      next();
    }
  };
};

// Function to invalidate cache for a wallet
const invalidateWalletCache = async (walletId) => {
  if (!redisClient.isReady) {
    return;
  }

  try {
    // Get all keys matching the pattern
    const keys = await redisClient.keys(`cache:*${walletId}*`);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(keys);
      logger.info(`Invalidated cache for wallet: ${walletId}`);
    }
  } catch (error) {
    logger.error('Redis Cache Invalidation Error:', error);
  }
};

// Function to clear all cache
const clearAllCache = async () => {
  if (!redisClient.isReady) {
    return;
  }

  try {
    await redisClient.flushDb();
    logger.info('Cleared all cache');
  } catch (error) {
    logger.error('Redis Cache Clear Error:', error);
  }
};

// Cache specific wallet data
const cacheWalletData = async (walletId, data, duration = 300) => {
  if (!redisClient.isReady) {
    return;
  }

  try {
    const key = `cache:wallet:${walletId}`;
    await redisClient.setEx(key, duration, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis Cache Set Error:', error);
  }
};

// Get cached wallet data
const getCachedWalletData = async (walletId) => {
  if (!redisClient.isReady) {
    return null;
  }

  try {
    const key = `cache:wallet:${walletId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis Cache Get Error:', error);
    return null;
  }
};

module.exports = {
  cacheMiddleware,
  invalidateWalletCache,
  clearAllCache,
  cacheWalletData,
  getCachedWalletData
};