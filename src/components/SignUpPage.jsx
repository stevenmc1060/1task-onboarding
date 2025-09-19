import React from 'react';
import { useMsal } from '@azure/msal-react';
import { personalAccountLoginRequest, workSchoolAccountLoginRequest } from '../config';
import logoImage from '../assets/logo.png';

const SignUpPage = ({ onComplete }) => {
  const { instance, inProgress, accounts } = useMsal();

  const handleLogin = async (accountType = 'personal') => {
    // Check if already authenticated
    if (accounts.length > 0) {
      console.log("User already authenticated");
      onComplete();
      return;
    }

    // Check if interaction is already in progress
    if (inProgress !== "none") {
      console.log("Authentication already in progress");
      return;
    }

    try {
      console.log(`Starting login redirect for ${accountType} account...`);
      
      // Choose the appropriate login request based on account type
      const loginRequest = accountType === 'work' 
        ? workSchoolAccountLoginRequest 
        : personalAccountLoginRequest;
      
      console.log('Using authority:', loginRequest.authority);
      
      // Use redirect instead of popup to avoid hash issues
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any stuck interactions
      if (error.name === "BrowserAuthError" || error.name === "ClientAuthError") {
        console.log("Clearing browser auth error...");
        // Clear MSAL cache and reload
        await instance.clearCache();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 mb-4">
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to OneTaskAssistant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The World's First AI-Powered Thought to Action System
          </p>
        </div>
        
        <div className="card space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-5 w-5 text-green-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">AI-powered task management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-5 w-5 text-green-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Personalized productivity insights</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-5 w-5 text-green-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">Seamless cross-platform sync</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => handleLogin('personal')}
              disabled={inProgress !== "none"}
              className={`w-full py-3 text-base font-medium flex items-center justify-center space-x-2 ${
                inProgress !== "none" 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H11V21H5V3H13V9H21Z"/>
              </svg>
              <span>
                {inProgress !== "none" ? "Signing in..." : "Sign in with Personal Account"}
              </span>
            </button>
            
            <button 
              onClick={() => handleLogin('work')}
              disabled={inProgress !== "none"}
              className={`w-full py-3 text-base font-medium flex items-center justify-center space-x-2 ${
                inProgress !== "none" 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'btn-secondary'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H20V19ZM20 15H12V13H20V15ZM20 11H12V9H20V11Z"/>
              </svg>
              <span>
                {inProgress !== "none" ? "Signing in..." : "Sign in with Work/School Account"}
              </span>
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-2">Choose your account type:</p>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
              <div className="flex items-center justify-center space-x-1">
                <span>📧</span>
                <span>Personal: @outlook.com, @hotmail.com, @live.com, @gmail.com</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <span>🏢</span>
                <span>Work/School: Company or organization accounts</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Secure Microsoft Authentication</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
