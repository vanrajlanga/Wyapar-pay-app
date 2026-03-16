/**
 * Admin Settings DTOs
 * Data transfer objects for admin settings API
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

// ============================================
// ENUMS
// ============================================

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

// ============================================
// PROFILE DTOs
// ============================================

/**
 * DTO for updating admin profile
 */
export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ description: 'Admin name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Admin email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Admin phone' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

// ============================================
// SECURITY DTOs
// ============================================

/**
 * DTO for changing password
 */
export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase, lowercase, number, and special character' }
  )
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

/**
 * DTO for verifying 2FA code
 */
export class Verify2FADto {
  @ApiProperty({ description: 'TOTP code from authenticator app' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}

/**
 * DTO for disabling 2FA
 */
export class Disable2FADto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

// ============================================
// NOTIFICATION DTOs
// ============================================

/**
 * DTO for updating notification preference
 */
export class UpdateNotificationPreferenceDto {
  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  @IsNotEmpty()
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Enable or disable' })
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;
}

// ============================================
// SYSTEM SETTINGS DTOs
// ============================================

/**
 * DTO for updating system settings
 */
export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ description: 'Theme preference', enum: Theme })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Language code' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, { message: 'Invalid language code format' })
  language?: string;

  @ApiPropertyOptional({ description: 'Date format' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be 3 uppercase letters' })
  currency?: string;
}

// ============================================
// RESPONSE INTERFACES
// ============================================

/**
 * Admin profile response
 */
export interface AdminProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile update response
 */
export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

/**
 * Avatar upload response
 */
export interface AvatarUploadResponse {
  success: boolean;
  avatarUrl: string;
}

/**
 * Password change response
 */
export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

/**
 * 2FA enable response
 */
export interface Enable2FAResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

/**
 * 2FA verify response
 */
export interface Verify2FAResponse {
  success: boolean;
  message: string;
}

/**
 * Session info
 */
export interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

/**
 * Sessions list response
 */
export interface SessionsListResponse {
  sessions: SessionInfo[];
}

/**
 * Session revoke response
 */
export interface SessionRevokeResponse {
  success: boolean;
  message: string;
}

/**
 * Notification setting
 */
export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * Notification preferences response
 */
export interface NotificationPreferencesResponse {
  settings: NotificationSetting[];
}

/**
 * Notification update response
 */
export interface NotificationUpdateResponse {
  success: boolean;
  setting: {
    id: string;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

/**
 * System settings response
 */
export interface SystemSettingsResponse {
  theme: Theme;
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
}

/**
 * System info response
 */
export interface SystemInfoResponse {
  version: string;
  apiVersion: string;
  serverStatus: 'healthy' | 'degraded' | 'down';
  lastSync: Date;
  uptime: number;
}

// ============================================
// COMMISSION DTOs
// ============================================

export class UpdateCommissionDto {
  @ApiProperty({ description: 'Commission rate for mobile recharge (0–20)', example: 5 })
  @IsNumber()
  @Min(0)
  @Max(20)
  mobileRate: number;

  @ApiProperty({ description: 'Commission rate for DTH recharge (0–20)', example: 5 })
  @IsNumber()
  @Min(0)
  @Max(20)
  dthRate: number;
}

export interface CommissionRate {
  category: string;
  label: string;
  rate: number;
}

export interface CommissionSettingsResponse {
  rates: CommissionRate[];
}
