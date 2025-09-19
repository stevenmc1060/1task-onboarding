import React, { useState } from 'react';

const UsageAgreement = ({ onComplete }) => {
  const [accepted, setAccepted] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onComplete();
    }
  };

  // This will be replaced with your actual terms text
  const termsText = `
TERMS OF SERVICE AND PRIVACY POLICY

1. ACCEPTANCE OF TERMS
By accessing and using OneTaskAssistant ("the Service"), you agree to be bound by these Terms of Service.

2. DESCRIPTION OF SERVICE
OneTaskAssistant is an AI-powered productivity and task management platform designed to help users organize, prioritize, and complete their tasks more effectively.

3. USER ACCOUNTS
- You must provide accurate and complete registration information
- You are responsible for maintaining the confidentiality of your account
- You must notify us immediately of any unauthorized use of your account

4. PRIVACY AND DATA PROTECTION
- We collect and process personal data in accordance with our Privacy Policy
- Your data is encrypted and stored securely
- We do not sell or share your personal information with third parties without consent
- You have the right to request deletion of your personal data

5. ACCEPTABLE USE
You agree not to:
- Use the service for any illegal purposes
- Attempt to gain unauthorized access to the service
- Interfere with or disrupt the service
- Upload malicious content or spam

6. INTELLECTUAL PROPERTY
- The Service and its content are owned by OneTaskAssistant and protected by copyright
- You retain ownership of content you create using the Service
- You grant us a license to use your content to provide the Service

7. LIMITATION OF LIABILITY
The Service is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages.

8. TERMINATION
We may terminate or suspend your account at any time for violation of these terms.

9. CHANGES TO TERMS
We may update these terms at any time. Continued use constitutes acceptance of new terms.

10. CONTACT INFORMATION
For questions about these terms, contact us at support@1taskassistant.com

Last updated: September 2025
  `.trim();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service & Privacy Policy</h1>
        <p className="mt-2 text-gray-600">
          Please review and accept our terms to continue
        </p>
      </div>

      <div className="card">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {showFullText ? termsText : `${termsText.substring(0, 1000)}...`}
            </pre>
          </div>
        </div>
        
        {!showFullText && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowFullText(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Show Full Terms
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="accept-terms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="accept-terms" className="ml-3 text-sm text-gray-700">
              I have read and agree to the Terms of Service and Privacy Policy. I understand that:
              <ul className="mt-2 list-disc list-inside space-y-1 text-gray-600">
                <li>My data will be processed according to the Privacy Policy</li>
                <li>I can request deletion of my personal data at any time</li>
                <li>The service uses AI to help manage and prioritize tasks</li>
                <li>I am responsible for maintaining the security of my account</li>
              </ul>
            </label>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-purple-800">
                  <strong>Your Privacy Matters:</strong> We use enterprise-grade encryption to protect your data. 
                  You can export or delete your data at any time from your account settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary px-6 py-3"
          >
            Go Back
          </button>
          <button
            onClick={handleAccept}
            disabled={!accepted}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              accepted
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            I Accept - Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageAgreement;
