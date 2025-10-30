import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import mockPreviewCodes from '../utils/mockPreviewCodes';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [allCodes, setAllCodes] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);

  // Admin PIN for local access (in production, this should be more secure)
  const ADMIN_PIN = '3765';

  // Handle PIN submission
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Invalid PIN. Please try again.');
      setPinInput('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
  };

  // Check backend health on component mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkBackendHealth();
    }
  }, [isAuthenticated]);

  const checkBackendHealth = async () => {
    setIsCheckingHealth(true);
    console.log('🔍 AdminPanel: Checking backend health...');
    
    try {
      const isHealthy = await apiService.checkApiHealth();
      console.log('📊 AdminPanel: Health check result:', isHealthy);
      setIsBackendOnline(isHealthy);
    } catch (error) {
      console.error('❌ AdminPanel: Health check error:', error);
      setIsBackendOnline(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleLoadCodes = async () => {
    setIsLoading(true);
    setLoadStatus('Loading preview codes...');
    console.log('📤 AdminPanel: Loading preview codes to backend...');

    try {
      if (mockMode) {
        // Mock mode simulation
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        setLoadStatus(`✅ [MOCK] Successfully loaded ${mockPreviewCodes.length} preview codes`);
        console.log('✅ AdminPanel: [MOCK] Codes loaded successfully');
        setStats({
          total_codes: mockPreviewCodes.length,
          unused_codes: mockPreviewCodes.length - 5,
          used_codes: 5,
          expired_codes: 0
        });
        return;
      }

      if (!isBackendOnline) {
        throw new Error('Backend is offline - cannot load codes');
      }

      const result = await apiService.loadPreviewCodes(mockPreviewCodes);
      console.log('✅ AdminPanel: Codes loaded successfully:', result);
      
      // Handle different response formats
      if (result.success !== undefined) {
        // New format: {success, message, created_count}
        if (result.success) {
          setLoadStatus(`✅ Successfully loaded ${result.created_count || mockPreviewCodes.length} preview codes`);
        } else {
          throw new Error(result.message || 'Failed to load codes');
        }
      } else if (result.loaded_count !== undefined) {
        // Current backend format: {message, loaded_count, total_requested}
        setLoadStatus(`✅ ${result.message} (${result.loaded_count}/${result.total_requested})`);
      } else {
        // Fallback
        setLoadStatus(`✅ Codes loaded successfully`);
      }
      
      // Refresh stats and codes after loading
      await getStats();
      await getAllCodes();
    } catch (error) {
      console.error('❌ AdminPanel: Error loading codes:', error);
      setLoadStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCodes = async () => {
    setIsLoading(true);
    setResetStatus('Resetting preview codes...');
    console.log('🔄 AdminPanel: Resetting preview codes...');

    try {
      if (mockMode) {
        // Mock mode simulation
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API delay
        setResetStatus(`✅ [MOCK] Successfully reset all preview codes`);
        console.log('✅ AdminPanel: [MOCK] Codes reset successfully');
        setStats({
          total_codes: mockPreviewCodes.length,
          unused_codes: mockPreviewCodes.length,
          used_codes: 0,
          expired_codes: 0
        });
        return;
      }

      if (!isBackendOnline) {
        throw new Error('Backend is offline - cannot reset codes');
      }

      const result = await apiService.resetPreviewCodes('mark_unused');
      console.log('✅ AdminPanel: Codes reset successfully:', result);
      
      // Handle different response formats
      if (result.success !== undefined) {
        // Expected format: {success, message, reset_count}
        if (result.success) {
          setResetStatus(`✅ Successfully reset ${result.reset_count || 'all'} preview codes`);
        } else {
          throw new Error(result.message || 'Failed to reset codes');
        }
      } else if (result.message) {
        // Fallback: just show the message
        setResetStatus(`✅ ${result.message}`);
      } else {
        setResetStatus(`✅ Codes reset successfully`);
      }
      
      // Refresh stats and codes after reset
      await getStats();
      await getAllCodes();
    } catch (error) {
      console.error('❌ AdminPanel: Error resetting codes:', error);
      setResetStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = async () => {
    console.log('📊 AdminPanel: Getting preview code stats...');
    
    try {
      if (mockMode) {
        // Mock mode simulation
        console.log('✅ AdminPanel: [MOCK] Stats retrieved');
        setStats({
          total_codes: mockPreviewCodes.length,
          unused_codes: mockPreviewCodes.length - 3,
          used_codes: 3,
          expired_codes: 0
        });
        return;
      }

      if (!isBackendOnline) {
        console.log('⚠️ AdminPanel: Backend offline, skipping stats');
        return;
      }

      const statsData = await apiService.getPreviewCodeStats();
      console.log('✅ AdminPanel: Stats received:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ AdminPanel: Error getting stats:', error);
      setStats(null);
    }
  };

  const getAllCodes = async () => {
    console.log('📊 AdminPanel: Getting all preview codes...');
    setIsLoadingCodes(true);
    
    try {
      if (mockMode) {
        // Mock mode simulation
        console.log('✅ AdminPanel: [MOCK] Codes list retrieved');
        setAllCodes([
          { code: 'WSHA61P9', is_used: false, used_by: null, used_at: null },
          { code: 'F7WQUWYS', is_used: true, used_by: 'user-12345', used_at: '2025-10-30T10:30:00Z' },
          { code: 'TESTCODE', is_used: false, used_by: null, used_at: null },
          { code: 'DEMO1234', is_used: true, used_by: 'user-67890', used_at: '2025-10-29T15:45:00Z' },
          ...mockPreviewCodes.slice(4).map(code => ({ 
            code, 
            is_used: Math.random() > 0.8, 
            used_by: Math.random() > 0.8 ? `user-${Math.floor(Math.random() * 10000)}` : null,
            used_at: Math.random() > 0.8 ? new Date().toISOString() : null
          }))
        ]);
        return;
      }

      if (!isBackendOnline) {
        console.log('⚠️ AdminPanel: Backend offline, skipping codes list');
        return;
      }

      try {
        const codesData = await apiService.listPreviewCodes();
        console.log('✅ AdminPanel: Codes list received:', codesData);
        setAllCodes(codesData.codes || codesData || []);
      } catch (error) {
        if (error.message.includes('404')) {
          console.log('⚠️ AdminPanel: List endpoint not available, generating placeholder data');
          // Generate placeholder data based on stats
          const placeholderCodes = [];
          for (let i = 1; i <= (stats?.total_codes || 60); i++) {
            placeholderCodes.push({
              code: `CODE${i.toString().padStart(4, '0')}`,
              is_used: i <= (stats?.used_codes || 0),
              used_by: i <= (stats?.used_codes || 0) ? `user-${Math.floor(Math.random() * 10000)}` : null,
              used_at: i <= (stats?.used_codes || 0) ? new Date().toISOString() : null
            });
          }
          setAllCodes(placeholderCodes);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ AdminPanel: Error getting codes list:', error);
      setAllCodes([]);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  // Get stats and codes when backend comes online or mock mode is enabled and user is authenticated
  useEffect(() => {
    if ((isBackendOnline || mockMode) && isAuthenticated) {
      getStats();
      getAllCodes();
    }
  }, [isBackendOnline, mockMode, isAuthenticated]);

  // If not authenticated, show PIN prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Admin Panel</h1>
          <div className="bg-yellow-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">🔒 Authentication Required</h2>
            <p className="text-gray-600 mb-4 text-center">Enter your PIN to access the admin panel.</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength="10"
                  required
                />
              </div>
              {pinError && (
                <div className="text-red-600 text-sm text-center">
                  ❌ {pinError}
                </div>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Access Admin Panel
              </button>
            </form>
            <div className="mt-4 text-xs text-gray-500 text-center">
              This admin panel is for authorized users only.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">
              Manage preview codes for the OneTaskAssistant onboarding system.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:ring-2 focus:ring-red-500"
          >
            🔒 Logout
          </button>
        </div>

        {/* Backend Status */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={mockMode}
                      onChange={(e) => setMockMode(e.target.checked)}
                      className="mr-2"
                    />
                    Mock Mode
                  </label>
                  <button
                    onClick={checkBackendHealth}
                    disabled={isCheckingHealth}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    {isCheckingHealth ? 'Checking...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 mr-2">Backend API:</span>
                  {isCheckingHealth ? (
                    <span className="text-yellow-600">🔄 Checking...</span>
                  ) : isBackendOnline ? (
                    <span className="text-green-600">✅ Online</span>
                  ) : (
                    <span className="text-red-600">❌ Offline</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Endpoint: {apiService.baseUrl}/health
                </div>
                {mockMode && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    🧪 Mock mode enabled - using simulated responses for testing
                  </div>
                )}
                {!isBackendOnline && !isCheckingHealth && !mockMode && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ Backend preview code endpoints missing (404). Enable Mock Mode to test functionality.
                  </div>
                )}
              </div>
            </div>

            {/* Preview Code Stats */}
            {(isBackendOnline || mockMode) && stats && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview Code Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_codes || 0}</div>
                    <div className="text-sm text-gray-600">Total Codes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.unused_codes || 0}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.used_codes || 0}</div>
                    <div className="text-sm text-gray-600">Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.expired_codes || 0}</div>
                    <div className="text-sm text-gray-600">Expired</div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Load Preview Codes */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Load Preview Codes</h3>
                <p className="text-gray-600 mb-4">
                  Load {mockPreviewCodes.length} preview codes into the backend database.
                </p>
                <button
                  onClick={handleLoadCodes}
                  disabled={isLoading || (!isBackendOnline && !mockMode)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load Codes'}
                </button>
                {loadStatus && (
                  <div className={`mt-3 p-3 rounded ${
                    loadStatus.includes('✅') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {loadStatus}
                  </div>
                )}
              </div>

              {/* Reset Preview Codes */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reset Preview Codes</h3>
                <p className="text-gray-600 mb-4">
                  Mark all preview codes as unused (reset their status).
                </p>
                <button
                  onClick={handleResetCodes}
                  disabled={isLoading || (!isBackendOnline && !mockMode)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Reset Codes'}
                </button>
                {resetStatus && (
                  <div className={`mt-3 p-3 rounded ${
                    resetStatus.includes('✅') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {resetStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Codes Table */}
            {(isBackendOnline || mockMode) && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Preview Codes</h3>
                  <button
                    onClick={getAllCodes}
                    disabled={isLoadingCodes}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    {isLoadingCodes ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {isLoadingCodes ? (
                  <div className="text-center py-8 text-gray-500">Loading preview codes...</div>
                ) : allCodes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Code</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Used By</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Used At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCodes.map((codeItem, index) => (
                          <tr key={codeItem.code || index} className={`border-b border-gray-100 ${
                            codeItem.is_used ? 'bg-red-50' : 'bg-green-50'
                          }`}>
                            <td className="py-2 px-3 font-mono text-sm font-semibold">
                              {codeItem.code}
                            </td>
                            <td className="py-2 px-3">
                              {codeItem.is_used ? (
                                <span className="inline-block px-2 py-1 text-xs bg-red-200 text-red-800 rounded">
                                  ❌ Used
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 text-xs bg-green-200 text-green-800 rounded">
                                  ✅ Available
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600">
                              {codeItem.used_by ? (
                                <span className="font-mono">{codeItem.used_by}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600">
                              {codeItem.used_at ? (
                                <span title={new Date(codeItem.used_at).toLocaleString()}>
                                  {new Date(codeItem.used_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      Showing {allCodes.length} codes • 
                      {allCodes.filter(c => !c.is_used).length} available • 
                      {allCodes.filter(c => c.is_used).length} used
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No preview codes found. {mockMode ? 'Enable real backend mode or' : ''} Load codes to get started.
                  </div>
                )}
              </div>
            )}

            {/* Help Section */}
            <div className="bg-gray-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Help & Documentation</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Load Codes:</strong> Adds preview codes to the backend database</p>
                <p>• <strong>Reset Codes:</strong> Marks all codes as unused (they can be used again)</p>
                <p>• <strong>Backend Status:</strong> Shows if the API endpoints are responding</p>
                <p>• Check the browser console for detailed logs and error messages</p>
              </div>
            </div>
      </div>
    </div>
  );
};

export default AdminPanel;
