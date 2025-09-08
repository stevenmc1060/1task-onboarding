// Reset User Data Script
// Usage: node reset-user-data.js [userId]

import fetch from 'node-fetch';

const API_BASE = 'https://1task-backend-api-gse0fsgngtfxhjc6.southcentralus-01.azurewebsites.net/api';

async function resetUserData(userId) {
  console.log(`🔄 Resetting data for user: ${userId}`);
  
  try {
    // 1. Reset interview data and onboarding status
    console.log('1️⃣ Resetting interview data...');
    const interviewResponse = await fetch(`${API_BASE}/profiles/${userId}`, {
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

    if (interviewResponse.ok) {
      console.log('✅ Interview data reset successfully');
    } else {
      console.error('❌ Failed to reset interview data:', await interviewResponse.text());
    }

    // 2. Reset onboarding status completely
    console.log('2️⃣ Resetting onboarding status...');
    const onboardingResponse = await fetch(`${API_BASE}/onboarding/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_step: 'welcome',
        completed_steps: [],
        is_completed: false,
        completed_at: null,
        welcome_shown: false,
        interview_responses: null
      })
    });

    if (onboardingResponse.ok) {
      console.log('✅ Onboarding status reset successfully');
    } else {
      console.error('❌ Failed to reset onboarding status:', await onboardingResponse.text());
    }

    // 3. Delete user goals, habits, and projects (optional - for complete reset)
    console.log('3️⃣ Cleaning up user items...');
    const endpoints = ['yearly-goals', 'quarterly-goals', 'habits', 'projects'];
    
    for (const endpoint of endpoints) {
      try {
        const deleteResponse = await fetch(`${API_BASE}/${endpoint}?user_id=${userId}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted ${endpoint} for user`);
        } else {
          console.log(`⚠️  No ${endpoint} found for user (this is normal)`);
        }
      } catch (error) {
        console.log(`⚠️  Could not delete ${endpoint}:`, error.message);
      }
    }

    console.log('🎉 User data reset complete!');
    console.log('👉 The user can now go through onboarding again.');
    
  } catch (error) {
    console.error('💥 Error resetting user data:', error);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node reset-user-data.js [userId]');
  console.log('Example: node reset-user-data.js c9...');
  process.exit(1);
}

// Validate user ID starts with c9
if (!userId.startsWith('c9')) {
  console.log('⚠️  Warning: User ID does not start with "c9"');
  console.log('Continue anyway? (y/N)');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString().toLowerCase() === 'y') {
      resetUserData(userId);
    } else {
      console.log('❌ Cancelled');
      process.exit(0);
    }
    process.stdin.setRawMode(false);
  });
} else {
  resetUserData(userId);
}
