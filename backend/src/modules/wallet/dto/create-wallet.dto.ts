import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WalletType } from '../../../entities/wallet.entity';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Type of wallet',
    enum: WalletType,
    example: WalletType.PRIMARY,
  })
  @IsEnum(WalletType)
  type: WalletType;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
