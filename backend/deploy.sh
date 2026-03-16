#!/bin/bash

###############################################################################
# WyaparPay Backend Deployment Script
#
# This script handles safe deployment of backend with automatic migrations.
# Use this script in your CI/CD pipeline or manual deployments.
#
# Usage:
#   ./deploy.sh              # Full deployment with migrations
#   ./deploy.sh --skip-migrations  # Deploy without running migrations
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
SKIP_MIGRATIONS=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

###############################################################################
# Deployment Steps
###############################################################################

echo "═══════════════════════════════════════════════════════════"
echo "   WyaparPay Backend Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Check if .env exists
log_info "Checking environment configuration..."
if [ ! -f ".env" ]; then
    log_error ".env file not found!"
    echo "Please create .env file before deployment."
    exit 1
fi
log_success "Environment configuration found"

# Step 2: Install dependencies
log_info "Installing dependencies..."
npm ci --production=false
log_success "Dependencies installed"

# Step 3: Build application
log_info "Building application..."
npm run build
log_success "Application built successfully"

# Step 4: Run database migrations (unless skipped)
if [ "$SKIP_MIGRATIONS" = false ]; then
    log_info "Checking database migrations..."

    # Check migration status first
    npm run migrate:status

    # Ask for confirmation in interactive mode
    if [ -t 0 ]; then
        echo ""
        read -p "Do you want to run pending migrations? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Running database migrations..."
            npm run migrate
            log_success "Migrations completed"
        else
            log_warning "Migrations skipped by user"
        fi
    else
        # Non-interactive mode (CI/CD) - run automatically
        log_info "Running database migrations..."
        npm run migrate
        log_success "Migrations completed"
    fi
else
    log_warning "Skipping database migrations (--skip-migrations flag)"
fi

# Step 5: Restart application (if using PM2)
if command -v pm2 &> /dev/null; then
    log_info "Restarting application with PM2..."
    pm2 restart wyapar-backend || pm2 start dist/main.js --name wyapar-backend
    log_success "Application restarted"
else
    log_warning "PM2 not found. Please start the application manually:"
    echo "  npm run start:prod"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
log_success "Deployment completed successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Show running status
if command -v pm2 &> /dev/null; then
    pm2 status wyapar-backend
fi
