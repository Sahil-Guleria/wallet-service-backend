const ApiError = require('../utils/ApiError');
const { logger } = require('../config/logger');

const formatValidationError = (error) => {
  return error.details.map((detail) => ({
    field: detail.path[0],
    message: detail.message
      .replace(/['"]/g, '')
      .replace(/^[a-zA-Z]+/, (match) => match.toLowerCase()),
  }));
};

const validate = (schema, property) => {
  return (req, res, next) => {
    logger.info('Validating request:', {
      path: req.path,
      method: req.method,
      body: req[property],
    });

    const { error } = schema.validate(req[property], {
      abortEarly: false,
      errors: {
        wrap: {
          label: '',
        },
      },
    });

    if (error) {
      const formattedError = formatValidationError(error);
      logger.warn('Validation failed:', {
        path: req.path,
        method: req.method,
        errors: formattedError,
      });
      return next(new ApiError(400, 'Validation Error', formattedError));
    }
    next();
  };
};

module.exports = validate;
