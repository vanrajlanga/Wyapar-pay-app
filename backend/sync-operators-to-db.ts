/**
 * Sync Operators to Database
 * This script calls the backend service to fetch operators from KWIKAPI and store in database
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RechargeService } from './src/modules/recharge/recharge.service';

async function syncOperators() {
  console.log('\n🚀 Starting Operator Sync to Database\n');
  console.log('='.repeat(70));

  const app = await NestFactory.createApplicationContext(AppModule);
  const rechargeService = app.get(RechargeService);

  try {
    console.log('\n📋 Step 1: Fetching operators from KWIKAPI...');
    console.log('⚠️  This will use 1 of your 15 daily API hits\n');

    const result = await rechargeService.fetchAndStoreOperators();

    console.log('\n✅ SUCCESS!\n');
    console.log('📊 Results:');
    console.log(`   - Operators Stored: ${result.operatorsStored}`);
    console.log(`   - Message: ${result.message}\n`);

    // Verify by fetching from database
    console.log('📋 Step 2: Verifying database entries...\n');
    const operators = await rechargeService.getAllOperatorsFromDB();

    console.log(`✅ Found ${operators.length} active operators in database:\n`);

    operators.slice(0, 10).forEach((op, index) => {
      console.log(`${index + 1}. ${op.operatorName.padEnd(20)} → ID: ${op.operatorId} | Min: ₹${op.amountMinimum} | Max: ₹${op.amountMaximum}`);
    });

    if (operators.length > 10) {
      console.log(`\n   ... and ${operators.length - 10} more operators`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Operator sync completed successfully!\n');

  } catch (error) {
    console.error('\n❌ FAILED!\n');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await app.close();
  }
}

syncOperators()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
