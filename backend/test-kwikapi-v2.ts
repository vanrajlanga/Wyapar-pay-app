/**
 * Test KWIKAPI v2 Operator Detection
 */

import axios from 'axios';

async function testOperatorDetection() {
  console.log('\n🧪 Testing KWIKAPI v2 Operator Detection...\n');

  const apiKey = '13846b-4d17bb-85d61c-d9d910-45ae04';
  const baseURL = 'https://www.kwikapi.com'; // Production URL
  const testNumber = '7070300613';

  console.log('📋 Configuration:');
  console.log(`   - API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`   - Base URL: ${baseURL}`);
  console.log(`   - Test Number: ${testNumber}\n`);

  try {
    // Create form-data
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('number', testNumber);

    console.log('📤 Sending Request...');
    console.log(`   - Endpoint: /api/v2/operator_fetch_v2.php`);
    console.log(`   - Method: POST`);
    console.log(`   - Content-Type: application/x-www-form-urlencoded\n`);

    const response = await axios.post(
      `${baseURL}/api/v2/operator_fetch_v2.php`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    console.log('✅ SUCCESS! Response received:\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n📱 Operator Details:');
      console.log(`   - Provider: ${response.data.details.provider}`);
      console.log(`   - Operator ID: ${response.data.details.opid}`);
      console.log(`   - Circle: ${response.data.details.circle_name}`);
      console.log(`   - Circle Code: ${response.data.details.circle_code}`);
      console.log(`\n💰 Account Info:`);
      console.log(`   - Credit Balance: ₹${response.data.credit_balance}`);
    }

  } catch (error: any) {
    console.log('❌ FAILED!\n');

    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log('Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Test Complete!\n');
}

testOperatorDetection();
