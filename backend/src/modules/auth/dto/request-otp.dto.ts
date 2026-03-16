import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Phone number or email address',
    example: '9876543210 or user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
