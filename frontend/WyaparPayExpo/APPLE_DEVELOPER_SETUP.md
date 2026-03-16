# 🍎 Apple Developer Account Setup for EAS Build

## ❌ **Current Issue**

```
Authentication with Apple Developer Portal failed!
You have no team associated with your Apple account, cannot proceed.
(Do you have a paid Apple Developer account?)
```

## ✅ **Solution Steps**

### **Step 1: Verify Apple Developer Account**

1. **Check your Apple Developer account:**
   - Go to: https://developer.apple.com/account/
   - Login with your Apple ID
   - Verify you have an **active paid membership** ($99/year)
   - Check membership status: Should show "Active" or "Current"

2. **Verify Team:**
   - In Apple Developer portal, go to "Membership"
   - Note your **Team ID** (format: `XXXXXXXXXX`)
   - Note your **Team Name** (your organization/individual name)

### **Step 2: Link Apple Developer Account to EAS**

**Option A: Automatic Linking (Recommended)**

```bash
cd frontend/WyaparPayExpo

# This will prompt you to authenticate with Apple
eas build:configure
```

When prompted:
- Select **iOS** platform
- Choose **"Set up credentials"** or **"Use existing credentials"**
- It will ask you to authenticate with Apple Developer account
- Enter your Apple ID credentials
- Grant permissions to EAS

**Option B: Manual Credential Setup**

```bash
# Configure iOS credentials manually
eas credentials

# Select: iOS
# Select: Set up new credentials
# Follow prompts to authenticate
```

### **Step 3: Verify Credentials**

```bash
# Check if credentials are set up
eas credentials --platform ios

# Should show:
# - Apple Team ID
# - Distribution Certificate
# - Provisioning Profile
```

### **Step 4: Alternative - Use Local Build (Skip Apple Developer)**

If you just want to test Android or skip iOS for now:

```bash
# Build only Android (no Apple Developer needed)
eas build --profile development --platform android

# Or use local build
eas build --profile development --platform android --local
```

---

## 🔍 **Troubleshooting**

### **Issue 1: "No team associated"**

**Solution:**
1. Make sure you have **paid Apple Developer account** ($99/year)
2. Free Apple ID won't work - you need paid membership
3. Check: https://developer.apple.com/account/ → Membership tab

### **Issue 2: "Cannot authenticate"**

**Solution:**
1. **Create App-Specific Password:**
   - Go to: https://appleid.apple.com/
   - Sign in → Security → App-Specific Passwords
   - Generate new password for "EAS Build"
   - Use this password when prompted

2. **Enable Two-Factor Authentication:**
   - Apple Developer requires 2FA
   - Enable it in Apple ID settings

### **Issue 3: "Team not found"**

**Solution:**
1. **Check Team ID:**
   ```bash
   # Get your Team ID from Apple Developer portal
   # Format: XXXXXXXXXX (10 characters)
   ```

2. **Manually set Team ID:**
   ```bash
   # In app.json or eas.json, add:
   "ios": {
     "config": {
       "appleTeamId": "YOUR_TEAM_ID_HERE"
     }
   }
   ```

### **Issue 4: "Credentials expired"**

**Solution:**
```bash
# Refresh credentials
eas credentials --platform ios

# Select: "Update existing credentials"
```

---

## 📋 **Quick Verification Checklist**

- [ ] Apple Developer account is **paid** ($99/year)
- [ ] Membership status is **Active**
- [ ] Team ID is visible in Apple Developer portal
- [ ] Two-Factor Authentication is enabled
- [ ] App-Specific Password created (if needed)
- [ ] EAS credentials configured: `eas credentials --platform ios`
- [ ] Team ID matches in both Apple Developer and EAS

---

## 🚀 **Quick Fix Commands**

### **1. Re-authenticate with Apple:**
```bash
cd frontend/WyaparPayExpo
eas credentials --platform ios
# Select: "Set up new credentials"
# Authenticate with Apple ID
```

### **2. Check Apple Developer Status:**
```bash
# Verify your account
eas account:view

# Check credentials
eas credentials --platform ios
```

### **3. Build Android Instead (No Apple Needed):**
```bash
# Skip iOS for now, build Android
eas build --profile development --platform android
```

---

## 📝 **Manual Credential Setup**

If automatic setup fails, set up manually:

### **1. Get Required Information:**
- **Apple Team ID**: From https://developer.apple.com/account/
- **Bundle Identifier**: `com.wyaparpay.app` (already in app.json)
- **Distribution Certificate**: EAS can generate this
- **Provisioning Profile**: EAS can generate this

### **2. Configure in EAS:**
```bash
eas credentials --platform ios

# Follow prompts:
# 1. Select "Set up new credentials"
# 2. Enter Apple Team ID when prompted
# 3. Authenticate with Apple ID
# 4. EAS will generate certificates automatically
```

### **3. Verify Setup:**
```bash
eas credentials --platform ios
# Should show all credentials configured
```

---

## 🎯 **Recommended Approach**

**For Now (Quick Solution):**
1. **Build Android first** (no Apple Developer needed):
   ```bash
   eas build --profile development --platform android
   ```

2. **Set up iOS later** when you have time to configure Apple credentials properly

**For Production:**
1. Complete Apple Developer account verification
2. Set up EAS credentials properly
3. Build iOS development client
4. Test on physical iOS device

---

## 📞 **Need Help?**

**EAS Support:**
- Docs: https://docs.expo.dev/build/introduction/
- Discord: https://chat.expo.dev/
- Email: support@expo.dev

**Apple Developer Support:**
- Portal: https://developer.apple.com/support/
- Status: https://developer.apple.com/system-status/

---

## ✅ **Next Steps**

1. **Verify Apple Developer account** is paid and active
2. **Run:** `eas credentials --platform ios`
3. **Authenticate** with Apple ID
4. **Try build again:** `eas build --profile development --platform ios`

**OR**

**Build Android first** (no Apple needed):
```bash
eas build --profile development --platform android
```

---

**The Android build should work fine without Apple Developer account!** 🚀

