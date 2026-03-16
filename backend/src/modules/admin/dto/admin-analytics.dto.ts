/**
 * Admin Analytics DTOs
 * Data transfer objects for admin analytics API
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsString,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Import enums from entity to avoid duplication
import {
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
} from '../../../entities/transaction.entity';

// Re-export for convenience
export { TransactionType, TransactionStatus, TransactionCategory, PaymentMethod };

// Time period for aggregation
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Query DTO for admin transaction list with filters
 */
export class AdminTransactionQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter by multiple transaction types', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  types?: TransactionType[];

  @ApiPropertyOptional({ description: 'Filter by status', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by multiple statuses', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: TransactionStatus[];

  @ApiPropertyOptional({ description: 'Filter by category', enum: TransactionCategory })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'Filter by multiple categories', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  categories?: TransactionCategory[];

  @ApiPropertyOptional({ description: 'Filter by payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search by transaction ID, gateway ref, or customer ref' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Query DTO for revenue analytics
 */
export class RevenueAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Time period for grouping', enum: TimePeriod, default: TimePeriod.DAILY })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.DAILY;

  @ApiPropertyOptional({ description: 'Filter by transaction type', enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter by category', enum: TransactionCategory })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;
}

/**
 * Response interfaces
 */
export interface TransactionListItem {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  gatewayRef?: string;
  upiRef?: string;
  bankRef?: string;
  description?: string;
  customerRef?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

export interface PaginatedTransactionResponse {
  data: TransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      types: string[];
      statuses: string[];
      categories: string[];
      paymentMethods: string[];
    };
  };
}

export interface RevenueOverview {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  totalFees: number;
  successRate: number;
  periodComparison?: {
    previousPeriodRevenue: number;
    revenueChange: number;
    revenueChangePercent: number;
  };
}

export interface RevenueByType {
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  failedCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface RevenueByCategory {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface RevenueByStatus {
  status: TransactionStatus;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface RevenueByPaymentMethod {
  paymentMethod: PaymentMethod;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  successCount: number;
  failedCount: number;
  fees: number;
}

export interface TopCustomer {
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  lastTransactionDate: Date;
}

export interface DashboardAnalytics {
  overview: RevenueOverview;
  revenueByType: RevenueByType[];
  revenueByCategory: RevenueByCategory[];
  revenueByStatus: RevenueByStatus[];
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  timeSeries: TimeSeriesDataPoint[];
  topCustomers: TopCustomer[];
  recentTransactions: TransactionListItem[];
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeFields?: string[];
  excludeFields?: string[];
}

// ============================================
// ANALYTICS SUMMARY DTOs (for period-based analytics)
// ============================================

export enum AnalyticsPeriod {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  ONE_YEAR = '1y',
  CUSTOM = 'custom',
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Query DTO for analytics summary
 */
export class AnalyticsSummaryQueryDto {
  @ApiProperty({ description: 'Period', enum: AnalyticsPeriod })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;

  @ApiPropertyOptional({ description: 'Start date (required if period is custom)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (required if period is custom)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Grouping', enum: GroupBy })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;
}

/**
 * Query DTO for top services
 */
export class TopServicesQueryDto {
  @ApiProperty({ description: 'Period', enum: AnalyticsPeriod })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;

  @ApiPropertyOptional({ description: 'Number of services', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by category', enum: TransactionCategory })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;
}

// ============================================
// ANALYTICS SUMMARY RESPONSE INTERFACES
// ============================================

/**
 * Revenue metric with change indicator
 */
export interface RevenueMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

/**
 * Category revenue with additional fields
 */
export interface CategoryRevenueItem {
  category: TransactionCategory;
  categoryLabel: string;
  revenue: number;
  transactions: number;
  percentage: number;
  growth?: number;
  avgTransaction?: number;
}

/**
 * Payment method stats
 */
export interface PaymentMethodStats {
  method: PaymentMethod;
  methodLabel: string;
  percentage: number;
  revenue: number;
  transactions: number;
  growth?: number;
}

/**
 * Top service item
 */
export interface TopServiceItem {
  serviceId: string;
  name: string;
  operator: string;
  category: TransactionCategory;
  revenue: number;
  transactions: number;
  growth: number;
  marketShare?: number;
}

/**
 * Time series data point with success rate
 */
export interface TimeSeriesDataPointExtended {
  date: string;
  revenue: number;
  transactions: number;
  users?: number;
  successRate: number;
}

/**
 * Analytics summary response
 */
export interface AnalyticsSummaryResponse {
  revenueMetrics: RevenueMetric[];
  categoryRevenue: CategoryRevenueItem[];
  paymentMethodStats: PaymentMethodStats[];
  topServices: TopServiceItem[];
  timeSeries: TimeSeriesDataPointExtended[];
}

/**
 * Top services response
 */
export interface TopServicesResponse {
  services: TopServiceItem[];
}

/**
 * Time series response with summary
 */
export interface TimeSeriesResponse {
  data: TimeSeriesDataPointExtended[];
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgDailyRevenue: number;
    peakDay: string;
  };
}
