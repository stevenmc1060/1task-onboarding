# Testing the Preview Code System

## Quick Frontend Testing (No Backend Required)

### Enable Mock API Testing:

1. **Enable mock mode** in `src/components/ProfileSetup.jsx`:
   ```javascript
   // Change this line from:
   const USE_MOCK_API = process.env.NODE_ENV === 'development' && false;
   // To:
   const USE_MOCK_API = process.env.NODE_ENV === 'development' && true;
   ```

2. **Uncomment the mock import** at the top of `ProfileSetup.jsx`:
   ```javascript
   // Change this line from:
   // import { mockValidatePreviewCode } from '../utils/mockPreviewCodes';
   // To:
   import { mockValidatePreviewCode } from '../utils/mockPreviewCodes';
   ```

3. **Fix the mock API call** in the validation function:
   ```javascript
   // Change this line from:
   // result = await mockValidatePreviewCode(code.trim(), account?.localAccountId);
   // To:
   result = await mockValidatePreviewCode(code.trim(), account?.localAccountId);
   ```

### Test Scenarios:

**Valid Codes (should work):**
- `WSHA61P9`
- `TESTCODE`  
- `DEMO1234`
- `PREVIEW1`

**Invalid Codes (should fail):**
- `INVALID123`
- `BADCODE`
- `WRONG`

**Test Flow:**
1. Enter a valid code → Should show green checkmark
2. Try to use the same code again → Should show "already used" error
3. Enter an invalid code → Should show "invalid code" error
4. Leave field empty → Should show "required" error

### Reset Test State:
Open browser console and run:
```javascript
// Reset mock state to test codes again
window.resetMockCodes?.();
```

## Full End-to-End Testing (With Backend)

Once you implement the backend:

1. **Set mock mode to false**:
   ```javascript
   const USE_MOCK_API = process.env.NODE_ENV === 'development' && false;
   ```

2. **Test with real generated codes**:
   - `WSHA61P9`
   - `F7WQUWYS`
   - `1PHZ5MG3`
   - etc.

3. **Verify backend behavior**:
   - Codes are marked as used in database
   - Profile creation includes preview code
   - Invalid codes return proper errors
   - Used codes can't be reused

## Manual Testing Checklist:

- [ ] Valid code shows green checkmark and success message
- [ ] Invalid code shows red X and error message  
- [ ] Used code shows "already used" error
- [ ] Empty code shows "required" error
- [ ] Submit button disabled without valid code
- [ ] Loading spinner shows during validation
- [ ] Form submits successfully with valid code
- [ ] Profile data includes preview code information

## Browser Console Testing:

```javascript
// Check mock statistics
console.log(getMockStats());

// Reset mock state  
resetMockCodes();
```
