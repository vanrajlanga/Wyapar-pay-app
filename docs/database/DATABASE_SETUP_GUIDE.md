# 🗄️ Database Setup Guide

This guide provides step-by-step instructions for setting up the WyaparPay database using the complete schema.

## 🚀 **Quick Setup (Recommended)**

### **Method 1: Using Docker (Easiest)**

```bash
# 1. Start MySQL container
docker-compose up -d mysql

# 2. Wait for MySQL to be ready (about 30 seconds)
docker logs wyapar-pay-mysql

# 3. Execute the complete schema
docker exec -i wyapar-pay-mysql mysql -u root -p wyapar_pay < docs/COMPLETE_DATABASE_SCHEMA.sql
# Enter password when prompted: password
```

### **Method 2: Direct MySQL Connection**

```bash
# 1. Connect to MySQL
mysql -u root -p

# 2. Execute the schema
source /path/to/WyaparPay/docs/COMPLETE_DATABASE_SCHEMA.sql
```

### **Method 3: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the `COMPLETE_DATABASE_SCHEMA.sql` file
4. Execute the entire script (Ctrl+Shift+Enter)

## 📋 **What Gets Created**

### **13 Main Tables:**
1. `currencies` - Multi-currency support
2. `users` - User accounts and profiles
3. `wallets` - User wallet information
4. `biller_categories` - Service categories (hierarchical)
5. `billers` - Bill payment service providers
6. `recharge_plans` - Mobile recharge plans
7. `transactions` - All financial transactions
8. `wallet_ledger` - Double-entry bookkeeping
9. `user_sessions` - Authentication sessions
10. `user_documents` - Document upload system
11. `kyc_verifications` - KYC verification data
12. `audit_logs` - Audit trail for all changes
13. `rate_limits` - API rate limiting

### **Default Data Inserted:**
- **Currencies**: INR (default), USD, EUR
- **Biller Categories**: Mobile Recharge, Electricity, Gas, Water, DTH, Broadband, Insurance, Credit Card

## ✅ **Verification Steps**

After executing the schema, verify everything is working:

```sql
-- 1. Check all tables were created
SHOW TABLES;

-- 2. Verify table structures
DESCRIBE users;
DESCRIBE wallets;
DESCRIBE transactions;

-- 3. Check foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'wyapar_pay'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 4. Check indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'wyapar_pay'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 5. Verify default data
SELECT * FROM currencies;
SELECT * FROM biller_categories;
```

## 🔧 **Backend Configuration**

After creating the database, update your backend configuration:

```bash
# 1. Copy environment file
cd backend
cp env.example .env

# 2. Update database credentials in .env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=wyapar_pay

# 3. Start the backend
npm run start:dev
```

## 🐳 **Docker Environment Variables**

If using Docker, the environment variables are already configured in `docker-compose.yml`:

```yaml
environment:
  DB_HOST: mysql
  DB_PORT: 3306
  DB_USERNAME: wyapar_user
  DB_PASSWORD: wyapar_password
  DB_DATABASE: wyapar_pay
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **MySQL not running:**
   ```bash
   # Start MySQL service
   sudo service mysql start
   # Or on macOS with Homebrew
   brew services start mysql
   ```

2. **Permission denied:**
   ```bash
   # Grant permissions to user
   mysql -u root -p
   GRANT ALL PRIVILEGES ON wyapar_pay.* TO 'wyapar_user'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Docker container not starting:**
   ```bash
   # Check Docker logs
   docker logs wyapar-pay-mysql
   
   # Restart container
   docker-compose restart mysql
   ```

4. **Schema execution fails:**
   - Check MySQL version (requires 8.0+)
   - Ensure all required privileges are granted
   - Verify the SQL file path is correct

### **Reset Database:**

```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE IF EXISTS wyapar_pay;
CREATE DATABASE wyapar_pay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Re-run the schema
mysql -u root -p wyapar_pay < docs/COMPLETE_DATABASE_SCHEMA.sql
```

## 📊 **Performance Monitoring**

After setup, monitor database performance:

```sql
-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'wyapar_pay'
ORDER BY (data_length + index_length) DESC;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
```

## 🎯 **Next Steps**

1. **Test Backend Connection**: Start the backend and verify database connection
2. **Create Test Data**: Add sample users and transactions for testing
3. **Configure Redis**: Set up Redis for caching and sessions
4. **Set Up Monitoring**: Implement database monitoring and alerting
5. **Backup Strategy**: Configure automated database backups

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review MySQL error logs
3. Verify all prerequisites are met
4. Check the [Database Schema documentation](./DATABASE_SCHEMA.md) for detailed information

---

**✅ Database setup complete! Your WyaparPay database is ready for development and testing.**
