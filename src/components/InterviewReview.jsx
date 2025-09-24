import React, { useState } from 'react';
import logoImage from '../assets/logo.png';

const InterviewReview = ({ interviewData, onComplete, onBack }) => {
  const [editedItems, setEditedItems] = useState(() => {
    // Parse the interview data and categorize items
    return parseInterviewData(interviewData);
  });

  const [editingItem, setEditingItem] = useState(null);

  // Parse interview responses into categorized items
  function parseInterviewData(data) {
    if (!data.raw_responses) return { yearlyGoals: [], quarterlyGoals: [], habits: [], projects: [] };

    const items = { yearlyGoals: [], quarterlyGoals: [], habits: [], projects: [] };
    const responses = data.raw_responses;
    let currentLifeArea = 'General';
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      
      // Update life area context
      if (response.role === 'assistant' && response.content.toLowerCase().includes('health')) {
        currentLifeArea = 'Health & Self-Care';
      } else if (response.role === 'assistant' && response.content.toLowerCase().includes('career')) {
        currentLifeArea = 'Career & Professional';
      } else if (response.role === 'assistant' && response.content.toLowerCase().includes('finance')) {
        currentLifeArea = 'Financial';
      }
      
      if (response.role === 'user') {
        const userText = response.content.trim();
        if (!userText || userText.length < 3) continue;
        
        // Get context from previous assistant message
        const prevResponse = i > 0 ? responses[i-1] : null;
        const context = prevResponse?.content?.toLowerCase() || '';
        
        const item = {
          id: `item_${i}`,
          text: userText,
          lifeArea: currentLifeArea,
          originalIndex: i
        };
        
        // Categorize based on context
        if (context.includes('big goals') || context.includes('yearly') || context.includes('year')) {
          items.yearlyGoals.push(item);
        } else if (context.includes('3 months') || context.includes('quarterly') || context.includes('quarter')) {
          items.quarterlyGoals.push(item);
        } else if (context.includes('habits') || context.includes('routines') || context.includes('daily')) {
          // Smart detection: if it sounds like a project, suggest project category
          if (userText.toLowerCase().includes('build') || userText.toLowerCase().includes('create') || 
              userText.toLowerCase().includes('develop') || userText.toLowerCase().includes('plan')) {
            items.projects.push(item);
          } else {
            items.habits.push(item);
          }
        } else if (context.includes('projects') || context.includes('initiatives') || context.includes('working on')) {
          items.projects.push(item);
        } else {
          // Default categorization based on content
          if (userText.toLowerCase().includes('daily') || userText.toLowerCase().includes('every day')) {
            items.habits.push(item);
          } else {
            items.projects.push(item);
          }
        }
      }
    }
    
    return items;
  }

  const handleCategoryChange = (itemId, newCategory) => {
    setEditedItems(prev => {
      const newItems = { ...prev };
      let itemToMove = null;
      let sourceCategory = null;
      
      // Find and remove the item from its current category
      Object.keys(newItems).forEach(category => {
        const index = newItems[category].findIndex(item => item.id === itemId);
        if (index !== -1) {
          itemToMove = newItems[category][index];
          sourceCategory = category;
          newItems[category] = newItems[category].filter(item => item.id !== itemId);
        }
      });
      
      // Add to new category
      if (itemToMove) {
        newItems[newCategory].push(itemToMove);
      }
      
      return newItems;
    });
    
    setEditingItem(null);
  };

  const handleComplete = () => {
    // Convert back to the format expected by the main app
    const processedData = {
      ...interviewData,
      categorized_items: editedItems
    };
    
    onComplete(processedData);
  };

  const CategoryIcon = ({ category }) => {
    switch (category) {
      case 'yearlyGoals':
        return <span className="text-blue-500">🎯</span>;
      case 'quarterlyGoals':
        return <span className="text-green-500">📅</span>;
      case 'habits':
        return <span className="text-purple-500">🔄</span>;
      case 'projects':
        return <span className="text-orange-500">📋</span>;
      default:
        return <span>📝</span>;
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'yearlyGoals': return 'Yearly Goals';
      case 'quarterlyGoals': return 'Quarterly Goals';
      case 'habits': return 'Habits & Routines';
      case 'projects': return 'Projects & Tasks';
      default: return category;
    }
  };

  const getTotalItems = () => {
    return Object.values(editedItems).reduce((total, items) => total + items.length, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
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
          Review Your Responses
        </h1>
        <p className="text-lg text-gray-600">
          We've organized your responses below. Feel free to adjust any categories before continuing.
        </p>
        <div className="text-sm text-gray-500 mt-2">
          {getTotalItems()} items total
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Object.entries(editedItems).map(([category, items]) => (
          <div key={category} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CategoryIcon category={category} />
                {getCategoryName(category)}
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {items.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No items in this category</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{item.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Life area: {item.lifeArea}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="text-xs bg-white border border-gray-200 hover:border-primary-300 px-2 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    
                    {editingItem === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Move to:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(editedItems).map((cat) => (
                            cat !== category && (
                              <button
                                key={cat}
                                onClick={() => handleCategoryChange(item.id, cat)}
                                className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1"
                              >
                                <CategoryIcon category={cat} />
                                {getCategoryName(cat)}
                              </button>
                            )
                          ))}
                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Chat
        </button>
        
        <button
          onClick={handleComplete}
          className="btn-primary flex items-center gap-2"
        >
          Continue to Setup
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Quick Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Goals:</strong> Big outcomes you want to achieve</li>
              <li>• <strong>Projects:</strong> Multi-step work items with a clear end</li>
              <li>• <strong>Habits:</strong> Daily/weekly routines you want to build</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReview;
