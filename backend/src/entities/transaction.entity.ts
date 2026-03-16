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
import { Wallet } from './wallet.entity';
import { WalletLedger } from './wallet-ledger.entity';
import { Biller } from './biller.entity';

export enum TransactionType {
  RECHARGE = 'recharge',
  BILL_PAYMENT = 'bill_payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

export enum TransactionCategory {
  // Recharge Categories
  MOBILE_RECHARGE = 'mobile_recharge',
  DTH_RECHARGE = 'dth_recharge',
  BROADBAND_RECHARGE = 'broadband_recharge',

  // Bill Payment Categories
  ELECTRICITY_BILL = 'electricity_bill',
  WATER_BILL = 'water_bill',
  GAS_BILL = 'gas_bill',
  CREDIT_CARD_BILL = 'credit_card_bill',
  LOAN_REPAYMENT = 'loan_repayment',
  INSURANCE_PREMIUM = 'insurance_premium',
  FASTAG_RECHARGE = 'fastag_recharge',

  // Transfer Categories
  UPI_TRANSFER = 'upi_transfer',
  BANK_TRANSFER = 'bank_transfer',
  WALLET_TRANSFER = 'wallet_transfer',

  // Other Categories
  CASHBACK_EARNED = 'cashback_earned',
  REFUND_RECEIVED = 'refund_received',
  WALLET_TOPUP = 'wallet_topup',
  WITHDRAWAL_TO_BANK = 'withdrawal_to_bank',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['category', 'createdAt'])
@Index(['gatewayRef'])
@Index(['upiRef'])
@Index(['customerRef'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  walletId: string;

  @Column({ type: 'uuid', nullable: true })
  billerId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionCategory, nullable: true })
  category?: TransactionCategory;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gatewayRef: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upiRef: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankRef: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerRef: string;

  @Column({ type: 'json', nullable: true })
  gatewayResponse: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @ManyToOne(() => Biller, (biller) => biller.transactions)
  @JoinColumn({ name: 'billerId' })
  biller: Biller;

  @OneToMany(() => WalletLedger, (ledger) => ledger.transaction)
  ledgerEntries: WalletLedger[];

  // Computed properties
  get isCredit(): boolean {
    return [
      TransactionType.CASHBACK,
      TransactionType.REFUND,
      TransactionType.DEPOSIT,
    ].includes(this.type);
  }

  get isDebit(): boolean {
    return [
      TransactionType.RECHARGE,
      TransactionType.BILL_PAYMENT,
      TransactionType.TRANSFER,
      TransactionType.WITHDRAWAL,
    ].includes(this.type);
  }

  get displayAmount(): number {
    return this.isCredit ? this.amount : -this.amount;
  }

  get formattedDescription(): string {
    if (this.description) return this.description;

    // Generate description based on category
    switch (this.category) {
      case TransactionCategory.MOBILE_RECHARGE:
        return `Mobile recharge for ${this.metadata?.mobileNumber || 'N/A'}`;
      case TransactionCategory.DTH_RECHARGE:
        return `DTH recharge for ${this.metadata?.customerId || 'N/A'}`;
      case TransactionCategory.ELECTRICITY_BILL:
        return `Electricity bill payment`;
      case TransactionCategory.CREDIT_CARD_BILL:
        return `Credit card bill payment`;
      case TransactionCategory.UPI_TRANSFER:
        return `UPI transfer to ${this.metadata?.recipientName || 'N/A'}`;
      case TransactionCategory.WALLET_TOPUP:
        return `Wallet top-up`;
      case TransactionCategory.CASHBACK_EARNED:
        return `Cashback earned`;
      default:
        return (
          this.type.charAt(0).toUpperCase() +
          this.type.slice(1).replace('_', ' ')
        );
    }
  }

  get categoryIcon(): string {
    switch (this.category) {
      case TransactionCategory.MOBILE_RECHARGE:
        return 'phone-android';
      case TransactionCategory.DTH_RECHARGE:
        return 'tv';
      case TransactionCategory.BROADBAND_RECHARGE:
        return 'wifi';
      case TransactionCategory.ELECTRICITY_BILL:
        return 'flash-on';
      case TransactionCategory.WATER_BILL:
        return 'water-drop';
      case TransactionCategory.GAS_BILL:
        return 'local-gas-station';
      case TransactionCategory.CREDIT_CARD_BILL:
        return 'credit-card';
      case TransactionCategory.LOAN_REPAYMENT:
        return 'account-balance';
      case TransactionCategory.INSURANCE_PREMIUM:
        return 'security';
      case TransactionCategory.FASTAG_RECHARGE:
        return 'directions-car';
      case TransactionCategory.UPI_TRANSFER:
        return 'account-balance-wallet';
      case TransactionCategory.BANK_TRANSFER:
        return 'account-balance';
      case TransactionCategory.WALLET_TRANSFER:
        return 'swap-horiz';
      case TransactionCategory.CASHBACK_EARNED:
        return 'monetization-on';
      case TransactionCategory.REFUND_RECEIVED:
        return 'undo';
      case TransactionCategory.WALLET_TOPUP:
        return 'add-circle';
      case TransactionCategory.WITHDRAWAL_TO_BANK:
        return 'arrow-downward';
      default:
        return 'receipt';
    }
  }
}
