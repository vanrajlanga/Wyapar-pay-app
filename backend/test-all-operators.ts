/**
 * Test All Operators to Find KWIKAPI Operator IDs
 * This script detects operators for different mobile numbers to map operator codes to operator IDs
 */

import axios from 'axios';

const API_KEY = '13846b-4d17bb-85d61c-d9d910-45ae04';
const BASE_URL = 'https://www.kwikapi.com';

// Test numbers for different operators (replace with actual test numbers)
const testNumbers = {
  'Airtel': '9876543210',      // Replace with Airtel number
  'Jio': '7070300613',          // Jio number from tests
  'Vi': '9123456789',           // Replace with Vi number
  'BSNL': '9234567890',         // Replace with BSNL number
  'MTNL': '9345678901',         // Replace with MTNL number
};

async function detectOperator(number: string, operatorName: string) {
  try {
    const formData = new URLSearchParams();
    formData.append('api_key', API_KEY);
    formData.append('number', number);

    const response = await axios.post(
      `${BASE_URL}/api/v2/operator_fetch_v2.php`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    if (response.data.success) {
      console.log(`\n✅ ${operatorName}:`);
      console.log(`   Provider: ${response.data.details.provider}`);
      console.log(`   Operator ID (opid): ${response.data.details.opid}`);
      console.log(`   Circle: ${response.data.details.circle_name}`);
      console.log(`   Circle Code: ${response.data.details.circle_code}`);

      return {
        operatorName,
        provider: response.data.details.provider,
        opid: response.data.details.opid,
        circleCode: response.data.details.circle_code,
        circleName: response.data.details.circle_name,
      };
    } else {
      console.log(`\n❌ ${operatorName}: Detection failed`);
      console.log(`   Message: ${response.data.message}`);
      return null;
    }
  } catch (error: any) {
    console.log(`\n❌ ${operatorName}: Error`);
    console.log(`   ${error.message}`);
    return null;
    }
}

async function testAllOperators() {
  console.log('\n🧪 Testing All Operators to Find KWIKAPI Operator IDs\n');
  console.log('='.repeat(70));

  const results: any[] = [];

  for (const [operatorName, number] of Object.entries(testNumbers)) {
    const result = await detectOperator(number, operatorName);
    if (result) {
      results.push(result);
    }

    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 OPERATOR ID MAPPING:\n');

  results.forEach(result => {
    console.log(`${result.provider.padEnd(15)} → operatorId: "${result.opid}"`);
  });

  console.log('\n📋 TypeScript Mapping:\n');
  console.log('export const KWIKAPI_OPERATOR_IDS = {');
  results.forEach(result => {
    const code = result.provider.toUpperCase().replace(/ /g, '_');
    console.log(`  ${code}: '${result.opid}',`);
  });
  console.log('};');

  console.log('\n✅ Test Complete!\n');
}

testAllOperators();
