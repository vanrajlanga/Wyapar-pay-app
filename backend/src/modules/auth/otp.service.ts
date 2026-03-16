import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ValidationService } from '../../common/validation/validation.service';
import { SmsService } from '../../common/sms/sms.service';
import { EmailService } from '../../common/email/email.service';

@Injectable()
export class OtpService {
  private readonly otpExpiryMinutes: number;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private encryptionService: EncryptionService,
    private validationService: ValidationService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {
    this.otpExpiryMinutes = this.configService.get('OTP_EXPIRY_MINUTES', 5);
  }

  // Generate and send OTP to phone
  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    if (!this.validationService.isValidPhoneNumber(phone)) {
      throw new BadRequestException('Invalid phone number');
    }

    const otp = this.encryptionService.generateOtp(6);
    const ttlSeconds = this.otpExpiryMinutes * 60;

    // Store OTP in Redis
    await this.redisService.setOtp(phone, otp, ttlSeconds);

    // Send OTP via SMS service (Digimiles) - using registered DLT template format
    const message = `Dear User, Your OTP for WyapaarPay login is ${otp}. Use this code to access your account. Do not share it with anyone.`;
    const smsSent = await this.smsService.sendSms(phone, message);

    if (!smsSent) {
      // Log to console if SMS fails (for development/debugging)
      console.log(`SMS OTP for ${phone}: ${otp}`);
    }

    return { message: 'OTP sent to your phone number' };
  }

  // Generate and send OTP to email
  async sendEmailOtp(email: string): Promise<{ message: string }> {
    if (!this.validationService.isValidEmail(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const otp = this.encryptionService.generateOtp(6);
    const ttlSeconds = this.otpExpiryMinutes * 60;

    // Store OTP in Redis
    await this.redisService.setOtp(email, otp, ttlSeconds);

    // Send OTP via email service (ZeptoMail)
    const emailSent = await this.emailService.sendOtpEmail(email, otp);

    if (!emailSent) {
      // Log to console if email fails (for development/debugging)
      console.log(`Email OTP for ${email}: ${otp}`);
    }

    return { message: 'OTP sent to your email address' };
  }

  // Verify OTP
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    if (!this.validationService.isValidOtp(otp)) {
      return false;
    }

    const storedOtp = await this.redisService.getOtp(identifier);
    if (!storedOtp) {
      return false;
    }

    const isValid = storedOtp === otp;
    if (isValid) {
      // Delete OTP after successful verification
      await this.redisService.deleteOtp(identifier);
    }

    return isValid;
  }

  // Resend OTP
  async resendOtp(identifier: string): Promise<{ message: string }> {
    // Check rate limiting
    const rateLimitKey = `otp_resend:${identifier}`;
    const attempts = await this.redisService.getRateLimit(rateLimitKey);

    if (attempts >= 3) {
      throw new BadRequestException(
        'Too many OTP requests. Please try again later.'
      );
    }

    await this.redisService.incrementRateLimit(rateLimitKey, 300); // 5 minutes

    if (this.validationService.isValidEmail(identifier)) {
      return this.sendEmailOtp(identifier);
    } else if (this.validationService.isValidPhoneNumber(identifier)) {
      return this.sendPhoneOtp(identifier);
    } else {
      throw new BadRequestException('Invalid identifier');
    }
  }

  // Generate OTP for specific purpose
  async generateOtpForPurpose(
    identifier: string,
    purpose: string
  ): Promise<string> {
    const otp = this.encryptionService.generateOtp(6);
    const key = `${purpose}:${identifier}`;
    const ttlSeconds = this.otpExpiryMinutes * 60;

    await this.redisService.setOtp(key, otp, ttlSeconds);
    return otp;
  }

  // Verify OTP for specific purpose
  async verifyOtpForPurpose(
    identifier: string,
    purpose: string,
    otp: string
  ): Promise<boolean> {
    const key = `${purpose}:${identifier}`;
    return this.verifyOtp(key, otp);
  }
}
