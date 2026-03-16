/**
 * Profile Image Manager Service
 * Handles complete profile image lifecycle: upload, download, cache, and sync
 */

import {
  S3ImageService,
  ImageUploadResult,
  ImageDownloadResult,
} from './s3-image.service';
import { userService, UserProfile } from './user.service';
import { logger } from './logger.service';
import { API_CONFIG } from '../constants';
import * as FileSystem from 'expo-file-system/legacy';

export interface ProfileImageResult {
  success: boolean;
  imageUrl?: string;
  localPath?: string;
  error?: string;
}

export class ProfileImageManager {
  /**
   * Upload new profile image via backend API
   * 1. Upload to backend (which handles S3 upload)
   * 2. Cache locally
   */
  static async uploadProfileImage(
    userId: string,
    imageUri: string,
    accessToken: string,
    imageType: string = 'image/jpeg'
  ): Promise<ProfileImageResult> {
    try {
      logger.info('Starting profile image upload process', { userId, imageUri });

      // Create FormData for multipart upload
      const formData = new FormData();
      const fileName = `profile_${userId}_${Date.now()}.jpg`;

      logger.info('Creating FormData with file', { fileName, imageType });

      // In React Native, FormData.append accepts URI directly
      try {
        // @ts-ignore - React Native FormData type definition
        formData.append('file', {
          uri: imageUri,
          type: imageType,
          name: fileName,
        });
        logger.info('FormData created successfully');
      } catch (formError: any) {
        logger.error('FormData creation failed', formError);
        throw new Error(`FormData error: ${formError.message}`);
      }

      const uploadUrl = `${API_CONFIG.BASE_URL}/api/v1/files/profile-image`;
      logger.info('Uploading to:', {
        url: uploadUrl,
        baseUrl: API_CONFIG.BASE_URL,
        fileName,
        hasToken: !!accessToken,
      });

      // Upload via backend API
      // NOTE: Don't set Content-Type header - let FormData set it with boundary
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      logger.info('Upload response received', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const result = await response.json();
      const imageUrl = result.fileInfo?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }

      // Cache the image locally
      const downloadResult: ImageDownloadResult =
        await S3ImageService.downloadProfileImage(userId, imageUrl);

      logger.info('Profile image upload completed successfully', {
        userId,
        imageUrl,
        localPath: downloadResult.localPath,
      });

      return {
        success: true,
        imageUrl,
        localPath: downloadResult.localPath,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      logger.error('Profile image upload failed', error, {
        userId,
        errorType: error?.constructor?.name,
        errorStack: error?.stack,
        errorDetails: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get profile image (with caching and fallback)
   * 1. Check local cache first
   * 2. If not cached, download from S3
   * 3. Return local path for display
   */
  static async getProfileImage(
    userId: string,
    imageUrl?: string
  ): Promise<ProfileImageResult> {
    try {
      logger.info('Getting profile image', { userId, imageUrl });

      if (!imageUrl) {
        return {
          success: false,
          error: 'No profile image URL provided',
        };
      }

      // Try to download/cache the image
      const downloadResult: ImageDownloadResult =
        await S3ImageService.downloadProfileImage(userId, imageUrl);

      if (!downloadResult.success) {
        return {
          success: false,
          error: downloadResult.error || 'Failed to download image',
        };
      }

      return {
        success: true,
        imageUrl: imageUrl,
        localPath: downloadResult.localPath,
      };
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      logger.error('Failed to get profile image', error, { userId });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete profile image
   * 1. Delete from S3
   * 2. Update user profile (remove image URL)
   * 3. Clear local cache
   */
  static async deleteProfileImage(
    userId: string,
    imageUrl: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      logger.info('Starting profile image deletion', { userId });

      // Step 1: Delete from S3
      const deleted = await S3ImageService.deleteProfileImage(userId, imageUrl);
      if (!deleted) {
        logger.warn(
          'Failed to delete image from S3, continuing with profile update'
        );
      }

      // Step 2: Update user profile (remove image URL)
      await userService.updateProfileImage(accessToken, '');

      // Step 3: Clear local cache
      await S3ImageService.clearImageCache();

      logger.info('Profile image deleted successfully', { userId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete profile image', error, { userId });
      return false;
    }
  }

  /**
   * Sync profile image on app startup/login
   * Downloads and caches the user's profile image if available
   */
  static async syncProfileImage(
    userId: string,
    userProfile: UserProfile
  ): Promise<ProfileImageResult> {
    try {
      logger.info('Syncing profile image', {
        userId,
        hasImage: !!userProfile.profileImage,
      });

      if (!userProfile.profileImage) {
        return {
          success: true,
          error: 'No profile image to sync',
        };
      }

      // Download and cache the image
      const result = await this.getProfileImage(
        userId,
        userProfile.profileImage
      );

      if (result.success) {
        logger.info('Profile image synced successfully', { userId });
      } else {
        logger.warn('Failed to sync profile image', {
          userId,
          error: result.error,
        });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      logger.error('Profile image sync failed', error, { userId });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if image exists locally
   */
  static async isImageCached(userId: string): Promise<boolean> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}profile_images/`;
      const imagePath = `${cacheDir}${userId}.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      return fileInfo.exists;
    } catch (error: any) {
      logger.error('Failed to check image cache', error, { userId });
      return false;
    }
  }

  /**
   * Get cached image path
   */
  static async getCachedImagePath(userId: string): Promise<string | null> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}profile_images/`;
      const imagePath = `${cacheDir}${userId}.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(imagePath);

      if (fileInfo.exists) {
        return imagePath;
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get cached image path', error, { userId });
      return null;
    }
  }

  /**
   * Clear all cached images (for logout)
   */
  static async clearAllCachedImages(): Promise<void> {
    try {
      await S3ImageService.clearImageCache();
      logger.info('All cached images cleared');
    } catch (error: any) {
      logger.error('Failed to clear cached images', error);
    }
  }

  /**
   * Get image file size
   */
  static async getImageFileSize(imagePath: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      return fileInfo.exists ? fileInfo.size || 0 : 0;
    } catch (error: any) {
      logger.error('Failed to get image file size', error, { imagePath });
      return 0;
    }
  }

  /**
   * Validate image before upload
   */
  static async validateImage(
    imageUri: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return { valid: false, error: 'Image file does not exist' };
      }

      // Check file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        return {
          valid: false,
          error: `Image size exceeds limit: ${fileInfo.size} bytes`,
        };
      }

      // Check file extension
      const extension = imageUri.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `Unsupported image format: ${extension}`,
        };
      }

      return { valid: true };
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      return { valid: false, error: errorMessage };
    }
  }
}
