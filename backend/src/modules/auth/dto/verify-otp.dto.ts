import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number or email',
    example: '9876543210 or user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: 'Type of OTP verification',
    example: 'phone_verification',
    enum: ['phone_verification', 'email_verification', 'password_reset'],
  })
  @IsString()
  @IsIn(['phone_verification', 'email_verification', 'password_reset'])
  type: string;
}
