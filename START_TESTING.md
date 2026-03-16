# 🧪 MULTILINGUAL TESTING GUIDE

## 🚀 Quick Start

### 1. Start Backend
```bash
cd /Users/singhdigvijay/Documents/GitHub/WyaparPay/Wyapar/backend
npm run start:dev
```

### 2. Start Frontend
```bash
cd /Users/singhdigvijay/Documents/GitHub/WyaparPay/Wyapar/frontend/WyaparPayExpo
npm start
```

### 3. Open on Device
- Scan QR code with Expo Go app
- Or press `i` for iOS Simulator
- Or press `a` for Android Emulator

---

## 📱 TESTING METHODS

### Method 1: Auto-Detection (Device Language)

**iOS:**
1. Settings → General → Language & Region
2. Add Language → हिंदी (Hindi) or ಕನ್ನಡ (Kannada)
3. Select as primary language
4. Open WyaparPay app
5. **All screens auto-translate!**

**Android:**
1. Settings → System → Languages
2. Add language → हिंदी or ಕನ್ನಡ
3. Drag to top as default
4. Open WyaparPay app
5. **All screens auto-translate!**

### Method 2: In-App Switching (After adding Language Selector)

1. Open app in English
2. Login
3. Go to Profile → Preferences
4. Scroll to "Language" section
5. Select Hindi or Kannada
6. **App instantly switches!**

### Method 3: Developer Testing (Code)

Add to any screen temporarily:
```typescript
import i18n from './src/i18n';

// Test buttons
<Button title="Hindi" onPress={() => i18n.changeLanguage('hi')} />
<Button title="Kannada" onPress={() => i18n.changeLanguage('kn')} />
<Button title="English" onPress={() => i18n.changeLanguage('en')} />
```

---

## ✅ TESTING CHECKLIST

### All Screens (12/12)

#### Auth Flow
- [ ] **LandingScreen**
  - [ ] English: "Welcome to WyaparPay"
  - [ ] Hindi: "व्यापार पे में आपका स्वागत है"
  - [ ] Kannada: "ವ್ಯಾಪಾರ ಪೇಗೆ ಸ್ವಾಗತ"

- [ ] **LoginScreen**
  - [ ] All buttons translated
  - [ ] Password toggle works
  - [ ] Forms accept input in all languages

- [ ] **RegisterScreen**
  - [ ] All fields translated
  - [ ] Validation messages in correct language
  - [ ] Helper text shows properly

- [ ] **OtpLoginScreen** & **OtpVerifyScreen**
  - [ ] Instructions translated
  - [ ] OTP input works

- [ ] **EmailVerifyScreen**
  - [ ] Email instructions translated
  - [ ] Resend button translated

#### Dashboard
- [ ] **DashboardScreen**
  - [ ] Greeting shows in correct language
  - [ ] Wallet balance label translated
  - [ ] All section titles translated
  - [ ] Quick actions labeled correctly
  - [ ] Recharge & Bills section translated
  - [ ] Recent transactions translated

#### Profile
- [ ] **AccountDetailsScreen**
  - [ ] Title translated
  - [ ] Menu items translated
  - [ ] Status (Verified/Pending) shows correctly

- [ ] **PreferencesScreen**
  - [ ] All toggles labeled correctly
  - [ ] Language Selector shows (if added)
  - [ ] Biometric option translated

- [ ] **SecurityScreen**
  - [ ] Security options translated
  - [ ] Descriptions show correctly

#### Recharge Flow
- [ ] **RechargeEntryScreen**
  - [ ] Title translated
  - [ ] Input placeholders translated
  - [ ] Operator/Circle labels correct

- [ ] **RechargePlansScreen**
  - [ ] Category tabs translated (Popular, Data, Unlimited)
  - [ ] Plan details show correctly
  - [ ] "Validity" label appears
  - [ ] Custom amount placeholder translated

- [ ] **RechargeReviewScreen**
  - [ ] Review title translated
  - [ ] Payment method labels translated
  - [ ] "Pay" button shows amount correctly

- [ ] **RechargeStatusScreen**
  - [ ] Success message in correct language
  - [ ] Failure message in correct language
  - [ ] Action buttons translated

---

## 🎯 SPECIFIC TESTS

### Test 1: Language Persistence
1. Open app in Hindi
2. Close app completely
3. Reopen app
4. **Expected**: App should remember Hindi preference

### Test 2: Mid-Flow Language Switch
1. Start recharge in English
2. Switch to Hindi (if selector added)
3. Continue recharge
4. **Expected**: All subsequent screens in Hindi

### Test 3: Form Validation
1. Switch to Kannada
2. Try to register with invalid phone
3. **Expected**: Error message in Kannada

### Test 4: Device Language Override
1. Device in Hindi
2. Open app (should be Hindi)
3. Change in-app to English
4. **Expected**: App stays in English

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Translations not showing
**Fix**: 
```bash
cd frontend/WyaparPayExpo
rm -rf node_modules
npm install
npm start -- --clear
```

### Issue: Language not switching
**Check**:
1. Is i18n initialized in App.tsx?
   ```typescript
   import './src/i18n';
   ```
2. Are translation files in correct location?
   ```
   src/i18n/locales/en/
   src/i18n/locales/hi/
   src/i18n/locales/kn/
   ```

### Issue: Some strings still in English
**Fix**: Search for hardcoded strings and replace with `t('key')`

---

## 📸 SCREENSHOTS TO VERIFY

Take screenshots of:
1. Landing screen in all 3 languages
2. Dashboard in all 3 languages
3. Recharge flow in Hindi
4. Profile in Kannada
5. Language Selector (if added)

---

## 🎊 SUCCESS CRITERIA

✅ **Pass** if:
- All 12 screens show translated text
- Language switching works smoothly
- No hardcoded English strings remain
- Forms work in all languages
- Error messages appear in correct language
- Numbers and currency format correctly (₹)

❌ **Fail** if:
- Any screen shows English when other language selected
- Language switching causes crash
- Text overflows or truncates badly
- Forms don't accept input
- Translations are gibberish or incorrect

---

## 🚀 START TESTING NOW!

```bash
# Terminal 1: Start Backend
cd backend && npm run start:dev

# Terminal 2: Start Frontend
cd frontend/WyaparPayExpo && npm start
```

**Then**:
1. Change device language to Hindi
2. Open app
3. Navigate through all screens
4. Verify translations
5. Switch to Kannada
6. Repeat

---

**Happy Testing!** 🎉🧪

**Questions?** Check `/docs/I18N_100_PERCENT_COMPLETE.md` for complete documentation.

