import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SECURE_STORAGE_KEYS, BIOMETRIC_TYPE_NAMES } from '../constants';
import { logger } from '../services/logger.service';
import { showErrorEvent } from '../utils/toast-events';

// Conditionally import expo-local-authentication (may not work in Expo Go)
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {
  console.log('expo-local-authentication not available');
}

// Define AuthenticationType enum fallback
const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
};

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: number[];
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'fingerprint' | 'faceId' | 'iris' | 'none';
}

export const useBiometric = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    supportedTypes: [],
    hasHardware: false,
    isEnrolled: false,
    biometricType: 'none',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  /**
   * Check device biometric capabilities
   */
  const checkBiometricCapabilities = async () => {
    try {
      // Check if LocalAuthentication is available (not available in Expo Go)
      if (!LocalAuthentication) {
        logger.warn('LocalAuthentication not available (likely Expo Go)');
        setCapabilities({
          isAvailable: false,
          supportedTypes: [],
          hasHardware: false,
          isEnrolled: false,
          biometricType: 'none',
        });
        setIsLoading(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: 'fingerprint' | 'faceId' | 'iris' | 'none' = 'none';

      if (
        supportedTypes.includes(AuthenticationType.FACIAL_RECOGNITION)
      ) {
        biometricType = Platform.OS === 'ios' ? 'faceId' : 'fingerprint';
      } else if (
        supportedTypes.includes(AuthenticationType.FINGERPRINT)
      ) {
        biometricType = 'fingerprint';
      } else if (
        supportedTypes.includes(AuthenticationType.IRIS)
      ) {
        biometricType = 'iris';
      }

      setCapabilities({
        isAvailable: hasHardware && isEnrolled,
        supportedTypes,
        hasHardware,
        isEnrolled,
        biometricType,
      });
      logger.info('Biometric capabilities checked', {
        hasHardware,
        isEnrolled,
        biometricType,
      });
    } catch (error) {
      logger.error('Error checking biometric capabilities', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get human-readable biometric type name
   */
  const getBiometricTypeName = (): string => {
    if (capabilities.biometricType === 'faceId' && Platform.OS !== 'ios') {
      return 'Face Recognition';
    }
    return BIOMETRIC_TYPE_NAMES[capabilities.biometricType];
  };

  /**
   * Authenticate user with biometrics
   */
  const authenticate = async (options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if LocalAuthentication is available
      if (!LocalAuthentication) {
        return {
          success: false,
          error: 'Biometric authentication is not available in Expo Go. Please use a development build.',
        };
      }

      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const promptMessage =
        options?.promptMessage || `Authenticate with ${getBiometricTypeName()}`;
      const cancelLabel = options?.cancelLabel || 'Cancel';

      logger.debug('Biometric capabilities', {
        isAvailable: capabilities.isAvailable,
        hasHardware: capabilities.hasHardware,
        isEnrolled: capabilities.isEnrolled,
        biometricType: capabilities.biometricType,
      });

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        disableDeviceFallback: options?.disableDeviceFallback ?? true, // Require biometrics (Face ID/Touch ID)
        fallbackLabel: 'Use Passcode',
        requireConfirmation: false, // Don't require manual confirmation after successful auth
      });

      if (result.success) {
        return { success: true };
      } else {
        let error = 'Authentication failed';
        if (result.error === 'user_cancel') {
          error = 'Authentication cancelled by user';
        } else if (result.error === 'lockout') {
          error = 'Too many failed attempts. Please try again later';
        } else if (result.error === 'system_cancel') {
          error = 'Authentication cancelled by system';
        } else if (result.error === 'not_enrolled') {
          error = 'No biometrics enrolled on this device';
        }
        return { success: false, error };
      }
    } catch (error) {
      logger.error('Biometric authentication error', error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  };

  /**
   * Enable biometric login for user
   */
  const enableBiometricLogin = async (
    userId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> => {
    try {
      logger.debug('Enabling biometric login', {
        userId: userId.substring(0, 8) + '...',
      });

      // First, authenticate to ensure user intent
      logger.debug('Requesting biometric authentication');
      const authResult = await authenticate({
        promptMessage: `Enable ${getBiometricTypeName()} for quick login`,
      });

      if (!authResult.success) {
        logger.warn('Biometric authentication failed', {
          error: authResult.error,
        });
        showErrorEvent(
          'Authentication Failed',
          authResult.error || 'Could not enable biometric login'
        );
        return false;
      }

      logger.debug('Biometric authentication successful, storing credentials');

      // Store credentials securely (including refresh token for proper session restoration)
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_USER_ID,
        userId
      );
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_TOKEN,
        accessToken
      );
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN,
        refreshToken
      );
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED,
        'true'
      );

      logger.info('Biometric login enabled', { userId });
      return true;
    } catch (error) {
      logger.error('Error enabling biometric login', error);
      showErrorEvent(
        'Error',
        'Could not enable biometric login. Please try again.'
      );
      return false;
    }
  };

  /**
   * Disable biometric login
   */
  const disableBiometricLogin = async (): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.BIOMETRIC_USER_ID);
      await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.BIOMETRIC_TOKEN);
      await SecureStore.deleteItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN
      );
      await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED);
      logger.info('Biometric login disabled');
      return true;
    } catch (error) {
      logger.error('Error disabling biometric login', error);
      return false;
    }
  };

  /**
   * Check if biometric login is enabled
   */
  const isBiometricLoginEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return enabled === 'true';
    } catch (error) {
      logger.error('Error checking biometric login status', error);
      return false;
    }
  };

  /**
   * Get stored biometric credentials
   */
  const getBiometricCredentials = async (): Promise<{
    userId: string | null;
    token: string | null;
    refreshToken: string | null;
  }> => {
    try {
      const userId = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_USER_ID
      );
      const token = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_TOKEN
      );
      const refreshToken = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.BIOMETRIC_REFRESH_TOKEN
      );
      return { userId, token, refreshToken };
    } catch (error) {
      logger.error('Error retrieving biometric credentials', error);
      return { userId: null, token: null, refreshToken: null };
    }
  };

  /**
   * Perform biometric login
   */
  const biometricLogin = async (): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    refreshToken?: string;
    error?: string;
  }> => {
    try {
      // Check if biometric login is enabled
      const isEnabled = await isBiometricLoginEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric login is not enabled',
        };
      }

      // Authenticate with biometrics
      const authResult = await authenticate({
        promptMessage: `Login with ${getBiometricTypeName()}`,
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      // Retrieve stored credentials
      const credentials = await getBiometricCredentials();

      if (
        !credentials.userId ||
        !credentials.token ||
        !credentials.refreshToken
      ) {
        return {
          success: false,
          error: 'No biometric credentials found. Please login with password.',
        };
      }

      return {
        success: true,
        userId: credentials.userId,
        token: credentials.token,
        refreshToken: credentials.refreshToken,
      };
    } catch (error) {
      logger.error('Biometric login error', error);
      return {
        success: false,
        error: 'An error occurred during biometric login',
      };
    }
  };

  return {
    capabilities,
    isLoading,
    getBiometricTypeName,
    authenticate,
    enableBiometricLogin,
    disableBiometricLogin,
    isBiometricLoginEnabled,
    biometricLogin,
  };
};
