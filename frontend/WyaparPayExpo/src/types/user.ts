/**
 * User Types
 * User data and authentication types
 */

export interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  isEmailVerified: boolean;
}

export interface UserTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  identifier: string;
  password: string;
  loginType: 'password' | 'otp';
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OtpData {
  identifier: string;
  otp: string;
  otpSent: boolean;
}

export interface EmailVerification {
  code: string;
  email: string;
  userId: string;
  isResending: boolean;
}

export interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  showBalance: boolean;
  biometricLogin: boolean;
}
