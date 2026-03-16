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

export enum DocumentType {
  PAN_CARD = 'pan_card',
  AADHAAR_FRONT = 'aadhaar_front',
  AADHAAR_BACK = 'aadhaar_back',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  VOTER_ID = 'voter_id',
  BANK_STATEMENT = 'bank_statement',
  UTILITY_BILL = 'utility_bill',
  PROFILE_PHOTO = 'profile_photo',
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('user_documents')
@Index(['userId', 'type'], { unique: true })
export class UserDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'json', nullable: true })
  extractedData: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'userId' })
  user: User;
}
