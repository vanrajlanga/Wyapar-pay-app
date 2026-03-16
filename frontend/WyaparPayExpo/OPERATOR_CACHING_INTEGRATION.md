# Mobile App - Operator Caching Integration

## 🎯 Overview

The mobile app now integrates with the operator caching system that stores KWIKAPI operator data in the database. This eliminates the need to hit rate-limited KWIKAPI APIs repeatedly.

---

## ✅ What Was Integrated

### 1. **Updated Constants** (`src/constants/index.ts`)
Added new API endpoints:
- `GET_ALL_OPERATORS`: `/recharge/all-operators` - Get cached operators from database
- `FETCH_AND_STORE_OPERATORS`: `/recharge/fetch-operators` - Admin: Sync from KWIKAPI
- `GET_ALL_CIRCLES`: `/recharge/all-circles` - Get cached circles from database
- `FETCH_AND_STORE_CIRCLES`: `/recharge/fetch-circles` - Admin: Sync from KWIKAPI

### 2. **Updated Operator Constants** (`src/constants/operators.ts`)
- Added `kwikApiOperatorId` field to `OperatorInfo` interface
- Updated all operator configurations with correct KWIKAPI operator IDs:
  - **AIRTEL** = `"1"`
  - **JIO** = `"8"` (Reliance Jio)
  - **VI** = `"3"`
  - **BSNL** = `"4"` (Bsnl Topup)
  - **MTNL** = `"14"`

### 3. **Updated Types** (`src/types/recharge.ts`)
Enhanced `Operator` interface with database fields:
```typescript
export interface Operator {
  code: string;
  name: string;
  logo?: string;
  isActive?: boolean;
  operatorId?: string; // KWIKAPI operator ID from database
  serviceType?: string;
  amountMinimum?: number;
  amountMaximum?: number;
}
```

### 4. **New Service Methods** (`src/services/recharge.service.ts`)
Added methods for operator and circle caching:

#### `getAllOperatorsFromDB(accessToken: string)`
- Fetches operators from database (cached from KWIKAPI)
- Returns operator IDs, names, service types, min/max amounts
- **No rate limit** - reads from database

#### `fetchAndStoreOperators(accessToken: string)`
- Syncs operators from KWIKAPI to database
- **Admin only** - 15 hits/day limit
- Returns count of operators stored

#### `getAllCircles(accessToken: string)`
- Fetches circles from database (cached from KWIKAPI)
- Returns circle codes and names
- **No rate limit** - reads from database

#### `fetchAndStoreCircles(accessToken: string)`
- Syncs circles from KWIKAPI to database
- **Admin only** - 2 hits/day limit
- Returns count of circles stored

---

## 🚀 How to Use in Mobile App

### **1. Get Operators from Database**

```typescript
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { accessToken } = useAuth();
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        // Get cached operators from database (no rate limit!)
        const dbOperators = await rechargeService.getAllOperatorsFromDB(accessToken);

        console.log('Operators from database:', dbOperators);
        // Example: [
        //   {
        //     operatorId: "1",
        //     operatorName: "Airtel",
        //     serviceType: "Prepaid",
        //     amountMinimum: 10,
        //     amountMaximum: 10000
        //   },
        //   {
        //     operatorId: "8",
        //     operatorName: "Reliance Jio",
        //     serviceType: "Prepaid",
        //     amountMinimum: 10,
        //     amountMaximum: 10000
        //   }
        // ]

        setOperators(dbOperators);
      } catch (error) {
        console.error('Failed to load operators:', error);
      }
    };

    loadOperators();
  }, [accessToken]);

  return (
    // Your UI here
  );
};
```

### **2. Use Operator IDs from Static Constants**

```typescript
import { OPERATORS, getOperatorByCode } from '../constants/operators';

// Get operator info with KWIKAPI ID
const airtelInfo = getOperatorByCode('AIRTEL');
console.log(airtelInfo.kwikApiOperatorId); // "1"

const jioInfo = OPERATORS.JIO;
console.log(jioInfo.kwikApiOperatorId); // "8"
```

### **3. Manual Operator Selection with Correct IDs**

```typescript
import { rechargeService } from '../services/recharge.service';
import { getOperatorByCode } from '../constants/operators';

const handleManualSelection = async (operatorCode: string, circleCode: string) => {
  // Get operator info from constants
  const operatorInfo = getOperatorByCode(operatorCode);
  const operatorId = operatorInfo.kwikApiOperatorId;

  // Or get from database
  const dbOperators = await rechargeService.getAllOperatorsFromDB(accessToken);
  const dbOperator = dbOperators.find(op =>
    op.operatorName.toLowerCase().includes(operatorCode.toLowerCase())
  );

  // Use operator ID for browse plans
  const plans = await rechargeService.getPlans(
    operatorCode,
    circleCode,
    undefined, // category
    accessToken,
    operatorId // KWIKAPI operator ID
  );

  console.log('Plans:', plans);
};
```

### **4. Get Circles from Database**

```typescript
import { rechargeService } from '../services/recharge.service';

const loadCircles = async () => {
  try {
    // Get all cached circles (no rate limit!)
    const circles = await rechargeService.getAllCircles(accessToken);

    console.log('Circles:', circles);
    // Example: [
    //   { circleCode: "1", circleName: "DELHI (DL)" },
    //   { circleCode: "4", circleName: "MAHARASHTRA (MH)" }
    // ]

    setCircles(circles);
  } catch (error) {
    console.error('Failed to load circles:', error);
  }
};
```

### **5. Admin: Sync Operators (Rare - Only When Needed)**

```typescript
import { rechargeService } from '../services/recharge.service';

const syncOperators = async () => {
  try {
    console.log('⚠️ Syncing operators from KWIKAPI (15 hits/day limit)');

    const result = await rechargeService.fetchAndStoreOperators(accessToken);

    console.log('✅ Sync complete:', result);
    // {
    //   success: true,
    //   operatorsStored: 30,
    //   message: "Successfully fetched and stored 30 operators"
    // }
  } catch (error) {
    console.error('Failed to sync operators:', error);
  }
};

// ⚠️ ONLY call this when:
// - Initial setup (one-time)
// - KWIKAPI adds new operators
// - Monthly sync (optional)
```

---

## 📊 Complete Recharge Flow

### **Scenario 1: Detection Works**
```typescript
// 1. User enters mobile number
const mobileNumber = '9876543210';

// 2. Detect operator
const detected = await rechargeService.detectOperator(mobileNumber, accessToken);
console.log('Detected:', detected);
// {
//   operatorCode: "JIO",
//   operatorName: "Jio",
//   operatorId: "8", // KWIKAPI operator ID from API
//   circleCode: "4",
//   circleName: "Maharashtra"
// }

// 3. Get plans using detected operator ID
const plans = await rechargeService.getPlans(
  detected.operatorCode,
  detected.circleCode,
  'POPULAR',
  accessToken,
  detected.operatorId // Use operator ID from detection
);
```

### **Scenario 2: User Manually Corrects Operator**
```typescript
// 1. User enters mobile number
const mobileNumber = '9876543210';

// 2. Detect operator (wrong result)
const detected = await rechargeService.detectOperator(mobileNumber, accessToken);
console.log('Detected (wrong):', detected.operatorCode); // "AIRTEL"

// 3. User manually selects correct operator
const manualOperatorCode = 'JIO'; // User selection

// 4. Get operator ID from constants or database
const operatorInfo = getOperatorByCode(manualOperatorCode);
const operatorId = operatorInfo.kwikApiOperatorId; // "8"

// Or get from database
const dbOperators = await rechargeService.getAllOperatorsFromDB(accessToken);
const dbOperator = dbOperators.find(op =>
  op.operatorName === 'Reliance Jio'
);
const operatorIdFromDB = dbOperator?.operatorId; // "8"

// 5. User selects circle manually
const circleCode = '4'; // Maharashtra

// 6. Get plans using manual selection
const plans = await rechargeService.getPlans(
  manualOperatorCode,
  circleCode,
  'POPULAR',
  accessToken,
  operatorId // Use static mapping or database ID
);

console.log('✅ Plans fetched successfully for manual selection!');
```

---

## 🎯 Key Benefits

### ✅ **No More Rate Limits**
- Old: Limited to 15 operator API hits/day
- New: Unlimited reads from database

### ✅ **Faster Performance**
- Old: External API call to KWIKAPI
- New: Local database query (much faster)

### ✅ **Offline Ready**
- Old: Requires KWIKAPI to be online
- New: Works even if KWIKAPI is down

### ✅ **Manual Selection Works**
- Old: Required detection for operator ID
- New: Static mapping + database fallback

### ✅ **Consistent Data**
- Old: Different results from API each time
- New: Same data for all users from database

---

## ⚠️ Important Notes

### **Rate Limits**
| API | Limit | When to Use |
|-----|-------|-------------|
| `GET /all-operators` | ✅ None | Normal operations |
| `POST /fetch-operators` | ⚠️ 15/day | Initial setup, monthly sync |
| `GET /all-circles` | ✅ None | Normal operations |
| `POST /fetch-circles` | ⚠️ 2/day | Initial setup, monthly sync |

### **When to Sync**
- ✅ **Initial Setup**: One-time sync when setting up the app
- ✅ **New Operators**: When KWIKAPI adds new operators
- ✅ **Monthly**: Optional monthly sync to keep data fresh
- ❌ **Never**: On every app launch or user action

### **Operator ID Mapping**
The mobile app has **two sources** for operator IDs:

1. **Static Constants** (`src/constants/operators.ts`)
   - Hardcoded operator IDs
   - Always available
   - Fast access
   - Use for manual selection

2. **Database** (`getAllOperatorsFromDB`)
   - Dynamic operator IDs
   - More operators available
   - Requires API call
   - Use for comprehensive list

**Recommendation:** Use static constants for main operators (Airtel, Jio, VI, BSNL), fallback to database for others.

---

## 🧪 Testing

### **Test 1: Get Operators from Database**
```typescript
const operators = await rechargeService.getAllOperatorsFromDB(accessToken);
console.log('Operators count:', operators.length); // Should be > 0
console.log('First operator:', operators[0]);
```

### **Test 2: Static Operator IDs**
```typescript
console.log('Airtel ID:', OPERATORS.AIRTEL.kwikApiOperatorId); // "1"
console.log('Jio ID:', OPERATORS.JIO.kwikApiOperatorId); // "8"
console.log('VI ID:', OPERATORS.VI.kwikApiOperatorId); // "3"
```

### **Test 3: Manual Selection with Plans**
```typescript
const operatorId = OPERATORS.JIO.kwikApiOperatorId;
const plans = await rechargeService.getPlans(
  'JIO',
  '4', // Maharashtra
  'POPULAR',
  accessToken,
  operatorId
);
console.log('Plans fetched:', plans.length);
```

---

## 📝 Migration Checklist

- [x] Updated API endpoints in constants
- [x] Added kwikApiOperatorId to operator constants
- [x] Updated Operator type interface
- [x] Added service methods for database operations
- [x] Created documentation

**Next Steps for App Developers:**
- [ ] Update recharge flow to use `getAllOperatorsFromDB()`
- [ ] Implement manual operator selection with operator ID mapping
- [ ] Add admin sync button for `fetchAndStoreOperators()` (optional)
- [ ] Update browse plans to use operator IDs from database
- [ ] Test complete recharge flow with manual selection

---

**Last Updated:** 2026-01-27
**Integration Status:** ✅ Complete - Ready to Use
