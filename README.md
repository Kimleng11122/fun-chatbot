# Fun Chatbot

A modern AI chatbot web application built with Next.js, TypeScript, Tailwind CSS, Firebase, and OpenAI.

## Features

- 🤖 **AI Chat Interface** - Real-time conversations with OpenAI
- 💬 **Chat History** - Persistent conversation storage in Firestore
- 👤 **User Sessions** - Simple user management with local storage
- 📱 **Responsive Design** - Modern UI with Tailwind CSS
- 🔄 **Conversation Management** - Start new chats and continue previous ones

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **AI**: OpenAI API
- **Icons**: Lucide React

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# App Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database (start in test mode)
4. Go to Project Settings > Service Accounts
5. Generate new private key and download JSON
6. Extract values from JSON file

### 3. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create account and add billing
3. Generate API key
4. Add to environment variables

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Chat API endpoint
│   │   └── conversations/             # Conversation management
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── chat/
│       ├── ChatContainer.tsx          # Main chat interface
│       ├── ChatInput.tsx              # Message input
│       └── MessageBubble.tsx          # Message display
├── lib/
│   ├── database.ts                    # Firestore operations
│   ├── firebase.ts                    # Firebase configuration
│   ├── openai.ts                      # OpenAI configuration
│   ├── userSession.ts                 # User session management
│   └── utils.ts                       # Utility functions
└── types/
    └── chat.ts                        # TypeScript interfaces
```

## Deployment

### Vercel Deployment

1. **Fork/Clone** this repository to your GitHub account
2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables**:
   - In your Vercel project dashboard, go to Settings > Environment Variables
   - Add all the environment variables from your `.env.local` file:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_PRIVATE_KEY`
     - `FIREBASE_CLIENT_EMAIL`
     - `OPENAI_API_KEY`
     - `OPENAI_MODEL`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

4. **Deploy**: Vercel will automatically deploy your app

### Environment Variables Reference

Copy the `env.template` file to `.env.local` and fill in your values:

```bash
cp env.template .env.local
```

## Current Implementation Status

✅ **Step 1: Basic Setup** - Firebase + OpenAI configuration
✅ **Step 2: Simple Chat** - Basic chat without memory
✅ **Step 3: Database Integration** - Store conversations in Firebase
✅ **Step 4: LangChain Integration** - Add memory management
✅ **Step 5: Advanced Memory Features** - Conversation summaries and context injection

## Next Steps

- [ ] **Step 6: User Authentication** - Proper user management
- [ ] **Step 7: UI Enhancements** - Better styling and UX

## API Endpoints

- `POST /api/chat` - Send message and get AI response
- `GET /api/conversations?userId={id}` - Get user conversations
- `GET /api/conversations/{id}/messages` - Get conversation messages

## Database Collections

- `users` - User information
- `conversations` - Conversation metadata
- `messages` - Individual chat messages
