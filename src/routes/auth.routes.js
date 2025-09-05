const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const Joi = require('joi');
const { logger } = require('../config/logger');

const router = express.Router();

const messages = {
  'string.empty': '{#label} is required',
  'string.min': '{#label} must be at least {#limit} characters long',
  'string.max': '{#label} cannot exceed {#limit} characters',
  'string.email': 'Please enter a valid email address',
  'any.required': '{#label} is required'
};

const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      ...messages,
      'string.min': 'Username must be at least {#limit} characters long',
      'string.max': 'Username cannot exceed {#limit} characters'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .messages({
      ...messages,
      'string.min': 'Password must be at least {#limit} characters long',
      'string.max': 'Password cannot exceed {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages(messages)
});

const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      ...messages,
      'string.empty': 'Please enter your username'
    }),
  password: Joi.string()
    .required()
    .messages({
      ...messages,
      'string.empty': 'Please enter your password'
    })
});

// Debug middleware for auth routes
router.use((req, res, next) => {
  logger.info('Auth request received:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: {
      origin: req.headers.origin,
      'content-type': req.headers['content-type'],
      'idempotency-key': req.headers['idempotency-key']
    }
  });
  next();
});

router.post('/register',
  validate(registerSchema, 'body'),
  authController.register
);

router.post('/login',
  validate(loginSchema, 'body'),
  authController.login
);

module.exports = router;