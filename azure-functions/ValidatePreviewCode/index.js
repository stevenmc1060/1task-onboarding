const { validatePreviewCode } = require('../shared/cosmosService');

module.exports = async function (context, req) {
  context.log('Preview code validation request received');

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
    const { code, user_id } = req.body;

    // Validate input
    if (!code || !code.trim()) {
      context.res.status = 400;
      context.res.body = {
        valid: false,
        message: 'Preview code is required',
        error: 'MISSING_CODE'
      };
      return;
    }

    if (!user_id || !user_id.trim()) {
      context.res.status = 400;
      context.res.body = {
        valid: false,
        message: 'User ID is required',
        error: 'MISSING_USER_ID'
      };
      return;
    }

    // Validate the preview code
    const result = await validatePreviewCode(code.trim(), user_id.trim());

    if (result.valid) {
      context.res.status = 200;
      context.res.body = result;
      context.log(`✅ Preview code ${code} validated successfully for user ${user_id}`);
    } else {
      context.res.status = 400;
      context.res.body = result;
      context.log(`❌ Preview code ${code} validation failed: ${result.message}`);
    }

  } catch (error) {
    context.log.error('Error validating preview code:', error);
    context.res.status = 500;
    context.res.body = {
      valid: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    };
  }
};
