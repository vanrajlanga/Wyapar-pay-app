#!/bin/bash

# =====================================================
# WyaparPay Database Setup Script
# CRM-Backend Approach: Manual Schema Creation
# =====================================================

set -e  # Exit on any error

echo "🚀 WyaparPay Database Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}
DB_NAME=${DB_DATABASE:-wyapar_pay}

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Host: ${DB_HOST}:${DB_PORT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  User: ${DB_USER}"
echo ""

# Function to execute MySQL command
execute_mysql() {
    local sql="$1"
    local description="$2"
    
    echo -e "${YELLOW}⏳ ${description}...${NC}"
    
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "$sql" 2>/dev/null
    else
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "$sql" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${description} completed${NC}"
    else
        echo -e "${RED}❌ ${description} failed${NC}"
        exit 1
    fi
}

# Function to execute SQL file
execute_sql_file() {
    local file="$1"
    local description="$2"
    
    echo -e "${YELLOW}⏳ ${description}...${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ SQL file not found: $file${NC}"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" < "$file" 2>/dev/null
    else
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" < "$file" 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${description} completed${NC}"
    else
        echo -e "${RED}❌ ${description} failed${NC}"
        exit 1
    fi
}

# Step 1: Test MySQL connection
echo -e "${BLUE}🔍 Step 1: Testing MySQL connection...${NC}"
execute_mysql "SELECT 1;" "MySQL connection test"

# Step 2: Drop existing database (if exists)
echo -e "${BLUE}🗑️  Step 2: Cleaning up existing database...${NC}"
execute_mysql "DROP DATABASE IF EXISTS $DB_NAME;" "Drop existing database"

# Step 3: Create fresh database
echo -e "${BLUE}🏗️  Step 3: Creating fresh database...${NC}"
execute_mysql "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" "Create database"

# Step 4: Execute complete schema
echo -e "${BLUE}📊 Step 4: Creating database schema...${NC}"
SCHEMA_FILE="../docs/database/COMPLETE_DATABASE_SCHEMA.sql"
if [ -f "$SCHEMA_FILE" ]; then
    execute_sql_file "$SCHEMA_FILE" "Execute complete schema"
else
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Step 5: Seed database with default data
echo -e "${BLUE}🌱 Step 5: Seeding database with default data...${NC}"
SEED_FILE="./database/seed-data.sql"
if [ -f "$SEED_FILE" ]; then
    execute_sql_file "$SEED_FILE" "Seed database with default data"
else
    echo -e "${YELLOW}⚠️  Seed file not found: $SEED_FILE (skipping)${NC}"
fi

# Step 6: Verify database setup
echo -e "${BLUE}✅ Step 6: Verifying database setup...${NC}"
TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -D "$DB_NAME" -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)

if [ "$TABLE_COUNT" -ge 13 ]; then
    echo -e "${GREEN}✅ Database verification passed: $TABLE_COUNT tables created${NC}"
else
    echo -e "${RED}❌ Database verification failed: Only $TABLE_COUNT tables found (expected 13+)${NC}"
    exit 1
fi

# Step 7: Show table summary
echo -e "${BLUE}📋 Step 7: Database summary...${NC}"
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -D "$DB_NAME" -e "
    SELECT 
        'DATABASE SETUP COMPLETE' as Status,
        '$DB_NAME' as Database,
        COUNT(*) as Tables,
        NOW() as CompletedAt
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME';
    
    SELECT 
        TABLE_NAME as 'Table',
        TABLE_ROWS as 'Rows'
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME'
    ORDER BY TABLE_NAME;
    " 2>/dev/null
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -e "
    SELECT 
        'DATABASE SETUP COMPLETE' as Status,
        '$DB_NAME' as Database,
        COUNT(*) as Tables,
        NOW() as CompletedAt
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME';
    
    SELECT 
        TABLE_NAME as 'Table',
        TABLE_ROWS as 'Rows'
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME'
    ORDER BY TABLE_NAME;
    " 2>/dev/null
fi

echo ""
echo -e "${GREEN}🎉 WyaparPay Database Setup Completed Successfully!${NC}"
echo -e "${BLUE}📌 Next Steps:${NC}"
echo -e "  1. Update your .env file with database credentials"
echo -e "  2. Start the backend server: ${YELLOW}npm run start:dev${NC}"
echo -e "  3. Test API endpoints"
echo ""
