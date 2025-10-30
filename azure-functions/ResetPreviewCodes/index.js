const { resetPreviewCodes } = require('../shared/cosmosService');

module.exports = async function (context, req) {
  context.log('Reset preview codes request received');

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
    const { reset_type = 'mark_unused', confirm = false } = req.body;

    // Require confirmation for destructive operations
    if (!confirm) {
      context.res.status = 400;
      context.res.body = {
        success: false,
        message: 'Confirmation required for reset operation',
        error: 'CONFIRMATION_REQUIRED'
      };
      return;
    }

    // Validate reset type
    if (!['mark_unused', 'delete_all'].includes(reset_type)) {
      context.res.status = 400;
      context.res.body = {
        success: false,
        message: 'Invalid reset_type. Must be "mark_unused" or "delete_all"',
        error: 'INVALID_RESET_TYPE'
      };
      return;
    }

    context.log(`Resetting preview codes with type: ${reset_type}`);
    
    // Reset the codes
    const result = await resetPreviewCodes(reset_type);
    
    context.res.status = 200;
    context.res.body = result;
    context.log(`✅ Reset completed: ${result.affected_count} codes affected`);

  } catch (error) {
    context.log.error('Error resetting preview codes:', error);
    context.res.status = 500;
    context.res.body = {
      success: false,
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    };
  }
};
