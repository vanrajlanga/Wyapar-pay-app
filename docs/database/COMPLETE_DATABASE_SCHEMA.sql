-- =====================================================
-- WyaparPay Complete Database Schema (Updated)
-- MySQL 8.0+ Compatible
-- All 13 Entities with Proper Relationships
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wyapar_pay 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE wyapar_pay;

-- =====================================================
-- 1. CURRENCIES TABLE
-- =====================================================
CREATE TABLE currencies (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    isDefault BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_currency_code_length CHECK (LENGTH(code) = 3),
    
    -- Indexes
    INDEX idx_currencies_isdefault (isDefault)
);

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    dateOfBirth DATE NULL,
    status ENUM('active', 'inactive', 'suspended', 'pending_kyc') DEFAULT 'pending_kyc',
    kycStatus ENUM('not_started', 'in_progress', 'pending_review', 'verified', 'rejected', 'expired') DEFAULT 'not_started',
    
    -- KYC Documents
    panNumber VARCHAR(20) NULL,
    aadhaarNumber VARCHAR(12) NULL,
    address TEXT NULL,
    pincode VARCHAR(6) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(50) NULL,
    
    -- Security
    loginAttempts INT DEFAULT 0,
    lockedUntil TIMESTAMP NULL,
    isEmailVerified BOOLEAN DEFAULT FALSE,
    isPhoneVerified BOOLEAN DEFAULT FALSE,
    profileImage VARCHAR(500) NULL,
    lastLoginAt TIMESTAMP NULL,
    
    -- Preferences
    preferences JSON NULL,
    
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_phone_format CHECK (phone REGEXP '^[0-9+]{10,15}$'),
    CONSTRAINT chk_email_format CHECK (email REGEXP '^[^@]+@[^@]+\\.[^@]+$'),
    
    -- Indexes
    INDEX idx_users_phone (phone),
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_kyc_status (kycStatus),
    
    -- Unique constraints
    UNIQUE KEY uk_users_phone (phone),
    UNIQUE KEY uk_users_email (email)
);

-- =====================================================
-- 3. BILLER_CATEGORIES TABLE
-- =====================================================
CREATE TABLE biller_categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    type ENUM('utility', 'telecom', 'insurance', 'finance', 'education', 'government', 'entertainment', 'other') NOT NULL,
    icon VARCHAR(100) NULL,
    color VARCHAR(7) NULL,
    sortOrder INT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_biller_categories_name (name),
    INDEX idx_biller_categories_type (type)
);

-- =====================================================
-- 4. BILLERS TABLE
-- =====================================================
CREATE TABLE billers (
    id CHAR(36) PRIMARY KEY,
    billerCode VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    categoryId CHAR(36) NOT NULL,
    status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
    logo VARCHAR(100) NULL,
    fee DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    minAmount DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    maxAmount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    supportsPartialPayment BOOLEAN NOT NULL DEFAULT TRUE,
    supportsAdvancePayment BOOLEAN NOT NULL DEFAULT TRUE,
    processingTimeMinutes INT NOT NULL DEFAULT 0,
    parameters JSON NULL,
    validationRules JSON NULL,
    apiEndpoint VARCHAR(100) NULL,
    apiKey VARCHAR(100) NULL,
    requiresOtp BOOLEAN NOT NULL DEFAULT FALSE,
    requiresCustomerId BOOLEAN NOT NULL DEFAULT FALSE,
    requiresAccountNumber BOOLEAN NOT NULL DEFAULT FALSE,
    requiresMobileNumber BOOLEAN NOT NULL DEFAULT FALSE,
    supportedStates VARCHAR(20) NULL,
    supportedCities VARCHAR(20) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (categoryId) REFERENCES biller_categories(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_billers_categoryid_status (categoryId, status),
    
    -- Unique constraints
    UNIQUE KEY uk_billers_code (billerCode)
);

-- =====================================================
-- 5. RECHARGE_PLANS TABLE
-- =====================================================
CREATE TABLE recharge_plans (
    id CHAR(36) PRIMARY KEY,
    billerId CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    type ENUM('prepaid', 'postpaid', 'data', 'sms', 'combo') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    validity VARCHAR(50) NULL,
    dataLimit VARCHAR(50) NULL,
    voiceLimit VARCHAR(50) NULL,
    smsLimit VARCHAR(50) NULL,
    benefits JSON NULL,
    isActive BOOLEAN DEFAULT TRUE,
    sortOrder INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (billerId) REFERENCES billers(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_recharge_plans_billerid (billerId),
    INDEX idx_recharge_plans_type (type),
    INDEX idx_recharge_plans_amount (amount),
    INDEX idx_recharge_plans_isactive (isActive)
);

-- =====================================================
-- 6. WALLETS TABLE
-- =====================================================
CREATE TABLE wallets (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    currencyId CHAR(36) NULL,
    type ENUM('primary', 'savings', 'business') NOT NULL DEFAULT 'primary',
    balance DECIMAL(15,2) DEFAULT 0,
    lockedBalance DECIMAL(15,2) DEFAULT 0,
    availableBalance DECIMAL(15,2) DEFAULT 0,
    status ENUM('active', 'suspended', 'closed') DEFAULT 'active',
    currency VARCHAR(3) DEFAULT 'INR',
    dailyLimit DECIMAL(15,2) DEFAULT 0,
    monthlyLimit DECIMAL(15,2) DEFAULT 0,
    dailySpent DECIMAL(15,2) DEFAULT 0,
    monthlySpent DECIMAL(15,2) DEFAULT 0,
    lastResetDate DATE NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (currencyId) REFERENCES currencies(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT uk_wallets_userid_type UNIQUE (userId, type),
    CONSTRAINT chk_wallet_balance CHECK (balance >= 0),
    CONSTRAINT chk_wallet_locked_balance CHECK (lockedBalance >= 0),
    
    -- Indexes
    INDEX idx_wallets_userid (userId),
    INDEX idx_wallets_currencyid (currencyId),
    INDEX idx_wallets_status (status)
);

-- =====================================================
-- 7. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    walletId CHAR(36) NULL,
    billerId CHAR(36) NULL,
    type ENUM('recharge', 'bill_payment', 'transfer', 'refund', 'cashback', 'withdrawal', 'deposit') NOT NULL,
    category ENUM(
        'mobile_recharge',
        'dth_recharge', 
        'broadband_recharge',
        'electricity_bill',
        'water_bill',
        'gas_bill',
        'credit_card_bill',
        'loan_repayment',
        'insurance_premium',
        'fastag_recharge',
        'upi_transfer',
        'bank_transfer',
        'wallet_transfer',
        'cashback_earned',
        'refund_received',
        'wallet_topup',
        'withdrawal_to_bank'
    ) NULL,
    status ENUM('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    paymentMethod ENUM('wallet', 'upi', 'card', 'net_banking', 'bank_transfer') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0.00,
    totalAmount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    gatewayRef VARCHAR(100) NULL,
    upiRef VARCHAR(100) NULL,
    bankRef VARCHAR(100) NULL,
    description TEXT NULL,
    customerRef VARCHAR(100) NULL,
    gatewayResponse JSON NULL,
    metadata JSON NULL,
    processedAt TIMESTAMP NULL,
    completedAt TIMESTAMP NULL,
    failureReason TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (walletId) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (billerId) REFERENCES billers(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_transaction_amount CHECK (amount > 0),
    CONSTRAINT chk_transaction_fee CHECK (fee >= 0),
    
    -- Indexes
    INDEX idx_transactions_userid_createdat (userId, createdAt),
    INDEX idx_transactions_walletid (walletId),
    INDEX idx_transactions_billerid (billerId),
    INDEX idx_transactions_status_createdat (status, createdAt),
    INDEX idx_transactions_category_createdat (category, createdAt),
    INDEX idx_transactions_gatewayref (gatewayRef),
    INDEX idx_transactions_upiref (upiRef)
);

-- =====================================================
-- 8. WALLET_LEDGER TABLE
-- =====================================================
CREATE TABLE wallet_ledger (
    id CHAR(36) PRIMARY KEY,
    walletId CHAR(36) NOT NULL,
    transactionId CHAR(36) NULL,
    type ENUM('debit', 'credit') NOT NULL,
    category ENUM('recharge', 'bill_payment', 'transfer', 'refund', 'commission', 'penalty', 'adjustment', 'cashback', 'withdrawal', 'deposit') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balanceBefore DECIMAL(15,2) NOT NULL,
    balanceAfter DECIMAL(15,2) NOT NULL,
    description TEXT NULL,
    reference VARCHAR(100) NULL,
    metadata JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (walletId) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_ledger_amount CHECK (amount > 0),
    CONSTRAINT chk_ledger_balance_after CHECK (balanceAfter >= 0),
    
    -- Indexes
    INDEX idx_wallet_ledger_walletid_createdat (walletId, createdAt),
    INDEX idx_wallet_ledger_transactionid (transactionId),
    INDEX idx_wallet_ledger_type_category (type, category)
);

-- =====================================================
-- 9. USER_SESSIONS TABLE
-- =====================================================
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    token TEXT NOT NULL,
    refreshToken TEXT NOT NULL,
    status ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    deviceId VARCHAR(100) NULL,
    deviceType VARCHAR(50) NULL,
    expiresAt TIMESTAMP NOT NULL,
    lastUsedAt TIMESTAMP NULL,
    revokedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_sessions_userid_status (userId, status),
    INDEX idx_user_sessions_token (token(255)),
    INDEX idx_user_sessions_refreshtoken (refreshToken(255))
);

-- =====================================================
-- 10. USER_DOCUMENTS TABLE
-- =====================================================
CREATE TABLE user_documents (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    type ENUM('pan_card', 'aadhaar_front', 'aadhaar_back', 'passport', 'driving_license', 'voter_id', 'bank_statement', 'utility_bill', 'profile_photo') NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(500) NOT NULL,
    mimeType VARCHAR(100) NOT NULL,
    fileSize BIGINT NOT NULL,
    status ENUM('pending', 'uploaded', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    rejectionReason TEXT NULL,
    extractedData JSON NULL,
    verifiedAt TIMESTAMP NULL,
    expiresAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_documents_userid_type (userId, type),
    INDEX idx_user_documents_status (status),
    
    -- Unique constraints
    UNIQUE KEY uk_user_documents_userid_type (userId, type)
);

-- =====================================================
-- 11. KYC_VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE kyc_verifications (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    status ENUM('not_started', 'in_progress', 'pending_review', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'not_started',
    level ENUM('basic', 'standard', 'enhanced') NOT NULL DEFAULT 'basic',
    panNumber VARCHAR(20) NULL,
    aadhaarNumber VARCHAR(12) NULL,
    passportNumber VARCHAR(20) NULL,
    drivingLicenseNumber VARCHAR(20) NULL,
    voterIdNumber VARCHAR(20) NULL,
    address TEXT NULL,
    pincode VARCHAR(6) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(50) NULL,
    country VARCHAR(50) NULL,
    dateOfBirth DATE NULL,
    gender VARCHAR(10) NULL,
    fatherName VARCHAR(100) NULL,
    motherName VARCHAR(100) NULL,
    spouseName VARCHAR(100) NULL,
    occupation VARCHAR(50) NULL,
    employerName VARCHAR(100) NULL,
    annualIncome DECIMAL(15,2) NULL,
    rejectionReason TEXT NULL,
    verificationData JSON NULL,
    verifiedAt TIMESTAMP NULL,
    expiresAt TIMESTAMP NULL,
    verificationAttempts INT DEFAULT 0,
    lastAttemptAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_kyc_verifications_userid (userId),
    INDEX idx_kyc_verifications_status (status),
    INDEX idx_kyc_verifications_level (level),
    
    -- Unique constraints
    UNIQUE KEY uk_kyc_verifications_userid (userId)
);

-- =====================================================
-- 12. AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NULL,
    action ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'transaction', 'payment', 'kyc_submit', 'kyc_approve', 'kyc_reject', 'wallet_create', 'wallet_lock', 'wallet_unlock', 'password_change', 'profile_update') NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resourceId CHAR(36) NULL,
    status ENUM('success', 'failed', 'pending') NOT NULL,
    description TEXT NULL,
    oldValues JSON NULL,
    newValues JSON NULL,
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    sessionId VARCHAR(100) NULL,
    errorMessage VARCHAR(500) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_audit_logs_userid (userId),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_status (status),
    INDEX idx_audit_logs_createdat (createdAt),
    INDEX idx_audit_logs_ipaddress (ipAddress)
);

-- =====================================================
-- 13. RATE_LIMITS TABLE
-- =====================================================
CREATE TABLE rate_limits (
    id CHAR(36) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    type ENUM('api_call', 'login_attempt', 'transaction', 'otp_request', 'password_reset', 'kyc_submission') NOT NULL,
    count INT DEFAULT 1,
    limit_count INT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    ipAddress VARCHAR(45) NULL,
    userId CHAR(36) NULL,
    metadata TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_rate_limits_identifier (identifier),
    INDEX idx_rate_limits_type (type),
    INDEX idx_rate_limits_expiresat (expiresAt)
);

-- =====================================================
-- 14. VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE verifications (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    type ENUM('email', 'password_reset', 'phone') NOT NULL,
    code VARCHAR(10) NOT NULL,
    status ENUM('pending', 'verified', 'expired', 'used') DEFAULT 'pending',
    expiresAt DATETIME NOT NULL,
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    verifiedAt DATETIME NULL,
    attempts INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    UNIQUE INDEX idx_verifications_code (code),
    INDEX idx_verifications_user_type_status (userId, type, status),
    INDEX idx_verifications_expires (expiresAt)
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default currencies
INSERT INTO currencies (id, code, name, symbol, isDefault) VALUES
(UUID(), 'INR', 'Indian Rupee', '₹', TRUE),
(UUID(), 'USD', 'US Dollar', '$', FALSE),
(UUID(), 'EUR', 'Euro', '€', FALSE);

-- Insert default biller categories
INSERT INTO biller_categories (id, name, description, type, icon, color, sortOrder) VALUES
(UUID(), 'Electricity', 'Electricity bill payments', 'utility', 'electricity', '#FF6B35', 1),
(UUID(), 'Mobile Recharge', 'Mobile and data recharge', 'telecom', 'mobile', '#4ECDC4', 2),
(UUID(), 'Gas', 'Gas bill payments', 'utility', 'gas', '#45B7D1', 3),
(UUID(), 'Water', 'Water bill payments', 'utility', 'water', '#96CEB4', 4),
(UUID(), 'Broadband', 'Internet and broadband', 'telecom', 'wifi', '#FFEAA7', 5),
(UUID(), 'DTH', 'Satellite TV services', 'entertainment', 'tv', '#DDA0DD', 6),
(UUID(), 'Insurance', 'Insurance premium payments', 'insurance', 'shield', '#98D8C8', 7),
(UUID(), 'Credit Card', 'Credit card bill payments', 'finance', 'credit-card', '#F7DC6F', 8),
(UUID(), 'Education', 'School and college fees', 'education', 'graduation', '#BB8FCE', 9),
(UUID(), 'Municipal', 'Municipal corporation bills', 'government', 'building', '#85C1E9', 10);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables are created
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'wyapar_pay' 
ORDER BY TABLE_NAME;

-- Verify foreign key relationships
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'wyapar_pay' 
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Verify indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'wyapar_pay' 
ORDER BY TABLE_NAME, INDEX_NAME;-- Appending new recharge tables
-- Migration: Add Recharge-related tables
-- Date: 2025-10-05
-- Description: Adds operator_circles and user_favorites tables for mobile recharge functionality

-- =====================================================
-- 1. OPERATOR CIRCLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `operator_circles` (
  `id` CHAR(36) PRIMARY KEY,
  `operatorCode` VARCHAR(50) NOT NULL,
  `operatorName` VARCHAR(100) NOT NULL,
  `circleCode` VARCHAR(50) NOT NULL,
  `circleName` VARCHAR(100) NOT NULL,
  `stateCode` VARCHAR(50) NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `sortOrder` INT DEFAULT 0,
  `metadata` JSON NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_operator_code` (`operatorCode`),
  INDEX `idx_circle_code` (`circleCode`),
  UNIQUE INDEX `idx_operator_circle` (`operatorCode`, `circleCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CIRCLES TABLE (Cached from KWIKAPI - 2 hits/day limit)
-- =====================================================
CREATE TABLE IF NOT EXISTS `circles` (
  `id` CHAR(36) PRIMARY KEY,
  `circleCode` VARCHAR(50) NOT NULL,
  `circleName` VARCHAR(100) NOT NULL,
  `stateCode` VARCHAR(50) NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `sortOrder` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX `idx_circle_code` (`circleCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. USER FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id` CHAR(36) PRIMARY KEY,
  `userId` CHAR(36) NOT NULL,
  `type` ENUM('mobile_recharge', 'dth_recharge', 'electricity', 'gas', 'water', 'credit_card', 'loan') NOT NULL,
  `accountNumber` VARCHAR(50) NOT NULL,
  `nickname` VARCHAR(100) NULL,
  `operatorCode` VARCHAR(50) NULL,
  `operatorName` VARCHAR(100) NULL,
  `circleCode` VARCHAR(50) NULL,
  `circleName` VARCHAR(100) NULL,
  `lastRechargeAmount` DECIMAL(10, 2) NULL,
  `lastRechargeDate` TIMESTAMP NULL,
  `rechargeCount` INT DEFAULT 0,
  `isActive` BOOLEAN DEFAULT TRUE,
  `sortOrder` INT DEFAULT 0,
  `metadata` JSON NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_user_id` (`userId`),
  INDEX `idx_user_type` (`userId`, `type`),
  UNIQUE INDEX `idx_user_account` (`userId`, `accountNumber`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. INSERT DEFAULT OPERATORS AND CIRCLES
-- =====================================================

-- Airtel Circles
INSERT INTO `operator_circles` (`id`, `operatorCode`, `operatorName`, `circleCode`, `circleName`, `stateCode`, `isActive`, `sortOrder`) VALUES
(UUID(), 'AIRTEL', 'Airtel', 'DELHI', 'Delhi', 'DL', TRUE, 1),
(UUID(), 'AIRTEL', 'Airtel', 'MUMBAI', 'Mumbai', 'MH', TRUE, 2),
(UUID(), 'AIRTEL', 'Airtel', 'KOLKATA', 'Kolkata', 'WB', TRUE, 3),
(UUID(), 'AIRTEL', 'Airtel', 'CHENNAI', 'Chennai', 'TN', TRUE, 4),
(UUID(), 'AIRTEL', 'Airtel', 'BANGALORE', 'Karnataka', 'KA', TRUE, 5),
(UUID(), 'AIRTEL', 'Airtel', 'HYDERABAD', 'Andhra Pradesh/Telangana', 'AP', TRUE, 6),
(UUID(), 'AIRTEL', 'Airtel', 'KERALA', 'Kerala', 'KL', TRUE, 7),
(UUID(), 'AIRTEL', 'Airtel', 'MAHARASHTRA', 'Maharashtra (excluding Mumbai)', 'MH', TRUE, 8),
(UUID(), 'AIRTEL', 'Airtel', 'GUJARAT', 'Gujarat', 'GJ', TRUE, 9),
(UUID(), 'AIRTEL', 'Airtel', 'PUNJAB', 'Punjab', 'PB', TRUE, 10),
(UUID(), 'AIRTEL', 'Airtel', 'RAJASTHAN', 'Rajasthan', 'RJ', TRUE, 11),
(UUID(), 'AIRTEL', 'Airtel', 'UP_EAST', 'UP East', 'UP', TRUE, 12),
(UUID(), 'AIRTEL', 'Airtel', 'UP_WEST', 'UP West', 'UP', TRUE, 13),
(UUID(), 'AIRTEL', 'Airtel', 'HARYANA', 'Haryana', 'HR', TRUE, 14),
(UUID(), 'AIRTEL', 'Airtel', 'MADHYA_PRADESH', 'Madhya Pradesh/Chhattisgarh', 'MP', TRUE, 15);

-- Jio Circles
INSERT INTO `operator_circles` (`id`, `operatorCode`, `operatorName`, `circleCode`, `circleName`, `stateCode`, `isActive`, `sortOrder`) VALUES
(UUID(), 'JIO', 'Reliance Jio', 'DELHI', 'Delhi', 'DL', TRUE, 1),
(UUID(), 'JIO', 'Reliance Jio', 'MUMBAI', 'Mumbai', 'MH', TRUE, 2),
(UUID(), 'JIO', 'Reliance Jio', 'KOLKATA', 'Kolkata', 'WB', TRUE, 3),
(UUID(), 'JIO', 'Reliance Jio', 'CHENNAI', 'Chennai', 'TN', TRUE, 4),
(UUID(), 'JIO', 'Reliance Jio', 'BANGALORE', 'Karnataka', 'KA', TRUE, 5),
(UUID(), 'JIO', 'Reliance Jio', 'HYDERABAD', 'Andhra Pradesh/Telangana', 'AP', TRUE, 6),
(UUID(), 'JIO', 'Reliance Jio', 'KERALA', 'Kerala', 'KL', TRUE, 7),
(UUID(), 'JIO', 'Reliance Jio', 'MAHARASHTRA', 'Maharashtra (excluding Mumbai)', 'MH', TRUE, 8),
(UUID(), 'JIO', 'Reliance Jio', 'GUJARAT', 'Gujarat', 'GJ', TRUE, 9),
(UUID(), 'JIO', 'Reliance Jio', 'PUNJAB', 'Punjab', 'PB', TRUE, 10);

-- Vi (Vodafone Idea) Circles
INSERT INTO `operator_circles` (`id`, `operatorCode`, `operatorName`, `circleCode`, `circleName`, `stateCode`, `isActive`, `sortOrder`) VALUES
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'DELHI', 'Delhi', 'DL', TRUE, 1),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'MUMBAI', 'Mumbai', 'MH', TRUE, 2),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'KOLKATA', 'Kolkata', 'WB', TRUE, 3),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'CHENNAI', 'Chennai', 'TN', TRUE, 4),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'BANGALORE', 'Karnataka', 'KA', TRUE, 5),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'GUJARAT', 'Gujarat', 'GJ', TRUE, 6),
(UUID(), 'VI', 'Vi (Vodafone Idea)', 'MAHARASHTRA', 'Maharashtra (excluding Mumbai)', 'MH', TRUE, 7);

-- BSNL Circles
INSERT INTO `operator_circles` (`id`, `operatorCode`, `operatorName`, `circleCode`, `circleName`, `stateCode`, `isActive`, `sortOrder`) VALUES
(UUID(), 'BSNL', 'BSNL', 'DELHI', 'Delhi', 'DL', TRUE, 1),
(UUID(), 'BSNL', 'BSNL', 'MUMBAI', 'Mumbai', 'MH', TRUE, 2),
(UUID(), 'BSNL', 'BSNL', 'KOLKATA', 'Kolkata', 'WB', TRUE, 3),
(UUID(), 'BSNL', 'BSNL', 'CHENNAI', 'Chennai', 'TN', TRUE, 4),
(UUID(), 'BSNL', 'BSNL', 'KERALA', 'Kerala', 'KL', TRUE, 5),
(UUID(), 'BSNL', 'BSNL', 'ANDHRA_PRADESH', 'Andhra Pradesh', 'AP', TRUE, 6);

