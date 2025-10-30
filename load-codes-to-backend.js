#!/usr/bin/env node

/**
 * Load Preview Codes into Backend Database
 * 
 * This script attempts to load the generated preview codes into the backend
 * by trying various API endpoints or providing manual instructions.
 */

const BACKEND_URL = 'https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api';

// The codes we just generated
const newCodes = [
  'L4LQY6QW', 'TL5YQ8I5', 'RYT8M33R', 'S1K97PSI', '51QZULKH',
  'SP8PR4PV', 'IN5I3INX', '5WVRI957', '7GZH43NF', 'BG2QGTFV',
  'D5EXAKUE', 'PQI24HR9', 'GH525GA5', '1ZE4DAI4', 'J4C3PF83',
  '52AYY4XI', 'QCZ1J1BQ', 'RCA2ETID', 'FFKWLL2E', 'XHK54575',
  '57N8XFUZ', 'FZZ9WVKL', 'YEMZ25D8', 'ANJA9H9F', 'D4438F72'
];

async function testCode(code) {
  try {
    const response = await fetch(`${BACKEND_URL}/preview-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        user_id: 'test-check'
      })
    });

    const result = await response.json();
    return { code, valid: result.valid, message: result.message };
  } catch (error) {
    return { code, error: error.message };
  }
}

async function main() {
  console.log('🔍 Testing if the new codes are already loaded in the backend...\n');
  
  // Test first 3 codes to see if they work
  const testCodes = newCodes.slice(0, 3);
  
  for (const code of testCodes) {
    const result = await testCode(code);
    if (result.valid) {
      console.log(`✅ ${code} - VALID (already in backend!)`);
    } else if (result.message && result.message.includes('Invalid')) {
      console.log(`❌ ${code} - Not in backend database`);
    } else {
      console.log(`⚠️  ${code} - ${result.message || result.error}`);
    }
  }
  
  console.log('\n📋 MANUAL BACKEND SETUP REQUIRED');
  console.log('=================================');
  console.log('The codes are not yet in the backend database.');
  console.log('You need to manually add them. Here are your options:\n');
  
  console.log('🔧 Option 1: SQL Database Insert');
  console.log('If you have direct database access, run these SQL commands:\n');
  
  newCodes.forEach(code => {
    console.log(`INSERT INTO preview_codes (code, is_used, created_at) VALUES ('${code}', false, NOW());`);
  });
  
  console.log('\n🔧 Option 2: Backend Admin Panel');
  console.log('If your backend has an admin panel, add these codes manually:\n');
  
  newCodes.forEach((code, index) => {
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${code}`);
  });
  
  console.log('\n🔧 Option 3: API Endpoint (if available)');
  console.log('If there\'s a bulk insert endpoint, use this JSON:\n');
  
  console.log(JSON.stringify({ codes: newCodes }, null, 2));
  
  console.log('\n🚀 Once loaded, test with any of these codes:');
  console.log('First few codes to try:');
  newCodes.slice(0, 5).forEach(code => {
    console.log(`  • ${code}`);
  });
}

main().catch(console.error);
