you# Preview Code List Endpoint Implementation

## 🎯 Overview
Add a list endpoint to show all preview codes and their assignment status in the admin panel.

## 📋 Missing Endpoint

**Endpoint:** `GET /api/admin/preview-code-list`  
**Purpose:** Return all preview codes with their usage status for the admin panel table

## 🔧 Implementation

### Code Implementation

```javascript
// GET /api/admin/preview-code-list
app.get('/api/admin/preview-code-list', async (req, res) => {
  try {
    // Query all preview codes from database
    const codes = await db.query(`
      SELECT 
        code,
        is_used,
        used_by,
        used_at,
        created_at
      FROM preview_codes 
      ORDER BY created_at ASC
    `);

    // Return codes in expected format
    res.json({
      success: true,
      codes: codes.map(row => ({
        code: row.code,
        is_used: row.is_used || false,
        used_by: row.used_by || null,
        used_at: row.used_at || null,
        created_at: row.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching preview codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preview codes',
      codes: []
    });
  }
});
```

### For Cosmos DB

```javascript
// Cosmos DB version
app.get('/api/admin/preview-code-list', async (req, res) => {
  try {
    const querySpec = {
      query: "SELECT c.code, c.is_used, c.used_by, c.used_at, c.created_at FROM c ORDER BY c.created_at ASC"
    };
    
    const { resources: codes } = await container.items.query(querySpec).fetchAll();

    res.json({
      success: true,
      codes: codes.map(item => ({
        code: item.code,
        is_used: item.is_used || false,
        used_by: item.used_by || null,
        used_at: item.used_at || null,
        created_at: item.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching preview codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preview codes',
      codes: []
    });
  }
});
```

## 📤 Response Format

### Success Response
```json
{
  "success": true,
  "codes": [
    {
      "code": "WSHA61P9",
      "is_used": false,
      "used_by": null,
      "used_at": null,
      "created_at": "2025-10-30T10:00:00Z"
    },
    {
      "code": "F7WQUWYS", 
      "is_used": true,
      "used_by": "user-12345",
      "used_at": "2025-10-30T15:30:00Z",
      "created_at": "2025-10-30T10:00:00Z"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to fetch preview codes",
  "codes": []
}
```

## 🔒 Security (Optional)

### Add Authentication
```javascript
const authenticateAdmin = (req, res, next) => {
  // Your admin authentication logic
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!isValidAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/api/admin/preview-code-list', authenticateAdmin, async (req, res) => {
  // ... endpoint code
});
```

### Add Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many admin requests'
});

app.get('/api/admin/preview-code-list', adminLimiter, async (req, res) => {
  // ... endpoint code
});
```

## 🧪 Testing

### Test Command
```bash
curl "https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api/admin/preview-code-list"
```

### Expected Result
- JSON response with array of all preview codes
- Each code shows: code, is_used, used_by, used_at, created_at
- Should return all 60 codes currently in your database

## ✅ What This Fixes

Once deployed, the admin panel will:
- ✅ Show **real preview codes** instead of "CODE0001" placeholders
- ✅ Display **actual user assignments** 
- ✅ Show **real usage dates**
- ✅ Update in real-time when codes are used

## 🚀 Deployment

1. **Add the endpoint** to your backend code
2. **Deploy to Azure** 
3. **Test with curl** command above
4. **Visit `/admin`** - table will show real codes automatically

The frontend is already configured to call this endpoint and will switch from placeholder data to real data once it's available!
