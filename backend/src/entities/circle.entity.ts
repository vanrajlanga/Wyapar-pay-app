import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Circle Entity
 * Stores telecom circles/regions for recharge services
 * Cached from KWIKAPI (limited to 2 hits/day)
 */
@Entity('circles')
@Index(['circleCode'], { unique: true })
export class Circle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  circleCode: string; // Numeric code from KWIKAPI (e.g., "1", "4", "5")

  @Column({ type: 'varchar', length: 100 })
  circleName: string; // Full name (e.g., "DELHI (DL)", "Maharashtra (MH)")

  @Column({ type: 'varchar', length: 50, nullable: true })
  stateCode: string; // Extracted state code (e.g., "DL", "MH")

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
