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

// Mock valid codes for testing (subset of generated codes)
const MOCK_VALID_CODES = [
  'WSHA61P9', 'F7WQUWYS', '1PHZ5MG3', 'K2TV2NU5', 'ZLQQX14D',
  'TESTCODE', 'DEMO1234', 'PREVIEW1' // Easy to remember test codes
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
  
  // Check if code is already used
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
  
  // Mark code as used
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
    used_codes: Array.from(MOCK_USED_CODES)
  };
}

console.log('🧪 Mock Preview Code System Loaded');
console.log('Valid test codes:', MOCK_VALID_CODES);
console.log('Use resetMockCodes() to reset used codes during testing');
