const { getPreviewCodeStats } = require('../shared/cosmosService');

module.exports = async function (context, req) {
  context.log('Preview code stats request received');

  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  try {
    const stats = await getPreviewCodeStats();
    
    context.res.status = 200;
    context.res.body = stats;
    context.log('✅ Preview code stats retrieved successfully');

  } catch (error) {
    context.log.error('Error getting preview code stats:', error);
    context.res.status = 500;
    context.res.body = {
      error: 'Internal server error',
      message: 'Failed to retrieve preview code statistics'
    };
  }
};
