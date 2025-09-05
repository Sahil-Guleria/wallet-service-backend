const redis = require('../config/redis');
const { logger } = require('../config/logger');

const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
const IDEMPOTENCY_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

const idempotencyMiddleware = async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key header is required' });
    }

    // Combine idempotency key with user ID for better isolation
    const userId = req.user.id;
    const fullKey = `${IDEMPOTENCY_KEY_PREFIX}${userId}:${idempotencyKey}`;

    // Check if we have a cached response
    let cachedResponse;
    try {
      cachedResponse = await redis.get(fullKey);
    } catch (error) {
      logger.error('Redis get error:', error);
      // Continue without cache on Redis error
    }
    
    if (cachedResponse) {
      logger.info(`Returning cached response for idempotency key: ${idempotencyKey}`);
      return res.json(JSON.parse(cachedResponse));
    }

    // Store the original json method
    const originalJson = res.json;

    // Override the json method to cache the response
    res.json = async function(body) {
      try {
        await redis.setEx(fullKey, IDEMPOTENCY_EXPIRY, JSON.stringify(body));
        logger.info('Cached response for idempotency key:', { key: idempotencyKey });
      } catch (err) {
        logger.error('Error caching idempotent response:', err);
        // Continue without cache on Redis error
      }
      
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error('Error in idempotency middleware:', error);
    next(error);
  }
};

module.exports = idempotencyMiddleware;
