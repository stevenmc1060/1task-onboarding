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
      const response = await fetch(`${apiConfig.chatUrl}/api/onboarding`, {
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

    // Add timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      console.warn('Chat request timed out after 30 seconds');
      setIsLoading(false);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `The request timed out. Please try sending your message again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }, 30000); // 30 second timeout

    // Detect what type of question the user is responding to based on the last assistant message
    const lastAssistantMessage = messages[messages.length - 1]?.content || '';
    let questionType = 'general';
    let questionNumber = null;
    
    // More comprehensive pattern matching for question types
    if (/big goals.*this year|yearly.*goals|goals.*year|Question 1|goals.*annual/i.test(lastAssistantMessage)) {
      questionType = 'yearly_goals';
      questionNumber = 1;
    } else if (/next 3 months|quarterly.*goals|3-month.*goals|Question 2|next quarter|specific goals.*focus/i.test(lastAssistantMessage)) {
      questionType = 'quarterly_goals'; 
      questionNumber = 2;
    } else if (/habits|routines.*build|maintain.*routine|Question 3|daily.*routine|weekly.*routine|habits.*want/i.test(lastAssistantMessage)) {
      questionType = 'habits';
      questionNumber = 3;
    } else if (/projects|initiatives.*working|Question 4|specific projects|working on.*projects/i.test(lastAssistantMessage)) {
      questionType = 'projects';
      questionNumber = 4;
    }
    
    // Also detect life area selection
    if (/which.*areas.*focus|life areas|areas.*like.*focus|start with/i.test(lastAssistantMessage)) {
      questionType = 'life_area_selection';
    }

    console.log(`🔍 QUESTION DETECTION: Last assistant message: "${lastAssistantMessage.substring(0, 100)}..."`);
    console.log(`🔍 QUESTION DETECTION: Detected type: ${questionType}, number: ${questionNumber}`);

    // Add to conversation history with question context
    const newHistory = [...conversationHistory, 
      { 
        role: 'user', 
        content: currentInput,
        question_type: questionType,
        question_number: questionNumber,
        timestamp: new Date().toISOString()
      }
    ];
    setConversationHistory(newHistory);

    try {
      console.log('Sending message to chat API:', currentInput);
      const response = await fetch(`${apiConfig.chatUrl}/api/onboarding`, {
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

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (response.ok) {
        const data = await response.json();
        console.log('Received response from chat API:', data);
        
        const assistantMessage = {
          id: messages.length + 2,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation history with assistant response and context
        const updatedHistory = [...newHistory, 
          { 
            role: 'assistant', 
            content: data.response,
            timestamp: new Date().toISOString()
          }
        ];
        setConversationHistory(updatedHistory);

        // Check if interview is complete - when user explicitly requests final summary
        // Look for signals that indicate the user requested to finish
        const responseText = data.response.toLowerCase();
        const userInputLower = currentInput.toLowerCase();
        
        const userRequestedFinish = userInputLower.includes('final summary') || 
                                   userInputLower.includes('finish onboarding') ||
                                   userInputLower.includes('covers everything') ||
                                   userInputLower.includes('finish interview') ||
                                   userInputLower.includes('that\'s all') ||
                                   userInputLower.includes('i\'m done') ||
                                   userInputLower.includes('complete the interview');
        
        // Only check for completion if the USER explicitly asked to finish
        if (userRequestedFinish) {
          console.log('User requested to finish interview with input:', currentInput);
          
          // More lenient check for completion - look for summary indicators in AI response
          const hasSummaryIndicators = responseText.includes('summary') ||
                                      responseText.includes('complete') ||
                                      responseText.includes('ready') ||
                                      responseText.includes('onboarding') ||
                                      responseText.includes('goals') ||
                                      responseText.includes('habits') ||
                                      responseText.includes('projects') ||
                                      responseText.length > 150; // Longer responses likely contain summaries
          
          // Mark as complete if user requested finish and AI provided some kind of response
          if (hasSummaryIndicators) {
            console.log('Interview marked as complete - user requested finish and AI provided summary');
            setInterviewComplete(true);
          } else {
            console.log('User requested finish but AI response doesn\'t seem to be a summary, marking as complete anyway');
            setInterviewComplete(true); // More reliable - if user explicitly wants to finish, let them
          }
        }
      } else {
        clearTimeout(timeoutId); // Clear timeout even on error
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on any error
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please try again. (Error: ${error.message})`,
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

  // Map frontend life areas to backend enum values
  const mapLifeAreaToEnum = (area) => {
    const mapping = {
      'professional': 'professional_work',
      'personal_growth': 'personal_growth_learning', 
      'family_relationships': 'relationships',
      'health_self_care': 'health_self_care',
      'finances': 'finances',
      'community': 'community',
      'uncategorized': 'uncategorized'
    };
    return mapping[area] || 'uncategorized';
  };

  const saveInterviewData = async (interviewData) => {
    console.log('Saving interview data:', interviewData);
    
    try {
      // Parse the interview data to extract structured information
      const parsedData = parseInterviewData(interviewData);
      console.log('Parsed interview data:', parsedData);
      
      // Get user information
      const account = accounts[0];
      if (!account) {
        console.error('No user account found');
        return;
      }
      
      // Save user profile with corrected data structure
      const profileData = {
        user_id: account.localAccountId,
        display_name: account.name || account.username,
        email: account.username,
        onboarding_completed: true,
        first_run: true, // Flag for suggestion engine
        primary_life_areas: parsedData.lifeAreas.map(area => mapLifeAreaToEnum(area)),
        life_area_priorities: parsedData.lifeAreas.reduce((acc, area, index) => {
          acc[mapLifeAreaToEnum(area)] = index + 1;
          return acc;
        }, {}),
        // Store interview data for suggestion engine
        interview_data: {
          raw_responses: interviewData.responses,
          final_summary: interviewData.finalSummary,
          parsed_items: parsedData,
          completed_at: interviewData.completedAt
        }
      };
      
      console.log('Saving profile data:', profileData);
      
      // Try to update existing profile first, create new one if it doesn't exist
      let profileResponse = await fetch(`${apiConfig.backendUrl}/profiles/${account.localAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboarding_completed: profileData.onboarding_completed,
          first_run: profileData.first_run,
          primary_life_areas: profileData.primary_life_areas,
          life_area_priorities: profileData.life_area_priorities,
          interview_data: profileData.interview_data
        })
      });

      // If profile doesn't exist (404), create a new one
      if (profileResponse.status === 404) {
        console.log('Profile not found, creating new profile...');
        profileResponse = await fetch(`${apiConfig.backendUrl}/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });
      }
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('Failed to save profile:', errorText);
        return;
      }

      const savedProfile = await profileResponse.json();
      console.log('Profile saved successfully!', savedProfile);
      console.log('Interview data stored for suggestion engine.');
      
      // CRITICAL: Also update onboarding status to mark it complete with interview responses
      // This is what the main app reads to show personalized suggestions
      console.log('🔄 CRITICAL: Starting onboarding status update...');
      console.log('🔗 Backend URL:', apiConfig.backendUrl);
      console.log('👤 User ID:', account.localAccountId);
      
      const onboardingPayload = {
        step: 'completed',
        interview_data: {
          responses: interviewData.responses,
          final_summary: interviewData.finalSummary,
          parsed_items: {
            lifeAreas: parsedData.lifeAreas || [],
            yearlyGoals: parsedData.yearlyGoals || [],
            quarterlyGoals: parsedData.quarterlyGoals || [],
            habits: parsedData.habits || [],
            projects: parsedData.projects || []
          },
          completed_at: interviewData.completedAt,
          // Add legacy format for compatibility
          life_areas: parsedData.lifeAreas || [],
          primary_goals: [...(parsedData.yearlyGoals || []), ...(parsedData.quarterlyGoals || []), ...(parsedData.habits || [])],
          welcome_shown: false
        }
      };
      
      console.log('📦 Onboarding payload:', JSON.stringify(onboardingPayload, null, 2));
      
      try {
        const onboardingResponse = await fetch(`${apiConfig.backendUrl}/onboarding/${account.localAccountId}/step`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(onboardingPayload)
        });

        console.log('📡 Onboarding response status:', onboardingResponse.status);
        console.log('📡 Onboarding response headers:', Object.fromEntries(onboardingResponse.headers.entries()));

        if (onboardingResponse.ok) {
          const onboardingResult = await onboardingResponse.json();
          console.log('✅ CRITICAL SUCCESS: Onboarding status updated successfully!', onboardingResult);
        } else {
          const errorText = await onboardingResponse.text();
          console.error('❌ CRITICAL FAILURE: Failed to update onboarding status:', errorText);
          console.error('❌ Response status:', onboardingResponse.status);
          console.error('❌ Response statusText:', onboardingResponse.statusText);
          
          // Show user visible error
          alert(`CRITICAL ERROR: Failed to save onboarding completion. Status: ${onboardingResponse.status}. Please contact support.`);
        }
      } catch (error) {
        console.error('💥 CRITICAL NETWORK ERROR updating onboarding status:', error);
        console.error('💥 Error name:', error.name);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
        
        // Show user visible error
        alert(`CRITICAL NETWORK ERROR: Could not save onboarding completion. ${error.message}. Please contact support.`);
      }
      
      // Note: Individual goals/habits/projects will be handled by the suggestion engine
      // in the main app when the user first launches it
      
      console.log('Interview data saved successfully!');
      
    } catch (error) {
      console.error('Error saving interview data:', error);
      throw error;
    }
  };
  
  const saveUserItems = async (userId, parsedData) => {
    const itemsToSave = [];
    
    // Add yearly goals
    parsedData.yearlyGoals.forEach(goal => {
      itemsToSave.push({
        endpoint: 'yearly-goals',
        data: {
          user_id: userId,
          title: goal.title,
          description: goal.description,
          life_area: goal.lifeArea || 'uncategorized',
          priority: 'medium',
          status: 'active'
        }
      });
    });
    
    // Add quarterly goals
    parsedData.quarterlyGoals.forEach(goal => {
      itemsToSave.push({
        endpoint: 'quarterly-goals',
        data: {
          user_id: userId,
          title: goal.title,
          description: goal.description,
          life_area: goal.lifeArea || 'uncategorized',
          priority: 'medium',
          status: 'active'
        }
      });
    });
    
    // Add habits
    parsedData.habits.forEach(habit => {
      itemsToSave.push({
        endpoint: 'habits',
        data: {
          user_id: userId,
          title: habit.title,
          description: habit.description,
          life_area: habit.lifeArea || 'uncategorized',
          priority: 'medium',
          status: 'active'
        }
      });
    });
    
    // Add projects
    parsedData.projects.forEach(project => {
      itemsToSave.push({
        endpoint: 'projects',
        data: {
          user_id: userId,
          title: project.title,
          description: project.description,
          life_area: project.lifeArea || 'uncategorized',
          priority: 'medium',
          status: 'active'
        }
      });
    });
    
    // Save all items
    for (const item of itemsToSave) {
      try {
        console.log(`Saving ${item.endpoint}:`, item.data);
        
        const response = await fetch(`${apiConfig.backendUrl}/${item.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data)
        });
        
        if (!response.ok) {
          console.error(`Failed to save ${item.endpoint}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error saving ${item.endpoint}:`, error);
      }
    }
  };
  
  const parseInterviewData = (interviewData) => {
    console.log('🔍 PARSING: Starting interview data parsing with question context');
    const { responses } = interviewData;
    const lifeAreas = [];
    const yearlyGoals = [];
    const quarterlyGoals = [];
    const habits = [];
    const projects = [];
    
    let currentLifeArea = 'uncategorized';
    
    responses.forEach((exchange, index) => {
      console.log(`🔍 PARSING: Processing exchange ${index}:`, exchange);
      
      // Handle both new format (role/content) and old format (user/assistant)
      const userMessage = (exchange.role === 'user' ? exchange.content : exchange.user) || '';
      const assistantMessage = (exchange.role === 'assistant' ? exchange.content : exchange.assistant) || '';
      const questionType = exchange.question_type;
      const questionNumber = exchange.question_number;
      
      console.log(`🔍 PARSING: User message: "${userMessage}"`);
      console.log(`🔍 PARSING: Question type: ${questionType}, Question number: ${questionNumber}`);
      
      // Detect life area selection from user messages
      if (userMessage && exchange.role === 'user') {
        const newAreaPatterns = [
          { pattern: /focus on.*health|talk about.*health|health.*to start|health.*next/i, area: 'health_self_care' },
          { pattern: /focus on.*personal growth|talk about.*personal growth|personal growth.*next/i, area: 'personal_growth' },
          { pattern: /focus on.*professional|focus on.*work|talk about.*work|work.*next/i, area: 'professional' },
          { pattern: /focus on.*family|focus on.*relationship|talk about.*relationship/i, area: 'family_relationships' },
          { pattern: /focus on.*financ|talk about.*financ|money.*next/i, area: 'finances' },
          { pattern: /focus on.*community|talk about.*community/i, area: 'community' }
        ];
        
        newAreaPatterns.forEach(({ pattern, area }) => {
          if (pattern.test(userMessage) && !lifeAreas.includes(area)) {
            console.log(`✅ PARSING: User selected life area "${area}"`);
            lifeAreas.push(area);
            currentLifeArea = area;
          }
        });
      }
      
      // Parse responses based on the SAVED question context (much more reliable!)
      if (userMessage && questionType && userMessage.length > 3) {
        const isCompletionRequest = /finish|complete|covers everything|final summary|that's all|i'm done/i.test(userMessage);
        
        if (!isCompletionRequest) {
          console.log(`✅ PARSING: Using saved question context - Type: ${questionType}, Area: ${currentLifeArea}`);
          
          switch (questionType) {
            case 'yearly_goals':
              const yearlyGoalsList = parseGoalsFromText(userMessage);
              console.log(`✅ PARSING: Found ${yearlyGoalsList.length} yearly goals:`, yearlyGoalsList);
              yearlyGoalsList.forEach(goal => yearlyGoals.push({ ...goal, lifeArea: currentLifeArea }));
              break;
              
            case 'quarterly_goals':
              const quarterlyGoalsList = parseGoalsFromText(userMessage);
              console.log(`✅ PARSING: Found ${quarterlyGoalsList.length} quarterly goals:`, quarterlyGoalsList);
              quarterlyGoalsList.forEach(goal => quarterlyGoals.push({ ...goal, lifeArea: currentLifeArea }));
              break;
              
            case 'habits':
              const habitsList = parseHabitsFromText(userMessage);
              console.log(`✅ PARSING: Found ${habitsList.length} habits:`, habitsList);
              habitsList.forEach(habit => habits.push({ ...habit, lifeArea: currentLifeArea }));
              break;
              
            case 'projects':
              const projectsList = parseProjectsFromText(userMessage);
              console.log(`✅ PARSING: Found ${projectsList.length} projects:`, projectsList);
              projectsList.forEach(project => projects.push({ ...project, lifeArea: currentLifeArea }));
              break;
              
            default:
              console.log(`⚠️ PARSING: Unknown question type: ${questionType}`);
          }
        }
      }
    });
    
    const result = {
      lifeAreas: lifeAreas.length > 0 ? lifeAreas : ['uncategorized'],
      yearlyGoals,
      quarterlyGoals,
      habits,
      projects
    };
    
    console.log('🎯 PARSING: Final parsed result using question context:', result);
    return result;
  };
  
  const parseGoalsFromText = (text) => {
    console.log('🔍 GOAL PARSING: Input text:', text);
    
    // Split by common separators and clean up
    const goals = text.split(/[,;.\n]/)
      .map(goal => goal.trim())
      .filter(goal => goal.length > 3)
      .map(goal => {
        // Clean up any remaining punctuation at the end
        const cleanGoal = goal.replace(/[.,:;]$/, '').trim();
        return {
          title: cleanGoal.substring(0, 100), // Limit title length
          description: cleanGoal
        };
      });
    
    const result = goals.slice(0, 5); // Limit to 5 goals
    console.log('🎯 GOAL PARSING: Extracted goals:', result);
    return result;
  };
  
  const parseHabitsFromText = (text) => {
    console.log('🔍 HABIT PARSING: Input text:', text);
    
    const habits = text.split(/[,;.\n]/)
      .map(habit => habit.trim())
      .filter(habit => habit.length > 3)
      .map(habit => {
        // Clean up any remaining punctuation at the end
        const cleanHabit = habit.replace(/[.,:;]$/, '').trim();
        return {
          title: cleanHabit.substring(0, 100),
          description: cleanHabit
        };
      });
    
    const result = habits.slice(0, 5);
    console.log('🎯 HABIT PARSING: Extracted habits:', result);
    return result;
  };
  
  const parseProjectsFromText = (text) => {
    console.log('🔍 PROJECT PARSING: Input text:', text);
    
    const projects = text.split(/[,;.\n]/)
      .map(project => project.trim())
      .filter(project => project.length > 3)
      .map(project => {
        // Clean up any remaining punctuation at the end
        const cleanProject = project.replace(/[.,:;]$/, '').trim();
        return {
          title: cleanProject.substring(0, 100),
          description: cleanProject
        };
      });
    
    const result = projects.slice(0, 5);
    console.log('🎯 PROJECT PARSING: Extracted projects:', result);
    return result;
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="OneTaskAssistant Logo" 
            className="h-12 w-12 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Let's Personalize Your Experience</h1>
        <p className="mt-2 text-gray-600">
          A quick chat to understand how you work best
        </p>
        {!interviewComplete && messages.length > 2 && (
          <p className="mt-2 text-sm text-purple-600 bg-purple-50 rounded-lg px-4 py-2 inline-block">
            💡 <strong>Tip:</strong> You can select multiple life areas and I'll ask about each one. 
            Use the buttons below to add more areas or finish when you're ready!
          </p>
        )}
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
        <div className="flex flex-col space-y-2">
          {/* Debug info for developers */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded space-y-1">
              <div>Debug: isLoading={isLoading.toString()}, interviewComplete={interviewComplete.toString()}, messages={messages.length}, conversationHistory={conversationHistory.length}</div>
              {!interviewComplete && conversationHistory.length > 4 && (
                <button
                  onClick={() => {
                    console.log('Manually marking interview as complete');
                    setInterviewComplete(true);
                  }}
                  className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded border border-yellow-300"
                >
                  🔧 Dev: Force Complete Interview
                </button>
              )}
            </div>
          )}
          
          {/* Emergency reset button if chat gets stuck */}
          {isLoading && messages.length > 2 && (
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Emergency reset triggered');
                  setIsLoading(false);
                }}
                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300"
              >
                🔄 Chat Stuck? Click to Reset
              </button>
            </div>
          )}
          
          {/* Quick Action Buttons */}
          {!interviewComplete && messages.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => {
                  setInputValue("I'd like to add another life area");
                  // Automatically send the message after a brief delay
                  setTimeout(() => {
                    const input = inputRef.current;
                    if (input) {
                      const event = new KeyboardEvent('keypress', { key: 'Enter' });
                      input.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 transition-colors"
                disabled={isLoading}
              >
                ➕ Add Another Area
              </button>
              <button
                onClick={() => {
                  const finishMessage = "I think that covers everything. Can you create my final interview summary so I can finish onboarding?";
                  setInputValue(finishMessage);
                  // Automatically send the message after a brief delay
                  setTimeout(() => {
                    handleSendMessage();
                  }, 100);
                }}
                className="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 rounded-full border border-purple-300 transition-colors"
                disabled={isLoading}
              >
                ✅ Finish Interview - Create Final Summary
              </button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isLoading ? "Please wait..." : "Type your response..."}
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
