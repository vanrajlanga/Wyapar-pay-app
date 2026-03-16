import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletLedgerService } from './wallet-ledger.service';

import { Wallet } from '../../entities/wallet.entity';
import { WalletLedger } from '../../entities/wallet-ledger.entity';
import { User } from '../../entities/user.entity';
import { Currency } from '../../entities/currency.entity';
import { CommonModule } from '../../common/common.module';
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletLedger, User, Currency]),
    CommonModule,
    NotificationEventsModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletLedgerService],
  exports: [WalletService, WalletLedgerService],
})
export class WalletModule {}
