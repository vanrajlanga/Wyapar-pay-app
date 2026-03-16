import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('commission_settings')
export class CommissionSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  category: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  rate: number;

  @Column({ length: 100 })
  label: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
