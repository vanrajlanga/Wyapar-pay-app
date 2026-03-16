import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Biller } from './biller.entity';

export enum BillerCategoryType {
  UTILITY = 'utility',
  TELECOM = 'telecom',
  INSURANCE = 'insurance',
  FINANCE = 'finance',
  EDUCATION = 'education',
  GOVERNMENT = 'government',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

@Entity('biller_categories')
@Index(['name'])
@Index(['type'])
export class BillerCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'enum', enum: BillerCategoryType })
  type: BillerCategoryType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Biller, (biller) => biller.category)
  billers: Biller[];
}
