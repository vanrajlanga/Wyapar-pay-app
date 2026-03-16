import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';

export enum LedgerType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum LedgerCategory {
  RECHARGE = 'recharge',
  BILL_PAYMENT = 'bill_payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  COMMISSION = 'commission',
  PENALTY = 'penalty',
  ADJUSTMENT = 'adjustment',
  CASHBACK = 'cashback',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

@Entity('wallet_ledger')
@Index(['walletId', 'createdAt'])
@Index(['transactionId'])
@Index(['type', 'category'])
export class WalletLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string;

  @Column({ type: 'enum', enum: LedgerType })
  type: LedgerType;

  @Column({ type: 'enum', enum: LedgerCategory })
  category: LedgerCategory;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Wallet, (wallet) => wallet.ledgerEntries)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @ManyToOne(() => Transaction, (transaction) => transaction.ledgerEntries)
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;
}
