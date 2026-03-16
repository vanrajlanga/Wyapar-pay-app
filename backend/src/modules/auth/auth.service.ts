import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { User, UserStatus } from '../../entities/user.entity';
import { UserSession, SessionStatus } from '../../entities/user-session.entity';
import { KycStatus } from '../../entities/kyc-verification.entity';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ValidationService } from '../../common/validation/validation.service';
import { RedisService } from '../../common/redis/redis.service';
import { VerificationService } from '../../common/verification/verification.service';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { OtpLoginDto } from './dto/otp-login.dto';

// Import WalletService for automatic wallet creation
import { WalletService } from '../wallet/wallet.service';
import { WalletType } from '../../entities/wallet.entity';
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private validationService: ValidationService,
    private redisService: RedisService,
    private verificationService: VerificationService,
    private otpService: OtpService,
    private sessionService: SessionService,
    private walletService: WalletService,
    private notificationEmitter: NotificationEmitterService
  ) {}

  // Validate user for local strategy
  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.encryptionService.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  // User Registration
  async register(
    registerDto: RegisterDto
  ): Promise<{ message: string; userId: string }> {
    console.log('🚀 REGISTRATION METHOD CALLED - NEW VERSION');
    const { name, email, phone, password, dateOfBirth } = registerDto;

    // Validate inputs
    if (!this.validationService.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }
    if (!this.validationService.isValidPhoneNumber(phone)) {
      throw new BadRequestException('Invalid phone number format');
    }
    if (!this.validationService.isStrongPassword(password)) {
      throw new BadRequestException(
        'Password does not meet security requirements'
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email or phone'
      );
    }

    // Hash password
    const hashedPassword = await this.encryptionService.hashPassword(password);

    // Create user with default preferences
    const user = this.userRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      dateOfBirth,
      status: UserStatus.PENDING_KYC,
      preferences: {
        notifications: {
          push: true,
          email: true,
          sms: false,
          transactionAlerts: true,
          promotionalEmails: false,
        },
        privacy: {
          showBalance: true,
          profileVisibility: 'private',
          showPhoneNumber: false,
          allowDataSharing: false,
        },
        security: {
          biometricLogin: false,
          twoFactorAuth: false,
          sessionTimeout: 30, // minutes
        },
        display: {
          language: 'en',
          currency: 'INR',
          theme: 'light',
          dateFormat: 'DD/MM/YYYY',
        },
        transactions: {
          defaultPaymentMethod: 'wallet',
          requireConfirmation: true,
          saveBeneficiaries: true,
        },
      },
    });

    const savedUser = await this.userRepository.save(user);

    // Create primary wallet for the user
    try {
      await this.walletService.createWallet(savedUser.id, {
        type: WalletType.PRIMARY,
      });
    } catch (error) {
      // Log wallet creation error but don't fail registration
      console.error('Failed to create wallet for user:', savedUser.id, error);
    }

    // Send email verification
    try {
      await this.verificationService.sendEmailVerification(savedUser.id);
    } catch (error) {
      // Log email error but don't fail registration
      console.error(
        'Failed to send verification email for user:',
        savedUser.id,
        error
      );
    }

    // Emit user registered event (loosely coupled)
    await this.notificationEmitter.emitUserRegistered(savedUser.id, {
      userName: savedUser.name,
    });

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      userId: savedUser.id,
    };
  }

  // User Login
  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    const { identifier, password } = loginDto;

    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    // Verify password
    const isPasswordValid = await this.encryptionService.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    // Reset login attempts on successful login
    await this.resetLoginAttempts(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      tokens.accessToken,
      tokens.refreshToken,
      ipAddress,
      userAgent
    );

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Emit login event (loosely coupled)
    const isNewDevice = !user.lastLoginAt || 
      (new Date().getTime() - user.lastLoginAt.getTime()) > 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (isNewDevice) {
      await this.notificationEmitter.emitNewDeviceLogin(user.id, {
        ipAddress,
        userAgent,
      });
    } else {
      await this.notificationEmitter.emitUserLogin(user.id);
    }

    return {
      user: this.sanitizeUser(user),
      tokens,
      sessionId: session.id,
    };
  }

  // Verify OTP
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { identifier, otp, type } = verifyOtpDto;

    const isValidOtp = await this.otpService.verifyOtp(identifier, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (type === 'phone_verification') {
      const user = await this.userRepository.findOne({
        where: { phone: identifier },
      });
      if (user) {
        user.isPhoneVerified = true;
        await this.userRepository.save(user);
        
        // Emit account verified event (loosely coupled)
        await this.notificationEmitter.emitAccountVerified(user.id);
      }
    } else if (type === 'email_verification') {
      const user = await this.userRepository.findOne({
        where: { email: identifier },
      });
      if (user) {
        user.isEmailVerified = true;
        await this.userRepository.save(user);
        
        // Emit account verified event (loosely coupled)
        await this.notificationEmitter.emitAccountVerified(user.id);
      }
    }

    return { message: 'OTP verified successfully' };
  }

  /**
   * Request OTP for login (supports auto-registration)
   */
  async requestOtp(requestOtpDto: RequestOtpDto): Promise<{ message: string }> {
    const { identifier } = requestOtpDto;

    // Validate identifier format first
    const isEmail = this.validationService.isValidEmail(identifier);
    const isPhone = this.validationService.isValidPhoneNumber(identifier);

    if (!isEmail && !isPhone) {
      throw new BadRequestException('Invalid email or phone number format');
    }

    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    // Check if existing user account is suspended
    if (user && user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    // Send OTP via appropriate channel (works for both existing and new users)
    if (isEmail) {
      await this.otpService.sendEmailOtp(identifier);
    } else if (isPhone) {
      await this.otpService.sendPhoneOtp(identifier);
    }

    // Note: OTP is sent directly by OtpService, no need for notification event
    // Removed emitOtpSent() to prevent duplicate SMS with unresolved template

    return { message: 'OTP has been sent to your phone/email' };
  }

  /**
   * Login with OTP (supports auto-registration)
   */
  async otpLogin(
    otpLoginDto: OtpLoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    const { identifier, otp } = otpLoginDto;

    // Verify OTP first
    const isValidOtp = await this.otpService.verifyOtp(identifier, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Find user by email or phone
    let user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    let isNewUser = false;

    // Auto-register if user doesn't exist
    if (!user) {
      const isEmail = this.validationService.isValidEmail(identifier);
      const isPhone = this.validationService.isValidPhoneNumber(identifier);

      // Create minimal user account
      const newUserName = isPhone ? `User ${identifier}` : identifier.split('@')[0];
      user = this.userRepository.create({
        name: newUserName,
        email: isEmail ? identifier : null,
        phone: isPhone ? identifier : null,
        password: null, // No password for OTP-only users
        status: UserStatus.ACTIVE,
        kycStatus: KycStatus.NOT_STARTED,
        isEmailVerified: isEmail, // Auto-verify email if OTP login via email
        isPhoneVerified: isPhone, // Auto-verify phone if OTP login via phone
      });

      user = await this.userRepository.save(user);
      isNewUser = true;

      // Create default wallet for new user
      await this.walletService.createWallet(user.id, { type: WalletType.PRIMARY });

      // Emit new user registered event
      await this.notificationEmitter.emitUserRegistered(user.id, {
        name: newUserName,
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    // Reset login attempts on successful login
    if (!isNewUser) {
      await this.resetLoginAttempts(user);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      tokens.accessToken,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Emit login event
    if (isNewUser) {
      await this.notificationEmitter.emitUserLogin(user.id);
    } else {
      const isNewDevice =
        !user.lastLoginAt ||
        new Date().getTime() - user.lastLoginAt.getTime() >
          7 * 24 * 60 * 60 * 1000;

      if (isNewDevice) {
        await this.notificationEmitter.emitNewDeviceLogin(user.id, {
          ipAddress,
          userAgent,
        });
      } else {
        await this.notificationEmitter.emitUserLogin(user.id);
      }
    }

    return {
      user: this.sanitizeUser(user),
      tokens,
      sessionId: session.id,
      isNewUser, // Frontend can use this to redirect to profile completion
    };
  }

  // Refresh Token
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<any> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const session = await this.sessionRepository.findOne({
        where: { refreshToken, status: SessionStatus.ACTIVE },
        relations: ['user'],
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.user);

      // Update session
      session.token = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;
      session.lastUsedAt = new Date();
      await this.sessionRepository.save(session);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Change Password
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await this.encryptionService.comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (!this.validationService.isStrongPassword(newPassword)) {
      throw new BadRequestException(
        'New password does not meet security requirements'
      );
    }

    user.password = await this.encryptionService.hashPassword(newPassword);
    await this.userRepository.save(user);

    // Revoke all sessions
    await this.sessionService.revokeAllUserSessions(userId);

    // Emit password changed event (loosely coupled)
    await this.notificationEmitter.emitPasswordChanged(userId);

    return { message: 'Password changed successfully' };
  }

  // Forgot Password
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ message: string }> {
    const { identifier } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the account exists, a reset link has been sent' };
    }

    // Send OTP for password reset
    if (this.validationService.isValidEmail(identifier)) {
      await this.otpService.sendEmailOtp(user.email);
    } else if (this.validationService.isValidPhoneNumber(identifier)) {
      await this.otpService.sendPhoneOtp(user.phone);
    }

    // Note: OTP is sent directly by OtpService, no need for notification event
    // Removed emitOtpSent() to prevent duplicate SMS with unresolved template

    return { message: 'If the account exists, a reset link has been sent' };
  }

  // Reset Password
  async resetPassword(
    resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    const { identifier, otp, newPassword } = resetPasswordDto;

    const isValidOtp = await this.otpService.verifyOtp(identifier, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!this.validationService.isStrongPassword(newPassword)) {
      throw new BadRequestException(
        'Password does not meet security requirements'
      );
    }

    user.password = await this.encryptionService.hashPassword(newPassword);
    await this.userRepository.save(user);

    // Revoke all sessions
    await this.sessionService.revokeAllUserSessions(user.id);

    return { message: 'Password reset successfully' };
  }

  // Logout
  async logout(refreshToken: string): Promise<{ message: string }> {
    // Find session by refresh token
    const session = await this.sessionRepository.findOne({
      where: { refreshToken },
    });

    if (session) {
      await this.sessionService.revokeSession(session.id);
    }

    // Always return success (logout should work even if session not found)
    return { message: 'Logged out successfully' };
  }

  // Verify Email - TEMPORARILY COMMENTED OUT
  /*
  async verifyEmail(userId: string, code: string): Promise<{ message: string }> {
    const success = await this.verificationService.verifyEmail(userId, code);
    
    if (!success) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return {
      message: 'Email verified successfully. Welcome to WyaparPay!',
    };
  }

  // Resend Email Verification - TEMPORARILY COMMENTED OUT
  async resendEmailVerification(userId: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const success = await this.verificationService.sendEmailVerification(userId, ipAddress, userAgent);
    
    if (!success) {
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  // Forgot Password - UPDATED VERSION TEMPORARILY COMMENTED OUT
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    const { identifier } = forgotPasswordDto;

    // Send password reset email (service handles non-existent users gracefully)
    await this.verificationService.sendPasswordResetVerification(identifier, ipAddress, userAgent);

    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  }

  // Reset Password - UPDATED VERSION TEMPORARILY COMMENTED OUT
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { identifier, otp, newPassword } = resetPasswordDto;

    // For now, we'll use the old OTP-based reset until we fully implement the new system
    // Find user
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier },
        { phone: identifier },
      ],
    });

    if (!user) {
      throw new BadRequestException('Invalid OTP or user not found');
    }

    // Verify OTP
    const isValidOtp = await this.otpService.verifyOtp(identifier, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP or user not found');
    }

    // Validate new password
    if (!this.validationService.isStrongPassword(newPassword)) {
      throw new BadRequestException('Password does not meet security requirements');
    }

    // Hash and update password
    const hashedPassword = await this.encryptionService.hashPassword(newPassword);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Revoke all sessions for security
    await this.sessionService.revokeAllUserSessions(user.id);

    return { message: 'Password reset successfully' };
  }
  */

  // Private methods
  private async generateTokens(
    user: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts += 1;

    const maxAttempts = this.configService.get('MAX_LOGIN_ATTEMPTS', 5);
    const lockoutDuration = this.configService.get(
      'LOCKOUT_DURATION_MINUTES',
      15
    );

    if (user.loginAttempts >= maxAttempts) {
      user.lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
    }

    await this.userRepository.save(user);
  }

  private async resetLoginAttempts(user: User): Promise<void> {
    user.loginAttempts = 0;
    user.lockedUntil = null;
    await this.userRepository.save(user);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Verify email address
   */
  async verifyEmail(
    userId: string,
    code: string
  ): Promise<{ message: string }> {
    const isValid = await this.verificationService.verifyEmail(userId, code);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ message: string }> {
    const success = await this.verificationService.sendEmailVerification(
      userId,
      ipAddress,
      userAgent
    );

    if (!success) {
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification email sent successfully',
    };
  }
}
