# Operator Caching Implementation

## 🎯 Problem Solved

KWIKAPI's Operator Codes API has a **15 hits/day limit**. Previously, we had to hit this API repeatedly or hardcode operator IDs. Now we cache the operator data in the database, similar to how circles are cached.

---

## 📦 What Was Implemented

### 1. **Database Entity** (`src/entities/operator.entity.ts`)
- Stores all operator data from KWIKAPI
- Fields include: `operatorId`, `operatorName`, `serviceType`, `status`, etc.
- Indexed on `operatorId` for fast lookups

### 2. **Database Migration** (`migrations/002_create_operators_table.sql`)
- Creates `operators` table
- Unique index on `operatorId`
- Additional indexes on `serviceType` and `status`

### 3. **Service Methods** (`src/modules/recharge/recharge.service.ts`)

#### `fetchAndStoreOperators()`
- Fetches operators from KWIKAPI `/api/v2/operator_codes.php`
- Filters for prepaid mobile operators
- Stores in database
- Returns count of operators stored
- **⚠️ Should only be called when syncing (15 hits/day limit)**

#### `getAllOperatorsFromDB()`
- Retrieves operators from database (cached)
- Returns only active operators
- Sorted by `sortOrder`
- **✅ No API hits - use this for normal operations**

#### `getOperatorById(operatorId: string)`
- Get specific operator by KWIKAPI operator ID
- Returns `null` if not found or inactive

### 4. **Controller Endpoints** (`src/modules/recharge/recharge.controller.ts`)

#### `POST /recharge/fetch-operators` (Admin only)
- Syncs operators from KWIKAPI to database
- **⚠️ Rate limited: 15 hits/day**
- Returns: `{ success: boolean, operatorsStored: number, message: string }`

#### `GET /recharge/all-operators` (Public)
- Returns all cached operators from database
- **✅ No rate limit - reads from database**
- Returns full operator details with KWIKAPI IDs

### 5. **Module Configuration** (`src/modules/recharge/recharge.module.ts`)
- Added `Operator` entity to TypeORM imports
- Repository available for dependency injection

### 6. **Frontend Integration** (`website/src/`)

#### Constants (`constants/index.ts`)
```typescript
GET_ALL_OPERATORS: '/recharge/all-operators',
FETCH_AND_STORE_OPERATORS: '/recharge/fetch-operators',
```

#### Service Methods (`services/recharge.service.ts`)
```typescript
getAllOperatorsFromDB() // Get cached operators
fetchAndStoreOperators() // Admin: Sync from KWIKAPI
```

---

## 🔄 Complete Workflow

### Initial Setup (One-time)

1. **Admin runs sync:**
```bash
POST /recharge/fetch-operators
```

2. **Response:**
```json
{
  "success": true,
  "operatorsStored": 50,
  "message": "Successfully fetched and stored 50 operators"
}
```

3. **Database now contains:**
```
operators table:
- operatorId: "1"  → Airtel
- operatorId: "3"  → VI
- operatorId: "8"  → Reliance Jio
- operatorId: "4"  → BSNL Topup
- operatorId: "14" → MTNL
... etc
```

### Normal Usage

**Frontend fetches operators:**
```typescript
const operators = await rechargeService.getAllOperatorsFromDB();
```

**Response:**
```json
[
  {
    "operatorId": "1",
    "operatorName": "Airtel",
    "serviceType": "Prepaid",
    "status": "1",
    "amountMinimum": 10,
    "amountMaximum": 10000
  },
  {
    "operatorId": "8",
    "operatorName": "Reliance Jio",
    "serviceType": "Prepaid",
    "status": "1",
    "amountMinimum": 10,
    "amountMaximum": 10000
  }
]
```

**Frontend uses operator IDs:**
```typescript
// User manually selects operator
const selectedOperator = operators.find(op => op.operatorName === 'Jio');
const operatorId = selectedOperator.operatorId; // "8"

// Use for Browse Plans
browsePlans(operatorId, circleCode);
```

---

## 🚀 How to Use

### Step 1: Run Database Migration
```sql
-- Run migrations/002_create_operators_table.sql
mysql -u username -p database_name < migrations/002_create_operators_table.sql
```

### Step 2: Initial Sync (Admin)
```bash
# Using curl
curl -X POST http://localhost:3000/recharge/fetch-operators \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or using the script
cd backend
npx ts-node fetch-operator-ids.ts
```

### Step 3: Use in Frontend
```typescript
// Load operators on page mount
useEffect(() => {
  const loadOperators = async () => {
    const ops = await rechargeService.getAllOperatorsFromDB();
    setOperators(ops);
  };
  loadOperators();
}, []);

// Use operator ID when needed
const operatorId = operator.operatorId; // From database
```

---

## ⚠️ Important Notes

1. **Rate Limits:**
   - `POST /fetch-operators`: **15 hits/day** (KWIKAPI limit)
   - `GET /all-operators`: **No limit** (reads from database)

2. **When to Sync:**
   - Initial setup (one-time)
   - When KWIKAPI adds new operators
   - When operator status changes
   - Recommended: Monthly or as needed

3. **Filtering:**
   - Currently filters for `Prepaid` operators only
   - Can be changed in `fetchAndStoreOperators()` method
   - To store all operators: Remove the filter

4. **Active Status:**
   - Operators with `status: "1"` are active
   - Inactive operators are stored but not returned by `getAllOperatorsFromDB()`

---

## 📊 Database Schema

```sql
CREATE TABLE `operators` (
  `id` CHAR(36) PRIMARY KEY,
  `operatorId` VARCHAR(50) NOT NULL,        -- KWIKAPI operator ID
  `operatorName` VARCHAR(100) NOT NULL,     -- e.g., "Airtel", "Reliance Jio"
  `serviceType` VARCHAR(50) NOT NULL,       -- "Prepaid" or "Postpaid"
  `status` VARCHAR(10) NOT NULL,            -- "1" = Active, "0" = Inactive
  `billerStatus` VARCHAR(10) NOT NULL,      -- "on" or "off"
  `billFetch` VARCHAR(10) DEFAULT 'NO',     -- "YES" or "NO"
  `supportValidation` VARCHAR(50),          -- Validation support
  `bbpsEnabled` VARCHAR(10) DEFAULT 'NO',   -- BBPS enabled
  `message` VARCHAR(255) NULL,              -- Optional message
  `description` TEXT NULL,                  -- Optional description
  `amountMinimum` INT DEFAULT 10,           -- Min recharge amount
  `amountMaximum` INT DEFAULT 10000,        -- Max recharge amount
  `isActive` BOOLEAN DEFAULT TRUE,          -- Our internal active flag
  `sortOrder` INT DEFAULT 0,                -- Display order
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX `idx_operator_id` (`operatorId`),
  INDEX `idx_service_type` (`serviceType`),
  INDEX `idx_status` (`status`)
);
```

---

## 🔍 Sample Data

```json
[
  {
    "operatorId": "1",
    "operatorName": "Airtel",
    "serviceType": "Prepaid",
    "status": "1",
    "billerStatus": "on",
    "amountMinimum": 10,
    "amountMaximum": 10000,
    "isActive": true
  },
  {
    "operatorId": "8",
    "operatorName": "Reliance Jio",
    "serviceType": "Prepaid",
    "status": "1",
    "billerStatus": "on",
    "amountMinimum": 10,
    "amountMaximum": 10000,
    "isActive": true
  }
]
```

---

## 🎉 Benefits

1. ✅ **No API Rate Limits** - Read from database instead of hitting KWIKAPI
2. ✅ **Faster Response** - Local database query vs external API call
3. ✅ **Offline Ready** - Works even if KWIKAPI is down
4. ✅ **Consistent Data** - All users see the same operator list
5. ✅ **Easy Updates** - Admin can sync when needed
6. ✅ **Automatic IDs** - Frontend gets correct operator IDs from database

---

## 🔧 Maintenance

### Sync Operators (Admin)
```bash
# Check current operators
GET /recharge/all-operators

# Sync from KWIKAPI (if needed)
POST /recharge/fetch-operators
```

### Monitor Usage
- Check `updatedAt` timestamp in database
- If data is old (> 1 month), consider syncing
- Monitor KWIKAPI for new operators

---

**Last Updated:** 2026-01-27
**API Hits Used Today:** 1/15 (initial sync)
