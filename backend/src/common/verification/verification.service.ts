import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Verification,
  VerificationType,
  VerificationStatus,
} from '../../entities/verification.entity';
import { User } from '../../entities/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService
  ) {}

  /**
   * Generate a random verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a new verification record
   */
  async createVerification(
    userId: string,
    type: VerificationType,
    expiryMinutes: number = 1440, // 24 hours default
    ipAddress?: string,
    userAgent?: string
  ): Promise<Verification> {
    // Invalidate any existing pending verifications of the same type
    await this.verificationRepository.update(
      {
        userId,
        type,
        status: VerificationStatus.PENDING,
      },
      {
        status: VerificationStatus.EXPIRED,
      }
    );

    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const verification = this.verificationRepository.create({
      userId,
      type,
      code,
      expiresAt,
      ipAddress,
      userAgent,
      status: VerificationStatus.PENDING,
    });

    return await this.verificationRepository.save(verification);
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        this.logger.warn(`User ${userId} email is already verified`);
        return false;
      }

      const verification = await this.createVerification(
        userId,
        VerificationType.EMAIL,
        1440, // 24 hours
        ipAddress,
        userAgent
      );

      const verificationLink = `${process.env.FRONTEND_URL || 'https://wyaparpay.com'}/verify-email?code=${verification.code}&userId=${userId}`;

      // Log verification code to console for testing
      this.logger.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL VERIFICATION CODE FOR TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: ${user.name} (${user.email})
Code: ${verification.code}
Link: ${verificationLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);

      const success = await this.emailService.sendAccountVerificationEmail(
        user.email,
        user.name,
        verification.code,
        verificationLink
      );

      if (success) {
        this.logger.log(`✅ Email verification sent to user ${userId}`);
      } else {
        this.logger.warn(
          `⚠️ Email failed to send, but code is logged above for testing`
        );
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Failed to send email verification for user ${userId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Verify email using verification code
   */
  async verifyEmail(userId: string, code: string): Promise<boolean> {
    try {
      const verification = await this.verificationRepository.findOne({
        where: {
          userId,
          code,
          type: VerificationType.EMAIL,
          status: VerificationStatus.PENDING,
        },
      });

      if (!verification) {
        this.logger.warn(`Invalid verification code for user ${userId}`);
        return false;
      }

      if (new Date() > verification.expiresAt) {
        await this.verificationRepository.update(verification.id, {
          status: VerificationStatus.EXPIRED,
        });
        this.logger.warn(`Expired verification code for user ${userId}`);
        return false;
      }

      // Mark verification as used
      await this.verificationRepository.update(verification.id, {
        status: VerificationStatus.USED,
        verifiedAt: new Date(),
      });

      // Update user email verification status
      await this.userRepository.update(userId, {
        isEmailVerified: true,
      });

      // Send welcome email
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        await this.emailService.sendWelcomeEmail(
          user.email,
          user.name,
          user.phone
        );
      }

      this.logger.log(`Email verified successfully for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify email for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send password reset verification
   */
  async sendPasswordResetVerification(
    userEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: userEmail },
      });
      if (!user) {
        // Don't reveal that user doesn't exist
        this.logger.warn(
          `Password reset requested for non-existent email: ${userEmail}`
        );
        return true; // Return true to not reveal user existence
      }

      const verification = await this.createVerification(
        user.id,
        VerificationType.PASSWORD_RESET,
        15, // 15 minutes
        ipAddress,
        userAgent
      );

      const resetLink = `${process.env.FRONTEND_URL || 'https://wyaparpay.com'}/reset-password?code=${verification.code}&userId=${user.id}`;

      const success = await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        verification.code,
        resetLink,
        ipAddress,
        userAgent
      );

      if (success) {
        this.logger.log(`Password reset email sent to user ${user.id}`);
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email for ${userEmail}:`,
        error
      );
      return false;
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(
    userId: string,
    code: string
  ): Promise<boolean> {
    try {
      const verification = await this.verificationRepository.findOne({
        where: {
          userId,
          code,
          type: VerificationType.PASSWORD_RESET,
          status: VerificationStatus.PENDING,
        },
      });

      if (!verification) {
        // Increment attempts for rate limiting
        await this.verificationRepository
          .createQueryBuilder()
          .update(Verification)
          .set({ attempts: () => 'attempts + 1' })
          .where('userId = :userId AND type = :type AND status = :status', {
            userId,
            type: VerificationType.PASSWORD_RESET,
            status: VerificationStatus.PENDING,
          })
          .execute();

        this.logger.warn(`Invalid password reset code for user ${userId}`);
        return false;
      }

      if (new Date() > verification.expiresAt) {
        await this.verificationRepository.update(verification.id, {
          status: VerificationStatus.EXPIRED,
        });
        this.logger.warn(`Expired password reset code for user ${userId}`);
        return false;
      }

      if (verification.attempts >= 3) {
        await this.verificationRepository.update(verification.id, {
          status: VerificationStatus.EXPIRED,
        });
        this.logger.warn(
          `Too many attempts for password reset code for user ${userId}`
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to verify password reset code for user ${userId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Mark password reset as used (after successful password change)
   */
  async markPasswordResetUsed(userId: string, code: string): Promise<void> {
    await this.verificationRepository.update(
      {
        userId,
        code,
        type: VerificationType.PASSWORD_RESET,
        status: VerificationStatus.PENDING,
      },
      {
        status: VerificationStatus.USED,
        verifiedAt: new Date(),
      }
    );
  }

  /**
   * Clean up expired verifications
   */
  async cleanupExpiredVerifications(): Promise<void> {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 24); // Clean up verifications older than 24 hours

    await this.verificationRepository
      .createQueryBuilder()
      .delete()
      .from(Verification)
      .where('createdAt < :expiredDate', { expiredDate })
      .execute();

    this.logger.log('Cleaned up expired verifications');
  }
}
