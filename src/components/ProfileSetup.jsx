import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { accountTypes, apiConfig } from '../config';
import logoImage from '../assets/logo.png';
// Uncomment this import to use mock API for testing
// import { mockValidatePreviewCode } from '../utils/mockPreviewCodes';

const ProfileSetup = ({ onComplete }) => {
  const { accounts, instance } = useMsal();
  const account = accounts[0];
  
  const [formData, setFormData] = useState({
    displayName: account?.name || '',
    email: account?.username || '',
    company: '',
    role: '',
    accountType: 'free',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true,
    previewCode: '', // Preview code for early access
    // Contact/Shipping Address
    contactAddress: {
      street: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    // Billing Address
    billingAddress: {
      street: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    billingAddressSameAsContact: true
  });
  
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [codeValidation, setCodeValidation] = useState({
    isValidating: false,
    isValid: false,
    error: '',
    hasValidated: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested address fields
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
      return;
    }
    
    // Handle billing address same as contact checkbox
    if (name === 'billingAddressSameAsContact') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Copy contact address to billing address when checked
        billingAddress: checked ? { ...prev.contactAddress } : prev.billingAddress
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Update billing address when contact address changes (if they're the same)
  const handleContactAddressChange = (e) => {
    const { name, value } = e.target;
    const field = name.split('.')[1];
    
    setFormData(prev => ({
      ...prev,
      contactAddress: {
        ...prev.contactAddress,
        [field]: value
      },
      // Also update billing address if they're set to be the same
      billingAddress: prev.billingAddressSameAsContact 
        ? { ...prev.contactAddress, [field]: value }
        : prev.billingAddress
    }));
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setFormData(prev => ({ ...prev, accountType: planId }));
  };

  // Validate preview code with backend
  const validatePreviewCode = async (code) => {
    if (!code || code.trim().length === 0) {
      setCodeValidation({
        isValidating: false,
        isValid: false,
        error: 'Preview code is required',
        hasValidated: true
      });
      return false;
    }

    setCodeValidation({
      isValidating: true,
      isValid: false,
      error: '',
      hasValidated: false
    });

    try {
      // Use mock API for testing (set USE_MOCK_API = true in development)
      const USE_MOCK_API = process.env.NODE_ENV === 'development' && false; // Change to true to use mock
      
      let result;
      if (USE_MOCK_API) {
        // Mock API call - uncomment mockValidatePreviewCode import to use
        // result = await mockValidatePreviewCode(code.trim(), account?.localAccountId);
        console.log('Mock API disabled - using real backend');
        throw new Error('Mock API is disabled');
      } else {
        // Real API call
        const response = await fetch(`${apiConfig.backendUrl}/preview-codes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code.trim(),
            userId: account?.localAccountId
          })
        });

        result = await response.json();
        
        // Check if response was successful
        if (!response.ok) {
          throw new Error(result.message || 'Server error');
        }
      }

      if (result.valid) {
        setCodeValidation({
          isValidating: false,
          isValid: true,
          error: '',
          hasValidated: true
        });
        return true;
      } else {
        setCodeValidation({
          isValidating: false,
          isValid: false,
          error: result.message || 'Invalid preview code. Please check your code and try again.',
          hasValidated: true
        });
        return false;
      }
    } catch (error) {
      console.error('Preview code validation error:', error);
      setCodeValidation({
        isValidating: false,
        isValid: false,
        error: 'Unable to validate preview code. Please check your internet connection and try again.',
        hasValidated: true
      });
      return false;
    }
  };

  // Handle preview code input with debounced validation
  const handlePreviewCodeChange = (e) => {
    const code = e.target.value;
    setFormData(prev => ({ ...prev, previewCode: code }));
    
    // Reset validation state when user starts typing
    setCodeValidation(prev => ({
      ...prev,
      isValid: false,
      error: '',
      hasValidated: false
    }));
  };

  // Validate code when user finishes typing (on blur)
  const handlePreviewCodeBlur = () => {
    if (formData.previewCode) {
      validatePreviewCode(formData.previewCode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate preview code before submission
    if (!codeValidation.isValid) {
      const isCodeValid = await validatePreviewCode(formData.previewCode);
      if (!isCodeValid) {
        return; // Stop submission if code is invalid
      }
    }

    setIsSubmitting(true);
    try {
      // Include preview code in the submission data
      const submissionData = {
        ...formData,
        previewCodeUsed: formData.previewCode
      };
      onComplete(submissionData);
    } catch (error) {
      console.error('Profile submission error:', error);
      alert('Failed to submit profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleResetOnboardingData = async () => {
    if (!confirm('⚠️ This will reset all your onboarding data and you\'ll start over. Continue?')) {
      return;
    }

    const userId = account?.localAccountId;
    if (!userId) {
      alert('No user found');
      return;
    }

    // Force use of Azure backend for reset (ignore localhost env vars during development)
    const AZURE_BACKEND_URL = "https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api";

    try {
      console.log(`🔄 Starting reset for user: ${userId}`);
      console.log(`🔗 Backend URL: ${AZURE_BACKEND_URL}`);

      // 1. Reset interview data and onboarding status
      console.log('1️⃣ Resetting profile data...');
      const profilePayload = {
        onboarding_completed: false,
        interview_data: null,
        first_run: true
      };
      console.log('Profile payload:', profilePayload);
      
      const interviewResponse = await fetch(`${AZURE_BACKEND_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profilePayload)
      });

      console.log('Profile response status:', interviewResponse.status);
      if (interviewResponse.ok) {
        console.log('✅ Profile reset successful');
      } else {
        const errorText = await interviewResponse.text();
        console.error('❌ Profile reset failed:', errorText);
      }

      // 2. Reset onboarding status completely
      console.log('2️⃣ Resetting onboarding status completely...');
      const onboardingPayload = {
        current_step: 'welcome',
        completed_steps: [],
        is_completed: false,
        completed_at: null,
        welcome_shown: false,
        interview_responses: null
      };
      console.log('Onboarding payload:', onboardingPayload);
      
      const onboardingResponse = await fetch(`${AZURE_BACKEND_URL}/onboarding/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingPayload)
      });

      console.log('Onboarding response status:', onboardingResponse.status);
      if (onboardingResponse.ok) {
        console.log('✅ Onboarding status reset successful');
      } else {
        const errorText = await onboardingResponse.text();
        console.error('❌ Onboarding status reset failed:', errorText);
      }

      // 3. Clean up user items (optional)
      console.log('3️⃣ Cleaning up user items...');
      const endpoints = ['yearly-goals', 'quarterly-goals', 'habits', 'projects'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Deleting ${endpoint}...`);
          const deleteResponse = await fetch(`${AZURE_BACKEND_URL}/${endpoint}?user_id=${userId}`, {
            method: 'DELETE'
          });
          
          console.log(`${endpoint} delete response:`, deleteResponse.status);
          if (deleteResponse.ok) {
            console.log(`✅ Deleted ${endpoint} successfully`);
          } else {
            console.log(`⚠️ No ${endpoint} found (this is normal)`);
          }
        } catch (error) {
          console.log(`⚠️ Could not delete ${endpoint}:`, error.message);
        }
      }

      // 4. Clear any local storage data
      console.log('4️⃣ Clearing local storage...');
      localStorage.removeItem('onboarding_insights');
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_id');
      localStorage.removeItem('msal_account_hint');
      console.log('✅ Local storage cleared');

      console.log('🎉 Reset complete!');
      alert('✅ Onboarding data reset successfully! Refreshing page...');
      window.location.reload();
      
    } catch (error) {
      console.error('💥 Error resetting onboarding data:', error);
      alert(`❌ Failed to reset onboarding data: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-4">
          <div></div> {/* Spacer for centering */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <img 
                src={logoImage}
                alt="OneTaskAssistant Logo" 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ display: 'none' }}
              >
                OTA
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Set Up Your Profile</h1>
            <p className="mt-2 text-gray-600">Tell us about yourself to personalize your experience</p>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleResetOnboardingData}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                title="Development only: Reset all onboarding data"
              >
                🔄 Reset Data
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                required
                readOnly
              />
            </div>
            <div>
              <label className="form-label">Company (Optional)</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Role (Optional)</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select a role</option>
                <option value="student">Student</option>
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="consultant">Consultant</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview Code Section */}
        <div className="card border-l-4 border-l-primary-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Early Access Code</h2>
          <p className="text-sm text-gray-600 mb-4">
            OneTaskAssistant is currently in early access. Please enter your preview code to continue.
          </p>
          <div className="max-w-md">
            <label className="form-label">Preview Code *</label>
            <div className="relative">
              <input
                type="text"
                name="previewCode"
                value={formData.previewCode}
                onChange={handlePreviewCodeChange}
                onBlur={handlePreviewCodeBlur}
                className={`form-input pr-10 ${
                  codeValidation.hasValidated
                    ? codeValidation.isValid 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                    : ''
                }`}
                placeholder="Enter your preview code"
                required
                disabled={codeValidation.isValidating}
              />
              {codeValidation.isValidating && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              )}
              {codeValidation.hasValidated && codeValidation.isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {codeValidation.hasValidated && !codeValidation.isValid && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {codeValidation.error && (
              <p className="mt-2 text-sm text-red-600">{codeValidation.error}</p>
            )}
            {codeValidation.isValid && (
              <p className="mt-2 text-sm text-green-600">✓ Preview code verified! You can continue with setup.</p>
            )}
          </div>
        </div>

        {/* Contact/Shipping Address */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Address</h2>
          <p className="text-sm text-gray-600 mb-4">This will be used as your primary contact and shipping address.</p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="contactAddress.street"
                value={formData.contactAddress.street}
                onChange={handleContactAddressChange}
                className="form-input"
                placeholder="123 Main Street"
                required
              />
            </div>
            <div>
              <label className="form-label">Street Address Line 2 (Optional)</label>
              <input
                type="text"
                name="contactAddress.street2"
                value={formData.contactAddress.street2}
                onChange={handleContactAddressChange}
                className="form-input"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="contactAddress.city"
                  value={formData.contactAddress.city}
                  onChange={handleContactAddressChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">State/Province</label>
                <input
                  type="text"
                  name="contactAddress.state"
                  value={formData.contactAddress.state}
                  onChange={handleContactAddressChange}
                  className="form-input"
                  placeholder="CA, NY, Ontario, etc."
                  required
                />
              </div>
              <div>
                <label className="form-label">ZIP/Postal Code</label>
                <input
                  type="text"
                  name="contactAddress.postalCode"
                  value={formData.contactAddress.postalCode}
                  onChange={handleContactAddressChange}
                  className="form-input"
                  placeholder="12345 or A1B 2C3"
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Country</label>
              <select
                name="contactAddress.country"
                value={formData.contactAddress.country}
                onChange={handleContactAddressChange}
                className="form-input"
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="IN">India</option>
                <option value="CN">China</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Billing Address</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="billingAddressSameAsContact"
                id="billingAddressSameAsContact"
                checked={formData.billingAddressSameAsContact}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="billingAddressSameAsContact" className="ml-2 text-sm text-gray-700">
                Billing address is the same as contact address
              </label>
            </div>
          </div>
          
          {!formData.billingAddressSameAsContact && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="billingAddress.street"
                  value={formData.billingAddress.street}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div>
                <label className="form-label">Street Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="billingAddress.street2"
                  value={formData.billingAddress.street2}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="billingAddress.city"
                    value={formData.billingAddress.city}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">State/Province</label>
                  <input
                    type="text"
                    name="billingAddress.state"
                    value={formData.billingAddress.state}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="CA, NY, Ontario, etc."
                    required
                  />
                </div>
                <div>
                  <label className="form-label">ZIP/Postal Code</label>
                  <input
                    type="text"
                    name="billingAddress.postalCode"
                    value={formData.billingAddress.postalCode}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="12345 or A1B 2C3"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Country</label>
                <select
                  name="billingAddress.country"
                  value={formData.billingAddress.country}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="BR">Brazil</option>
                  <option value="MX">Mexico</option>
                  <option value="IN">India</option>
                  <option value="CN">China</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          )}
          
          {formData.billingAddressSameAsContact && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Billing address will be:</strong>
              </p>
              <div className="text-sm text-gray-800">
                {formData.contactAddress.street && (
                  <>
                    <div>{formData.contactAddress.street}</div>
                    {formData.contactAddress.street2 && <div>{formData.contactAddress.street2}</div>}
                    <div>
                      {formData.contactAddress.city}
                      {formData.contactAddress.city && formData.contactAddress.state && ', '}
                      {formData.contactAddress.state} {formData.contactAddress.postalCode}
                    </div>
                    <div>{formData.contactAddress.country}</div>
                  </>
                )}
                {!formData.contactAddress.street && (
                  <div className="text-gray-500">Fill in contact address above to see billing address preview</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Type Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountTypes.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPlan === plan.id ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                  }`}>
                    {selectedPlan === plan.id && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{plan.price}</p>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">GMT</option>
                <option value="Europe/Paris">Central European Time</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="notifications"
                id="notifications"
                checked={formData.notifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                Send me productivity tips and updates
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || codeValidation.isValidating || (formData.previewCode && !codeValidation.isValid)}
            className={`px-8 py-3 text-lg font-medium rounded-md transition-colors ${
              isSubmitting || codeValidation.isValidating || (formData.previewCode && !codeValidation.isValid)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up profile...
              </span>
            ) : codeValidation.isValidating ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                Validating code...
              </span>
            ) : (
              'Continue to Agreement'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
