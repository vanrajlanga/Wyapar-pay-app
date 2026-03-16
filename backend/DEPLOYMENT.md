# Production Deployment Guide

Complete guide for deploying WyaparPay backend to production with automatic database migrations.

## Quick Start

### Local Deployment

```bash
# Pull latest code
git pull origin main

# Run deployment script
./deploy.sh
```

### Production Server Deployment

```bash
# SSH into production server
ssh user@your-server.com

# Navigate to backend directory
cd /path/to/wyapar-pay/backend

# Pull latest changes
git pull origin main

# Run deployment
./deploy.sh
```

## Database Migrations

### Automatic Migration (Recommended)

The deployment script (`deploy.sh`) automatically:
1. Checks for pending migrations
2. Shows what will be executed
3. Runs migrations
4. Restarts the application

### Manual Migration

If you prefer to run migrations manually:

```bash
# Check what migrations are pending
npm run migrate:status

# Run pending migrations
npm run migrate

# Restart application
pm2 restart wyapar-backend
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: backend

      - name: Build application
        run: npm run build
        working-directory: backend

      - name: Run database migrations
        run: npm run migrate
        working-directory: backend
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USERNAME: ${{ secrets.DB_USERNAME }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_DATABASE: ${{ secrets.DB_DATABASE }}

      - name: Deploy to server
        # Your deployment steps here
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - migrate
  - deploy

build:
  stage: build
  script:
    - cd backend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - backend/dist/

migrate:
  stage: migrate
  script:
    - cd backend
    - npm run migrate
  only:
    - main

deploy:
  stage: deploy
  script:
    - cd backend
    - pm2 restart wyapar-backend
  only:
    - main
```

## Environment Variables

Ensure these are set on your production server:

```bash
# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=wyapar_pay

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
# ... other environment variables
```

## Safety Checklist

Before deploying to production:

- [ ] ✅ **Backup database**
  ```bash
  mysqldump -u root -p wyapar_pay > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] ✅ **Test migrations locally**
  ```bash
  npm run migrate:status
  npm run migrate
  ```

- [ ] ✅ **Review pending migrations**
  - Check what SQL will be executed
  - Ensure migrations are safe and reversible

- [ ] ✅ **Check environment configuration**
  ```bash
  cat .env | grep -v PASSWORD
  ```

- [ ] ✅ **Test application after deployment**
  - Check health endpoint
  - Test critical API endpoints
  - Monitor logs for errors

## Rollback Procedure

If something goes wrong:

### 1. Restore Application

```bash
# Revert to previous version
git checkout HEAD~1

# Rebuild and restart
npm run build
pm2 restart wyapar-backend
```

### 2. Restore Database (if needed)

```bash
# Restore from backup
mysql -u root -p wyapar_pay < backup_YYYYMMDD_HHMMSS.sql
```

### 3. Manual Migration Reversal

Create a new migration that reverses the changes:

```bash
# Example: 005_revert_user_fields.sql
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NOT NULL;
```

Then run:
```bash
npm run migrate
```

## Monitoring After Deployment

### Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs wyapar-backend --lines 100

# Follow logs in real-time
pm2 logs wyapar-backend
```

### Check Migration Status

```bash
# View executed migrations
npm run migrate:status

# Or directly in database
mysql -u root -p -e "SELECT * FROM wyapar_pay.migrations ORDER BY executed_at DESC;"
```

### Health Check

```bash
# API health check
curl http://localhost:3000/health

# Database connection check
curl http://localhost:3000/api/v1/health
```

## Common Issues

### Issue: Migration fails with "Column already exists"

**Solution**: The migration was partially executed. Either:
1. Manually complete the migration in database
2. Mark migration as complete: `INSERT INTO migrations (name) VALUES ('XXX_migration.sql');`

### Issue: Application won't start after migration

**Solution**:
1. Check logs: `pm2 logs wyapar-backend`
2. Verify database schema matches entities
3. Check `.env` configuration
4. Rollback if necessary

### Issue: Migrations don't run in CI/CD

**Solution**:
1. Ensure `DB_*` environment variables are set
2. Check network access to database
3. Verify database user has sufficient permissions

## Best Practices

1. ✅ **Always backup before deployment**
2. ✅ **Test migrations on staging environment first**
3. ✅ **Deploy during low-traffic periods**
4. ✅ **Monitor application logs after deployment**
5. ✅ **Keep rollback plan ready**
6. ✅ **Document any manual steps required**
7. ✅ **Use feature flags for major changes**
8. ✅ **Commit migrations with related code changes**

## Support

If you encounter issues during deployment:

1. Check logs: `pm2 logs wyapar-backend`
2. Check migration status: `npm run migrate:status`
3. Review recent commits: `git log --oneline -10`
4. Contact development team with error details
