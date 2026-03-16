import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateKycDto {
  @ApiProperty({
    description: 'PAN number',
    example: 'ABCDE1234F',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  panNumber?: string;

  @ApiProperty({
    description: 'Aadhaar number',
    example: '123456789012',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(12)
  aadhaarNumber?: string;

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
    description: 'Date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    example: 'Male',
    enum: ['Male', 'Female', 'Other'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: string;

  @ApiProperty({
    description: 'Father name',
    example: 'Robert Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fatherName?: string;

  @ApiProperty({
    description: 'Mother name',
    example: 'Jane Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherName?: string;

  @ApiProperty({
    description: 'Occupation',
    example: 'Software Engineer',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  occupation?: string;

  @ApiProperty({
    description: 'Annual income',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  annualIncome?: number;
}
