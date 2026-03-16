import { IsNumber, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Amount in rupees (will be converted to paise)',
    example: 299,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'INR',
    default: 'INR',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Additional notes/metadata',
    example: { mobileNumber: '9876543210', operatorCode: 'AIRTEL' },
  })
  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;
}
