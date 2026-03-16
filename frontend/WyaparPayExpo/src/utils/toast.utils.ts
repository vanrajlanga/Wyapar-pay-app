/**
 * Toast Utility Functions
 * Centralized toast/alert management for consistent UX
 * 
 * NOTE: Prefer using useToast hook from ToastContext for component-based code.
 * These utility functions are provided for backward compatibility and for use in
 * non-component code (services, utilities, etc.)
 */

import * as Haptics from 'expo-haptics';
import {
  showSuccessEvent,
  showErrorEvent,
  showWarningEvent,
  showInfoEvent,
} from './toast-events';

// User-friendly error message mapping
const friendlyErrorMessages: Record<string, string> = {
  // S3/Storage errors
  "The specified bucket doesn't exist": "We're having trouble saving your data. Please try again later.",
  "bucket doesn't exist": "We're having trouble saving your data. Please try again later.",
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

/**
 * Convert technical error message to user-friendly message
 */
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

/**
 * Show a "Coming Soon" toast message
 * @param message - Optional custom message (defaults to "Coming Soon")
 * @param hapticFeedback - Whether to trigger haptic feedback (default: true)
 */
export const showComingSoonToast = (
  message: string = 'This feature is coming soon!',
  hapticFeedback: boolean = true
) => {
  if (hapticFeedback) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  showInfoEvent('Coming Soon', message);
};

/**
 * Show a success toast message
 * @param title - Toast title
 * @param message - Toast message
 * @param hapticFeedback - Whether to trigger haptic feedback (default: true)
 */
export const showSuccessToast = (
  title: string,
  message: string,
  hapticFeedback: boolean = true
) => {
  if (hapticFeedback) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  showSuccessEvent(title, message);
};

/**
 * Show an error toast message
 * Automatically converts technical errors to user-friendly messages
 * @param title - Toast title
 * @param message - Toast message (will be converted to friendly message)
 * @param hapticFeedback - Whether to trigger haptic feedback (default: true)
 */
export const showErrorToast = (
  title: string,
  message: string,
  hapticFeedback: boolean = true
) => {
  if (hapticFeedback) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Convert to user-friendly message
  const friendlyMessage = getFriendlyErrorMessage(message);

  showErrorEvent(title, friendlyMessage);
};

/**
 * Show a warning toast message
 * @param title - Toast title
 * @param message - Toast message
 * @param hapticFeedback - Whether to trigger haptic feedback (default: true)
 */
export const showWarningToast = (
  title: string,
  message: string,
  hapticFeedback: boolean = true
) => {
  if (hapticFeedback) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  showWarningEvent(title, message);
};

/**
 * Show an info toast message
 * @param title - Toast title  
 * @param message - Toast message
 * @param hapticFeedback - Whether to trigger haptic feedback (default: true)
 */
export const showInfoToast = (
  title: string,
  message: string,
  hapticFeedback: boolean = true
) => {
  if (hapticFeedback) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  showInfoEvent(title, message);
};
