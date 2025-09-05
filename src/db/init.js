const { sequelize } = require('../models');
const { logger } = require('../config/logger');

async function initDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    logger.info('Connection to database has been established successfully.');

    // Sync all models
    await sequelize.sync({ force: true });
    logger.info('Database synchronized successfully');

    process.exit(0);
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

initDatabase();
