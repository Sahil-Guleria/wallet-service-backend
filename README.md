# waller-service-backend

A wallet service backend built with Node.js, Express, PostgreSQL, and Redis.

## Features
- Wallet management with transaction support
- JWT authentication
- PDF statement generation
- Rate limiting and idempotency
- Docker support

## Environment Variables
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://postgres:postgres@db:5432/wallet_service
REDIS_URL=redis://redis:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h
```

## Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```
