#!/usr/bin/env node

/**
 * Preview Code Management Utility
 * Command-line tool for managing preview codes
 */

const fs = require('fs');
const path = require('path');

const PREVIEW_CODES_FILE = path.join(__dirname, 'preview-codes.json');
const BACKEND_URL = 'https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net';

async function makeRequest(endpoint, method = 'GET', data = null) {
  const fetch = (await import('node-fetch')).default;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function loadCodesToBackend() {
  try {
    console.log('📦 Loading preview codes to backend...');
    
    // Read local codes
    if (!fs.existsSync(PREVIEW_CODES_FILE)) {
      throw new Error('preview-codes.json not found');
    }

    const codesData = JSON.parse(fs.readFileSync(PREVIEW_CODES_FILE, 'utf8'));
    const codes = codesData.codes;

    console.log(`Found ${codes.length} codes to load`);

    // Try to load codes
    const result = await makeRequest('/api/admin/preview-codes/bulk-load', 'POST', {
      codes: codes,
      operation: 'bulk_insert',
      replace_existing: false
    });

    console.log('✅ Successfully loaded codes:', result);
  } catch (error) {
    console.error('❌ Failed to load codes:', error.message);
    
    // Provide fallback instructions
    console.log('\n📋 Manual SQL Script:');
    console.log('If the API endpoint is not available, use this SQL script:');
    
    const codesData = JSON.parse(fs.readFileSync(PREVIEW_CODES_FILE, 'utf8'));
    const sqlValues = codesData.codes.map(code => 
      `('${code.code}', 0, '${code.created_at}', NULL, NULL)`
    ).join(',\n  ');

    console.log(`
INSERT INTO preview_codes (code, is_used, created_at, used_by, used_at)
VALUES
  ${sqlValues};
`);
  }
}

async function resetCodes(resetType = 'mark_unused') {
  try {
    console.log(`🔄 Resetting preview codes (${resetType})...`);
    
    const result = await makeRequest('/api/admin/preview-codes/reset', 'POST', {
      reset_type: resetType,
      confirm: true
    });

    console.log('✅ Successfully reset codes:', result);
  } catch (error) {
    console.error('❌ Failed to reset codes:', error.message);
    
    // Provide fallback instructions
    console.log('\n📋 Manual SQL Script:');
    if (resetType === 'delete_all') {
      console.log('DELETE FROM preview_codes;');
    } else {
      console.log('UPDATE preview_codes SET is_used = 0, used_by = NULL, used_at = NULL;');
    }
  }
}

async function getStats() {
  try {
    console.log('📊 Getting preview code statistics...');
    
    const stats = await makeRequest('/api/admin/preview-codes/stats');
    
    console.log('📈 Preview Code Statistics:');
    console.log(`  Total Codes: ${stats.total_codes || 0}`);
    console.log(`  Available: ${stats.unused_codes || 0}`);
    console.log(`  Used: ${stats.used_codes || 0}`);
    console.log(`  Success Rate: ${stats.total_codes ? Math.round((stats.used_codes / stats.total_codes) * 100) : 0}%`);
  } catch (error) {
    console.error('❌ Failed to get stats:', error.message);
  }
}

async function testCode(code) {
  try {
    console.log(`🧪 Testing code: ${code}`);
    
    const result = await makeRequest('/api/validate-preview-code', 'POST', {
      code: code,
      user_id: 'test-user'
    });

    console.log('✅ Code validation result:', result);
  } catch (error) {
    console.error('❌ Code validation failed:', error.message);
  }
}

function showHelp() {
  console.log(`
Preview Code Management Utility

Usage: node manage-codes.js <command> [options]

Commands:
  load                Load codes from preview-codes.json to backend
  reset [type]        Reset codes (type: mark_unused|delete_all, default: mark_unused)
  stats               Get preview code statistics
  test <code>         Test a specific preview code
  help                Show this help message

Examples:
  node manage-codes.js load
  node manage-codes.js reset mark_unused
  node manage-codes.js reset delete_all
  node manage-codes.js stats
  node manage-codes.js test D4438F72
`);
}

// Main execution
async function main() {
  const command = process.argv[2];
  const option = process.argv[3];

  switch (command) {
    case 'load':
      await loadCodesToBackend();
      break;
    case 'reset':
      await resetCodes(option || 'mark_unused');
      break;
    case 'stats':
      await getStats();
      break;
    case 'test':
      if (!option) {
        console.error('❌ Please provide a code to test');
        process.exit(1);
      }
      await testCode(option);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  loadCodesToBackend,
  resetCodes,
  getStats,
  testCode
};
