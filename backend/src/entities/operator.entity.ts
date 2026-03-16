import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Operator Entity
 * Stores mobile operators and their KWIKAPI metadata
 * Cached from KWIKAPI Operator Codes API (limited to 15 hits/day)
 */
@Entity('operators')
@Index(['operatorId'], { unique: true })
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  operatorId: string; // KWIKAPI operator ID (e.g., "1", "3", "8")

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  reOperatorId: string | null; // RechargeExchange opcode (e.g., "10" for Airtel, "14" for Jio)

  @Column({ type: 'varchar', length: 100 })
  operatorName: string; // Operator name (e.g., "Airtel", "Reliance Jio")

  @Column({ type: 'varchar', length: 50 })
  serviceType: string; // "Prepaid" or "Postpaid"

  @Column({ type: 'varchar', length: 10 })
  status: string; // "1" = Active, "0" = Inactive

  @Column({ type: 'varchar', length: 10 })
  billerStatus: string; // "on" or "off"

  @Column({ type: 'varchar', length: 10, default: 'NO' })
  billFetch: string; // "YES" or "NO"

  @Column({ type: 'varchar', length: 50, default: 'NOT_SUPPORTED' })
  supportValidation: string; // Validation support status

  @Column({ type: 'varchar', length: 10, default: 'NO' })
  bbpsEnabled: string; // "YES" or "NO"

  @Column({ type: 'varchar', length: 255, nullable: true })
  message: string; // Message from KWIKAPI

  @Column({ type: 'text', nullable: true })
  description: string; // Additional description

  @Column({ type: 'int', default: 10 })
  amountMinimum: number; // Minimum recharge amount

  @Column({ type: 'int', default: 10000 })
  amountMaximum: number; // Maximum recharge amount

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Our internal active status

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Display order

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
