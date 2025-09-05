require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: '1234',
    database: 'wallet_service',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,         // Maximum number of connection in pool
      min: 5,          // Minimum number of connection in pool
      acquire: 30000,  // Maximum time, in milliseconds, that pool will try to get connection before throwing error
      idle: 10000,     // Maximum time, in milliseconds, that a connection can be idle before being released
      evict: 1000,     // Time to check for idle connections to evict
    },
    dialectOptions: {
      statement_timeout: 10000,     // Timeout for queries (10s)
      idle_in_transaction_session_timeout: 10000  // Timeout for idle transactions (10s)
    }
  },
  test: {
    username: 'postgres',
    password: '1234',
    database: 'wallet_service_test',
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 50,         // More connections for production
      min: 10,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    dialectOptions: {
      statement_timeout: 15000,     // Slightly longer timeout for production
      idle_in_transaction_session_timeout: 15000,
      ssl: {
        require: true,
        rejectUnauthorized: false   // For Heroku/AWS style SSL
      }
    }
  }
};