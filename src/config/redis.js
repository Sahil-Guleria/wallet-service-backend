const { createClient } = require('redis');
const { logger } = require('./logger');

const createRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 20000,
      keepAlive: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 20) {
          logger.error('Redis max retries reached. Stopping reconnection.');
          return new Error('Redis max retries reached');
        }
        return Math.min(retries * 500, 5000);
      }
    },
    tls: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      requestCert: true
    } : undefined
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', { error: err.message, stack: err.stack });
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Redis error in development - continuing without Redis');
    }
  });

  client.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  client.on('reconnecting', () => {
    logger.info('Redis Client Reconnecting');
  });

  return client;
};

const connectRedis = async () => {
  const client = createRedisClient();
  
  try {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not provided, using default localhost');
    }
    
    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis Connection Error:', { 
      error: error.message, 
      stack: error.stack 
    });
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('Redis connection failed in production - retrying in background');
      // In production, we'll keep retrying in the background
      setInterval(async () => {
        try {
          if (!client.isOpen) {
            await client.connect();
          }
        } catch (e) {
          logger.error('Redis reconnection attempt failed:', { 
            error: e.message 
          });
        }
      }, 10000);
    }
    
    return client;
  }
};

module.exports = connectRedis();