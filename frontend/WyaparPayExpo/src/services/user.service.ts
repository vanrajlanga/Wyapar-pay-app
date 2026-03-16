/**
 * User Service
 * Handles all user-related API calls (profile, preferences, documents, KYC)
 */

import { apiService } from './api.service';
import { logger } from './logger.service';
import { API_ENDPOINTS } from '../constants';

// Types
export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  isEmailVerified: boolean;
  profileImage?: string; // S3 URL for profile image
  profileImageLocal?: string; // Local cached path (temporary)
  age?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  address?: string;
  kycStatus?: string;
  kycLevel?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Nested preferences structure matching backend
export interface BackendPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    transactionAlerts: boolean;
    promotionalEmails: boolean;
  };
  privacy: {
    showBalance: boolean;
    profileVisibility: string;
    showPhoneNumber: boolean;
    allowDataSharing: boolean;
  };
  security: {
    biometricLogin: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number;
  };
  display: {
    language: string;
    currency: string;
    theme: string;
    dateFormat: string;
  };
  transactions: {
    defaultPaymentMethod: string;
    requireConfirmation: boolean;
    saveBeneficiaries: boolean;
  };
}

// Flat preferences structure for UI
export interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  showBalance: boolean;
  biometricLogin: boolean;
}

// Helper function to convert backend preferences to flat structure
function flattenPreferences(backend: BackendPreferences): UserPreferences {
  // Provide safe defaults if backend structure is missing
  return {
    pushNotifications: backend?.notifications?.push ?? true,
    emailNotifications: backend?.notifications?.email ?? true,
    smsNotifications: backend?.notifications?.sms ?? false,
    showBalance: backend?.privacy?.showBalance ?? true,
    biometricLogin: backend?.security?.biometricLogin ?? false,
  };
}

// Helper function to convert flat preferences to backend structure
function unflattenPreferences(
  flat: Partial<UserPreferences>
): Partial<BackendPreferences> {
  const result: any = {};

  if ('pushNotifications' in flat) {
    result.notifications = result.notifications || {};
    result.notifications.push = flat.pushNotifications;
  }
  if ('emailNotifications' in flat) {
    result.notifications = result.notifications || {};
    result.notifications.email = flat.emailNotifications;
  }
  if ('smsNotifications' in flat) {
    result.notifications = result.notifications || {};
    result.notifications.sms = flat.smsNotifications;
  }
  if ('showBalance' in flat) {
    result.privacy = result.privacy || {};
    result.privacy.showBalance = flat.showBalance;
  }
  if ('biometricLogin' in flat) {
    result.security = result.security || {};
    result.security.biometricLogin = flat.biometricLogin;
  }

  return result;
}

/**
 * User Service Class
 */
class UserManagementService {
  /**
   * Get user profile
   */
  async getProfile(accessToken: string): Promise<UserProfile> {
    try {
      logger.info('Fetching user profile');

      const profile = await apiService.get<UserProfile>(
        API_ENDPOINTS.USER.PROFILE,
        accessToken
      );

      logger.info('User profile fetched successfully', { userId: profile.id });
      return profile;
    } catch (error) {
      logger.error('Failed to fetch user profile', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    accessToken: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      logger.info('Updating user profile', { fields: Object.keys(data) });

      const updatedProfile = await apiService.put<UserProfile>(
        API_ENDPOINTS.USER.PROFILE,
        data,
        accessToken
      );

      logger.info('User profile updated successfully');
      return updatedProfile;
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw error;
    }
  }

  /**
   * Update user profile image
   */
  async updateProfileImage(
    accessToken: string,
    imageUrl: string
  ): Promise<UserProfile> {
    try {
      logger.info('Updating profile image', { imageUrl });

      const updatedProfile = await apiService.put<UserProfile>(
        API_ENDPOINTS.USER.PROFILE,
        { profileImage: imageUrl },
        accessToken
      );

      logger.info('Profile image updated successfully');
      return updatedProfile;
    } catch (error: any) {
      logger.error('Failed to update profile image', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(accessToken: string): Promise<UserPreferences> {
    try {
      logger.info('Fetching user preferences');

      const response = await apiService.get<{
        preferences: BackendPreferences;
      }>(API_ENDPOINTS.USER.PREFERENCES, accessToken);

      // Backend wraps preferences in { preferences: {...} }
      const backendPrefs = response.preferences || (response as any);

      // Validate that we have a valid preferences object
      if (!backendPrefs || typeof backendPrefs !== 'object') {
        logger.warn('Invalid preferences data received, using defaults');
        return {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          showBalance: true,
          biometricLogin: false,
        };
      }

      const flatPrefs = flattenPreferences(backendPrefs);

      logger.info('User preferences fetched successfully');
      return flatPrefs;
    } catch (error: any) {
      logger.error('Failed to fetch user preferences', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    accessToken: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      logger.info('Updating user preferences', {
        updates: Object.keys(preferences),
      });

      // Convert flat preferences to nested backend structure
      const backendPrefs = unflattenPreferences(preferences);

      const response = await apiService.put<{
        preferences: BackendPreferences;
      }>(API_ENDPOINTS.USER.PREFERENCES, backendPrefs, accessToken);

      // Backend wraps preferences in { preferences: {...} }
      const updatedBackendPrefs = response.preferences || (response as any);
      const flatPrefs = flattenPreferences(updatedBackendPrefs);

      logger.info('User preferences updated successfully');
      return flatPrefs;
    } catch (error: any) {
      logger.error('Failed to update user preferences', error);
      throw error;
    }
  }

  /**
   * Get user documents
   */
  async getDocuments(accessToken: string): Promise<any[]> {
    try {
      logger.info('Fetching user documents');

      const documents = await apiService.get<any[]>(
        API_ENDPOINTS.USER.DOCUMENTS,
        accessToken
      );

      logger.info('User documents fetched successfully', {
        count: documents.length,
      });
      return documents;
    } catch (error) {
      logger.error('Failed to fetch user documents', error);
      throw error;
    }
  }

  /**
   * Upload user document
   */
  async uploadDocument(
    accessToken: string,
    documentData: FormData
  ): Promise<any> {
    try {
      logger.info('Uploading user document');

      // Note: For file uploads, you might need a different implementation
      // This is a placeholder for the structure
      const result = await apiService.post<any>(
        API_ENDPOINTS.USER.DOCUMENTS,
        documentData,
        accessToken
      );

      logger.info('User document uploaded successfully');
      return result;
    } catch (error) {
      logger.error('Failed to upload user document', error);
      throw error;
    }
  }

  /**
   * Get KYC status
   */
  async getKycStatus(accessToken: string): Promise<any> {
    try {
      logger.info('Fetching KYC status');

      const kycStatus = await apiService.get<any>(
        API_ENDPOINTS.USER.KYC,
        accessToken
      );

      logger.info('KYC status fetched successfully');
      return kycStatus;
    } catch (error) {
      logger.error('Failed to fetch KYC status', error);
      throw error;
    }
  }

  /**
   * Update KYC information
   */
  async updateKyc(accessToken: string, kycData: any): Promise<any> {
    try {
      logger.info('Updating KYC information');

      const result = await apiService.put<any>(
        API_ENDPOINTS.USER.KYC,
        kycData,
        accessToken
      );

      logger.info('KYC information updated successfully');
      return result;
    } catch (error) {
      logger.error('Failed to update KYC information', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserManagementService();
