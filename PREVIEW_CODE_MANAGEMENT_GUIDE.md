# Preview Code Management System

This document describes the complete preview code management system for the OneTaskAssistant onboarding application.

## Overview

The system provides both frontend UI and backend API endpoints for managing preview codes, including loading, resetting, and monitoring code usage.

## Components

### 1. API Service (`src/utils/apiService.js`)
Core service for interacting with backend preview code endpoints:

- `loadPreviewCodes(codes)` - Bulk load codes to backend
- `resetPreviewCodes(resetType)` - Reset or delete all codes
- `getPreviewCodeStats()` - Get usage statistics
- `listPreviewCodes(filters)` - List all codes with filters
- `validatePreviewCode(code, userId)` - Validate a single code
- `loadLocalPreviewCodes()` - Load codes from local JSON file
- `checkApiHealth()` - Check backend API status

### 2. Admin Panel (`src/components/AdminPanel.jsx`)
Web UI for managing preview codes:

- View real-time statistics (total, used, available, success rate)
- Load local codes to backend database
- Reset all codes (mark unused or delete completely)
- Check backend API health status
- Preview local codes before loading

**Access:** Visit `/admin` in your browser while dev server is running

### 3. Command-Line Tool (`manage-codes.js`)
Node.js script for command-line management:

```bash
# Load codes from JSON to backend
node manage-codes.js load

# Reset codes (mark as unused)
node manage-codes.js reset mark_unused

# Delete all codes
node manage-codes.js reset delete_all

# Get statistics
node manage-codes.js stats

# Test a specific code
node manage-codes.js test D4438F72

# Show help
node manage-codes.js help
```

## Backend API Endpoints

The system expects these endpoints on the backend:

### Admin Endpoints (require authentication)
- `POST /api/admin/preview-codes/bulk-load` - Load multiple codes
- `POST /api/admin/preview-codes/reset` - Reset/delete codes
- `GET /api/admin/preview-codes/stats` - Get statistics
- `GET /api/admin/preview-codes/list` - List all codes

### Public Endpoints
- `POST /api/validate-preview-code` - Validate a code during registration
- `GET /api/health` - API health check

## API Request/Response Formats

### Bulk Load Codes
```javascript
// Request
POST /api/admin/preview-codes/bulk-load
{
  "codes": [
    {
      "code": "L4LQY6QW",
      "is_used": false,
      "created_at": "2025-10-29T02:20:01.987Z",
      "used_by": null,
      "used_at": null
    }
    // ... more codes
  ],
  "operation": "bulk_insert",
  "replace_existing": false
}

// Response
{
  "success": true,
  "loaded_count": 25,
  "skipped_count": 0,
  "message": "Successfully loaded 25 preview codes"
}
```

### Reset Codes
```javascript
// Request
POST /api/admin/preview-codes/reset
{
  "reset_type": "mark_unused", // or "delete_all"
  "confirm": true
}

// Response
{
  "success": true,
  "affected_count": 25,
  "message": "Reset 25 preview codes to unused state"
}
```

### Get Statistics
```javascript
// Response
GET /api/admin/preview-codes/stats
{
  "total_codes": 25,
  "unused_codes": 20,
  "used_codes": 5,
  "success_rate": 20.0,
  "last_updated": "2025-10-29T14:30:00Z"
}
```

### Validate Code
```javascript
// Request
POST /api/validate-preview-code
{
  "code": "D4438F72",
  "user_id": "user-12345"
}

// Response (valid code)
{
  "valid": true,
  "message": "Preview code is valid",
  "code_info": {
    "code": "D4438F72",
    "created_at": "2025-10-29T02:20:01.987Z"
  }
}

// Response (invalid/used code)
{
  "valid": false,
  "message": "Preview code is invalid or already used",
  "error": "CODE_USED"
}
```

## Current Code List

The system currently has **25 valid preview codes** generated and stored in `preview-codes.json`:

1. L4LQY6QW   2. TL5YQ8I5   3. RYT8M33R   4. S1K97PSI   5. 51QZULKH
6. SP8PR4PV   7. IN5I3INX   8. 5WVRI957   9. 7GZH43NF   10. BG2QGTFV
11. D5EXAKUE  12. PQI24HR9  13. GH525GA5  14. 1ZE4DAI4  15. J4C3PF83
16. 52AYY4XI  17. QCZ1J1BQ  18. RCA2ETID  19. FFKWLL2E  20. XHK54575
21. 57N8XFUZ  22. FZZ9WVKL  23. YEMZ25D8  24. ANJA9H9F  25. D4438F72

## Development vs Production

### Development Mode (Mock API)
- Set `USE_MOCK_API = true` in `ProfileSetup.jsx`
- Codes are validated against the local mock list
- Multi-use test codes available: `DEVTEST`, `MULTIUSE`, `REUSABLE`, `TESTING123`
- No actual database interaction

### Production Mode (Real Backend)
- Set `USE_MOCK_API = false` in `ProfileSetup.jsx`
- Codes must be loaded to backend database first
- One-time use only (codes become invalid after use)
- Requires working backend API endpoints

## Fixed Launch Functionality

The "Launch OneTaskAssistant" button now:
- ✅ Only stores minimal authentication data (user ID, account hints)
- ✅ Does NOT pass onboarding form data to the main app
- ✅ Creates clean redirect without user profile information
- ✅ Maintains authentication continuity for seamless login

## Usage Instructions

### For Development Testing
1. Ensure mock API is enabled (`USE_MOCK_API = true`)
2. Use any of the 25 generated codes or test codes
3. Visit `/admin` to see the management interface

### For Production Setup
1. Ensure backend API endpoints are implemented
2. Use command-line tool or admin panel to load codes
3. Set `USE_MOCK_API = false` for live validation
4. Monitor usage through admin panel or stats endpoint

### Loading Codes to Backend
**Option 1: Admin Panel**
1. Visit `http://localhost:5173/admin`
2. Click "Load Local Codes to Backend"

**Option 2: Command Line**
```bash
node manage-codes.js load
```

**Option 3: Manual SQL** (if API endpoints not available)
```sql
INSERT INTO preview_codes (code, is_used, created_at, used_by, used_at)
VALUES
  ('L4LQY6QW', 0, '2025-10-29T02:20:01.987Z', NULL, NULL),
  ('TL5YQ8I5', 0, '2025-10-29T02:20:01.987Z', NULL, NULL),
  -- ... (all 25 codes)
```

## Security Considerations

- Admin endpoints should require proper authentication
- Preview codes should be stored securely in the database
- Rate limiting should be applied to validation endpoints
- Audit logging recommended for code usage tracking

## Troubleshooting

### "Invalid preview code" Error
1. Check if backend API endpoints are implemented
2. Verify codes are loaded to database
3. Ensure API URL is correct in `.env.local`
4. Check browser console for API errors
5. Try enabling mock API for testing

### Backend Connection Issues
1. Check `VITE_BACKEND_URL` in environment variables
2. Verify backend is running and accessible
3. Check CORS configuration on backend
4. Test API health with `node manage-codes.js stats`

### Admin Panel Not Loading
1. Ensure `/admin` route is accessible
2. Check browser console for component errors
3. Verify `preview-codes.json` exists in `public/` directory
4. Check network tab for failed API requests
