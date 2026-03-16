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

export enum KycStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KycLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
}

@Entity('kyc_verifications')
@Index(['userId'], { unique: true })
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  status: KycStatus;

  @Column({ type: 'enum', enum: KycLevel, default: KycLevel.BASIC })
  level: KycLevel;

  @Column({ type: 'varchar', length: 20, nullable: true })
  panNumber: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaarNumber: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  passportNumber: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  drivingLicenseNumber: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  voterIdNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  pincode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fatherName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  motherName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  spouseName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  occupation: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employerName: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualIncome: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'json', nullable: true })
  verificationData: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  verificationAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.kycVerifications)
  @JoinColumn({ name: 'userId' })
  user: User;
}
