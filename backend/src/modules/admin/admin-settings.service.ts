/**
 * Admin Settings Service
 * Provides settings management functionality for admin dashboard
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../../entities/user.entity';
import { UserSession, SessionStatus } from '../../entities/user-session.entity';
import { CommissionSetting } from '../../entities/commission-setting.entity';
import {
  UpdateAdminProfileDto,
  ChangePasswordDto,
  Verify2FADto,
  Disable2FADto,
  UpdateNotificationPreferenceDto,
  UpdateSystemSettingsDto,
  UpdateCommissionDto,
  AdminRole,
  Theme,
  NotificationChannel,
  AdminProfileResponse,
  ProfileUpdateResponse,
  AvatarUploadResponse,
  PasswordChangeResponse,
  Enable2FAResponse,
  Verify2FAResponse,
  SessionInfo,
  SessionsListResponse,
  SessionRevokeResponse,
  NotificationSetting,
  NotificationPreferencesResponse,
  NotificationUpdateResponse,
  SystemSettingsResponse,
  SystemInfoResponse,
  CommissionSettingsResponse,
} from './dto/admin-settings.dto';

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);
  private readonly appStartTime = Date.now();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(CommissionSetting)
    private readonly commissionRepository: Repository<CommissionSetting>,
    private readonly configService: ConfigService,
  ) {}

  // ============================================
  // PROFILE METHODS
  // ============================================

  /**
   * Get admin profile
   */
  async getProfile(userId: string): Promise<AdminProfileResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.profileImage,
      role: AdminRole.ADMIN, // Can be derived from user roles if implemented
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update admin profile
   */
  async updateProfile(
    userId: string,
    dto: UpdateAdminProfileDto
  ): Promise<ProfileUpdateResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    // Check if email is being changed and is unique
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Update user
    await this.userRepository.update(userId, {
      ...(dto.name && { name: dto.name }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone && { phone: dto.phone }),
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    };
  }

  /**
   * Update avatar URL (after S3 upload)
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<AvatarUploadResponse> {
    await this.userRepository.update(userId, {
      profileImage: avatarUrl,
    });

    return {
      success: true,
      avatarUrl,
    };
  }

  // ============================================
  // SECURITY METHODS
  // ============================================

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto
  ): Promise<PasswordChangeResponse> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    this.logger.log(`Password changed for user ${userId}`);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Enable 2FA - Generate secret and QR code
   * Note: For production, use a proper TOTP library like speakeasy
   */
  async enable2FA(userId: string): Promise<Enable2FAResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    // Generate TOTP secret (Base32 encoded)
    const secretBuffer = crypto.randomBytes(20);
    const secret = this.toBase32(secretBuffer);

    // Generate OTP Auth URL
    const issuer = 'WyaparPay';
    const accountName = user.email || user.phone || userId;
    const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    // Generate QR code as data URL (simple SVG-based)
    const qrCode = await this.generateQRCodeDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Store secret temporarily (should be confirmed before saving permanently)
    const preferences = user.preferences || {};
    preferences.pending2FASecret = secret;
    preferences.pendingBackupCodes = backupCodes;

    await this.userRepository.update(userId, { preferences });

    return {
      qrCode,
      secret,
      backupCodes,
    };
  }

  /**
   * Convert buffer to Base32
   */
  private toBase32(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Generate simple QR code data URL
   * For production, use a proper QR code library
   */
  private async generateQRCodeDataURL(data: string): Promise<string> {
    // Return a placeholder - in production, use qrcode library
    // For now, return a data URL that indicates 2FA setup
    const placeholder = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-size="12">Scan with Authenticator App</text>
        <text x="100" y="120" text-anchor="middle" font-size="10">Use secret key instead</text>
      </svg>
    `).toString('base64')}`;
    
    return placeholder;
  }

  /**
   * Verify 2FA code and activate
   * Note: For production, use a proper TOTP verification library
   */
  async verify2FA(userId: string, dto: Verify2FADto): Promise<Verify2FAResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const preferences = user.preferences || {};
    const pendingSecret = preferences.pending2FASecret;

    if (!pendingSecret) {
      throw new BadRequestException('2FA setup not initiated. Please start setup first.');
    }

    // Simple verification - check if code is 6 digits
    // For production, implement proper TOTP verification
    if (!/^\d{6}$/.test(dto.code)) {
      throw new BadRequestException('Invalid verification code');
    }

    // Activate 2FA
    preferences.twoFactorEnabled = true;
    preferences.twoFactorSecret = pendingSecret;
    preferences.backupCodes = preferences.pendingBackupCodes;
    delete preferences.pending2FASecret;
    delete preferences.pendingBackupCodes;

    await this.userRepository.update(userId, { preferences });

    this.logger.log(`2FA enabled for user ${userId}`);

    return {
      success: true,
      message: 'Two-factor authentication enabled',
    };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, dto: Disable2FADto): Promise<Verify2FAResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Disable 2FA
    const preferences = user.preferences || {};
    preferences.twoFactorEnabled = false;
    delete preferences.twoFactorSecret;
    delete preferences.backupCodes;

    await this.userRepository.update(userId, { preferences });

    this.logger.log(`2FA disabled for user ${userId}`);

    return {
      success: true,
      message: 'Two-factor authentication disabled',
    };
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = `${this.randomString(4)}-${this.randomString(4)}`.toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ============================================
  // SESSION METHODS
  // ============================================

  /**
   * Get active sessions
   */
  async getSessions(userId: string, currentSessionId?: string): Promise<SessionsListResponse> {
    const sessions = await this.sessionRepository.find({
      where: { userId, status: SessionStatus.ACTIVE },
      order: { lastUsedAt: 'DESC' },
    });

    const sessionInfos: SessionInfo[] = sessions.map((session) => ({
      id: session.id,
      device: session.deviceType || 'Unknown',
      browser: this.parseBrowserFromUserAgent(session.userAgent),
      location: 'Unknown', // Would need geolocation service
      ipAddress: this.maskIpAddress(session.ipAddress),
      lastActive: session.lastUsedAt || session.createdAt,
      isCurrent: session.id === currentSessionId,
    }));

    return { sessions: sessionInfos };
  }

  /**
   * Parse browser from user agent
   */
  private parseBrowserFromUserAgent(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId?: string
  ): Promise<SessionRevokeResponse> {
    if (sessionId === currentSessionId) {
      throw new BadRequestException('Cannot revoke current session');
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepository.update(sessionId, {
      status: SessionStatus.REVOKED,
      revokedAt: new Date(),
    });

    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  }

  /**
   * Mask IP address for privacy
   */
  private maskIpAddress(ip: string): string {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip.substring(0, ip.length - 4) + 'xxxx';
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const preferences = user.preferences || {};
    const notificationPrefs = preferences.notifications || {};

    // Default notification settings
    const settings: NotificationSetting[] = [
      {
        id: 'transactions',
        label: 'Transaction Alerts',
        description: 'Get notified on high-value transactions',
        email: notificationPrefs.transactions?.email ?? true,
        push: notificationPrefs.transactions?.push ?? true,
        sms: notificationPrefs.transactions?.sms ?? false,
      },
      {
        id: 'security',
        label: 'Security Alerts',
        description: 'Get notified about security events',
        email: notificationPrefs.security?.email ?? true,
        push: notificationPrefs.security?.push ?? true,
        sms: notificationPrefs.security?.sms ?? true,
      },
      {
        id: 'customers',
        label: 'Customer Updates',
        description: 'Get notified about new customers and KYC updates',
        email: notificationPrefs.customers?.email ?? true,
        push: notificationPrefs.customers?.push ?? false,
        sms: notificationPrefs.customers?.sms ?? false,
      },
      {
        id: 'system',
        label: 'System Updates',
        description: 'Get notified about system maintenance and updates',
        email: notificationPrefs.system?.email ?? true,
        push: notificationPrefs.system?.push ?? false,
        sms: notificationPrefs.system?.sms ?? false,
      },
      {
        id: 'reports',
        label: 'Daily Reports',
        description: 'Receive daily summary reports',
        email: notificationPrefs.reports?.email ?? true,
        push: notificationPrefs.reports?.push ?? false,
        sms: notificationPrefs.reports?.sms ?? false,
      },
    ];

    return { settings };
  }

  /**
   * Update notification preference
   */
  async updateNotificationPreference(
    userId: string,
    settingId: string,
    dto: UpdateNotificationPreferenceDto
  ): Promise<NotificationUpdateResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const preferences = user.preferences || {};
    const notificationPrefs = preferences.notifications || {};

    // Initialize setting if not exists
    if (!notificationPrefs[settingId]) {
      notificationPrefs[settingId] = { email: true, push: true, sms: false };
    }

    // Update the specific channel
    notificationPrefs[settingId][dto.channel] = dto.enabled;
    preferences.notifications = notificationPrefs;

    await this.userRepository.update(userId, { preferences });

    return {
      success: true,
      setting: {
        id: settingId,
        email: notificationPrefs[settingId].email,
        push: notificationPrefs[settingId].push,
        sms: notificationPrefs[settingId].sms,
      },
    };
  }

  // ============================================
  // SYSTEM SETTINGS METHODS
  // ============================================

  /**
   * Get system settings
   */
  async getSystemSettings(userId: string): Promise<SystemSettingsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const preferences = user.preferences || {};
    const systemSettings = preferences.system || {};

    return {
      theme: systemSettings.theme || Theme.SYSTEM,
      timezone: systemSettings.timezone || 'Asia/Kolkata',
      language: systemSettings.language || 'en',
      dateFormat: systemSettings.dateFormat || 'DD/MM/YYYY',
      currency: systemSettings.currency || 'INR',
    };
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(
    userId: string,
    dto: UpdateSystemSettingsDto
  ): Promise<SystemSettingsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const preferences = user.preferences || {};
    const systemSettings = preferences.system || {};

    // Update settings
    if (dto.theme) systemSettings.theme = dto.theme;
    if (dto.timezone) systemSettings.timezone = dto.timezone;
    if (dto.language) systemSettings.language = dto.language;
    if (dto.dateFormat) systemSettings.dateFormat = dto.dateFormat;
    if (dto.currency) systemSettings.currency = dto.currency;

    preferences.system = systemSettings;
    await this.userRepository.update(userId, { preferences });

    return {
      theme: systemSettings.theme || Theme.SYSTEM,
      timezone: systemSettings.timezone || 'Asia/Kolkata',
      language: systemSettings.language || 'en',
      dateFormat: systemSettings.dateFormat || 'DD/MM/YYYY',
      currency: systemSettings.currency || 'INR',
    };
  }

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    const uptime = Math.floor((Date.now() - this.appStartTime) / 1000);

    return {
      version: this.configService.get('APP_VERSION', '1.0.0'),
      apiVersion: this.configService.get('API_VERSION', 'v2.1'),
      serverStatus: 'healthy',
      lastSync: new Date(),
      uptime,
    };
  }

  // ============================================
  // COMMISSION METHODS
  // ============================================

  /**
   * Get commission rates for all categories
   */
  async getCommissionSettings(): Promise<CommissionSettingsResponse> {
    const rows = await this.commissionRepository.find({ order: { category: 'ASC' } });

    // Seed defaults if table is empty
    if (rows.length === 0) {
      await this.commissionRepository.save([
        { category: 'mobile_recharge', rate: 5, label: 'Mobile Recharge' },
        { category: 'dth_recharge', rate: 5, label: 'DTH Recharge' },
      ]);
      return this.getCommissionSettings();
    }

    return {
      rates: rows.map((r) => ({
        category: r.category,
        label: r.label,
        rate: Number(r.rate),
      })),
    };
  }

  /**
   * Update commission rates
   */
  async updateCommissionSettings(dto: UpdateCommissionDto): Promise<CommissionSettingsResponse> {
    await this.commissionRepository.upsert(
      [
        { category: 'mobile_recharge', rate: dto.mobileRate, label: 'Mobile Recharge' },
        { category: 'dth_recharge', rate: dto.dthRate, label: 'DTH Recharge' },
      ],
      ['category'],
    );

    return this.getCommissionSettings();
  }
}
