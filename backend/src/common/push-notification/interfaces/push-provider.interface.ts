import { NotificationType } from '../../templates/notification-templates';

/**
 * Provider-agnostic interface for push notification providers
 */
export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: NotificationType;
  priority?: 'default' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

/**
 * Provider-specific response from sending a notification
 */
export interface PushNotificationResponse {
  success: boolean;
  ticketId?: string;
  receiptId?: string;
  errorMessage?: string;
  providerData?: Record<string, any>;
}

/**
 * Push notification provider interface (Strategy Pattern)
 */
export interface IPushNotificationProvider {
  /**
   * Send a single push notification
   */
  sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResponse>;

  /**
   * Send multiple push notifications in batch
   */
  sendBulkPushNotifications(payloads: PushNotificationPayload[]): Promise<PushNotificationResponse[]>;

  /**
   * Check delivery status for sent notifications
   */
  checkDeliveryReceipts(ticketIds: string[]): Promise<void>;

  /**
   * Validate a push token format
   */
  isValidPushToken(token: string): boolean;

  /**
   * Get provider name (for logging and identification)
   */
  getProviderName(): string;
}

/**
 * Push notification service configuration
 */
export interface PushNotificationConfig {
  provider: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

