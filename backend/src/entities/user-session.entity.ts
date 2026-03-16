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

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('user_sessions')
@Index(['userId', 'status'])
@Index(['token'], { unique: true })
@Index(['refreshToken'], { unique: true })
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceType: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;
}
