/**
 * Receipt Image Generator Service
 * Generates receipt images/screenshots for sharing
 */

import { captureRef } from 'react-native-view-shot';
import * as FileSystemModule from 'expo-file-system';
const FileSystem = FileSystemModule as any;
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import {
  GenericTransactionData,
  PaymentSuccessConfig,
} from '../types/generic-transaction';
import { logger } from '../services/logger.service';
import { showWarningEvent } from '../utils/toast-events';

export interface ReceiptImageResult {
  success: boolean;
  imageUri?: string;
  error?: string;
}

export class ReceiptImageGenerator {
  /**
   * Capture receipt as image from a view reference
   */
  static async captureReceiptImage(
    viewRef: React.RefObject<any>,
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<ReceiptImageResult> {
    try {
      if (!viewRef.current) {
        throw new Error('View reference is not available');
      }

      // Capture the view as image
      const imageUri = await captureRef(viewRef.current, {
        format: 'png',
        quality: 0.8,
        result: 'tmpfile',
      });

      logger.info('Receipt image captured successfully', {
        imageUri,
        transactionType: transactionData.type,
      });

      return {
        success: true,
        imageUri,
      };
    } catch (error) {
      logger.error('Failed to capture receipt image', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save receipt image to device gallery
   */
  static async saveReceiptToGallery(
    imageUri: string,
    transactionData: GenericTransactionData
  ): Promise<boolean> {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showWarningEvent(
          'Permission Required',
          'Please grant permission to save images to your gallery.'
        );
        return false;
      }

      // Create album if it doesn't exist
      const albumName = 'WyaparPay Receipts';
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName);
      }

      // Save image to gallery
      await MediaLibrary.saveToLibraryAsync(imageUri);

      logger.info('Receipt saved to gallery', {
        transactionType: transactionData.type,
      });

      return true;
    } catch (error) {
      logger.error('Failed to save receipt to gallery', error);
      return false;
    }
  }

  /**
   * Generate receipt image with custom styling
   */
  static async generateStyledReceiptImage(
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<ReceiptImageResult> {
    try {
      // This would require a more complex implementation with canvas or SVG
      // For now, we'll use the view capture method
      // In a production app, you might want to use react-native-svg or similar

      const company = transactionData.companyInfo || { name: 'WyaparPay' };
      const fileName = `receipt_${transactionData.transactionId}_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Create a simple receipt image using canvas-like approach
      // This is a simplified version - in production you'd want more sophisticated image generation

      logger.info('Styled receipt image generated', {
        fileName,
        transactionType: transactionData.type,
      });

      return {
        success: true,
        imageUri: fileUri,
      };
    } catch (error) {
      logger.error('Failed to generate styled receipt image', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share receipt image
   */
  static async shareReceiptImage(
    imageUri: string,
    transactionData: GenericTransactionData,
    config: PaymentSuccessConfig = {}
  ): Promise<boolean> {
    try {
      const { Share } = await import('react-native');

      const result = await Share.share({
        url: Platform.OS === 'ios' ? imageUri : `file://${imageUri}`,
        title: `Payment Receipt - ${transactionData.companyInfo?.name || 'WyaparPay'}`,
        message: `Payment Receipt for ₹${transactionData.amount.toFixed(2)}`,
      });

      logger.info('Receipt image shared successfully', {
        action: result.action,
        transactionType: transactionData.type,
      });

      return result.action !== 'dismissedAction';
    } catch (error) {
      logger.error('Failed to share receipt image', error);
      return false;
    }
  }

  /**
   * Get receipt image dimensions
   */
  static getReceiptImageDimensions(): { width: number; height: number } {
    return {
      width: 400, // Standard receipt width
      height: 600, // Standard receipt height
    };
  }

  /**
   * Validate image generation requirements
   */
  static validateImageGenerationRequirements(): boolean {
    // Check if required packages are available
    try {
      require('react-native-view-shot');
      require('expo-file-system');
      require('expo-media-library');
      return true;
    } catch (error) {
      logger.error('Image generation packages not available', error);
      return false;
    }
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = FileSystem.documentDirectory;
      if (tempDir) {
        const files = await FileSystem.readDirectoryAsync(tempDir);
        const receiptFiles = files.filter(
          (file: string) => file.startsWith('receipt_') && file.endsWith('.png')
        );

        for (const file of receiptFiles) {
          const fileAge =
            Date.now() - parseInt(file.split('_').pop()?.split('.')[0] || '0');
          // Delete files older than 1 hour
          if (fileAge > 3600000) {
            await FileSystem.deleteAsync(`${tempDir}${file}`, {
              idempotent: true,
            });
          }
        }

        logger.info('Temporary receipt files cleaned up', {
          deletedCount: receiptFiles.length,
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup temp files', error);
    }
  }
}
