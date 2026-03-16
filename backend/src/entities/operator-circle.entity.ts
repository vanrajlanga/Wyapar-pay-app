import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Operator Circle Entity
 * Maps mobile operators to their service circles/states
 */
@Entity('operator_circles')
@Index(['operatorCode', 'circleCode'], { unique: true })
export class OperatorCircle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  operatorCode: string; // AIRTEL, JIO, VI, BSNL

  @Column({ type: 'varchar', length: 100 })
  operatorName: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  circleCode: string; // DELHI, MUMBAI, KOLKATA, etc.

  @Column({ type: 'varchar', length: 100 })
  circleName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stateCode: string; // DL, MH, WB, etc.

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    region?: string;
    timezone?: string;
    supportedServices?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
