/**
 * Fetch Operator IDs from KWIKAPI Operator Codes API
 * WARNING: 15 hits/day limit - Run this sparingly!
 */

import axios from 'axios';

const API_KEY = '13846b-4d17bb-85d61c-d9d910-45ae04';

async function fetchOperatorIds() {
  console.log('\n🧪 Fetching Operator IDs from KWIKAPI\n');
  console.log('⚠️  WARNING: This API has 15 hits/day limit!\n');
  console.log('='.repeat(70));

  const url = `https://www.kwikapi.com/api/v2/operator_codes.php?api_key=${API_KEY}`;

  try {
    console.log('📤 Fetching operator codes...\n');

    const response = await axios.get(url, { timeout: 30000 });

    if (response.data.status === 'SUCCESS' && response.data.response) {
      const operators = response.data.response;

      console.log(`✅ Fetched ${operators.length} operators\n`);
      console.log('='.repeat(70));
      console.log('\n📊 OPERATOR ID MAPPING:\n');

      // Filter for prepaid mobile operators we care about
      const mobileOperators = operators.filter((op: any) =>
        op.service_type === 'Prepaid' &&
        ['Airtel', 'Jio', 'Vi', 'BSNL', 'MTNL'].includes(op.operator_name)
      );

      console.log('Mobile Prepaid Operators:\n');
      mobileOperators.forEach((op: any) => {
        console.log(`${op.operator_name.padEnd(15)} → ID: "${op.operator_id}" | Status: ${op.status} | Range: ₹${op.amount_minimum}-${op.amount_maximum}`);
      });

      console.log('\n' + '='.repeat(70));
      console.log('\n📋 TypeScript Mapping for Frontend:\n');
      console.log('export const OPERATORS: Record<string, Operator> = {');

      mobileOperators.forEach((op: any) => {
        const code = op.operator_name.toUpperCase();
        console.log(`  ${code}: {`);
        console.log(`    code: '${code}',`);
        console.log(`    name: '${op.operator_name}',`);
        console.log(`    displayName: '${op.operator_name}',`);
        console.log(`    type: 'prepaid',`);
        console.log(`    color: '#E60000', // Update color`);
        console.log(`    kwikApiOperatorId: '${op.operator_id}', // KWIKAPI operator ID`);
        console.log(`  },`);
      });
      console.log('};');

      console.log('\n' + '='.repeat(70));
      console.log('\n📄 Full Operator List (First 10):\n');

      operators.slice(0, 10).forEach((op: any, index: number) => {
        console.log(`${index + 1}. ${op.operator_name} (${op.service_type})`);
        console.log(`   ID: ${op.operator_id} | Status: ${op.status} | BBPS: ${op.bbps_enabled}`);
        console.log('');
      });

      // Save to file for reference
      const fs = require('fs');
      fs.writeFileSync(
        './operator-ids-mapping.json',
        JSON.stringify(mobileOperators, null, 2)
      );
      console.log('💾 Saved mapping to: operator-ids-mapping.json\n');

    } else {
      console.log('⚠️  Unexpected response format');
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

fetchOperatorIds();
