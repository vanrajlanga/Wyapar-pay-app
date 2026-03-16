# 🚀 CI/CD Quick Start Checklist

Quick action items to get CI/CD working for WyaparPay backend.

---

## ✅ Action Items You Can Do Now

### 1. 📝 Create GitHub Secrets (5 minutes)

**Step-by-Step Instructions:**

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/yourusername/WyaparPay` (replace with your repo)

2. **Click on "Settings"** (top menu bar of the repository)

3. **In the left sidebar, click "Secrets and variables"**
   - You'll see a dropdown menu

4. **Click "Actions"** (under "Secrets and variables")
   - This opens the Actions secrets page

5. **Click "New repository secret"** (green button on the right)

6. **Add each secret one by one:**

   **Secret 1: VPS_HOST**
   - Name: `VPS_HOST`
   - Secret: Your VPS IP address (e.g., `123.45.67.89`) or domain (e.g., `vps.yourdomain.com`)
   - Click "Add secret"

   **Secret 2: VPS_USER**
   - Name: `VPS_USER`
   - Secret: SSH username (usually `root` or your Plesk username)
   - Click "Add secret"

   **Secret 3: VPS_SSH_KEY**
   - First, generate SSH key on your local machine:
     ```bash
     ssh-keygen -t ed25519 -C "github-ci-wyapar" -f ~/.ssh/github_ci_wyapar
     ```
   - Copy the **private key** (entire content):
     ```bash
     cat ~/.ssh/github_ci_wyapar
     ```
   - Copy everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`
   - Name: `VPS_SSH_KEY`
   - Secret: Paste the entire private key content
   - Click "Add secret"

   **Secret 4: VPS_PORT** (Optional)
   - Name: `VPS_PORT`
   - Secret: `22` (default SSH port)
   - Click "Add secret"

   **Secret 5: REPO_PATH**
   - Name: `REPO_PATH`
   - Secret: Full path to **repository root** (monorepo root, not backend folder)
     - Example: `/var/www/vhosts/yourdomain.com/WyaparPay`
     - Or: `/home/plesk/yourdomain.com/WyaparPay`
     - Or: `/var/www/html/WyaparPay`
     - **Important:** This is the root of the monorepo where `.github/`, `backend/`, and `frontend/` folders are located
   - Click "Add secret"
   
   **📁 Project Structure on VPS:**
   ```
   /var/www/vhosts/yourdomain.com/WyaparPay/  ← REPO_PATH (repository root)
   ├── .github/
   │   └── workflows/
   │       └── deploy.yml
   ├── backend/          ← Backend code (npm commands run here)
   │   ├── package.json
   │   ├── src/
   │   └── dist/
   ├── frontend/         ← Frontend code (not deployed via this workflow)
   └── README.md
   ```

**📋 Summary Table:**

| Secret Name | What to Add | Example Value |
|------------|-------------|---------------|
| `VPS_HOST` | Your VPS IP or domain | `123.45.67.89` or `vps.yourdomain.com` |
| `VPS_USER` | SSH username | `root` or `plesk` |
| `VPS_SSH_KEY` | Private SSH key (full content) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port | `22` |
| `APP_PATH` | Backend directory path | `/var/www/vhosts/yourdomain.com/backend/backend` |

**🔑 Generate SSH Key (if not done):**
```bash
# Generate key pair
ssh-keygen -t ed25519 -C "github-ci-wyapar" -f ~/.ssh/github_ci_wyapar

# View public key (copy this to VPS later)
cat ~/.ssh/github_ci_wyapar.pub

# View private key (copy this to GitHub Secret VPS_SSH_KEY)
cat ~/.ssh/github_ci_wyapar
```

**⚠️ Important Notes:**
- You don't need to create an "Environment" - just add "Repository secrets"
- Secrets are encrypted and only visible when you add them
- Once saved, you can't view the secret value again (only update or delete)
- The private key should include the BEGIN and END lines

---

### 2. 🔑 Set Up SSH Access on VPS (10 minutes)

**On your VPS (via SSH or Plesk terminal):**

```bash
# Add public key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Test connection (from your local machine)
ssh -i ~/.ssh/github_ci_wyapar user@your-vps-ip
```

---

### 3. 📦 Install Prerequisites on VPS (15 minutes)

**SSH into VPS and run:**

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Verify
node --version
npm --version
pm2 --version
```

---

### 4. 📁 Set Up Application Directory (10 minutes)

**On VPS:**

```bash
# Navigate to your domain directory (adjust path)
cd /var/www/vhosts/yourdomain.com

# Clone repository (if not already)
git clone https://github.com/yourusername/WyaparPay.git backend

# Or if already exists, ensure it's up to date
cd backend
git checkout main
git pull origin main

# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Build application
npm run build

# Create .env file from example
cp env.example .env
nano .env  # Edit with production values
```

---

### 5. 🚀 Start Application with PM2 (5 minutes)

**On VPS:**

```bash
cd /var/www/vhosts/yourdomain.com/backend/backend

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions (usually run a sudo command)

# Verify it's running
pm2 status
pm2 logs wyapar-backend
```

---

### 6. ✅ Test Deployment (2 minutes)

**Push to main branch:**

```bash
git add .
git commit -m "Add CI/CD configuration"
git push origin main
```

**Check GitHub Actions:**
- Go to: GitHub Repo → Actions tab
- Watch the deployment workflow run
- Verify it completes successfully

---

## 📋 Pre-Deployment Checklist

Before first deployment, verify:

- [ ] GitHub Secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY, APP_PATH)
- [ ] SSH key added to VPS authorized_keys
- [ ] Node.js installed on VPS (v18+)
- [ ] PM2 installed on VPS
- [ ] Repository cloned on VPS
- [ ] Application builds successfully (`npm run build`)
- [ ] PM2 can start application
- [ ] Environment variables set (.env or Plesk)
- [ ] Application accessible (test `/health` endpoint)

---

## 🎯 What Happens After Setup

Once configured, every push to `main` branch will:

1. ✅ Trigger GitHub Actions
2. ✅ SSH into VPS
3. ✅ Pull latest code
4. ✅ Install dependencies
5. ✅ Build application
6. ✅ Restart PM2 process
7. ✅ Show deployment status

**Deployment time:** Usually 2-5 minutes

---

## 🆘 Quick Troubleshooting

### SSH Connection Failed
```bash
# Test manually
ssh -i ~/.ssh/github_ci_wyapar user@your-vps-ip

# Check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Build Failed
```bash
# On VPS, check Node version
node --version  # Should be 18.x or higher

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PM2 Not Starting
```bash
# Check logs
pm2 logs wyapar-backend

# Try starting manually
cd /path/to/backend/backend
node dist/main.js
```

---

## 📚 Full Documentation

For detailed setup instructions, see:
- `docs/backend/CI_CD_DEPLOYMENT_GUIDE.md` - Complete guide

---

**Ready to deploy?** Complete the action items above and push to main! 🚀

