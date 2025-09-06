import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config';

const SignUpPage = ({ onComplete }) => {
  const { instance, inProgress, accounts } = useMsal();

  const handleLogin = async () => {
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
      console.log("Starting login redirect...");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to 1TaskAssistant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join thousands of users who have transformed their productivity
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
          
          <button 
            onClick={handleLogin}
            disabled={inProgress !== "none"}
            className={`w-full py-3 text-base font-medium ${
              inProgress !== "none" 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {inProgress !== "none" ? "Signing in..." : "Sign Up with Microsoft"}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <button 
            onClick={() => alert('Google sign-up coming soon! Please use Microsoft for now.')}
            className="w-full btn-secondary py-3 text-base font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Sign Up with Google (Coming Soon)
          </button>
          
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
