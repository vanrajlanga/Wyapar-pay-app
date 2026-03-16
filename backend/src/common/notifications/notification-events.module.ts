import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { User } from '../../entities/user.entity';
import { NotificationModule } from '../templates/notification.module';
import { NotificationEventHandler } from './notification-event-handler';
import { NotificationEmitterService } from './notification-emitter.service';

/**
 * Notification Events Module
 * 
 * Provides event-driven notification system for loose coupling.
 * 
 * Usage in services:
 * ```typescript
 * constructor(
 *   private notificationEmitter: NotificationEmitterService
 * ) {}
 * 
 * // Emit event instead of calling notification service directly
 * await this.notificationEmitter.emitTransactionSuccess(userId, {
 *   transactionId: '...',
 *   amount: 100
 * });
 * ```
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationModule,
    EventEmitterModule,
  ],
  providers: [
    NotificationEventHandler,
    NotificationEmitterService,
  ],
  exports: [NotificationEmitterService],
})
export class NotificationEventsModule {}




