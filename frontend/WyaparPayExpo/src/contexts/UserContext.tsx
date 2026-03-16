/**
 * User Context
 * Manages user profile and data across the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  userService,
  UserProfile,
  UserPreferences,
} from '../services/user.service';
import { logger } from '../services/logger.service';
import { useAuth } from './AuthContext';
import { ProfileImageManager } from '../services/profile-image-manager.service';

// Types
interface UserContextType {
  // State
  profile: UserProfile | null;
  user: UserProfile | null; // Alias for profile for backward compatibility
  preferences: UserPreferences;
  isLoading: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  togglePreference: (key: keyof UserPreferences) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  showBalance: true,
  biometricLogin: false,
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider props
interface UserProviderProps {
  children: ReactNode;
}

/**
 * User Provider Component
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Get auth context to access tokens and user state
  const { user, tokens, isAuthenticated, logout } = useAuth();

  /**
   * Load user profile from backend
   */
  const loadProfile = async () => {
    if (!tokens?.accessToken) {
      logger.warn('Cannot load profile: No access token', {
        hasTokens: !!tokens,
        hasAccessToken: !!tokens?.accessToken,
      });
      return;
    }

    logger.debug('Loading user profile', {
      tokenPrefix: tokens.accessToken.substring(0, 10) + '...',
    });

    try {
      setIsLoading(true);
      const profileData = await userService.getProfile(tokens.accessToken);
      setProfile(profileData);
      logger.info('User profile loaded', { userId: profileData.id });
    } catch (error: any) {
      // If it's a 401 error, the token is invalid - trigger logout
      if (error?.statusCode === 401) {
        logger.warn('Token is invalid, triggering logout');
        await logout();
      } else {
        // Only log as error if it's not an auth issue
        logger.error('Failed to load user profile', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!tokens?.accessToken) {
      logger.warn('Cannot update profile: No access token');
      return;
    }

    try {
      setIsLoading(true);
      const updatedProfile = await userService.updateProfile(
        tokens.accessToken,
        data
      );
      setProfile(updatedProfile);
      logger.info('User profile updated successfully');
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load user preferences from backend
   */
  const loadPreferences = async () => {
    if (!tokens?.accessToken) {
      logger.warn('Cannot load preferences: No access token');
      return;
    }

    logger.debug('Loading user preferences', {
      tokenPrefix: tokens.accessToken.substring(0, 10) + '...',
    });

    try {
      const preferencesData = await userService.getPreferences(
        tokens.accessToken
      );
      setPreferences(preferencesData);
      logger.info('User preferences loaded');
    } catch (error: any) {
      // If it's a 401 error, the token is invalid - trigger logout
      if (error?.statusCode === 401) {
        logger.warn('Token is invalid, triggering logout');
        await logout();
      } else {
        // Only log as error if it's not an auth issue
        logger.error('Failed to load user preferences', error);
      }

      // Keep default preferences on error
    }
  };

  /**
   * Update user preferences
   */
  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    if (!tokens?.accessToken) {
      logger.warn('Cannot update preferences: No access token');
      // Still update local state for offline support
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
      return;
    }

    // Optimistic update
    const previousPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, ...newPreferences }));

    try {
      const updatedPreferences = await userService.updatePreferences(
        tokens.accessToken,
        newPreferences
      );
      setPreferences(updatedPreferences);
      logger.info('User preferences updated successfully');
    } catch (error) {
      logger.error('Failed to update user preferences', error);
      // Revert on error
      setPreferences(previousPreferences);
      throw error;
    }
  };

  /**
   * Toggle a single preference
   */
  const togglePreference = async (key: keyof UserPreferences) => {
    const newValue = !preferences[key];
    await updatePreferences({ [key]: newValue } as Partial<UserPreferences>);
  };

  /**
   * Refresh all user data (profile + preferences)
   */
  const refreshUserData = async () => {
    await Promise.all([loadProfile(), loadPreferences()]);

    // Sync profile image if available
    if (profile?.profileImage && profile?.id) {
      try {
        await ProfileImageManager.syncProfileImage(profile.id, profile);
        logger.info('Profile image synced successfully');
      } catch (error: any) {
        logger.error('Failed to sync profile image', error);
      }
    }
  };

  /**
   * Auto-load user data when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      // Add a small delay to ensure auth context is fully initialized
      const timer = setTimeout(() => {
        refreshUserData();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Clear data when user logs out
      setProfile(null);
      setPreferences(defaultPreferences);
      // Clear cached profile images
      ProfileImageManager.clearAllCachedImages();
    }
  }, [isAuthenticated, tokens?.accessToken]);

  /**
   * Sync profile with auth user data
   */
  useEffect(() => {
    if (user && !profile) {
      // Set initial profile from auth user data
      setProfile({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      });
    }
  }, [user, profile]);

  // Context value
  const value: UserContextType = {
    profile,
    user: profile, // Alias for backward compatibility
    preferences,
    isLoading,
    loadProfile,
    updateProfile,
    loadPreferences,
    updatePreferences,
    togglePreference,
    refreshUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Custom hook to use user context
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};
