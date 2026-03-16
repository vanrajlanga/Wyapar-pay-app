# 🧪 TESTING GUIDE - Multilingual WyaparPay

## 🚀 Servers Status

✅ **Backend**: Starting on `http://localhost:3000`
✅ **Frontend**: Starting with Expo

---

## 📱 How to Open the App

### Option 1: Physical Device (Recommended)
1. Open **Expo Go** app on your iPhone/Android
2. Scan the QR code from terminal
3. App will load on your device

### Option 2: iOS Simulator
1. Press `i` in the terminal
2. App opens in iOS Simulator

### Option 3: Android Emulator
1. Press `a` in the terminal
2. App opens in Android Emulator

---

## 🌐 MULTILINGUAL TESTING

### Test 1: Auto-Detection (Device Language)

**On iPhone:**
```
1. Go to Settings → General → Language & Region
2. Tap "Add Language"
3. Select "हिंदी" (Hindi) or "ಕನ್ನಡ" (Kannada)
4. Set as primary language
5. Open WyaparPay app
✅ Expected: App should automatically show in selected language
```

**On Android:**
```
1. Go to Settings → System → Languages & input → Languages
2. Tap "Add a language"
3. Select "हिंदी (भारत)" or "ಕನ್ನಡ (ಭಾರತ)"
4. Drag to top to make it default
5. Open WyaparPay app
✅ Expected: App should automatically show in selected language
```

---

## ✅ TESTING CHECKLIST

### 🔐 Auth Flow (6 screens)

#### 1. **LandingScreen**
- [ ] Welcome message in correct language
- [ ] "Get Started" button translated
- [ ] Brand name "WyaparPay" shows correctly

**Test**: Change language, restart app, verify translations

#### 2. **LoginScreen**
- [ ] "Login with Password" button translated
- [ ] "Login with OTP" button translated
- [ ] "Login with Face ID" button translated (if available)
- [ ] Input placeholders translated
- [ ] Password show/hide icon works

**Test**: Try switching languages and verify all text changes

#### 3. **RegisterScreen**
- [ ] All form labels translated
- [ ] Helper text shows in correct language
- [ ] Password validation messages translated
- [ ] "Register" button translated

**Test**: Try invalid inputs, check error messages language

#### 4. **OtpLoginScreen**
- [ ] Title translated
- [ ] Input placeholder translated
- [ ] "Send OTP" button translated

#### 5. **OtpVerifyScreen**
- [ ] Instructions translated
- [ ] "Verify OTP" button translated
- [ ] "Resend OTP" link translated

#### 6. **EmailVerifyScreen**
- [ ] Title translated
- [ ] Instructions translated
- [ ] "Verify Email" button translated
- [ ] "Resend Code" link translated

---

### 🏠 Dashboard (1 screen)

#### 7. **DashboardScreen**
- [ ] Greeting shows in correct language
- [ ] "Wallet Balance" label translated
- [ ] "Add Money" button translated
- [ ] "Special Offers" section title translated
- [ ] "Quick Actions" section title translated
- [ ] All quick action labels translated:
  - [ ] Mobile Recharge
  - [ ] DTH Recharge
  - [ ] Electricity Bill
  - [ ] Credit Card Bill
- [ ] "Recharge & Bills" section title translated
- [ ] "Recent Activity" section title translated
- [ ] "View All" links translated

**Test**: Navigate through all sections, verify all text

---

### 👤 Profile & Settings (3 screens)

#### 8. **AccountDetailsScreen**
- [ ] "Account Details" title translated
- [ ] Status shows correctly (Verified/Pending Verification)
- [ ] Menu items translated:
  - [ ] Preferences
  - [ ] Security
  - [ ] About WyaparPay
- [ ] "Log Out" button translated

#### 9. **PreferencesScreen**
- [ ] "Preferences" title translated
- [ ] "Biometric Login" label translated
- [ ] "Email Notifications" translated
- [ ] "Push Notifications" translated
- [ ] "SMS Notifications" translated
- [ ] Toggles work correctly

**Test**: Toggle switches and verify haptic feedback

#### 10. **SecurityScreen**
- [ ] "Security" title translated
- [ ] "Change Password" option translated
- [ ] "Two-Factor Authentication" translated
- [ ] "Active Sessions" translated

---

### 💳 Recharge Flow (4 screens)

#### 11. **RechargeEntryScreen**
- [ ] "Mobile Recharge" title translated
- [ ] "Mobile Number" input translated
- [ ] "Select Operator" translated
- [ ] "Select Circle" translated
- [ ] Circle names display correctly
- [ ] "Continue to Plans" button translated

**Test**: Enter mobile number, verify operator detection

#### 12. **RechargePlansScreen**
- [ ] "Select Plan" title translated
- [ ] Category tabs translated (Popular, Data, Unlimited)
- [ ] "Validity:" label shows correctly
- [ ] Plan details readable
- [ ] "Custom Amount" input translated
- [ ] Plan benefits show correctly

**Test**: Select different categories, view plan details

#### 13. **RechargeReviewScreen**
- [ ] "Review & Pay" title translated
- [ ] "Recharge Amount" label translated
- [ ] "Operator" label translated
- [ ] "Circle" label translated
- [ ] "Payment Method" label translated
- [ ] "Pay ₹XXX" button shows correctly

#### 14. **RechargeStatusScreen**
- [ ] Success message translated
- [ ] Failure message translated
- [ ] "Transaction ID" label translated
- [ ] Action buttons translated

---

## 🎯 SPECIFIC TESTS

### Test A: Language Consistency
```
1. Start app in English
2. Navigate to Dashboard
3. Go to Profile → Preferences
4. (If Language Selector added) Switch to Hindi
5. Navigate back to Dashboard
✅ Expected: All text should be in Hindi
6. Go to Recharge flow
✅ Expected: All recharge screens in Hindi
```

### Test B: Form Validation
```
1. Switch device to Kannada
2. Open app
3. Go to Register screen
4. Try to register with invalid phone
✅ Expected: Error message in Kannada
5. Try with invalid email
✅ Expected: Error message in Kannada
```

### Test C: Number Formatting
```
1. View Dashboard in English
2. Check wallet balance: Should show "₹1,250"
3. Switch to Hindi
4. Check wallet balance: Should show "₹१,२५०"
```

### Test D: Date Formatting
```
1. View Dashboard Recent Activity in English
2. Should show: "Today, 10:30 AM"
3. Switch to Hindi
4. Should show: Hindi date format
```

---

## 🐛 ISSUES TO LOOK FOR

### Visual Issues
- [ ] Text overflow or truncation
- [ ] Buttons too small for text
- [ ] Misaligned labels
- [ ] Icons overlapping text
- [ ] Whitespace issues

### Functional Issues
- [ ] Language not switching
- [ ] Wrong language showing
- [ ] Missing translations (shows keys)
- [ ] Formatting incorrect
- [ ] Numbers not localized

### UX Issues
- [ ] Inconsistent translations
- [ ] Grammatical errors
- [ ] Context-inappropriate translations
- [ ] Mixed languages on same screen

---

## 📸 SCREENSHOT CHECKLIST

Take screenshots of:
1. ✅ Landing screen (all 3 languages)
2. ✅ Dashboard (all 3 languages)
3. ✅ Recharge flow (Hindi)
4. ✅ Profile screens (Kannada)
5. ✅ Any issues found

---

## ✅ SUCCESS CRITERIA

**Pass if:**
- ✅ All 12 screens show translated text
- ✅ Language switching works smoothly
- ✅ No English text when other language selected
- ✅ Forms work in all languages
- ✅ Error messages in correct language
- ✅ Currency shows ₹ correctly
- ✅ No visual overflow issues
- ✅ All buttons clickable and work

**Critical Issues (Must Fix):**
- ❌ App crashes on language switch
- ❌ Forms don't accept input
- ❌ Major text overflow
- ❌ Wrong language after switching

**Minor Issues (Good to Fix):**
- ⚠️ Slight text truncation
- ⚠️ Minor alignment issues
- ⚠️ Translation refinements

---

## 🎊 EXPECTED RESULTS

### English (Current Default)
```
Landing: "Welcome to WyaparPay"
Dashboard: "Wallet Balance", "Quick Actions"
Recharge: "Mobile Recharge", "Select Plan"
Profile: "Account Details", "Preferences"
```

### Hindi (हिंदी)
```
Landing: "व्यापार पे में आपका स्वागत है"
Dashboard: "वॉलेट बैलेंस", "त्वरित क्रियाएं"
Recharge: "मोबाइल रिचार्ज", "प्लान चुनें"
Profile: "खाता विवरण", "प्राथमिकताएं"
```

### Kannada (ಕನ್ನಡ)
```
Landing: "ವ್ಯಾಪಾರ ಪೇಗೆ ಸ್ವಾಗತ"
Dashboard: "ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್", "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು"
Recharge: "ಮೊಬೈಲ್ ರೀಚಾರ್ಜ್", "ಯೋಜನೆ ಆಯ್ಕೆಮಾಡಿ"
Profile: "ಖಾತೆ ವಿವರಗಳು", "ಆದ್ಯತೆಗಳು"
```

---

## 🆘 TROUBLESHOOTING

### Issue: App not loading
**Fix**: 
```bash
cd frontend/WyaparPayExpo
npm start -- --clear
```

### Issue: Translations not showing
**Check**:
1. Is device language set correctly?
2. Did app restart after language change?
3. Check terminal for errors

### Issue: Backend not responding
**Check**:
```bash
# Check if backend is running
curl http://localhost:3000/api/v1/health

# If not, restart:
cd backend
npm run start:dev
```

---

## 📊 REPORT FORMAT

After testing, note:
```
✅ Working:
- Landing screen (all languages)
- Dashboard (all languages)
- ...

⚠️ Minor Issues:
- Text slightly truncated in Hindi on button X
- ...

❌ Critical Issues:
- None found (hopefully!)
```

---

## 🎉 YOU'RE READY!

**The app should be starting now!**

1. **Check terminal** for QR code
2. **Scan with Expo Go** on your device
3. **Start testing** with checklist above
4. **Report results**

**Happy Testing!** 🧪🚀

---

**Pro Tip**: Test one flow completely in one language before switching. This helps identify language-specific vs general issues.


