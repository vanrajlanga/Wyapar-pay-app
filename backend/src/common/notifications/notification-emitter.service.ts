import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import {
  NotificationEvent,
  NotificationEventType,
} from './notification-events';

/**
 * Notification Emitter Service
 * 
 * Provides a clean, reusable interface for emitting notification events.
 * Services use this instead of directly calling NotificationService.
 * 
 * Usage:
 * ```typescript
 * await this.notificationEmitter.emitTransactionSuccess(userId, {
 *   transactionId: '...',
 *   amount: 100,
 *   currency: '₹'
 * });
 * ```
 */
@Injectable()
export class NotificationEmitterService {
  private readonly logger = new Logger(NotificationEmitterService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Get user metadata for notifications
   * Cached to avoid repeated database queries
   */
  private userMetadataCache = new Map<string, {
    language: string;
    phone?: string;
    email?: string;
    timestamp: number;
  }>();

  private async getUserMetadata(userId: string): Promise<{
    language: string;
    phone?: string;
    email?: string;
  }> {
    // Check cache (5 minute TTL)
    const cached = this.userMetadataCache.get(userId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return {
        language: cached.language,
        phone: cached.phone,
        email: cached.email,
      };
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'phone', 'email', 'preferences'],
      });

      if (!user) {
        return { language: 'en' };
      }

      const metadata = {
        language: user.preferences?.display?.language ||
                  user.preferences?.language ||
                  'en',
        phone: user.phone,
        email: user.email,
      };

      // Cache the result
      this.userMetadataCache.set(userId, {
        ...metadata,
        timestamp: Date.now(),
      });

      // Clean old cache entries (keep cache size reasonable)
      if (this.userMetadataCache.size > 1000) {
        const entries = Array.from(this.userMetadataCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        entries.slice(0, 500).forEach(([key]) => this.userMetadataCache.delete(key));
      }

      return metadata;
    } catch (error) {
      this.logger.warn(`Failed to get user metadata for ${userId}: ${error.message}`);
      return { language: 'en' };
    }
  }

  /**
   * Emit a notification event
   */
  private async emitEvent(
    type: NotificationEventType,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const metadata = await this.getUserMetadata(userId);

      const event: NotificationEvent = {
        type,
        userId,
        data,
        metadata,
      };

      this.eventEmitter.emit(type, event);
    } catch (error) {
      this.logger.error(`Failed to emit notification event ${type}: ${error.message}`);
      // Don't throw - event emission failure shouldn't break business logic
    }
  }

  // Transaction events
  async emitTransactionSuccess(
    userId: string,
    data: { transactionId: string; amount: number; currency?: string; type?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.TRANSACTION_SUCCESS, userId, data);
  }

  async emitTransactionFailed(
    userId: string,
    data: { transactionId: string; amount: number; currency?: string; reason?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.TRANSACTION_FAILED, userId, {
      ...data,
      reason: data.reason || 'Transaction failed',
    });
  }

  // Recharge events
  async emitRechargeSuccess(
    userId: string,
    data: { transactionId: string; amount: number; phoneNumber: string; operator: string; currency?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.RECHARGE_SUCCESS, userId, data);
  }

  async emitRechargeFailed(
    userId: string,
    data: { transactionId: string; amount: number; phoneNumber: string; currency?: string; reason?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.RECHARGE_FAILED, userId, {
      ...data,
      reason: data.reason || 'Recharge failed. Please try again.',
    });
  }

  // Wallet events
  async emitWalletTopupSuccess(
    userId: string,
    data: { transactionId: string; amount: number; currency?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.WALLET_TOPUP_SUCCESS, userId, data);
  }

  // Auth events
  async emitUserRegistered(
    userId: string,
    data: { userName?: string; name?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.USER_REGISTERED, userId, data);
  }

  async emitUserLogin(
    userId: string
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.USER_LOGIN, userId, {});
  }

  async emitNewDeviceLogin(
    userId: string,
    data: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.USER_LOGIN_NEW_DEVICE, userId, data);
  }

  async emitOtpSent(
    userId: string
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.OTP_SENT, userId, {});
  }

  async emitPasswordChanged(
    userId: string
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.PASSWORD_CHANGED, userId, {});
  }

  async emitAccountVerified(
    userId: string
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.ACCOUNT_VERIFIED, userId, {});
  }

  // KYC events
  async emitKycApproved(
    userId: string
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.KYC_APPROVED, userId, {});
  }

  async emitKycRejected(
    userId: string,
    data: { reason?: string }
  ): Promise<void> {
    await this.emitEvent(NotificationEventType.KYC_REJECTED, userId, data);
  }
}

