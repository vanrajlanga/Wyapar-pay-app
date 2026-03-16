# Payment & Recharge Integration Guide

This guide explains how to integrate Razorpay payment and KWIKAPI recharge in the WyaparPay mobile app.

## Overview

The mobile app now has complete integration for:
1. **Razorpay Payment Gateway** - For processing payments
2. **KWIKAPI Recharge Service** - For mobile recharges
3. **Status Polling** - Automatic status checking after recharge

## Architecture

```
Mobile App Component
    ↓
Payment Service / Recharge Service
    ↓
Backend API (NestJS)
    ↓
External APIs (Razorpay / KWIKAPI)
```

## Services Added

### 1. Payment Service (`src/services/payment.service.ts`)

**Methods:**
- `createOrder()` - Create Razorpay payment order
- `verifyPayment()` - Verify payment after completion
- `initiatePayment()` - Complete payment flow
- `completePayment()` - Verify and process after Razorpay checkout

### 2. Updated Recharge Service (`src/services/recharge.service.ts`)

**New Methods:**
- `getKwikApiBalance()` - Check KWIKAPI account balance
- `processKwikApiRecharge()` - Initiate recharge with KWIKAPI
- `checkKwikApiStatus()` - Check recharge status
- `processCompleteRecharge()` - Complete recharge flow with status polling

## Implementation Examples

### Example 1: Simple Recharge Flow (Payment + KWIKAPI)

```typescript
import { paymentService } from '../services/payment.service';
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

function RechargeScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    try {
      setLoading(true);

      // Step 1: Create Razorpay order
      const order = await paymentService.createOrder(
        {
          amount: 299, // ₹299
          currency: 'INR',
          notes: {
            mobile_number: '9876543210',
            operator: 'AIRTEL',
            operator_id: '3', // From operator detection
          },
        },
        token
      );

      console.log('Payment order created:', order);

      // Step 2: Open Razorpay checkout (you'll need to use react-native-razorpay)
      // This is pseudocode - actual implementation depends on Razorpay SDK
      const razorpayOptions = {
        key: order.razorpay_key,
        amount: order.amount * 100, // Convert to paise
        currency: order.currency,
        name: 'WyaparPay',
        description: 'Mobile Recharge',
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          // Step 3: Verify payment
          const verification = await paymentService.verifyPayment(
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            token
          );

          console.log('Payment verified:', verification);

          if (verification.status === 'SUCCESS') {
            // Step 4: Process KWIKAPI recharge
            const rechargeResult = await rechargeService.processCompleteRecharge({
              mobileNumber: '9876543210',
              amount: 299,
              operatorId: '3', // From operator detection
              operatorName: 'AIRTEL',
              accessToken: token,
            });

            console.log('Recharge result:', rechargeResult);

            if (rechargeResult.success) {
              Alert.alert('Success', 'Recharge completed successfully!');
            } else {
              Alert.alert('Failed', rechargeResult.message);
            }
          }
        },
        theme: {
          color: '#F97316', // WyaparPay orange
        },
      };

      // RazorpayCheckout.open(razorpayOptions); // Actual SDK call

    } catch (error) {
      console.error('Recharge failed:', error);
      Alert.alert('Error', 'Recharge failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleRecharge}
      loading={loading}
      disabled={loading}
    >
      Recharge Now
    </Button>
  );
}
```

### Example 2: Operator Detection

```typescript
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

function MobileNumberInput() {
  const { token } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [operator, setOperator] = useState(null);

  const detectOperator = async () => {
    try {
      const result = await rechargeService.detectOperator(mobileNumber, token);

      console.log('Detected operator:', result);

      setOperator({
        code: result.operatorCode,
        name: result.operatorName,
        circle: result.circleName,
        operatorId: result.operatorId, // KWIKAPI operator ID
      });
    } catch (error) {
      console.error('Detection failed:', error);
      Alert.alert('Error', 'Could not detect operator');
    }
  };

  return (
    <View>
      <TextInput
        label="Mobile Number"
        value={mobileNumber}
        onChangeText={setMobileNumber}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <Button onPress={detectOperator}>Detect Operator</Button>

      {operator && (
        <Text>
          Operator: {operator.name} ({operator.circle})
        </Text>
      )}
    </View>
  );
}
```

### Example 3: Fetch and Display Plans

```typescript
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

function PlansScreen({ route }) {
  const { token } = useAuth();
  const { operatorCode, operatorId, circleCode } = route.params;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const fetchedPlans = await rechargeService.getPlans(
        operatorCode,
        circleCode,
        'POPULAR', // Category: POPULAR, DATA, UNLIMITED
        token,
        operatorId // KWIKAPI operator ID
      );

      setPlans(fetchedPlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
      Alert.alert('Error', 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={plans}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card>
          <Card.Title title={`₹${item.amount}`} subtitle={item.validity} />
          <Card.Content>
            <Text>Data: {item.data}</Text>
            <Text>Calling: {item.calling}</Text>
            {item.benefits.map((benefit, index) => (
              <Text key={index}>• {benefit}</Text>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => handleSelectPlan(item)}>
              Select Plan
            </Button>
          </Card.Actions>
        </Card>
      )}
    />
  );
}
```

### Example 4: Check KWIKAPI Balance

```typescript
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
  const { token } = useAuth();
  const [balance, setBalance] = useState(null);

  const checkBalance = async () => {
    try {
      const result = await rechargeService.getKwikApiBalance(true, token);

      console.log('KWIKAPI Balance:', result.response.balance);
      console.log('Plan Credit:', result.response.plan_credit);

      setBalance(result.response);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  return (
    <View>
      <Button onPress={checkBalance}>Check KWIKAPI Balance</Button>

      {balance && (
        <Card>
          <Card.Content>
            <Title>KWIKAPI Account</Title>
            <Paragraph>Balance: ₹{balance.balance}</Paragraph>
            <Paragraph>Plan Credit: {balance.plan_credit}</Paragraph>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}
```

## Complete Recharge Flow

Here's the recommended flow for implementing recharge in your app:

```typescript
import { useState } from 'react';
import { paymentService } from '../services/payment.service';
import { rechargeService } from '../services/recharge.service';
import { useAuth } from '../contexts/AuthContext';

function CompleteRechargeFlow() {
  const { token } = useAuth();
  const [step, setStep] = useState('input'); // input, plans, payment, processing, success/failed
  const [rechargeData, setRechargeData] = useState({
    mobileNumber: '',
    operator: null,
    plan: null,
  });

  // Step 1: Enter mobile number and detect operator
  const handleMobileSubmit = async () => {
    const operator = await rechargeService.detectOperator(
      rechargeData.mobileNumber,
      token
    );

    setRechargeData((prev) => ({ ...prev, operator }));
    setStep('plans');
  };

  // Step 2: Select plan
  const handlePlanSelect = (plan) => {
    setRechargeData((prev) => ({ ...prev, plan }));
    setStep('payment');
  };

  // Step 3: Process payment
  const handlePayment = async () => {
    try {
      // Create payment order
      const order = await paymentService.createOrder(
        {
          amount: rechargeData.plan.amount,
          currency: 'INR',
          notes: {
            mobile_number: rechargeData.mobileNumber,
            operator: rechargeData.operator.operatorName,
            operator_id: rechargeData.operator.operatorId,
          },
        },
        token
      );

      // Open Razorpay checkout
      // (Implementation depends on react-native-razorpay SDK)

      // After successful payment:
      setStep('processing');
      await processRecharge();
    } catch (error) {
      console.error('Payment failed:', error);
      setStep('failed');
    }
  };

  // Step 4: Process KWIKAPI recharge
  const processRecharge = async () => {
    try {
      const result = await rechargeService.processCompleteRecharge({
        mobileNumber: rechargeData.mobileNumber,
        amount: rechargeData.plan.amount,
        operatorId: rechargeData.operator.operatorId,
        operatorName: rechargeData.operator.operatorName,
        accessToken: token,
      });

      if (result.success) {
        setStep('success');
      } else {
        setStep('failed');
      }
    } catch (error) {
      console.error('Recharge failed:', error);
      setStep('failed');
    }
  };

  // Render different screens based on step
  return (
    <View>
      {step === 'input' && <MobileInput onSubmit={handleMobileSubmit} />}
      {step === 'plans' && <PlansScreen onSelect={handlePlanSelect} />}
      {step === 'payment' && <PaymentScreen onPay={handlePayment} />}
      {step === 'processing' && <LoadingScreen message="Processing recharge..." />}
      {step === 'success' && <SuccessScreen />}
      {step === 'failed' && <FailedScreen />}
    </View>
  );
}
```

## Razorpay SDK Setup

For React Native, you'll need to install the Razorpay SDK:

```bash
npm install react-native-razorpay
# or
expo install react-native-razorpay
```

Then import and use:

```typescript
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  key: order.razorpay_key,
  amount: order.amount * 100, // paise
  currency: order.currency,
  name: 'WyaparPay',
  description: 'Mobile Recharge',
  order_id: order.razorpay_order_id,
  prefill: {
    contact: user.phone,
    email: user.email,
  },
  theme: { color: '#F97316' },
};

RazorpayCheckout.open(options)
  .then((data) => {
    // Payment successful
    console.log(data);
  })
  .catch((error) => {
    // Payment failed
    console.error(error);
  });
```

## API Endpoints

All endpoints are configured in `src/constants/index.ts`:

### Payment Endpoints
- `POST /payment/create-order` - Create Razorpay order
- `POST /payment/verify` - Verify payment signature
- `GET /payment/transaction/:id` - Get transaction details

### Recharge Endpoints
- `POST /recharge/detect-operator` - Auto-detect operator
- `GET /recharge/operators` - Get operators list
- `GET /recharge/circles/:code` - Get circles for operator
- `GET /recharge/plans` - Get KWIKAPI plans
- `GET /recharge/kwikapi/balance` - Check KWIKAPI balance
- `POST /recharge/kwikapi/recharge` - Process KWIKAPI recharge
- `GET /recharge/kwikapi/status` - Check recharge status

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const result = await rechargeService.processCompleteRecharge(params);

  if (result.success) {
    // Handle success
  } else {
    // Handle failure
    Alert.alert('Recharge Failed', result.message);
  }
} catch (error) {
  // Handle errors
  if (error.message.includes('Network')) {
    Alert.alert('Network Error', 'Please check your connection');
  } else if (error.message.includes('Unauthorized')) {
    // Token expired - refresh or logout
  } else {
    Alert.alert('Error', 'Something went wrong');
  }
}
```

## Testing

### Test Mode
- Razorpay: Use test API key (`rzp_test_...`)
- KWIKAPI: Use UAT environment (configured in backend `.env`)

### Test Credentials
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
- Test mobile: Any valid 10-digit number starting with 6-9

## Status Polling

The `processCompleteRecharge()` method automatically polls KWIKAPI status:
- **Attempt 1**: Wait 5 seconds after recharge
- **Attempt 2**: If PENDING, wait 30 seconds
- **Attempt 3**: If still PENDING, wait 30 seconds
- **After 3 attempts**: Return TIMEOUT status

## Security Notes

1. **Never store Razorpay key in frontend code** - Always fetch from backend
2. **Always verify payment on backend** - Don't trust frontend verification
3. **Use HTTPS in production** - Update `API_CONFIG.BASE_URL`
4. **Store tokens securely** - Use `SecureStore` for sensitive data

## Next Steps

1. Install Razorpay SDK: `npm install react-native-razorpay`
2. Update screens to use payment and recharge services
3. Add loading states and error handling
4. Test with Razorpay test mode
5. Test with KWIKAPI UAT environment
6. Add transaction history UI
7. Add receipt generation

## Support

For issues or questions:
- Backend API: Check `/Volumes/Krishna/Krishna/wyapar-pay/Wyapar/backend/`
- Services: Check `/Volumes/Krishna/Krishna/wyapar-pay/Wyapar/frontend/WyaparPayExpo/src/services/`
- Documentation: This file

---

**Last Updated:** 2026-01-24
**Version:** 1.0.0
