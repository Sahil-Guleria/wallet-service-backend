const express = require('express');
const { expressjwt: jwt } = require('express-jwt');
const { JWT_SECRET } = require('./config/jwt');
const swaggerUi = require('swagger-ui-express');
const compression = require('compression');
const swaggerDocument = require('./swagger.json');
const { logger } = require('./config/logger');
const { sequelize } = require('./models');
const walletRoutes = require('./routes/wallet.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/error.handler');

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000', 'https://wallet-service-frontend.onrender.com'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use(
  jwt({ 
    secret: JWT_SECRET,
    algorithms: ['HS256']
  }).unless({ 
    path: [
      '/auth/login',
      '/auth/register',
      '/api-docs',
      { url: /^\/api-docs\/.*/, methods: ['GET'] }
    ]
  })
);

app.use('/wallet', walletRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    const { Umzug, SequelizeStorage } = require('umzug');
    const path = require('path');

    const umzug = new Umzug({
      migrations: { glob: 'src/db/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    logger.info('Running migrations...');
    await umzug.up();
    logger.info('Migrations completed successfully');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      }
    });
  } catch (error) {
    logger.error('Unable to start server:', { 
      error: error.message,
      stack: error.stack
    });
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('Critical error in production - attempting to continue');
      app.listen(PORT, () => {
        logger.info(`Server started on port ${PORT} despite database issues`);
      });
    } else {
      process.exit(1);
    }
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    error: error.message,
    stack: error.stack
  });
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', { 
    error: error.message,
    stack: error.stack
  });
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

startServer();