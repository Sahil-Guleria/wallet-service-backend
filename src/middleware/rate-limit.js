const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Rate Limit Exceeded', message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const limiter = {
  setupWallet: createRateLimiter(
    15 * 60 * 1000,
    5,
    'Too many wallet creation attempts. Please try again in 15 minutes.'
  ),

  transaction: createRateLimiter(
    60 * 1000,
    30,
    'Too many transaction attempts. Please try again in 1 minute.'
  ),

  read: createRateLimiter(
    60 * 1000,
    100,
    'Too many read attempts. Please try again in 1 minute.'
  )
};

module.exports = limiter;
