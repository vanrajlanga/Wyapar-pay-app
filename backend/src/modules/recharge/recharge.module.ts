import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RechargeController } from './recharge.controller';
import { RechargeService } from './recharge.service';
import { OperatorCircle } from '../../entities/operator-circle.entity';
import { Circle } from '../../entities/circle.entity';
import { Operator } from '../../entities/operator.entity';
import { UserFavorite } from '../../entities/user-favorite.entity';
import { RechargePlan } from '../../entities/recharge-plan.entity';
import { Transaction } from '../../entities/transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { User } from '../../entities/user.entity';
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';
import { KwikApiService } from './kwikapi/kwikapi.service';
import { KwikApiConfig } from './kwikapi/kwikapi.config';
import { RechargeExchangeService } from './rechargeexchange/rechargeexchange.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperatorCircle,
      Circle,
      Operator,
      UserFavorite,
      RechargePlan,
      Transaction,
      Wallet,
      User,
    ]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    NotificationEventsModule,
  ],
  controllers: [RechargeController],
  providers: [RechargeService, KwikApiService, KwikApiConfig, RechargeExchangeService],
  exports: [RechargeService, KwikApiService, RechargeExchangeService],
})
export class RechargeModule {}
