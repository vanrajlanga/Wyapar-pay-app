# KWIKAPI Integration Guide

## 📊 Overview

This guide shows how to use the three main KWIKAPI APIs for mobile recharge:

1. **Wallet Balance API** - Check KWIKAPI account balance
2. **Recharge API** - Execute mobile recharge
3. **Status API** - Check transaction status

---

## 🔧 Available Methods

### 1. Check KWIKAPI Wallet Balance

```typescript
// Get balance (uses 30-min cache)
const balance = await kwikApiService.getWalletBalance();

// Force refresh (ignores cache)
const freshBalance = await kwikApiService.getWalletBalance(true);

// Response format:
{
  response: {
    balance: "1234.56",      // Available balance
    plan_credit: "1293"      // Plan credit
  }
}
```

**Rate Limit**: 2 hits/hour  
**Caching**: 30 minutes (automatic)

---

### 2. Generate Order ID

```typescript
// Generate unique order ID (max 20 digits)
const orderId = kwikApiService.generateOrderId();
// Returns: "1706123456789123456" (19 digits)
```

---

### 3. Process Recharge

```typescript
const rechargeResponse = await kwikApiService.processRecharge({
  number: '9876543210',    // Mobile number
  amount: 299,             // Recharge amount
  opid: '3',               // Operator ID (from detection)
  state_code: 0,           // Always 0
  order_id: orderId        // Unique order ID (max 20 digits)
});

// Response format:
{
  status: "PENDING",                       // PENDING | SUCCESS | FAILED
  order_id: "1706123456789123456",
  opr_id: "",                              // Operator reference (may be empty initially)
  balance: "1234.56",                      // KWIKAPI balance after recharge
  number: "9876543210",
  provider: "Airtel",
  amount: "299",
  charged_amount: "293.02",                // Amount charged from KWIKAPI wallet
  message: "RECHARGE SUBMITTED SUCCESSFULLY"
}
```

**⚠️ IMPORTANT**: 
- This API usually returns `PENDING` status
- **ALWAYS** call status API separately to confirm
- Don't trust immediate response for success confirmation
- Timeout: 120 seconds

---

### 4. Check Recharge Status

```typescript
const statusResponse = await kwikApiService.checkRechargeStatus(orderId);

// Response format:
{
  response: {
    order_id: "1706123456789123456",
    operator_ref: "4162140972233",         // Operator transaction reference
    opr_id: "416214093455",
    status: "SUCCESS",                      // PENDING | SUCCESS | FAILED | REFUNDED
    number: "9876543210",
    amount: "299",
    service: "Prepaid Recharge",
    charged_amount: "293.02",
    closing_balance: "941.54",              // KWIKAPI balance after transaction
    available_balance: "941.54",
    pid: "15494934555",                     // Provider ID
    date: "2024-06-10 14:23:53"            // Transaction date
  }
}
```

**Rate Limit**: 3 hits/transaction  
**Retry Logic**: Poll with delays (5s, 30s, 30s)

---

## 🔄 Complete Recharge Flow

```typescript
async function processCompleteRecharge(
  mobileNumber: string,
  amount: number,
  operatorId: string
) {
  try {
    // Step 1: Check KWIKAPI Balance
    const balance = await kwikApiService.getWalletBalance();
    const balanceAmount = parseFloat(balance.response.balance);
    
    if (balanceAmount < amount) {
      throw new Error('Insufficient KWIKAPI wallet balance');
    }

    // Step 2: Generate Order ID
    const orderId = kwikApiService.generateOrderId();

    // Step 3: Process Recharge
    const rechargeResponse = await kwikApiService.processRecharge({
      number: mobileNumber,
      amount: amount,
      opid: operatorId,
      state_code: 0,
      order_id: orderId
    });

    console.log('Recharge submitted:', rechargeResponse.message);

    // Step 4: Poll Status (Max 3 attempts)
    await sleep(5000); // Wait 5 seconds

    for (let attempt = 1; attempt <= 3; attempt++) {
      const statusResponse = await kwikApiService.checkRechargeStatus(orderId);
      const status = statusResponse.response.status;

      if (status === 'SUCCESS') {
        console.log('✅ Recharge successful!');
        return {
          success: true,
          operatorRef: statusResponse.response.operator_ref,
          data: statusResponse.response
        };
      } else if (status === 'FAILED') {
        console.log('❌ Recharge failed');
        return {
          success: false,
          message: 'Recharge failed',
          data: statusResponse.response
        };
      } else if (status === 'PENDING') {
        if (attempt < 3) {
          await sleep(30000); // Wait 30 seconds
        } else {
          return {
            success: false,
            status: 'TIMEOUT',
            message: 'Status check timeout - check later'
          };
        }
      }
    }
  } catch (error) {
    console.error('Recharge failed:', error.message);
    throw error;
  }
}
```

---

## ⏱️ Recommended Timing

```
Recharge Request
      ↓
   [Wait 5s]
      ↓
Status Check #1 (Attempt 1/3)
      ↓
   PENDING? → [Wait 30s]
      ↓
Status Check #2 (Attempt 2/3)
      ↓
   PENDING? → [Wait 30s]
      ↓
Status Check #3 (Attempt 3/3)
      ↓
   PENDING? → Mark as PROCESSING, check later
```

---

## 🎯 Integration with Payment Flow

```typescript
// After Razorpay payment success:

1. User pays ₹299 via Razorpay ✅
2. Create Transaction (status: PENDING)
3. Check KWIKAPI balance ≥ ₹299 ✅
4. Generate order_id
5. Call processRecharge()
6. Wait 5 seconds
7. Poll checkRechargeStatus() (max 3 times)
8. Update Transaction based on final status:
   - SUCCESS → Update transaction, send SMS
   - FAILED → Refund to user (if wallet used)
   - PENDING (after 3 polls) → Mark as PROCESSING, cron job later
```

---

## ⚠️ Important Notes

### Rate Limits
- **Balance API**: 2 hits/hour (cached for 30 min)
- **Status API**: 3 hits/transaction (no cache)

### Timeout Handling
- Recharge API timeout: 120 seconds
- If timeout occurs, recharge may still process
- Always check status API separately

### Status Checking
- Never trust immediate recharge response
- Always poll status API
- Max 3 attempts to respect rate limit
- If still PENDING after 3 attempts, use cron job

### Error Handling
- Network errors: Retry with exponential backoff
- Timeout: Check status separately
- FAILED status: Initiate refund flow
- Insufficient balance: Show user-friendly error

---

## 🧪 Testing

Run the test script:
```bash
ts-node test-complete-recharge.ts
```

This will:
1. Check KWIKAPI balance
2. Generate order ID
3. Show example recharge request
4. (Commented out) Process actual recharge
5. (Commented out) Poll status

To test actual recharge, uncomment the code in STEP 3 and replace with test mobile number.

---

## 📝 Example Logs

```
📞 Processing recharge: 9876543210 | ₹299 | Order: 1706123456789123456
📥 Recharge Response: PENDING | Provider: Airtel | Charged: ₹293.02
💰 KWIKAPI Balance: ₹1234.56
⚠️  Status is PENDING for order 1706123456789123456 - MUST check status separately!

[Wait 5 seconds]

📊 Checking status for order: 1706123456789123456
✅ Status fetched: SUCCESS | Amount: ₹299 | Order: 1706123456789123456
🎉 Recharge successful! Operator Ref: 4162140972233
```

---

## 🔐 Environment Variables

Ensure these are set in `.env`:
```env
KWIKAPI_ENABLED=true
KWIKAPI_API_KEY=your_api_key_here
KWIKAPI_BASE_URL=https://www.kwikapi.com
KWIKAPI_TIMEOUT=30000
```

---

**Integration Complete!** ✅

All three KWIKAPI APIs are now ready to use in your recharge flow.
