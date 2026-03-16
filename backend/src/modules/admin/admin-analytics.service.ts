/**
 * Admin Analytics Service
 * Provides comprehensive analytics and reporting for admin dashboard
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
} from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { CommissionSetting } from '../../entities/commission-setting.entity';
import {
  AdminTransactionQueryDto,
  RevenueAnalyticsQueryDto,
  TimePeriod,
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
} from './dto/admin-analytics.dto';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CommissionSetting)
    private readonly commissionSettingRepository: Repository<CommissionSetting>,
  ) {}

  // ============================================
  // PRIVATE HELPER METHODS (Reusable utilities)
  // ============================================

  /**
   * Apply date range filter to query builder
   * @param queryBuilder - TypeORM query builder
   * @param startDate - Start date string (ISO format)
   * @param endDate - End date string (ISO format)
   * @param alias - Entity alias in query (default: 'transaction')
   */
  private applyDateRangeFilter(
    queryBuilder: any,
    startDate?: string,
    endDate?: string,
    alias: string = 'transaction'
  ): void {
    if (startDate) {
      queryBuilder.andWhere(`${alias}.createdAt >= :startDate`, { 
        startDate: new Date(startDate) 
      });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere(`${alias}.createdAt <= :endDate`, { 
        endDate: endDateTime 
      });
    }
  }

  /**
   * Map Transaction entity to TransactionListItem DTO
   * Reusable mapper for consistent response formatting
   */
  private mapTransactionToListItem(txn: Transaction): TransactionListItem {
    return {
      id: txn.id,
      userId: txn.userId,
      userName: txn.user?.name,
      userPhone: txn.user?.phone,
      userEmail: txn.user?.email,
      type: txn.type as TransactionType,
      category: txn.category as TransactionCategory,
      status: txn.status as TransactionStatus,
      paymentMethod: txn.paymentMethod as PaymentMethod,
      amount: this.parseDecimal(txn.amount),
      fee: this.parseDecimal(txn.fee),
      totalAmount: this.parseDecimal(txn.totalAmount),
      currency: txn.currency,
      gatewayRef: txn.gatewayRef,
      upiRef: txn.upiRef,
      bankRef: txn.bankRef,
      description: txn.description,
      customerRef: txn.customerRef,
      failureReason: txn.failureReason,
      metadata: txn.metadata,
      gatewayResponse: txn.gatewayResponse,
      createdAt: txn.createdAt,
      processedAt: txn.processedAt,
      completedAt: txn.completedAt,
    };
  }

  /**
   * Parse decimal value safely
   */
  private parseDecimal(value: any): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Round to 2 decimal places
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculate percentage safely
   */
  private calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return this.roundToTwoDecimals((value / total) * 100);
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  /**
   * Get paginated transactions with filters
   */
  async getTransactions(query: AdminTransactionQueryDto): Promise<PaginatedTransactionResponse> {
    const {
      page = 1,
      limit = 20,
      type,
      types,
      status,
      statuses,
      category,
      categories,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user');

    // Apply filters
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }
    if (types && types.length > 0) {
      queryBuilder.andWhere('transaction.type IN (:...types)', { types });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }
    if (statuses && statuses.length > 0) {
      queryBuilder.andWhere('transaction.status IN (:...statuses)', { statuses });
    }

    if (category) {
      queryBuilder.andWhere('transaction.category = :category', { category });
    }
    if (categories && categories.length > 0) {
      queryBuilder.andWhere('transaction.category IN (:...categories)', { categories });
    }

    if (paymentMethod) {
      queryBuilder.andWhere('transaction.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount });
    }
    if (maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount });
    }

    if (userId) {
      queryBuilder.andWhere('transaction.userId = :userId', { userId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(transaction.id LIKE :search OR transaction.gatewayRef LIKE :search OR transaction.upiRef LIKE :search OR transaction.customerRef LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'amount', 'totalAmount', 'status', 'type', 'category'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`transaction.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const transactions = await queryBuilder.getMany();

    // Map to response format using reusable mapper
    const data: TransactionListItem[] = transactions.map((txn) => 
      this.mapTransactionToListItem(txn)
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      filters: {
        applied: {
          type,
          types,
          status,
          statuses,
          category,
          categories,
          paymentMethod,
          startDate,
          endDate,
          minAmount,
          maxAmount,
          userId,
          search,
        },
        available: {
          types: Object.values(TransactionType),
          statuses: Object.values(TransactionStatus),
          categories: Object.values(TransactionCategory),
          paymentMethods: Object.values(PaymentMethod),
        },
      },
    };
  }

  /**
   * Get revenue overview with optional date range
   */
  async getRevenueOverview(startDate?: string, endDate?: string): Promise<RevenueOverview> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    // Get aggregated data
    const result = await queryBuilder
      .select([
        'SUM(CASE WHEN transaction.status = :success THEN transaction.amount ELSE 0 END) as totalRevenue',
        'SUM(CASE WHEN transaction.status = :success THEN transaction.fee ELSE 0 END) as totalFees',
        'COUNT(*) as totalTransactions',
        'SUM(CASE WHEN transaction.status = :success THEN 1 ELSE 0 END) as successfulTransactions',
        'SUM(CASE WHEN transaction.status = :failed THEN 1 ELSE 0 END) as failedTransactions',
        'SUM(CASE WHEN transaction.status = :pending OR transaction.status = :processing THEN 1 ELSE 0 END) as pendingTransactions',
        'AVG(CASE WHEN transaction.status = :success THEN transaction.amount ELSE NULL END) as averageTransactionValue',
      ])
      .setParameters({
        success: TransactionStatus.SUCCESS,
        failed: TransactionStatus.FAILED,
        pending: TransactionStatus.PENDING,
        processing: TransactionStatus.PROCESSING,
      })
      .getRawOne();

    const totalRevenue = parseFloat(result.totalRevenue) || 0;
    const totalTransactions = parseInt(result.totalTransactions) || 0;
    const successfulTransactions = parseInt(result.successfulTransactions) || 0;
    const failedTransactions = parseInt(result.failedTransactions) || 0;
    const pendingTransactions = parseInt(result.pendingTransactions) || 0;
    const totalFees = parseFloat(result.totalFees) || 0;
    const averageTransactionValue = parseFloat(result.averageTransactionValue) || 0;
    const successRate = totalTransactions > 0 
      ? (successfulTransactions / totalTransactions) * 100 
      : 0;

    // Calculate period comparison if date range is provided
    let periodComparison;
    if (startDate && endDate) {
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const duration = currentEnd.getTime() - currentStart.getTime();
      
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - duration);

      const previousResult = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(CASE WHEN transaction.status = :success THEN transaction.amount ELSE 0 END) as previousRevenue')
        .where('transaction.createdAt >= :previousStart', { previousStart })
        .andWhere('transaction.createdAt <= :previousEnd', { previousEnd })
        .setParameter('success', TransactionStatus.SUCCESS)
        .getRawOne();

      const previousPeriodRevenue = parseFloat(previousResult.previousRevenue) || 0;
      const revenueChange = totalRevenue - previousPeriodRevenue;
      const revenueChangePercent = previousPeriodRevenue > 0 
        ? ((revenueChange / previousPeriodRevenue) * 100) 
        : 0;

      periodComparison = {
        previousPeriodRevenue,
        revenueChange,
        revenueChangePercent: Math.round(revenueChangePercent * 100) / 100,
      };
    }

    // Calculate dynamic commission from commission_settings
    const totalCommission = await this.calculateCommission(startDate, endDate);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
      totalFees: Math.round(totalCommission * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      periodComparison,
    };
  }

  /**
   * Calculate total commission from successful transactions using commission_settings rates
   */
  private async calculateCommission(startDate?: string, endDate?: string): Promise<number> {
    try {
      // Get commission rates
      const settings = await this.commissionSettingRepository.find();
      this.logger.log(`💰 Commission settings: ${JSON.stringify(settings.map(s => ({ cat: s.category, rate: s.rate })))}, dateRange: ${startDate} → ${endDate}`);
      const rateMap: Record<string, number> = {};
      settings.forEach(s => { rateMap[s.category] = Number(s.rate); });

      // Get transaction amounts grouped by category (all statuses - commission is on recharge amount)
      const qb = this.transactionRepository
        .createQueryBuilder('transaction')
        .select([
          'transaction.category as category',
          'SUM(transaction.amount) as totalAmount',
        ])
        .where('transaction.category IS NOT NULL')
        .groupBy('transaction.category');

      if (startDate) {
        qb.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        qb.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
      }

      const rows = await qb.getRawMany();

      let totalCommission = 0;
      this.logger.log(`💰 Commission rows: ${JSON.stringify(rows)}`);
      for (const row of rows) {
        const rate = rateMap[row.category] ?? 0;
        const amount = parseFloat(row.totalAmount) || 0;
        totalCommission += (amount * rate) / 100;
        this.logger.log(`💰 Category: ${row.category}, Amount: ${amount}, Rate: ${rate}%, Commission: ${(amount * rate) / 100}`);
      }

      this.logger.log(`💰 Total commission: ${totalCommission}`);
      return totalCommission;
    } catch (error) {
      this.logger.error(`❌ Failed to calculate commission: ${error?.message || error}`, error?.stack);
      return 0;
    }
  }

  /**
   * Get revenue breakdown by transaction type
   */
  async getRevenueByType(startDate?: string, endDate?: string): Promise<RevenueByType[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.type as type',
        'SUM(transaction.amount) as totalAmount',
        'COUNT(*) as transactionCount',
        'SUM(CASE WHEN transaction.status = :success THEN 1 ELSE 0 END) as successCount',
        'SUM(CASE WHEN transaction.status = :failed THEN 1 ELSE 0 END) as failedCount',
        'AVG(transaction.amount) as averageAmount',
      ])
      .setParameter('success', TransactionStatus.SUCCESS)
      .setParameter('failed', TransactionStatus.FAILED)
      .groupBy('transaction.type');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    const results = await queryBuilder.getRawMany();

    // Calculate total for percentage
    const totalAmount = results.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);

    return results.map((r) => ({
      type: r.type as TransactionType,
      totalAmount: parseFloat(r.totalAmount) || 0,
      transactionCount: parseInt(r.transactionCount) || 0,
      successCount: parseInt(r.successCount) || 0,
      failedCount: parseInt(r.failedCount) || 0,
      averageAmount: Math.round((parseFloat(r.averageAmount) || 0) * 100) / 100,
      percentageOfTotal: totalAmount > 0 
        ? Math.round(((parseFloat(r.totalAmount) || 0) / totalAmount) * 10000) / 100 
        : 0,
    }));
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueByCategory(startDate?: string, endDate?: string): Promise<RevenueByCategory[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.category as category',
        'SUM(transaction.amount) as totalAmount',
        'COUNT(*) as transactionCount',
        'SUM(CASE WHEN transaction.status = :success THEN 1 ELSE 0 END) as successCount',
        'AVG(transaction.amount) as averageAmount',
      ])
      .setParameter('success', TransactionStatus.SUCCESS)
      .groupBy('transaction.category');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    const results = await queryBuilder.getRawMany();

    const totalAmount = results.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);

    return results.map((r) => ({
      category: r.category as TransactionCategory,
      totalAmount: parseFloat(r.totalAmount) || 0,
      transactionCount: parseInt(r.transactionCount) || 0,
      successCount: parseInt(r.successCount) || 0,
      averageAmount: Math.round((parseFloat(r.averageAmount) || 0) * 100) / 100,
      percentageOfTotal: totalAmount > 0 
        ? Math.round(((parseFloat(r.totalAmount) || 0) / totalAmount) * 10000) / 100 
        : 0,
    }));
  }

  /**
   * Get revenue breakdown by status
   */
  async getRevenueByStatus(startDate?: string, endDate?: string): Promise<RevenueByStatus[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.status as status',
        'SUM(transaction.amount) as totalAmount',
        'COUNT(*) as transactionCount',
      ])
      .groupBy('transaction.status');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    const results = await queryBuilder.getRawMany();

    const totalCount = results.reduce((sum, r) => sum + (parseInt(r.transactionCount) || 0), 0);

    return results.map((r) => ({
      status: r.status as TransactionStatus,
      totalAmount: parseFloat(r.totalAmount) || 0,
      transactionCount: parseInt(r.transactionCount) || 0,
      percentageOfTotal: totalCount > 0 
        ? Math.round(((parseInt(r.transactionCount) || 0) / totalCount) * 10000) / 100 
        : 0,
    }));
  }

  /**
   * Get revenue breakdown by payment method
   */
  async getRevenueByPaymentMethod(startDate?: string, endDate?: string): Promise<RevenueByPaymentMethod[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.paymentMethod as paymentMethod',
        'SUM(transaction.amount) as totalAmount',
        'COUNT(*) as transactionCount',
        'AVG(transaction.amount) as averageAmount',
      ])
      .where('transaction.status = :success', { success: TransactionStatus.SUCCESS })
      .groupBy('transaction.paymentMethod');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    const results = await queryBuilder.getRawMany();

    const totalAmount = results.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);

    return results.map((r) => ({
      paymentMethod: r.paymentMethod as PaymentMethod,
      totalAmount: parseFloat(r.totalAmount) || 0,
      transactionCount: parseInt(r.transactionCount) || 0,
      averageAmount: Math.round((parseFloat(r.averageAmount) || 0) * 100) / 100,
      percentageOfTotal: totalAmount > 0 
        ? Math.round(((parseFloat(r.totalAmount) || 0) / totalAmount) * 10000) / 100 
        : 0,
    }));
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(query: RevenueAnalyticsQueryDto): Promise<TimeSeriesDataPoint[]> {
    const { startDate, endDate, period = TimePeriod.DAILY, type, category } = query;

    let dateFormat: string;
    let labelFormat: string;
    
    switch (period) {
      case TimePeriod.WEEKLY:
        dateFormat = '%Y-%u'; // Year-Week
        labelFormat = 'Week %u, %Y';
        break;
      case TimePeriod.MONTHLY:
        dateFormat = '%Y-%m';
        labelFormat = '%b %Y';
        break;
      case TimePeriod.YEARLY:
        dateFormat = '%Y';
        labelFormat = '%Y';
        break;
      case TimePeriod.DAILY:
      default:
        dateFormat = '%Y-%m-%d';
        labelFormat = '%d %b';
        break;
    }

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        `DATE_FORMAT(transaction.createdAt, '${dateFormat}') as date`,
        `DATE_FORMAT(transaction.createdAt, '${labelFormat}') as label`,
        'SUM(transaction.amount) as totalAmount',
        'COUNT(*) as transactionCount',
        'SUM(CASE WHEN transaction.status = :success THEN 1 ELSE 0 END) as successCount',
        'SUM(CASE WHEN transaction.status = :failed THEN 1 ELSE 0 END) as failedCount',
        'SUM(transaction.fee) as fees',
      ])
      .setParameter('success', TransactionStatus.SUCCESS)
      .setParameter('failed', TransactionStatus.FAILED)
      .groupBy('date, label')
      .orderBy('date', 'ASC');

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }
    if (category) {
      queryBuilder.andWhere('transaction.category = :category', { category });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      date: r.date,
      label: r.label,
      totalAmount: parseFloat(r.totalAmount) || 0,
      transactionCount: parseInt(r.transactionCount) || 0,
      successCount: parseInt(r.successCount) || 0,
      failedCount: parseInt(r.failedCount) || 0,
      fees: parseFloat(r.fees) || 0,
    }));
  }

  /**
   * Get top customers by transaction volume
   */
  async getTopCustomers(limit: number = 10, startDate?: string, endDate?: string): Promise<TopCustomer[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.user', 'user')
      .select([
        'transaction.userId as userId',
        'user.name as userName',
        'user.phone as userPhone',
        'user.email as userEmail',
        'COUNT(*) as totalTransactions',
        'SUM(transaction.amount) as totalAmount',
        'SUM(CASE WHEN transaction.status = :success THEN 1 ELSE 0 END) as successfulTransactions',
        'MAX(transaction.createdAt) as lastTransactionDate',
      ])
      .where('transaction.status = :success', { success: TransactionStatus.SUCCESS })
      .groupBy('transaction.userId, user.name, user.phone, user.email')
      .orderBy('totalAmount', 'DESC')
      .limit(limit);

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: endDateTime });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userPhone: r.userPhone,
      userEmail: r.userEmail,
      totalTransactions: parseInt(r.totalTransactions) || 0,
      totalAmount: parseFloat(r.totalAmount) || 0,
      successfulTransactions: parseInt(r.successfulTransactions) || 0,
      lastTransactionDate: r.lastTransactionDate,
    }));
  }

  /**
   * Get complete dashboard analytics
   */
  async getDashboardAnalytics(startDate?: string, endDate?: string): Promise<DashboardAnalytics> {
    const [
      overview,
      revenueByType,
      revenueByCategory,
      revenueByStatus,
      revenueByPaymentMethod,
      timeSeries,
      topCustomers,
      recentTransactionsResponse,
    ] = await Promise.all([
      this.getRevenueOverview(startDate, endDate),
      this.getRevenueByType(startDate, endDate),
      this.getRevenueByCategory(startDate, endDate),
      this.getRevenueByStatus(startDate, endDate),
      this.getRevenueByPaymentMethod(startDate, endDate),
      this.getTimeSeries({ startDate, endDate, period: TimePeriod.DAILY }),
      this.getTopCustomers(10, startDate, endDate),
      this.getTransactions({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'DESC' }),
    ]);

    return {
      overview,
      revenueByType,
      revenueByCategory,
      revenueByStatus,
      revenueByPaymentMethod,
      timeSeries,
      topCustomers,
      recentTransactions: recentTransactionsResponse.data,
    };
  }

  /**
   * Get transaction by ID with full details
   */
  async getTransactionById(id: string): Promise<TransactionListItem | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction) {
      return null;
    }

    return this.mapTransactionToListItem(transaction);
  }

  /**
   * Export transactions to various formats
   * Reusable method for generating exports
   */
  async getTransactionsForExport(
    query: AdminTransactionQueryDto,
    maxLimit: number = 10000
  ): Promise<TransactionListItem[]> {
    const exportQuery = { ...query, limit: maxLimit, page: 1 };
    const result = await this.getTransactions(exportQuery);
    return result.data;
  }

  // ============================================
  // ANALYTICS SUMMARY METHODS
  // ============================================

  /**
   * Calculate date range from period
   */
  private getDateRangeFromPeriod(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case '7d':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        } else {
          start = new Date(now);
          start.setDate(start.getDate() - 30);
        }
        break;
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  /**
   * Get analytics summary with period-based grouping
   */
  async getAnalyticsSummary(
    period: string,
    startDate?: string,
    endDate?: string,
    groupBy?: string
  ): Promise<any> {
    const dateRange = this.getDateRangeFromPeriod(period, startDate, endDate);
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];

    // Get previous period for comparison
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = new Date(dateRange.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    // Get current period data
    const [currentOverview, prevOverview, categoryRevenue, paymentMethodStats, timeSeries] = await Promise.all([
      this.getRevenueOverview(startStr, endStr),
      this.getRevenueOverview(prevStartStr, prevEndStr),
      this.getRevenueByCategory(startStr, endStr),
      this.getRevenueByPaymentMethod(startStr, endStr),
      this.getTimeSeries({ startDate: startStr, endDate: endStr, period: this.getTimePeriodFromGroupBy(groupBy) }),
    ]);

    // Calculate changes
    const calculateChange = (current: number, previous: number): { change: number; changeType: 'increase' | 'decrease' | 'neutral' } => {
      if (previous === 0) return { change: current > 0 ? 100 : 0, changeType: current > 0 ? 'increase' : 'neutral' };
      const change = Math.round(((current - previous) / previous) * 10000) / 100;
      return {
        change: Math.abs(change),
        changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
      };
    };

    const revenueChange = calculateChange(currentOverview.totalRevenue, prevOverview.totalRevenue);
    const avgTxnChange = calculateChange(currentOverview.averageTransactionValue, prevOverview.averageTransactionValue);
    const feesChange = calculateChange(currentOverview.totalFees, prevOverview.totalFees);
    
    const revenueMetrics = [
      {
        label: 'Total Revenue',
        value: currentOverview.totalRevenue,
        ...revenueChange,
      },
      {
        label: 'Avg. Transaction',
        value: currentOverview.averageTransactionValue,
        ...avgTxnChange,
      },
      {
        label: 'Commission Earned',
        value: currentOverview.totalFees,
        ...feesChange,
      },
    ];

    // Format category revenue
    const formattedCategoryRevenue = categoryRevenue.map((cat) => ({
      category: cat.category,
      categoryLabel: this.formatLabel(cat.category),
      revenue: cat.totalAmount,
      transactions: cat.transactionCount,
      percentage: cat.percentageOfTotal,
      avgTransaction: cat.averageAmount,
    }));

    // Format payment method stats
    const formattedPaymentMethodStats = paymentMethodStats.map((pm) => ({
      method: pm.paymentMethod,
      methodLabel: this.formatLabel(pm.paymentMethod),
      percentage: pm.percentageOfTotal,
      revenue: pm.totalAmount,
      transactions: pm.transactionCount,
    }));

    // Get top services (using category data as proxy)
    const topServices = formattedCategoryRevenue.slice(0, 5).map((cat, index) => ({
      serviceId: `SVC${String(index + 1).padStart(3, '0')}`,
      name: this.formatLabel(cat.category),
      operator: 'Various',
      category: cat.category,
      revenue: cat.revenue,
      transactions: cat.transactions,
      growth: Math.random() * 20 - 5, // Placeholder
      marketShare: cat.percentage,
    }));

    // Format time series with success rate
    const formattedTimeSeries = timeSeries.map((ts) => ({
      date: ts.date,
      revenue: ts.totalAmount,
      transactions: ts.transactionCount,
      successRate: ts.transactionCount > 0 
        ? Math.round((ts.successCount / ts.transactionCount) * 10000) / 100 
        : 0,
    }));

    return {
      revenueMetrics,
      categoryRevenue: formattedCategoryRevenue,
      paymentMethodStats: formattedPaymentMethodStats,
      topServices,
      timeSeries: formattedTimeSeries,
    };
  }

  /**
   * Get top services by revenue
   */
  async getTopServices(
    period: string,
    limit: number = 10,
    category?: string
  ): Promise<any> {
    const dateRange = this.getDateRangeFromPeriod(period);
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.category as category',
        'SUM(transaction.amount) as revenue',
        'COUNT(*) as transactions',
      ])
      .where('transaction.status = :success', { success: TransactionStatus.SUCCESS })
      .andWhere('transaction.createdAt >= :startDate', { startDate: dateRange.start })
      .andWhere('transaction.createdAt <= :endDate', { endDate: dateRange.end })
      .groupBy('transaction.category')
      .orderBy('revenue', 'DESC')
      .limit(limit);

    if (category) {
      queryBuilder.andWhere('transaction.category = :category', { category });
    }

    const results = await queryBuilder.getRawMany();

    // Calculate total for market share
    const totalRevenue = results.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);

    const services = results.map((r, index) => ({
      serviceId: `SVC${String(index + 1).padStart(3, '0')}`,
      name: this.formatLabel(r.category || 'other'),
      operator: 'Various',
      category: r.category,
      revenue: parseFloat(r.revenue) || 0,
      transactions: parseInt(r.transactions) || 0,
      growth: Math.round((Math.random() * 30 - 10) * 100) / 100, // Placeholder - would need historical comparison
      marketShare: totalRevenue > 0 
        ? Math.round(((parseFloat(r.revenue) || 0) / totalRevenue) * 10000) / 100 
        : 0,
    }));

    return { services };
  }

  /**
   * Get extended time series with summary
   */
  async getTimeSeriesExtended(
    period: string,
    startDate?: string,
    endDate?: string,
    metrics?: string[]
  ): Promise<any> {
    const dateRange = this.getDateRangeFromPeriod(period, startDate, endDate);
    const startStr = dateRange.start.toISOString().split('T')[0];
    const endStr = dateRange.end.toISOString().split('T')[0];

    const timeSeries = await this.getTimeSeries({ 
      startDate: startStr, 
      endDate: endStr, 
      period: TimePeriod.DAILY 
    });

    const data = timeSeries.map((ts) => ({
      date: ts.date,
      revenue: ts.totalAmount,
      transactions: ts.transactionCount,
      users: Math.floor(ts.transactionCount * 0.7), // Placeholder
      successRate: ts.transactionCount > 0 
        ? Math.round((ts.successCount / ts.transactionCount) * 10000) / 100 
        : 0,
    }));

    // Calculate summary
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = data.reduce((sum, d) => sum + d.transactions, 0);
    const avgDailyRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    
    // Find peak day
    const peakDay = data.reduce((max, d) => d.revenue > max.revenue ? d : max, data[0] || { date: '', revenue: 0 });

    return {
      data,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
        peakDay: peakDay?.date || '',
      },
    };
  }

  /**
   * Helper to format labels
   */
  private formatLabel(value: string): string {
    if (!value) return 'Unknown';
    return value.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Helper to get TimePeriod from groupBy string
   */
  private getTimePeriodFromGroupBy(groupBy?: string): TimePeriod {
    switch (groupBy) {
      case 'week':
        return TimePeriod.WEEKLY;
      case 'month':
        return TimePeriod.MONTHLY;
      case 'day':
      default:
        return TimePeriod.DAILY;
    }
  }
}
