/**
 * Generic Receipt Generator
 * Generates formatted receipts for any transaction type
 */

import {
  GenericTransactionData,
  TransactionField,
  CompanyInfo,
  PaymentSuccessConfig,
  TRANSACTION_TYPES,
} from '../types/generic-transaction';

export class GenericReceiptGenerator {
  /**
   * Generate text receipt for sharing
   */
  static generateTextReceipt(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): string {
    const company = transactionData.companyInfo || { name: 'WyaparPay' };
    const template = config.receiptTemplate || 'default';

    const date = new Date(transactionData.createdAt).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    const receiptLines = [
      '🎉 Payment Successful!',
      '',
      `📱 ${company.name} Payment Receipt`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `💰 Amount: ₹${transactionData.amount.toFixed(2)}`,
      `🆔 Transaction ID: ${transactionData.transactionId}`,
      `📅 Date: ${date}`,
      `✅ Status: ${transactionData.status.toUpperCase()}`,
    ];

    // Add transaction-specific fields
    transactionData.fields.forEach((field) => {
      if (!field.sensitive) {
        const icon = this.getFieldIcon(field.key, field.icon);
        const value = this.formatFieldValue(field.value, field.type);
        receiptLines.push(`${icon} ${field.label}: ${value}`);
      }
    });

    // Add description if available
    if (transactionData.description) {
      receiptLines.push(`📝 Description: ${transactionData.description}`);
    }

    // Add reference if available
    if (transactionData.reference) {
      receiptLines.push(`🔗 Reference: ${transactionData.reference}`);
    }

    receiptLines.push(
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Thank you for using ${company.name}! 🚀`,
      ''
    );

    // Add company contact info
    if (company.supportEmail) {
      receiptLines.push(`📧 Support: ${company.supportEmail}`);
    }
    if (company.supportPhone) {
      receiptLines.push(`📞 Help: ${company.supportPhone}`);
    }
    if (company.website) {
      receiptLines.push(`🌐 Website: ${company.website}`);
    }

    receiptLines.push('', `Download ${company.name} App for more services!`);

    return receiptLines.join('\n');
  }

  /**
   * Generate WhatsApp receipt
   */
  static generateWhatsAppReceipt(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): string {
    const company = transactionData.companyInfo || { name: 'WyaparPay' };

    const date = new Date(transactionData.createdAt).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );

    const receiptLines = [
      '🎉 *Payment Successful!*',
      '',
      `📱 *${company.name} Payment Receipt*`,
      '',
      `💰 *Amount:* ₹${transactionData.amount.toFixed(2)}`,
      `🆔 *Transaction ID:* ${transactionData.transactionId}`,
      `📅 *Date:* ${date}`,
      `✅ *Status:* ${transactionData.status.toUpperCase()}`,
    ];

    // Add transaction-specific fields
    transactionData.fields.forEach((field) => {
      if (!field.sensitive) {
        const icon = this.getFieldIcon(field.key, field.icon);
        const value = this.formatFieldValue(field.value, field.type);
        receiptLines.push(`${icon} *${field.label}:* ${value}`);
      }
    });

    receiptLines.push(
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `Thank you for using *${company.name}*! 🚀`
    );

    return receiptLines.join('\n');
  }

  /**
   * Generate SMS receipt
   */
  static generateSMSReceipt(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): string {
    const company = transactionData.companyInfo || { name: 'WyaparPay' };

    const date = new Date(transactionData.createdAt).toLocaleDateString(
      'en-IN',
      {
        month: 'short',
        day: 'numeric',
      }
    );

    const receiptLines = [
      `Payment Successful! ${company.name}`,
      '',
      `Amount: ₹${transactionData.amount.toFixed(2)}`,
      `Txn ID: ${transactionData.transactionId}`,
      `Date: ${date}`,
      `Status: ${transactionData.status.toUpperCase()}`,
    ];

    // Add key fields only (SMS is limited)
    const keyFields = transactionData.fields.filter(
      (field) =>
        !field.sensitive &&
        ['mobileNumber', 'customerId', 'recipientName', 'operator'].includes(
          field.key
        )
    );

    keyFields.forEach((field) => {
      const value = this.formatFieldValue(field.value, field.type);
      receiptLines.push(`${field.label}: ${value}`);
    });

    receiptLines.push('', `Thank you for using ${company.name}!`);

    return receiptLines.join('\n');
  }

  /**
   * Generate HTML receipt for email
   */
  static generateHTMLReceipt(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): string {
    const company = transactionData.companyInfo || { name: 'WyaparPay' };

    const date = new Date(transactionData.createdAt).toLocaleDateString(
      'en-IN',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    const fieldsHTML = transactionData.fields
      .filter((field) => !field.sensitive)
      .map((field) => {
        const value = this.formatFieldValue(field.value, field.type);
        return `
          <div class="detail-row">
            <span class="detail-label">${field.label}:</span>
            <span class="detail-value">${value}</span>
          </div>
        `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - ${company.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .receipt { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
        .success-icon { font-size: 48px; color: #4CAF50; margin-bottom: 10px; }
        .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 16px; }
        .details { margin-bottom: 30px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .amount { font-size: 20px; font-weight: bold; color: #4CAF50; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        .company-info { margin-top: 20px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="success-icon">✅</div>
            <div class="title">Payment Successful!</div>
            <div class="subtitle">${company.name} Payment Receipt</div>
        </div>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">₹${transactionData.amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${transactionData.transactionId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4CAF50; font-weight: bold;">${transactionData.status.toUpperCase()}</span>
            </div>
            ${fieldsHTML}
        </div>
        
        <div class="footer">
            <p>Thank you for using ${company.name}! 🚀</p>
            <div class="company-info">
                ${company.supportEmail ? `<p>📧 Support: ${company.supportEmail}</p>` : ''}
                ${company.supportPhone ? `<p>📞 Help: ${company.supportPhone}</p>` : ''}
                ${company.website ? `<p>🌐 Website: ${company.website}</p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get field icon based on field key or custom icon
   */
  private static getFieldIcon(fieldKey: string, customIcon?: string): string {
    if (customIcon) return customIcon;

    const iconMap: Record<string, string> = {
      mobileNumber: '📞',
      phone: '📞',
      operator: '🏢',
      circle: '🌍',
      plan: '📋',
      customerId: '👤',
      billNumber: '🧾',
      dueDate: '📅',
      billType: '📄',
      recipientName: '👤',
      recipientPhone: '📞',
      transferType: '🔄',
      upiId: '💳',
      paymentMethod: '💳',
      bankName: '🏦',
      transactionFee: '💰',
      loanId: '🏦',
      emiAmount: '💰',
      remainingEmis: '📊',
      policyNumber: '🛡️',
      premiumAmount: '💰',
      insuranceType: '📋',
    };

    return iconMap[fieldKey] || '📝';
  }

  /**
   * Format field value based on type
   */
  private static formatFieldValue(
    value: string | number,
    type: string
  ): string {
    switch (type) {
      case 'currency':
        return `₹${Number(value).toFixed(2)}`;
      case 'date':
        return new Date(value).toLocaleDateString('en-IN');
      case 'phone':
        return String(value);
      case 'email':
        return String(value);
      case 'url':
        return String(value);
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }

  /**
   * Create transaction data from legacy transaction object
   */
  static createFromLegacyTransaction(
    transaction: any,
    transactionType: string = 'recharge',
    companyInfo?: CompanyInfo
  ): GenericTransactionData {
    const typeConfig =
      TRANSACTION_TYPES[
        transactionType.toUpperCase() as keyof typeof TRANSACTION_TYPES
      ];

    const fields: TransactionField[] = [];

    // Add common fields
    if (transaction.metadata) {
      Object.entries(transaction.metadata).forEach(([key, value]) => {
        const fieldConfig = typeConfig?.fields.find((f) => f.key === key);
        if (fieldConfig) {
          fields.push({
            key,
            label: fieldConfig.label,
            value: String(value),
            type: fieldConfig.type,
            icon: fieldConfig.icon,
            copyable: (fieldConfig as any).copyable,
          });
        }
      });
    }

    return {
      transactionId: transaction.id || transaction.transactionId,
      amount: transaction.amount,
      status: transaction.status,
      type: transaction.type || transactionType,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      description: transaction.description,
      reference: transaction.reference || transaction.customerRef,
      gatewayRef: transaction.gatewayRef,
      upiRef: transaction.upiRef,
      bankRef: transaction.bankRef,
      fields,
      metadata: transaction.metadata,
      companyInfo: companyInfo || { name: 'WyaparPay' },
    };
  }
}
