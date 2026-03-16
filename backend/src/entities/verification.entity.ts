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

export enum VerificationType {
  EMAIL = 'email',
  PASSWORD_RESET = 'password_reset',
  PHONE = 'phone',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  USED = 'used',
}

@Entity('verifications')
@Index(['userId', 'type', 'status'])
@Index(['code'], { unique: true })
@Index(['expiresAt'])
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: VerificationType })
  type: VerificationType;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.verifications)
  @JoinColumn({ name: 'userId' })
  user: User;
}
