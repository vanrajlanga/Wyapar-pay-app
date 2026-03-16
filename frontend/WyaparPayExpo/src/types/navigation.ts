/**
 * Navigation Types
 * Screen types and navigation props
 */

export type Screen =
  | 'landing'
  | 'login'
  | 'register'
  | 'otp-login'
  | 'otp-verify'
  | 'complete-profile'
  | 'email-verify'
  | 'dashboard'
  | 'account-details'
  | 'preferences'
  | 'security'
  | 'profile-management'
  | 'recharge-entry'
  | 'recharge-plans'
  | 'recharge-review'
  | 'recharge-status'
  | 'recharge-history'
  | 'dth-entry'
  | 'dth-plans'
  | 'dth-review'
  | 'transaction-history'
  | 'payment-success'
  | 'contact-us';

export interface NavigationProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  onNavigate?: (screen: Screen) => void;
}
