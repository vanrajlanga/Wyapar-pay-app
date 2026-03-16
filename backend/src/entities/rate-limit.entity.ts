import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RateLimitType {
  API_CALL = 'api_call',
  LOGIN_ATTEMPT = 'login_attempt',
  TRANSACTION = 'transaction',
  OTP_REQUEST = 'otp_request',
  PASSWORD_RESET = 'password_reset',
  KYC_SUBMISSION = 'kyc_submission',
}

@Entity('rate_limits')
@Index(['identifier'])
@Index(['type'])
@Index(['expiresAt'])
export class RateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  identifier: string;

  @Column({ type: 'enum', enum: RateLimitType })
  type: RateLimitType;

  @Column({ type: 'int', default: 1 })
  count: number;

  @Column({ type: 'int' })
  limit: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
