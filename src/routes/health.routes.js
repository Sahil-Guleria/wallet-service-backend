const express = require('express');
const router = express.Router();
const { logger } = require('../config/logger');

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Service is healthy' });
});

// Test route for Firebase Crashlytics
router.get('/test-error', async (req, res, next) => {
  try {
    logger.info('Testing Firebase Crashlytics integration');

    // Simulate an error
    throw new Error('Test error for Firebase Crashlytics');
  } catch (error) {
    // This will be caught by our error handler middleware which will send it to Crashlytics
    next(error);
  }
});

module.exports = router;
