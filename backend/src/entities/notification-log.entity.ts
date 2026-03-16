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

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// NotificationType is now imported from templates/notification-templates.ts
// This enum is kept for backward compatibility but should use the one from templates
export type NotificationType = string;

@Entity('notification_logs')
@Index(['userId', 'status'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  // Provider-agnostic fields for any push notification provider
  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Provider-specific ticket/receipt ID' })
  providerTicketId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Provider-specific receipt ID for delivery tracking' })
  providerReceiptId: string;

  @Column({ type: 'json', nullable: true, comment: 'Provider-specific metadata and tracking info' })
  providerData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

