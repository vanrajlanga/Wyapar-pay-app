/**
 * Payment Success Screen Usage Examples
 * Demonstrates how to use the generic PaymentSuccessScreen for different transaction types
 */

import {
  GenericTransactionData,
  PaymentSuccessConfig,
  TRANSACTION_TYPES,
} from '../types/generic-transaction';
import { PaymentSuccessScreen } from '../components/screens/PaymentSuccessScreen';

// Example 1: Mobile Recharge Success
export const createRechargeSuccessData = (
  rechargeResult: any
): GenericTransactionData => {
  return {
    transactionId: rechargeResult.transactionId,
    amount: rechargeResult.amount,
    status: 'success',
    type: 'recharge',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'mobileNumber',
        label: 'Mobile Number',
        value: rechargeResult.mobileNumber,
        type: 'phone',
        icon: '📞',
        copyable: true,
      },
      {
        key: 'operator',
        label: 'Operator',
        value: rechargeResult.operatorName,
        type: 'text',
        icon: '🏢',
      },
      {
        key: 'circle',
        label: 'Circle',
        value: rechargeResult.circleName,
        type: 'text',
        icon: '🌍',
      },
      {
        key: 'plan',
        label: 'Plan',
        value: rechargeResult.planName,
        type: 'text',
        icon: '📋',
      },
    ],
    description: `Mobile recharge for ${rechargeResult.mobileNumber}`,
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Example 2: Bill Payment Success
export const createBillPaymentSuccessData = (
  billResult: any
): GenericTransactionData => {
  return {
    transactionId: billResult.transactionId,
    amount: billResult.amount,
    status: 'success',
    type: 'bill_payment',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'customerId',
        label: 'Customer ID',
        value: billResult.customerId,
        type: 'text',
        icon: '👤',
        copyable: true,
      },
      {
        key: 'billNumber',
        label: 'Bill Number',
        value: billResult.billNumber,
        type: 'text',
        icon: '🧾',
        copyable: true,
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        value: billResult.dueDate,
        type: 'date',
        icon: '📅',
      },
      {
        key: 'billType',
        label: 'Bill Type',
        value: billResult.billType,
        type: 'text',
        icon: '📄',
      },
    ],
    description: `${billResult.billType} bill payment`,
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Example 3: Money Transfer Success
export const createTransferSuccessData = (
  transferResult: any
): GenericTransactionData => {
  return {
    transactionId: transferResult.transactionId,
    amount: transferResult.amount,
    status: 'success',
    type: 'transfer',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'recipientName',
        label: 'Recipient',
        value: transferResult.recipientName,
        type: 'text',
        icon: '👤',
        copyable: true,
      },
      {
        key: 'recipientPhone',
        label: 'Recipient Phone',
        value: transferResult.recipientPhone,
        type: 'phone',
        icon: '📞',
        copyable: true,
      },
      {
        key: 'transferType',
        label: 'Transfer Type',
        value: transferResult.transferType,
        type: 'text',
        icon: '🔄',
      },
      {
        key: 'upiId',
        label: 'UPI ID',
        value: transferResult.upiId,
        type: 'text',
        icon: '💳',
        copyable: true,
      },
    ],
    description: `Money transfer to ${transferResult.recipientName}`,
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Example 4: Wallet Top-up Success
export const createWalletTopupSuccessData = (
  topupResult: any
): GenericTransactionData => {
  return {
    transactionId: topupResult.transactionId,
    amount: topupResult.amount,
    status: 'success',
    type: 'wallet_topup',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        value: topupResult.paymentMethod,
        type: 'text',
        icon: '💳',
      },
      {
        key: 'bankName',
        label: 'Bank',
        value: topupResult.bankName,
        type: 'text',
        icon: '🏦',
      },
      {
        key: 'transactionFee',
        label: 'Transaction Fee',
        value: topupResult.fee,
        type: 'currency',
        icon: '💰',
      },
    ],
    description: 'Wallet top-up',
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Example 5: Loan Repayment Success
export const createLoanRepaymentSuccessData = (
  loanResult: any
): GenericTransactionData => {
  return {
    transactionId: loanResult.transactionId,
    amount: loanResult.amount,
    status: 'success',
    type: 'loan_repayment',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'loanId',
        label: 'Loan ID',
        value: loanResult.loanId,
        type: 'text',
        icon: '🏦',
        copyable: true,
      },
      {
        key: 'emiAmount',
        label: 'EMI Amount',
        value: loanResult.emiAmount,
        type: 'currency',
        icon: '💰',
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        value: loanResult.dueDate,
        type: 'date',
        icon: '📅',
      },
      {
        key: 'remainingEmis',
        label: 'Remaining EMIs',
        value: loanResult.remainingEmis,
        type: 'number',
        icon: '📊',
      },
    ],
    description: 'Loan EMI payment',
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Example 6: Insurance Premium Success
export const createInsurancePremiumSuccessData = (
  insuranceResult: any
): GenericTransactionData => {
  return {
    transactionId: insuranceResult.transactionId,
    amount: insuranceResult.amount,
    status: 'success',
    type: 'insurance_premium',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'policyNumber',
        label: 'Policy Number',
        value: insuranceResult.policyNumber,
        type: 'text',
        icon: '🛡️',
        copyable: true,
      },
      {
        key: 'premiumAmount',
        label: 'Premium Amount',
        value: insuranceResult.premiumAmount,
        type: 'currency',
        icon: '💰',
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        value: insuranceResult.dueDate,
        type: 'date',
        icon: '📅',
      },
      {
        key: 'insuranceType',
        label: 'Insurance Type',
        value: insuranceResult.insuranceType,
        type: 'text',
        icon: '📋',
      },
    ],
    description: 'Insurance premium payment',
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };
};

// Configuration Examples

// Example 1: Default Configuration
export const defaultConfig: PaymentSuccessConfig = {
  title: 'Payment Successful!',
  subtitle: 'Your transaction has been completed successfully',
  showShareButton: true,
  showHistoryButton: true,
  showDashboardButton: true,
  enableSharing: true,
  sharingPlatforms: ['whatsapp', 'email', 'sms', 'other'],
};

// Example 2: Recharge-specific Configuration
export const rechargeConfig: PaymentSuccessConfig = {
  title: 'Recharge Successful!',
  subtitle: 'Your mobile recharge has been completed',
  successIcon: 'phone-android',
  successColor: '#4CAF50',
  showShareButton: true,
  showHistoryButton: true,
  showDashboardButton: true,
  enableSharing: true,
  sharingPlatforms: ['whatsapp', 'email', 'sms'],
  customActions: [
    {
      id: 'recharge-again',
      title: 'Recharge Again',
      icon: 'refresh',
      variant: 'outline',
      onPress: () => {},
    },
  ],
};

// Example 3: Bill Payment Configuration
export const billPaymentConfig: PaymentSuccessConfig = {
  title: 'Bill Payment Successful!',
  subtitle: 'Your bill has been paid successfully',
  successIcon: 'receipt',
  successColor: '#2196F3',
  showShareButton: true,
  showHistoryButton: true,
  showDashboardButton: true,
  enableSharing: true,
  sharingPlatforms: ['whatsapp', 'email', 'sms'],
  customActions: [
    {
      id: 'pay-another-bill',
      title: 'Pay Another Bill',
      icon: 'add',
      variant: 'outline',
      onPress: () => {},
    },
  ],
};

// Example 4: Transfer Configuration
export const transferConfig: PaymentSuccessConfig = {
  title: 'Transfer Successful!',
  subtitle: 'Your money transfer has been completed',
  successIcon: 'swap-horiz',
  successColor: '#FF9800',
  showShareButton: true,
  showHistoryButton: true,
  showDashboardButton: true,
  enableSharing: true,
  sharingPlatforms: ['whatsapp', 'email', 'sms'],
  customActions: [
    {
      id: 'transfer-again',
      title: 'Transfer Again',
      icon: 'repeat',
      variant: 'outline',
      onPress: () => {},
    },
  ],
};

// Example 5: Minimal Configuration
export const minimalConfig: PaymentSuccessConfig = {
  title: 'Success!',
  subtitle: 'Transaction completed',
  showShareButton: false,
  showHistoryButton: false,
  showDashboardButton: true,
  enableSharing: false,
  theme: 'minimal',
};

// Usage Examples in Components

// Example 1: Using in Recharge Flow
export const RechargeSuccessExample = () => {
  const handleRechargeSuccess = (rechargeResult: any) => {
    const transactionData = createRechargeSuccessData(rechargeResult);

    // This would typically navigate to the PaymentSuccessScreen
    // For now, just log the data
    // Example data for recharge success
  };

  return null; // This component doesn't render anything directly
};

// Example 2: Using in Bill Payment Flow
export const BillPaymentSuccessExample = () => {
  const handleBillPaymentSuccess = (billResult: any) => {
    const transactionData = createBillPaymentSuccessData(billResult);

    // This would typically navigate to the PaymentSuccessScreen
    // For now, just log the data
    // Example data for bill payment success
  };

  return null; // This component doesn't render anything directly
};

// Example 3: Using Legacy Props (Backward Compatibility)
export const LegacyUsageExample = () => {
  return (
    <PaymentSuccessScreen
      transactionId="TXN123456789"
      amount={299}
      operatorName="Airtel"
      mobileNumber="9876543210"
      planName="₹299 Data Pack"
      config={rechargeConfig}
      triggerHaptic={() => {}}
      currentScreen="payment-success"
      setCurrentScreen={() => {}}
    />
  );
};

// Example 4: Custom Configuration
export const CustomConfigExample = () => {
  const customConfig: PaymentSuccessConfig = {
    title: '🎉 Awesome!',
    subtitle: 'Your payment went through smoothly',
    successIcon: 'star',
    successColor: '#FFD700',
    gradientColors: ['#FF6B6B', '#4ECDC4'],
    showShareButton: true,
    showHistoryButton: false,
    showDashboardButton: true,
    enableSharing: true,
    sharingPlatforms: ['whatsapp', 'email'],
    customActions: [
      {
        id: 'rate-service',
        title: 'Rate Service',
        icon: 'star',
        variant: 'primary',
        onPress: () => {},
      },
      {
        id: 'feedback',
        title: 'Give Feedback',
        icon: 'feedback',
        variant: 'outline',
        onPress: () => {},
      },
    ],
  };

  const transactionData: GenericTransactionData = {
    transactionId: 'TXN123456789',
    amount: 299,
    status: 'success',
    type: 'recharge',
    createdAt: new Date().toISOString(),
    fields: [
      {
        key: 'mobileNumber',
        label: 'Mobile Number',
        value: '9876543210',
        type: 'phone',
        icon: '📞',
        copyable: true,
      },
    ],
    companyInfo: {
      name: 'WyaparPay',
      website: 'https://wyaparpay.com',
      supportEmail: 'support@wyaparpay.com',
      supportPhone: '+91-8000000000',
    },
  };

  return null; // This component doesn't render anything directly
};
