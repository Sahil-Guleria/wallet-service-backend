const admin = require('firebase-admin');
const { logger } = require('./logger');

function getServiceAccount() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required');
  }

  try {
    const decodedJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString();
    return JSON.parse(decodedJson);
  } catch (error) {
    logger.error('Failed to parse Firebase service account:', error);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 format');
  }
}

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccount = getServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info('Firebase initialized successfully');
  } catch (error) {
    logger.error('Firebase initialization failed:', error);
    // Don't throw, allow app to continue without Crashlytics
  }
}

module.exports = {
  recordError: async (error, context = {}) => {
    if (!firebaseInitialized) {
      try {
        initializeFirebase();
      } catch (e) {
        logger.error('Failed to initialize Firebase for error recording:', e);
        return;
      }
    }

    try {
      await admin.crashlytics().record(() => {
        throw {
          ...error,
          timestamp: Date.now(),
          environment: process.env.NODE_ENV,
          ...context,
        };
      });
    } catch (e) {
      logger.error('Failed to record error to Crashlytics:', e);
    }
  },
};
