import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config';

// Import components
import SignUpPage from './components/SignUpPage';
import ProfileSetup from './components/ProfileSetup';
import UsageAgreement from './components/UsageAgreement';
import ChatInterview from './components/ChatInterview';
import CompletePage from './components/CompletePage';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

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
