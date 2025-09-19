import React, { useState, useRef, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { apiConfig } from '../config';

const ChatInterview = ({ userData, onComplete }) => {
  const { accounts } = useMsal();
  const account = accounts[0];
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    focusInput();
  }, [messages, isLoading]); // Refocus after messages change or loading stops

  // Start the interview when component mounts
  useEffect(() => {
    if (!interviewStarted && account) {
      startInterview();
    }
  }, [account, interviewStarted]);

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiConfig.chatUrl}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Hello! I'm ready to start my onboarding interview.",
          user_id: account?.localAccountId || 'anonymous',
          step: 0,
          context: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        const welcomeMessage = {
          id: 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } else {
        throw new Error('Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      // Fallback message
      const fallbackMessage = {
        id: 1,
        role: 'assistant',
        content: "Hi! I'm OneTaskAssistant, your personal productivity coach. I can help you set up your personal dashboard. People often like to track different life areas (for example: Professional / Work, Personal Growth & Learning, Family & Relationships, Health & Self-Care, Finances, Community, etc.). Which of these areas would you like to focus on? You can also add your own.",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Add to conversation history
    const newHistory = [...conversationHistory, currentInput];
    setConversationHistory(newHistory);

    try {
      console.log('Sending request to:', `${apiConfig.chatUrl}/api/onboarding`);
      console.log('Request payload:', {
        prompt: currentInput,
        user_id: account?.localAccountId || 'anonymous',
        step: messages.length,
        context: {
          previous_responses: newHistory
        }
      });

      const response = await fetch(`${apiConfig.chatUrl}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentInput,
          user_id: account?.localAccountId || 'anonymous',
          step: messages.length,
          context: {
            previous_responses: newHistory
          }
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        const assistantMessage = {
          id: messages.length + 2,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Check if interview is complete (look for completion indicators and table summaries)
        const responseText = data.response.toLowerCase();
        const hasTableSummary = responseText.includes('|') && (responseText.includes('category') || responseText.includes('details'));
        const hasCompletionWords = responseText.includes('dashboard is ready') || 
                                  responseText.includes('setup complete') ||
                                  responseText.includes('final summary') || 
                                  responseText.includes('onboarding is now complete') ||
                                  responseText.includes('your personalized setup is complete') ||
                                  responseText.includes('all set') ||
                                  responseText.includes('comprehensive summary') ||
                                  responseText.includes('final comprehensive summary');
        
        const hasEnoughExchanges = newHistory.length >= 10; // Increased minimum for new 4-question format
        
        // More robust completion detection
        if ((hasCompletionWords && hasTableSummary) || 
            (hasEnoughExchanges && hasTableSummary) ||
            (hasCompletionWords && hasEnoughExchanges)) {
          
          console.log('Interview marked as complete. Response includes completion indicators:', {
            hasTableSummary,
            hasCompletionWords,
            hasEnoughExchanges,
            responseLength: data.response.length,
            exchangeCount: newHistory.length
          });
          setInterviewComplete(true);
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, response.statusText, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I'm having trouble connecting right now. Error: ${error.message}. Please try again or contact support if this continues.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContinue = async () => {
    if (interviewComplete) {
      const interviewData = {
        responses: conversationHistory,
        completedAt: new Date(),
        finalSummary: messages[messages.length - 1]?.content || ''
      };

      // Save interview data to backend before completing
      try {
        await saveInterviewData(interviewData);
        onComplete(interviewData);
      } catch (error) {
        console.error('Error saving interview data:', error);
        // Still complete the process, but log the error
        onComplete(interviewData);
      }
    }
  };

  const saveInterviewData = async (interviewData) => {
    const userId = account?.localAccountId || 'anonymous';
    
    console.log('Starting to save interview data:', {
      userId,
      conversationHistory: conversationHistory.length,
      userData
    });
    
    try {
      // Parse interview responses to extract structured data
      const structuredData = parseInterviewResponses(conversationHistory);
      console.log('Parsed structured data:', structuredData);
      
      // 1. Update onboarding status with interview responses
      const onboardingPayload = {
        step: 'completed',
        interview_data: {
          responses: conversationHistory,
          structured_data: structuredData,
          completed_at: interviewData.completedAt,
          final_summary: interviewData.finalSummary,
          // Include profile setup data for future reference
          profile_setup: {
            account_type: userData?.accountType || 'free',
            company: userData?.company || '',
            role: userData?.role || '',
            notifications: userData?.notifications !== false,
            display_name: userData?.displayName || '',
            email: userData?.email || '',
            timezone: userData?.timezone || ''
          }
        }
      };
      
      console.log('Updating onboarding status with payload:', onboardingPayload);
      
      const onboardingResponse = await fetch(`${apiConfig.backendUrl}/onboarding/${userId}/step`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingPayload)
      });

      if (!onboardingResponse.ok) {
        const errorText = await onboardingResponse.text();
        console.error('Failed to update onboarding status:', errorText);
      } else {
        console.log('Onboarding status updated successfully');
      }

      // 2. Create or update user profile with structured data
      const profileData = {
        user_id: userId,
        display_name: userData?.displayName || account?.name || account?.username || 'User',
        email: userData?.email || account?.username || '',
        first_name: userData?.displayName?.split(' ')[0] || '',
        last_name: userData?.displayName?.split(' ').slice(1).join(' ') || '',
        bio: structuredData.bio,
        primary_life_areas: structuredData.primary_life_areas,
        communication_style: structuredData.communication_style,
        preferred_greeting: structuredData.preferred_greeting,
        location: structuredData.location,
        timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_profile_complete: true
      };

      console.log('Creating/updating profile with data:', profileData);

      // Try to create profile first, then update if it exists
      let profileResponse = await fetch(`${apiConfig.backendUrl}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.log('Profile creation response:', profileResponse.status, errorText);
        
        if (profileResponse.status === 409) {
          // Profile exists, update it instead
          console.log('Profile exists, updating instead...');
          profileResponse = await fetch(`${apiConfig.backendUrl}/profiles/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              display_name: userData?.displayName || account?.name || account?.username || 'User',
              first_name: userData?.displayName?.split(' ')[0] || '',
              last_name: userData?.displayName?.split(' ').slice(1).join(' ') || '',
              bio: structuredData.bio,
              primary_life_areas: structuredData.primary_life_areas,
              communication_style: structuredData.communication_style,
              preferred_greeting: structuredData.preferred_greeting,
              location: structuredData.location,
              timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              is_profile_complete: true
            })
          });

          if (!profileResponse.ok) {
            const updateErrorText = await profileResponse.text();
            console.error('Failed to update user profile:', updateErrorText);
          } else {
            console.log('User profile updated successfully');
          }
        } else {
          console.error('Failed to create user profile:', errorText);
        }
      } else {
        console.log('User profile created successfully');
      }

      console.log('Interview data saved successfully');
      
    } catch (error) {
      console.error('Error saving interview data to backend:', error);
      throw error;
    }
  };

  const parseInterviewResponses = (responses) => {
    // Parse the conversation to extract structured information
    const conversationText = responses.join(' ').toLowerCase();
    
    let structuredData = {
      focus_areas: [],
      primary_life_areas: [],
      goals: [],
      communication_style: '',
      preferred_greeting: '',
      location: '',
      bio: ''
    };

    // Map keywords to standardized life areas
    const lifeAreaMappings = {
      'professional_work': ['work', 'professional', 'career', 'job', 'business', 'office', 'workplace'],
      'personal_growth_learning': ['personal', 'growth', 'learning', 'development', 'education', 'skills', 'improvement', 'study'],
      'relationships': ['family', 'relationships', 'social', 'friends', 'partner', 'marriage', 'dating', 'networking'],
      'health_self_care': ['health', 'fitness', 'self-care', 'wellness', 'exercise', 'nutrition', 'mental health', 'physical'],
      'finances': ['finances', 'financial', 'money', 'budget', 'savings', 'investment', 'income', 'debt'],
      'community': ['community', 'volunteering', 'service', 'charity', 'giving', 'society', 'civic']
    };

    // Extract life areas based on keywords
    Object.keys(lifeAreaMappings).forEach(lifeArea => {
      const keywords = lifeAreaMappings[lifeArea];
      const found = keywords.some(keyword => conversationText.includes(keyword));
      if (found) {
        structuredData.primary_life_areas.push(lifeArea);
        // Keep the old format for backward compatibility
        keywords.forEach(keyword => {
          if (conversationText.includes(keyword) && !structuredData.focus_areas.includes(keyword)) {
            structuredData.focus_areas.push(keyword);
          }
        });
      }
    });

    // If no life areas were detected, assign "uncategorized"
    if (structuredData.primary_life_areas.length === 0) {
      structuredData.primary_life_areas.push('uncategorized');
      structuredData.focus_areas.push('general');
    }

    // Extract communication preferences
    if (conversationText.includes('formal') || conversationText.includes('professional')) {
      structuredData.communication_style = 'formal';
    } else if (conversationText.includes('casual') || conversationText.includes('friendly')) {
      structuredData.communication_style = 'casual';
    } else {
      structuredData.communication_style = 'balanced';
    }

    // Create a bio from the conversation
    if (responses.length > 2) {
      const displayAreas = structuredData.primary_life_areas.map(area => {
        const displayNames = {
          'professional_work': 'Professional/Work',
          'personal_growth_learning': 'Personal Growth & Learning',
          'relationships': 'Relationships',
          'health_self_care': 'Health & Self-Care',
          'finances': 'Finances',
          'community': 'Community',
          'uncategorized': 'General'
        };
        return displayNames[area] || area;
      });
      
      if (displayAreas.includes('General')) {
        structuredData.bio = `Interested in productivity and personal organization with ${structuredData.communication_style} communication style.`;
      } else {
        structuredData.bio = `Focused on ${displayAreas.slice(0, 3).join(', ')} with ${structuredData.communication_style} communication style.`;
      }
    } else {
      // Fallback for very short conversations
      structuredData.bio = 'New to OneTaskAssistant - ready to get organized!';
    }

    return structuredData;
  };

  // Simple markdown renderer for chat messages
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Handle the greeting line
    html = html.replace(/Hi! I'm OneTaskAssistant, your personal productivity coach\./, 
                       '<p><strong>Hi! I\'m OneTaskAssistant, your personal productivity coach.</strong> ✨</p>');
    
    // Handle the introduction paragraph
    html = html.replace(/I can help you set up your personal dashboard\. People often like to track different life areas, for example: \* \*\*/,
                       '<p>I can help you set up your personal dashboard. People often like to track different life areas, for example:</p><ul class="list-disc list-inside space-y-1 my-3">');
    
    // Handle bullet points with the specific pattern: • **Text**
    html = html.replace(/• \*\*(.*?)\*\*/g, '<li><strong>$1</strong></li>');
    
    // Handle the pattern ** , ** (which seems to be formatting artifacts)
    html = html.replace(/\*\* , \*\*/g, '');
    
    // Handle the closing pattern and question
    html = html.replace(/\*\* \. \*\*Community\*\* Which of these areas would you like to focus on\? You can also add your own custom areas that matter to you\./,
                       '</ul><p><strong>Which of these areas would you like to focus on?</strong> You can also add your own custom areas that matter to you.</p>');
    
    // Handle markdown tables
    const lines = html.split('\n');
    let inTable = false;
    let tableRows = [];
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line looks like a table row (contains | and has content)
      if (line.includes('|') && line.length > 2 && !line.match(/^\|[\-\s\|]+\|$/)) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Parse table row
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
        if (cells.length > 0) {
          const isHeader = i === 0 || (tableRows.length === 0);
          const cellTag = isHeader ? 'th' : 'td';
          const cellClass = isHeader ? 'px-3 py-2 bg-gray-100 border border-gray-300 font-semibold' : 'px-3 py-2 border border-gray-300';
          
          const rowHtml = cells.map(cell => `<${cellTag} class="${cellClass}">${cell}</${cellTag}>`).join('');
          tableRows.push(`<tr>${rowHtml}</tr>`);
        }
      } else if (line.match(/^\|[\-\s\|]+\|$/)) {
        // Skip separator lines (like |---|---|)
        continue;
      } else {
        // Not a table line
        if (inTable && tableRows.length > 0) {
          // End the table
          const tableHtml = `<table class="border-collapse border border-gray-300 my-4 w-full"><tbody>${tableRows.join('')}</tbody></table>`;
          processedLines.push(tableHtml);
          tableRows = [];
          inTable = false;
        }
        
        if (line.length > 0) {
          processedLines.push(line);
        }
      }
    }
    
    // Handle any remaining table at the end
    if (inTable && tableRows.length > 0) {
      const tableHtml = `<table class="border-collapse border border-gray-300 my-4 w-full"><tbody>${tableRows.join('')}</tbody></table>`;
      processedLines.push(tableHtml);
    }
    
    html = processedLines.join('\n');
    
    // General markdown patterns
    html = html
      // Headers (### ## #)
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Regular bullet points (• and -)  
      .replace(/^[•-]\s+(.*$)/gim, '<li>$1</li>')
      // Numbered lists
      .replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    // Clean up any remaining artifacts
    html = html.replace(/\*\* \. \*\*/g, '');
    html = html.replace(/\*\*\s*,\s*\*\*/g, '');
    
    // Wrap any remaining consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*?<\/li>)(\s*<br>\s*<li>.*?<\/li>)*/g, (match) => {
      if (match.includes('<ul')) return match; // Already wrapped
      const items = match.split('<br>').filter(item => item.trim().startsWith('<li>'));
      return `<ul class="list-disc list-inside space-y-1 my-3">${items.join('')}</ul>`;
    });
    
    return html;
  };

  // Calculate progress based on conversation length and content
  const calculateProgress = () => {
    if (messages.length < 2) return 10;
    
    // Look for key indicators in the conversation
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    let progress = 20; // Started
    
    if (conversationText.includes('role') || conversationText.includes('area')) progress = 40;
    if (conversationText.includes('goals')) progress = 60;
    if (conversationText.includes('habits') || conversationText.includes('routine')) progress = 80;
    if (conversationText.includes('summary') || conversationText.includes('complete')) progress = 100;
    
    return Math.min(progress, 100);
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Let's Personalize Your Experience</h1>
        <p className="mt-2 text-gray-600">
          A quick chat to understand how you work best
        </p>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Interview Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                    />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response here..."
            rows="2"
            className="flex-1 form-input resize-none"
            disabled={isLoading || interviewComplete}
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || interviewComplete}
            className="btn-primary px-6 self-end"
          >
            Send
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>

        {/* Continue Button - only show when interview is complete */}
        {interviewComplete && (
          <div className="mt-4 text-center">
            <button
              onClick={handleContinue}
              className="btn-primary px-8 py-3 text-lg font-semibold"
            >
              Continue to Next Step
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Great job! Your onboarding interview is complete.
            </p>
          </div>
        )}

        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>Messages: {messages.length}</div>
              <div>Conversation History: {conversationHistory.length}</div>
              <div>Interview Complete: {interviewComplete ? 'Yes' : 'No'}</div>
              <div>User ID: {account?.localAccountId || 'anonymous'}</div>
            </div>
            {!interviewComplete && conversationHistory.length >= 6 && (
              <button
                onClick={() => setInterviewComplete(true)}
                className="mt-2 px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
              >
                Force Complete (Test)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Response Suggestions (for first message) */}
      {messages.length === 1 && !isLoading && !interviewComplete && (
        <div className="mt-4 card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick responses:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "I'm ready to start!",
              "Professional / Work, Personal Growth",
              "Work, Health & Self-Care, Family"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInputValue(suggestion);
                  setTimeout(() => {
                    handleSendMessage();
                    focusInput();
                  }, 100);
                }}
                className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterview;
