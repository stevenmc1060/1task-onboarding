// Debug environment variables
console.log('Environment Check:', {
  VITE_REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI,
  VITE_AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID ? 'Set' : 'Missing',
  windowOrigin: window.location.origin,
  finalRedirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin
});

// MSAL configuration - supports both personal and work/school accounts
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "your-client-id-here",
    authority: import.meta.env.VITE_AZURE_AUTHORITY || "https://login.microsoftonline.com/common",
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: false, // Prevent redirect loops
  },
  cache: {
    cacheLocation: "localStorage", // Shared cache with main app
    storeAuthStateInCookie: true, // Better support for redirect flow
  },
  system: {
    allowNativeBroker: false, // Disable broker for web apps
    windowHashTimeout: 60000, // Increase timeout for slower auth flows
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    navigateFrameWait: 0
  }
};

// Login requests for different account types
export const personalAccountLoginRequest = {
  scopes: ["User.Read"],
  prompt: "select_account",
  authority: "https://login.microsoftonline.com/consumers", // Personal accounts only
  // PKCE is automatically enabled for personal accounts
};

export const workSchoolAccountLoginRequest = {
  scopes: ["User.Read"],
  prompt: "select_account", 
  authority: "https://login.microsoftonline.com/organizations", // Work/school accounts only
};

// Legacy login request for backward compatibility
export const loginRequest = personalAccountLoginRequest;

// API Configuration
export const apiConfig = {
  backendUrl: (import.meta.env.VITE_BACKEND_URL || "https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net") + "/api",
  chatUrl: import.meta.env.VITE_CHAT_URL || "http://localhost:7072"
};

// Account types for profile setup
export const accountTypes = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic task management features',
    price: '$0/month',
    features: [
      'Up to 50 tasks per month',
      'Basic goal tracking',
      'Web access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced productivity features',
    price: '$4.99/month',
    features: [
      'Unlimited tasks',
      'Advanced analytics',
      'Mobile app access',
      'Priority support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full enterprise features',
    price: '$9.99/month',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'API access',
      'Custom integrations'
    ]
  }
];
