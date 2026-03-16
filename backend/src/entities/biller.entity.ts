import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { RechargePlan } from './recharge-plan.entity';
import { BillerCategory } from './biller-category.entity';

export enum BillerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('billers')
@Index(['categoryId', 'status'])
@Index(['billerCode'], { unique: true })
export class Biller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  billerCode: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'enum', enum: BillerStatus, default: BillerStatus.ACTIVE })
  status: BillerStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  logo: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  minAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  maxAmount: number;

  @Column({ type: 'boolean', default: true })
  supportsPartialPayment: boolean;

  @Column({ type: 'boolean', default: true })
  supportsAdvancePayment: boolean;

  @Column({ type: 'int', default: 0 })
  processingTimeMinutes: number;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  validationRules: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apiEndpoint: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apiKey: string;

  @Column({ type: 'boolean', default: false })
  requiresOtp: boolean;

  @Column({ type: 'boolean', default: false })
  requiresCustomerId: boolean;

  @Column({ type: 'boolean', default: false })
  requiresAccountNumber: boolean;

  @Column({ type: 'boolean', default: false })
  requiresMobileNumber: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  supportedStates: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  supportedCities: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Transaction, (transaction) => transaction.biller)
  transactions: Transaction[];

  @OneToMany(() => RechargePlan, (rechargePlan) => rechargePlan.biller)
  rechargePlans: RechargePlan[];

  @ManyToOne(() => BillerCategory, (category) => category.billers)
  @JoinColumn({ name: 'categoryId' })
  category: BillerCategory;
}
