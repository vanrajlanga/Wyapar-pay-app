# Database Migrations

Automatic database migration system for WyaparPay backend.

## Overview

- **Migration files**: SQL files in `migrations/` folder
- **Naming convention**: `XXX_description.sql` (e.g., `003_make_user_fields_nullable.sql`)
- **Tracking**: Migrations table tracks which migrations have been executed
- **Safe**: Prevents re-running migrations that have already been executed

## Usage

### Check Migration Status

```bash
npm run migrate:status
```

Shows which migrations have been executed and which are pending.

### Run Pending Migrations

```bash
npm run migrate
```

Executes all pending migrations in order.

## Creating New Migrations

1. **Create a new SQL file** in `migrations/` folder
2. **Use sequential numbering**: `004_`, `005_`, etc.
3. **Add descriptive name**: `004_add_user_verification_fields.sql`
4. **Include comments**:
   ```sql
   -- Migration: Add user verification fields
   -- Date: 2026-02-02
   -- Reason: Add email and phone verification status fields

   ALTER TABLE users
     ADD COLUMN email_verified_at TIMESTAMP NULL,
     ADD COLUMN phone_verified_at TIMESTAMP NULL;
   ```

## Migration File Format

```sql
-- Migration: [Description]
-- Date: [YYYY-MM-DD]
-- Reason: [Why this change is needed]

-- Your SQL statements here
ALTER TABLE ...;
CREATE TABLE ...;
```

## Production Deployment

### Option 1: Run migrations during deployment

Add to your deployment script:

```bash
cd /path/to/backend
npm run migrate
npm run start:prod
```

### Option 2: Manual execution on production server

```bash
ssh your-server
cd /path/to/backend
npm run migrate:status  # Check what will run
npm run migrate         # Execute pending migrations
```

### Option 3: Use in CI/CD pipeline

Add to your `.github/workflows/deploy.yml` or similar:

```yaml
- name: Run database migrations
  run: |
    cd backend
    npm run migrate
```

## Safety Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Tracked**: Each migration runs only once
- ✅ **Ordered**: Migrations run in alphabetical/numeric order
- ✅ **Atomic**: Uses database transactions where possible
- ✅ **Safe defaults**: Use `IF NOT EXISTS`, `IF EXISTS`, etc.

## Troubleshooting

### Migration fails with "duplicate column" error

Your migration tried to add a column that already exists. Use:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
```

### Need to skip a failed migration

Manually mark it as executed:
```sql
INSERT INTO migrations (name) VALUES ('003_problematic_migration.sql');
```

### Undo a migration

Migrations are forward-only. To undo:
1. Create a new migration that reverses the changes
2. Name it appropriately: `004_revert_user_fields.sql`

## Migration Tracking

All executed migrations are stored in the `migrations` table:

```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

## Best Practices

1. ✅ **Test locally first**: Always test migrations on development database
2. ✅ **Use transactions**: Wrap migrations in transactions when possible
3. ✅ **Make idempotent**: Use `IF EXISTS`, `IF NOT EXISTS`
4. ✅ **Backup first**: Always backup production database before running migrations
5. ✅ **Small changes**: Keep migrations small and focused
6. ✅ **Document why**: Include reason in migration comments
7. ✅ **Version control**: Commit migrations with related code changes

## Current Migrations

| Migration | Description | Status |
|-----------|-------------|--------|
| 000 | Create migrations tracking table | ✅ Executed |
| 001 | Create circles table for KWIKAPI cache | ✅ Executed |
| 002 | Create operators table for KWIKAPI cache | ✅ Executed |
| 003 | Make user email/phone/password nullable | ✅ Executed |

Run `npm run migrate:status` for current status.
