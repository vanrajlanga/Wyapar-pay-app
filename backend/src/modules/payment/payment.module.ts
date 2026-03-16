import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay/razorpay.service';
import { RazorpayConfig } from './razorpay/razorpay.config';
import { RechargeExchangeService } from '../recharge/rechargeexchange/rechargeexchange.service';

import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { Operator } from '../../entities/operator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, Operator]),
    ConfigModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService, RazorpayConfig, RechargeExchangeService],
  exports: [PaymentService, RazorpayService],
})
export class PaymentModule {}
