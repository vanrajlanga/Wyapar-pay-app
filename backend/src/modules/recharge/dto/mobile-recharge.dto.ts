import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Matches,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
}

export class DetectOperatorDto {
  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  @Length(10, 10)
  mobileNumber: string;
}

export class GetPlansDto {
  @ApiProperty({ example: 'AIRTEL', description: 'Operator code' })
  @IsString()
  @IsNotEmpty()
  operatorCode: string;

  @ApiProperty({
    example: 'DELHI',
    description: 'Circle code',
    required: false,
  })
  @IsString()
  @IsOptional()
  circleCode?: string;

  @ApiProperty({
    example: '3',
    description: 'Operator ID from KWIKAPI (opid)',
    required: false,
  })
  @IsString()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({
    example: 'popular',
    description: 'Plan category',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;
}

export class MobileRechargeDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number to recharge',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  @Length(10, 10)
  mobileNumber: string;

  @ApiProperty({ example: 'AIRTEL', description: 'Operator code' })
  @IsString()
  @IsNotEmpty()
  operatorCode: string;

  @ApiProperty({ example: 'DELHI', description: 'Circle code', required: false })
  @IsString()
  @IsOptional()
  circleCode?: string;

  @ApiProperty({ example: 'plan-uuid', description: 'Recharge plan ID', required: false })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({ example: 299, description: 'Recharge amount' })
  @IsNumber()
  @Min(10)
  @Max(10000)
  amount: number;

  @ApiProperty({
    example: 'wallet',
    description: 'Payment method',
    enum: PaymentMethod,
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    example: 'OFFER10',
    description: 'Coupon code',
    required: false,
  })
  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class GetDthPlansDto {
  @ApiProperty({ example: '23', description: 'KWIKAPI DTH operator ID' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;
}

export class DthRechargeDto {
  @ApiProperty({ example: '1234567890', description: 'DTH subscriber/customer ID' })
  @IsString()
  @IsNotEmpty()
  subscriberId: string;

  @ApiProperty({ example: '23', description: 'KWIKAPI DTH operator ID' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @ApiProperty({ example: 'AIRTEL DTH', description: 'Operator name' })
  @IsString()
  @IsNotEmpty()
  operatorName: string;

  @ApiProperty({ example: 299, description: 'Recharge amount' })
  @IsNumber()
  @Min(10)
  @Max(65000)
  amount: number;

  @ApiProperty({ example: 'upi', description: 'Payment method', enum: PaymentMethod, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: 'Family HD Pack - 1 Month', description: 'Plan name', required: false })
  @IsString()
  @IsOptional()
  planName?: string;
}

export class AddFavoriteDto {
  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  @Length(10, 10)
  accountNumber: string;

  @ApiProperty({ example: 'mobile_recharge', description: 'Favorite type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: "Mom's Phone",
    description: 'Nickname for the number',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    example: 'AIRTEL',
    description: 'Operator code',
    required: false,
  })
  @IsString()
  @IsOptional()
  operatorCode?: string;

  @ApiProperty({
    example: 'DELHI',
    description: 'Circle code',
    required: false,
  })
  @IsString()
  @IsOptional()
  circleCode?: string;
}

export class ValidateRechargeDto {
  @ApiProperty({ example: '9876543210', description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({ example: 'AIRTEL', description: 'Operator code' })
  @IsString()
  @IsNotEmpty()
  operatorCode: string;

  @ApiProperty({ example: 299, description: 'Amount' })
  @IsNumber()
  @Min(10)
  amount: number;
}
