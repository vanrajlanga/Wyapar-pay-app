import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  LedgerType,
  LedgerCategory,
} from '../../../entities/wallet-ledger.entity';

export class GetLedgerEntriesDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of entries per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by ledger type',
    enum: LedgerType,
    required: false,
  })
  @IsOptional()
  @IsEnum(LedgerType)
  type?: LedgerType;

  @ApiProperty({
    description: 'Filter by ledger category',
    enum: LedgerCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(LedgerCategory)
  category?: LedgerCategory;

  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
