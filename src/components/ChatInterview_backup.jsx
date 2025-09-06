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

  useEffect(() => {
    scrollToBottom();
    focusInput();
  }, [messages]);

  useEffect(() => {
    if (!interviewStarted) {
      startInterview();
    }
  }, [interviewStarted]);

  const startInterview = async () => {
    if (interviewStarted) return;
    
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiConfig.onboardingApiUrl}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: account?.localAccountId || 'anonymous',
          message: "start",
          conversation_history: []
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
    const newHistory = [...conversationHistory, 
      { role: 'user', content: currentInput }
    ];
    setConversationHistory(newHistory);

    try {
      const response = await fetch(`${apiConfig.onboardingApiUrl}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: account?.localAccountId || 'anonymous',
          message: currentInput,
          conversation_history: newHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage = {
          id: messages.length + 2,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation history
        const updatedHistory = [...newHistory, 
          { role: 'assistant', content: data.response }
        ];
        setConversationHistory(updatedHistory);

        // Check if interview is complete
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
        
        const hasEnoughExchanges = updatedHistory.length >= 10;
        
        if ((hasCompletionWords && hasTableSummary) || 
            (hasEnoughExchanges && hasTableSummary) ||
            (hasCompletionWords && hasEnoughExchanges)) {
          
          console.log('Interview marked as complete:', {
            hasTableSummary,
            hasCompletionWords,
            hasEnoughExchanges,
            exchangeCount: updatedHistory.length
          });
          setInterviewComplete(true);
        }
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleContinue = async () => {
    if (interviewComplete) {
      const interviewData = {
        responses: conversationHistory,
        completedAt: new Date(),
        finalSummary: messages[messages.length - 1]?.content || ''
      };

      try {
        await saveInterviewData(interviewData);
        onComplete(interviewData);
      } catch (error) {
        console.error('Error saving interview data:', error);
        onComplete(interviewData);
      }
    }
  };

  const saveInterviewData = async (interviewData) => {
    // Implementation for saving interview data
    console.log('Saving interview data:', interviewData);
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // Simple markdown rendering
    html = html
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[•-]\s+(.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    
    return html;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Let's Personalize Your Experience</h1>
        <p className="mt-2 text-gray-600">
          A quick chat to understand how you work best
        </p>
      </div>

      <div className="card">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                {message.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-white border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your response..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading || interviewComplete}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || interviewComplete}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </div>

        {/* Continue Button */}
        {interviewComplete && (
          <div className="mt-4 text-center">
            <button
              onClick={handleContinue}
              className="btn-primary px-8 py-3 text-lg font-semibold"
            >
              Continue to Next Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterview;
