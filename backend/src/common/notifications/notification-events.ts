/**
 * Notification Events
 * 
 * Event-driven notification system for loose coupling.
 * Services emit events, and notification handlers listen and send notifications.
 */

export enum NotificationEventType {
  // Transaction events
  TRANSACTION_SUCCESS = 'transaction.success',
  TRANSACTION_FAILED = 'transaction.failed',
  RECHARGE_SUCCESS = 'recharge.success',
  RECHARGE_FAILED = 'recharge.failed',
  WALLET_TOPUP_SUCCESS = 'wallet.topup.success',

  // Auth events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGIN_NEW_DEVICE = 'user.login.new_device',
  OTP_SENT = 'otp.sent',
  PASSWORD_CHANGED = 'password.changed',
  ACCOUNT_VERIFIED = 'account.verified',

  // KYC events
  KYC_APPROVED = 'kyc.approved',
  KYC_REJECTED = 'kyc.rejected',
}

export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  data: Record<string, any>;
  metadata?: {
    language?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Event payload interfaces for type safety
 */
export interface TransactionEventData {
  transactionId: string;
  amount: number;
  currency?: string;
  type?: string;
  category?: string;
  reason?: string;
}

export interface RechargeEventData {
  transactionId: string;
  amount: number;
  phoneNumber: string;
  operator?: string;
  currency?: string;
  reason?: string;
}

export interface WalletTopupEventData {
  transactionId: string;
  amount: number;
  currency?: string;
}

export interface LoginEventData {
  ipAddress?: string;
  userAgent?: string;
  isNewDevice?: boolean;
}

export interface KycEventData {
  reason?: string;
  level?: string;
}

