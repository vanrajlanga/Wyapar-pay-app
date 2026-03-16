import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  AuditLogAction,
  AuditLogStatus,
} from '../../entities/audit-log.entity';

export interface AuditLogData {
  userId?: string;
  action: AuditLogAction;
  resource: string;
  resourceId?: string;
  status: AuditLogStatus;
  description?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  errorMessage?: string;
}

/**
 * Audit Log Service
 *
 * Provides comprehensive audit logging for all critical operations:
 * - Financial transactions (wallet operations, payments, refunds)
 * - Authentication events (login, logout, password changes)
 * - User profile changes
 * - Security events (failed logins, account locks)
 *
 * Features:
 * - Immutable audit trail
 * - Before/after value tracking
 * - IP and user agent tracking
 * - Query capabilities for compliance reporting
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create(data);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Never let audit logging failure break the main operation
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Log a successful operation
   */
  async logSuccess(
    userId: string,
    action: AuditLogAction,
    resource: string,
    resourceId: string,
    description: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      status: AuditLogStatus.SUCCESS,
      description,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log a failed operation
   */
  async logFailure(
    userId: string | undefined,
    action: AuditLogAction,
    resource: string,
    resourceId: string | undefined,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      status: AuditLogStatus.FAILED,
      errorMessage,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log wallet operations (critical for financial audit)
   */
  async logWalletOperation(
    userId: string,
    action: 'WALLET_CREDIT' | 'WALLET_DEBIT' | 'WALLET_LOCK' | 'WALLET_UNLOCK',
    walletId: string,
    transactionId: string,
    oldBalance: number,
    newBalance: number,
    amount: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    return this.logSuccess(
      userId,
      AuditLogAction[action],
      'wallet',
      walletId,
      `${action.toLowerCase().replace('_', ' ')}: ₹${amount}`,
      { balance: oldBalance, transactionId },
      { balance: newBalance, transactionId },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userId: string | undefined,
    action: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTER' | 'PASSWORD_CHANGE',
    success: boolean,
    ipAddress: string,
    userAgent: string,
    errorMessage?: string
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action: AuditLogAction[action],
      resource: 'user',
      resourceId: userId,
      status: success ? AuditLogStatus.SUCCESS : AuditLogStatus.FAILED,
      description: `${action.toLowerCase().replace('_', ' ')} ${success ? 'successful' : 'failed'}`,
      ipAddress,
      userAgent,
      errorMessage,
    });
  }

  /**
   * Query audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Query audit logs for a resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resource, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Query failed operations (security monitoring)
   */
  async getFailedOperations(
    hours: number = 24,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.status = :status', { status: AuditLogStatus.FAILED })
      .andWhere('audit.createdAt >= :since', { since })
      .orderBy('audit.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get audit statistics for compliance reporting
   */
  async getAuditStatistics(userId?: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('audit.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :since', { since });

    if (userId) {
      query.andWhere('audit.userId = :userId', { userId });
    }

    return query
      .groupBy('audit.action')
      .addGroupBy('audit.status')
      .getRawMany();
  }
}
