# Authentication Setup

## Firebase Authentication Configuration

### 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `nubiq-docs-2024`
3. Go to **Authentication** in the left sidebar
4. Click **"Get started"**

### 2. Enable Sign-in Methods

#### Email/Password Authentication:
1. Click on **"Email/Password"** in the Sign-in providers list
2. Toggle **"Enable"** to turn it on
3. Optionally enable **"Email link (passwordless sign-in)"**
4. Click **"Save"**

#### Google Authentication:
1. Click on **"Google"** in the Sign-in providers list
2. Toggle **"Enable"** to turn it on
3. Add your **Project support email**
4. Click **"Save"**

### 3. Configure Authorized Domains

1. Go to **Settings** tab in Authentication
2. Under **"Authorized domains"**, add:
   - `localhost` (for development)
   - Your production domain (when deployed)

### 4. Set Up Firestore Security Rules

Update your Firestore security rules to allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can only access messages from their conversations
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Test the Authentication

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Try creating an account with email/password
4. Try signing in with Google
5. Test the protected chat functionality

## User Flow

### Authentication Flow:
1. **Landing Page** (`/`) - Welcome screen with login/signup options
2. **Login Page** (`/login`) - Email/password and Google sign-in
3. **Signup Page** (`/signup`) - Create new account
4. **Chat Page** (`/chat`) - Protected chat interface

### Features:
- ✅ **Email/Password Authentication**
- ✅ **Google OAuth Sign-in**
- ✅ **Protected Routes**
- ✅ **User Session Management**
- ✅ **Automatic Redirects**
- ✅ **Logout Functionality**

## Security Features

- **Protected Routes**: Unauthenticated users are redirected to login
- **User Isolation**: Users can only access their own conversations
- **Secure API**: All chat endpoints require authentication
- **Session Management**: Automatic session persistence and cleanup

## Next Steps

After setting up authentication, you can:

1. **Add User Profiles**: Store additional user information
2. **Implement Password Reset**: Add forgot password functionality
3. **Add Email Verification**: Require email verification for new accounts
4. **Add Social Logins**: Facebook, Twitter, GitHub, etc.
5. **Add Multi-factor Authentication**: SMS or app-based 2FA 