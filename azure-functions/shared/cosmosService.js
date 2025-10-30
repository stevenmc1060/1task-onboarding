const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB Configuration
const cosmosConfig = {
  endpoint: process.env.COSMOS_DB_ENDPOINT || 'https://your-cosmos-account.documents.azure.com:443/',
  key: process.env.COSMOS_DB_KEY || 'your-cosmos-key',
  databaseId: process.env.COSMOS_DB_DATABASE || '1task-database',
  containerId: process.env.COSMOS_DB_CONTAINER || 'preview-codes'
};

// Initialize Cosmos Client
const client = new CosmosClient({
  endpoint: cosmosConfig.endpoint,
  key: cosmosConfig.key
});

const database = client.database(cosmosConfig.databaseId);
const container = database.container(cosmosConfig.containerId);

/**
 * Cosmos DB Helper Functions
 */

// Get all preview codes with optional filters
async function getPreviewCodes(filters = {}) {
  try {
    let query = 'SELECT * FROM c WHERE c.type = "preview_code"';
    const parameters = [];

    if (filters.is_used !== undefined) {
      query += ' AND c.is_used = @is_used';
      parameters.push({ name: '@is_used', value: filters.is_used });
    }

    const { resources: codes } = await container.items.query({
      query,
      parameters
    }).fetchAll();

    return codes;
  } catch (error) {
    console.error('Error getting preview codes:', error);
    throw error;
  }
}

// Get preview code statistics
async function getPreviewCodeStats() {
  try {
    const codes = await getPreviewCodes();
    const total = codes.length;
    const used = codes.filter(code => code.is_used).length;
    const unused = total - used;

    return {
      total_codes: total,
      used_codes: used,
      unused_codes: unused,
      success_rate: total > 0 ? ((used / total) * 100).toFixed(2) : 0,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting preview code stats:', error);
    throw error;
  }
}

// Validate a preview code
async function validatePreviewCode(code, userId) {
  try {
    // Find the code
    const query = 'SELECT * FROM c WHERE c.type = "preview_code" AND c.code = @code';
    const { resources: codes } = await container.items.query({
      query,
      parameters: [{ name: '@code', value: code.toUpperCase() }]
    }).fetchAll();

    if (codes.length === 0) {
      return {
        valid: false,
        message: 'Preview code not found',
        error: 'CODE_NOT_FOUND'
      };
    }

    const codeDoc = codes[0];

    if (codeDoc.is_used) {
      return {
        valid: false,
        message: 'Preview code has already been used',
        error: 'CODE_ALREADY_USED',
        used_by: codeDoc.used_by,
        used_at: codeDoc.used_at
      };
    }

    // Mark code as used
    codeDoc.is_used = true;
    codeDoc.used_by = userId;
    codeDoc.used_at = new Date().toISOString();

    await container.item(codeDoc.id, codeDoc.code).replace(codeDoc);

    return {
      valid: true,
      message: 'Preview code is valid and has been marked as used',
      code_info: {
        code: codeDoc.code,
        created_at: codeDoc.created_at,
        used_at: codeDoc.used_at
      }
    };
  } catch (error) {
    console.error('Error validating preview code:', error);
    throw error;
  }
}

// Bulk load preview codes
async function bulkLoadPreviewCodes(codes, replaceExisting = false) {
  try {
    let loadedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const codeData of codes) {
      try {
        // Check if code already exists
        const query = 'SELECT * FROM c WHERE c.type = "preview_code" AND c.code = @code';
        const { resources: existingCodes } = await container.items.query({
          query,
          parameters: [{ name: '@code', value: codeData.code }]
        }).fetchAll();

        if (existingCodes.length > 0 && !replaceExisting) {
          skippedCount++;
          continue;
        }

        // Create new code document
        const codeDoc = {
          id: `preview_code_${codeData.code}`,
          type: 'preview_code',
          code: codeData.code,
          is_used: codeData.is_used || false,
          created_at: codeData.created_at || new Date().toISOString(),
          used_by: codeData.used_by || null,
          used_at: codeData.used_at || null
        };

        if (existingCodes.length > 0 && replaceExisting) {
          // Replace existing
          await container.item(existingCodes[0].id, existingCodes[0].code).replace(codeDoc);
        } else {
          // Create new
          await container.items.create(codeDoc);
        }

        loadedCount++;
      } catch (error) {
        errors.push(`Error loading code ${codeData.code}: ${error.message}`);
        console.error(`Error loading code ${codeData.code}:`, error);
      }
    }

    return {
      success: true,
      loaded_count: loadedCount,
      skipped_count: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully loaded ${loadedCount} codes, skipped ${skippedCount}`
    };
  } catch (error) {
    console.error('Error bulk loading preview codes:', error);
    throw error;
  }
}

// Reset preview codes
async function resetPreviewCodes(resetType = 'mark_unused') {
  try {
    const codes = await getPreviewCodes();
    let affectedCount = 0;

    if (resetType === 'delete_all') {
      // Delete all preview codes
      for (const code of codes) {
        await container.item(code.id, code.code).delete();
        affectedCount++;
      }
      return {
        success: true,
        affected_count: affectedCount,
        message: `Deleted ${affectedCount} preview codes`
      };
    } else {
      // Mark all codes as unused
      for (const code of codes) {
        if (code.is_used) {
          code.is_used = false;
          code.used_by = null;
          code.used_at = null;
          await container.item(code.id, code.code).replace(code);
          affectedCount++;
        }
      }
      return {
        success: true,
        affected_count: affectedCount,
        message: `Reset ${affectedCount} preview codes to unused state`
      };
    }
  } catch (error) {
    console.error('Error resetting preview codes:', error);
    throw error;
  }
}

module.exports = {
  getPreviewCodes,
  getPreviewCodeStats,
  validatePreviewCode,
  bulkLoadPreviewCodes,
  resetPreviewCodes,
  cosmosConfig
};
