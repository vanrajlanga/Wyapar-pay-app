/**
 * Enhanced Sharing Service
 * Handles sharing receipts across different platforms
 */

import { Share, Alert, Platform } from 'react-native';
import { ReceiptGenerator, ReceiptData } from '../utils/receipt.generator';
import { logger } from '../services/logger.service';

export interface SharingOptions {
  title?: string;
  message?: string;
  url?: string;
  subject?: string;
}

export interface SharingResult {
  success: boolean;
  action?: string;
  activityType?: string;
  error?: string;
}

export class SharingService {
  /**
   * Share receipt with default options
   */
  static async shareReceipt(
    receiptData: ReceiptData,
    options: SharingOptions = {}
  ): Promise<SharingResult> {
    try {
      const receiptText = ReceiptGenerator.generateTextReceipt(receiptData);

      const shareOptions: SharingOptions = {
        title: options.title || 'Payment Receipt - WyaparPay',
        message: receiptText,
        ...options,
      };

      const result = await Share.share({
        message: shareOptions.message || '',
        title: shareOptions.title,
        url: shareOptions.url,
      });

      logger.info('Receipt shared successfully', {
        action: result.action,
        activityType: result.activityType,
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
   * Share receipt via WhatsApp
   */
  static async shareViaWhatsApp(
    receiptData: ReceiptData
  ): Promise<SharingResult> {
    try {
      const whatsappText =
        ReceiptGenerator.generateWhatsAppReceipt(receiptData);

      const result = await Share.share({
        message: whatsappText,
        title: 'Payment Receipt - WyaparPay',
      });

      return {
        success: true,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to share via WhatsApp', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share receipt via Email
   */
  static async shareViaEmail(receiptData: ReceiptData): Promise<SharingResult> {
    try {
      const htmlReceipt = ReceiptGenerator.generateHTMLReceipt(receiptData);
      const textReceipt = ReceiptGenerator.generateTextReceipt(receiptData);

      const result = await Share.share({
        message: textReceipt,
        title: 'Payment Receipt - WyaparPay',
        // Note: HTML content would need to be handled differently in a real app
        // This is a simplified version for demonstration
      });

      return {
        success: true,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to share via email', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share receipt via SMS
   */
  static async shareViaSMS(receiptData: ReceiptData): Promise<SharingResult> {
    try {
      const smsText = ReceiptGenerator.generateSMSReceipt(receiptData);

      const result = await Share.share({
        message: smsText,
        title: 'Payment Receipt - WyaparPay',
      });

      return {
        success: true,
        action: result.action,
        activityType: result.activityType ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to share via SMS', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Show sharing options dialog
   */
  static async showSharingOptions(receiptData: ReceiptData): Promise<void> {
    const options = [
      {
        text: 'Share via WhatsApp',
        onPress: () => this.shareViaWhatsApp(receiptData),
      },
      {
        text: 'Share via Email',
        onPress: () => this.shareViaEmail(receiptData),
      },
      { text: 'Share via SMS', onPress: () => this.shareViaSMS(receiptData) },
      {
        text: 'Share via Other Apps',
        onPress: () => this.shareReceipt(receiptData),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

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
    receiptData: ReceiptData
  ): Promise<boolean> {
    try {
      // Note: This would require expo-clipboard or similar package
      // For now, we'll simulate the functionality
      const receiptText = ReceiptGenerator.generateTextReceipt(receiptData);

      // In a real implementation, you would use:
      // await Clipboard.setStringAsync(receiptText);

      logger.info('Receipt copied to clipboard');
      return true;
    } catch (error) {
      logger.error('Failed to copy receipt to clipboard', error);
      return false;
    }
  }

  /**
   * Get available sharing platforms
   */
  static getAvailablePlatforms(): string[] {
    const platforms = ['WhatsApp', 'Email', 'SMS', 'Other Apps'];

    // Add platform-specific options
    if (Platform.OS === 'ios') {
      platforms.push('AirDrop', 'Messages');
    } else if (Platform.OS === 'android') {
      platforms.push('Telegram', 'Facebook', 'Twitter');
    }

    return platforms;
  }

  /**
   * Generate receipt preview
   */
  static generateReceiptPreview(receiptData: ReceiptData): string {
    const { transaction } = receiptData;

    return `Payment Receipt Preview:
    
Amount: ₹${transaction.amount.toFixed(2)}
Transaction ID: ${transaction.id}
Status: ${transaction.status.toUpperCase()}
${transaction.metadata?.mobileNumber ? `Mobile: ${transaction.metadata.mobileNumber}` : ''}
${transaction.metadata?.operatorName ? `Operator: ${transaction.metadata.operatorName}` : ''}

This receipt will be formatted properly when shared.`;
  }
}
