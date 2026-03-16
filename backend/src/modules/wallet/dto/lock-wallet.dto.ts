import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LockWalletDto {
  @ApiProperty({
    description: 'Reason for locking the wallet',
    example: 'Suspicious activity detected',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
