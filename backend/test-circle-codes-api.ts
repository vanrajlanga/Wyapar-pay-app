/**
 * Test Circle Codes API to see the complete response structure
 * This will help us understand if operator IDs are included in the response
 */

import axios from 'axios';

const API_KEY = '13846b-4d17bb-85d61c-d9d910-45ae04';

async function testCircleCodesAPI() {
  console.log('\n🧪 Testing KWIKAPI Circle Codes API\n');
  console.log('='.repeat(70));

  const url = `https://www.kwikapi.com/api/v2/circle_codes.php?api_key=${API_KEY}`;

  try {
    console.log('📤 Fetching circle codes from KWIKAPI...\n');

    const response = await axios.get(url, { timeout: 30000 });

    console.log('✅ SUCCESS! Response received:\n');

    const circles = response.data?.response;

    if (circles && Array.isArray(circles)) {
      console.log(`📊 Total circles: ${circles.length}\n`);

      console.log('📋 Sample Circle (First 5):');
      circles.slice(0, 5).forEach((circle: any, index: number) => {
        console.log(`\n${index + 1}. ${JSON.stringify(circle, null, 2)}`);
      });

      console.log('\n📄 Circle Object Keys:');
      if (circles.length > 0) {
        console.log(Object.keys(circles[0]));
      }

      console.log('\n💾 Full Response Structure:');
      console.log(JSON.stringify(response.data, null, 2));

      // Check if operator information is included
      if (circles.length > 0) {
        const sampleCircle = circles[0];
        if (sampleCircle.operator_id || sampleCircle.opid || sampleCircle.operator) {
          console.log('\n✅ OPERATOR INFO FOUND IN CIRCLE DATA!');
          console.log('   Keys:', Object.keys(sampleCircle));
        } else {
          console.log('\n⚠️  No operator information found in circle data');
          console.log('   Circle data only contains:', Object.keys(sampleCircle));
        }
      }

    } else {
      console.log('⚠️  Invalid response format');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error: any) {
    console.log('❌ FAILED!\n');

    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test Complete!\n');
}

testCircleCodesAPI();
