import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In, SelectQueryBuilder } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionCategory,
  PaymentMethod,
} from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  categoryBreakdown: {
    category: TransactionCategory;
    count: number;
    totalAmount: number;
  }[];
  monthlyBreakdown: {
    month: string;
    count: number;
    totalAmount: number;
  }[];
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private notificationEmitter: NotificationEmitterService
  ) {}

  /**
   * Get all transactions for a user with filters and pagination
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedTransactions> {
    try {
      // Debug logging
      this.logger.log(`getTransactions called with page=${page}, limit=${limit}, filters=${JSON.stringify(filters)}`);

      // Validate and sanitize ALL parameters to prevent NaN
      const safePage = (typeof page === 'number' && !isNaN(page) && page > 0) ? Math.floor(page) : 1;
      const safeLimit = (typeof limit === 'number' && !isNaN(limit) && limit > 0 && limit <= 100) ? Math.floor(limit) : 20;

      // Completely rebuild filters object, excluding any NaN or invalid values
      const safeFilters: TransactionFilters = {};

      if (filters.type) safeFilters.type = filters.type;
      if (filters.category) safeFilters.category = filters.category;
      if (filters.status) safeFilters.status = filters.status;
      if (filters.paymentMethod) safeFilters.paymentMethod = filters.paymentMethod;
      if (filters.startDate) safeFilters.startDate = filters.startDate;
      if (filters.endDate) safeFilters.endDate = filters.endDate;
      if (filters.search) safeFilters.search = filters.search;

      // Only add amount filters if they're valid numbers
      if (typeof filters.minAmount === 'number' && !isNaN(filters.minAmount) && isFinite(filters.minAmount)) {
        safeFilters.minAmount = filters.minAmount;
      }
      if (typeof filters.maxAmount === 'number' && !isNaN(filters.maxAmount) && isFinite(filters.maxAmount)) {
        safeFilters.maxAmount = filters.maxAmount;
      }

      this.logger.log(`Sanitized: safePage=${safePage}, safeLimit=${safeLimit}, safeFilters=${JSON.stringify(safeFilters)}`);

      const queryBuilder = this.createTransactionQuery(userId, safeFilters);

      // Add pagination with validated values
      const offset = (safePage - 1) * safeLimit;
      this.logger.log(`Pagination: offset=${offset}, take=${safeLimit}`);

      queryBuilder.skip(offset).take(safeLimit);

      // Add ordering
      queryBuilder.orderBy('transaction.createdAt', 'DESC');

      // Log the SQL query to identify NaN issue
      const sql = queryBuilder.getSql();
      const params = queryBuilder.getParameters();
      this.logger.log(`SQL Query: ${sql}`);
      this.logger.log(`SQL Parameters: ${JSON.stringify(params)}`);

      // Execute query
      const [transactions, total] = await queryBuilder.getManyAndCount();

      return {
        transactions,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error) {
      this.logger.error(`Error in getTransactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    userId: string
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
      relations: ['user', 'wallet', 'biller', 'ledgerEntries'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get transaction summary for a user
   */
  async getTransactionSummary(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<TransactionSummary> {
    const queryBuilder = this.createTransactionQuery(userId, filters);

    // Get basic stats
    const transactions = await queryBuilder.getMany();

    const totalTransactions = transactions.length;
    // Only count successful transactions in total amount
    const totalAmount = transactions
      .filter((t) => t.status === TransactionStatus.SUCCESS)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const successCount = transactions.filter(
      (t) => t.status === TransactionStatus.SUCCESS
    ).length;
    const failedCount = transactions.filter(
      (t) => t.status === TransactionStatus.FAILED
    ).length;
    const pendingCount = transactions.filter(
      (t) => t.status === TransactionStatus.PENDING
    ).length;

    // Category breakdown
    const categoryMap = new Map<
      TransactionCategory,
      { count: number; totalAmount: number }
    >();
    transactions.forEach((transaction) => {
      if (transaction.category) {
        const existing = categoryMap.get(transaction.category) || {
          count: 0,
          totalAmount: 0,
        };
        existing.count++;
        existing.totalAmount += Number(transaction.amount);
        categoryMap.set(transaction.category, existing);
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, stats]) => ({
        category,
        count: stats.count,
        totalAmount: stats.totalAmount,
      })
    );

    // Monthly breakdown (last 12 months)
    const monthlyMap = new Map<
      string,
      { count: number; totalAmount: number }
    >();
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM format
      monthlyMap.set(monthKey, { count: 0, totalAmount: 0 });
    }

    transactions.forEach((transaction) => {
      const monthKey = transaction.createdAt.toISOString().substring(0, 7);
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.count++;
        existing.totalAmount += Number(transaction.amount);
      }
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalTransactions,
      totalAmount,
      successCount,
      failedCount,
      pendingCount,
      categoryBreakdown,
      monthlyBreakdown,
    };
  }

  /**
   * Get recent transactions for dashboard
   */
  async getRecentTransactions(
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .leftJoinAndSelect('transaction.biller', 'biller')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.category IS NOT NULL')
      .orderBy('transaction.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    userId: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      ...transactionData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    userId: string,
    status: TransactionStatus,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(transactionId, userId);

    transaction.status = status;
    transaction.updatedAt = new Date();

    if (metadata) {
      transaction.metadata = { ...transaction.metadata, ...metadata };
    }

    if (status === TransactionStatus.SUCCESS) {
      transaction.completedAt = new Date();
    }

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Emit transaction status event (exclude recharge as it has its own notifications)
    if (transaction.type !== TransactionType.RECHARGE) {
      if (status === TransactionStatus.SUCCESS) {
        await this.notificationEmitter.emitTransactionSuccess(userId, {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency || '₹',
          type: transaction.type,
        });
      } else if (status === TransactionStatus.FAILED) {
        await this.notificationEmitter.emitTransactionFailed(userId, {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency || '₹',
          reason: transaction.failureReason || 'Transaction failed',
        });
      }
    }

    return savedTransaction;
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(
    userId: string,
    category: TransactionCategory,
    limit: number = 20
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId, category },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['wallet', 'biller'],
    });
  }

  /**
   * Search transactions
   */
  async searchTransactions(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Transaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere(
        '(COALESCE(transaction.description, \'\') LIKE :search OR COALESCE(transaction.customerRef, \'\') LIKE :search OR COALESCE(transaction.gatewayRef, \'\') LIKE :search OR transaction.id LIKE :search)',
        { search: `%${searchTerm}%` }
      )
      .orderBy('transaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get transaction statistics for analytics
   */
  async getTransactionStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.createdAt >= :startDate', { startDate });

    const transactions = await queryBuilder.getMany();

    // Calculate stats
    const stats = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      averageAmount: 0,
      successRate: 0,
      topCategories: [] as any[],
      dailyBreakdown: [] as any[],
    };

    if (transactions.length > 0) {
      stats.averageAmount = stats.totalAmount / transactions.length;
      stats.successRate =
        (transactions.filter((t) => t.status === TransactionStatus.SUCCESS)
          .length /
          transactions.length) *
        100;

      // Top categories
      const categoryMap = new Map<TransactionCategory, number>();
      transactions.forEach((t) => {
        if (t.category) {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
        }
      });

      stats.topCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily breakdown
      const dailyMap = new Map<string, { count: number; amount: number }>();
      transactions.forEach((t) => {
        const day = t.createdAt.toISOString().substring(0, 10);
        const existing = dailyMap.get(day) || { count: 0, amount: 0 };
        existing.count++;
        existing.amount += Number(t.amount);
        dailyMap.set(day, existing);
      });

      stats.dailyBreakdown = Array.from(dailyMap.entries())
        .map(([day, data]) => ({ day, ...data }))
        .sort((a, b) => a.day.localeCompare(b.day));
    }

    return stats;
  }

  /**
   * Private helper to create transaction query with filters
   */
  private createTransactionQuery(
    userId: string,
    filters: TransactionFilters
  ): SelectQueryBuilder<Transaction> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .leftJoinAndSelect('transaction.biller', 'biller')
      .where('transaction.userId = :userId', { userId })
      // Exclude raw payment-module records (no category = internal Razorpay order records)
      .andWhere('transaction.category IS NOT NULL');

    // Apply filters
    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.category) {
      queryBuilder.andWhere('transaction.category = :category', {
        category: filters.category,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    }

    if (filters.paymentMethod) {
      queryBuilder.andWhere('transaction.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      );
    } else if (filters.startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    } else if (filters.endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.minAmount !== undefined && !isNaN(filters.minAmount)) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters.maxAmount !== undefined && !isNaN(filters.maxAmount)) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(COALESCE(transaction.description, \'\') LIKE :search OR COALESCE(transaction.customerRef, \'\') LIKE :search OR COALESCE(transaction.gatewayRef, \'\') LIKE :search OR transaction.id LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder;
  }
}
