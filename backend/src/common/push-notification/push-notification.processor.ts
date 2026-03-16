import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationQueue, QueueStatus } from '../../entities/notification-queue.entity';
import { NotificationLog, NotificationStatus } from '../../entities/notification-log.entity';

/**
 * Bull Queue Processor for Push Notifications
 * Handles background tasks: receipt checking and scheduled notifications
 */
@Processor('push-notifications')
export class PushNotificationProcessor {
  private readonly logger = new Logger(PushNotificationProcessor.name);

  constructor(
    private pushNotificationService: PushNotificationService,
    @InjectRepository(NotificationQueue)
    private notificationQueueRepository: Repository<NotificationQueue>,
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
  ) {}

  /**
   * Process receipt checking job
   */
  @Process('check-receipt')
  async handleReceiptCheck(job: Job<{ notificationLogId: string; ticketId: string }>) {
    const { notificationLogId, ticketId } = job.data;
    this.logger.debug(`Checking receipt for ticket: ${ticketId}`);

    try {
      await this.pushNotificationService.checkDeliveryReceipts([ticketId]);

      // Mark job as completed
      this.logger.debug(`Receipt check completed for ticket: ${ticketId}`);
    } catch (error) {
      this.logger.error(`Error checking receipt for ticket ${ticketId}: ${error.message}`, error.stack);
      throw error; // Re-throw to mark job as failed
    }
  }

  /**
   * Process scheduled notification job
   */
  @Process('send-scheduled')
  async handleScheduledNotification(job: Job<{ queueId: string; payload: any }>) {
    const { queueId, payload } = job.data;
    this.logger.debug(`Sending scheduled notification for queue item: ${queueId}`);

    try {
      // Update queue status to processing
      await this.notificationQueueRepository.update(queueId, {
        status: QueueStatus.PROCESSING,
      });

      // Send the notification
      const notificationLog = await this.pushNotificationService.sendPushNotification(payload);

      // Update queue status to completed
      await this.notificationQueueRepository.update(queueId, {
        status: QueueStatus.COMPLETED,
      });

      this.logger.debug(`Scheduled notification sent successfully: ${queueId}`);
      return notificationLog;
    } catch (error) {
      this.logger.error(`Error sending scheduled notification ${queueId}: ${error.message}`, error.stack);

      // Update queue status and increment retry count
      const queueItem = await this.notificationQueueRepository.findOne({
        where: { id: queueId },
      });

      if (queueItem) {
        const newRetryCount = queueItem.retryCount + 1;

        if (newRetryCount >= queueItem.maxRetries) {
          // Mark as failed
          await this.notificationQueueRepository.update(queueId, {
            status: QueueStatus.FAILED,
            retryCount: newRetryCount,
          });
        } else {
          // Reset to queued for retry
          await this.notificationQueueRepository.update(queueId, {
            status: QueueStatus.QUEUED,
            retryCount: newRetryCount,
          });

          // Re-queue with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, newRetryCount), 300000); // Max 5 minutes
          throw new Error(`Retry ${newRetryCount}/${queueItem.maxRetries} scheduled for ${delay}ms: ${error.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Handle queue errors
   */
  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, error.stack);
  }

  /**
   * Clean up old completed/failed jobs (optional maintenance job)
   */
  @Process('cleanup-old-jobs')
  async handleCleanup(job: Job<{ daysOld: number }>) {
    const { daysOld = 30 } = job.data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Clean up old notification logs (keep last 90 days)
      const oldLogsDeleted = await this.notificationLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .andWhere('status IN (:...statuses)', {
          statuses: [NotificationStatus.DELIVERED, NotificationStatus.FAILED, NotificationStatus.EXPIRED]
        })
        .execute();

      // Clean up old queue items (keep last 7 days)
      const queueCutoffDate = new Date();
      queueCutoffDate.setDate(queueCutoffDate.getDate() - 7);

      const oldQueueDeleted = await this.notificationQueueRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate: queueCutoffDate })
        .andWhere('status IN (:...statuses)', {
          statuses: [QueueStatus.COMPLETED, QueueStatus.FAILED]
        })
        .execute();

      this.logger.log(`Cleanup completed: ${oldLogsDeleted.affected} notification logs, ${oldQueueDeleted.affected} queue items removed`);
    } catch (error) {
      this.logger.error(`Cleanup error: ${error.message}`, error.stack);
      throw error;
    }
  }
}

