import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationType } from '../../../common/templates/notification-templates';

/**
 * DTO for sending push notifications
 */
export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Payment Successful!',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Your payment of ₹100 has been processed successfully.',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.TRANSACTION_SUCCESS,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'Additional data to send with notification',
    example: {
      screen: 'transaction-details',
      transactionId: 'txn_123456',
      amount: 100,
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Notification sound',
    example: 'default',
  })
  @IsOptional()
  @IsString()
  sound?: string;

  @ApiPropertyOptional({
    description: 'Badge count for iOS',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  badge?: number;
}

