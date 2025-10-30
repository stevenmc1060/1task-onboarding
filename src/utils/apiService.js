/**
 * API Service for Preview Code Management
 * Provides endpoints for loading, resetting, and managing preview codes
 */

import { apiConfig } from '../config';

class ApiService {
  constructor() {
    this.baseUrl = apiConfig.backendUrl;
  }

  /**
   * Load preview codes to the backend database
   * @param {Array} codes - Array of preview code objects
   * @returns {Promise<Object>} API response
   */
  async loadPreviewCodes(codes) {
    try {
      const response = await fetch(`${this.baseUrl}/bulk_load_codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          codes: codes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading preview codes:', error);
      throw error;
    }
  }

  /**
   * Reset all preview codes (mark as unused or delete)
   * @param {string} resetType - 'mark_unused' or 'delete_all'
   * @returns {Promise<Object>} API response
   */
  async resetPreviewCodes(resetType = 'mark_unused') {
    try {
      const response = await fetch(`${this.baseUrl}/reset_codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resetting preview codes:', error);
      throw error;
    }
  }

  /**
   * Get preview code statistics
   * @returns {Promise<Object>} Code statistics
   */
  async getPreviewCodeStats() {
    try {
      const response = await fetch(`${this.baseUrl}/preview-codes/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting preview code stats:', error);
      throw error;
    }
  }

  /**
   * List all preview codes (admin only)
   * @param {Object} filters - Optional filters (used, unused, etc.)
   * @returns {Promise<Object>} List of codes
   */
  async listPreviewCodes(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${this.baseUrl}/preview-codes-list?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing preview codes:', error);
      throw error;
    }
  }

  /**
   * Validate a single preview code
   * @param {string} code - Preview code to validate
   * @param {string} userId - User ID attempting to use the code
   * @returns {Promise<Object>} Validation result
   */
  async validatePreviewCode(code, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/preview-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating preview code:', error);
      throw error;
    }
  }

  /**
   * Load codes from the local preview-codes.json file
   * @returns {Promise<Array>} Array of code objects
   */
  async loadLocalPreviewCodes() {
    try {
      // In a real scenario, this would be a server-side operation
      // For now, we'll simulate loading from the JSON file
      const response = await fetch('/preview-codes.json');
      if (!response.ok) {
        throw new Error('Could not load local preview codes file');
      }
      const data = await response.json();
      return data.codes;
    } catch (error) {
      console.error('Error loading local preview codes:', error);
      throw error;
    }
  }

  /**
   * Get authentication token (placeholder)
   * In a real implementation, this would get the JWT token from MSAL or similar
   * @returns {string} Auth token
   */
  getAuthToken() {
    // For now, return a placeholder
    // In production, get this from MSAL context or localStorage
    return 'placeholder-admin-token';
  }

  /**
   * Check if backend API is available
   * @returns {Promise<boolean>} True if API is responsive
   */
  async checkApiHealth() {
    try {
      const healthUrl = `${this.baseUrl}/health`;
      console.log('🔍 Checking API health at:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit' // Don't send credentials for health check
      });
      
      console.log('📡 Health check response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check data:', data);
        return true;
      } else {
        console.error('❌ Health check failed with status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ API health check failed with error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export convenience functions
export const loadPreviewCodes = (codes) => apiService.loadPreviewCodes(codes);
export const resetPreviewCodes = (resetType) => apiService.resetPreviewCodes(resetType);
export const getPreviewCodeStats = () => apiService.getPreviewCodeStats();
export const listPreviewCodes = (filters) => apiService.listPreviewCodes(filters);
export const validatePreviewCode = (code, userId) => apiService.validatePreviewCode(code, userId);
export const loadLocalPreviewCodes = () => apiService.loadLocalPreviewCodes();
export const checkApiHealth = () => apiService.checkApiHealth();

export default apiService;
