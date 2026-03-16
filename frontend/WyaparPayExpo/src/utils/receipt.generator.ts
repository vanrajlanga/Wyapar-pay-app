/**
 * Receipt Generator Utility
 * Generates formatted receipt content for sharing
 */

import { Transaction } from '../types/transaction';

export interface ReceiptData {
  transaction: Transaction;
  companyName?: string;
  companyLogo?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
}

export class ReceiptGenerator {
  private static readonly COMPANY_INFO = {
    name: 'WyaparPay',
    website: 'https://wyaparpay.com',
    supportEmail: 'support@wyaparpay.com',
    supportPhone: '+91-8000000000',
  };

  /**
   * Generate text receipt for sharing
   */
  static generateTextReceipt(data: ReceiptData): string {
    const { transaction } = data;
    const company = { ...this.COMPANY_INFO, ...data };

    const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const receiptLines = [
      '🎉 Payment Successful!',
      '',
      `📱 ${company.name} Payment Receipt`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `💰 Amount: ₹${transaction.amount.toFixed(2)}`,
      `🆔 Transaction ID: ${transaction.id}`,
      `📅 Date: ${date}`,
      `✅ Status: ${transaction.status.toUpperCase()}`,
    ];

    // Add transaction-specific details
    if (transaction.metadata?.mobileNumber) {
      receiptLines.push(`📞 Mobile: ${transaction.metadata.mobileNumber}`);
    }
    if (transaction.metadata?.operatorName) {
      receiptLines.push(`🏢 Operator: ${transaction.metadata.operatorName}`);
    }
    if (transaction.metadata?.planName) {
      receiptLines.push(`📋 Plan: ${transaction.metadata.planName}`);
    }
    if (transaction.metadata?.circleCode) {
      receiptLines.push(`🌍 Circle: ${transaction.metadata.circleCode}`);
    }

    receiptLines.push(
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Thank you for using ${company.name}! 🚀`,
      '',
      `📧 Support: ${company.supportEmail}`,
      `📞 Help: ${company.supportPhone}`,
      `🌐 Website: ${company.website}`,
      '',
      'Download WyaparPay App for more services!'
    );

    return receiptLines.join('\n');
  }

  /**
   * Generate HTML receipt for email sharing
   */
  static generateHTMLReceipt(data: ReceiptData): string {
    const { transaction } = data;
    const company = { ...this.COMPANY_INFO, ...data };

    const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
                <span class="detail-value amount">₹${transaction.amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${transaction.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${date}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #4CAF50; font-weight: bold;">SUCCESS</span>
            </div>
            ${
              transaction.metadata?.mobileNumber
                ? `
            <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span class="detail-value">${transaction.metadata.mobileNumber}</span>
            </div>
            `
                : ''
            }
            ${
              transaction.metadata?.operatorName
                ? `
            <div class="detail-row">
                <span class="detail-label">Operator:</span>
                <span class="detail-value">${transaction.metadata.operatorName}</span>
            </div>
            `
                : ''
            }
            ${
              transaction.metadata?.planName
                ? `
            <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${transaction.metadata.planName}</span>
            </div>
            `
                : ''
            }
        </div>
        
        <div class="footer">
            <p>Thank you for using ${company.name}! 🚀</p>
            <div class="company-info">
                <p>📧 Support: ${company.supportEmail}</p>
                <p>📞 Help: ${company.supportPhone}</p>
                <p>🌐 Website: ${company.website}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate receipt for WhatsApp sharing
   */
  static generateWhatsAppReceipt(data: ReceiptData): string {
    const { transaction } = data;
    const company = { ...this.COMPANY_INFO, ...data };

    const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return `🎉 *Payment Successful!*

📱 *${company.name} Payment Receipt*

💰 *Amount:* ₹${transaction.amount.toFixed(2)}
🆔 *Transaction ID:* ${transaction.id}
📅 *Date:* ${date}
✅ *Status:* SUCCESS

${transaction.metadata?.mobileNumber ? `📞 *Mobile:* ${transaction.metadata.mobileNumber}` : ''}
${transaction.metadata?.operatorName ? `🏢 *Operator:* ${transaction.metadata.operatorName}` : ''}
${transaction.metadata?.planName ? `📋 *Plan:* ${transaction.metadata.planName}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for using *${company.name}*! 🚀

📧 Support: ${company.supportEmail}
📞 Help: ${company.supportPhone}
🌐 Website: ${company.website}`;
  }

  /**
   * Generate receipt for SMS sharing
   */
  static generateSMSReceipt(data: ReceiptData): string {
    const { transaction } = data;
    const company = { ...this.COMPANY_INFO, ...data };

    const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });

    return `Payment Successful! ${company.name}

Amount: ₹${transaction.amount.toFixed(2)}
Txn ID: ${transaction.id}
Date: ${date}
Status: SUCCESS

${transaction.metadata?.mobileNumber ? `Mobile: ${transaction.metadata.mobileNumber}` : ''}
${transaction.metadata?.operatorName ? `Operator: ${transaction.metadata.operatorName}` : ''}

Thank you for using ${company.name}!`;
  }

  /**
   * Get sharing options based on platform
   */
  static getSharingOptions(data: ReceiptData) {
    return {
      text: this.generateTextReceipt(data),
      html: this.generateHTMLReceipt(data),
      whatsapp: this.generateWhatsAppReceipt(data),
      sms: this.generateSMSReceipt(data),
    };
  }
}
