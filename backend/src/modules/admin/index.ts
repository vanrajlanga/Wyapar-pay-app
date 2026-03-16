/**
 * Admin Module Exports
 * Centralized exports for easy importing
 */

// Module
export { AdminModule } from './admin.module';

// Services
export { AdminAnalyticsService } from './admin-analytics.service';
export { AdminCustomersService } from './admin-customers.service';
export { AdminSettingsService } from './admin-settings.service';

// Controllers
export { AdminAnalyticsController } from './admin-analytics.controller';
export { AdminCustomersController } from './admin-customers.controller';
export { AdminSettingsController } from './admin-settings.controller';

// Analytics DTOs and Interfaces
export {
  // Enums (re-exported from entity)
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
  TimePeriod,
  AnalyticsPeriod,
  GroupBy,
  
  // Query DTOs
  AdminTransactionQueryDto,
  RevenueAnalyticsQueryDto,
  AnalyticsSummaryQueryDto,
  TopServicesQueryDto,
  
  // Response Interfaces
  TransactionListItem,
  PaginatedTransactionResponse,
  RevenueOverview,
  RevenueByType,
  RevenueByCategory,
  RevenueByStatus,
  RevenueByPaymentMethod,
  TimeSeriesDataPoint,
  TopCustomer,
  DashboardAnalytics,
  ExportOptions,
  AnalyticsSummaryResponse,
  TopServicesResponse,
  TimeSeriesResponse,
} from './dto/admin-analytics.dto';

// Customer DTOs and Interfaces
export {
  CustomerStatus,
  CustomerKycStatus,
  CustomerSortField,
  CustomerListQueryDto,
  UpdateCustomerStatusDto,
  CustomerListItem,
  CustomerStats,
  PaginatedCustomerResponse,
  CustomerDetailResponse,
  CustomerStatusUpdateResponse,
} from './dto/admin-customers.dto';

// Settings DTOs and Interfaces
export {
  AdminRole,
  Theme,
  NotificationChannel,
  UpdateAdminProfileDto,
  ChangePasswordDto,
  Verify2FADto,
  Disable2FADto,
  UpdateNotificationPreferenceDto,
  UpdateSystemSettingsDto,
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
} from './dto/admin-settings.dto';
