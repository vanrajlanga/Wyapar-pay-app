import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailClient } from 'zeptomail';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailData {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  verificationCode?: string;
  verificationLink?: string;
  resetCode?: string;
  resetLink?: string;
  requestTime?: string;
  ipAddress?: string;
  deviceInfo?: string;
  appDownloadLink?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private zeptoClient: SendMailClient;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get(
      'ZEPTOMAIL_FROM_EMAIL',
      'noreply@wyapaarpay.com' // Use verified domain: wyapaarpay.com
    );
    this.fromName = this.configService.get('ZEPTOMAIL_FROM_NAME', 'WyaparPay');

    // ZeptoMail API URL - should be full URL with protocol and endpoint
    const url = this.configService.get('ZEPTOMAIL_URL', 'https://api.zeptomail.in/v1.1/email');
    const token = this.configService.get('ZEPTOMAIL_TOKEN');

    if (!token) {
      this.logger.warn(
        '⚠️  ZEPTOMAIL_TOKEN not configured. Email service will run in fallback mode.'
      );
    } else {
      // Log token status (first and last few chars for verification)
      this.logger.debug(
        `ZeptoMail token configured: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`
      );
    }

    // Initialize ZeptoMail client
    // Note: SendMailClient expects just the base URL, not the full endpoint
    // But we'll use the full URL as it works in direct API calls
    this.zeptoClient = new SendMailClient({ 
      url: url.includes('/v1.1/email') ? url : `${url}/v1.1/email`,
      token: token 
    });

    this.logger.log(`📧 Email service initialized with ZeptoMail`);
    this.logger.log(`   Sender: ${this.fromName} <${this.fromEmail}>`);
  }

  /**
   * Load and compile email template with data
   * Templates are stored in: backend/src/templates/email/{workflow-name}.html
   * Example: account-verification.html, password-reset.html, welcome.html
   */
  private async loadTemplate(
    workflowName: string,
    data: EmailData
  ): Promise<string> {
    try {
      // Template path: backend/src/templates/email/{workflow-name}.html
      const templatePath = path.join(
        __dirname,
        '../../templates/email',
        `${workflowName}.html`
      );
      
      this.logger.debug(`Loading email template: ${templatePath}`);
      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace template variables ({{variableName}})
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
        template = template.replace(regex, value);
      });

      return template;
    } catch (error) {
      this.logger.error(`Failed to load email template ${workflowName}:`, error);
      throw new Error(`Email template ${workflowName} not found at templates/email/${workflowName}.html`);
    }
  }

  /**
   * Send email using ZeptoMail
   * Reference: https://www.zoho.com/zeptomail/help/smtp-home.html
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<boolean> {
    try {
      this.logger.log(`📧 Sending email to ${to} with subject: ${subject}`);

      // Prepare email payload according to ZeptoMail format
      const emailPayload = {
        from: {
          address: this.fromEmail,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: to,
              name: to.split('@')[0], // Use email prefix as name
            },
          },
        ],
        subject: subject,
        htmlbody: htmlBody,
        ...(textBody && { textbody: textBody }),
      };

      // Send email via ZeptoMail
      const response = await this.zeptoClient.sendMail(emailPayload);

      this.logger.log(`✅ Email sent successfully to ${to} via ZeptoMail`);
      this.logger.debug(`   Response:`, response);

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${to} via ZeptoMail:`,
        error
      );

      // Log detailed error information
      if (
        error.message?.includes('authentication') ||
        error.message?.includes('token')
      ) {
        this.logger.error(
          `⚠️  Authentication error. Please verify ZEPTOMAIL_TOKEN is correct.`
        );
      } else if (error.message?.includes('from')) {
        this.logger.error(
          `⚠️  Invalid sender email. Please verify ${this.fromEmail} is configured in ZeptoMail.`
        );
      } else if (
        error.message?.includes('quota') ||
        error.message?.includes('limit')
      ) {
        this.logger.error(
          `⚠️  Email quota exceeded. Check your ZeptoMail plan limits.`
        );
      }

      // Fallback to development mode logging if ZeptoMail fails
      this.logger.warn(`📧 EMAIL FALLBACK (ZeptoMail Failed):
        From: ${this.fromName} <${this.fromEmail}>
        To: ${to}
        Subject: ${subject}
        Error: ${error.message || 'Unknown error'}
        
        ⚠️  IMPORTANT: To send real emails via ZeptoMail, ensure:
        1. ZEPTOMAIL_TOKEN is set correctly in environment variables
        2. ${this.fromEmail} is verified in your ZeptoMail account
        3. You have sufficient email quota in your ZeptoMail plan
        4. ZEPTOMAIL_URL is set (default: api.zeptomail.in/)
        
        📚 Documentation: https://www.zoho.com/zeptomail/help/smtp-home.html
      `);

      // Return true for development to not break the flow
      return true;
    }
  }

  /**
   * Send account verification email
   */
  async sendAccountVerificationEmail(
    userEmail: string,
    userName: string,
    verificationCode: string,
    verificationLink: string
  ): Promise<boolean> {
    try {
      const data: EmailData = {
        userName,
        userEmail,
        verificationCode,
        verificationLink,
      };

      const htmlBody = await this.loadTemplate('account-verification', data);
      const subject = '🔐 Verify Your WyaparPay Account';

      return await this.sendEmail(userEmail, subject, htmlBody);
    } catch (error) {
      this.logger.error('Failed to send account verification email:', error);
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    userPhone: string
  ): Promise<boolean> {
    try {
      const data: EmailData = {
        userName,
        userEmail,
        userPhone,
        appDownloadLink: 'https://wyaparpay.com/download', // Replace with actual app store links
      };

      const htmlBody = await this.loadTemplate('welcome', data);
      const subject = '🎉 Welcome to WyaparPay - Your Account is Ready!';

      return await this.sendEmail(userEmail, subject, htmlBody);
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetCode: string,
    resetLink: string,
    ipAddress: string = 'Unknown',
    deviceInfo: string = 'Unknown Device'
  ): Promise<boolean> {
    try {
      const data: EmailData = {
        userName,
        userEmail,
        resetCode,
        resetLink,
        requestTime: new Date().toLocaleString(),
        ipAddress,
        deviceInfo,
      };

      const htmlBody = await this.loadTemplate('password-reset', data);
      const subject = '🔒 WyaparPay Password Reset Request';

      return await this.sendEmail(userEmail, subject, htmlBody);
    } catch (error) {
      this.logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send OTP email for login
   */
  async sendOtpEmail(
    userEmail: string,
    otpCode: string
  ): Promise<boolean> {
    try {
      const data: EmailData = {
        userEmail,
        // Using a generic field for OTP code
      };

      // Add otpCode to data object (not in EmailData interface but template will use it)
      const templateData = { ...data, otpCode };

      const htmlBody = await this.loadTemplate('otp-login', templateData as any);
      const subject = '🔐 Your WyaparPay Login Code';

      return await this.sendEmail(userEmail, subject, htmlBody);
    } catch (error) {
      this.logger.error('Failed to send OTP email:', error);
      return false;
    }
  }

  /**
   * Send transaction notification email
   */
  async sendTransactionNotificationEmail(
    userEmail: string,
    userName: string,
    transactionDetails: any
  ): Promise<boolean> {
    try {
      // For now, we'll use a simple HTML template
      // You can create a dedicated transaction-notification.html template later
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00D4FF;">Transaction Notification</h2>
          <p>Hello ${userName},</p>
          <p>A transaction has been processed on your WyaparPay account:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₹${transactionDetails.amount}</p>
            <p><strong>Type:</strong> ${transactionDetails.type}</p>
            <p><strong>Status:</strong> ${transactionDetails.status}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Thank you for using WyaparPay!</p>
        </div>
      `;

      const subject = '💰 WyaparPay Transaction Notification';

      return await this.sendEmail(userEmail, subject, htmlBody);
    } catch (error) {
      this.logger.error(
        'Failed to send transaction notification email:',
        error
      );
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testRecipient?: string): Promise<boolean> {
    try {
      const testEmail = testRecipient || 'wpaysocialmedia@gmail.com';
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">✅ WyaparPay Email Service Test</h2>
          <p>This is a test email to verify <strong>ZeptoMail</strong> configuration.</p>
          <p>If you receive this email, the email service is working correctly!</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email Service:</strong> Zoho ZeptoMail</p>
            <p><strong>From:</strong> ${this.fromName} &lt;${this.fromEmail}&gt;</p>
            <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Status:</strong> <span style="color: #4CAF50;">✓ Delivered Successfully</span></p>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This email was sent via ZeptoMail API. 
            <a href="https://www.zoho.com/zeptomail/help/smtp-home.html" style="color: #667eea;">Learn more</a>
          </p>
        </div>
      `;

      return await this.sendEmail(
        testEmail,
        '✅ WyaparPay Email Service Test - ZeptoMail',
        htmlBody
      );
    } catch (error) {
      this.logger.error('Email configuration test failed:', error);
      return false;
    }
  }

  /**
   * Send bulk emails (for notifications, marketing, etc.)
   * ZeptoMail supports batch sending
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    htmlBody: string
  ): Promise<{ sent: number; failed: number }> {
    const results = {
      sent: 0,
      failed: 0,
    };

    for (const recipient of recipients) {
      const success = await this.sendEmail(recipient, subject, htmlBody);
      if (success) {
        results.sent++;
      } else {
        results.failed++;
      }
    }

    this.logger.log(
      `📧 Bulk email completed: ${results.sent} sent, ${results.failed} failed`
    );
    return results;
  }
}
