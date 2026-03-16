import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Wallet, WalletType, WalletStatus } from '../../entities/wallet.entity';
import {
  WalletLedger,
  LedgerType,
  LedgerCategory,
} from '../../entities/wallet-ledger.entity';
import { User } from '../../entities/user.entity';
import { Currency } from '../../entities/currency.entity';
import { WalletLedgerService } from './wallet-ledger.service';
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';

import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransferDto } from './dto/transfer.dto';
import { LockWalletDto } from './dto/lock-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    private walletLedgerService: WalletLedgerService,
    private notificationEmitter: NotificationEmitterService
  ) {}

  // Create wallet for user
  async createWallet(
    userId: string,
    createWalletDto: CreateWalletDto
  ): Promise<Wallet> {
    const { type = WalletType.PRIMARY } = createWalletDto;

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get default currency
    const defaultCurrency = await this.currencyRepository.findOne({
      where: { isDefault: true },
    });

    // Check if wallet already exists for this type
    const existingWallet = await this.walletRepository.findOne({
      where: { userId, type },
    });

    if (existingWallet) {
      throw new BadRequestException(`Wallet of type ${type} already exists`);
    }

    // Create wallet
    const wallet = this.walletRepository.create({
      userId,
      currencyId: defaultCurrency?.id,
      type,
      currency: defaultCurrency?.code || 'INR',
      balance: 0,
      lockedBalance: 0,
      availableBalance: 0,
      dailyLimit: type === WalletType.BUSINESS ? 1000000 : 100000,
      monthlyLimit: type === WalletType.BUSINESS ? 10000000 : 1000000,
      lastResetDate: new Date(),
    });

    return this.walletRepository.save(wallet);
  }

  // Get user wallets
  async getUserWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId, status: WalletStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
  }

  // Get wallet by ID
  async getWalletById(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  // Get primary wallet
  async getPrimaryWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, type: WalletType.PRIMARY, status: WalletStatus.ACTIVE },
    });

    if (!wallet) {
      // Create primary wallet if it doesn't exist
      return this.createWallet(userId, { type: WalletType.PRIMARY });
    }

    return wallet;
  }

  // Add money to wallet
  async addMoney(
    walletId: string,
    userId: string,
    amount: number,
    transactionId: string,
    description?: string
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Use database transaction with pessimistic locking to prevent race conditions
    return await this.walletRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Lock the wallet row with FOR UPDATE to prevent concurrent modifications
        const wallet = await transactionalEntityManager
          .createQueryBuilder(Wallet, 'wallet')
          .setLock('pessimistic_write')
          .where('wallet.id = :walletId', { walletId })
          .andWhere('wallet.userId = :userId', { userId })
          .getOne();

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (wallet.status !== WalletStatus.ACTIVE) {
          throw new ForbiddenException('Wallet is not active');
        }

        // Check daily/monthly limits
        await this.checkLimits(wallet, amount);

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        // Update wallet balance
        wallet.balance = balanceAfter;
        wallet.availableBalance = wallet.balance - wallet.lockedBalance;
        wallet.dailySpent += amount;
        wallet.monthlySpent += amount;

        // Save within transaction
        const updatedWallet = await transactionalEntityManager.save(wallet);

        // Create ledger entry within transaction
        await this.walletLedgerService.createLedgerEntry({
          walletId: wallet.id,
          transactionId,
          type: LedgerType.CREDIT,
          category: LedgerCategory.DEPOSIT,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || 'Money added to wallet',
        });

        // Emit wallet topup event if it's a topup (loosely coupled)
        const isTopup = description && (
          description.toLowerCase().includes('topup') ||
          description.toLowerCase().includes('add money') ||
          description.toLowerCase().includes('wallet topup')
        );

        if (isTopup) {
          await this.notificationEmitter.emitWalletTopupSuccess(userId, {
            transactionId,
            amount,
            currency: '₹',
          });
        }

        return updatedWallet;
      }
    );
  }

  // Deduct money from wallet
  async deductMoney(
    walletId: string,
    userId: string,
    amount: number,
    transactionId: string,
    category: LedgerCategory,
    description?: string
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Use database transaction with pessimistic locking to prevent race conditions
    return await this.walletRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Lock the wallet row with FOR UPDATE to prevent concurrent modifications
        const wallet = await transactionalEntityManager
          .createQueryBuilder(Wallet, 'wallet')
          .setLock('pessimistic_write')
          .where('wallet.id = :walletId', { walletId })
          .andWhere('wallet.userId = :userId', { userId })
          .getOne();

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (wallet.status !== WalletStatus.ACTIVE) {
          throw new ForbiddenException('Wallet is not active');
        }

        if (wallet.availableBalance < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        // Check daily/monthly limits
        await this.checkLimits(wallet, amount);

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // Update wallet balance
        wallet.balance = balanceAfter;
        wallet.availableBalance = wallet.balance - wallet.lockedBalance;
        wallet.dailySpent += amount;
        wallet.monthlySpent += amount;

        // Save within transaction
        const updatedWallet = await transactionalEntityManager.save(wallet);

        // Create ledger entry within transaction
        await this.walletLedgerService.createLedgerEntry({
          walletId: wallet.id,
          transactionId,
          type: LedgerType.DEBIT,
          category,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || 'Money deducted from wallet',
        });

        return updatedWallet;
      }
    );
  }

  // Lock money in wallet
  async lockMoney(
    walletId: string,
    userId: string,
    amount: number,
    transactionId: string,
    description?: string
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Use database transaction with pessimistic locking to prevent race conditions
    return await this.walletRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Lock the wallet row with FOR UPDATE to prevent concurrent modifications
        const wallet = await transactionalEntityManager
          .createQueryBuilder(Wallet, 'wallet')
          .setLock('pessimistic_write')
          .where('wallet.id = :walletId', { walletId })
          .andWhere('wallet.userId = :userId', { userId })
          .getOne();

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (wallet.availableBalance < amount) {
          throw new BadRequestException('Insufficient available balance');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore; // Balance remains same, only available changes

        // Update wallet
        wallet.lockedBalance += amount;
        wallet.availableBalance = wallet.balance - wallet.lockedBalance;

        // Save within transaction
        const updatedWallet = await transactionalEntityManager.save(wallet);

        // Create ledger entry within transaction
        await this.walletLedgerService.createLedgerEntry({
          walletId: wallet.id,
          transactionId,
          type: LedgerType.DEBIT,
          category: LedgerCategory.ADJUSTMENT,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || 'Money locked in wallet',
          metadata: { locked: true },
        });

        return updatedWallet;
      }
    );
  }

  // Unlock money in wallet
  async unlockMoney(
    walletId: string,
    userId: string,
    amount: number,
    transactionId: string,
    description?: string
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Use database transaction with pessimistic locking to prevent race conditions
    return await this.walletRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Lock the wallet row with FOR UPDATE to prevent concurrent modifications
        const wallet = await transactionalEntityManager
          .createQueryBuilder(Wallet, 'wallet')
          .setLock('pessimistic_write')
          .where('wallet.id = :walletId', { walletId })
          .andWhere('wallet.userId = :userId', { userId })
          .getOne();

        if (!wallet) {
          throw new NotFoundException('Wallet not found');
        }

        if (wallet.lockedBalance < amount) {
          throw new BadRequestException('Insufficient locked balance');
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore; // Balance remains same, only available changes

        // Update wallet
        wallet.lockedBalance -= amount;
        wallet.availableBalance = wallet.balance - wallet.lockedBalance;

        // Save within transaction
        const updatedWallet = await transactionalEntityManager.save(wallet);

        // Create ledger entry within transaction
        await this.walletLedgerService.createLedgerEntry({
          walletId: wallet.id,
          transactionId,
          type: LedgerType.CREDIT,
          category: LedgerCategory.ADJUSTMENT,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || 'Money unlocked in wallet',
          metadata: { unlocked: true },
        });

        return updatedWallet;
      }
    );
  }

  // Transfer money between wallets
  async transferMoney(
    fromWalletId: string,
    toWalletId: string,
    userId: string,
    transferDto: TransferDto
  ): Promise<{ fromWallet: Wallet; toWallet: Wallet }> {
    const { amount, description } = transferDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Get both wallets
    const fromWallet = await this.getWalletById(fromWalletId, userId);
    const toWallet = await this.getWalletById(toWalletId, userId);

    if (
      fromWallet.status !== WalletStatus.ACTIVE ||
      toWallet.status !== WalletStatus.ACTIVE
    ) {
      throw new ForbiddenException('One or both wallets are not active');
    }

    if (fromWallet.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance in source wallet');
    }

    // Check limits for both wallets
    await this.checkLimits(fromWallet, amount);
    await this.checkLimits(toWallet, amount);

    const transactionId = `transfer_${Date.now()}`;

    // Deduct from source wallet
    await this.deductMoney(
      fromWalletId,
      userId,
      amount,
      transactionId,
      LedgerCategory.TRANSFER,
      description || `Transfer to ${toWallet.type} wallet`
    );

    // Add to destination wallet
    await this.addMoney(
      toWalletId,
      userId,
      amount,
      transactionId,
      description || `Transfer from ${fromWallet.type} wallet`
    );

    // Return updated wallets
    const updatedFromWallet = await this.getWalletById(fromWalletId, userId);
    const updatedToWallet = await this.getWalletById(toWalletId, userId);

    return {
      fromWallet: updatedFromWallet,
      toWallet: updatedToWallet,
    };
  }

  // Lock wallet
  async lockWallet(
    walletId: string,
    userId: string,
    lockWalletDto: LockWalletDto
  ): Promise<Wallet> {
    const { reason } = lockWalletDto;

    const wallet = await this.getWalletById(walletId, userId);
    wallet.status = WalletStatus.SUSPENDED;

    await this.walletRepository.save(wallet);

    // Create ledger entry
    await this.walletLedgerService.createLedgerEntry({
      walletId: wallet.id,
      transactionId: `lock_${Date.now()}`,
      type: LedgerType.DEBIT,
      category: LedgerCategory.ADJUSTMENT,
      amount: 0,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `Wallet locked: ${reason}`,
      metadata: { locked: true, reason },
    });

    return wallet;
  }

  // Unlock wallet
  async unlockWallet(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId, userId);
    wallet.status = WalletStatus.ACTIVE;

    await this.walletRepository.save(wallet);

    // Create ledger entry
    await this.walletLedgerService.createLedgerEntry({
      walletId: wallet.id,
      transactionId: `unlock_${Date.now()}`,
      type: LedgerType.CREDIT,
      category: LedgerCategory.ADJUSTMENT,
      amount: 0,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: 'Wallet unlocked',
      metadata: { unlocked: true },
    });

    return wallet;
  }

  // Reset daily/monthly limits
  async resetLimits(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId, userId);

    const today = new Date();
    const lastReset = wallet.lastResetDate;

    // Reset daily limits if it's a new day
    if (today.toDateString() !== lastReset.toDateString()) {
      wallet.dailySpent = 0;
    }

    // Reset monthly limits if it's a new month
    if (
      today.getMonth() !== lastReset.getMonth() ||
      today.getFullYear() !== lastReset.getFullYear()
    ) {
      wallet.monthlySpent = 0;
    }

    wallet.lastResetDate = today;
    await this.walletRepository.save(wallet);

    return wallet;
  }

  // Private methods
  private async checkLimits(wallet: Wallet, amount: number): Promise<void> {
    // Check daily limit
    if (wallet.dailySpent + amount > wallet.dailyLimit) {
      throw new BadRequestException('Daily transaction limit exceeded');
    }

    // Check monthly limit
    if (wallet.monthlySpent + amount > wallet.monthlyLimit) {
      throw new BadRequestException('Monthly transaction limit exceeded');
    }
  }
}
