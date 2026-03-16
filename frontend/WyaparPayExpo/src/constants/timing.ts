/**
 * Timing Constants
 * Centralized timing values to avoid magic numbers
 */

// API & Network Timeouts
export const API_TIMEOUT_MS = 30000; // 30 seconds

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  CAROUSEL: 4000,
  TRANSITION: 600,
};

// Debounce & Throttle Times
export const DEBOUNCE_DELAY = 300;
export const THROTTLE_DELAY = 1000;

// Cache Expiration (seconds)
export const CACHE_EXPIRY = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  DELAY_MS: 1000,
};
