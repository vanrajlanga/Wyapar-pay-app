import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { PushNotificationModule } from '../../common/push-notification/push-notification.module';
import { NotificationModule } from '../../common/templates/notification.module';

/**
 * Notifications Module
 *
 * Provides REST API endpoints for push notification management:
 * - Device token registration
 * - Custom notifications
 * - Template-based notifications (SMS & Push)
 * - Notification statistics
 * - Service health monitoring
 * - Template previews and management
 *
 * Depends on PushNotificationModule and NotificationModule for functionality.
 */
@Module({
  imports: [PushNotificationModule, NotificationModule],
  controllers: [NotificationsController],
  providers: [],
  exports: [],
})
export class NotificationsModule {}

