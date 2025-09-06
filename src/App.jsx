import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, apiConfig } from './config';

// Import components
import SignUpPage from './components/SignUpPage';
import ProfileSetup from './components/ProfileSetup';
import UsageAgreement from './components/UsageAgreement';
import ChatInterview from './components/ChatInterview';
import CompletePage from './components/CompletePage';

// Import dev tools (adds console functions)
import './utils/devTools.js';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Make MSAL instance available for dev tools
window.msalInstance = msalInstance;

// Initialize MSAL instance
msalInstance.initialize().then(() => {
  console.log("MSAL initialized successfully");
}).catch((error) => {
  console.error("MSAL initialization error:", error);
});

// Inner component that has access to MSAL context
function AppContent() {
  const { accounts, inProgress, instance } = useMsal();
  const [onboardingStep, setOnboardingStep] = useState('signup');
  const [userData, setUserData] = useState(null);
  const [msalInitialized, setMsalInitialized] = useState(false);

  // Check if user is already authenticated
  const isAuthenticated = accounts.length > 0;

  useEffect(() => {
    // Ensure MSAL is initialized before proceeding
    const initializeMsal = async () => {
      try {
        await instance.initialize();
        setMsalInitialized(true);
        console.log("MSAL initialized in AppContent");
      } catch (error) {
        console.error("MSAL initialization error in AppContent:", error);
        setMsalInitialized(true); // Set to true anyway to prevent infinite loading
      }
    };

    if (!msalInitialized) {
      initializeMsal();
    }
  }, [instance, msalInitialized]);

  useEffect(() => {
    if (!msalInitialized) return;
    
    // Handle redirect response
    instance.handleRedirectPromise().then((response) => {
      if (response) {
        console.log("Login redirect successful:", response);
        // User just logged in via redirect
        setOnboardingStep('profile');
      }
    }).catch((error) => {
      console.error("Redirect error:", error);
    });
  }, [instance, msalInitialized]);

  useEffect(() => {
    if (msalInitialized && isAuthenticated && onboardingStep === 'signup') {
      setOnboardingStep('profile');
    }
  }, [isAuthenticated, onboardingStep, msalInitialized]);

  const handleStepComplete = (step, data = null) => {
    if (data) {
      setUserData(prevData => ({ ...prevData, ...data }));
    }
    
    // Move to next step
    const steps = ['signup', 'profile', 'agreement', 'interview', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setOnboardingStep(steps[currentIndex + 1]);
    }
  };

  // Developer utility functions for testing
  useEffect(() => {
    if (typeof window !== 'undefined' && accounts.length > 0) {
      const currentUser = accounts[0];
      
      // Reset first run flag
      window.resetFirstRunFlag = async () => {
        try {
          console.log("Resetting first run flag for user:", currentUser.homeAccountId);
          
          const response = await fetch(`${apiConfig.backendUrl}/profiles/${currentUser.homeAccountId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_run: true
            })
          });
          
          if (response.ok) {
            console.log("✅ First run flag reset successfully");
            return await response.json();
          } else {
            console.error("❌ Failed to reset first run flag:", await response.text());
          }
        } catch (error) {
          console.error("❌ Error resetting first run flag:", error);
        }
      };

      // Reset interview data
      window.resetInterviewData = async () => {
        try {
          console.log("Resetting interview data for user:", currentUser.homeAccountId);
          
          const response = await fetch(`${apiConfig.backendUrl}/profiles/${currentUser.homeAccountId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              onboarding_completed: false,
              interview_data: null,
              first_run: true
            })
          });
          
          if (response.ok) {
            console.log("✅ Interview data reset successfully");
            return await response.json();
          } else {
            console.error("❌ Failed to reset interview data:", await response.text());
          }
        } catch (error) {
          console.error("❌ Error resetting interview data:", error);
        }
      };

      // Get current user profile
      window.getCurrentProfile = async () => {
        try {
          console.log("Getting profile for user:", currentUser.homeAccountId);
          
          const response = await fetch(`${apiConfig.backendUrl}/profiles/${currentUser.homeAccountId}`);
          
          if (response.ok) {
            const profile = await response.json();
            console.log("Current profile:", profile);
            return profile;
          } else {
            console.error("❌ Failed to get profile:", await response.text());
          }
        } catch (error) {
          console.error("❌ Error getting profile:", error);
        }
      };

      // Delete current user profile (for complete reset)
      window.deleteMyProfile = async () => {
        try {
          console.log("⚠️  Deleting profile for user:", currentUser.homeAccountId);
          console.log("This will completely remove your profile data!");
          
          const response = await fetch(`${apiConfig.backendUrl}/profiles/${currentUser.homeAccountId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            console.log("✅ Profile deleted successfully");
            console.log("You can now go through onboarding again");
            return true;
          } else {
            console.error("❌ Failed to delete profile:", await response.text());
          }
        } catch (error) {
          console.error("❌ Error deleting profile:", error);
        }
      };

      // Reset onboarding step (UI only)
      window.resetOnboardingStep = (step = 'signup') => {
        console.log(`Resetting onboarding step to: ${step}`);
        setOnboardingStep(step);
        console.log("✅ UI step reset successfully");
      };

      console.log("🔧 Developer utilities available:");
      console.log("• await resetFirstRunFlag() - Reset first run flag to true");
      console.log("• await resetInterviewData() - Clear interview data and reset onboarding");
      console.log("• await getCurrentProfile() - View current user profile");
      console.log("• await deleteMyProfile() - ⚠️  Delete entire profile (complete reset)");
      console.log("• resetOnboardingStep('step') - Reset UI to specific step");
    }
  }, [accounts, apiConfig.backendUrl]);

  const renderStep = () => {
    if (inProgress === "startup" || !msalInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <SignUpPage onComplete={() => handleStepComplete('signup')} />;
    }

    switch (onboardingStep) {
      case 'profile':
        return <ProfileSetup onComplete={(data) => handleStepComplete('profile', data)} />;
      case 'agreement':
        return <UsageAgreement onComplete={() => handleStepComplete('agreement')} />;
      case 'interview':
        return <ChatInterview 
          userData={userData} 
          onComplete={(data) => handleStepComplete('interview', data)} 
        />;
      case 'complete':
        return <CompletePage userData={userData} />;
      default:
        return <ProfileSetup onComplete={(data) => handleStepComplete('profile', data)} />;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/auth/callback" element={<Navigate to="/" replace />} />
          <Route path="/*" element={
            <div className="max-w-4xl mx-auto py-8 px-4">
              {renderStep()}
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
