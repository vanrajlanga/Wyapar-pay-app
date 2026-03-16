import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import {
  WalletLedger,
  LedgerType,
  LedgerCategory,
} from '../../entities/wallet-ledger.entity';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { GetLedgerEntriesDto } from './dto/get-ledger-entries.dto';

@Injectable()
export class WalletLedgerService {
  constructor(
    @InjectRepository(WalletLedger)
    private ledgerRepository: Repository<WalletLedger>
  ) {}

  // Create ledger entry
  async createLedgerEntry(
    createLedgerEntryDto: CreateLedgerEntryDto
  ): Promise<WalletLedger> {
    const ledgerEntry = this.ledgerRepository.create(createLedgerEntryDto);
    return this.ledgerRepository.save(ledgerEntry);
  }

  // Get ledger entries for wallet
  async getLedgerEntries(
    walletId: string,
    getLedgerEntriesDto: GetLedgerEntriesDto
  ): Promise<{ entries: WalletLedger[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = getLedgerEntriesDto;

    const queryBuilder = this.ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.walletId = :walletId', { walletId });

    // Apply filters
    if (type) {
      queryBuilder.andWhere('ledger.type = :type', { type });
    }

    if (category) {
      queryBuilder.andWhere('ledger.category = :category', { category });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'ledger.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`ledger.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [entries, total] = await queryBuilder.getManyAndCount();

    return { entries, total };
  }

  // Get wallet balance history
  async getBalanceHistory(
    walletId: string,
    days: number = 30
  ): Promise<{ date: string; balance: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.ledgerRepository.find({
      where: {
        walletId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by date and get closing balance for each day
    const balanceByDate = new Map<string, number>();
    let currentBalance = 0;

    entries.forEach((entry) => {
      const date = entry.createdAt.toISOString().split('T')[0];
      currentBalance = entry.balanceAfter;
      balanceByDate.set(date, currentBalance);
    });

    return Array.from(balanceByDate.entries()).map(([date, balance]) => ({
      date,
      balance,
    }));
  }

  // Get transaction summary
  async getTransactionSummary(
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    transactionCount: number;
  }> {
    const result = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .select([
        'SUM(CASE WHEN ledger.type = :credit THEN ledger.amount ELSE 0 END) as totalCredits',
        'SUM(CASE WHEN ledger.type = :debit THEN ledger.amount ELSE 0 END) as totalDebits',
        'COUNT(*) as transactionCount',
      ])
      .where('ledger.walletId = :walletId', { walletId })
      .andWhere('ledger.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameters({
        credit: LedgerType.CREDIT,
        debit: LedgerType.DEBIT,
      })
      .getRawOne();

    const totalCredits = parseFloat(result.totalCredits) || 0;
    const totalDebits = parseFloat(result.totalDebits) || 0;
    const netAmount = totalCredits - totalDebits;
    const transactionCount = parseInt(result.transactionCount) || 0;

    return {
      totalCredits,
      totalDebits,
      netAmount,
      transactionCount,
    };
  }

  // Get category-wise summary
  async getCategorySummary(
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    { category: string; totalAmount: number; transactionCount: number }[]
  > {
    const result = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .select([
        'ledger.category as category',
        'SUM(ledger.amount) as totalAmount',
        'COUNT(*) as transactionCount',
      ])
      .where('ledger.walletId = :walletId', { walletId })
      .andWhere('ledger.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('ledger.category')
      .orderBy('totalAmount', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      category: item.category,
      totalAmount: parseFloat(item.totalAmount) || 0,
      transactionCount: parseInt(item.transactionCount) || 0,
    }));
  }

  // Get recent transactions
  async getRecentTransactions(
    walletId: string,
    limit: number = 10
  ): Promise<WalletLedger[]> {
    return this.ledgerRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Get ledger entry by transaction ID
  async getLedgerEntriesByTransactionId(
    transactionId: string
  ): Promise<WalletLedger[]> {
    return this.ledgerRepository.find({
      where: { transactionId },
      order: { createdAt: 'ASC' },
    });
  }

  // Update ledger entry metadata
  async updateLedgerMetadata(
    ledgerId: string,
    metadata: Record<string, any>
  ): Promise<WalletLedger> {
    const ledger = await this.ledgerRepository.findOne({
      where: { id: ledgerId },
    });
    if (!ledger) {
      throw new Error('Ledger entry not found');
    }

    ledger.metadata = { ...ledger.metadata, ...metadata };
    return this.ledgerRepository.save(ledger);
  }

  // Delete ledger entry (for reconciliation)
  async deleteLedgerEntry(ledgerId: string): Promise<void> {
    await this.ledgerRepository.delete(ledgerId);
  }
}
