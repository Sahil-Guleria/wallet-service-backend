const { logger } = require('../config/logger');

const requestTracker = (req, res, next) => {
  req.startTime = Date.now();
  req.traceId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  logger.info('Request received:', {
    traceId: req.traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    clientIp: req.ip,
  });

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info('Request completed:', {
      traceId: req.traceId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });
  });

  next();
};

module.exports = requestTracker;
