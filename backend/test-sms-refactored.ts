/**
 * SMS Testing Script - Refactored Implementation
 * 
 * Tests the new SOLID-based SMS service architecture.
 * Uses the refactored SmsService with Strategy, Factory, and Adapter patterns.
 * 
 * Usage:
 *   npm run test:sms:refactored
 *   or
 *   ts-node test-sms-refactored.ts
 */

import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SmsService } from './src/common/sms/sms.service';
import { SmsModule } from './src/common/sms/sms.module';

const TEST_PHONE = '8105237629'; // Test phone number

// Minimal test module - only SMS service
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    SmsModule,
  ],
})
class TestModule {}

async function testRefactoredSms() {
  console.log('🚀 Testing Refactored SMS Service (SOLID Architecture)...\n');
  console.log(`📱 Test Phone Number: +91${TEST_PHONE}\n`);

  const app = await NestFactory.createApplicationContext(TestModule, {
    logger: ['error', 'warn', 'log'],
  });

  const smsService = app.get(SmsService);

  // Test 1: Check service status
  console.log('─'.repeat(70));
  console.log('\n📊 Service Status:');
  const health = smsService.getHealthStatus();
  console.log(`   Enabled: ${health.enabled}`);
  console.log(`   Provider: ${health.provider}`);
  console.log(`   Configured: ${health.configured}`);
  console.log(`   Fallback: ${health.fallbackEnabled}`);

  // Test 2: Send test SMS
  const testMessages = [
    {
      name: 'Recharge Success',
      message: 'Dear User, Your recharge of ₹299 is successful. Transaction ID: TXN-TEST-001. Enjoy seamless payments with WyapaarPay!',
    },
    {
      name: 'OTP Sent',
      message: 'Dear User, Your OTP for WyapaarPay login is 123456. Use this code to access your account. Do not share it with anyone.',
    },
    {
      name: 'Transaction Success',
      message: 'Payment of ₹500 successful. Txn ID: TXN-TEST-003. Thank you for using WyaparPay!',
    },
  ];

  console.log('\n─'.repeat(70));
  console.log(`\n📋 Testing ${testMessages.length} SMS messages...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    const phoneNumber = `+91${TEST_PHONE}`;

    console.log(`[${i + 1}/${testMessages.length}] Testing: ${test.name}`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Message: ${test.message.substring(0, 60)}...`);

    try {
      // Use new refactored service
      const result = await smsService.sendSmsWithResult(phoneNumber, test.message);

      if (result.success) {
        console.log('✅ SMS sent successfully!');
        console.log(`   Provider: ${smsService.getProviderName()}`);
        if (result.messageId) {
          console.log(`   Message ID: ${result.messageId}`);
        }
        successCount++;
      } else {
        console.log('❌ SMS sending failed');
        console.log(`   Error: ${result.errorMessage}`);
        if (result.providerData) {
          console.log(`   Provider Data: ${JSON.stringify(result.providerData)}`);
        }
        failCount++;
      }
    } catch (error) {
      console.log('❌ Error sending SMS');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }

    // Wait 2 seconds between SMS
    if (i < testMessages.length - 1) {
      console.log('⏳ Waiting 2 seconds before next SMS...\n');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('\n─'.repeat(70));
  console.log('\n📊 Test Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📱 Total: ${testMessages.length}`);

  if (successCount === testMessages.length) {
    console.log('\n🎉 All SMS tests passed with refactored service!');
  } else if (successCount > 0) {
    console.log(`\n⚠️  ${successCount} SMS sent successfully, ${failCount} failed.`);
  } else {
    console.log('\n❌ All SMS tests failed. Check configuration and logs.');
  }

  console.log(`\n📱 Check phone +91${TEST_PHONE} for received SMS messages.\n`);

  await app.close();
  process.exit(0);
}

// Run the test
testRefactoredSms().catch((error) => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

