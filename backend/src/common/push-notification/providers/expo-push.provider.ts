import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { IPushNotificationProvider, PushNotificationPayload, PushNotificationResponse } from '../interfaces/push-provider.interface';

/**
 * Expo Push Notification Provider Implementation
 * Implements the Strategy pattern for provider-agnostic push notifications
 */
@Injectable()
export class ExpoPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true, // Use FCM v1 for better Android support
    });
  }

  /**
   * Get provider name for logging
   */
  getProviderName(): string {
    return 'expo';
  }

  /**
   * Validate Expo push token format
   */
  isValidPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send a single push notification
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResponse> {
    try {
      const message: ExpoPushMessage = {
        to: payload.data?.pushToken, // Token should be passed in data for flexibility
        sound: payload.sound || 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: payload.priority === 'high' ? 'high' : 'default',
        badge: payload.badge,
        ttl: 86400, // 24 hours TTL
        expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        categoryId: payload.type, // Use notification type as category
      };

      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0] as ExpoPushTicket;

      if (ticket.status === 'ok') {
        return {
          success: true,
          ticketId: ticket.id,
          providerData: {
            expoStatus: ticket.status,
            expoTicketId: ticket.id,
          },
        };
      } else {
        return {
          success: false,
          errorMessage: ticket.message,
          providerData: {
            expoStatus: ticket.status,
            expoMessage: ticket.message,
            expoDetails: ticket.details,
          },
        };
      }
    } catch (error) {
      this.logger.error(`Expo push notification error: ${error.message}`, error.stack);
      return {
        success: false,
        errorMessage: error.message,
        providerData: {
          expoError: error.message,
        },
      };
    }
  }

  /**
   * Send multiple push notifications in batch
   */
  async sendBulkPushNotifications(payloads: PushNotificationPayload[]): Promise<PushNotificationResponse[]> {
    const results: PushNotificationResponse[] = [];
    const messages: ExpoPushMessage[] = [];

    // Build messages array
    for (const payload of payloads) {
      if (!payload.data?.pushToken) {
        results.push({
          success: false,
          errorMessage: 'Push token not provided',
        });
        continue;
      }

      messages.push({
        to: payload.data.pushToken,
        sound: payload.sound || 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: payload.priority === 'high' ? 'high' : 'default',
        badge: payload.badge,
        ttl: 86400,
        expiration: Math.floor(Date.now() / 1000) + 86400,
        categoryId: payload.type,
      });
    }

    if (messages.length === 0) {
      return results;
    }

    try {
      // Send in chunks (Expo recommends max 100 per request)
      const chunks = this.expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);

        // Map tickets back to results
        tickets.forEach((ticket, index) => {
          const ticketIndex = results.length + index;

          if (ticket.status === 'ok') {
            results.push({
              success: true,
              ticketId: ticket.id,
              providerData: {
                expoStatus: ticket.status,
                expoTicketId: ticket.id,
              },
            });
          } else {
            results.push({
              success: false,
              errorMessage: ticket.message,
              providerData: {
                expoStatus: ticket.status,
                expoMessage: ticket.message,
                expoDetails: ticket.details,
              },
            });
          }
        });
      }
    } catch (error) {
      this.logger.error(`Expo bulk push notification error: ${error.message}`, error.stack);

      // Mark all remaining notifications as failed
      const remainingCount = payloads.length - results.length;
      for (let i = 0; i < remainingCount; i++) {
        results.push({
          success: false,
          errorMessage: `Bulk send failed: ${error.message}`,
          providerData: {
            expoBulkError: error.message,
          },
        });
      }
    }

    return results;
  }

  /**
   * Check delivery receipts for sent notifications
   */
  async checkDeliveryReceipts(ticketIds: string[]): Promise<void> {
    if (ticketIds.length === 0) {
      return;
    }

    try {
      // Filter for valid Expo ticket IDs
      const expoTicketIds = ticketIds.filter(id => Expo.isExpoPushToken(id));

      if (expoTicketIds.length === 0) {
        return;
      }

      const receipts = await this.expo.getPushNotificationReceiptsAsync(expoTicketIds);

      // Process receipts (this will be handled by the service layer)
      for (const ticketId in receipts) {
        const receipt = receipts[ticketId] as ExpoPushReceipt;
        this.logger.debug(`Receipt for ${ticketId}: ${receipt.status}`);

        // Receipt processing will be done in the service layer
        // This provider just fetches the data
      }
    } catch (error) {
      this.logger.error(`Error checking Expo receipts: ${error.message}`, error.stack);
    }
  }
}

