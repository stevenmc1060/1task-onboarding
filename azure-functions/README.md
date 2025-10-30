# Azure Functions for Preview Code Management

This folder contains Azure Functions that provide API endpoints for managing preview codes with Cosmos DB.

## Functions

### Public Endpoints
- `GET /api/health` - Health check endpoint
- `POST /api/validate-preview-code` - Validate a preview code during registration

### Admin Endpoints (require authentication)
- `GET /api/admin/preview-codes/stats` - Get preview code statistics
- `POST /api/admin/preview-codes/bulk-load` - Load preview codes to Cosmos DB
- `POST /api/admin/preview-codes/reset` - Reset or delete preview codes

## Setup

### 1. Install Dependencies
```bash
cd azure-functions
npm install
```

### 2. Configure Environment Variables
Set these in your Azure Function App settings:

```bash
COSMOS_DB_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-primary-key
COSMOS_DB_DATABASE=1task-database
COSMOS_DB_CONTAINER=preview-codes
```

### 3. Deploy to Azure
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Deploy to your existing Azure backend
func azure functionapp publish your-function-app-name
```

## Cosmos DB Container Setup

The functions expect a Cosmos DB container with these settings:

### Container Configuration
- **Container ID**: `preview-codes`
- **Partition Key**: `/code`
- **Indexing Policy**: Automatic indexing enabled

### Document Structure
```json
{
  "id": "preview_code_L4LQY6QW",
  "type": "preview_code",
  "code": "L4LQY6QW",
  "is_used": false,
  "created_at": "2025-10-29T02:20:01.987Z",
  "used_by": null,
  "used_at": null
}
```

## API Usage Examples

### Validate Preview Code
```bash
curl -X POST https://your-backend.azurewebsites.net/api/validate-preview-code \
  -H "Content-Type: application/json" \
  -d '{"code": "D4438F72", "user_id": "user-123"}'
```

### Get Statistics
```bash
curl https://your-backend.azurewebsites.net/api/admin/preview-codes/stats
```

### Load Codes
```bash
curl -X POST https://your-backend.azurewebsites.net/api/admin/preview-codes/bulk-load \
  -H "Content-Type: application/json" \
  -d '{
    "codes": [
      {
        "code": "L4LQY6QW",
        "is_used": false,
        "created_at": "2025-10-29T02:20:01.987Z"
      }
    ],
    "replace_existing": false
  }'
```

### Reset Codes
```bash
curl -X POST https://your-backend.azurewebsites.net/api/admin/preview-codes/reset \
  -H "Content-Type: application/json" \
  -d '{"reset_type": "mark_unused", "confirm": true}'
```

## Integration with Existing Backend

These functions are designed to be deployed to your existing Azure backend:
`https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net`

Once deployed, the admin panel and API service in the frontend will automatically work with these endpoints.

## Security Notes

- Admin endpoints use `authLevel: "function"` requiring function keys
- Public validation endpoint is accessible but rate-limited
- All endpoints include proper CORS headers
- Consider implementing additional authentication for admin operations
