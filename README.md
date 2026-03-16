# WyaparPay - Mobile Business App

A comprehensive mobile business application built with React Native frontend and NestJS backend, featuring wallet management, bill payments, recharge services, and transaction history.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- React Native development environment

### One-Command Setup
```bash
# Start everything with one script
./start-dev.sh

# Or start specific components
./start-dev.sh backend    # Backend only
./start-dev.sh frontend   # Frontend only

# Stop all services
./stop-dev.sh
```

### Manual Setup (Alternative)
```bash
# Backend
cd backend
npm install
cp env.example .env
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm install
# For iOS
cd ios && pod install && cd ..
npm run ios
# For Android
npm run android
```

📚 **For detailed development instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

🏗️ **Database Architecture: [CRM-Backend Implementation](./docs/CRM_BACKEND_IMPLEMENTATION.md)**

## 🔐 Default Login Credentials (For Testing)

### Password Login:
- **Phone**: `1234567899`
- **Password**: `admin`
- **Email**: `admin@wyaparpay.com`
- **Password**: `admin`

### OTP Login:
- **Any Phone/Email**: Enter any identifier
- **OTP**: `123456` (for testing)

### Docker Setup (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

All detailed documentation is available in the [`docs/`](./docs/) folder:

- **[Project Overview](./docs/README.md)** - Complete project documentation with features, architecture, and setup instructions
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Comprehensive database schema documentation
- **[Enhanced Schema Review](./docs/ENHANCED_SCHEMA_REVIEW.md)** - Review and recommendations for database improvements

## 🏗️ Project Structure

```
WyaparPay/
├── backend/                 # NestJS backend API
├── frontend/
│   └── WyaparPayExpo/      # Expo React Native frontend
├── assets/                  # Brand assets, images, icons, logos
│   ├── images/             # UI images, screenshots, placeholders
│   ├── icons/              # UI, business, and social icons
│   ├── logos/              # Logo variations and formats
│   └── branding/           # Brand guidelines, colors, fonts
├── infra/                  # Infrastructure configurations
├── docs/                   # Documentation
│   ├── README.md          # Complete project documentation
│   ├── DATABASE_SCHEMA.md # Database schema details
│   └── ENHANCED_SCHEMA_REVIEW.md # Schema review & recommendations
├── docker-compose.yml     # Docker services configuration
└── README.md              # This file
```

## 🎯 Current Status

- **Backend**: 90% complete with robust authentication, user management, and wallet systems
- **Frontend**: 70% complete with core screens functional
- **Database**: 100% complete with comprehensive schema
- **Infrastructure**: Production-ready with Docker containerization

## 📱 Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Multi-wallet system with double-entry ledger
- ✅ KYC document verification system
- ✅ Bill payment and mobile recharge (UI ready)
- ✅ Transaction history and analytics
- ✅ Docker containerization
- ✅ Redis caching and session management

## 🔧 Development

### Backend API
- Swagger UI: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/v1/health

### Environment Variables
Copy `backend/env.example` to `backend/.env` and configure:
- Database connection
- Redis configuration
- JWT secrets
- Payment gateway keys
- SMS/Email providers

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

---

**📖 For detailed documentation, please visit the [`docs/`](./docs/) folder.**
