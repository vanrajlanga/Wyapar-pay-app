import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  UserDocument,
  DocumentType,
  DocumentStatus,
} from '../../entities/user-document.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(UserDocument)
    private documentRepository: Repository<UserDocument>
  ) {}

  // Get document requirements
  getDocumentRequirements(kycLevel: string): any[] {
    const requirements = {
      basic: [
        {
          type: DocumentType.PAN_CARD,
          name: 'PAN Card',
          description: 'Permanent Account Number card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
      ],
      standard: [
        {
          type: DocumentType.PAN_CARD,
          name: 'PAN Card',
          description: 'Permanent Account Number card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
        {
          type: DocumentType.AADHAAR_FRONT,
          name: 'Aadhaar Card (Front)',
          description: 'Front side of Aadhaar card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
      ],
      enhanced: [
        {
          type: DocumentType.PAN_CARD,
          name: 'PAN Card',
          description: 'Permanent Account Number card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
        {
          type: DocumentType.AADHAAR_FRONT,
          name: 'Aadhaar Card (Front)',
          description: 'Front side of Aadhaar card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
        {
          type: DocumentType.AADHAAR_BACK,
          name: 'Aadhaar Card (Back)',
          description: 'Back side of Aadhaar card',
          required: true,
          formats: ['JPEG', 'PNG', 'PDF'],
          maxSize: '10MB',
        },
        {
          type: DocumentType.PROFILE_PHOTO,
          name: 'Profile Photo',
          description: 'Clear photo of your face',
          required: true,
          formats: ['JPEG', 'PNG'],
          maxSize: '5MB',
        },
      ],
    };

    return requirements[kycLevel] || requirements.basic;
  }

  // Get document status summary
  async getDocumentStatusSummary(userId: string): Promise<any> {
    const documents = await this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const summary = {
      total: documents.length,
      uploaded: documents.filter((d) => d.status === DocumentStatus.UPLOADED)
        .length,
      verified: documents.filter((d) => d.status === DocumentStatus.VERIFIED)
        .length,
      rejected: documents.filter((d) => d.status === DocumentStatus.REJECTED)
        .length,
      pending: documents.filter((d) => d.status === DocumentStatus.PENDING)
        .length,
      documents: documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        fileName: doc.fileName,
        uploadedAt: doc.createdAt,
        verifiedAt: doc.verifiedAt,
        rejectionReason: doc.rejectionReason,
      })),
    };

    return summary;
  }

  // Delete document
  async deleteDocument(userId: string, documentId: string): Promise<any> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status === DocumentStatus.VERIFIED) {
      throw new Error('Cannot delete verified document');
    }

    await this.documentRepository.remove(document);

    return {
      message: 'Document deleted successfully',
    };
  }
}
