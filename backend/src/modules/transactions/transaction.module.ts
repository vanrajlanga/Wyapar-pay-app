import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, Wallet]),
    NotificationEventsModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
