const { logger } = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    details: err.details,
    name: err.name
  });

  // Handle business logic errors (like insufficient balance)
  if (err.message && err.message.includes('Insufficient balance')) {
    return res.status(400).json({
      status: 'fail',
      error: 'Transaction Failed',
      details: [{
        field: 'amount',
        message: err.message
      }]
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'fail',
      error: err.message,
      details: err.details
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'fail',
      error: 'Validation Error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'fail',
      error: 'Duplicate Entry',
      details: err.errors.map(e => ({
        field: e.path,
        message: `This ${e.path} is already taken`
      }))
    });
  }

  // Handle JWT errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'fail',
      error: 'Authentication Error',
      details: [{
        field: 'token',
        message: 'Invalid or expired token'
      }]
    });
  }

  // Handle decimal precision errors
  if (err.message && err.message.includes('decimal')) {
    return res.status(400).json({
      status: 'fail',
      error: 'Validation Error',
      details: [{
        field: 'amount',
        message: 'Amount cannot have more than 4 decimal places'
      }]
    });
  }

  // Default error
  const errorMessage = err.message || 'Internal Server Error';
  const errorDetails = process.env.NODE_ENV === 'development' 
    ? {
        message: errorMessage,
        stack: err.stack,
        name: err.name,
        ...(err.details && { details: err.details })
      }
    : [{
        field: 'general',
        message: errorMessage
      }];

  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
    details: errorDetails
  });
};

module.exports = errorHandler;