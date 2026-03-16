# 🗄️ Database Documentation - CRM-Backend Approach

This folder contains all documentation related to the WyaparPay database design, schema, and management using the **CRM-backend pattern**.

## 🏗️ **Database Architecture**

**WyaparPay uses the CRM-backend approach for database management:**

- ✅ **Manual Schema Creation**: SQL scripts create/update database structure
- ✅ **TypeORM Without Synchronization**: Entities used for queries only  
- ✅ **No Auto-Sync Issues**: Predictable, reliable database changes
- ✅ **Production Ready**: Same approach used in enterprise CRM systems

### **Why CRM-Backend Approach?**

| Traditional TypeORM | CRM-Backend Approach |
|-------------------|---------------------|
| ❌ Auto-sync conflicts | ✅ Predictable schema changes |
| ❌ Production sync issues | ✅ Manual control over changes |
| ❌ Entity-driven schema | ✅ SQL-driven schema |
| ❌ Difficult rollbacks | ✅ Easy rollbacks with SQL |

## 📋 Current Documentation

### 🏗️ Schema Management
- **COMPLETE_DATABASE_SCHEMA.sql** - Master schema file (single source of truth)
- **DATABASE_SETUP_GUIDE.md** - Step-by-step database setup
- **setup-database.sh** - Automated database setup script

### 📊 Entity Documentation  
- **User Management** - Users, sessions, documents, KYC
- **Financial System** - Wallets, transactions, ledger
- **Service Management** - Billers, categories, recharge plans
- **System Features** - Audit logs, rate limits, currencies

### 🔧 Database Management (CRM-Backend Style)
- **Manual Schema Creation** - SQL-first approach
- **Seeding Scripts** - Default data population
- **TypeORM Entities** - Query interface only (no schema generation)
- **Version Control** - SQL files tracked in Git

### 🔒 Security & Compliance
- **Data Encryption** - Sensitive data protection
- **Access Control** - Database user permissions
- **Audit Trail** - Data change tracking
- **Compliance** - Financial data regulations

## 🗄️ Database Overview

### **Database Engine**: MySQL 8.0
### **Total Tables**: 13 ✅ **ALL IMPLEMENTED**
### **Implementation Status**: ✅ **COMPLETE** - All entities synchronized with backend
### **Key Features**:
- Multi-currency support
- Double-entry bookkeeping
- Comprehensive audit trail
- Rate limiting system
- Document management
- KYC verification system

## 📊 Entity Relationships

```
Users (1) ──→ (1) Wallets
Users (1) ──→ (N) UserSessions
Users (1) ──→ (N) UserDocuments
Users (1) ──→ (1) KycVerification

Wallets (1) ──→ (N) WalletLedger
Wallets (1) ──→ (N) Transactions

Billers (N) ──→ (1) BillerCategories
Transactions (N) ──→ (1) Billers
Transactions (N) ──→ (1) RechargePlans

Currencies (1) ──→ (N) Wallets
Currencies (1) ──→ (N) Transactions
```

## 📁 File Structure

```
database/
├── README.md                    # This file
├── DATABASE_SCHEMA.md          # Detailed schema documentation
├── COMPLETE_DATABASE_SCHEMA.sql # Ready-to-execute SQL
├── DATABASE_SETUP_GUIDE.md     # Setup instructions
├── migrations/                  # Database migrations
├── seeds/                      # Data seeding scripts
├── backups/                    # Backup files
└── performance/                # Performance optimization docs
```

## 🚀 Quick Setup (CRM-Backend Way)

### **1. Automated Setup (Recommended)**
```bash
# Navigate to backend directory
cd backend

# Run the complete database setup
./setup-database.sh

# This will:
# - Drop and recreate database
# - Execute complete schema
# - Seed with default data  
# - Verify all 13 tables
```

### **2. Manual Setup (If needed)**
```bash
# 1. Create database
mysql -u root -e "CREATE DATABASE wyapar_pay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Execute schema (from project root)
mysql -u root wyapar_pay < docs/database/COMPLETE_DATABASE_SCHEMA.sql

# 3. Seed data (from backend directory)
mysql -u root wyapar_pay < database/seed-data.sql

# 4. Verify setup
mysql -u root -e "USE wyapar_pay; SHOW TABLES;"
```

### **3. Package.json Scripts**
```bash
# Complete database setup
npm run db:setup

# Apply schema only
npm run db:schema

# Seed data only  
npm run db:seed

# Verify tables
npm run db:verify

# Validate configuration
npm run validate
```

## 📊 Table Summary

| Table Name | Purpose | Key Features |
|------------|---------|--------------|
| `users` | User accounts | Authentication, profile data |
| `wallets` | User wallets | Multi-currency support |
| `wallet_ledger` | Financial records | Double-entry bookkeeping |
| `transactions` | Payment records | Bill payments, transfers |
| `billers` | Service providers | Bill payment partners |
| `biller_categories` | Service categories | Organized service types |
| `recharge_plans` | Mobile plans | Recharge options |
| `currencies` | Currency support | Multi-currency system |
| `user_sessions` | Authentication | Session management |
| `user_documents` | Document storage | KYC document management |
| `kyc_verifications` | KYC status | Verification tracking |
| `audit_logs` | System audit | Change tracking |
| `rate_limits` | API protection | Rate limiting system |

## 🔧 Database Configuration (CRM-Backend)

### **Connection Settings (.env)**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=wyapar_pay
# Note: DB_SYNCHRONIZE is intentionally removed - we use manual schema creation
```

### **TypeORM Configuration (Query-Only Mode)**
```typescript
// backend/src/config/database.config.ts
{
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'wyapar_pay',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  
  // CRITICAL: Synchronization is PERMANENTLY DISABLED
  synchronize: false,  // Never change this to true!
  
  logging: true,
  timezone: '+00:00',
  charset: 'utf8mb4'
}
```

### **🚫 What NOT to do:**
- Never set `synchronize: true` 
- Never add `DB_SYNCHRONIZE=true` to .env
- Never expect entity changes to update schema
- Never use TypeORM migrations (we use SQL scripts)

### **✅ Correct CRM-Backend workflow:**
1. Edit `docs/database/COMPLETE_DATABASE_SCHEMA.sql` for schema changes
2. Run `./setup-database.sh` to apply changes
3. Update TypeORM entities to match schema (for queries only)
4. Test with `npm run validate`

## 🔒 Security Features

- **Data Encryption**: Sensitive fields encrypted at rest
- **Audit Trail**: All changes tracked with timestamps
- **Soft Deletes**: Data retention with soft delete pattern
- **Rate Limiting**: Built-in API rate limiting
- **Access Control**: Role-based database access

## 📈 Performance Features

- **Indexes**: Optimized indexes for common queries
- **Foreign Keys**: Proper relationship constraints
- **Data Types**: Optimized data types for storage
- **Partitioning**: Large table partitioning strategy
- **Caching**: Redis integration for frequently accessed data

## 🧪 Testing

### **Database Testing**
```bash
# Test connection
mysql -u root -p -e "SELECT 1;"

# Test database
mysql -u root -p -e "USE wyapar_pay; SHOW TABLES;"

# Test specific table
mysql -u root -p -e "USE wyapar_pay; SELECT COUNT(*) FROM users;"
```

### **Backup & Restore**
```bash
# Backup
mysqldump -u root -p wyapar_pay > backup.sql

# Restore
mysql -u root -p wyapar_pay < backup.sql
```

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [TypeORM Documentation](https://typeorm.io/)
- [Database Design Best Practices](https://www.guru99.com/database-design.html)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

*This documentation will be updated as the database schema evolves.*
