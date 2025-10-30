module.exports = async function (context, req) {
  context.log('Health check request received');

  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    }
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  try {
    context.res.status = 200;
    context.res.body = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'preview-code-api',
      version: '1.0.0',
      endpoints: [
        'GET /api/health',
        'POST /api/validate-preview-code',
        'GET /api/admin/preview-codes/stats',
        'POST /api/admin/preview-codes/bulk-load',
        'POST /api/admin/preview-codes/reset'
      ]
    };
    
    context.log('✅ Health check successful');

  } catch (error) {
    context.log.error('Health check error:', error);
    context.res.status = 500;
    context.res.body = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};
