/**
 * Admin Customers DTOs
 * Data transfer objects for customer management API
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// ENUMS
// ============================================

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum CustomerKycStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  REJECTED = 'rejected',
  NOT_SUBMITTED = 'not_submitted',
}

export enum CustomerSortField {
  NAME = 'name',
  REGISTERED_AT = 'registeredAt',
  TOTAL_SPENT = 'totalSpent',
  TOTAL_TRANSACTIONS = 'totalTransactions',
  LAST_TRANSACTION = 'lastTransaction',
}

// ============================================
// QUERY DTOs
// ============================================

/**
 * Query DTO for customer list
 */
export class CustomerListQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by name, email, phone, or ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: 'Filter by KYC status', enum: CustomerKycStatus })
  @IsOptional()
  @IsString()
  kycStatus?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: CustomerSortField })
  @IsOptional()
  @IsEnum(CustomerSortField)
  sortBy?: CustomerSortField = CustomerSortField.REGISTERED_AT;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Filter by registration date start (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by registration date end (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO for updating customer status
 */
export class UpdateCustomerStatusDto {
  @ApiProperty({ description: 'New status', enum: CustomerStatus })
  @IsNotEmpty()
  @IsEnum(CustomerStatus)
  status: CustomerStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// RESPONSE INTERFACES
// ============================================

/**
 * Customer list item
 */
export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  status: CustomerStatus;
  kycStatus: string;
  totalTransactions: number;
  totalSpent: number;
  lastTransaction: Date | null;
  registeredAt: Date;
  deviceType: string | null;
}

/**
 * Customer stats summary
 */
export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  blockedCustomers: number;
  newThisMonth: number;
  newThisWeek: number;
  newToday: number;
  kycVerified: number;
  kycPending: number;
  kycRejected: number;
  growthRate: number;
}

/**
 * Paginated customer list response
 */
export interface PaginatedCustomerResponse {
  customers: CustomerListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    newThisMonth: number;
    kycVerified: number;
  };
}

/**
 * Customer transaction for detail view
 */
export interface CustomerTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: Date;
}

/**
 * Customer activity log entry
 */
export interface CustomerActivityLog {
  type: string;
  description: string;
  timestamp: Date;
}

/**
 * Customer detail response
 */
export interface CustomerDetailResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  status: CustomerStatus;
  kycStatus: string;
  totalTransactions: number;
  totalSpent: number;
  lastTransaction: Date | null;
  registeredAt: Date;
  deviceType: string | null;
  transactions: CustomerTransaction[];
  recentActivity: CustomerActivityLog[];
}

/**
 * Customer status update response
 */
export interface CustomerStatusUpdateResponse {
  success: boolean;
  message: string;
  customer: {
    id: string;
    status: CustomerStatus;
  };
}
