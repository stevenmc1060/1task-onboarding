import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { accountTypes, apiConfig } from '../config';

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
    notifications: true
  });
  
  const [selectedPlan, setSelectedPlan] = useState('free');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setFormData(prev => ({ ...prev, accountType: planId }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
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
                src="/logo.png" 
                alt="OneTaskAssistant Logo" 
                className="h-12 w-12 object-contain"
              />
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
            className="btn-primary px-8 py-3 text-lg font-medium"
          >
            Continue to Agreement
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetup;
