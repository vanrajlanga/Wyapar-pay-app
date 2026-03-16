/**
 * Simple SMS Testing Script (No Database Required)
 * 
 * Tests SMS sending without loading the entire application.
 * Only loads SMS and Notification modules.
 * 
 * Usage:
 *   npm run test:sms:simple
 *   or
 *   ts-node test-sms-simple.ts
 */

import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SmsService } from './src/common/sms/sms.service';
import { SmsModule } from './src/common/sms/sms.module';
import { NotificationService } from './src/common/templates/notification-service';
import { TemplateLoaderService } from './src/common/templates/template-loader.service';
import { NotificationModule } from './src/common/templates/notification.module';
import { PushNotificationModule } from './src/common/push-notification/push-notification.module';
import { NotificationType } from './src/common/templates/notification-templates';

const TEST_PHONE = '8105237629'; // Test phone number

// Minimal test module - only SMS and Notification services
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    SmsModule,
    PushNotificationModule,
    NotificationModule,
  ],
})
class TestModule {}

async function testAllSms() {
  console.log('🚀 Starting SMS Testing (Simple Mode - No Database)...\n');
  console.log(`📱 Test Phone Number: +91${TEST_PHONE}\n`);

  const app = await NestFactory.createApplicationContext(TestModule, {
    logger: ['error', 'warn', 'log'],
  });

  const notificationService = app.get(NotificationService);

  const testCases = [
    // Transaction SMS
    {
      type: NotificationType.RECHARGE_SUCCESS,
      context: {
        amount: 299,
        transactionId: 'TXN-TEST-001',
        phoneNumber: TEST_PHONE,
        operator: 'Airtel',
      },
      description: 'Recharge Success',
    },
    {
      type: NotificationType.RECHARGE_FAILED,
      context: {
        amount: 299,
        transactionId: 'TXN-TEST-002',
        phoneNumber: TEST_PHONE,
        reason: 'Insufficient balance',
      },
      description: 'Recharge Failed',
    },
    {
      type: NotificationType.TRANSACTION_SUCCESS,
      context: {
        amount: 500,
        currency: '₹',
        transactionId: 'TXN-TEST-003',
        type: 'electricity_bill',
      },
      description: 'Transaction Success',
    },
    {
      type: NotificationType.TRANSACTION_FAILED,
      context: {
        amount: 500,
        currency: '₹',
        transactionId: 'TXN-TEST-004',
        reason: 'Payment gateway error',
      },
      description: 'Transaction Failed',
    },
    {
      type: NotificationType.WALLET_TOPUP_SUCCESS,
      context: {
        amount: 1000,
        currency: '₹',
        transactionId: 'TXN-TEST-005',
      },
      description: 'Wallet Topup Success',
    },
    // Authentication SMS
    {
      type: NotificationType.OTP_SENT,
      context: {
        otp: '123456',
      },
      description: 'OTP Sent',
    },
    {
      type: NotificationType.WELCOME_MESSAGE,
      context: {
        userName: 'Test User',
      },
      description: 'Welcome Message',
    },
    {
      type: NotificationType.LOGIN_ALERT,
      context: {
        loginLocation: 'Mumbai, India',
        loginDevice: 'Chrome on Windows',
      },
      description: 'Login Alert (New Device)',
    },
    {
      type: NotificationType.ACCOUNT_VERIFIED,
      context: {},
      description: 'Account Verified',
    },
    {
      type: NotificationType.PASSWORD_CHANGED,
      context: {},
      description: 'Password Changed',
    },
    // KYC SMS
    {
      type: NotificationType.KYC_APPROVED,
      context: {},
      description: 'KYC Approved',
    },
    {
      type: NotificationType.KYC_REJECTED,
      context: {
        reason: 'Document quality is poor. Please upload clear images.',
      },
      description: 'KYC Rejected',
    },
  ];

  console.log(`📋 Testing ${testCases.length} SMS types...\n`);
  console.log('─'.repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const phoneNumber = `+91${TEST_PHONE}`;

    console.log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.description}`);
    console.log(`Type: ${testCase.type}`);
    console.log(`Phone: ${phoneNumber}`);

    try {
      // Test in English
      const result = await notificationService.sendSmsNotification(
        phoneNumber,
        testCase.type,
        'en',
        testCase.context,
      );

      if (result.success) {
        console.log('✅ SMS sent successfully!');
        console.log(`Message: ${result.content.substring(0, 80)}...`);
        successCount++;
      } else {
        console.log('❌ SMS sending failed');
        console.log(`Reason: ${result.message}`);
        failCount++;
      }
    } catch (error) {
      console.log('❌ Error sending SMS');
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }

    // Wait 2 seconds between SMS to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log('⏳ Waiting 2 seconds before next SMS...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Test Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📱 Total: ${testCases.length}`);

  if (successCount === testCases.length) {
    console.log('\n🎉 All SMS tests passed!');
  } else {
    console.log('\n⚠️  Some SMS tests failed. Check logs for details.');
  }

  await app.close();
  process.exit(0);
}

// Run the test
testAllSms().catch((error) => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

