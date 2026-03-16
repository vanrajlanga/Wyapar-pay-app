import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Biller } from './biller.entity';

export enum RechargePlanType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
  DATA = 'data',
  SMS = 'sms',
  COMBO = 'combo',
}

@Entity('recharge_plans')
@Index(['billerId'])
@Index(['type'])
@Index(['amount'])
@Index(['isActive'])
export class RechargePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  billerId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RechargePlanType })
  type: RechargePlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  validity: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dataLimit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  voiceLimit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  smsLimit: string;

  @Column({ type: 'json', nullable: true })
  benefits: any;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Biller, (biller) => biller.rechargePlans)
  @JoinColumn({ name: 'billerId' })
  biller: Biller;
}
