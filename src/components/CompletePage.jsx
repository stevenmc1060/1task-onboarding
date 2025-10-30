import React from 'react';
import { useMsal } from '@azure/msal-react';
import logoImage from '../assets/logo.png';

const CompletePage = ({ userData }) => {
  const { accounts } = useMsal();

  const handleGetStarted = () => {
    // Store minimal authentication state only
    if (accounts.length > 0) {
      const account = accounts[0];
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', account.localAccountId);
      
      // Create clean URL without onboarding data
      const mainAppUrl = new URL('https://app.1taskassistant.com');
      mainAppUrl.searchParams.set('from_onboarding', 'true');
      
      // Store minimal MSAL account info for authentication continuity only
      localStorage.setItem('msal_account_hint', JSON.stringify({
        localAccountId: account.localAccountId,
        username: account.username,
        homeAccountId: account.homeAccountId
      }));
      
      console.log('🚀 Redirecting to main app (onboarding complete)');
      window.location.href = mainAppUrl.toString();
    } else {
      // Fallback if no account found
      window.location.href = 'https://app.1taskassistant.com';
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 mb-4">
          <img 
            src={logoImage}
            alt="OneTaskAssistant Logo" 
            className="h-full w-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            className="h-full w-full bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ display: 'none' }}
          >
            OTA
          </div>
        </div>
        
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to OneTaskAssistant!
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Your profile has been successfully created.
          </p>
          <p className="text-gray-500">
            You're all set to start your productivity journey with our AI-powered task management system.
          </p>
        </div>
      </div>

      {/* User Profile Summary */}
      {userData && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <p className="text-gray-900">{userData.displayName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-900">{userData.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Company:</span>
              <p className="text-gray-900">{userData.company || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Role:</span>
              <p className="text-gray-900">{userData.role || 'Not provided'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">AI-Powered Tasks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Smart task suggestions based on your preferences
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Goal Tracking</h3>
          <p className="text-sm text-gray-600 mt-1">
            Break down big goals into actionable steps
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Insights</h3>
          <p className="text-sm text-gray-600 mt-1">
            Productivity analytics and recommendations
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={handleGetStarted}
          className="w-full btn-primary py-4 text-lg font-medium"
        >
          Launch OneTaskAssistant
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help getting started?{' '}
            <a 
              href="mailto:support@1taskassistant.com" 
              className="text-primary-600 hover:text-primary-700"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Private Preview:</strong> You're among the first to experience OneTaskAssistant! 
              Your feedback helps us improve the platform for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletePage;