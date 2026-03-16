import { Module } from '@nestjs/common';
import { NotificationService } from './notification-service';
import { TemplateLoaderService } from './template-loader.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { SmsModule } from '../sms/sms.module';

/**
 * Notification Module
 *
 * Provides unified notification service for SMS and Push notifications.
 * Uses centralized templates for consistent messaging.
 * 
 * Templates are stored in:
 * - templates/email/{workflow-name}.html - HTML email templates
 * - templates/sms/{workflow-name}.json - JSON SMS templates (multi-language)
 */
@Module({
  imports: [PushNotificationModule, SmsModule],
  providers: [NotificationService, TemplateLoaderService],
  exports: [NotificationService, TemplateLoaderService],
})
export class NotificationModule {}
