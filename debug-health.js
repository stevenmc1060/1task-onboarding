// Quick test script to debug the health check issue
import { apiConfig } from './src/config.js';

console.log('🔍 Debug: Current API Configuration');
console.log('Backend URL from config:', apiConfig.backendUrl);
console.log('Health check URL would be:', apiConfig.backendUrl + '/health');

// Test the fetch directly
console.log('🔍 Testing fetch directly...');

fetch(apiConfig.backendUrl + '/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  mode: 'cors',
  credentials: 'omit'
})
.then(response => {
  console.log('✅ Fetch response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });
  return response.json();
})
.then(data => {
  console.log('✅ Response data:', data);
})
.catch(error => {
  console.error('❌ Fetch error:', error);
});
