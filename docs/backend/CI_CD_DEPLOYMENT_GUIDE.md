# 🚀 CI/CD Deployment Guide - IONOS VPS with Plesk

Complete guide for setting up automated deployment from GitHub to IONOS VPS.

---

## 📋 Prerequisites Checklist

### ✅ One-time Setup (On VPS)

#### 1. Install Node.js (if not already installed)

```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

#### 3. Install Git (if not already installed)

```bash
sudo apt update
sudo apt install -y git
```

#### 4. Set Up Application Directory (Monorepo)

```bash
# Example path (adjust based on your Plesk setup)
# Common Plesk paths:
# /var/www/vhosts/yourdomain.com/WyaparPay
# /home/plesk/yourdomain.com/WyaparPay
# /var/www/html/WyaparPay

# Create directory if it doesn't exist
mkdir -p /var/www/vhosts/yourdomain.com/WyaparPay
cd /var/www/vhosts/yourdomain.com/WyaparPay

# Clone repository (if not already cloned)
# git clone https://github.com/yourusername/WyaparPay.git .

# Or if already cloned, ensure you're on main branch
git checkout main
git pull origin main
```

#### 5. Initial Setup on VPS

```bash
# Navigate to backend directory (inside monorepo)
cd /var/www/vhosts/yourdomain.com/WyaparPay/backend

# Install dependencies
npm install

# Build the application
npm run build

# Copy environment file (create .env from env.example)
cp env.example .env

# Edit .env with production values
nano .env
# OR use Plesk's environment variable interface
```

#### 6. Start Application with PM2

```bash
# Navigate to backend directory
cd /var/www/vhosts/yourdomain.com/WyaparPay/backend

# Start using ecosystem config
pm2 start ecosystem.config.js --env production

# Or start manually (specify working directory)
pm2 start dist/main.js --name wyapar-backend --cwd $(pwd)

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually involves running a sudo command)
```

---

## 🔐 GitHub Secrets Setup

### Step 1: Generate SSH Key Pair

On your **local machine** (or CI/CD server):

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-ci-wyapar" -f ~/.ssh/github_ci_wyapar

# This creates:
# ~/.ssh/github_ci_wyapar (private key)
# ~/.ssh/github_ci_wyapar.pub (public key)
```

### Step 2: Add Public Key to VPS

```bash
# Display public key
cat ~/.ssh/github_ci_wyapar.pub

# Copy the output, then on VPS:
ssh user@your-vps-ip

# On VPS, add to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Test SSH Connection

```bash
# Test from local machine
ssh -i ~/.ssh/github_ci_wyapar user@your-vps-ip

# If successful, you should be logged into VPS
```

### Step 4: Add Secrets to GitHub

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `VPS_HOST` | Your VPS IP address or domain | `123.45.67.89` or `vps.yourdomain.com` |
| `VPS_USER` | SSH username | `root` or `plesk` or your username |
| `VPS_SSH_KEY` | **Private key content** (entire key) | Content of `~/.ssh/github_ci_wyapar` |
| `VPS_PORT` | SSH port (optional, default 22) | `22` |
| `REPO_PATH` | Full path to **repository root** (monorepo) | `/var/www/vhosts/yourdomain.com/WyaparPay` |

**⚠️ Important:**
- Copy the **entire private key** (including `-----BEGIN` and `-----END` lines)
- No quotes needed
- Keep the key secure - never commit it to the repository

---

## 📁 Project Structure on VPS

**Monorepo Structure:**
```
/var/www/vhosts/yourdomain.com/WyaparPay/  ← REPO_PATH (repository root)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/                    # Backend application
│   ├── dist/                  # Built files (after npm run build)
│   ├── src/                   # Source files
│   ├── ecosystem.config.js    # PM2 config
│   ├── package.json
│   └── .env                   # Environment variables (not in git)
├── frontend/                  # Frontend (not deployed via this workflow)
│   └── WyaparPayExpo/
├── docs/                      # Documentation
├── README.md
└── package.json (if exists at root)
```

**Important:** 
- `REPO_PATH` should point to the **repository root** (where `.github/`, `backend/`, `frontend/` folders are)
- The workflow will automatically navigate to `backend/` directory for npm commands
- Git commands run from the repository root

---

## 🔄 Deployment Workflow

### Automatic Deployment

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **GitHub Actions triggers:**
   - Checks out code
   - SSHs into VPS
   - Pulls latest code
   - Installs dependencies
   - Builds application
   - Restarts PM2 process

3. **Deployment completes** (usually 2-5 minutes)

### Manual Deployment (if needed)

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to backend
cd /var/www/vhosts/yourdomain.com/backend/backend

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build
npm run build

# Restart
pm2 restart wyapar-backend
```

---

## 🛠️ PM2 Management Commands

### Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs wyapar-backend

# View logs (last 100 lines)
pm2 logs wyapar-backend --lines 100

# Restart application
pm2 restart wyapar-backend

# Stop application
pm2 stop wyapar-backend

# Delete from PM2
pm2 delete wyapar-backend

# Monitor (real-time)
pm2 monit

# Save current process list
pm2 save

# Reload (zero-downtime)
pm2 reload wyapar-backend
```

---

## 🔒 Environment Variables

### Option 1: Using Plesk (Recommended)

1. **Plesk → Domains → yourdomain.com → Node.js**
2. **Environment Variables** section
3. Add variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   ...
   ```

### Option 2: Using .env File

```bash
# On VPS
cd /var/www/vhosts/yourdomain.com/backend/backend
nano .env

# Add all environment variables
# PM2 will automatically load .env file
```

### Option 3: System Environment

```bash
# Edit system environment
sudo nano /etc/environment

# Add variables
NODE_ENV=production
PORT=3000
...
```

---

## 🧪 Testing Deployment

### 1. Test SSH Connection

```bash
# From GitHub Actions (will be automatic)
# Or manually test:
ssh -i ~/.ssh/github_ci_wyapar user@your-vps-ip
```

### 2. Test Deployment Script

```bash
# SSH into VPS
ssh user@your-vps-ip

# Run deployment commands manually
cd /var/www/vhosts/yourdomain.com/backend/backend
git pull origin main
npm ci
npm run build
pm2 restart wyapar-backend
```

### 3. Verify Application

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs wyapar-backend --lines 50

# Test API endpoint
curl http://localhost:3000/health
```

---

## 🐛 Troubleshooting

### Issue: SSH Connection Failed

**Solution:**
```bash
# Test SSH manually
ssh -i ~/.ssh/github_ci_wyapar user@your-vps-ip

# Check if public key is in authorized_keys
ssh user@your-vps-ip "cat ~/.ssh/authorized_keys"

# Verify permissions
ssh user@your-vps-ip "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

### Issue: Git Pull Failed

**Solution:**
```bash
# Check git remote
cd /var/www/vhosts/yourdomain.com/backend
git remote -v

# Ensure you have access
git fetch origin main

# Check branch
git branch
```

### Issue: Build Failed

**Solution:**
```bash
# Check Node.js version
node --version

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

### Issue: PM2 Not Starting

**Solution:**
```bash
# Check if process exists
pm2 list

# Check logs
pm2 logs wyapar-backend

# Try starting manually
cd /var/www/vhosts/yourdomain.com/backend/backend
node dist/main.js

# Check for errors in console
```

### Issue: Application Not Accessible

**Solution:**
```bash
# Check if app is running
pm2 status

# Check if port is listening
netstat -tulpn | grep 3000

# Check firewall
sudo ufw status

# Check Plesk Node.js settings
# Plesk → Domains → Node.js → Application Root
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
pm2 logs wyapar-backend

# Last 100 lines
pm2 logs wyapar-backend --lines 100

# Error logs only
pm2 logs wyapar-backend --err

# Application logs (if configured)
tail -f /var/www/vhosts/yourdomain.com/backend/backend/logs/pm2-out.log
tail -f /var/www/vhosts/yourdomain.com/backend/backend/logs/pm2-error.log
```

### Monitor Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
# or
top
```

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to backend
cd /var/www/vhosts/yourdomain.com/backend/backend

# Check git log
git log --oneline -10

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Rebuild
npm run build

# Restart
pm2 restart wyapar-backend
```

---

## ✅ Deployment Checklist

Before first deployment:

- [ ] Node.js installed on VPS
- [ ] PM2 installed and configured
- [ ] Git repository cloned on VPS
- [ ] SSH key pair generated
- [ ] Public key added to VPS authorized_keys
- [ ] Private key added to GitHub Secrets
- [ ] All GitHub Secrets configured
- [ ] Environment variables set (Plesk or .env)
- [ ] Application builds successfully on VPS
- [ ] PM2 can start application
- [ ] Application accessible via HTTP

---

## 🚀 Next Steps

1. **Set up GitHub Secrets** (see above)
2. **Test deployment** by pushing to main branch
3. **Monitor first deployment** in GitHub Actions
4. **Verify application** is running correctly
5. **Set up monitoring** (optional: Sentry, DataDog, etc.)

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [IONOS VPS Documentation](https://www.ionos.com/help/)
- [Plesk Node.js Guide](https://docs.plesk.com/)

---

**Last Updated:** December 14, 2025

