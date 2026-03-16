/**
 * Complete Recharge Flow Test
 * Demonstrates the full recharge process with all 3 KWIKAPI APIs
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { KwikApiService } from './src/modules/recharge/kwikapi/kwikapi.service';

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testCompleteRechargeFlow() {
  console.log('\n🚀 Complete Recharge Flow Test\n');
  console.log('='.repeat(70));

  const app = await NestFactory.createApplicationContext(AppModule);
  const kwikApiService = app.get(KwikApiService);

  try {
    // Step 1: Check KWIKAPI Wallet Balance
    console.log('\n📋 STEP 1: Check KWIKAPI Wallet Balance');
    console.log('-'.repeat(70));
    
    const balance = await kwikApiService.getWalletBalance();
    console.log(`💰 Balance: ₹${balance.response.balance}`);
    console.log(`📊 Plan Credit: ${balance.response.plan_credit}`);
    
    const balanceAmount = parseFloat(balance.response.balance);
    if (balanceAmount < 10) {
      console.log('\n⚠️  WARNING: Insufficient KWIKAPI wallet balance!');
      console.log('   Please top up your KWIKAPI wallet before testing.');
      await app.close();
      return;
    }

    // Step 2: Generate Order ID
    console.log('\n📋 STEP 2: Generate Unique Order ID');
    console.log('-'.repeat(70));
    
    const orderId = kwikApiService.generateOrderId();
    console.log(`🆔 Order ID: ${orderId} (${orderId.length} digits)`);

    // Step 3: Process Recharge (DEMO - COMMENTED OUT)
    console.log('\n📋 STEP 3: Process Recharge');
    console.log('-'.repeat(70));
    console.log('⚠️  DEMO MODE: Actual recharge call is commented out');
    console.log('   Uncomment the code below to test with real mobile number');
    console.log('\nExample request:');
    console.log(JSON.stringify({
      number: '7070300613',
      amount: 10,
      opid: '3',        // Operator ID from detection
      state_code: 0,    // Always 0
      order_id: orderId
    }, null, 2));

    /*
    // UNCOMMENT TO TEST REAL RECHARGE
    const rechargeResponse = await kwikApiService.processRecharge({
      number: '7070300613',  // Replace with test number
      amount: 10,            // Minimum amount
      opid: '3',             // Airtel prepaid (from operator detection)
      state_code: 0,         // Always 0
      order_id: orderId
    });

    console.log('\n📥 Recharge Response:');
    console.log(JSON.stringify(rechargeResponse, null, 2));
    console.log(`\nStatus: ${rechargeResponse.status}`);
    console.log(`Message: ${rechargeResponse.message}`);
    console.log(`Charged Amount: ₹${rechargeResponse.charged_amount}`);
    console.log(`New Balance: ₹${rechargeResponse.balance}`);

    // Step 4: Poll Status (Max 3 attempts)
    console.log('\n📋 STEP 4: Poll Recharge Status');
    console.log('-'.repeat(70));
    console.log('⏳ Waiting 5 seconds before first status check...');
    await sleep(5000);

    let finalStatus = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n🔍 Status Check Attempt ${attempt}/${maxAttempts}`);
      
      const statusResponse = await kwikApiService.checkRechargeStatus(orderId);
      console.log(JSON.stringify(statusResponse, null, 2));

      finalStatus = statusResponse.response.status;
      console.log(`Status: ${finalStatus}`);

      if (finalStatus === 'SUCCESS') {
        console.log('\n✅ RECHARGE SUCCESSFUL!');
        console.log(`Operator Ref: ${statusResponse.response.operator_ref}`);
        console.log(`Amount: ₹${statusResponse.response.amount}`);
        console.log(`Date: ${statusResponse.response.date}`);
        break;
      } else if (finalStatus === 'FAILED') {
        console.log('\n❌ RECHARGE FAILED');
        break;
      } else if (finalStatus === 'PENDING') {
        if (attempt < maxAttempts) {
          console.log('⏳ Still pending... waiting 30 seconds');
          await sleep(30000);
        } else {
          console.log('\n⚠️  Still PENDING after 3 attempts');
          console.log('   Check status again later or check KWIKAPI dashboard');
        }
      }
    }
    */

    console.log('\n' + '='.repeat(70));
    console.log('✅ Test completed!\n');
    console.log('💡 To test actual recharge:');
    console.log('   1. Uncomment the code in STEP 3');
    console.log('   2. Replace mobile number with test number');
    console.log('   3. Ensure KWIKAPI wallet has sufficient balance');
    console.log('   4. Run: ts-node test-complete-recharge.ts\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await app.close();
  }
}

// Run the test
testCompleteRechargeFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
