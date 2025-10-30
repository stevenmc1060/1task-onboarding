const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple JSON file database
const dbPath = path.join(__dirname, 'preview_codes.json');
let codesDB = { codes: [], stats: { total: 0, used: 0, unused: 0 } };

// Load existing database
const loadDatabase = async () => {
  try {
    if (await fs.pathExists(dbPath)) {
      codesDB = await fs.readJson(dbPath);
    }
    updateStats();
  } catch (error) {
    console.error('Error loading database:', error);
    codesDB = { codes: [], stats: { total: 0, used: 0, unused: 0 } };
  }
};

// Save database
const saveDatabase = async () => {
  try {
    updateStats();
    await fs.writeJson(dbPath, codesDB, { spaces: 2 });
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Update statistics
const updateStats = () => {
  const total = codesDB.codes.length;
  const used = codesDB.codes.filter(c => c.is_used).length;
  codesDB.stats = {
    total,
    used,
    unused: total - used,
    last_updated: new Date().toISOString()
  };
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://register.1taskassistant.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Stricter rate limiting for validation endpoint
const validateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 validation attempts per minute
  message: 'Too many validation attempts, please try again later.'
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'preview-code-api',
    version: '1.0.0'
  });
});

// Get preview code statistics
app.get('/api/admin/preview-codes/stats', async (req, res) => {
  try {
    await loadDatabase();
    res.json(codesDB.stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// List all preview codes (with optional filters)
app.get('/api/admin/preview-codes/list', (req, res) => {
  const { used, limit = 100, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM preview_codes';
  let params = [];
  
  if (used !== undefined) {
    query += ' WHERE is_used = ?';
    params.push(used === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      codes: rows.map(row => ({
        id: row.id,
        code: row.code,
        is_used: row.is_used === 1,
        created_at: row.created_at,
        used_by: row.used_by,
        used_at: row.used_at
      })),
      total: rows.length
    });
  });
});

// Bulk load preview codes
app.post('/api/admin/preview-codes/bulk-load', (req, res) => {
  const { codes, operation = 'bulk_insert', replace_existing = false } = req.body;
  
  if (!codes || !Array.isArray(codes)) {
    return res.status(400).json({ error: 'Codes array is required' });
  }
  
  if (codes.length === 0) {
    return res.status(400).json({ error: 'No codes provided' });
  }
  
  if (codes.length > 1000) {
    return res.status(400).json({ error: 'Too many codes (max 1000 per request)' });
  }
  
  // If replace_existing is true, clear existing codes first
  const processInsert = () => {
    let loadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const insertPromises = codes.map(codeObj => {
      return new Promise((resolve) => {
        const code = typeof codeObj === 'string' ? codeObj : codeObj.code;
        const createdAt = codeObj.created_at || new Date().toISOString();
        
        const stmt = db.prepare('INSERT OR IGNORE INTO preview_codes (code, is_used, created_at) VALUES (?, 0, ?)');
        stmt.run(code, createdAt, function(err) {
          if (err) {
            console.error('Error inserting code:', code, err);
            errorCount++;
          } else if (this.changes > 0) {
            loadedCount++;
          } else {
            skippedCount++;
          }
          resolve();
        });
        stmt.finalize();
      });
    });
    
    Promise.all(insertPromises).then(() => {
      res.json({
        success: true,
        loaded_count: loadedCount,
        skipped_count: skippedCount,
        error_count: errorCount,
        message: `Successfully loaded ${loadedCount} preview codes. ${skippedCount} duplicates skipped. ${errorCount} errors.`
      });
    });
  };
  
  if (replace_existing) {
    db.run('DELETE FROM preview_codes', (err) => {
      if (err) {
        console.error('Error clearing existing codes:', err);
        return res.status(500).json({ error: 'Failed to clear existing codes' });
      }
      processInsert();
    });
  } else {
    processInsert();
  }
});

// Reset preview codes
app.post('/api/admin/preview-codes/reset', (req, res) => {
  const { reset_type = 'mark_unused', confirm = false } = req.body;
  
  if (!confirm) {
    return res.status(400).json({ error: 'Confirmation required for reset operation' });
  }
  
  let query;
  let message;
  
  if (reset_type === 'delete_all') {
    query = 'DELETE FROM preview_codes';
    message = 'Deleted all preview codes';
  } else {
    query = 'UPDATE preview_codes SET is_used = 0, used_by = NULL, used_at = NULL WHERE is_used = 1';
    message = 'Reset all used codes to unused state';
  }
  
  db.run(query, function(err) {
    if (err) {
      console.error('Reset error:', err);
      return res.status(500).json({ error: 'Failed to reset codes' });
    }
    
    res.json({
      success: true,
      affected_count: this.changes,
      message: `${message}. Affected ${this.changes} codes.`
    });
  });
});

// Validate preview code (public endpoint)
app.post('/api/validate-preview-code', validateLimiter, (req, res) => {
  const { code, user_id } = req.body;
  
  if (!code || !code.trim()) {
    return res.status(400).json({
      valid: false,
      message: 'Preview code is required',
      error: 'MISSING_CODE'
    });
  }
  
  if (!user_id) {
    return res.status(400).json({
      valid: false,
      message: 'User ID is required',
      error: 'MISSING_USER_ID'
    });
  }
  
  const normalizedCode = code.trim().toUpperCase();
  
  // Check if code exists and is unused
  db.get('SELECT * FROM preview_codes WHERE code = ?', [normalizedCode], (err, row) => {
    if (err) {
      console.error('Database error during validation:', err);
      return res.status(500).json({
        valid: false,
        message: 'Validation service temporarily unavailable',
        error: 'DATABASE_ERROR'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        valid: false,
        message: 'Preview code not found',
        error: 'CODE_NOT_FOUND'
      });
    }
    
    if (row.is_used === 1) {
      return res.status(409).json({
        valid: false,
        message: 'Preview code has already been used',
        error: 'CODE_ALREADY_USED',
        used_at: row.used_at,
        used_by: row.used_by
      });
    }
    
    // Mark code as used
    const usedAt = new Date().toISOString();
    db.run(
      'UPDATE preview_codes SET is_used = 1, used_by = ?, used_at = ? WHERE code = ?',
      [user_id, usedAt, normalizedCode],
      function(updateErr) {
        if (updateErr) {
          console.error('Error marking code as used:', updateErr);
          return res.status(500).json({
            valid: false,
            message: 'Failed to process code validation',
            error: 'UPDATE_ERROR'
          });
        }
        
        // Success
        res.json({
          valid: true,
          message: 'Preview code is valid and has been activated',
          code_info: {
            code: normalizedCode,
            created_at: row.created_at,
            activated_at: usedAt
          }
        });
      }
    );
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Preview Code API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Database: ${dbPath}`);
});

module.exports = app;
