const Joi = require('joi');

const messages = {
  'string.empty': '{{#label}} is required',
  'number.base': '{{#label}} must be a number',
  'number.min': '{{#label}} must be greater than or equal to {{#limit}}',
  'number.max': '{{#label}} must be less than or equal to {{#limit}}',
  'number.precision': '{{#label}} must have no more than {{#limit}} decimal places',
  'string.guid': '{{#label}} must be a valid UUID',
  'any.required': '{{#label}} is required'
};

const setupWalletSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    ...messages,
    'string.min': 'Name must be at least {{#limit}} character long',
    'string.max': 'Name cannot exceed {{#limit}} characters'
  }),
  balance: Joi.number()
    .precision(4)
    .min(0)
    .max(999999999.9999)
    .required()
    .messages({
      ...messages,
      'number.max': 'Balance cannot exceed 999,999,999.9999'
    })
});

const transactionSchema = Joi.object({
  amount: Joi.number()
    .precision(4)
    .required()
    .custom((value, helpers) => {
      if (value === 0) {
        return helpers.error('number.zero');
      }
      if (Math.abs(value) > 999999999.9999) {
        return helpers.error('number.max');
      }
      if (isNaN(value) || !isFinite(value)) {
        return helpers.error('number.base');
      }
      const numValue = Number(value);
      if (numValue > 0 && numValue < 0.0001) {
        return helpers.error('number.min');
      }
      if (numValue < 0 && numValue > -0.0001) {
        return helpers.error('number.min');
      }
      return numValue;
    })
    .messages({
      ...messages,
      'number.zero': 'Transaction amount cannot be zero',
      'number.max': 'Transaction amount cannot exceed 999,999,999.9999',
      'number.base': 'Transaction amount must be a valid number',
      'number.min': 'Transaction amount must be at least 0.0001 or at most -0.0001',
      'number.precision': 'Transaction amount cannot have more than 4 decimal places'
    }),
  description: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      ...messages,
      'string.min': 'Description must be at least {{#limit}} character long',
      'string.max': 'Description cannot exceed {{#limit}} characters'
    })
});

const transactionParamsSchema = Joi.object({
  walletId: Joi.string().guid({ version: 'uuidv4' }).required().messages(messages)
});

const getWalletParamsSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required().messages(messages)
});

const getTransactionsQuerySchema = Joi.object({
  walletId: Joi.string().guid({ version: 'uuidv4' }).required().messages(messages),
  skip: Joi.number().min(0).default(0).messages(messages),
  limit: Joi.number().min(1).max(100).default(10).messages(messages),
  sortBy: Joi.string().valid('date', 'amount').default('date').messages(messages),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages(messages)
});

const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).messages({
    ...messages,
    'string.min': 'Username must be at least {{#limit}} characters long',
    'string.max': 'Username cannot be longer than {{#limit}} characters'
  }),
  password: Joi.string().required().min(6).messages({
    ...messages,
    'string.min': 'Password must be at least {{#limit}} characters long'
  })
});

const registerSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).messages({
    ...messages,
    'string.min': 'Username must be at least {{#limit}} characters long',
    'string.max': 'Username cannot be longer than {{#limit}} characters'
  }),
  password: Joi.string().required().min(6).max(100).messages({
    ...messages,
    'string.min': 'Password must be at least {{#limit}} characters long',
    'string.max': 'Password cannot be longer than {{#limit}} characters'
  }),
  role: Joi.string().valid('user', 'admin').default('user')
});

module.exports = {
  setupWalletSchema,
  transactionSchema,
  transactionParamsSchema,
  getWalletParamsSchema,
  getTransactionsQuerySchema,
  loginSchema,
  registerSchema
};
