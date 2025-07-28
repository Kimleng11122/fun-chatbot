# Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# App Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

## How to get these values:

### Firebase Setup:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file and extract the values:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `client_email` → FIREBASE_CLIENT_EMAIL

### OpenAI Setup:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and add billing
3. Go to API Keys section
4. Create a new API key
5. Copy the key to OPENAI_API_KEY

### Firestore Setup:
1. In Firebase Console, go to Firestore Database
2. Create database in test mode (for development)
3. Set up security rules later for production 