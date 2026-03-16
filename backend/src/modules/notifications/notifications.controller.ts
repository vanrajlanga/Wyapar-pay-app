import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushNotificationService } from '../../common/push-notification/push-notification.service';
import { NotificationService } from '../../common/templates/notification-service';
import { NotificationType } from '../../common/templates/notification-templates';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly pushNotificationService: PushNotificationService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register device push token',
    description: 'Register or update the push notification token for the authenticated user\'s device',
  })
  @ApiResponse({
    status: 200,
    description: 'Device registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Device registered successfully' },
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid push token format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async registerDevice(
    @Request() req: any,
    @Body() dto: RegisterDeviceDto
  ): Promise<{ message: string; success: boolean }> {
    try {
      await this.pushNotificationService.registerDeviceToken(req.user.id, dto.pushToken);

      this.logger.log(`Device token registered for user ${req.user.id}`);
      return {
        message: 'Device registered successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to register device token for user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test notification',
    description: 'Send a test push notification to the authenticated user\'s device',
  })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test notification sent successfully' },
        notificationId: { type: 'string', example: 'uuid-string' },
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid notification data or user not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async sendTest(
    @Request() req: any,
    @Body() dto: SendNotificationDto
  ): Promise<{ message: string; notificationId: string; success: boolean }> {
    try {
      const notificationLog = await this.pushNotificationService.sendPushNotification({
        userId: req.user.id,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        type: dto.type,
        sound: dto.sound,
        badge: dto.badge,
      });

      if (!notificationLog) {
        return {
          message: 'Notification not sent - user preferences disabled notifications',
          notificationId: null,
          success: false,
        };
      }

      this.logger.log(`Test notification sent to user ${req.user.id}: ${notificationLog.id}`);
      return {
        message: 'Test notification sent successfully',
        notificationId: notificationLog.id,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to send test notification to user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification statistics',
    description: 'Get notification delivery statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 25 },
        sent: { type: 'number', example: 23 },
        delivered: { type: 'number', example: 20 },
        failed: { type: 'number', example: 3 },
        deliveryRate: { type: 'string', example: '86.96%' },
        provider: { type: 'string', example: 'expo' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getStats(@Request() req: any) {
    try {
      const stats = await this.pushNotificationService.getUserNotificationStats(req.user.id);

      this.logger.debug(`Notification stats retrieved for user ${req.user.id}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get notification stats for user ${req.user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get push notification service health',
    description: 'Get the health status of the push notification service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        provider: { type: 'string', example: 'expo' },
        config: {
          type: 'object',
          properties: {
            maxRetries: { type: 'number', example: 3 },
            retryDelay: { type: 'number', example: 1000 },
            batchSize: { type: 'number', example: 100 },
          },
        },
      },
    },
  })
  async getHealth() {
    try {
      const health = await this.pushNotificationService.getHealthStatus();
      return health;
    } catch (error) {
      this.logger.error(`Failed to get service health: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send notification using template',
    description: 'Send a notification using predefined templates for consistent messaging',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully using template',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        type: { type: 'string', example: 'transaction_success' },
        notificationId: { type: 'string', example: 'uuid-string' },
      },
    },
  })
  async sendTemplateNotification(
    @Request() req: any,
    @Body() body: {
      type: NotificationType;
      language?: string;
      context?: Record<string, any>;
    }
  ) {
    try {
      const { type, language = 'en', context = {} } = body;

      const result = await this.notificationService.sendPushNotification(
        req.user.id,
        type,
        language,
        context
      );

      this.logger.log(`Template notification sent: ${type} to user ${req.user.id}`);
      return {
        success: true,
        type,
        notificationId: result?.id || null,
      };
    } catch (error) {
      this.logger.error(`Failed to send template notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('send-sms-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send SMS using template',
    description: 'Send an SMS using predefined templates (currently logged only)',
  })
  @ApiResponse({
    status: 200,
    description: 'SMS logged successfully (service implementation pending)',
  })
  async sendSmsTemplate(
    @Request() req: any,
    @Body() body: {
      type: NotificationType;
      language?: string;
      context?: Record<string, any>;
    }
  ) {
    try {
      const { type, language = 'en', context = {} } = body;

      // For now, just return what would be sent
      const preview = this.notificationService.getTemplatePreview(type, language, context);

      const result = await this.notificationService.sendSmsNotification(
        req.user.phone, // Assuming user has phone field
        type,
        language,
        context
      );

      this.logger.log(`SMS template logged: ${type} for user ${req.user.id}`);
      return {
        success: true,
        type,
        preview: preview.sms,
        result,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS template: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('send-dual-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send both SMS and Push using template',
    description: 'Send notification via both SMS and Push channels using templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Dual notification sent successfully',
  })
  async sendDualTemplate(
    @Request() req: any,
    @Body() body: {
      type: NotificationType;
      language?: string;
      context?: Record<string, any>;
    }
  ) {
    try {
      const { type, language = 'en', context = {} } = body;

      const result = await this.notificationService.sendDualNotification(
        req.user.id,
        req.user.phone, // Assuming user has phone field
        type,
        language,
        context
      );

      this.logger.log(`Dual template notification sent: ${type} to user ${req.user.id}`);
      return {
        success: true,
        type,
        results: result,
      };
    } catch (error) {
      this.logger.error(`Failed to send dual template notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('templates/:type/preview')
  @ApiOperation({
    summary: 'Get notification template preview',
    description: 'Preview how a notification template will look in different languages',
  })
  @ApiResponse({
    status: 200,
    description: 'Template preview retrieved successfully',
  })
  async getTemplatePreview(
    @Param('type') type: NotificationType,
    @Query('language') language: string = 'en',
    @Query() context: Record<string, any> = {}
  ) {
    try {
      const preview = this.notificationService.getTemplatePreview(type, language, context);
      return preview;
    } catch (error) {
      this.logger.error(`Failed to get template preview: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('templates')
  @ApiOperation({
    summary: 'List all available notification templates',
    description: 'Get a list of all available notification template types and categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates list retrieved successfully',
  })
  async getAvailableTemplates() {
    try {
      const templates = Object.values(NotificationType);
      return {
        templates,
        categories: ['transaction', 'account', 'security', 'kyc', 'promotional', 'system'],
        languages: ['en', 'hi', 'kn'],
        total: templates.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get templates list: ${error.message}`, error.stack);
      throw error;
    }
  }
}

