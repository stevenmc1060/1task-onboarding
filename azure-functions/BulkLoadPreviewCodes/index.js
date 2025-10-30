const { bulkLoadPreviewCodes } = require('../shared/cosmosService');

module.exports = async function (context, req) {
  context.log('Bulk load preview codes request received');

  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { codes, replace_existing = false } = req.body;

    // Validate input
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      context.res.status = 400;
      context.res.body = {
        success: false,
        message: 'Codes array is required and must not be empty',
        error: 'INVALID_INPUT'
      };
      return;
    }

    // Validate each code has required fields
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (!code.code || typeof code.code !== 'string') {
        context.res.status = 400;
        context.res.body = {
          success: false,
          message: `Code at index ${i} is missing required 'code' field`,
          error: 'INVALID_CODE_FORMAT'
        };
        return;
      }
    }

    context.log(`Loading ${codes.length} preview codes (replace_existing: ${replace_existing})`);
    
    // Load the codes
    const result = await bulkLoadPreviewCodes(codes, replace_existing);
    
    context.res.status = 200;
    context.res.body = result;
    context.log(`✅ Bulk load completed: ${result.loaded_count} loaded, ${result.skipped_count} skipped`);

  } catch (error) {
    context.log.error('Error bulk loading preview codes:', error);
    context.res.status = 500;
    context.res.body = {
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    };
  }
};
