import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { UserSession } from './user-session.entity';
import { UserDocument } from './user-document.entity';
import { KycVerification, KycStatus } from './kyc-verification.entity';
import { Verification } from './verification.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_KYC = 'pending_kyc',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
  MODERATOR = 'moderator',
}

@Entity('users')
@Index(['phone'], { unique: true })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_KYC })
  status: UserStatus;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  kycStatus: KycStatus;

  // KYC Documents
  @Column({ type: 'varchar', length: 20, nullable: true })
  panNumber: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaarNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  pincode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state: string;

  // Security
  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profileImage?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // Push Notification Token
  @Column({ type: 'varchar', length: 255, nullable: true })
  pushToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  pushTokenLastUpdated?: Date;

  // Two-Factor Authentication
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret?: string;

  @Column({ type: 'json', nullable: true })
  twoFactorBackupCodes?: string[];

  // Preferences
  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => UserDocument, (document) => document.user)
  documents: UserDocument[];

  @OneToMany(() => KycVerification, (kyc) => kyc.user)
  kycVerifications: KycVerification[];

  @OneToMany(() => Verification, (verification) => verification.user)
  verifications: Verification[];
}
