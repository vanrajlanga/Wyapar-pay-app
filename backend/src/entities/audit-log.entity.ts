import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditLogAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  TRANSACTION = 'transaction',
  PAYMENT = 'payment',
  KYC_SUBMIT = 'kyc_submit',
  KYC_APPROVE = 'kyc_approve',
  KYC_REJECT = 'kyc_reject',
  WALLET_CREATE = 'wallet_create',
  WALLET_LOCK = 'wallet_lock',
  WALLET_UNLOCK = 'wallet_unlock',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
}

export enum AuditLogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['status'])
@Index(['createdAt'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'enum', enum: AuditLogAction })
  action: AuditLogAction;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'enum', enum: AuditLogStatus })
  status: AuditLogStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  oldValues: any;

  @Column({ type: 'json', nullable: true })
  newValues: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
