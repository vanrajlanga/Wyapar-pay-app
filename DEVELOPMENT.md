# 🚀 WyaparPay Development Guide

Complete guide for starting and managing the WyaparPay development environment with **CRM-backend approach** - manual schema creation with TypeORM for queries only.

## 📋 Prerequisites

- **Node.js** v18+ and **npm**
- **MySQL** running locally (v8.0+)
- **Expo CLI** (for mobile development)
- **NestJS CLI** (installed automatically by script)

## 🏗️ **Database Architecture (CRM-Backend Approach)**

This project uses the **CRM-backend pattern** for database management:

- ✅ **Manual Schema Creation**: SQL scripts create/update database structure
- ✅ **TypeORM Without Synchronization**: Entities used for queries only
- ✅ **No Auto-Sync Issues**: Predictable, reliable database changes
- ✅ **Production Ready**: Same approach used in enterprise CRM systems

### **Database Setup (One-Time)**

```bash
# Navigate to backend directory
cd backend

# Run the database setup script
./setup-database.sh

# This will:
# - Drop and recreate the database
# - Execute the complete schema (13 tables)
# - Seed with default data
# - Verify all tables are created
```

## 🚀 Quick Start

### **Start Everything (Recommended)**
```bash
# Start both backend and frontend with comprehensive logging
./start-dev.sh

# Or explicitly specify 'all'
./start-dev.sh all
```

### **Start Backend Only**
```bash
./start-dev.sh backend
```

### **Start Frontend Only**
```bash
./start-dev.sh frontend
```

### **Stop All Services**
```bash
./stop-dev.sh
```

## 🎯 **Recommended Development Workflow**

### **1. Start Both Services Together**
```bash
# This is the best way to start development
./start-dev.sh
```

**What happens:**
- ✅ Checks all prerequisites (Node.js, MySQL, database status)
- ✅ Installs missing dependencies automatically
- ✅ Starts backend with verbose logging on port 3000
- ✅ Starts frontend Metro bundler on port 8081
- ✅ Shows comprehensive status and URLs
- ✅ Provides real-time logs for both services

### **2. Run on Device/Simulator**
After starting both services, open a **new terminal** and run:

```bash
# For Android
cd frontend && npm run android

# For iOS  
cd frontend && npm run ios
```

## 🔧 What the Script Does

### **Prerequisite Checks**
- ✅ Node.js and npm versions
- ✅ MySQL connection and database status
- ✅ Database table count verification
- ✅ Redis status (disabled by default)
- ✅ Global CLI tools installation

### **Backend Startup**
- ✅ Installs dependencies if needed (`npm install --legacy-peer-deps`)
- ✅ Installs NestJS CLI globally if missing
- ✅ Starts server with verbose logging
- ✅ Available at `http://localhost:3000`
- ✅ Health check at `http://localhost:3000/api/v1/health`

### **Frontend Startup**
- ✅ Installs dependencies if needed (`npm install --legacy-peer-deps --force`)
- ✅ Installs React Native CLI globally if missing
- ✅ Starts Metro bundler with hot reload
- ✅ Available at `http://localhost:8081`

## 📊 **Current Implementation Status**

### **✅ Database: 100% Complete**
- **13 entities** fully implemented and synchronized
- **All relationships** properly configured
- **Multi-currency support** with INR as default
- **Double-entry ledger** system
- **Comprehensive audit trail**

### **✅ Backend: 90% Complete**
- JWT authentication with refresh tokens
- User management and KYC system
- Wallet and transaction management
- Bill payment and recharge system
- Rate limiting and security features
- Redis integration (optional, disabled by default)

### **🔄 Frontend: 70% Complete**
- Authentication screens (login, register, OTP)
- Wallet management and transaction history
- Bill payment and recharge UI
- KYC document upload
- Profile management
- Settings and security screens

## 📊 Monitoring & Health Checks

### **Health Check Endpoints**
```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Expected response:
{
  "status": "UP",
  "timestamp": "2024-01-XX...",
  "database": "Connected",
  "message": "Service is healthy"
}
```

### **API Documentation**
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Interactive API testing** available

### **Check Running Processes**
```bash
# Check backend (port 3000)
lsof -i:3000

# Check frontend Metro (port 8081)
lsof -i:8081

# Check MySQL service
brew services list | grep mysql

# Check database tables
mysql -u root -e "USE wyapar_pay; SHOW TABLES;"
```

## 🎯 Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `http://localhost:3000` | Main API server |
| **Frontend Metro** | `http://localhost:8081` | React Native bundler |
| **API Docs** | `http://localhost:3000/api/docs` | Swagger documentation |
| **Health Check** | `http://localhost:3000/api/v1/health` | Service status |
| **Database** | `localhost:3306/wyapar_pay` | MySQL database |

## 🔍 Troubleshooting

### **If Backend Won't Start**
```bash
# Clean install backend dependencies
cd backend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run start:dev
```

### **If Frontend Won't Start**
```bash
# Clean install frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
npm start
```

### **If Database Issues**

**⚠️ IMPORTANT: Never use TypeORM synchronization!**

```bash
# 1. Check MySQL is running
brew services start mysql

# 2. Check database connection
mysql -u root -e "SELECT 1;"

# 3. If database doesn't exist, recreate it properly
cd backend
./setup-database.sh

# 4. If tables are missing or corrupted, recreate schema
mysql -u root wyapar_pay < ../docs/database/COMPLETE_DATABASE_SCHEMA.sql

# 5. Verify all 13 tables exist
mysql -u root -e "USE wyapar_pay; SHOW TABLES;"

# 6. Check backend configuration
cat .env | grep DB_
# Should show: DB_SYNCHRONIZE is NOT present (intentionally removed)

# 7. Validate WyaparPay configuration
./validate
```

**🚫 What NOT to do:**
- Never set `DB_SYNCHRONIZE=true`
- Never rely on TypeORM auto-sync
- Never manually edit entity files expecting schema changes

**✅ Correct approach:**
- Always use `./setup-database.sh` for database setup
- Edit `docs/database/COMPLETE_DATABASE_SCHEMA.sql` for schema changes
- Use TypeORM entities for queries only

### **If Redis Issues**
```bash
# Redis is disabled by default - no action needed
# If you enabled Redis and having issues:
brew services stop redis
# Then set REDIS_ENABLED=false in backend/.env
```

## 📱 Running on Device/Simulator

### **Android Development**
```bash
# 1. Start both services
./start-dev.sh

# 2. In a new terminal, run Android
cd frontend
npm run android
```

### **iOS Development**
```bash
# 1. Start both services
./start-dev.sh

# 2. Install iOS dependencies (first time only)
cd frontend/ios && pod install && cd ../..

# 3. In a new terminal, run iOS
cd frontend
npm run ios
```

## ⚙️ Configuration

### **Environment Variables**
- **Backend**: `backend/.env` (copied from `env.example`)
- **Database**: `wyapar_pay` (13 tables)
- **Redis**: Disabled by default (`REDIS_ENABLED=false`)

### **Database Configuration**
```env
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=wyapar_pay
DB_SYNCHRONIZE=false
```

### **Redis Configuration (Optional)**
```env
# To enable Redis (disabled by default for cost savings)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 **Best Practices**

### **Development Workflow**
1. **Start services**: `./start-dev.sh`
2. **Check health**: `curl http://localhost:3000/api/v1/health`
3. **Run on device**: `cd frontend && npm run android/ios`
4. **Monitor logs**: Watch terminal output for both services
5. **Stop when done**: `./stop-dev.sh`

### **Code Changes**
- **Backend**: Auto-reloads on file changes
- **Frontend**: Hot reload enabled in Metro
- **Database**: Changes require manual migration

### **Testing**
- **API Testing**: Use Swagger UI at `http://localhost:3000/api/docs`
- **Database Testing**: Use MySQL Workbench or command line
- **Frontend Testing**: Use React Native debugger

---

## 🎉 **Summary**

**One command to start everything:**
```bash
./start-dev.sh
```

**This gives you:**
- ✅ Backend API running on port 3000
- ✅ Frontend Metro bundler on port 8081  
- ✅ All 13 database entities synchronized
- ✅ Comprehensive logging and monitoring
- ✅ Health checks and API documentation
- ✅ Ready for mobile development

**Then run on device:**
```bash
cd frontend && npm run android  # or npm run ios
```

**That's it! Full-stack development environment ready.** 🚀
