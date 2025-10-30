#!/usr/bin/env node

/**
 * Load the 25 generated preview codes to your Cosmos DB backend
 * Run this after deploying the preview code endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREVIEW_CODES_FILE = path.join(__dirname, 'preview-codes.json');
const BACKEND_URL = 'https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api';

async function loadCodesToBackend() {
  try {
    console.log('🔗 Backend URL:', BACKEND_URL);
    console.log('📦 Loading preview codes to Cosmos DB backend...');
    
    // Read local codes
    if (!fs.existsSync(PREVIEW_CODES_FILE)) {
      throw new Error('preview-codes.json not found');
    }

    const codesData = JSON.parse(fs.readFileSync(PREVIEW_CODES_FILE, 'utf8'));
    const codes = codesData.codes;

    console.log(`📋 Found ${codes.length} codes to load`);

    // Load codes to backend
    const response = await fetch(`${BACKEND_URL}/admin/preview-codes/bulk-load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        codes: codes,
        replace_existing: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Successfully loaded codes to Cosmos DB!');
    console.log(`📊 Loaded: ${result.loaded_count}, Skipped: ${result.skipped_count}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Some errors occurred:');
      result.errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Get updated statistics
    console.log('\n📈 Getting updated statistics...');
    const statsResponse = await fetch(`${BACKEND_URL}/admin/preview-codes/stats`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`📊 Total codes: ${stats.total_codes}`);
      console.log(`📊 Available: ${stats.unused_codes}`);
      console.log(`📊 Used: ${stats.used_codes}`);
    }
    
    console.log('\n🎉 Preview codes are now ready for use!');
    console.log('🧪 Test with admin panel: http://localhost:5173/admin');
    console.log('🔑 Try registering with code: D4438F72');
    
  } catch (error) {
    console.error('❌ Failed to load codes:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n💡 The preview code endpoints are not deployed yet.');
      console.log('📋 Please add the 4 endpoints from COSMOS_DB_ENDPOINTS.md to your backend first.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Cannot connect to backend. Please check if it\'s running.');
    }
    
    process.exit(1);
  }
}

// Test endpoint availability first
async function testEndpoints() {
  try {
    console.log('🔍 Testing backend endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Health endpoint working');
    } else {
      console.log('❌ Health endpoint failed');
    }
    
    // Test preview code stats endpoint
    const statsResponse = await fetch(`${BACKEND_URL}/admin/preview-codes/stats`);
    if (statsResponse.ok) {
      console.log('✅ Preview code endpoints deployed');
      return true;
    } else if (statsResponse.status === 404) {
      console.log('❌ Preview code endpoints not found (404)');
      console.log('📋 Please deploy the endpoints from COSMOS_DB_ENDPOINTS.md first');
      return false;
    } else {
      console.log(`❌ Preview code endpoints error: ${statsResponse.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    return false;
  }
}

// Main execution
const command = process.argv[2];

if (command === 'test') {
  await testEndpoints();
} else {
  const endpointsReady = await testEndpoints();
  if (endpointsReady) {
    console.log('');
    await loadCodesToBackend();
  } else {
    console.log('\n📋 Next steps:');
    console.log('1. Add the 4 endpoints from COSMOS_DB_ENDPOINTS.md to your backend');
    console.log('2. Deploy your updated backend');
    console.log('3. Run this script again: node load-codes-to-cosmos.js');
  }
}
