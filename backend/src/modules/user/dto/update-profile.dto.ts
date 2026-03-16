import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Phone number (10 digits)',
    example: '9876543210',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone number must be a valid 10-digit Indian mobile number',
  })
  phone?: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'SecurePass123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main Street, Apartment 4B',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({
    description: 'Pincode',
    example: '110001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  pincode?: string;

  @ApiProperty({
    description: 'City',
    example: 'New Delhi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiProperty({
    description: 'State',
    example: 'Delhi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://s3.amazonaws.com/bucket/profile-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;
}
