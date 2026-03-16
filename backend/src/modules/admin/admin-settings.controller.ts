/**
 * Admin Settings Controller
 * API endpoints for admin settings management
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { AdminSettingsService } from './admin-settings.service';
import { S3Service } from '../../common/s3/s3.service';
import { RechargeExchangeService } from '../recharge/rechargeexchange/rechargeexchange.service';
import { KwikApiService } from '../recharge/kwikapi/kwikapi.service';
import {
  UpdateAdminProfileDto,
  ChangePasswordDto,
  Verify2FADto,
  Disable2FADto,
  UpdateNotificationPreferenceDto,
  UpdateSystemSettingsDto,
  UpdateCommissionDto,
  AdminProfileResponse,
  ProfileUpdateResponse,
  AvatarUploadResponse,
  PasswordChangeResponse,
  Enable2FAResponse,
  Verify2FAResponse,
  SessionsListResponse,
  SessionRevokeResponse,
  NotificationPreferencesResponse,
  NotificationUpdateResponse,
  SystemSettingsResponse,
  SystemInfoResponse,
  CommissionSettingsResponse,
} from './dto/admin-settings.dto';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth()
export class AdminSettingsController {
  private readonly logger = new Logger(AdminSettingsController.name);

  constructor(
    private readonly settingsService: AdminSettingsService,
    private readonly s3Service: S3Service,
    private readonly reService: RechargeExchangeService,
    private readonly kwikService: KwikApiService,
  ) {}

  // ============================================
  // PROFILE ENDPOINTS
  // ============================================

  /**
   * Get admin profile
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get admin profile',
    description: 'Retrieve the current admin user profile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin profile data',
  })
  async getProfile(@Request() req): Promise<AdminProfileResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Getting profile for user ${userId}`);
    return this.settingsService.getProfile(userId);
  }

  /**
   * Update admin profile
   */
  @Put('profile')
  @ApiOperation({
    summary: 'Update admin profile',
    description: 'Update the current admin user profile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateAdminProfileDto,
  ): Promise<ProfileUpdateResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Updating profile for user ${userId}`);
    return this.settingsService.updateProfile(userId, dto);
  }

  /**
   * Upload avatar
   */
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Upload avatar',
    description: 'Upload a new profile avatar image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar uploaded successfully',
  })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AvatarUploadResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Uploading avatar for user ${userId}`);

    // Validate file
    if (!file) {
      throw new Error('No file uploaded');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 2MB.');
    }

    // Upload to S3
    const extension = file.originalname.split('.').pop();
    const result = await this.s3Service.uploadProfileImage(file.buffer, userId, extension);

    if (!result.success || !result.fileInfo) {
      throw new Error(result.error || 'Failed to upload avatar');
    }

    // Update user avatar URL
    return this.settingsService.updateAvatar(userId, result.fileInfo.url);
  }

  // ============================================
  // SECURITY ENDPOINTS
  // ============================================

  /**
   * Change password
   */
  @Put('security/password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the admin user password',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<PasswordChangeResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Changing password for user ${userId}`);
    return this.settingsService.changePassword(userId, dto);
  }

  /**
   * Enable 2FA
   */
  @Post('security/2fa/enable')
  @ApiOperation({
    summary: 'Enable two-factor authentication',
    description: 'Generate QR code and secret for 2FA setup',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'QR code and secret generated',
  })
  async enable2FA(@Request() req): Promise<Enable2FAResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Enabling 2FA for user ${userId}`);
    return this.settingsService.enable2FA(userId);
  }

  /**
   * Verify 2FA
   */
  @Post('security/2fa/verify')
  @ApiOperation({
    summary: 'Verify two-factor authentication',
    description: 'Verify the 2FA code and activate 2FA',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA enabled successfully',
  })
  async verify2FA(
    @Request() req,
    @Body() dto: Verify2FADto,
  ): Promise<Verify2FAResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Verifying 2FA for user ${userId}`);
    return this.settingsService.verify2FA(userId, dto);
  }

  /**
   * Disable 2FA
   */
  @Delete('security/2fa')
  @ApiOperation({
    summary: 'Disable two-factor authentication',
    description: 'Disable 2FA after password verification',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
  })
  async disable2FA(
    @Request() req,
    @Body() dto: Disable2FADto,
  ): Promise<Verify2FAResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Disabling 2FA for user ${userId}`);
    return this.settingsService.disable2FA(userId, dto);
  }

  /**
   * Get active sessions
   */
  @Get('security/sessions')
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Retrieve list of active sessions for the admin user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active sessions',
  })
  async getSessions(@Request() req): Promise<SessionsListResponse> {
    const userId = req.user.id || req.user.sub;
    const currentSessionId = req.user.sessionId;
    this.logger.log(`Getting sessions for user ${userId}`);
    return this.settingsService.getSessions(userId, currentSessionId);
  }

  /**
   * Revoke session
   */
  @Delete('security/sessions/:sessionId')
  @ApiOperation({
    summary: 'Revoke session',
    description: 'Revoke a specific session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID to revoke' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session revoked successfully',
  })
  async revokeSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionRevokeResponse> {
    const userId = req.user.id || req.user.sub;
    const currentSessionId = req.user.sessionId;
    this.logger.log(`Revoking session ${sessionId} for user ${userId}`);
    return this.settingsService.revokeSession(userId, sessionId, currentSessionId);
  }

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================

  /**
   * Get notification preferences
   */
  @Get('notifications')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Retrieve notification settings for the admin user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences',
  })
  async getNotificationPreferences(@Request() req): Promise<NotificationPreferencesResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Getting notification preferences for user ${userId}`);
    return this.settingsService.getNotificationPreferences(userId);
  }

  /**
   * Update notification preference
   */
  @Patch('notifications/:settingId')
  @ApiOperation({
    summary: 'Update notification preference',
    description: 'Update a specific notification channel setting',
  })
  @ApiParam({ name: 'settingId', description: 'Setting ID (e.g., transactions, security)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preference updated',
  })
  async updateNotificationPreference(
    @Request() req,
    @Param('settingId') settingId: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationUpdateResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Updating notification ${settingId} for user ${userId}`);
    return this.settingsService.updateNotificationPreference(userId, settingId, dto);
  }

  // ============================================
  // SYSTEM SETTINGS ENDPOINTS
  // ============================================

  /**
   * Get system settings
   */
  @Get('system')
  @ApiOperation({
    summary: 'Get system settings',
    description: 'Retrieve system settings (theme, timezone, language, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System settings',
  })
  async getSystemSettings(@Request() req): Promise<SystemSettingsResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Getting system settings for user ${userId}`);
    return this.settingsService.getSystemSettings(userId);
  }

  /**
   * Update system settings
   */
  @Put('system')
  @ApiOperation({
    summary: 'Update system settings',
    description: 'Update system settings (theme, timezone, language, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System settings updated',
  })
  async updateSystemSettings(
    @Request() req,
    @Body() dto: UpdateSystemSettingsDto,
  ): Promise<SystemSettingsResponse> {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Updating system settings for user ${userId}`);
    return this.settingsService.updateSystemSettings(userId, dto);
  }

  /**
   * Get system info
   */
  @Get('system/info')
  @ApiOperation({
    summary: 'Get system info',
    description: 'Retrieve system information (version, status, uptime)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System information',
  })
  async getSystemInfo(): Promise<SystemInfoResponse> {
    this.logger.log('Getting system info');
    return this.settingsService.getSystemInfo();
  }

  // ============================================
  // COMMISSION ENDPOINTS
  // ============================================

  /**
   * Get commission settings
   */
  @Get('commission')
  @ApiOperation({ summary: 'Get commission rates', description: 'Get commission rates for all recharge categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Commission rates' })
  async getCommissionSettings(): Promise<CommissionSettingsResponse> {
    return this.settingsService.getCommissionSettings();
  }

  /**
   * Get third-party API balances (KWIKAPI + RechargeExchange)
   */
  @Get('api-balances')
  @ApiOperation({ summary: 'Get third-party API balances', description: 'Fetch wallet balances from KWIKAPI and RechargeExchange' })
  @ApiResponse({ status: HttpStatus.OK, description: 'API balances' })
  async getApiBalances() {
    const [re, kwik] = await Promise.allSettled([
      this.reService.getBalance(),
      this.kwikService.getWalletBalance(),
    ]);

    return {
      rechargeExchange: re.status === 'fulfilled'
        ? { balance: re.value.balance, sellBalance: re.value.sellbalance, status: 'ok' }
        : { balance: null, sellBalance: null, status: 'error' },
      kwikApi: kwik.status === 'fulfilled'
        ? { balance: kwik.value.response?.balance, planCredit: kwik.value.response?.plan_credit, status: 'ok' }
        : { balance: null, planCredit: null, status: 'error' },
    };
  }

  /**
   * Update commission settings
   */
  @Put('commission')
  @ApiOperation({ summary: 'Update commission rates', description: 'Update commission rates for mobile and DTH recharge' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Commission rates updated' })
  async updateCommissionSettings(
    @Body() dto: UpdateCommissionDto,
  ): Promise<CommissionSettingsResponse> {
    this.logger.log(`Updating commission rates: mobile=${dto.mobileRate}%, dth=${dto.dthRate}%`);
    return this.settingsService.updateCommissionSettings(dto);
  }
}
