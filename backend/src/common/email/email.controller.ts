import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test email configuration',
    description: 'Send a test email to verify ZeptoMail integration',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          example: 'wpaysocialmedia@gmail.com',
          description: 'Recipient email address (optional, defaults to wpaysocialmedia@gmail.com)',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Test email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Test email sent successfully' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to send test email',
  })
  async testEmail(@Body() body?: { to?: string }) {
    const recipient = body?.to || 'wpaysocialmedia@gmail.com';
    const success = await this.emailService.testEmailConfiguration(recipient);

    return {
      success,
      message: success
        ? `Test email sent successfully to ${recipient}`
        : `Failed to send test email to ${recipient}. Check logs for details.`,
    };
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get email service status',
    description: 'Check if email service is configured and ready',
  })
  @ApiResponse({
    status: 200,
    description: 'Email service status',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean', example: true },
        fromEmail: { type: 'string', example: 'noreply@wyaparpay.com' },
        fromName: { type: 'string', example: 'WyaparPay' },
      },
    },
  })
  async getStatus() {
    // Check if token is configured
    const token = process.env.ZEPTOMAIL_TOKEN;
    const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@wyaparpay.com';
    const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'WyaparPay';

    return {
      configured: !!token,
      fromEmail,
      fromName,
      hasToken: !!token,
    };
  }
}

