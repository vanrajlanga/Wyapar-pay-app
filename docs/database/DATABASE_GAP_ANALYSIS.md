# Database Gap Analysis for Admin Panel

## Overview

This document provides a comprehensive analysis of database tables required for the Admin Panel and identifies any gaps that need to be addressed.

## Database Tables Summary

### Core Tables (17 Tables in Schema)

| # | Table | Description | Admin Panel Usage |
|---|-------|-------------|-------------------|
| 1 | `users` | User accounts | Customers API, Settings API |
| 2 | `transactions` | All transactions | Analytics API |
| 3 | `wallets` | User wallets | Analytics (balance info) |
| 4 | `wallet_ledger` | Transaction ledger | Analytics (detailed history) |
| 5 | `user_sessions` | Login sessions | Settings API (session management) |
| 6 | `user_documents` | KYC documents | Customers API (KYC verification) |
| 7 | `kyc_verifications` | KYC status | Customers API |
| 8 | `audit_logs` | Activity logging | Activity tracking |
| 9 | `currencies` | Currency master | General reference |
| 10 | `billers` | Biller master | Analytics (service breakdown) |
| 11 | `biller_categories` | Biller categories | Analytics (category breakdown) |
| 12 | `recharge_plans` | Recharge plans | Service management |
| 13 | `verifications` | OTP/email codes | User verification |
| 14 | `rate_limits` | API throttling | Security |
| 15 | `operator_circles` | Operator-circle mapping | Recharge service |
| 16 | `circles` | Circle master | Recharge service |
| 17 | `user_favorites` | User favorites | User preferences |

### Additional Entities (Not in Original Schema)

| # | Table | Description | Status |
|---|-------|-------------|--------|
| 1 | `operators` | Mobile operators | Migration Created |
| 2 | `notification_logs` | Push notification history | Migration Created |
| 3 | `notification_queue` | Notification queue | Migration Created |
| 4 | `admin_settings` | Global system settings | Migration Created |

## Gaps Identified & Fixed

### 1. User Role Field (CRITICAL)

**Issue**: No way to distinguish admin users from regular users.

**Fix Applied**:
- Added `UserRole` enum to `user.entity.ts`:
  - `user` - Regular user
  - `admin` - Admin user
  - `super_admin` - Super administrator
  - `support` - Support staff
  - `moderator` - Moderator

- Added `role` column to users table in migration script

- Created `RolesGuard` and `@Roles()` decorator for endpoint protection

### 2. Two-Factor Authentication Fields

**Issue**: Admin 2FA requires storing secrets and backup codes.

**Fix Applied**:
- Added to `user.entity.ts`:
  - `twoFactorEnabled: boolean`
  - `twoFactorSecret: string`
  - `twoFactorBackupCodes: string[]`

### 3. Push Notification Columns

**Issue**: Columns exist in entity but not in SQL schema.

**Fix Applied**:
- Added migration for `pushToken` and `pushTokenLastUpdated` columns

### 4. Missing Tables

**Issue**: Several entities had no corresponding SQL schema.

**Fix Applied**: Created migration script with:
- `operators` table - Mobile operators from KWIKAPI
- `notification_logs` table - Push notification history
- `notification_queue` table - Pending notifications queue
- `admin_settings` table - Global system configuration

## Admin API to Database Mapping

### Customers API (`/admin/customers`)

| Endpoint | Tables Used |
|----------|-------------|
| `GET /customers` | `users`, `transactions` (aggregated) |
| `GET /customers/:id` | `users`, `transactions`, `audit_logs` |
| `PATCH /customers/:id/status` | `users` |
| `GET /customers/stats` | `users`, `transactions` |

### Analytics API (`/admin/analytics`)

| Endpoint | Tables Used |
|----------|-------------|
| `GET /transactions` | `transactions`, `users` |
| `GET /dashboard` | `transactions`, `users` |
| `GET /revenue/*` | `transactions` |
| `GET /time-series` | `transactions` |
| `GET /summary` | `transactions` |
| `GET /top-services` | `transactions` |
| `GET /customers/top` | `users`, `transactions` |

### Settings API (`/admin/settings`)

| Endpoint | Tables Used |
|----------|-------------|
| `GET/PUT /profile` | `users` |
| `POST /profile/avatar` | `users` (+ S3) |
| `PUT /security/password` | `users` |
| `POST/DELETE /security/2fa` | `users` |
| `GET/DELETE /security/sessions` | `user_sessions` |
| `GET/PATCH /notifications` | `users` (preferences JSON) |
| `GET/PUT /system` | `users` (preferences) or `admin_settings` |
| `GET /system/info` | Environment config |

## Migration Files

1. **`COMPLETE_DATABASE_SCHEMA.sql`** - Base schema (original)
2. **`ADMIN_PANEL_MIGRATION.sql`** - Admin panel enhancements (new)

## How to Apply Migrations

```bash
# Connect to MySQL
mysql -u root -p

# Run the base schema (if fresh install)
source /path/to/COMPLETE_DATABASE_SCHEMA.sql

# Run the admin panel migration
source /path/to/ADMIN_PANEL_MIGRATION.sql
```

## Security Considerations

### Role-Based Access Control (RBAC)

All admin endpoints are now protected with:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
```

Available role decorators:
- `@AdminOnly()` - Allows admin, super_admin, moderator
- `@SuperAdminOnly()` - Only super_admin
- `@Roles(UserRole.ADMIN, UserRole.SUPPORT)` - Custom roles

### Creating Admin User

After running migration, create an admin user:

```sql
-- Hash password with bcrypt (do this in Node.js)
-- Example: bcrypt.hashSync('your-password', 10)

INSERT INTO users (id, name, phone, email, password, status, role, kycStatus, isEmailVerified, isPhoneVerified)
VALUES (
    UUID(),
    'Super Admin',
    '9999999999',
    'admin@wyaparpay.com',
    '$2a$10$BCRYPT_HASH_HERE',
    'active',
    'super_admin',
    'verified',
    TRUE,
    TRUE
);
```

## Verification Checklist

- [x] Users table has role column
- [x] Users table has 2FA columns
- [x] Users table has push notification columns
- [x] Operators table exists
- [x] Notification logs table exists
- [x] Notification queue table exists
- [x] Admin settings table exists (optional global config)
- [x] RolesGuard implemented
- [x] Admin controllers use RolesGuard
- [x] TypeScript compilation passes

## Recommendations

1. **Run the migration**: Execute `ADMIN_PANEL_MIGRATION.sql` on your database
2. **Create admin user**: Set up initial super_admin account
3. **Test RBAC**: Verify that regular users cannot access admin endpoints
4. **Monitor audit logs**: Use the audit_logs table to track admin actions
