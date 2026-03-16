import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum QueueStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('notification_queue')
@Index(['scheduledFor', 'status'])
@Index(['status'])
export class NotificationQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.QUEUED })
  status: QueueStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

