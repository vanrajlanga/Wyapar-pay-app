import { Injectable, Logger } from '@nestjs/common';
import { IPushNotificationProvider, PushNotificationPayload, PushNotificationResponse } from '../interfaces/push-provider.interface';

/**
 * Mock Push Notification Provider for Testing
 * Simulates push notification functionality without external dependencies
 */
@Injectable()
export class MockPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(MockPushProvider.name);

  /**
   * Get provider name for logging
   */
  getProviderName(): string {
    return 'mock';
  }

  /**
   * Mock validation - accepts any token starting with "mock"
   */
  isValidPushToken(token: string): boolean {
    return token.startsWith('mock') || token.startsWith('ExponentPushToken');
  }

  /**
   * Send a single push notification (mocked)
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<PushNotificationResponse> {
    this.logger.log(`MOCK: Sending notification to user ${payload.userId}`);
    this.logger.log(`MOCK: Title: ${payload.title}`);
    this.logger.log(`MOCK: Body: ${payload.body}`);
    this.logger.log(`MOCK: Type: ${payload.type}`);

    // Simulate successful send
    return {
      success: true,
      ticketId: `mock_ticket_${Date.now()}`,
      providerData: {
        mockStatus: 'sent',
        mockTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Send multiple push notifications in batch (mocked)
   */
  async sendBulkPushNotifications(payloads: PushNotificationPayload[]): Promise<PushNotificationResponse[]> {
    this.logger.log(`MOCK: Sending bulk notifications to ${payloads.length} users`);

    return payloads.map((payload, index) => ({
      success: true,
      ticketId: `mock_bulk_ticket_${Date.now()}_${index}`,
      providerData: {
        mockStatus: 'sent',
        mockBatchIndex: index,
        mockTimestamp: new Date().toISOString(),
      },
    }));
  }

  /**
   * Check delivery receipts (mocked)
   */
  async checkDeliveryReceipts(ticketIds: string[]): Promise<void> {
    this.logger.log(`MOCK: Checking receipts for ${ticketIds.length} tickets`);

    // Simulate delivery after some time
    ticketIds.forEach(ticketId => {
      this.logger.log(`MOCK: Ticket ${ticketId} marked as delivered`);
    });
  }
}
