const { logger } = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { recordError } = require('../config/firebase');

module.exports = async (err, req, res, _next) => {
  const startTime = req.startTime || Date.now();
  const duration = Date.now() - startTime;

  let error = {
    status: err.status || (err.statusCode >= 500 ? 'error' : 'fail'),
    message: err.message,
    duration: `${duration}ms`,
    path: req.path,
    method: req.method,
    traceId: req.traceId,
  };

  // Log the full error details
  logger.error('Error details:', {
    error: err,
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
    path: req.path,
    method: req.method,
    traceId: req.traceId,
    body: req.body,
  });

  if (err instanceof ApiError) {
    error.errors = err.errors;
  }

  logger.error('Error occurred:', { error, stack: err.stack });

  // Record to Crashlytics if it's a server error
  if (err.status === 'error' || err.statusCode >= 500) {
    await recordError(err, {
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      traceId: req.traceId,
    });
  }

  res.status(err.statusCode || 500).json(error);
};
