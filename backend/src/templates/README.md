# 📧 Templates Directory Structure

This directory contains all email and SMS templates organized by workflow.

## 📁 Directory Structure

```
templates/
├── email/          # HTML email templates
│   ├── account-verification.html
│   ├── password-reset.html
│   ├── welcome.html
│   └── ...
└── sms/            # JSON SMS templates (multi-language)
    ├── otp-sent.json
    ├── welcome-message.json
    ├── login-success.json
    ├── recharge-success.json
    ├── wallet-topup-success.json
    ├── transaction-success.json
    └── ...
```

## 📧 Email Templates

**Location**: `templates/email/{workflow-name}.html`

**Format**: HTML files with inline styles and placeholders

**Placeholder Format**: `{{variableName}}`

**Example**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Inline styles */
    </style>
</head>
<body>
    <h1>Hello {{userName}}</h1>
    <p>Your verification code is: {{verificationCode}}</p>
</body>
</html>
```

**Available Email Templates**:
- `account-verification.html` - Account verification email
- `password-reset.html` - Password reset email
- `welcome.html` - Welcome email for new users

## 📱 SMS Templates

**Location**: `templates/sms/{workflow-name}.json`

**Format**: JSON files with multi-language support

**Structure**:
```json
{
  "workflow": "otp_sent",
  "category": "security",
  "priority": "high",
  "languages": {
    "en": "Dear User, Your OTP for WyapaarPay login is {{otp}}...",
    "hi": "प्रिय उपयोगकर्ता, आपके WyapaarPay लॉगिन के लिए OTP {{otp}} है...",
    "kn": "ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, ನಿಮ್ಮ WyapaarPay ಲಾಗಿನ್‌ಗಾಗಿ OTP {{otp}}..."
  },
  "variables": ["otp"]
}
```

**Available SMS Templates**:
- `otp-sent.json` - OTP for login
- `welcome-message.json` - Welcome message for new users
- `login-success.json` - Login success confirmation
- `recharge-success.json` - Recharge success notification
- `wallet-topup-success.json` - Wallet top-up success
- `transaction-success.json` - Transaction success
- `transaction-failed.json` - Transaction failure

## 🔧 Workflow Naming Convention

Templates are named after their workflow/use case:

**Email Templates**:
- `account-verification` → Account verification workflow
- `password-reset` → Password reset workflow
- `welcome` → Welcome new users workflow

**SMS Templates**:
- `otp-sent` → OTP sending workflow
- `welcome-message` → Welcome message workflow
- `login-success` → Login success workflow
- `recharge-success` → Recharge success workflow
- `wallet-topup-success` → Wallet top-up workflow
- `transaction-success` → Transaction success workflow
- `transaction-failed` → Transaction failure workflow

## 📝 Adding New Templates

### Adding Email Template

1. Create HTML file: `templates/email/{workflow-name}.html`
2. Use inline styles (for email client compatibility)
3. Use `{{variableName}}` for placeholders
4. Update email service to use the new template

**Example**:
```html
<!-- templates/email/kyc-approved.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    <h1>KYC Approved!</h1>
    <p>Hello {{userName}},</p>
    <p>Your KYC has been approved on {{approvalDate}}.</p>
</body>
</html>
```

### Adding SMS Template

1. Create JSON file: `templates/sms/{workflow-name}.json`
2. Include all supported languages (en, hi, kn)
3. List all variables in the `variables` array
4. Use `{{variableName}}` for placeholders

**Example**:
```json
{
  "workflow": "kyc_approved",
  "category": "kyc",
  "priority": "high",
  "languages": {
    "en": "Your KYC has been approved. Reference ID: {{referenceId}}",
    "hi": "आपका KYC स्वीकृत किया गया है। संदर्भ ID: {{referenceId}}",
    "kn": "ನಿಮ್ಮ KYC ಅನುಮೋದಿಸಲಾಗಿದೆ. ಉಲ್ಲೇಖ ID: {{referenceId}}"
  },
  "variables": ["referenceId"]
}
```

## 🚀 Usage

### Loading Email Template

```typescript
import { TemplateLoaderService } from '../common/templates/template-loader.service';

const templateLoader = new TemplateLoaderService();

const html = templateLoader.loadEmailTemplate('account-verification', {
  userName: 'John Doe',
  verificationCode: '123456',
  verificationLink: 'https://...'
});
```

### Loading SMS Template

```typescript
const smsMessage = templateLoader.loadSmsTemplate(
  'otp-sent',
  'en', // language
  { otp: '123456' }
);
```

## 🌍 Supported Languages

- **English (en)** - Default
- **Hindi (hi)** - हिंदी
- **Kannada (kn)** - ಕನ್ನಡ

## 📚 Related Files

- **Template Loader Service**: `backend/src/common/templates/template-loader.service.ts`
- **Email Service**: `backend/src/common/email/email.service.ts`
- **Notification Templates**: `backend/src/common/templates/notification-templates.ts`

## ✅ Best Practices

1. **Naming**: Use kebab-case for workflow names (e.g., `account-verification`)
2. **Variables**: Use camelCase for variable names (e.g., `{{userName}}`)
3. **Email Styles**: Always use inline styles for email templates
4. **SMS Length**: Keep SMS messages under 160 characters when possible
5. **Multi-language**: Always provide translations for all supported languages
6. **Testing**: Test templates with actual data before deploying

---

**Last Updated**: 2024
**Maintained By**: WyaparPay Development Team

