# Preview Code Endpoints for Existing Cosmos DB Backend

These are the 4 missing endpoints that need to be added to your existing backend at:
`https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net`

## Cosmos DB Container Setup

First, ensure you have a container for preview codes in your existing Cosmos DB:

**Container Name**: `preview_codes`
**Partition Key**: `/code`

## Document Structure

```json
{
  "id": "preview_code_L4LQY6QW",
  "code": "L4LQY6QW", 
  "document_type": "preview_code",
  "is_used": false,
  "created_at": "2025-10-29T02:20:01.987Z",
  "used_by": null,
  "used_at": null
}
```

## Endpoint 1: Validate Preview Code

**Route**: `POST /api/validate-preview-code`

```python
# For Python/FastAPI backend
from azure.cosmos import CosmosClient
from datetime import datetime

@app.post("/api/validate-preview-code")
async def validate_preview_code(request: dict):
    code = request.get("code", "").strip().upper()
    user_id = request.get("user_id", "").strip()
    
    if not code or not user_id:
        raise HTTPException(status_code=400, detail={
            "valid": False,
            "message": "Code and user_id are required",
            "error": "MISSING_FIELDS"
        })
    
    # Check if code exists and is unused
    query = "SELECT * FROM c WHERE c.document_type = 'preview_code' AND c.code = @code"
    items = list(preview_codes_container.query_items(
        query=query,
        parameters=[{"name": "@code", "value": code}],
        enable_cross_partition_query=True
    ))
    
    if not items:
        raise HTTPException(status_code=404, detail={
            "valid": False,
            "message": "Preview code not found",
            "error": "CODE_NOT_FOUND"
        })
    
    code_doc = items[0]
    
    if code_doc["is_used"]:
        raise HTTPException(status_code=400, detail={
            "valid": False,
            "message": "Preview code has already been used",
            "error": "CODE_ALREADY_USED",
            "used_by": code_doc["used_by"],
            "used_at": code_doc["used_at"]
        })
    
    # Mark code as used
    code_doc["is_used"] = True
    code_doc["used_by"] = user_id
    code_doc["used_at"] = datetime.utcnow().isoformat() + "Z"
    
    preview_codes_container.replace_item(item=code_doc["id"], body=code_doc)
    
    return {
        "valid": True,
        "message": "Preview code is valid and has been marked as used",
        "code_info": {
            "code": code_doc["code"],
            "created_at": code_doc["created_at"],
            "used_at": code_doc["used_at"]
        }
    }
```

```javascript
// For Node.js/Express backend
app.post('/api/validate-preview-code', async (req, res) => {
    try {
        const { code, user_id } = req.body;
        
        if (!code || !user_id) {
            return res.status(400).json({
                valid: false,
                message: "Code and user_id are required",
                error: "MISSING_FIELDS"
            });
        }
        
        const normalizedCode = code.trim().toUpperCase();
        
        // Query for the code
        const query = {
            query: "SELECT * FROM c WHERE c.document_type = 'preview_code' AND c.code = @code",
            parameters: [{ name: "@code", value: normalizedCode }]
        };
        
        const { resources: codes } = await previewCodesContainer.items.query(query).fetchAll();
        
        if (codes.length === 0) {
            return res.status(404).json({
                valid: false,
                message: "Preview code not found",
                error: "CODE_NOT_FOUND"
            });
        }
        
        const codeDoc = codes[0];
        
        if (codeDoc.is_used) {
            return res.status(400).json({
                valid: false,
                message: "Preview code has already been used",
                error: "CODE_ALREADY_USED",
                used_by: codeDoc.used_by,
                used_at: codeDoc.used_at
            });
        }
        
        // Mark as used
        codeDoc.is_used = true;
        codeDoc.used_by = user_id.trim();
        codeDoc.used_at = new Date().toISOString();
        
        await previewCodesContainer.item(codeDoc.id, normalizedCode).replace(codeDoc);
        
        res.json({
            valid: true,
            message: "Preview code is valid and has been marked as used",
            code_info: {
                code: codeDoc.code,
                created_at: codeDoc.created_at,
                used_at: codeDoc.used_at
            }
        });
        
    } catch (error) {
        console.error('Error validating preview code:', error);
        res.status(500).json({
            valid: false,
            message: "Internal server error",
            error: "SERVER_ERROR"
        });
    }
});
```

## Endpoint 2: Get Preview Code Statistics

**Route**: `GET /api/admin/preview-codes/stats`

```python
@app.get("/api/admin/preview-codes/stats")
async def get_preview_code_stats():
    # Get total count
    total_query = "SELECT VALUE COUNT(1) FROM c WHERE c.document_type = 'preview_code'"
    total_result = list(preview_codes_container.query_items(
        query=total_query, enable_cross_partition_query=True
    ))
    total_codes = total_result[0] if total_result else 0
    
    # Get used count
    used_query = "SELECT VALUE COUNT(1) FROM c WHERE c.document_type = 'preview_code' AND c.is_used = true"
    used_result = list(preview_codes_container.query_items(
        query=used_query, enable_cross_partition_query=True
    ))
    used_codes = used_result[0] if used_result else 0
    
    unused_codes = total_codes - used_codes
    success_rate = (used_codes / total_codes * 100) if total_codes > 0 else 0
    
    return {
        "total_codes": total_codes,
        "used_codes": used_codes,
        "unused_codes": unused_codes,
        "success_rate": round(success_rate, 2),
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }
```

```javascript
app.get('/api/admin/preview-codes/stats', async (req, res) => {
    try {
        // Get all preview codes
        const query = {
            query: "SELECT * FROM c WHERE c.document_type = 'preview_code'"
        };
        
        const { resources: codes } = await previewCodesContainer.items.query(query).fetchAll();
        
        const total_codes = codes.length;
        const used_codes = codes.filter(code => code.is_used).length;
        const unused_codes = total_codes - used_codes;
        const success_rate = total_codes > 0 ? ((used_codes / total_codes) * 100).toFixed(2) : 0;
        
        res.json({
            total_codes,
            used_codes,
            unused_codes,
            success_rate: parseFloat(success_rate),
            last_updated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting preview code stats:', error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to retrieve preview code statistics"
        });
    }
});
```

## Endpoint 3: Bulk Load Preview Codes

**Route**: `POST /api/admin/preview-codes/bulk-load`

```python
@app.post("/api/admin/preview-codes/bulk-load")
async def bulk_load_preview_codes(request: dict):
    codes = request.get("codes", [])
    replace_existing = request.get("replace_existing", False)
    
    if not codes or not isinstance(codes, list):
        raise HTTPException(status_code=400, detail={
            "success": False,
            "message": "Codes array is required",
            "error": "INVALID_INPUT"
        })
    
    loaded_count = 0
    skipped_count = 0
    errors = []
    
    for code_data in codes:
        try:
            code = code_data.get("code", "").strip().upper()
            if not code:
                errors.append(f"Missing code in entry: {code_data}")
                continue
            
            # Check if exists
            existing_query = "SELECT * FROM c WHERE c.document_type = 'preview_code' AND c.code = @code"
            existing_items = list(preview_codes_container.query_items(
                query=existing_query,
                parameters=[{"name": "@code", "value": code}],
                enable_cross_partition_query=True
            ))
            
            if existing_items and not replace_existing:
                skipped_count += 1
                continue
            
            # Create document
            doc = {
                "id": f"preview_code_{code}",
                "code": code,
                "document_type": "preview_code",
                "is_used": code_data.get("is_used", False),
                "created_at": code_data.get("created_at", datetime.utcnow().isoformat() + "Z"),
                "used_by": code_data.get("used_by"),
                "used_at": code_data.get("used_at")
            }
            
            if existing_items and replace_existing:
                preview_codes_container.replace_item(item=existing_items[0]["id"], body=doc)
            else:
                preview_codes_container.create_item(body=doc)
            
            loaded_count += 1
            
        except Exception as e:
            errors.append(f"Error loading code {code_data.get('code', 'unknown')}: {str(e)}")
    
    return {
        "success": True,
        "loaded_count": loaded_count,
        "skipped_count": skipped_count,
        "errors": errors if errors else None,
        "message": f"Successfully loaded {loaded_count} codes, skipped {skipped_count}"
    }
```

```javascript
app.post('/api/admin/preview-codes/bulk-load', async (req, res) => {
    try {
        const { codes, replace_existing = false } = req.body;
        
        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Codes array is required and must not be empty",
                error: "INVALID_INPUT"
            });
        }
        
        let loaded_count = 0;
        let skipped_count = 0;
        const errors = [];
        
        for (const code_data of codes) {
            try {
                const code = code_data.code?.trim().toUpperCase();
                if (!code) {
                    errors.push(`Missing code in entry: ${JSON.stringify(code_data)}`);
                    continue;
                }
                
                // Check if exists
                const existingQuery = {
                    query: "SELECT * FROM c WHERE c.document_type = 'preview_code' AND c.code = @code",
                    parameters: [{ name: "@code", value: code }]
                };
                
                const { resources: existing } = await previewCodesContainer.items.query(existingQuery).fetchAll();
                
                if (existing.length > 0 && !replace_existing) {
                    skipped_count++;
                    continue;
                }
                
                // Create document
                const doc = {
                    id: `preview_code_${code}`,
                    code: code,
                    document_type: "preview_code",
                    is_used: code_data.is_used || false,
                    created_at: code_data.created_at || new Date().toISOString(),
                    used_by: code_data.used_by || null,
                    used_at: code_data.used_at || null
                };
                
                if (existing.length > 0 && replace_existing) {
                    await previewCodesContainer.item(existing[0].id, code).replace(doc);
                } else {
                    await previewCodesContainer.items.create(doc);
                }
                
                loaded_count++;
                
            } catch (error) {
                errors.push(`Error loading code ${code_data.code}: ${error.message}`);
            }
        }
        
        res.json({
            success: true,
            loaded_count,
            skipped_count,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully loaded ${loaded_count} codes, skipped ${skipped_count}`
        });
        
    } catch (error) {
        console.error('Error bulk loading preview codes:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: "SERVER_ERROR"
        });
    }
});
```

## Endpoint 4: Reset Preview Codes

**Route**: `POST /api/admin/preview-codes/reset`

```python
@app.post("/api/admin/preview-codes/reset")
async def reset_preview_codes(request: dict):
    reset_type = request.get("reset_type", "mark_unused")
    confirm = request.get("confirm", False)
    
    if not confirm:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "message": "Confirmation required for reset operation",
            "error": "CONFIRMATION_REQUIRED"
        })
    
    if reset_type not in ["mark_unused", "delete_all"]:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "message": "Invalid reset_type. Must be 'mark_unused' or 'delete_all'",
            "error": "INVALID_RESET_TYPE"
        })
    
    # Get all preview codes
    query = "SELECT * FROM c WHERE c.document_type = 'preview_code'"
    codes = list(preview_codes_container.query_items(
        query=query, enable_cross_partition_query=True
    ))
    
    affected_count = 0
    
    if reset_type == "delete_all":
        for code in codes:
            preview_codes_container.delete_item(item=code["id"], partition_key=code["code"])
            affected_count += 1
        message = f"Deleted {affected_count} preview codes"
    else:
        for code in codes:
            if code["is_used"]:
                code["is_used"] = False
                code["used_by"] = None
                code["used_at"] = None
                preview_codes_container.replace_item(item=code["id"], body=code)
                affected_count += 1
        message = f"Reset {affected_count} preview codes to unused state"
    
    return {
        "success": True,
        "affected_count": affected_count,
        "message": message
    }
```

```javascript
app.post('/api/admin/preview-codes/reset', async (req, res) => {
    try {
        const { reset_type = 'mark_unused', confirm = false } = req.body;
        
        if (!confirm) {
            return res.status(400).json({
                success: false,
                message: "Confirmation required for reset operation",
                error: "CONFIRMATION_REQUIRED"
            });
        }
        
        if (!['mark_unused', 'delete_all'].includes(reset_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset_type. Must be 'mark_unused' or 'delete_all'",
                error: "INVALID_RESET_TYPE"
            });
        }
        
        // Get all preview codes
        const query = {
            query: "SELECT * FROM c WHERE c.document_type = 'preview_code'"
        };
        
        const { resources: codes } = await previewCodesContainer.items.query(query).fetchAll();
        
        let affected_count = 0;
        
        if (reset_type === 'delete_all') {
            for (const code of codes) {
                await previewCodesContainer.item(code.id, code.code).delete();
                affected_count++;
            }
        } else {
            for (const code of codes) {
                if (code.is_used) {
                    code.is_used = false;
                    code.used_by = null;
                    code.used_at = null;
                    await previewCodesContainer.item(code.id, code.code).replace(code);
                    affected_count++;
                }
            }
        }
        
        const message = reset_type === 'delete_all' 
            ? `Deleted ${affected_count} preview codes`
            : `Reset ${affected_count} preview codes to unused state`;
        
        res.json({
            success: true,
            affected_count,
            message
        });
        
    } catch (error) {
        console.error('Error resetting preview codes:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: "SERVER_ERROR"
        });
    }
});
```

## Container Initialization

Add this to initialize the preview codes container:

```python
# Python setup
cosmos_client = CosmosClient(COSMOS_DB_ENDPOINT, COSMOS_DB_KEY)
database = cosmos_client.get_database_client(DATABASE_NAME)
preview_codes_container = database.get_container_client("preview_codes")
```

```javascript
// Node.js setup
const { CosmosClient } = require('@azure/cosmos');

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});

const database = cosmosClient.database(process.env.DATABASE_NAME);
const previewCodesContainer = database.container('preview_codes');
```

## Next Steps

1. **Add these 4 endpoints** to your existing backend codebase
2. **Create the `preview_codes` container** in your Cosmos DB
3. **Deploy the updated backend**
4. **Test with the admin panel** at `/admin`

Once deployed, your admin panel will show "Backend API: ✅ Online" and all functionality will work!
