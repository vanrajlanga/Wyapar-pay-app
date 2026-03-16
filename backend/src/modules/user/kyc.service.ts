import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import {
  KycVerification,
  KycStatus,
  KycLevel,
} from '../../entities/kyc-verification.entity';
import {
  UserDocument,
  DocumentStatus,
} from '../../entities/user-document.entity';
import { User } from '../../entities/user.entity';
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycVerification)
    private kycRepository: Repository<KycVerification>,
    @InjectRepository(UserDocument)
    private documentRepository: Repository<UserDocument>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationEmitter: NotificationEmitterService,
    @Optional()
    @InjectQueue('kyc-processing')
    private kycQueue?: Queue
  ) {}

  // Verify KYC documents
  async verifyDocuments(userId: string): Promise<any> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      throw new Error('KYC record not found');
    }

    const documents = await this.documentRepository.find({
      where: { userId, status: DocumentStatus.UPLOADED },
    });

    if (documents.length === 0) {
      throw new Error('No documents to verify');
    }

    // Add verification job to queue (if Redis is enabled)
    if (this.kycQueue) {
      await this.kycQueue.add('verify-documents', {
        userId,
        kycId: kyc.id,
        documentIds: documents.map((doc) => doc.id),
      });
    } else {
      // Process synchronously when Redis is disabled
      console.log('Processing KYC verification synchronously (Redis disabled)');
      // TODO: Add synchronous processing logic here
    }

    return {
      message: 'Document verification initiated',
      status: 'processing',
      estimatedTime: '24-48 hours',
    };
  }

  // Get KYC verification history
  async getVerificationHistory(userId: string): Promise<any> {
    const kyc = await this.kycRepository.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });

    if (!kyc) {
      return { history: [], status: 'not_started' };
    }

    const documents = await this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      status: kyc.status,
      level: kyc.level,
      history: [
        {
          action: 'KYC Started',
          timestamp: kyc.createdAt,
          status: 'completed',
        },
        {
          action: 'Documents Uploaded',
          timestamp: documents[0]?.createdAt,
          status: documents.length > 0 ? 'completed' : 'pending',
        },
        {
          action: 'Verification Review',
          timestamp: kyc.verifiedAt,
          status: kyc.status === KycStatus.VERIFIED ? 'completed' : 'pending',
        },
      ],
    };
  }

  // Update KYC status (admin function)
  async updateKycStatus(
    userId: string,
    status: KycStatus,
    rejectionReason?: string
  ): Promise<any> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      throw new Error('KYC record not found');
    }

    kyc.status = status;
    kyc.rejectionReason = rejectionReason;
    kyc.verifiedAt = status === KycStatus.VERIFIED ? new Date() : null;

    await this.kycRepository.save(kyc);

    // Emit KYC status event (loosely coupled)
    if (status === KycStatus.VERIFIED) {
      await this.notificationEmitter.emitKycApproved(userId);
    } else if (status === KycStatus.REJECTED) {
      await this.notificationEmitter.emitKycRejected(userId, {
        reason: rejectionReason || 'KYC verification rejected',
      });
    }

    return {
      message: `KYC status updated to ${status}`,
      status: kyc.status,
    };
  }
}
