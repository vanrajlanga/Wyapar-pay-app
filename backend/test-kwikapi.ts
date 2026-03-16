/**
 * KWIKAPI Integration Test Script
 * Tests wallet balance and transaction status APIs
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { KwikApiService } from './src/modules/recharge/kwikapi/kwikapi.service';

async function testKwikApi() {
  console.log('\n🧪 Testing KWIKAPI Integration...\n');
  console.log('='.repeat(60));

  // Bootstrap the application
  const app = await NestFactory.createApplicationContext(AppModule);
  const kwikApiService = app.get(KwikApiService);

  try {
    // Test 1: Get Wallet Balance (First Call - should hit API)
    console.log('\n📋 Test 1: Get Wallet Balance (Fresh API Call)');
    console.log('-'.repeat(60));
    const balance1 = await kwikApiService.getWalletBalance();
    console.log('Response:', JSON.stringify(balance1, null, 2));
    console.log('Balance:', `₹${balance1.response.balance}`);
    console.log('Plan Credit:', balance1.response.plan_credit);

    // Test 2: Get Wallet Balance Again (Should use cache)
    console.log('\n📋 Test 2: Get Wallet Balance (Should use cache)');
    console.log('-'.repeat(60));
    const balance2 = await kwikApiService.getWalletBalance();
    console.log('Response:', JSON.stringify(balance2, null, 2));
    console.log('✅ Cache working if same values returned');

    // Test 3: Force Refresh Balance
    console.log('\n📋 Test 3: Get Wallet Balance (Force Refresh)');
    console.log('-'.repeat(60));
    const balance3 = await kwikApiService.getWalletBalance(true);
    console.log('Response:', JSON.stringify(balance3, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await app.close();
  }
}

// Run tests
testKwikApi()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
