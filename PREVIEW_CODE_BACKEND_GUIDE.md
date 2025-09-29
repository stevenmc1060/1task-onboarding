# OneTaskAssistant Preview Code System - Backend Implementation Guide

## Overview
This document describes the backend implementation required to support the preview code system for OneTaskAssistant's early access program.

## Database Schema

### Preview Codes Table
```sql
CREATE TABLE preview_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_by VARCHAR(255) NULL,  -- User ID who used the code
    used_at TIMESTAMP NULL
);

-- Create index for faster lookups
CREATE INDEX idx_preview_codes_code ON preview_codes(code);
CREATE INDEX idx_preview_codes_used ON preview_codes(is_used);
```

### Update User Profiles Table
Add preview code tracking to your existing users/profiles table:
```sql
ALTER TABLE profiles ADD COLUMN preview_code_used VARCHAR(20) NULL;
```

## API Endpoints

### 1. Preview Code Validation Endpoint

**Endpoint:** `POST /api/preview-codes/validate`

**Request Body:**
```json
{
  "code": "WSHA61P9",
  "userId": "user-12345"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "Preview code is valid",
  "codeId": 123
}
```

**Response (Code Already Used):**
```json
{
  "valid": false,
  "message": "This preview code has already been used",
  "error": "CODE_ALREADY_USED"
}
```

**Response (Invalid Code):**
```json
{
  "valid": false,
  "message": "Invalid preview code. Please check your code and try again.",
  "error": "INVALID_CODE"
}
```

**Implementation Logic:**
```javascript
// Pseudo-code for validation endpoint
async function validatePreviewCode(req, res) {
  const { code, userId } = req.body;
  
  // 1. Validate input
  if (!code || !userId) {
    return res.status(400).json({
      valid: false,
      message: "Code and userId are required",
      error: "MISSING_PARAMETERS"
    });
  }
  
  // 2. Check if code exists and is not used
  const previewCode = await db.query(
    'SELECT * FROM preview_codes WHERE code = ? AND is_used = FALSE', 
    [code.trim().toUpperCase()]
  );
  
  if (!previewCode) {
    return res.status(200).json({
      valid: false,
      message: "Invalid preview code. Please check your code and try again.",
      error: "INVALID_CODE"
    });
  }
  
  // 3. Mark code as used
  await db.query(
    'UPDATE preview_codes SET is_used = TRUE, used_by = ?, used_at = NOW() WHERE code = ?',
    [userId, code.trim().toUpperCase()]
  );
  
  // 4. Return success
  return res.status(200).json({
    valid: true,
    message: "Preview code is valid",
    codeId: previewCode.id
  });
}
```

### 2. Update Profile Creation Endpoint

**Modify:** `POST /api/profiles` or `PUT /api/profiles/{userId}`

**Updated Request Body:** (include preview code info)
```json
{
  "displayName": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "role": "developer",
  "accountType": "free",
  "timezone": "America/New_York",
  "notifications": true,
  "previewCode": "WSHA61P9",
  "previewCodeUsed": "WSHA61P9",
  "contactAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postalCode": "12345",
    "country": "US"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Anytown", 
    "state": "CA",
    "postalCode": "12345",
    "country": "US"
  },
  "billingAddressSameAsContact": true
}
```

**Implementation Update:**
```javascript
// Add preview code to profile creation
async function createOrUpdateProfile(req, res) {
  const { userId } = req.params;
  const profileData = req.body;
  
  // Include preview code in profile data
  const updatedProfileData = {
    ...profileData,
    preview_code_used: profileData.previewCodeUsed,
    updated_at: new Date()
  };
  
  // Save to database...
  // (your existing profile creation logic)
}
```

## Admin Endpoints (Optional but Recommended)

### 3. Preview Code Statistics

**Endpoint:** `GET /api/admin/preview-codes/stats`

**Response:**
```json
{
  "total_codes": 25,
  "used_codes": 8,
  "remaining_codes": 17,
  "usage_rate": 32.0,
  "recent_usage": [
    {
      "code": "WSHA61P9",
      "used_by": "user-12345",
      "used_at": "2025-09-28T15:30:00Z",
      "user_email": "john@example.com"
    }
  ]
}
```

### 4. Generate New Codes

**Endpoint:** `POST /api/admin/preview-codes/generate`

**Request:**
```json
{
  "count": 10
}
```

**Response:**
```json
{
  "generated": 10,
  "codes": ["ABC123", "DEF456", ...]
}
```

## Security Considerations

1. **Rate Limiting:** Implement rate limiting on the validation endpoint to prevent brute force attacks
2. **Case Insensitive:** Store and compare codes in uppercase for consistency
3. **Logging:** Log all validation attempts for security monitoring
4. **Admin Access:** Secure admin endpoints with proper authentication

## Error Handling

- Invalid/missing parameters: 400 status
- Code validation failures: 200 status with `valid: false`
- Server errors: 500 status
- Rate limit exceeded: 429 status

## Testing

### Test Cases to Implement:
1. Valid unused code → should validate and mark as used
2. Valid used code → should return "already used" error
3. Invalid code → should return "invalid code" error
4. Empty/null code → should return validation error
5. Multiple validation attempts for same code → should only work once

### Test Codes for Development:
Use these codes for testing (from generated set):
- `WSHA61P9` - Valid test code
- `F7WQUWYS` - Valid test code  
- `TESTCODE` - Add manually for testing

## Deployment Checklist

- [ ] Create preview_codes table
- [ ] Insert initial 25 preview codes
- [ ] Implement validation endpoint
- [ ] Update profile creation endpoint
- [ ] Add preview code field to profiles table
- [ ] Set up rate limiting
- [ ] Add logging
- [ ] Test all scenarios
- [ ] Deploy to production
- [ ] Verify codes work in frontend

## Monitoring

Track these metrics:
- Code validation requests per day
- Code usage rate
- Failed validation attempts
- Time to code usage (how long from generation to use)

This will help you understand user adoption and adjust the preview program as needed.
