import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Razorpay payment order' })
  @ApiResponse({ status: 200, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    try {
      // Debug logging
      this.logger.log('DEBUG: req.user =', JSON.stringify(req.user));

      // userId is optional for guest users
      const userId = req.user?.id || null;

      if (userId) {
        this.logger.log(`Creating payment order for user: ${userId}, amount: ₹${createOrderDto.amount}`);
      } else {
        this.logger.log(`Creating payment order for guest, amount: ₹${createOrderDto.amount}`);
      }

      const order = await this.paymentService.createOrder(userId, createOrderDto);

      return {
        success: true,
        message: 'Order created successfully',
        data: order,
      };
    } catch (error) {
      this.logger.error('Failed to create order:', error);
      throw new BadRequestException(error.message || 'Failed to create order');
    }
  }

  @Public()
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payment failed' })
  async verifyPayment(@Request() req: any, @Body() verifyPaymentDto: VerifyPaymentDto) {
    try {
      // userId is optional for guest users
      const userId = req.user?.id || null;

      if (userId) {
        this.logger.log(`Verifying payment for user: ${userId}, payment_id: ${verifyPaymentDto.razorpay_payment_id}`);
      } else {
        this.logger.log(`Verifying payment for guest, payment_id: ${verifyPaymentDto.razorpay_payment_id}`);
      }

      const result = await this.paymentService.verifyPayment(userId, verifyPaymentDto);

      return {
        success: true,
        message: 'Payment verified successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      throw new BadRequestException(error.message || 'Payment verification failed');
    }
  }
}
