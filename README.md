# Wallet Service Backend

A robust wallet service that handles transactions, user authentication, and balance management with features like idempotency, rate limiting, and caching.

## Features

- 🔐 JWT Authentication
- 💰 Wallet Management
- 📊 Transaction Processing
- 📄 PDF Statement Generation
- 🚀 Redis Caching
- 🔄 Idempotency Support
- ⚡ Rate Limiting
- 📝 Swagger Documentation

### Base URL Configuration
- Development: `http://localhost:3001`
- Production: `https://wallet-service-backend-f1j0.onrender.com`

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

### Wallet Operations

#### Create Wallet
```http
POST /wallet/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Wallet",
  "balance": 1000
}
```

#### Get All Wallets
```http
GET /wallet/wallets
Authorization: Bearer <token>
```

#### Get Wallet Details
```http
GET /wallet/wallet/:id
Authorization: Bearer <token>
```

#### Process Transaction
```http
POST /wallet/transact/:walletId
Authorization: Bearer <token>
Idempotency-Key: unique-key-123
Content-Type: application/json

{
  "amount": 100,        // Positive for credit, negative for debit
  "description": "Payment for services"
}
```

#### Get Transaction History
```http
GET /wallet/transactions/:walletId?page=1&limit=10
Authorization: Bearer <token>
```

#### Download Statement
```http
GET /wallet/transactions/pdf/:walletId
Authorization: Bearer <token>
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- Docker (optional)

### Environment Variables
Create a `.env` file:
```env
# Database
DATABASE_URL=postgres://username:password@localhost:5432/wallet_service

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Server
PORT=3001
NODE_ENV=development

# Firebase (optional)
FIREBASE_SERVICE_ACCOUNT_BASE64=your-base64-encoded-credentials
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sahil-Guleria/wallet-service-backend
   cd wallet-service-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Docker Setup

1. Build and run using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the API at http://localhost:3001

## Database Design

### Tables

1. **users**
   - id (UUID, PK)
   - username (VARCHAR, UNIQUE)
   - email (VARCHAR, UNIQUE)
   - password (VARCHAR)
   - isActive (BOOLEAN)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **wallets**
   - id (UUID, PK)
   - userId (UUID, FK)
   - name (VARCHAR)
   - balance (DECIMAL(20,4))
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. **transactions**
   - id (UUID, PK)
   - wallet_id (UUID, FK)
   - amount (DECIMAL(20,4))
   - type (ENUM: 'CREDIT'/'DEBIT')
   - description (TEXT)
   - balance (DECIMAL(20,4))
   - created_at (TIMESTAMP)

### Key Design Decisions

1. **Transaction Handling**
   - SERIALIZABLE isolation level
   - Row-level locking
   - Atomic updates
   - Balance consistency checks

2. **Performance Optimizations**
   - Redis caching for wallets and transactions
   - Pagination for transaction history
   - Proper indexing on frequently queried columns

3. **Security Measures**
   - Password hashing with bcrypt
   - JWT authentication
   - Rate limiting
   - Input validation
   - Idempotency for safe retries

## Testing

Run the test suite:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## API Documentation

Access Swagger documentation at:
```
http://localhost:3001/api-docs
```

## Error Handling

The service uses standardized error responses:
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## Monitoring

- Firebase Crashlytics for error tracking
- Winston logger for structured logging
- Performance metrics tracking
- Request tracing with unique IDs

## Production Deployment

The service is deployed on Render.com with:
- Automatic deployments from GitHub
- PostgreSQL and Redis add-ons
- Environment variable configuration
- Health check endpoints
- Automatic SSL/TLS