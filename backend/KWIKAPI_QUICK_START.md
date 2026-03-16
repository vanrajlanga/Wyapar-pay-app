# KWIKAPI Quick Start Guide

Get KWIKAPI mobile recharge working in 5 minutes! ⚡

**Status:** ✅ Operator Detection & Plans API WORKING

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Start Backend

```bash
cd /Volumes/Krishna/Krishna/wyapar-pay/Wyapar/backend
npm run start:dev
```

**Wait for:**
```
✅ KWIKAPI Configuration:
   - Environment: uat
   - Base URL: https://uat.kwikapi.com
   - API Key: 13846b...
✅ KWIKAPI Service initialized successfully
```

### Step 2: Start Website

```bash
cd /Volumes/Krishna/Krishna/wyapar-pay/website
npm run dev
```

Opens at: http://localhost:3001

**That's it! KWIKAPI is now running.** 🎉

---

## 🧪 Test It Now (Working Flow)

### Test 1: Login
- Go to: http://localhost:3001/login
- Email: `admin@wyaparpay.com`
- Password: `admin`

### Test 2: Operator Detection ✅

1. Navigate to: http://localhost:3001/recharge
2. Enter mobile: `7070300613`
3. Click "Detect" button

**Expected Result:**
```
✓ Detected: VI in Bihar (BR)
Circle: Bihar (BR)
```

**Browser Console:**
```javascript
✅ Detection Response: {
  operatorCode: "VI",
  operatorId: "3",      // ← KWIKAPI operator ID
  circleCode: "17",     // ← KWIKAPI circle code
  circleName: "Bihar (BR)"
}
💾 Stored in context + sessionStorage
```

### Test 3: Browse Plans ✅

1. Click "Browse Plans" button
2. Should navigate to: http://localhost:3001/recharge/plans

**Expected Result:**
```
Loading plans from KWIKAPI...
✅ 113 plans displayed!
```

**Browser Console:**
```javascript
🔍 Fetching plans with KWIKAPI data: {
  operatorId: "3",
  circleCode: "17",
  category: "POPULAR"
}
✅ Fetched 113 plans from KWIKAPI
```

**Backend Logs:**
```
📥 getPlans called with parameters: {
  operatorCode: 'VI',
  operatorId: '3',
  circleCode: '17'
}
✅ Found 113 plans for IDEA in BIHAR
💰 Credit Balance: 9993
```

### Test 4: Category Filtering ✅

- Click "Data" tab → Shows DATA plans
- Click "Unlimited" tab → Shows UNLIMITED plans
- Click "Talktime" tab → Shows TALKTIME plans
- Click "Popular" tab → Shows POPULAR plans

### Test 5: Plan Selection ✅

1. Click any plan
2. Click "Select" button
3. Should navigate to review page

---

## 🎯 What's Working

| Feature | Status | Endpoint |
|---------|--------|----------|
| Operator Detection | ✅ WORKING | POST /api/v2/operator_fetch_v2.php |
| Plans Fetching | ✅ WORKING | POST /api/v2/recharge_plans.php |
| Category Filtering | ✅ WORKING | - |
| Plan Selection | ✅ WORKING | - |
| Dual Persistence | ✅ WORKING | Context + SessionStorage |
| Mobile App | ✅ WORKING | React Native integration |

---

## 📱 Test on Mobile App

### Step 1: Start Metro Bundler

```bash
cd /Volumes/Krishna/Krishna/wyapar-pay/Wyapar/frontend/WyaparPayExpo
npm start
```

### Step 2: Open in Expo Go

- Scan QR code with Expo Go app
- Navigate to Recharge screen
- Enter mobile: `7070300613`
- Auto-detects operator
- Browse plans → See 113 real plans from KWIKAPI

---

## 🔍 Debug Tips

### If Detection Doesn't Work:

**Check 1: Backend Running?**
```bash
curl http://localhost:3000/api/v1/health
```

**Check 2: Console Logs**
Open browser DevTools → Console tab
Look for detection response with operatorId

**Check 3: Backend Logs**
Check terminal running backend
Look for KWIKAPI service initialization

### If Plans Don't Load:

**Check 1: SessionStorage**
In browser console:
```javascript
console.log({
  operatorId: sessionStorage.getItem('recharge_operatorId'),
  circleCode: sessionStorage.getItem('recharge_circleCode'),
});
```

**Check 2: Backend Receives Parameters**
Backend logs should show:
```
📥 getPlans called with parameters: { operatorId: '3', circleCode: '17' }
```

**Check 3: Network Tab**
Check request URL includes:
```
/recharge/plans?operatorCode=VI&operatorId=3&circleCode=17
```

---

## 📊 Current Status

**Completed:**
- ✅ Backend KWIKAPI integration
- ✅ Operator Detection API (with MNP)
- ✅ Plans API (113 real plans)
- ✅ Website integration (dual persistence fix)
- ✅ Mobile app integration
- ✅ Category filtering
- ✅ Plan selection
- ✅ UI text visibility fix

**Next Steps:**
- ⏳ Integrate Recharge Processing API
- ⏳ Integrate Transaction Status API
- ⏳ Production testing

---

## 🎉 Success Criteria

You know it's working when:

1. ✅ Detection shows: "Detected: VI in Bihar (BR)"
2. ✅ Plans page displays 113 real plans
3. ✅ Category tabs switch between plan types
4. ✅ All text is visible (no white-on-white)
5. ✅ Backend logs show: "✅ Fetched 113 plans from KWIKAPI"
6. ✅ Browser console shows: "✅ Fetched 113 plans from KWIKAPI"

---

## 📚 More Documentation

- `KWIKAPI_STATUS.md` - Full integration status
- `KWIKAPI_OPERATOR_DETECTION_COMPLETE.md` - Detection API details
- `KWIKAPI_PLANS_INTEGRATION.md` - Plans API details
- `PLANS_API_FIX_SUMMARY.md` - Recent bug fixes
- `PLANS_INTEGRATION_TEST_STEPS.md` - Detailed testing guide

---

## ⚡ Quick Commands Reference

```bash
# Start backend
cd Wyapar/backend && npm run start:dev

# Start website
cd website && npm run dev

# Start mobile app
cd Wyapar/frontend/WyaparPayExpo && npm start

# Check backend health
curl http://localhost:3000/api/v1/health

# Test detection (requires JWT token)
curl -X POST http://localhost:3000/api/v1/recharge/detect-operator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"mobileNumber":"7070300613"}'
```

---

**Last Updated:** 2026-01-22
**Credit Balance:** ₹9,993
**Status:** ✅ WORKING - Detection & Plans APIs fully functional
**Next:** Integrate Recharge Processing API
