# OneTaskAssistant Onboarding App

A React/Vite application for user onboarding and account setup for OneTaskAssistant.

## Features

- **Authentication**: Microsoft/Azure AD integration with MSAL
- **Profile Setup**: Account type selection (Free/Pro/Premium) and user preferences
- **Usage Agreement**: Terms of service and privacy policy acceptance
- **Interactive Interview**: AI-powered chat to personalize the user experience
- **Responsive Design**: Modern UI built with Tailwind CSS

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   - Copy `.env.example` to `.env.local`
   - Update with your Azure AD application details:
     ```
     VITE_AZURE_CLIENT_ID=your-client-id
     VITE_REDIRECT_URI=http://localhost:5173/auth/callback
     VITE_BACKEND_URL=http://localhost:7071
     VITE_CHAT_URL=http://localhost:7072
     ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Architecture

### Components
- `SignUpPage`: MSAL authentication flow
- `ProfileSetup`: User information and account type selection
- `UsageAgreement`: Terms acceptance with full text display
- `ChatInterview`: Interactive onboarding questions (ready for chat API integration)
- `CompletePage`: Success page with next steps

### Flow
1. User signs in with Microsoft/Google via MSAL
2. Profile setup with account type selection (Free/Pro/Premium)
3. Terms of service and privacy policy acceptance
4. Interactive chat interview for personalization
5. Completion with redirect to main app

## Integration Points

### Backend API
- Profile creation: `POST /api/profiles`
- Onboarding status: `POST /api/onboarding-status`
- User preferences: `POST /api/user-preferences`

### Chat API
- Onboarding interview: `POST /api/onboarding-chat`
- Save responses: `POST /api/onboarding-responses`

## Deployment

This app is configured for Azure Static Web Apps deployment with:
- `staticwebapp.config.json` for routing and security
- Environment variables for different environments
- CORS configuration for API integration

### Azure Static Web Apps
1. Connect your repository to Azure Static Web Apps
2. Set build configuration:
   - App location: `/`
   - Build location: `dist`
   - Build command: `npm run build`

3. Configure environment variables in Azure portal

## Development Notes

- Uses React Router for navigation between onboarding steps
- MSAL integration handles authentication state
- Tailwind CSS for responsive, modern UI
- Ready for integration with existing OneTaskAssistant backend APIs
- Chat interview component prepared for AI integration

## Support

For questions or issues, contact the development team.
