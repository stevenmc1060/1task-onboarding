# Preview Code API

Local backend API server for managing preview codes.

## Quick Start

```bash
# Install dependencies
cd api
npm install

# Start the server
npm run dev
```

The server will run on `http://localhost:3001`

## Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Admin Endpoints
- `GET /api/admin/preview-codes/stats` - Get code statistics
- `GET /api/admin/preview-codes/list` - List all codes
- `POST /api/admin/preview-codes/bulk-load` - Load multiple codes
- `POST /api/admin/preview-codes/reset` - Reset or delete codes

### Public Endpoints
- `POST /api/validate-preview-code` - Validate a preview code

## Database

Uses SQLite database stored in `api/preview_codes.db`

## Configuration

Update frontend to use local API:
```bash
# In .env.local
VITE_BACKEND_URL=http://localhost:3001
```
