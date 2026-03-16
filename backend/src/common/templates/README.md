# Notification Template System

This directory contains the centralized notification template system for WyaparPay. It provides consistent messaging across SMS and Push notification channels.

## Overview

The template system allows you to:
- Send notifications using predefined templates
- Support multiple languages (English, Hindi, Kannada)
- Maintain consistent messaging across channels
- Easily update notification content in one place

## Available Templates

### Transaction Templates
- `TRANSACTION_SUCCESS` - Payment completed successfully
- `TRANSACTION_FAILED` - Payment failed
- `RECHARGE_SUCCESS` - Mobile recharge completed
- `RECHARGE_FAILED` - Mobile recharge failed
- `WALLET_TOPUP_SUCCESS` - Wallet top-up completed
- `PAYMENT_RECEIVED` - Money received in wallet

### Account Templates
- `ACCOUNT_VERIFIED` - Account verification completed
- `ACCOUNT_SUSPENDED` - Account suspended
- `PASSWORD_CHANGED` - Password changed notification
- `LOGIN_SUCCESS` - Successful login notification
- `EMAIL_VERIFIED` - Email verification completed

### Security Templates
- `LOGIN_ALERT` - New login from different device/location
- `OTP_SENT` - OTP sent for verification
- `SECURITY_ALERT` - Security issue detected

### KYC Templates
- `KYC_APPROVED` - KYC verification approved
- `KYC_REJECTED` - KYC verification rejected
- `KYC_DOCUMENTS_NEEDED` - Additional documents required

### Promotional Templates
- `WELCOME_MESSAGE` - Welcome new users
- `CASHBACK_EARNED` - Cashback credited
- `SPECIAL_OFFER` - Promotional offers
- `REFERRAL_BONUS` - Referral rewards

### System Templates
- `MAINTENANCE_SCHEDULED` - System maintenance notice
- `APP_UPDATE_AVAILABLE` - App update notification

## API Usage

### Send Push Notification with Template

```bash
POST /api/v1/notifications/send-template
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "TRANSACTION_SUCCESS",
  "language": "en",
  "context": {
    "amount": 100,
    "currency": "₹",
    "transactionId": "TXN123456"
  }
}
```

### Send SMS with Template

```bash
POST /api/v1/notifications/send-sms-template
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "OTP_SENT",
  "language": "hi",
  "context": {
    "otp": "123456"
  }
}
```

### Send Both SMS and Push

```bash
POST /api/v1/notifications/send-dual-template
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "RECHARGE_SUCCESS",
  "language": "kn",
  "context": {
    "amount": 50,
    "transactionId": "RCH789"
  }
}
```

**Response (SMS):**
```
"Dear User, Your recharge of ₹50 is successful. Transaction ID: RCH789. Enjoy seamless payments with WyapaarPay!"
```

### Wallet Top-up Example

```bash
POST /api/v1/notifications/send-template
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "WALLET_TOPUP_SUCCESS",
  "language": "en",
  "context": {
    "amount": 500,
    "transactionId": "WAL123"
  }
}
```

**Response (SMS):**
```
"Dear User, ₹500 has been successfully added to your WyapaarPay wallet. Txn ID: WAL123. Thank you for using WyapaarPay."
```

### Login Success Example

```bash
POST /api/v1/notifications/send-template
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "LOGIN_SUCCESS",
  "language": "hi",
  "context": {}
}
```

**Response (SMS):**
```
"प्रिय उपयोगकर्ता, WyaparPay में वापसी पर स्वागत है! आप सफलतापूर्वक लॉग इन हो गए हैं। सेवाओं का उपयोग सुरक्षित रूप से और आसानी से जारी रखें।"
```

### Preview Template

```bash
GET /api/v1/notifications/templates/TRANSACTION_SUCCESS/preview?language=en&amount=100&currency=₹
```

### List All Templates

```bash
GET /api/v1/notifications/templates
```

## Template Variables

Templates support variable substitution using `{{variableName}}` syntax:

- `{{userName}}` - User's name
- `{{amount}}` - Transaction amount
- `{{currency}}` - Currency symbol (₹, $)
- `{{transactionId}}` - Transaction reference
- `{{otp}}` - One-time password
- `{{reason}}` - Reason for action
- `{{loginLocation}}` - Login location
- `{{loginDevice}}` - Login device

## Language Support

- **English (en)** - Default language
- **Hindi (hi)** - हिंदी
- **Kannada (kn)** - ಕನ್ನಡ

## Adding New Templates

1. Add new `NotificationType` enum value
2. Create template object in `NOTIFICATION_TEMPLATES`
3. Include translations for all supported languages
4. Define appropriate context variables

```typescript
[NotificationType.NEW_TEMPLATE]: {
  type: NotificationType.NEW_TEMPLATE,
  category: 'transaction',
  priority: 'normal',
  templates: {
    push: {
      title: {
        en: 'Title in English',
        hi: 'हिंदी में शीर्षक',
        kn: 'ಕನ್ನಡದಲ್ಲಿ ಶೀರ್ಷಿಕೆ',
      },
      body: {
        en: 'Message with {{variable}}',
        hi: 'संदेश जिसमें {{variable}} है',
        kn: 'ಸಂದೇಶದಲ್ಲಿ {{variable}} ಇದೆ',
      },
    },
    sms: {
      message: {
        en: 'SMS message with {{variable}}',
        hi: 'एसएमएस संदेश जिसमें {{variable}} है',
        kn: 'ಎಸ್‌ಎಂಎಸ್ ಸಂದೇಶದಲ್ಲಿ {{variable}} ಇದೆ',
      },
    },
  },
},
```

## Integration with Services

### From Backend Services

```typescript
import { NotificationService } from '../common/templates/notification-service';
import { NotificationType } from '../common/templates/notification-templates';

@Injectable()
export class SomeService {
  constructor(private notificationService: NotificationService) {}

  async processTransaction(userId: string, amount: number) {
    // Process transaction...

    // Send success notification
    await this.notificationService.sendPushNotification(
      userId,
      NotificationType.TRANSACTION_SUCCESS,
      'en', // or get from user preferences
      {
        amount,
        currency: '₹',
        transactionId: 'TXN123',
      }
    );
  }
}
```

### From Controllers

```typescript
@Post('recharge')
async recharge(@Body() dto: RechargeDto, @Request() req) {
  const result = await this.rechargeService.processRecharge(dto, req.user.id);

  if (result.success) {
    // Send success notification
    await this.notificationService.sendDualNotification(
      req.user.id,
      req.user.phone,
      NotificationType.RECHARGE_SUCCESS,
      req.user.language || 'en',
      {
        amount: dto.amount,
        transactionId: result.transactionId,
      }
    );
  }
}
```

## Best Practices

1. **Use Templates**: Always use templates instead of hardcoded messages
2. **Language Support**: Provide translations for all supported languages
3. **Context Variables**: Use descriptive variable names
4. **Consistent Formatting**: Follow existing template patterns
5. **Error Handling**: Templates should be validated before deployment
6. **Testing**: Test templates in all languages with real data

## Future Enhancements

- Email template support
- Dynamic template loading from database
- A/B testing for notification content
- Personalized content based on user behavior
- Rich media support in push notifications
