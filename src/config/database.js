require('dotenv').config();

const config = {
  development: {
    username: 'postgres',
    password: '1234',
    database: 'wallet_service',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
    },
    dialectOptions: {
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 10000
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
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 50,
      min: 10,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    dialectOptions: {
      statement_timeout: 15000,
      idle_in_transaction_session_timeout: 15000,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

module.exports = config;