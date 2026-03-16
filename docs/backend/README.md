# 🔧 Backend Documentation

This folder contains all documentation related to the WyaparPay backend (NestJS).

## 📋 Current Documentation

### 🚀 Getting Started
- **Local Development Guide** - Complete setup and development workflow
- **API Documentation** - REST API endpoints and usage
- **Environment Setup** - Configuration and environment variables

### 🏗️ Architecture
- **System Architecture** - Overall system design
- **Module Structure** - NestJS module organization
- **Database Integration** - TypeORM configuration and usage
- **Authentication** - JWT and session management

### 🔌 API Reference
- **Authentication APIs** - Login, register, OTP, password reset
- **User Management APIs** - Profile, KYC, document management
- **Wallet APIs** - Wallet operations, transactions, ledger
- **Payment APIs** - Bill payments, recharges, transfers

### 🗄️ Database
- **Entity Models** - TypeORM entity definitions
- **Database Schema** - Complete database structure
- **Migrations** - Database migration scripts
- **Seeding** - Default data population

### 🔒 Security
- **Authentication Flow** - JWT token management
- **Authorization** - Role-based access control
- **Data Validation** - Input validation and sanitization
- **Rate Limiting** - API rate limiting implementation

### 🧪 Testing
- **Unit Tests** - Service and controller testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Complete workflow testing
- **Performance Tests** - Load and stress testing

### 🚀 Deployment
- **Docker Setup** - Containerization configuration
- **Production Deployment** - Server deployment guide
- **Environment Configuration** - Production environment setup
- **Monitoring** - Logging and monitoring setup

## 🔧 Technical Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: MySQL 8.0 with TypeORM
- **Cache**: Redis 7.x
- **Queue**: BullMQ for background jobs
- **Authentication**: JWT with Passport
- **Validation**: Class Validator + Class Transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 📁 File Structure

```
backend/
├── src/
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication module
│   │   ├── user/          # User management module
│   │   └── wallet/        # Wallet module
│   ├── entities/          # TypeORM entities
│   ├── common/            # Shared utilities
│   ├── config/            # Configuration files
│   └── main.ts            # Application entry point
├── test/                  # Test files
├── docs/                  # Backend documentation
└── Dockerfile             # Docker configuration
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run start:dev
   ```

4. **Access API**
   - API Base: `http://localhost:3000`
   - Swagger Docs: `http://localhost:3000/api`

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-otp` - OTP verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### User Management
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `POST /user/kyc` - Submit KYC documents
- `GET /user/kyc/status` - Check KYC status

### Wallet Operations
- `GET /wallet/balance` - Get wallet balance
- `POST /wallet/transfer` - Transfer funds
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/ledger` - Create ledger entry

## 🔧 Development Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run with coverage

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [JWT Authentication](https://jwt.io/)
- [Redis Documentation](https://redis.io/docs/)

---

*This documentation will be updated as the backend development progresses.*
