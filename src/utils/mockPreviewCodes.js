/**
 * Mock Preview Code Validation for Frontend Testing
 * 
 * This file provides a mock implementation of the preview code validation
 * that you can use to test the frontend before the backend is implemented.
 * 
 * To use this mock:
 * 1. Uncomment the mock code in your ProfileSetup.jsx
 * 2. Replace the real API call with mockValidatePreviewCode
 * 3. Test the frontend behavior with various scenarios
 */

// Mock valid codes for testing (actual generated codes)
const MOCK_VALID_CODES = [
  // Generated preview codes
  'L4LQY6QW', 'TL5YQ8I5', 'RYT8M33R', 'S1K97PSI', '51QZULKH',
  'SP8PR4PV', 'IN5I3INX', '5WVRI957', '7GZH43NF', 'BG2QGTFV',
  'D5EXAKUE', 'PQI24HR9', 'GH525GA5', '1ZE4DAI4', 'J4C3PF83',
  '52AYY4XI', 'QCZ1J1BQ', 'RCA2ETID', 'FFKWLL2E', 'XHK54575',
  '57N8XFUZ', 'FZZ9WVKL', 'YEMZ25D8', 'ANJA9H9F', 'D4438F72',
  // Additional test codes
  'TESTCODE', 'DEMO1234', 'PREVIEW1'
];

// Special multi-use codes for development testing (never get marked as used)
const MULTI_USE_TEST_CODES = [
  'DEVTEST', 'MULTIUSE', 'REUSABLE', 'TESTING123'
];

// Track used codes in memory (for testing only)
let MOCK_USED_CODES = new Set();

/**
 * Mock preview code validation function
 * Simulates the backend API response
 */
export async function mockValidatePreviewCode(code, userId) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const normalizedCode = code.trim().toUpperCase();
  
  // Check for empty code
  if (!normalizedCode) {
    return {
      valid: false,
      message: 'Preview code is required',
      error: 'MISSING_CODE'
    };
  }
  
  // Check if it's a multi-use test code (these never get marked as used)
  if (MULTI_USE_TEST_CODES.includes(normalizedCode)) {
    return {
      valid: true,
      message: 'Multi-use test code verified successfully (for development only)',
      codeId: 'DEV-' + Math.floor(Math.random() * 1000),
      isMultiUse: true
    };
  }
  
  // Check if code is already used (only for regular codes)
  if (MOCK_USED_CODES.has(normalizedCode)) {
    return {
      valid: false,
      message: 'This preview code has already been used',
      error: 'CODE_ALREADY_USED'
    };
  }
  
  // Check if code is valid
  if (!MOCK_VALID_CODES.includes(normalizedCode)) {
    return {
      valid: false,
      message: 'Invalid preview code. Please check your code and try again.',  
      error: 'INVALID_CODE'
    };
  }
  
  // Mark code as used (only for regular codes, not multi-use)
  MOCK_USED_CODES.add(normalizedCode);
  
  // Return success
  return {
    valid: true,
    message: 'Preview code verified successfully',
    codeId: Math.floor(Math.random() * 1000)
  };
}

/**
 * Reset mock state (useful for testing)
 */
export function resetMockCodes() {
  MOCK_USED_CODES.clear();
}

/**
 * Get mock statistics (for testing admin features)
 */
export function getMockStats() {
  return {
    total_codes: MOCK_VALID_CODES.length,
    used_codes: MOCK_USED_CODES.size,
    remaining_codes: MOCK_VALID_CODES.length - MOCK_USED_CODES.size,
    usage_rate: (MOCK_USED_CODES.size / MOCK_VALID_CODES.length) * 100,
    valid_codes: MOCK_VALID_CODES,
    used_codes: Array.from(MOCK_USED_CODES),
    multi_use_codes: MULTI_USE_TEST_CODES
  };
}

console.log('🧪 Mock Preview Code System Loaded');
console.log('Valid test codes:', MOCK_VALID_CODES);
console.log('🔄 Multi-use test codes (unlimited):', MULTI_USE_TEST_CODES);
console.log('Use resetMockCodes() to reset used codes during testing');

// Default export for the mock preview codes array
export default MOCK_VALID_CODES;
