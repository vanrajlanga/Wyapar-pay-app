import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayConfig {
  constructor(private configService: ConfigService) {}

  get isEnabled(): boolean {
    return this.configService.get<string>('RAZORPAY_ENABLED', 'false') === 'true';
  }

  get keyId(): string {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    if (!keyId || keyId === 'your-razorpay-key-id') {
      throw new Error('RAZORPAY_KEY_ID is not configured properly');
    }
    return keyId;
  }

  get keySecret(): string {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret || keySecret === 'your-razorpay-key-secret') {
      throw new Error('RAZORPAY_KEY_SECRET is not configured properly');
    }
    return keySecret;
  }

  get webhookSecret(): string {
    return this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
  }

  validate(): void {
    if (!this.isEnabled) {
      console.log('⚠️  Razorpay is disabled');
      return;
    }

    try {
      this.keyId;
      this.keySecret;
      console.log('✅ Razorpay Configuration valid');
      console.log(`   Key ID: ${this.keyId.substring(0, 15)}...`);
    } catch (error) {
      console.error('❌ Razorpay Configuration Error:', error.message);
      throw error;
    }
  }
}
