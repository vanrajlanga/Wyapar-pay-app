import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum FavoriteType {
  MOBILE_RECHARGE = 'mobile_recharge',
  DTH_RECHARGE = 'dth_recharge',
  ELECTRICITY = 'electricity',
  GAS = 'gas',
  WATER = 'water',
  CREDIT_CARD = 'credit_card',
  LOAN = 'loan',
}

/**
 * User Favorite Entity
 * Stores user's favorite recharge/bill payment numbers for quick access
 */
@Entity('user_favorites')
@Index(['userId', 'type'])
@Index(['userId', 'accountNumber'], { unique: true })
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: FavoriteType,
  })
  type: FavoriteType;

  @Column({ type: 'varchar', length: 50 })
  accountNumber: string; // Phone number, DTH ID, Consumer number, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string; // e.g., "Mom's Phone", "Home DTH"

  @Column({ type: 'varchar', length: 50, nullable: true })
  operatorCode: string; // AIRTEL, TATASKY, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  operatorName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  circleCode: string; // For mobile recharge

  @Column({ type: 'varchar', length: 100, nullable: true })
  circleName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  lastRechargeAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRechargeDate: Date;

  @Column({ type: 'int', default: 0 })
  rechargeCount: number; // Number of times recharged

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    billerCode?: string;
    planId?: string;
    customFields?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
