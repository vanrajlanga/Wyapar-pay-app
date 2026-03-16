# WyaparPay - Mobile Business App

A comprehensive mobile business application built with React Native frontend and NestJS backend, featuring wallet management, bill payments, recharge services, and transaction history.

## 🏗️ Architecture

### Layer-by-Layer Breakdown

1. **Frontend (React Native App)** 🔄 **70% Complete**
   - ✅ Navigation: Drawer, Stack, Tab navigation implemented
   - ✅ Screens: Wallet, Bills, Transaction History (functional)
   - ✅ Components: LoadingSpinner, WalletCard, QuickActionButton
   - ✅ Context: AuthContext, ThemeContext with hooks
   - 🔄 Auth Screens: Login, Register, KYC (placeholder screens)
   - 🔄 Settings Screens: All settings screens show "Coming Soon"
   - ✅ Local storage: Secure tokens (AsyncStorage/Keychain)
   - ✅ State management: Zustand for global state

2. **Backend (NestJS)** ✅ **90% Complete**
   - ✅ Framework: NestJS with TypeScript
   - ✅ Modules implemented:
     - ✅ Auth Service → JWT, OTP, MFA, session handling
     - ✅ User Service → Profile, KYC, document management
     - ✅ Wallet Service → Multi-wallet, double-entry ledger
     - 🔄 Payments Service → Razorpay integration (configured)
     - 🔄 Notification Service → SMS/Email (Twilio/AWS SES configured)

3. **Database (MySQL)** ✅ **100% Complete**
   - ✅ InnoDB for ACID compliance
   - ✅ 8 Tables: users, wallets, wallet_ledger, transactions, billers, user_sessions, user_documents, kyc_verifications
   - ✅ Proper indexing and foreign key relationships
   - ✅ Enum types for status management

4. **Caching (Redis)** ✅ **100% Complete**
   - ✅ OTP storage with expiration
   - ✅ Session data caching
   - ✅ Rate limiting implementation

5. **Infrastructure** ✅ **100% Complete**
   - ✅ Docker containerization
   - ✅ Nginx reverse proxy
   - ✅ Environment configuration
   - 🔄 Queue system (BullMQ) - configured but not fully implemented

6. **3rd Party Integrations** 🔄 **60% Complete**
   - ✅ Payment Gateway: Razorpay (configured)
   - 🔄 BBPS APIs: Configuration ready
   - ✅ SMS/Email Providers: Twilio, AWS SES (configured)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Redis 6.0+
- React Native development environment
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
# For iOS
cd ios && pod install && cd ..
npm run ios
# For Android
npm run android
```

### Docker Setup (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📱 Features

### Authentication & Security
- ✅ JWT-based authentication with refresh tokens
- ✅ OTP verification (SMS/Email) with Redis caching
- ✅ Multi-factor authentication
- ✅ Session management with device tracking
- ✅ Rate limiting with throttling
- ✅ Secure password policies with bcrypt
- ✅ Account lockout after failed attempts
- ✅ Password reset functionality

### Wallet Management
- ✅ Multiple wallet types (Primary, Savings, Business)
- ✅ Double-entry ledger system with audit trail
- ✅ Real-time balance tracking
- ✅ Transaction limits (Daily/Monthly)
- ✅ Money transfer between wallets
- ✅ Wallet locking/unlocking functionality

### Payment Services
- 🔄 UPI integration (Backend ready, Frontend pending)
- 🔄 Bill payment (Electricity, Gas, Water, Mobile, DTH) - UI ready
- 🔄 Mobile recharge (UI ready, Backend integration pending)
- 🔄 Payment gateway integration (Razorpay configured)
- ✅ Transaction history with comprehensive tracking

### User Management
- ✅ User registration & profile management
- ✅ KYC document verification system
- ✅ Document upload and validation
- ✅ Preferences management
- ✅ Security settings
- ✅ Profile statistics and analytics

### Database & Infrastructure
- ✅ Complete database schema with 8 entities
- ✅ MySQL 8.0 with proper indexing
- ✅ Redis caching for sessions and OTPs
- ✅ Docker containerization
- ✅ Nginx reverse proxy configuration

## 🛠️ Development

### Backend API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/v1/health

### Database Schema

**Implemented Entities:**
- `users` - Complete user profiles with KYC data, preferences, and security settings
- `wallets` - Wallet information with multiple types and balance tracking
- `wallet_ledger` - Double-entry transaction ledger with comprehensive audit trail
- `transactions` - Payment transactions with gateway integration support
- `billers` - Bill payment providers with category and validation rules
- `user_sessions` - Active user sessions with device tracking
- `user_documents` - Document upload and verification system
- `kyc_verifications` - KYC verification status and document validation

**Database Features:**
- Proper indexing for performance optimization
- Foreign key relationships with cascade operations
- Enum types for status management
- JSON fields for flexible metadata storage
- Audit timestamps (createdAt, updatedAt)

### Environment Variables

Backend (.env):
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=wyapar_pay

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# SMS/Email
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

## 🔧 Configuration

### Payment Gateway Setup

1. **Razorpay Integration**
   - Sign up at [Razorpay](https://razorpay.com)
   - Get API keys from dashboard
   - Update environment variables

2. **BBPS Integration**
   - Register with BBPS provider
   - Configure API endpoints
   - Set up webhook handlers

### SMS/Email Setup

1. **Twilio SMS**
   - Create Twilio account
   - Get Account SID and Auth Token
   - Purchase phone number

2. **AWS SES Email**
   - Set up AWS SES
   - Verify email addresses
   - Configure SMTP settings

## 📊 Monitoring & Logging

### Health Checks
- Backend: `GET /api/v1/health`
- Database connection status
- Redis connection status
- External service status

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance metrics

## 🚀 Deployment

### Production Deployment

1. **Backend Deployment**
   ```bash
   # Build production image
   docker build -t wyapar-pay-backend ./backend
   
   # Deploy with docker-compose
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Frontend Deployment**
   ```bash
   # Android
   cd frontend/android
   ./gradlew assembleRelease
   
   # iOS
   cd frontend/ios
   xcodebuild -workspace WyaparPay.xcworkspace -scheme WyaparPay -configuration Release
   ```

### Infrastructure Requirements

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Database**: MySQL 8.0+ with InnoDB
- **Cache**: Redis 6.0+
- **Load Balancer**: Nginx or AWS ALB

## 🔒 Security Considerations

- All API endpoints use HTTPS
- JWT tokens with short expiration
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure session management

## 📝 API Endpoints

### Authentication (✅ Implemented)
- `POST /api/v1/auth/register` - User registration with validation
- `POST /api/v1/auth/login` - User login with rate limiting
- `POST /api/v1/auth/verify-otp` - OTP verification with Redis caching
- `POST /api/v1/auth/refresh-token` - JWT token refresh
- `POST /api/v1/auth/logout` - User logout with session cleanup
- `POST /api/v1/auth/forgot-password` - Password reset initiation
- `POST /api/v1/auth/reset-password` - Password reset completion
- `POST /api/v1/auth/change-password` - Password change

### User Management (✅ Implemented)
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile
- `GET /api/v1/user/kyc` - Get KYC status
- `POST /api/v1/user/kyc` - Submit KYC documents
- `POST /api/v1/user/documents` - Upload documents
- `GET /api/v1/user/documents` - Get uploaded documents
- `PUT /api/v1/user/preferences` - Update user preferences

### Wallet (✅ Implemented)
- `GET /api/v1/wallet` - Get user wallets
- `POST /api/v1/wallet` - Create new wallet
- `GET /api/v1/wallet/:id/ledger` - Get transaction history
- `POST /api/v1/wallet/:id/transfer` - Transfer money between wallets
- `POST /api/v1/wallet/:id/lock` - Lock/unlock wallet
- `GET /api/v1/wallet/:id/balance` - Get wallet balance

### Payments (🔄 In Progress)
- `POST /api/v1/payments/recharge` - Mobile recharge (Backend ready)
- `POST /api/v1/payments/bill` - Bill payment (Backend ready)
- `GET /api/v1/payments/status/:id` - Payment status
- `GET /api/v1/payments/history` - Payment history

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@wyaparpay.com or join our Slack channel.

## 🔄 Current Progress & Roadmap

### ✅ Completed Features
- **Backend Infrastructure**: Complete NestJS setup with TypeORM, Redis, JWT authentication
- **Database Schema**: 8 entities with proper relationships and indexing
- **Authentication System**: JWT with refresh tokens, OTP verification, session management
- **User Management**: Profile management, KYC system, document upload
- **Wallet System**: Multi-wallet support, double-entry ledger, transfer functionality
- **Security**: Rate limiting, password policies, account lockout protection
- **Docker Setup**: Complete containerization with MySQL, Redis, Nginx

### 🔄 In Progress
- **Payment Integration**: Razorpay gateway setup, UPI integration
- **Frontend Screens**: Some screens show "Coming Soon" placeholder
- **Bill Payment**: UI ready, backend integration pending
- **Mobile Recharge**: UI ready, backend integration pending

### 📋 Next Steps
- [ ] Complete payment gateway integration (Razorpay, UPI)
- [ ] Implement bill payment backend services
- [ ] Complete mobile recharge functionality
- [ ] Add biometric authentication
- [ ] Implement QR code payments
- [ ] Add investment features
- [ ] Credit scoring system
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Offline transaction support