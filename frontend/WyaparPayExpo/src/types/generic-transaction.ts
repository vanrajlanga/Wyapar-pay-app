/**
 * Generic Transaction Data Interface
 * Flexible interface for any type of payment transaction
 */

export interface GenericTransactionData {
  // Core transaction info
  transactionId: string;
  amount: number;
  status:
    | 'success'
    | 'failed'
    | 'pending'
    | 'processing'
    | 'cancelled'
    | 'refunded';
  type: string; // e.g., 'recharge', 'bill_payment', 'transfer', 'wallet_topup'

  // Timestamps
  createdAt: string;
  completedAt?: string;

  // Optional transaction details
  description?: string;
  reference?: string;
  gatewayRef?: string;
  upiRef?: string;
  bankRef?: string;

  // Dynamic fields - can contain any transaction-specific data
  fields: TransactionField[];

  // Metadata for additional context
  metadata?: Record<string, any>;

  // Company/branding info
  companyInfo?: CompanyInfo;
}

export interface TransactionField {
  key: string;
  label: string;
  value: string | number;
  type: 'text' | 'number' | 'currency' | 'date' | 'phone' | 'email' | 'url';
  icon?: string;
  copyable?: boolean;
  sensitive?: boolean; // For fields that shouldn't be shared
}

export interface CompanyInfo {
  name: string;
  logo?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
}

export interface PaymentSuccessConfig {
  // Screen customization
  title?: string;
  subtitle?: string;
  successIcon?: string;
  successColor?: string;

  // Action buttons
  showShareButton?: boolean;
  showHistoryButton?: boolean;
  showDashboardButton?: boolean;
  customActions?: CustomAction[];

  // Receipt customization
  receiptTemplate?: 'default' | 'minimal' | 'detailed' | 'custom';
  customReceiptTemplate?: string;

  // Sharing options
  enableSharing?: boolean;
  sharingPlatforms?: SharingPlatform[];

  // UI customization
  theme?: 'default' | 'minimal' | 'premium';
  gradientColors?: string[];

  // Company info override
  companyInfo?: CompanyInfo;
}

export interface CustomAction {
  id: string;
  title: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
}

export type SharingPlatform =
  | 'whatsapp'
  | 'email'
  | 'sms'
  | 'telegram'
  | 'facebook'
  | 'twitter'
  | 'other';

// Predefined transaction types with their field configurations
export const TRANSACTION_TYPES = {
  RECHARGE: {
    type: 'recharge',
    fields: [
      {
        key: 'mobileNumber',
        label: 'Mobile Number',
        type: 'phone',
        icon: 'phone',
        copyable: true,
      },
      { key: 'operator', label: 'Operator', type: 'text', icon: 'business' },
      { key: 'circle', label: 'Circle', type: 'text', icon: 'location-on' },
      { key: 'plan', label: 'Plan', type: 'text', icon: 'plan' },
    ],
  },
  BILL_PAYMENT: {
    type: 'bill_payment',
    fields: [
      {
        key: 'customerId',
        label: 'Customer ID',
        type: 'text',
        icon: 'person',
        copyable: true,
      },
      {
        key: 'billNumber',
        label: 'Bill Number',
        type: 'text',
        icon: 'receipt',
        copyable: true,
      },
      { key: 'dueDate', label: 'Due Date', type: 'date', icon: 'event' },
      { key: 'billType', label: 'Bill Type', type: 'text', icon: 'category' },
    ],
  },
  TRANSFER: {
    type: 'transfer',
    fields: [
      {
        key: 'recipientName',
        label: 'Recipient',
        type: 'text',
        icon: 'person',
        copyable: true,
      },
      {
        key: 'recipientPhone',
        label: 'Recipient Phone',
        type: 'phone',
        icon: 'phone',
        copyable: true,
      },
      {
        key: 'transferType',
        label: 'Transfer Type',
        type: 'text',
        icon: 'swap-horiz',
      },
      {
        key: 'upiId',
        label: 'UPI ID',
        type: 'text',
        icon: 'account-balance-wallet',
        copyable: true,
      },
    ],
  },
  WALLET_TOPUP: {
    type: 'wallet_topup',
    fields: [
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        type: 'text',
        icon: 'credit-card',
      },
      { key: 'bankName', label: 'Bank', type: 'text', icon: 'account-balance' },
      {
        key: 'transactionFee',
        label: 'Transaction Fee',
        type: 'currency',
        icon: 'attach-money',
      },
    ],
  },
  LOAN_REPAYMENT: {
    type: 'loan_repayment',
    fields: [
      {
        key: 'loanId',
        label: 'Loan ID',
        type: 'text',
        icon: 'account-balance',
        copyable: true,
      },
      {
        key: 'emiAmount',
        label: 'EMI Amount',
        type: 'currency',
        icon: 'attach-money',
      },
      { key: 'dueDate', label: 'Due Date', type: 'date', icon: 'event' },
      {
        key: 'remainingEmis',
        label: 'Remaining EMIs',
        type: 'number',
        icon: 'schedule',
      },
    ],
  },
  INSURANCE_PREMIUM: {
    type: 'insurance_premium',
    fields: [
      {
        key: 'policyNumber',
        label: 'Policy Number',
        type: 'text',
        icon: 'security',
        copyable: true,
      },
      {
        key: 'premiumAmount',
        label: 'Premium Amount',
        type: 'currency',
        icon: 'attach-money',
      },
      { key: 'dueDate', label: 'Due Date', type: 'date', icon: 'event' },
      {
        key: 'insuranceType',
        label: 'Insurance Type',
        type: 'text',
        icon: 'category',
      },
    ],
  },
} as const;

// Default company info
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'WyaparPay',
  website: 'https://wyaparpay.com',
  supportEmail: 'support@wyaparpay.com',
  supportPhone: '+91-8000000000',
};

// Default success screen configuration
export const DEFAULT_SUCCESS_CONFIG: PaymentSuccessConfig = {
  title: 'Payment Successful!',
  subtitle: 'Your transaction has been completed successfully',
  successIcon: 'check-circle',
  successColor: '#4CAF50',
  showShareButton: true,
  showHistoryButton: true,
  showDashboardButton: true,
  enableSharing: true,
  sharingPlatforms: ['whatsapp', 'email', 'sms', 'other'],
  receiptTemplate: 'default',
  theme: 'default',
  gradientColors: ['#667eea', '#764ba2'],
};
