import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WalletLedger } from './wallet-ledger.entity';
import { Transaction } from './transaction.entity';
import { Currency } from './currency.entity';

export enum WalletType {
  PRIMARY = 'primary',
  SAVINGS = 'savings',
  BUSINESS = 'business',
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Entity('wallets')
@Index(['userId', 'type'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  currencyId: string;

  @Column({ type: 'enum', enum: WalletType, default: WalletType.PRIMARY })
  type: WalletType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  lockedBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ type: 'enum', enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyLimit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyLimit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailySpent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlySpent: number;

  @Column({ type: 'date', nullable: true })
  lastResetDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currencyId' })
  currencyInfo: Currency;

  @OneToMany(() => WalletLedger, (ledger) => ledger.wallet)
  ledgerEntries: WalletLedger[];

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  // Computed properties
  get totalBalance(): number {
    return this.balance + this.lockedBalance;
  }
}
