import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import logoImage from '../assets/logo.png';

const CompletePage = ({ userData }) => {
  const { accounts } = useMsal();
  const [interviewInsights, setInterviewInsights] = useState(null);

  useEffect(() => {
    // Load the user's interview data from the backend
    const loadInterviewData = async () => {
      if (accounts.length > 0) {
        const userId = accounts[0].localAccountId;
        try {
          const response = await fetch(`https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api/profiles/${userId}`);
          if (response.ok) {
            const profile = await response.json();
            if (profile.interview_data) {
              setInterviewInsights(parseInterviewInsights(profile.interview_data));
            }
          }
        } catch (error) {
          console.error('Error loading interview data:', error);
        }
      }
    };

    loadInterviewData();
  }, [accounts]);

  const parseInterviewInsights = (interviewData) => {
    if (!interviewData.raw_responses) return null;

    const insights = {
      lifeAreas: [],
      yearlyGoals: [],
      quarterlyGoals: [],
      habits: [],
      projects: []
    };

    // Parse through the conversation to extract insights
    const responses = interviewData.raw_responses;
    let currentLifeArea = 'General';
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (response.role === 'assistant' && response.content.toLowerCase().includes('health')) {
        currentLifeArea = 'Health & Self-Care';
      }
      
      if (response.role === 'user') {
        const content = response.content.toLowerCase();
        const userText = response.content;
        
        // Look for context clues from previous assistant message
        const prevResponse = i > 0 ? responses[i-1] : null;
        if (prevResponse && prevResponse.role === 'assistant') {
          const prevContent = prevResponse.content.toLowerCase();
          
          if (prevContent.includes('big goals') || prevContent.includes('yearly')) {
            if (userText.trim() && userText.length > 2) {
              insights.yearlyGoals.push({
                lifeArea: currentLifeArea,
                goal: userText,
                description: `Focus area: ${currentLifeArea}`
              });
            }
          } else if (prevContent.includes('3 months') || prevContent.includes('quarterly')) {
            if (userText.trim() && userText.length > 2) {
              insights.quarterlyGoals.push({
                lifeArea: currentLifeArea,
                goal: userText,
                description: `3-month milestone for ${currentLifeArea}`
              });
            }
          } else if (prevContent.includes('habits') || prevContent.includes('routines')) {
            if (userText.trim() && userText.length > 2) {
              insights.habits.push({
                lifeArea: currentLifeArea,
                habit: userText,
                description: `Daily/weekly routine for ${currentLifeArea}`
              });
            }
          } else if (prevContent.includes('projects') || prevContent.includes('initiatives')) {
            if (userText.trim() && userText.length > 2) {
              insights.projects.push({
                lifeArea: currentLifeArea,
                project: userText,
                description: `Active project in ${currentLifeArea}`
              });
            }
          }
        }
      }
    }

    return insights;
  };

  const handleGetStarted = () => {
    // Store interview data for main app
    if (interviewInsights) {
      localStorage.setItem('onboarding_insights', JSON.stringify(interviewInsights));
    }
    
    // Store user authentication state and pass tokens
    if (accounts.length > 0) {
      const account = accounts[0];
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_id', account.localAccountId);
      
      // Get the current access token if available
      const tokenCache = localStorage.getItem(`msal.token.keys.${account.localAccountId}`);
      
      // Create URL with authentication hints
      const mainAppUrl = new URL('https://app.1taskassistant.com');
      mainAppUrl.searchParams.set('from_onboarding', 'true');
      mainAppUrl.searchParams.set('user_hint', account.username || account.localAccountId);
      
      // Store MSAL account info for main app to use
      localStorage.setItem('msal_account_hint', JSON.stringify({
        localAccountId: account.localAccountId,
        username: account.username,
        name: account.name,
        homeAccountId: account.homeAccountId
      }));
      
      console.log('🚀 Redirecting to main app with auth state preserved');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to OneTaskAssistant!
        </h1>
        <p className="text-lg text-gray-600">
          Your account has been successfully created and personalized
        </p>
      </div>

      <div className="card text-left mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Setup Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Account Type:</span>
            <span className="font-medium text-gray-900 capitalize">
              {userData?.accountType || 'Free'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">
              {userData?.email || 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Company:</span>
            <span className="font-medium text-gray-900">
              {userData?.company || 'Personal'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Timezone:</span>
            <span className="font-medium text-gray-900">
              {userData?.timezone || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Interview Insights Section */}
      {interviewInsights && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Personalized Insights</h2>
          <p className="text-gray-600 mb-6">Based on your interview, here's what we've learned about your goals and priorities:</p>
          
          {/* Yearly Goals */}
          {interviewInsights.yearlyGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">🎯</span>
                Yearly Goals
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Life Area</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Goal</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Focus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {interviewInsights.yearlyGoals.map((goal, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {goal.lifeArea}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{goal.goal}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{goal.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quarterly Goals */}
          {interviewInsights.quarterlyGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm mr-2">📅</span>
                3-Month Milestones
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Life Area</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Milestone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Focus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {interviewInsights.quarterlyGoals.map((goal, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {goal.lifeArea}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{goal.goal}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{goal.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Habits */}
          {interviewInsights.habits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">🔄</span>
                Habits & Routines
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Life Area</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Habit</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Focus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {interviewInsights.habits.map((habit, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {habit.lifeArea}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{habit.habit}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{habit.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Projects */}
          {interviewInsights.projects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm mr-2">🚀</span>
                Active Projects
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Life Area</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Project</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Focus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {interviewInsights.projects.map((project, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {project.lifeArea}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.project}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{project.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!interviewInsights.yearlyGoals.length && !interviewInsights.quarterlyGoals.length && 
           !interviewInsights.habits.length && !interviewInsights.projects.length && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Your insights are being processed. You'll see them in the main app!</p>
            </div>
          )}
        </div>
      )}

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
