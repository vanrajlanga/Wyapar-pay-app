/**
 * Admin Customers Service
 * Provides customer management functionality for admin dashboard
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { Transaction, TransactionStatus } from '../../entities/transaction.entity';
import { KycStatus } from '../../entities/kyc-verification.entity';
import {
  CustomerListQueryDto,
  UpdateCustomerStatusDto,
  CustomerStatus,
  CustomerSortField,
  CustomerListItem,
  CustomerStats,
  PaginatedCustomerResponse,
  CustomerDetailResponse,
  CustomerTransaction,
  CustomerActivityLog,
  CustomerStatusUpdateResponse,
} from './dto/admin-customers.dto';

@Injectable()
export class AdminCustomersService {
  private readonly logger = new Logger(AdminCustomersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Map UserStatus to CustomerStatus
   */
  private mapUserStatusToCustomerStatus(status: UserStatus): CustomerStatus {
    switch (status) {
      case UserStatus.ACTIVE:
        return CustomerStatus.ACTIVE;
      case UserStatus.SUSPENDED:
        return CustomerStatus.BLOCKED;
      case UserStatus.INACTIVE:
      case UserStatus.PENDING_KYC:
      default:
        return CustomerStatus.INACTIVE;
    }
  }

  /**
   * Map CustomerStatus to UserStatus
   */
  private mapCustomerStatusToUserStatus(status: CustomerStatus): UserStatus {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return UserStatus.ACTIVE;
      case CustomerStatus.BLOCKED:
        return UserStatus.SUSPENDED;
      case CustomerStatus.INACTIVE:
      default:
        return UserStatus.INACTIVE;
    }
  }

  /**
   * Map KycStatus to customer-friendly status
   */
  private mapKycStatus(status: KycStatus): string {
    switch (status) {
      case KycStatus.VERIFIED:
        return 'verified';
      case KycStatus.PENDING_REVIEW:
      case KycStatus.IN_PROGRESS:
        return 'pending';
      case KycStatus.REJECTED:
        return 'rejected';
      case KycStatus.NOT_STARTED:
      default:
        return 'not_submitted';
    }
  }

  /**
   * Get sort field mapping
   */
  private getSortFieldMapping(sortBy: CustomerSortField): string {
    const mapping: Record<CustomerSortField, string> = {
      [CustomerSortField.NAME]: 'user.name',
      [CustomerSortField.REGISTERED_AT]: 'user.createdAt',
      [CustomerSortField.TOTAL_SPENT]: 'totalSpent',
      [CustomerSortField.TOTAL_TRANSACTIONS]: 'totalTransactions',
      [CustomerSortField.LAST_TRANSACTION]: 'lastTransaction',
    };
    return mapping[sortBy] || 'user.createdAt';
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  /**
   * Get paginated customer list with filters
   */
  async getCustomers(query: CustomerListQueryDto): Promise<PaginatedCustomerResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      kycStatus,
      sortBy = CustomerSortField.REGISTERED_AT,
      sortOrder = 'DESC',
      startDate,
      endDate,
    } = query;

    // Build subquery for transaction aggregation
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        (qb) =>
          qb
            .select('transaction.userId', 'userId')
            .addSelect('COUNT(*)', 'txnCount')
            .addSelect('COALESCE(SUM(CASE WHEN transaction.status = :success THEN transaction.amount ELSE 0 END), 0)', 'txnTotal')
            .addSelect('MAX(transaction.createdAt)', 'lastTxn')
            .from(Transaction, 'transaction')
            .groupBy('transaction.userId'),
        'txn_stats',
        'txn_stats.userId = user.id'
      )
      .setParameter('success', TransactionStatus.SUCCESS)
      .select([
        'user.id as id',
        'user.name as name',
        'user.email as email',
        'user.phone as phone',
        'user.profileImage as avatar',
        'user.status as status',
        'user.kycStatus as kycStatus',
        'COALESCE(txn_stats.txnCount, 0) as totalTransactions',
        'COALESCE(txn_stats.txnTotal, 0) as totalSpent',
        'txn_stats.lastTxn as lastTransaction',
        'user.createdAt as registeredAt',
      ]);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.phone LIKE :search OR user.id LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      const userStatus = this.mapCustomerStatusToUserStatus(status);
      queryBuilder.andWhere('user.status = :status', { status: userStatus });
    }

    if (kycStatus) {
      queryBuilder.andWhere('user.kycStatus = :kycStatus', { kycStatus });
    }

    if (startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate: endDateTime });
    }

    // Get total count
    const countQuery = this.userRepository.createQueryBuilder('user');
    if (search) {
      countQuery.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.phone LIKE :search OR user.id LIKE :search)',
        { search: `%${search}%` }
      );
    }
    if (status) {
      countQuery.andWhere('user.status = :status', { status: this.mapCustomerStatusToUserStatus(status) });
    }
    if (kycStatus) {
      countQuery.andWhere('user.kycStatus = :kycStatus', { kycStatus });
    }
    if (startDate) {
      countQuery.andWhere('user.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      countQuery.andWhere('user.createdAt <= :endDate', { endDate: endDateTime });
    }
    const total = await countQuery.getCount();

    // Apply sorting
    const sortField = this.getSortFieldMapping(sortBy);
    if (sortBy === CustomerSortField.TOTAL_SPENT || 
        sortBy === CustomerSortField.TOTAL_TRANSACTIONS || 
        sortBy === CustomerSortField.LAST_TRANSACTION) {
      queryBuilder.orderBy(sortField, sortOrder);
    } else {
      queryBuilder.orderBy(sortField, sortOrder);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    // Execute query
    const results = await queryBuilder.getRawMany();

    // Map results
    const customers: CustomerListItem[] = results.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatar: row.avatar,
      status: this.mapUserStatusToCustomerStatus(row.status),
      kycStatus: this.mapKycStatus(row.kycStatus),
      totalTransactions: parseInt(row.totalTransactions) || 0,
      totalSpent: parseFloat(row.totalSpent) || 0,
      lastTransaction: row.lastTransaction,
      registeredAt: row.registeredAt,
      deviceType: null, // Can be derived from preferences if stored
    }));

    // Get quick stats
    const stats = await this.getQuickStats();

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalCustomers: stats.totalCustomers,
        activeCustomers: stats.activeCustomers,
        newThisMonth: stats.newThisMonth,
        kycVerified: stats.kycVerified,
      },
    };
  }

  /**
   * Get customer by ID with detailed information
   */
  async getCustomerById(id: string): Promise<CustomerDetailResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Get transaction stats
    const txnStats = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'COUNT(*) as totalTransactions',
        'COALESCE(SUM(CASE WHEN transaction.status = :success THEN transaction.amount ELSE 0 END), 0) as totalSpent',
        'MAX(transaction.createdAt) as lastTransaction',
      ])
      .where('transaction.userId = :userId', { userId: id })
      .setParameter('success', TransactionStatus.SUCCESS)
      .getRawOne();

    // Get recent transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const transactions: CustomerTransaction[] = recentTransactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      amount: parseFloat(txn.amount as any),
      status: txn.status,
      createdAt: txn.createdAt,
    }));

    // Generate activity log (simplified - can be expanded with actual activity tracking)
    const recentActivity: CustomerActivityLog[] = [
      {
        type: 'registration',
        description: 'Account created',
        timestamp: user.createdAt,
      },
    ];

    if (user.lastLoginAt) {
      recentActivity.unshift({
        type: 'login',
        description: 'Last login',
        timestamp: user.lastLoginAt,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.profileImage,
      status: this.mapUserStatusToCustomerStatus(user.status),
      kycStatus: this.mapKycStatus(user.kycStatus),
      totalTransactions: parseInt(txnStats.totalTransactions) || 0,
      totalSpent: parseFloat(txnStats.totalSpent) || 0,
      lastTransaction: txnStats.lastTransaction,
      registeredAt: user.createdAt,
      deviceType: null,
      transactions,
      recentActivity,
    };
  }

  /**
   * Update customer status
   */
  async updateCustomerStatus(
    id: string,
    dto: UpdateCustomerStatusDto
  ): Promise<CustomerStatusUpdateResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const newUserStatus = this.mapCustomerStatusToUserStatus(dto.status);
    
    await this.userRepository.update(id, {
      status: newUserStatus,
    });

    this.logger.log(
      `Customer ${id} status updated to ${dto.status}. Reason: ${dto.reason || 'N/A'}`
    );

    return {
      success: true,
      message: 'Customer status updated successfully',
      customer: {
        id,
        status: dto.status,
      },
    };
  }

  /**
   * Get comprehensive customer statistics
   */
  async getCustomerStats(): Promise<CustomerStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all stats in parallel
    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      blockedCustomers,
      newThisMonth,
      newThisWeek,
      newToday,
      kycVerified,
      kycPending,
      kycRejected,
      lastMonthCustomers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepository.count({ where: { status: UserStatus.INACTIVE } }),
      this.userRepository.count({ where: { status: UserStatus.SUSPENDED } }),
      this.userRepository.createQueryBuilder('user')
        .where('user.createdAt >= :startOfMonth', { startOfMonth })
        .getCount(),
      this.userRepository.createQueryBuilder('user')
        .where('user.createdAt >= :startOfWeek', { startOfWeek })
        .getCount(),
      this.userRepository.createQueryBuilder('user')
        .where('user.createdAt >= :startOfDay', { startOfDay })
        .getCount(),
      this.userRepository.count({ where: { kycStatus: KycStatus.VERIFIED } }),
      this.userRepository.count({ where: { kycStatus: KycStatus.PENDING_REVIEW } }),
      this.userRepository.count({ where: { kycStatus: KycStatus.REJECTED } }),
      // Last month's customers for growth rate
      this.userRepository.createQueryBuilder('user')
        .where('user.createdAt < :startOfMonth', { startOfMonth })
        .getCount(),
    ]);

    // Calculate growth rate
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const newLastMonth = await this.userRepository.createQueryBuilder('user')
      .where('user.createdAt >= :previousMonthStart', { previousMonthStart })
      .andWhere('user.createdAt <= :previousMonthEnd', { previousMonthEnd })
      .getCount();

    const growthRate = newLastMonth > 0 
      ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 10000) / 100
      : newThisMonth > 0 ? 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      blockedCustomers,
      newThisMonth,
      newThisWeek,
      newToday,
      kycVerified,
      kycPending,
      kycRejected,
      growthRate,
    };
  }

  /**
   * Get quick stats for list header
   */
  private async getQuickStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newThisMonth: number;
    kycVerified: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, activeCustomers, newThisMonth, kycVerified] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepository.createQueryBuilder('user')
        .where('user.createdAt >= :startOfMonth', { startOfMonth })
        .getCount(),
      this.userRepository.count({ where: { kycStatus: KycStatus.VERIFIED } }),
    ]);

    return { totalCustomers, activeCustomers, newThisMonth, kycVerified };
  }
}
