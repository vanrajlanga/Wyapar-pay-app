/**
 * Toast Context
 * Global toast notification management with modern UX
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast, { ToastConfig, ToastType } from '../components/ui/Toast';
import { toastEvents } from '../utils/toast-events';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (type: ToastType, options: ToastOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// User-friendly error message mapping
const friendlyErrorMessages: Record<string, string> = {
  // S3/Storage errors
  "The specified bucket doesn't exist": "We're having trouble saving your photo. Please try again later.",
  "bucket doesn't exist": "We're having trouble saving your photo. Please try again later.",
  "NoSuchBucket": "We're having trouble with our storage. Please try again later.",
  "AccessDenied": "You don't have permission to perform this action.",
  
  // Network errors
  "Network request failed": "Please check your internet connection and try again.",
  "Network Error": "Please check your internet connection and try again.",
  "timeout": "The request took too long. Please try again.",
  "ETIMEDOUT": "Connection timed out. Please try again.",
  "ECONNREFUSED": "Unable to connect to server. Please try again later.",
  
  // Auth errors
  "Unauthorized": "Your session has expired. Please log in again.",
  "Token expired": "Your session has expired. Please log in again.",
  "Invalid credentials": "The email or password you entered is incorrect.",
  "User not found": "We couldn't find an account with those details.",
  
  // Validation errors
  "Invalid email": "Please enter a valid email address.",
  "Password too short": "Password must be at least 8 characters.",
  "File too large": "The file is too large. Please choose a smaller one.",
  "Unsupported format": "This file format is not supported.",
  
  // Generic errors
  "Internal Server Error": "Something went wrong on our end. Please try again.",
  "500": "Something went wrong on our end. Please try again.",
  "503": "Service temporarily unavailable. Please try again later.",
  "Unknown error": "Something unexpected happened. Please try again.",
};

// Get user-friendly error message
export const getFriendlyErrorMessage = (error: string): string => {
  // Check for exact match
  if (friendlyErrorMessages[error]) {
    return friendlyErrorMessages[error];
  }
  
  // Check for partial match
  const lowerError = error.toLowerCase();
  for (const [key, message] of Object.entries(friendlyErrorMessages)) {
    if (lowerError.includes(key.toLowerCase())) {
      return message;
    }
  }
  
  // Return a generic friendly message if no match found
  if (lowerError.includes('bucket') || lowerError.includes('s3') || lowerError.includes('storage')) {
    return "We're having trouble with storage. Please try again later.";
  }
  
  if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('internet')) {
    return "Please check your internet connection and try again.";
  }
  
  if (lowerError.includes('auth') || lowerError.includes('login') || lowerError.includes('token')) {
    return "There was an authentication issue. Please try logging in again.";
  }
  
  // Default friendly message
  return "Something went wrong. Please try again.";
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Internal function to add toast (used by both hook and event listener)
  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = generateId();
    
    // Convert technical error to friendly message for error toasts
    const friendlyMessage = type === 'error' && message ? getFriendlyErrorMessage(message) : message;
    
    const newToast: ToastConfig = {
      id,
      type,
      title,
      message: friendlyMessage,
      duration: type === 'error' ? 5000 : duration,
    };

    // Haptic feedback based on type
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setToasts((prev) => {
      // Limit to 3 toasts at a time
      const limited = prev.slice(-2);
      return [...limited, newToast];
    });
  }, []);

  // Subscribe to global toast events (for use from contexts/services)
  useEffect(() => {
    const unsubscribe = toastEvents.subscribe((type, title, message) => {
      addToast(type, title, message);
    });
    return unsubscribe;
  }, [addToast]);

  const showToast = useCallback((type: ToastType, options: ToastOptions) => {
    const id = generateId();
    const newToast: ToastConfig = {
      id,
      type,
      ...options,
    };

    // Haptic feedback based on type
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setToasts((prev) => {
      // Limit to 3 toasts at a time
      const limited = prev.slice(-2);
      return [...limited, newToast];
    });
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', { title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    // Convert technical error to friendly message
    const friendlyMessage = message ? getFriendlyErrorMessage(message) : undefined;
    showToast('error', { title, message: friendlyMessage, duration: 5000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast('warning', { title, message });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', { title, message });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismissToast,
        dismissAllToasts,
      }}
    >
      {children}
      {/* Toast container */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default ToastProvider;
