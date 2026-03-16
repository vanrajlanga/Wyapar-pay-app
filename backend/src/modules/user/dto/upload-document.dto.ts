import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { DocumentType } from '../../../entities/user-document.entity';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.PAN_CARD,
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    description: 'Document expiry date',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
