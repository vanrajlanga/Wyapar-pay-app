# 🔔 Event-Driven Notification System

## Overview

The notification system uses an **event-driven architecture** for clean, loosely-coupled integration. Services emit events instead of directly calling notification services, making the system reusable and maintainable.

## 🏗️ Architecture

```
Business Service
    ↓
NotificationEmitterService (emits event)
    ↓
EventEmitter2 (NestJS)
    ↓
NotificationEventHandler (listens & handles)
    ↓
NotificationService (sends notifications)
    ↓
Push + SMS + Email
```

## 📦 Components

### 1. **Notification Events** (`notification-events.ts`)
- Defines event types and payload interfaces
- Type-safe event definitions

### 2. **Notification Emitter Service** (`notification-emitter.service.ts`)
- **Reusable service** for emitting notification events
- Handles user metadata retrieval (language, phone, email)
- Provides simple, clean API for services

### 3. **Notification Event Handler** (`notification-event-handler.ts`)
- Listens to events using `@OnEvent()` decorators
- Maps events to notification types
- Sends notifications via NotificationService

### 4. **Notification Events Module** (`notification-events.module.ts`)
- Exports `NotificationEmitterService` for use in other modules
- Registers event handlers

## 🚀 Usage

### In Any Service

**Step 1:** Import `NotificationEventsModule` in your module:

```typescript
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';

@Module({
  imports: [
    // ... other imports
    NotificationEventsModule,
  ],
})
export class YourModule {}
```

**Step 2:** Inject `NotificationEmitterService` in your service:

```typescript
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';

@Injectable()
export class YourService {
  constructor(
    // ... other dependencies
    private notificationEmitter: NotificationEmitterService
  ) {}
}
```

**Step 3:** Emit events at appropriate points:

```typescript
// Transaction success
await this.notificationEmitter.emitTransactionSuccess(userId, {
  transactionId: 'txn_123',
  amount: 100,
  currency: '₹',
});

// Recharge success
await this.notificationEmitter.emitRechargeSuccess(userId, {
  transactionId: 'txn_123',
  amount: 50,
  phoneNumber: '1234567890',
  operator: 'AIRTEL',
});

// User registered
await this.notificationEmitter.emitUserRegistered(userId, {
  userName: 'John Doe',
});

// Login
await this.notificationEmitter.emitUserLogin(userId);

// New device login
await this.notificationEmitter.emitNewDeviceLogin(userId, {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
```

## ✅ Benefits

### 1. **Loose Coupling**
- Services don't depend on NotificationService directly
- Only depend on NotificationEmitterService (lightweight)
- Easy to test (mock the emitter)

### 2. **Reusability**
- Same emitter service used everywhere
- Consistent API across all services
- No code duplication

### 3. **Maintainability**
- All notification logic in one place (event handler)
- Easy to add new notification types
- Easy to modify notification behavior

### 4. **Scalability**
- Can add multiple handlers for same event
- Can add event listeners for analytics, logging, etc.
- Event-driven = async by default

### 5. **Type Safety**
- TypeScript interfaces for all event payloads
- Compile-time checking
- Better IDE autocomplete

## 📋 Available Event Methods

### Transaction Events
- `emitTransactionSuccess(userId, data)`
- `emitTransactionFailed(userId, data)`

### Recharge Events
- `emitRechargeSuccess(userId, data)`
- `emitRechargeFailed(userId, data)`

### Wallet Events
- `emitWalletTopupSuccess(userId, data)`

### Auth Events
- `emitUserRegistered(userId, data)`
- `emitUserLogin(userId)`
- `emitNewDeviceLogin(userId, data)`
- `emitOtpSent(userId)`
- `emitPasswordChanged(userId)`
- `emitAccountVerified(userId)`

### KYC Events
- `emitKycApproved(userId)`
- `emitKycRejected(userId, data)`

## 🔧 Adding New Notification Types

### Step 1: Add Event Type
```typescript
// notification-events.ts
export enum NotificationEventType {
  // ... existing
  NEW_EVENT = 'new.event',
}
```

### Step 2: Add Event Data Interface
```typescript
export interface NewEventData {
  field1: string;
  field2: number;
}
```

### Step 3: Add Emitter Method
```typescript
// notification-emitter.service.ts
async emitNewEvent(
  userId: string,
  data: NewEventData
): Promise<void> {
  await this.emitEvent(NotificationEventType.NEW_EVENT, userId, data);
}
```

### Step 4: Add Handler
```typescript
// notification-event-handler.ts
@OnEvent(NotificationEventType.NEW_EVENT)
async handleNewEvent(event: NotificationEvent) {
  // Handle notification
}
```

### Step 5: Use in Service
```typescript
await this.notificationEmitter.emitNewEvent(userId, {
  field1: 'value',
  field2: 123,
});
```

## 🎯 Best Practices

1. **Always emit events asynchronously** - Don't await if not critical
2. **Include all relevant data** in event payload
3. **Use type-safe interfaces** for event data
4. **Don't throw errors** in event handlers (log instead)
5. **Keep event payloads minimal** - Only include necessary data

## 📊 Current Integration

✅ **RechargeService** - Uses event emitter  
✅ **AuthService** - Uses event emitter  
✅ **WalletService** - Uses event emitter  
✅ **TransactionService** - Uses event emitter  
✅ **KycService** - Uses event emitter  

## 🔍 Testing

To test the event system:

```typescript
// Mock the emitter in tests
const mockEmitter = {
  emitTransactionSuccess: jest.fn(),
  emitRechargeSuccess: jest.fn(),
  // ... other methods
};

// Verify events were emitted
expect(mockEmitter.emitTransactionSuccess).toHaveBeenCalledWith(
  userId,
  expect.objectContaining({
    transactionId: 'txn_123',
    amount: 100,
  })
);
```

## 📚 Related Files

- `backend/src/common/notifications/notification-events.ts` - Event definitions
- `backend/src/common/notifications/notification-emitter.service.ts` - Emitter service
- `backend/src/common/notifications/notification-event-handler.ts` - Event handlers
- `backend/src/common/notifications/notification-events.module.ts` - Module definition

---

**Status:** ✅ **Complete & Production Ready**  
**Architecture:** Event-Driven (Loosely Coupled)  
**Reusability:** ✅ High  
**Maintainability:** ✅ Excellent




