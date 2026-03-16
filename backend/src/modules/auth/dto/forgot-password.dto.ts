import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'user@example.com or 9876543210',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
