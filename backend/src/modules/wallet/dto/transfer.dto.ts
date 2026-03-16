import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    description: 'Amount to transfer',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Transfer description',
    example: 'Transfer to savings wallet',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
