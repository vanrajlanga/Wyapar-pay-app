/**
 * AWS S3 Service
 * Handles profile image upload, download, and management with caching
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { logger } from './logger.service';

// Get AWS config from app.json extra
const awsConfig = Constants.expoConfig?.extra?.aws || {};

// AWS Configuration
const AWS_CONFIG = {
  region: awsConfig.region || 'us-east-1',
  accessKeyId: awsConfig.accessKeyId || '',
  secretAccessKey: awsConfig.secretAccessKey || '',
};

// S3 Configuration
const S3_CONFIG = {
  bucketName: awsConfig.s3BucketName || 'wyaparpay-assets',
  folderPrefix: awsConfig.s3ProfileFolder || 'profile-images/',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
};

// Initialize AWS S3 Client
const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  },
});

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageDownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

export class S3ImageService {
  /**
   * Upload profile image to S3
   */
  static async uploadProfileImage(
    userId: string,
    imageUri: string,
    imageType: string = 'image/jpeg'
  ): Promise<ImageUploadResult> {
    try {
      logger.info('Starting profile image upload', { userId, imageType });

      // Validate file type
      if (!S3_CONFIG.allowedTypes.includes(imageType)) {
        throw new Error(`Unsupported image type: ${imageType}`);
      }

      // Read file data
      const fileData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for React Native compatibility
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Validate file size
      if (bytes.length > S3_CONFIG.maxFileSize) {
        throw new Error(`File size exceeds limit: ${bytes.length} bytes`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = imageType.split('/')[1];
      const fileName = `${userId}_${timestamp}.${fileExtension}`;
      const key = `${S3_CONFIG.folderPrefix}${fileName}`;

      // Upload parameters
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: key,
        Body: bytes,
        ContentType: imageType,
        ACL: 'public-read', // Make image publicly accessible
        Metadata: {
          userId: userId,
          uploadedAt: timestamp.toString(),
        },
      });

      // Upload to S3
      await s3Client.send(uploadCommand);

      // Construct the public URL
      const imageUrl = `https://${S3_CONFIG.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;

      logger.info('Profile image uploaded successfully', {
        userId,
        imageUrl: imageUrl,
        key: key,
      });

      return {
        success: true,
        imageUrl: imageUrl,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      logger.error('Failed to upload profile image', error, { userId });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Download profile image from S3 to local cache
   */
  static async downloadProfileImage(
    userId: string,
    imageUrl: string
  ): Promise<ImageDownloadResult> {
    try {
      logger.info('Starting profile image download', { userId, imageUrl });

      // Check if image is already cached
      const cachedPath = await this.getCachedImagePath(userId);
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists) {
        logger.info('Using cached profile image', { userId, cachedPath });
        return {
          success: true,
          localPath: cachedPath,
        };
      }

      // Extract S3 key from URL
      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      if (!s3Key) {
        throw new Error('Invalid S3 URL format');
      }

      // Download parameters
      const downloadCommand = new GetObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: s3Key,
      });

      // Download from S3
      const result = await s3Client.send(downloadCommand);

      if (!result.Body) {
        throw new Error('No image data received from S3');
      }

      // Convert stream to buffer
      const chunks = [];
      const stream = result.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Convert chunks to Uint8Array for React Native compatibility
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const bytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }

      // Save to local cache
      const localPath = await this.saveImageToCache(userId, bytes);

      logger.info('Profile image downloaded successfully', {
        userId,
        localPath,
        size: bytes.length,
      });

      return {
        success: true,
        localPath: localPath,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      logger.error('Failed to download profile image', error, { userId });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete profile image from S3
   */
  static async deleteProfileImage(
    userId: string,
    imageUrl: string
  ): Promise<boolean> {
    try {
      logger.info('Starting profile image deletion', { userId, imageUrl });

      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      if (!s3Key) {
        throw new Error('Invalid S3 URL format');
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);

      // Also delete from local cache
      await this.deleteCachedImage(userId);

      logger.info('Profile image deleted successfully', { userId, s3Key });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete profile image', error, { userId });
      return false;
    }
  }

  /**
   * Get cached image path for user
   */
  private static async getCachedImagePath(userId: string): Promise<string> {
    const cacheDir = `${FileSystem.cacheDirectory}profile_images/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
    return `${cacheDir}${userId}.jpg`;
  }

  /**
   * Save image to local cache
   */
  private static async saveImageToCache(
    userId: string,
    imageBytes: Uint8Array
  ): Promise<string> {
    const cachePath = await this.getCachedImagePath(userId);

    // Convert Uint8Array to base64 for storage
    const binaryString = Array.from(imageBytes, (byte) =>
      String.fromCharCode(byte)
    ).join('');
    const base64String = btoa(binaryString);

    await FileSystem.writeAsStringAsync(cachePath, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return cachePath;
  }

  /**
   * Delete cached image
   */
  private static async deleteCachedImage(userId: string): Promise<void> {
    try {
      const cachePath = await this.getCachedImagePath(userId);
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachePath);
        logger.info('Cached image deleted', { userId, cachePath });
      }
    } catch (error: any) {
      logger.error('Failed to delete cached image', error, { userId });
    }
  }

  /**
   * Extract S3 key from URL
   */
  private static extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(
        (part) => part === S3_CONFIG.bucketName
      );

      if (bucketIndex === -1) return null;

      return pathParts.slice(bucketIndex + 1).join('/');
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all cached images (for logout)
   */
  static async clearImageCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}profile_images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir);
        logger.info('Image cache cleared');
      }
    } catch (error: any) {
      logger.error('Failed to clear image cache', error);
    }
  }

  /**
   * Get image info (size, last modified)
   */
  static async getImageInfo(imageUrl: string): Promise<any> {
    try {
      const s3Key = this.extractS3KeyFromUrl(imageUrl);
      if (!s3Key) return null;

      const headCommand = new HeadObjectCommand({
        Bucket: S3_CONFIG.bucketName,
        Key: s3Key,
      });

      const result = await s3Client.send(headCommand);
      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
      };
    } catch (error: any) {
      logger.error('Failed to get image info', error, { imageUrl });
      return null;
    }
  }
}
