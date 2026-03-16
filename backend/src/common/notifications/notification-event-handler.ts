import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../templates/notification-service';
import { NotificationType } from '../templates/notification-templates';
import {
  NotificationEvent,
  NotificationEventType,
  TransactionEventData,
  RechargeEventData,
  WalletTopupEventData,
  LoginEventData,
  KycEventData,
} from './notification-events';

/**
 * Notification Event Handler
 * 
 * Listens to notification events and sends appropriate notifications.
 * This decouples business logic from notification sending.
 */
@Injectable()
export class NotificationEventHandler implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(private notificationService: NotificationService) {}

  onModuleInit() {
    this.logger.log('Notification event handler initialized');
  }

  /**
   * Map event types to notification types
   */
  private getNotificationType(eventType: NotificationEventType): NotificationType {
    const mapping: Record<NotificationEventType, NotificationType> = {
      [NotificationEventType.TRANSACTION_SUCCESS]: NotificationType.TRANSACTION_SUCCESS,
      [NotificationEventType.TRANSACTION_FAILED]: NotificationType.TRANSACTION_FAILED,
      [NotificationEventType.RECHARGE_SUCCESS]: NotificationType.RECHARGE_SUCCESS,
      [NotificationEventType.RECHARGE_FAILED]: NotificationType.RECHARGE_FAILED,
      [NotificationEventType.WALLET_TOPUP_SUCCESS]: NotificationType.WALLET_TOPUP_SUCCESS,
      [NotificationEventType.USER_REGISTERED]: NotificationType.WELCOME_MESSAGE,
      [NotificationEventType.USER_LOGIN]: NotificationType.LOGIN_SUCCESS,
      [NotificationEventType.USER_LOGIN_NEW_DEVICE]: NotificationType.LOGIN_ALERT,
      [NotificationEventType.OTP_SENT]: NotificationType.OTP_SENT,
      [NotificationEventType.PASSWORD_CHANGED]: NotificationType.PASSWORD_CHANGED,
      [NotificationEventType.ACCOUNT_VERIFIED]: NotificationType.ACCOUNT_VERIFIED,
      [NotificationEventType.KYC_APPROVED]: NotificationType.KYC_APPROVED,
      [NotificationEventType.KYC_REJECTED]: NotificationType.KYC_REJECTED,
    };

    return mapping[eventType];
  }

  /**
   * Handle transaction success
   */
  @OnEvent(NotificationEventType.TRANSACTION_SUCCESS)
  async handleTransactionSuccess(event: NotificationEvent) {
    try {
      const data = event.data as TransactionEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          amount: data.amount,
          currency: data.currency || '₹',
          transactionId: data.transactionId,
          type: data.type,
        }
      );

      this.logger.log(`Transaction success notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send transaction success notification: ${error.message}`);
    }
  }

  /**
   * Handle transaction failure
   */
  @OnEvent(NotificationEventType.TRANSACTION_FAILED)
  async handleTransactionFailed(event: NotificationEvent) {
    try {
      const data = event.data as TransactionEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          amount: data.amount,
          currency: data.currency || '₹',
          transactionId: data.transactionId,
          reason: data.reason || 'Transaction failed',
        }
      );

      this.logger.log(`Transaction failed notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send transaction failed notification: ${error.message}`);
    }
  }

  /**
   * Handle recharge success
   */
  @OnEvent(NotificationEventType.RECHARGE_SUCCESS)
  async handleRechargeSuccess(event: NotificationEvent) {
    try {
      const data = event.data as RechargeEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          amount: data.amount,
          currency: data.currency || '₹',
          phoneNumber: data.phoneNumber,
          transactionId: data.transactionId,
          operator: data.operator,
        }
      );

      this.logger.log(`Recharge success notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send recharge success notification: ${error.message}`);
    }
  }

  /**
   * Handle recharge failure
   */
  @OnEvent(NotificationEventType.RECHARGE_FAILED)
  async handleRechargeFailed(event: NotificationEvent) {
    try {
      const data = event.data as RechargeEventData & { reason?: string };
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          amount: data.amount,
          currency: data.currency || '₹',
          phoneNumber: data.phoneNumber,
          transactionId: data.transactionId,
          reason: data.reason || 'Recharge failed. Please try again.',
        }
      );

      this.logger.log(`Recharge failed notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send recharge failed notification: ${error.message}`);
    }
  }

  /**
   * Handle wallet topup success
   */
  @OnEvent(NotificationEventType.WALLET_TOPUP_SUCCESS)
  async handleWalletTopupSuccess(event: NotificationEvent) {
    try {
      const data = event.data as WalletTopupEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          amount: data.amount,
          currency: data.currency || '₹',
          transactionId: data.transactionId,
        }
      );

      this.logger.log(`Wallet topup success notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send wallet topup notification: ${error.message}`);
    }
  }

  /**
   * Handle user registration
   */
  @OnEvent(NotificationEventType.USER_REGISTERED)
  async handleUserRegistered(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          userName: event.data.userName || event.data.name,
        }
      );

      this.logger.log(`Welcome notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome notification: ${error.message}`);
    }
  }

  /**
   * Handle user login
   */
  @OnEvent(NotificationEventType.USER_LOGIN)
  async handleUserLogin(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';

      await this.notificationService.sendPushNotification(
        event.userId,
        this.getNotificationType(event.type),
        language,
        {}
      );

      this.logger.log(`Login success notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send login notification: ${error.message}`);
    }
  }

  /**
   * Handle new device login
   */
  @OnEvent(NotificationEventType.USER_LOGIN_NEW_DEVICE)
  async handleNewDeviceLogin(event: NotificationEvent) {
    try {
      const data = event.data as LoginEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          loginLocation: data.ipAddress,
          loginDevice: data.userAgent,
        }
      );

      this.logger.log(`New device login alert sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send login alert: ${error.message}`);
    }
  }

  /**
   * Handle OTP sent
   */
  @OnEvent(NotificationEventType.OTP_SENT)
  async handleOtpSent(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {}
      );

      this.logger.log(`OTP sent notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP notification: ${error.message}`);
    }
  }

  /**
   * Handle password changed
   */
  @OnEvent(NotificationEventType.PASSWORD_CHANGED)
  async handlePasswordChanged(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {}
      );

      this.logger.log(`Password changed notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed notification: ${error.message}`);
    }
  }

  /**
   * Handle account verified
   */
  @OnEvent(NotificationEventType.ACCOUNT_VERIFIED)
  async handleAccountVerified(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {}
      );

      this.logger.log(`Account verified notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send account verified notification: ${error.message}`);
    }
  }

  /**
   * Handle KYC approved
   */
  @OnEvent(NotificationEventType.KYC_APPROVED)
  async handleKycApproved(event: NotificationEvent) {
    try {
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {}
      );

      this.logger.log(`KYC approved notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send KYC approved notification: ${error.message}`);
    }
  }

  /**
   * Handle KYC rejected
   */
  @OnEvent(NotificationEventType.KYC_REJECTED)
  async handleKycRejected(event: NotificationEvent) {
    try {
      const data = event.data as KycEventData;
      const language = event.metadata?.language || 'en';
      const phone = event.metadata?.phone;

      await this.notificationService.sendDualNotification(
        event.userId,
        phone || '',
        this.getNotificationType(event.type),
        language,
        {
          reason: data.reason || 'KYC verification rejected',
        }
      );

      this.logger.log(`KYC rejected notification sent: ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send KYC rejected notification: ${error.message}`);
    }
  }
}

