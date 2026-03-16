/**
 * Network Utilities
 * Help diagnose and fix network connectivity issues
 */

import { API_CONFIG } from '../constants';
import { logger } from '../services/logger.service';

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<{
  isReachable: boolean;
  error?: string;
  latency?: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      logger.debug('Backend health check: OK', { latency });
      return {
        isReachable: true,
        latency,
      };
    }

    return {
      isReachable: false,
      error: `Backend returned status ${response.status}`,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorMessage = error?.message || 'Unknown error';

    logger.warn('Backend health check failed', {
      error: errorMessage,
      latency,
      baseUrl: API_CONFIG.BASE_URL,
    });

    // Provide helpful error messages
    if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
      return {
        isReachable: false,
        error: `Cannot reach backend at ${API_CONFIG.BASE_URL}. Check:\n1. Backend is running\n2. IP address is correct\n3. Device and computer are on same network\n4. Firewall is not blocking`,
        latency,
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        isReachable: false,
        error: `Backend timeout at ${API_CONFIG.BASE_URL}. Server may be slow or unreachable.`,
        latency,
      };
    }

    return {
      isReachable: false,
      error: errorMessage,
      latency,
    };
  }
}

/**
 * Get current API base URL
 */
export function getApiBaseUrl(): string {
  return API_CONFIG.BASE_URL;
}

/**
 * Validate IP address format
 */
export function isValidIpAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return false;
  }

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Get helpful network troubleshooting tips
 */
export function getNetworkTroubleshootingTips(): string[] {
  return [
    'Ensure backend server is running: `cd backend && npm run start:dev`',
    `Verify API base URL is correct: ${API_CONFIG.BASE_URL}`,
    'Check device and computer are on the same WiFi network',
    'Verify firewall allows connections on port 3000',
    'Try accessing backend from browser: http://' + API_CONFIG.BASE_URL.replace('http://', '').replace(':3000', '') + ':3000/health',
    'For physical devices, use computer\'s local IP (not localhost)',
    'Restart both backend and mobile app',
  ];
}

