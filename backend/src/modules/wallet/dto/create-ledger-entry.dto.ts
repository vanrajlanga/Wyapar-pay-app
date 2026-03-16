import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  LedgerType,
  LedgerCategory,
} from '../../../entities/wallet-ledger.entity';

export class CreateLedgerEntryDto {
  @ApiProperty({
    description: 'Wallet ID',
    example: 'uuid',
  })
  @IsUUID()
  walletId: string;

  @ApiProperty({
    description: 'Transaction ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiProperty({
    description: 'Ledger entry type',
    enum: LedgerType,
    example: LedgerType.CREDIT,
  })
  @IsEnum(LedgerType)
  type: LedgerType;

  @ApiProperty({
    description: 'Ledger entry category',
    enum: LedgerCategory,
    example: LedgerCategory.DEPOSIT,
  })
  @IsEnum(LedgerCategory)
  category: LedgerCategory;

  @ApiProperty({
    description: 'Amount',
    example: 1000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Balance before transaction',
    example: 5000,
  })
  @IsNumber()
  balanceBefore: number;

  @ApiProperty({
    description: 'Balance after transaction',
    example: 6000,
  })
  @IsNumber()
  balanceAfter: number;

  @ApiProperty({
    description: 'Description',
    example: 'Money added to wallet',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Reference',
    example: 'REF123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'bank_transfer' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
