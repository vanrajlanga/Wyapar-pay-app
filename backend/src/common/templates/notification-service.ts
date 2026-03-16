import { Injectable, Logger } from '@nestjs/common';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { SmsService } from '../sms/sms.service';
import { NotificationType, NotificationTemplateManager, TemplateContext, NOTIFICATION_TEMPLATES } from './notification-templates';

/**
 * Unified Notification Service
 *
 * Provides a single interface for sending notifications via SMS and Push.
 * Uses centralized templates for consistent messaging across channels.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private pushNotificationService: PushNotificationService,
    private smsService: SmsService,
  ) {}

  /**
   * Send notification via push only
   */
  async sendPushNotification(
    userId: string,
    type: NotificationType,
    language: string = 'en',
    context: TemplateContext = {}
  ) {
    try {
      const title = NotificationTemplateManager.renderPushTitle(type, language, context);
      const body = NotificationTemplateManager.renderPushBody(type, language, context);
      const data = NotificationTemplateManager.getPushData(type, context);

      const result = await this.pushNotificationService.sendPushNotification({
        userId,
        title,
        body,
        data,
        type,
      });

      this.logger.log(`Push notification sent: ${type} to user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification via SMS only
   */
  async sendSmsNotification(
    phoneNumber: string,
    type: NotificationType,
    language: string = 'en',
    context: TemplateContext = {}
  ) {
    try {
      if (!phoneNumber) {
        this.logger.warn(`SMS notification skipped: no phone number provided for ${type}`);
        return {
          success: false,
          message: 'No phone number provided',
          content: '',
        };
      }

      const message = NotificationTemplateManager.renderSmsMessage(type, language, context);

      // Send SMS via SMS service
      const sent = await this.smsService.sendSms(phoneNumber, message);

      if (sent) {
        this.logger.log(`✅ SMS notification sent: ${type} to ${phoneNumber}`);
      } else {
        this.logger.warn(`⚠️  SMS notification failed: ${type} to ${phoneNumber}`);
      }

      return {
        success: sent,
        message: sent ? 'SMS sent successfully' : 'SMS sending failed or disabled',
        content: message,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS notification: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error: ${error.message}`,
        content: '',
      };
    }
  }

  /**
   * Send notification via both SMS and Push
   */
  async sendDualNotification(
    userId: string,
    phoneNumber: string,
    type: NotificationType,
    language: string = 'en',
    context: TemplateContext = {}
  ) {
    try {
      // Send both in parallel for better performance
      const [pushResult, smsResult] = await Promise.allSettled([
        this.sendPushNotification(userId, type, language, context),
        this.sendSmsNotification(phoneNumber, type, language, context),
      ]);

      const results = {
        push: pushResult.status === 'fulfilled' ? pushResult.value : null,
        sms: smsResult.status === 'fulfilled' ? smsResult.value : null,
        errors: [],
      };

      if (pushResult.status === 'rejected') {
        results.errors.push(`Push failed: ${pushResult.reason.message}`);
      }
      if (smsResult.status === 'rejected') {
        results.errors.push(`SMS failed: ${smsResult.reason.message}`);
      }

      this.logger.log(`Dual notification sent: ${type} to user ${userId}`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to send dual notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    notifications: Array<{
      userId: string;
      phoneNumber?: string;
      type: NotificationType;
      language?: string;
      context?: TemplateContext;
    }>
  ) {
    try {
      const pushPayloads = notifications.map(({ userId, type, language = 'en', context = {} }) => ({
        userId,
        title: NotificationTemplateManager.renderPushTitle(type, language, context),
        body: NotificationTemplateManager.renderPushBody(type, language, context),
        data: NotificationTemplateManager.getPushData(type, context),
        type,
      }));

      // Send push notifications in bulk
      await this.pushNotificationService.sendBulkPushNotifications(pushPayloads);

      // Send SMS notifications in bulk
      const smsPromises = notifications
        .filter((n) => n.phoneNumber)
        .map(({ phoneNumber, type, language = 'en', context = {} }) =>
          this.smsService.sendSms(
            phoneNumber!,
            NotificationTemplateManager.renderSmsMessage(type, language, context),
          ),
        );

      await Promise.allSettled(smsPromises);

      this.logger.log(`Bulk notifications sent: ${notifications.length} notifications`);
      return { success: true, count: notifications.length };
    } catch (error) {
      this.logger.error(`Failed to send bulk notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Queue notification for scheduled delivery
   */
  async queueNotification(
    userId: string,
    type: NotificationType,
    scheduledFor: Date,
    language: string = 'en',
    context: TemplateContext = {},
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) {
    try {
      const title = NotificationTemplateManager.renderPushTitle(type, language, context);
      const body = NotificationTemplateManager.renderPushBody(type, language, context);
      const data = NotificationTemplateManager.getPushData(type, context);

      const result = await this.pushNotificationService.queueNotification({
        userId,
        title,
        body,
        data,
        type,
      }, scheduledFor, priority);

      this.logger.log(`Notification queued: ${type} for user ${userId} at ${scheduledFor}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to queue notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get notification template preview
   */
  getTemplatePreview(
    type: NotificationType,
    language: string = 'en',
    context: TemplateContext = {}
  ) {
    try {
      return {
        type,
        language,
        push: {
          title: NotificationTemplateManager.renderPushTitle(type, language, context),
          body: NotificationTemplateManager.renderPushBody(type, language, context),
          data: NotificationTemplateManager.getPushData(type, context),
        },
        sms: {
          message: NotificationTemplateManager.renderSmsMessage(type, language, context),
        },
        category: NOTIFICATION_TEMPLATES[type].category,
        priority: NOTIFICATION_TEMPLATES[type].priority,
      };
    } catch (error) {
      this.logger.error(`Failed to get template preview: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user notification statistics
   */
  async getUserStats(userId: string) {
    return this.pushNotificationService.getUserNotificationStats(userId);
  }

  /**
   * Get service health
   */
  async getHealth() {
    return this.pushNotificationService.getHealthStatus();
  }
}
