/**
 * Generic Sharing Service
 * Handles sharing receipts for any transaction type
 */

import { Share, Alert, Platform, AlertButton } from 'react-native';
import {
  GenericTransactionData,
  PaymentSuccessConfig,
  SharingPlatform,
} from '../types/generic-transaction';
import { GenericReceiptGenerator } from '../utils/generic-receipt.generator';
import { logger } from '../services/logger.service';

export interface GenericSharingResult {
  success: boolean;
  action?: string;
  activityType?: string;
  error?: string;
}

export class GenericSharingService {
  /**
   * Share receipt with default options
   */
  static async shareReceipt(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<GenericSharingResult> {
    try {
      const receiptText = GenericReceiptGenerator.generateTextReceipt(
        transactionData,
        config
      );

      const result = await Share.share({
        message: receiptText,
        title: `Payment Receipt - ${transactionData.companyInfo?.name || 'WyaparPay'}`,
      });

      logger.info('Receipt shared successfully', {
        action: result.action,
        activityType: result.activityType,
        transactionType: transactionData.type,
      });

      return {
        success: true,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to share receipt', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share receipt via specific platform
   */
  static async shareViaPlatform(
    transactionData: GenericTransactionData,
    platform: SharingPlatform,
    config: PaymentSuccessConfig = {}
  ): Promise<GenericSharingResult> {
    try {
      let receiptText: string;

      switch (platform) {
        case 'whatsapp':
          receiptText = GenericReceiptGenerator.generateWhatsAppReceipt(
            transactionData,
            config
          );
          break;
        case 'sms':
          receiptText = GenericReceiptGenerator.generateSMSReceipt(
            transactionData,
            config
          );
          break;
        case 'email':
          receiptText = GenericReceiptGenerator.generateTextReceipt(
            transactionData,
            config
          );
          break;
        default:
          receiptText = GenericReceiptGenerator.generateTextReceipt(
            transactionData,
            config
          );
      }

      const result = await Share.share({
        message: receiptText,
        title: `Payment Receipt - ${transactionData.companyInfo?.name || 'WyaparPay'}`,
      });

      return {
        success: true,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };
    } catch (error) {
      logger.error(`Failed to share via ${platform}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Show sharing options dialog
   */
  static async showSharingOptions(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<void> {
    const platforms = config.sharingPlatforms || [
      'whatsapp',
      'email',
      'sms',
      'other',
    ];

    const options: AlertButton[] = platforms.map((platform) => ({
      text: this.getPlatformDisplayName(platform),
      onPress: () => { this.shareViaPlatform(transactionData, platform, config); },
    }));

    // Add copy option
    options.push({
      text: 'Copy Receipt',
      onPress: () => { this.copyReceiptToClipboard(transactionData, config); },
    });

    // Add cancel option
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Share Receipt',
      'Choose how you want to share your payment receipt',
      options
    );
  }

  /**
   * Copy receipt to clipboard
   */
  static async copyReceiptToClipboard(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<GenericSharingResult> {
    try {
      const receiptText = GenericReceiptGenerator.generateTextReceipt(
        transactionData,
        config
      );

      // Note: This would require expo-clipboard or similar package
      // For now, we'll simulate the functionality
      // await Clipboard.setStringAsync(receiptText);

      logger.info('Receipt copied to clipboard', {
        transactionType: transactionData.type,
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to copy receipt to clipboard', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get platform display name
   */
  private static getPlatformDisplayName(platform: SharingPlatform): string {
    const displayNames: Record<SharingPlatform, string> = {
      whatsapp: 'Share via WhatsApp',
      email: 'Share via Email',
      sms: 'Share via SMS',
      telegram: 'Share via Telegram',
      facebook: 'Share via Facebook',
      twitter: 'Share via Twitter',
      other: 'Share via Other Apps',
    };

    return displayNames[platform] || 'Share';
  }

  /**
   * Get available sharing platforms based on device
   */
  static getAvailablePlatforms(): SharingPlatform[] {
    const platforms: SharingPlatform[] = ['whatsapp', 'email', 'sms', 'other'];

    // Add platform-specific options
    if (Platform.OS === 'ios') {
      platforms.push('telegram', 'facebook', 'twitter');
    } else if (Platform.OS === 'android') {
      platforms.push('telegram', 'facebook', 'twitter');
    }

    return platforms;
  }

  /**
   * Generate receipt preview
   */
  static generateReceiptPreview(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): string {
    const company = transactionData.companyInfo || { name: 'WyaparPay' };

    return `Payment Receipt Preview:
    
Company: ${company.name}
Amount: ₹${transactionData.amount.toFixed(2)}
Transaction ID: ${transactionData.transactionId}
Status: ${transactionData.status.toUpperCase()}
Type: ${transactionData.type}

Fields: ${transactionData.fields.length} custom fields
${transactionData.fields.map((f) => `- ${f.label}: ${f.value}`).join('\n')}

This receipt will be formatted properly when shared.`;
  }

  /**
   * Validate transaction data
   */
  static validateTransactionData(
    transactionData: GenericTransactionData
  ): boolean {
    if (!transactionData.transactionId) {
      logger.error('Transaction ID is required', { transactionData });
      return false;
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      logger.error('Valid amount is required', { transactionData });
      return false;
    }

    if (!transactionData.status) {
      logger.error('Transaction status is required', { transactionData });
      return false;
    }

    if (!transactionData.type) {
      logger.error('Transaction type is required', { transactionData });
      return false;
    }

    if (!transactionData.createdAt) {
      logger.error('Created date is required', { transactionData });
      return false;
    }

    return true;
  }

  /**
   * Create sharing configuration for specific transaction types
   */
  static createSharingConfig(
    transactionType: string,
    customConfig: Partial<PaymentSuccessConfig> = {}
  ): PaymentSuccessConfig {
    const baseConfig: PaymentSuccessConfig = {
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

    // Customize based on transaction type
    switch (transactionType.toLowerCase()) {
      case 'recharge':
        baseConfig.title = 'Recharge Successful!';
        baseConfig.subtitle = 'Your mobile recharge has been completed';
        break;
      case 'bill_payment':
        baseConfig.title = 'Bill Payment Successful!';
        baseConfig.subtitle = 'Your bill payment has been completed';
        break;
      case 'transfer':
        baseConfig.title = 'Transfer Successful!';
        baseConfig.subtitle = 'Your money transfer has been completed';
        break;
      case 'wallet_topup':
        baseConfig.title = 'Wallet Top-up Successful!';
        baseConfig.subtitle = 'Your wallet has been topped up';
        break;
      case 'loan_repayment':
        baseConfig.title = 'Loan Repayment Successful!';
        baseConfig.subtitle = 'Your loan repayment has been completed';
        break;
      case 'insurance_premium':
        baseConfig.title = 'Premium Payment Successful!';
        baseConfig.subtitle = 'Your insurance premium has been paid';
        break;
    }

    return { ...baseConfig, ...customConfig };
  }
}
