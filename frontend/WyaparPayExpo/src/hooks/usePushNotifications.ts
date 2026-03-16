import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

// Conditionally import expo-notifications (limited support in Expo Go)
let Notifications: any = null;
let isNotificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  isNotificationsAvailable = true;
  
  // Configure how notifications are handled when app is in foreground
  // Only set handler if notifications are available
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.log('expo-notifications not available or limited in Expo Go');
}

export interface PushNotificationState {
  expoPushToken: string | null;
  isLoading: boolean;
  error: string | null;
  isPermissionGranted: boolean;
  lastNotification: any | null;
}

/**
 * Custom hook for managing push notifications with proper cleanup and memory management
 *
 * Features:
 * - Automatic permission handling
 * - Token registration with backend
 * - Notification listeners with cleanup
 * - Error handling and retry logic
 * - Memory leak prevention
 */
export const usePushNotifications = () => {
  const { tokens, isAuthenticated } = useAuth();

  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    isLoading: true,
    error: null,
    isPermissionGranted: false,
    lastNotification: null,
  });

  // Refs to store subscription references for cleanup
  const notificationReceivedListener = useRef<any>(null);
  const notificationResponseListener = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Register device for push notifications
   */
  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | null> => {
    try {
      // Check if notifications module is available
      if (!Notifications || !isNotificationsAvailable) {
        const error = 'Push notifications not available in Expo Go. Use a development build for full support.';
        console.warn(error);
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error, isLoading: false }));
        }
        return null;
      }

      // Check if running on physical device
      if (!Device.isDevice) {
        const error = 'Push notifications only work on physical devices';
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, error, isLoading: false }));
        }
        return null;
      }

      // Check and request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        const error = 'Failed to get push notification permissions';
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            error,
            isPermissionGranted: false,
            isLoading: false
          }));
        }
        return null;
      }

      // Get the token (with projectId for Expo Go compatibility)
      // Retry logic for transient Expo API errors (503, 500, etc.)
      let tokenData;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Try to get projectId from Expo Constants
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                            Constants?.expoConfig?.extra?.projectId;
          
          if (projectId && projectId !== 'your-project-id-here') {
            tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
          } else {
            // Try without projectId (works in development builds)
            tokenData = await Notifications.getExpoPushTokenAsync();
          }
          
          // Success - break out of retry loop
          break;
        } catch (tokenError: any) {
          const errorMessage = tokenError?.message || '';
          const isTransientError = 
            errorMessage.includes('503') ||
            errorMessage.includes('SERVICE_UNAVAILABLE') ||
            errorMessage.includes('temporarily unavailable') ||
            errorMessage.includes('high load') ||
            errorMessage.includes('500');
          
          // If projectId is missing, handle gracefully
          if (tokenError?.message?.includes('projectId')) {
            const errorMsg = 
              'Push notifications require a projectId. ' +
              'Note: Push notifications are not fully supported in Expo Go (SDK 53+). ' +
              'Please use a development build (EAS Build) for full push notification support. ' +
              'For development builds, configure projectId in app.json extra.eas.projectId';
            
            console.warn(errorMsg);
            
            if (isMountedRef.current) {
              setState(prev => ({
                ...prev,
                error: 'Push notifications require a development build. Using Expo Go has limitations.',
                isLoading: false,
              }));
            }
            return null;
          }
          
          // If transient error and we have retries left, retry
          if (isTransientError && attempt < maxRetries) {
            console.warn(
              `Expo API temporarily unavailable (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay}ms...`
            );
            
            if (isMountedRef.current) {
              setState(prev => ({
                ...prev,
                error: `Connecting to Expo services... (attempt ${attempt}/${maxRetries})`,
                isLoading: true,
              }));
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          // If it's the last attempt or not a transient error, throw
          if (attempt === maxRetries) {
            console.error(
              `Failed to get Expo push token after ${maxRetries} attempts:`,
              tokenError
            );
            
            if (isMountedRef.current) {
              setState(prev => ({
                ...prev,
                error: 'Push notification service temporarily unavailable. Will retry automatically.',
                isLoading: false,
              }));
            }
            
            // Don't throw - let app continue, will retry on next app open
            return null;
          }
          
          // For non-transient errors, throw immediately
          throw tokenError;
        }
      }
      
      if (!tokenData) {
        return null;
      }
      
      const token = tokenData.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          expoPushToken: token,
          isPermissionGranted: true,
          error: null,
          isLoading: false,
        }));
      }

      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register for push notifications';
      console.error('Push notification registration error:', error);

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }

      return null;
    }
  }, []);

  /**
   * Register push token with backend
   */
  const registerTokenWithBackend = useCallback(async (token: string, accessToken: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/notifications/register-device', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pushToken: token }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (isMountedRef.current) {
        console.log('Push token registered with backend successfully');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register token with backend';
      console.error('Backend registration error:', error);

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: `Backend registration failed: ${errorMessage}`,
        }));
      }

      // Retry registration after delay
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && tokens?.accessToken) {
          registerTokenWithBackend(token, tokens.accessToken);
        }
      }, 5000); // Retry after 5 seconds

      return false;
    }
  }, [tokens]);

  /**
   * Handle notification response (tap)
   */
  const handleNotificationResponse = useCallback((response: any) => {
    const notification = response.notification;
    const data = notification.request.content.data;

    console.log('Notification tapped:', {
      notificationId: notification.request.identifier,
      data,
      actionIdentifier: response.actionIdentifier,
    });

    // Handle different notification types and navigation
    if (data?.screen) {
      // Navigate to specific screen
      console.log('Navigate to screen:', data.screen);

      // You can emit events or use navigation here
      // For example: navigation.navigate(data.screen, data.params);
    }

    if (data?.transactionId) {
      // Open transaction details
      console.log('Open transaction:', data.transactionId);
    }

    if (data?.deepLink) {
      // Handle deep linking
      console.log('Handle deep link:', data.deepLink);
    }
  }, []);

  /**
   * Setup notification listeners
   */
  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token && isAuthenticated && tokens?.accessToken) {
        registerTokenWithBackend(token, tokens.accessToken);
      }
    });

    // Only set up listeners if Notifications is available
    if (Notifications && isNotificationsAvailable) {
      // Listener for notifications received while app is in foreground
      notificationReceivedListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            lastNotification: notification,
          }));

          console.log('Notification received in foreground:', notification.request.content);
        }
      });

      // Listener for notification taps
      notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    }

    // Cleanup function
    return () => {
      // Remove listeners (subscription object has remove method)
      if (notificationReceivedListener.current) {
        try {
          if (typeof notificationReceivedListener.current.remove === 'function') {
            notificationReceivedListener.current.remove();
          } else if (Notifications.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(notificationReceivedListener.current);
          }
        } catch (error) {
          console.warn('Error removing notification received listener:', error);
        }
      }
      if (notificationResponseListener.current) {
        try {
          if (typeof notificationResponseListener.current.remove === 'function') {
            notificationResponseListener.current.remove();
          } else if (Notifications.removeNotificationSubscription) {
            Notifications.removeNotificationSubscription(notificationResponseListener.current);
          }
        } catch (error) {
          console.warn('Error removing notification response listener:', error);
        }
      }

      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Mark as unmounted
      isMountedRef.current = false;
    };
  }, [isAuthenticated, tokens, registerForPushNotificationsAsync, registerTokenWithBackend, handleNotificationResponse]);

  /**
   * Retry registration when authentication state changes
   */
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken && state.expoPushToken && !state.error) {
      registerTokenWithBackend(state.expoPushToken, tokens.accessToken);
    }
  }, [isAuthenticated, tokens, state.expoPushToken, state.error, registerTokenWithBackend]);

  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async (title: string, body: string) => {
    if (!tokens?.accessToken) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          type: 'system',
          data: {
            screen: 'dashboard',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Test notification error:', error);
      throw error;
    }
  }, [tokens]);

  /**
   * Get notification statistics
   */
  const getNotificationStats = useCallback(async () => {
    if (!tokens?.accessToken) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('http://localhost:3000/api/v1/notifications/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Stats fetch error:', error);
      throw error;
    }
  }, [tokens]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendTestNotification,
    getNotificationStats,
    clearError,
    // Re-export for convenience
    expoPushToken: state.expoPushToken,
    isPermissionGranted: state.isPermissionGranted,
  };
};
