/**
 * Test KWIKAPI v2 Recharge Plans API
 */

import axios from 'axios';

async function testRechargePlans() {
  console.log('\n🧪 Testing KWIKAPI v2 Recharge Plans API...\n');

  const apiKey = '13846b-4d17bb-85d61c-d9d910-45ae04';
  const baseURL = 'https://www.kwikapi.com';

  // Test parameters from operator detection
  const operatorId = '3'; // VI operator
  const circleCode = '17'; // Bihar

  console.log('📋 Configuration:');
  console.log(`   - API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`   - Base URL: ${baseURL}`);
  console.log(`   - Operator ID: ${operatorId} (VI)`);
  console.log(`   - Circle Code: ${circleCode} (Bihar)\n`);

  try {
    // Create form-data
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('opid', operatorId);
    formData.append('state_code', circleCode);

    console.log('📤 Sending Request...');
    console.log(`   - Endpoint: /api/v2/recharge_plans.php`);
    console.log(`   - Method: POST`);
    console.log(`   - Content-Type: application/x-www-form-urlencoded`);
    console.log(`   - Parameters: opid=${operatorId}, state_code=${circleCode}\n`);

    const response = await axios.post(
      `${baseURL}/api/v2/recharge_plans.php`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    console.log('✅ SUCCESS! Response received:\n');

    if (response.data.success) {
      console.log('📱 Plan Summary:');
      console.log(`   - Operator: ${response.data.operator}`);
      console.log(`   - Circle: ${response.data.circle}`);
      console.log(`   - Hit Credit: ${response.data.hit_credit}`);
      console.log(`   - Message: ${response.data.message}\n`);

      console.log('📊 Plan Categories:\n');

      let totalPlans = 0;

      // Count plans in each category
      Object.entries(response.data.plans || {}).forEach(([category, plans]: [string, any]) => {
        if (Array.isArray(plans)) {
          console.log(`   ${category}: ${plans.length} plans`);
          totalPlans += plans.length;
        }
      });

      console.log(`\n   📈 Total Plans: ${totalPlans}\n`);

      // Show sample plans from each category
      console.log('📝 Sample Plans:\n');

      Object.entries(response.data.plans || {}).forEach(([category, plans]: [string, any]) => {
        if (Array.isArray(plans) && plans.length > 0) {
          console.log(`\n   ${category} Category:`);

          // Show first 3 plans from each category
          plans.slice(0, 3).forEach((plan, index) => {
            console.log(`      ${index + 1}. ₹${plan.rs} - ${plan.validity}`);
            console.log(`         Type: ${plan.Type}`);
            console.log(`         ${plan.desc.substring(0, 80)}...`);
          });
        }
      });

      // Full response in JSON
      console.log('\n\n📄 Full Response (JSON):');
      console.log(JSON.stringify(response.data, null, 2));

    } else {
      console.log('⚠️  API returned success: false');
      console.log('Message:', response.data.message);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
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

testRechargePlans();
