import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { User } from '../../entities/user.entity';
import { NotificationLog, NotificationStatus } from '../../entities/notification-log.entity';
import { NotificationType, NOTIFICATION_TEMPLATES } from '../templates/notification-templates';
import { NotificationQueue, QueueStatus } from '../../entities/notification-queue.entity';
import {
  IPushNotificationProvider,
  PushNotificationPayload,
  PushNotificationConfig,
} from './interfaces/push-provider.interface';

/**
 * Push Notification Service - Provider Agnostic (Strategy Pattern)
 *
 * This service uses dependency injection to work with any push notification provider.
 * Currently uses Expo, but can easily switch to FCM, OneSignal, etc.
 */
@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private config: PushNotificationConfig;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(NotificationQueue)
    private notificationQueueRepository: Repository<NotificationQueue>,
    @InjectQueue('push-notifications')
    private notificationQueue: Queue,
    @Inject('PUSH_PROVIDER')
    private pushProvider: IPushNotificationProvider,
  ) {
    this.config = {
      provider: process.env.PUSH_PROVIDER || 'expo',
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED !== 'false',
      maxRetries: parseInt(process.env.PUSH_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.PUSH_RETRY_DELAY || '1000'),
      batchSize: parseInt(process.env.PUSH_BATCH_SIZE || '100'),
    };
  }

  onModuleInit() {
    this.logger.log(`Initialized with provider: ${this.pushProvider.getProviderName()}`);
  }

  /**
   * Register device push token
   */
  async registerDeviceToken(userId: string, pushToken: string): Promise<void> {
    if (!this.config.enabled) {
      this.logger.warn('Push notifications are disabled');
      return;
    }

    if (!this.pushProvider.isValidPushToken(pushToken)) {
      throw new Error(`Invalid push token format for provider ${this.pushProvider.getProviderName()}`);
    }

    await this.userRepository.update(userId, {
      pushToken,
      pushTokenLastUpdated: new Date(),
    });

    this.logger.log(`Registered push token for user ${userId} with provider ${this.pushProvider.getProviderName()}`);
  }

  /**
   * Send immediate push notification
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<NotificationLog> {
    if (!this.config.enabled) {
      this.logger.warn('Push notifications are disabled');
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      select: ['id', 'pushToken', 'preferences'],
    });

    if (!user || !user.pushToken) {
      throw new Error('User not found or push token not registered');
    }

    // Check if user has notifications enabled
    if (!this.isNotificationEnabled(user, payload.type)) {
      this.logger.log(`Notifications disabled for user ${user.id}, type ${payload.type}`);
      return null;
    }

    // Add push token to payload data
    const enrichedPayload = {
      ...payload,
      data: {
        ...payload.data,
        pushToken: user.pushToken,
      },
    };

    // Create notification log
    const notificationLog = this.notificationLogRepository.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      status: NotificationStatus.PENDING,
    });

    await this.notificationLogRepository.save(notificationLog);

    try {
      // Send via provider
      const response = await this.pushProvider.sendPushNotification(enrichedPayload);

      if (response.success) {
        notificationLog.providerTicketId = response.ticketId;
        notificationLog.providerData = response.providerData;
        notificationLog.status = NotificationStatus.SENT;
        notificationLog.sentAt = new Date();

        this.logger.log(`Notification sent to user ${user.id} via ${this.pushProvider.getProviderName()}: ${response.ticketId}`);

        // Queue receipt check after 15 minutes
        if (response.ticketId) {
          await this.notificationQueue.add(
            'check-receipt',
            { notificationLogId: notificationLog.id, ticketId: response.ticketId },
            { delay: 15 * 60 * 1000 }, // 15 minutes
          );
        }
      } else {
        notificationLog.status = NotificationStatus.FAILED;
        notificationLog.errorMessage = response.errorMessage;
        notificationLog.providerData = response.providerData;
        notificationLog.failedAt = new Date();

        this.logger.error(`Failed to send notification to user ${user.id}: ${response.errorMessage}`);
      }

      await this.notificationLogRepository.save(notificationLog);
      return notificationLog;
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`, error.stack);
      notificationLog.status = NotificationStatus.FAILED;
      notificationLog.errorMessage = error.message;
      notificationLog.failedAt = new Date();
      await this.notificationLogRepository.save(notificationLog);
      throw error;
    }
  }

  /**
   * Send bulk push notifications
   */
  async sendBulkPushNotifications(payloads: PushNotificationPayload[]): Promise<void> {
    if (!this.config.enabled) {
      this.logger.warn('Push notifications are disabled');
      return;
    }

    const validPayloads: PushNotificationPayload[] = [];
    const notificationLogs: NotificationLog[] = [];

    // Validate and enrich payloads
    for (const payload of payloads) {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        select: ['id', 'pushToken', 'preferences'],
      });

      if (!user || !user.pushToken || !this.isNotificationEnabled(user, payload.type)) {
        continue;
      }

      const enrichedPayload = {
        ...payload,
        data: {
          ...payload.data,
          pushToken: user.pushToken,
        },
      };

      validPayloads.push(enrichedPayload);

      const notificationLog = this.notificationLogRepository.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: NotificationStatus.PENDING,
      });

      notificationLogs.push(notificationLog);
    }

    if (validPayloads.length === 0) {
      this.logger.log('No valid payloads to send');
      return;
    }

    // Save all notification logs
    await this.notificationLogRepository.save(notificationLogs);

    try {
      // Send in batches
      const batchSize = this.config.batchSize;
      for (let i = 0; i < validPayloads.length; i += batchSize) {
        const batch = validPayloads.slice(i, i + batchSize);
        const responses = await this.pushProvider.sendBulkPushNotifications(batch);

        // Update logs with results
        for (let j = 0; j < responses.length; j++) {
          const response = responses[j];
          const logIndex = i + j;
          const log = notificationLogs[logIndex];

          if (response.success) {
            log.providerTicketId = response.ticketId;
            log.providerData = response.providerData;
            log.status = NotificationStatus.SENT;
            log.sentAt = new Date();
          } else {
            log.status = NotificationStatus.FAILED;
            log.errorMessage = response.errorMessage;
            log.providerData = response.providerData;
            log.failedAt = new Date();
          }
        }

        await this.notificationLogRepository.save(notificationLogs.slice(i, i + batchSize));
      }
    } catch (error) {
      this.logger.error(`Error sending bulk notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Queue notification for later delivery
   */
  async queueNotification(
    payload: PushNotificationPayload,
    scheduledFor?: Date,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<NotificationQueue> {
    const queueItem = this.notificationQueueRepository.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      scheduledFor,
      priority: priority as any,
      status: QueueStatus.QUEUED,
    });

    await this.notificationQueueRepository.save(queueItem);

    // Add to Bull queue if scheduled
    if (scheduledFor) {
      const delay = scheduledFor.getTime() - Date.now();
      if (delay > 0) {
        await this.notificationQueue.add(
          'send-scheduled',
          { queueId: queueItem.id, payload },
          { delay, priority: priority === 'high' ? 10 : priority === 'normal' ? 5 : 1 }
        );
      }
    }

    return queueItem;
  }

  /**
   * Check delivery receipts for sent notifications
   */
  async checkDeliveryReceipts(ticketIds: string[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    await this.pushProvider.checkDeliveryReceipts(ticketIds);

    // Update notification logs based on receipts
    // This would be called by the queue processor
    for (const ticketId of ticketIds) {
      const log = await this.notificationLogRepository.findOne({
        where: { providerTicketId: ticketId },
      });

      if (!log) continue;

      // Provider-specific receipt checking would be handled here
      // For now, mark as delivered after successful check
      if (log.status === NotificationStatus.SENT) {
        log.status = NotificationStatus.DELIVERED;
        log.deliveredAt = new Date();
        await this.notificationLogRepository.save(log);
      }
    }
  }

  /**
   * Check if notifications are enabled for user and type
   */
  private isNotificationEnabled(user: User, type: NotificationType): boolean {
    if (!user.preferences?.notifications) {
      return true; // Default to enabled
    }

    const prefs = user.preferences.notifications;

    // Check if push notifications are globally enabled
    if (prefs.push === false) {
      return false;
    }

    // Check type-specific settings based on template category
    const template = NOTIFICATION_TEMPLATES[type as NotificationType];
    if (!template) {
      return true; // Unknown types default to enabled
    }

    const category = template.category;
    switch (category) {
      case 'transaction':
        return prefs.transactionAlerts !== false;
      case 'security':
        return true; // Security notifications always enabled
      case 'kyc':
        return true; // KYC notifications always enabled
      case 'promotional':
        return prefs.promotionalEmails !== false; // Reuse email pref for now
      case 'system':
        return true; // System notifications always enabled
      case 'account':
        return true; // Account notifications default enabled
      default:
        return true;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getUserNotificationStats(userId: string): Promise<any> {
    const [total, sent, delivered, failed] = await Promise.all([
      this.notificationLogRepository.count({ where: { userId } }),
      this.notificationLogRepository.count({ where: { userId, status: NotificationStatus.SENT } }),
      this.notificationLogRepository.count({ where: { userId, status: NotificationStatus.DELIVERED } }),
      this.notificationLogRepository.count({ where: { userId, status: NotificationStatus.FAILED } }),
    ]);

    return {
      total,
      sent,
      delivered,
      failed,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + '%' : '0%',
      provider: this.pushProvider.getProviderName(),
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    return {
      enabled: this.config.enabled,
      provider: this.pushProvider.getProviderName(),
      config: {
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay,
        batchSize: this.config.batchSize,
      },
    };
  }
}

