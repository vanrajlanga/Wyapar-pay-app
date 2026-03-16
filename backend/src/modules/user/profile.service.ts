import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // Get profile completion percentage
  async getProfileCompletion(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const fields = [
      'name',
      'email',
      'phone',
      'dateOfBirth',
      'address',
      'pincode',
      'city',
      'state',
    ];

    const completedFields = fields.filter((field) => user[field]);
    const completionPercentage = Math.round(
      (completedFields.length / fields.length) * 100
    );

    return {
      completionPercentage,
      completedFields: completedFields.length,
      totalFields: fields.length,
      missingFields: fields.filter((field) => !user[field]),
    };
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallets', 'transactions'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalBalance =
      user.wallets?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
    const totalTransactions = user.transactions?.length || 0;
    const successfulTransactions =
      user.transactions?.filter((t) => t.status === 'success').length || 0;

    return {
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
      totalBalance,
      totalTransactions,
      successfulTransactions,
      successRate:
        totalTransactions > 0
          ? Math.round((successfulTransactions / totalTransactions) * 100)
          : 0,
      kycStatus: user.kycStatus,
      isVerified: user.isEmailVerified && user.isPhoneVerified,
    };
  }
}
