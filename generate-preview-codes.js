#!/usr/bin/env node

/**
 * Preview Code Generator for OneTaskAssistant Early Access
 * 
 * This script generates unique preview codes for early access users.
 * Run this script to generate initial codes for your backend database.
 */

import crypto from 'crypto';

// Configuration
const NUM_CODES = 25; // Generate 25 codes as requested
const CODE_LENGTH = 8; // 8-character codes (mix of letters and numbers)

/**
 * Generate a random alphanumeric code
 */
function generateCode(length = CODE_LENGTH) {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Removed O, 0 to avoid confusion
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique preview codes
 */
function generatePreviewCodes(count) {
  const codes = new Set();
  
  while (codes.size < count) {
    codes.add(generateCode());
  }
  
  return Array.from(codes);
}

// Generate codes
const previewCodes = generatePreviewCodes(NUM_CODES);

console.log('🎫 OneTaskAssistant Preview Codes Generated');
console.log('==========================================');
console.log(`Generated ${previewCodes.length} unique preview codes:\n`);

// Display codes in a nice format
previewCodes.forEach((code, index) => {
  console.log(`${(index + 1).toString().padStart(2, '0')}. ${code}`);
});

console.log('\n📋 Database Insert Script (SQL):');
console.log('================================');
console.log('-- Insert preview codes into your database');
console.log('-- Adjust table/column names as needed for your backend\n');

previewCodes.forEach(code => {
  console.log(`INSERT INTO preview_codes (code, is_used, created_at) VALUES ('${code}', false, NOW());`);
});

console.log('\n📋 JSON Format for API/Configuration:');
console.log('====================================');
console.log(JSON.stringify({
  preview_codes: previewCodes.map(code => ({
    code: code,
    is_used: false,
    created_at: new Date().toISOString(),
    used_by: null,
    used_at: null
  }))
}, null, 2));

console.log('\n💡 Backend Implementation Notes:');
console.log('===============================');
console.log('1. Create a preview_codes table with columns:');
console.log('   - id (primary key)');
console.log('   - code (varchar, unique)');
console.log('   - is_used (boolean, default false)');
console.log('   - created_at (timestamp)');
console.log('   - used_by (varchar, nullable - user ID)');
console.log('   - used_at (timestamp, nullable)');
console.log('');
console.log('2. Create API endpoint: POST /api/preview-codes/validate');
console.log('   - Input: { code, userId }');
console.log('   - Output: { valid: boolean, message: string }');
console.log('   - Mark code as used when valid');
console.log('');
console.log('3. Update profile creation to include preview code tracking');
console.log('');
console.log('4. Add admin endpoint to view code usage statistics');

// Save to file for easy access
import { writeFileSync } from 'fs';

const outputData = {
  generated_at: new Date().toISOString(),
  total_codes: previewCodes.length,
  codes: previewCodes.map(code => ({
    code: code,
    is_used: false,
    created_at: new Date().toISOString(),
    used_by: null,
    used_at: null
  }))
};

writeFileSync('preview-codes.json', JSON.stringify(outputData, null, 2));
console.log('\n💾 Codes saved to: preview-codes.json');
