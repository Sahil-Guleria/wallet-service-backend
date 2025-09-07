const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../config/logger');
const { generateToken } = require('../config/jwt');

const formatValidationError = (error) => {
  return error.details.map((detail) => ({
    field: detail.context.key,
    message: detail.message.replace(/['"]/g, ''),
  }));
};

const authController = {
  register: async (req, res, next) => {
    try {
      const { username, password, email } = req.body;

      const [existingUsername, existingEmail] = await Promise.all([
        User.findOne({ where: { username } }),
        User.findOne({ where: { email } }),
      ]);

      if (existingUsername || existingEmail) {
        logger.warn('Registration duplicate check failed:', {
          existingUsername: !!existingUsername,
          existingEmail: !!existingEmail,
          requestUsername: username,
          requestEmail: email,
        });

        const errors = [];
        if (existingUsername) {
          errors.push({
            field: 'username',
            message: 'This username is already taken',
          });
        }
        if (existingEmail) {
          errors.push({
            field: 'email',
            message: 'This email is already registered',
          });
        }

        throw new ApiError(409, 'Account already exists', errors);
      }

      logger.info('Attempting to create user:', {
        username,
        email,
        hasPassword: !!password,
      });

      const user = await User.create({
        username,
        password,
        email,
        isActive: true,
      });

      const token = generateToken(user);

      res.status(201).json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        username: req.body.username,
        email: req.body.email,
      });

      if (error.name === 'ValidationError') {
        return next(new ApiError(400, 'Validation Error', formatValidationError(error)));
      }

      if (
        error.name === 'SequelizeValidationError' ||
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        return next(
          new ApiError(
            400,
            'Validation Error',
            error.errors.map((err) => ({
              field: err.path,
              message: err.message,
            }))
          )
        );
      }

      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({
        where: {
          username,
          isActive: true,
        },
      });

      if (!user || !(await user.validatePassword(password))) {
        logger.error('Login failed:', { username, exists: !!user });
        throw new ApiError(401, 'Authentication failed', [
          {
            field: 'credentials',
            message: 'Invalid username or password',
          },
        ]);
      }

      const token = generateToken(user);
      logger.info('Login successful:', { username, userId: user.id });

      res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return next(new ApiError(400, 'Validation Error', formatValidationError(error)));
      }
      next(error);
    }
  },
};

module.exports = authController;
