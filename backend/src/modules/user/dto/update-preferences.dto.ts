import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsString,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationPreferences {
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @IsBoolean()
  @IsOptional()
  transactionAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  promotionalEmails?: boolean;
}

class PrivacyPreferences {
  @IsBoolean()
  @IsOptional()
  showBalance?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'private', 'friends'])
  profileVisibility?: string;

  @IsBoolean()
  @IsOptional()
  showPhoneNumber?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDataSharing?: boolean;
}

class SecurityPreferences {
  @IsBoolean()
  @IsOptional()
  biometricLogin?: boolean;

  @IsBoolean()
  @IsOptional()
  twoFactorAuth?: boolean;

  @IsNumber()
  @IsOptional()
  sessionTimeout?: number;
}

class DisplayPreferences {
  @IsString()
  @IsOptional()
  @IsIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'kn'])
  language?: string;

  @IsString()
  @IsOptional()
  @IsIn(['INR', 'USD', 'EUR'])
  currency?: string;

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  dateFormat?: string;
}

class TransactionPreferences {
  @IsString()
  @IsOptional()
  @IsIn(['wallet', 'upi', 'card', 'netbanking'])
  defaultPaymentMethod?: string;

  @IsBoolean()
  @IsOptional()
  requireConfirmation?: boolean;

  @IsBoolean()
  @IsOptional()
  saveBeneficiaries?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Notification preferences',
    example: {
      push: true,
      email: true,
      sms: false,
      transactionAlerts: true,
      promotionalEmails: false,
    },
  })
  @ValidateNested()
  @Type(() => NotificationPreferences)
  @IsOptional()
  notifications?: NotificationPreferences;

  @ApiProperty({
    description: 'Privacy preferences',
    example: {
      showBalance: true,
      profileVisibility: 'private',
      showPhoneNumber: false,
      allowDataSharing: false,
    },
  })
  @ValidateNested()
  @Type(() => PrivacyPreferences)
  @IsOptional()
  privacy?: PrivacyPreferences;

  @ApiProperty({
    description: 'Security preferences',
    example: {
      biometricLogin: false,
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  })
  @ValidateNested()
  @Type(() => SecurityPreferences)
  @IsOptional()
  security?: SecurityPreferences;

  @ApiProperty({
    description: 'Display preferences',
    example: {
      language: 'en',
      currency: 'INR',
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
    },
  })
  @ValidateNested()
  @Type(() => DisplayPreferences)
  @IsOptional()
  display?: DisplayPreferences;

  @ApiProperty({
    description: 'Transaction preferences',
    example: {
      defaultPaymentMethod: 'wallet',
      requireConfirmation: true,
      saveBeneficiaries: true,
    },
  })
  @ValidateNested()
  @Type(() => TransactionPreferences)
  @IsOptional()
  transactions?: TransactionPreferences;

  @ApiProperty({
    description: 'Legacy preferences object for backward compatibility',
    example: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisibility: 'private',
        showPhoneNumber: false,
      },
      language: 'en',
      currency: 'INR',
      theme: 'light',
    },
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
