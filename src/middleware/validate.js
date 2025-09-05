const ApiError = require('../utils/ApiError');

const formatValidationError = (error) => {
  return error.details.map(detail => ({
    field: detail.path[0],
    message: detail.message
      .replace(/['"]/g, '')
      .replace(/^[a-zA-Z]+/, match => match.toLowerCase())
  }));
};

const validate = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      errors: {
        wrap: {
          label: ''
        }
      }
    });

    if (error) {
      const formattedError = formatValidationError(error);
      return next(new ApiError(400, 'Validation Error', formattedError));
    }
    next();
  };
};

module.exports = validate;