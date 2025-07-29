# Fun Chatbot

A sophisticated AI chatbot web application with advanced memory management, built with Next.js, TypeScript, Tailwind CSS, Firebase, and OpenAI. This project demonstrates modern web development practices with intelligent conversation memory and efficient caching strategies.

## 🚀 Features Implemented

### Core Chat Functionality
- 🤖 **AI Chat Interface** - Real-time conversations with OpenAI GPT models
- 💬 **Persistent Chat History** - All conversations stored in Firebase Firestore
- 🔄 **Conversation Management** - Start new chats and seamlessly continue previous ones
- 📱 **Responsive Design** - Modern, mobile-friendly UI with Tailwind CSS

### Advanced Memory System
- 🧠 **Conversation Memory** - AI remembers context from previous conversations
- 📝 **Automatic Summaries** - Conversations are summarized for future context
- 🔍 **Relevance Scoring** - Intelligent retrieval of relevant past conversations
- 🎯 **Context Injection** - Previous relevant memories are injected into new conversations

### Smart Caching Algorithm
- ⚡ **Conversation Caching** - Client-side caching with 5-minute staleness detection
- 🚀 **Instant Loading** - Cached conversations load immediately
- 🔄 **Background Refresh** - Stale data refreshes in background without blocking UI
- 💾 **Memory-Efficient** - Cache size management with manual clear option

### Usage Tracking & Analytics
- 📊 **Token Usage Tracking** - Automatic tracking of OpenAI API usage
- 💰 **Cost Calculation** - Real-time cost calculation based on current pricing
- 📈 **Usage Dashboard** - Comprehensive analytics with interactive charts
- 🎯 **Model Breakdown** - Usage statistics by AI model type

### User Authentication
- 🔐 **Firebase Authentication** - Secure email/password and Google OAuth
- 🛡️ **Protected Routes** - Authentication-required chat interface
- 👤 **User Sessions** - Persistent login state management
- 🔒 **Data Isolation** - Users can only access their own conversations

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Charts**: Recharts for analytics visualization

### Backend
- **API**: Next.js API Routes (serverless functions)
- **AI Integration**: OpenAI API with LangChain framework
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth

### Why Next.js API Routes?

Instead of directly connecting to Firebase from the client, we use Next.js API Routes for several critical reasons:

1. **Security**: API keys and sensitive credentials stay server-side
2. **Rate Limiting**: Centralized control over API usage
3. **Data Processing**: Complex operations like memory building and token counting
4. **Caching**: Server-side caching for better performance
5. **Error Handling**: Centralized error management and logging
6. **Scalability**: Easy to add middleware, validation, and monitoring

## 🗄️ Firebase Database Structure

### Collections

#### `users`
```typescript
{
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastActive: Date;
}
```

#### `conversations`
```typescript
{
  id: string;
  userId: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `messages`
```typescript
{
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

#### `conversation_memories`
```typescript
{
  id: string;
  userId: string;
  conversationId: string;
  summary: string;
  keyTopics: string[];
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
}
```

#### `usage`
```typescript
{
  id: string;
  userId: string;
  conversationId: string;
  messageId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
}
```

## 🧠 Chat Memory Awareness System

### How It Works

1. **Memory Building**: When a conversation has 5+ messages, the system automatically creates a summary
2. **Relevance Scoring**: Uses keyword matching to find relevant past conversations
3. **Context Injection**: Relevant memories are injected into new conversation prompts
4. **Memory Retrieval**: System retrieves top 3 most relevant memories for each new message

### Memory Algorithm

```typescript
// Relevance scoring based on keyword matching
private calculateRelevance(currentMessage: string, memory: ConversationMemory): number {
  const messageWords = currentMessage.toLowerCase().split(/\s+/);
  const topicWords = memory.keyTopics.join(' ').toLowerCase().split(/\s+/);
  const summaryWords = memory.summary.toLowerCase().split(/\s+/);
  
  let score = 0;
  const allMemoryWords = [...topicWords, ...summaryWords];
  
  for (const word of messageWords) {
    if (allMemoryWords.includes(word)) {
      score += 1;
    }
  }
  
  // Normalize by message length and add importance factor
  return (score / messageWords.length) * memory.importance;
}
```

## ⚡ Caching Algorithm

### Conversation Cache Strategy

```typescript
interface CachedConversation {
  messages: Message[];
  memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  };
  lastFetched: number;
}
```

### Cache Behavior
- **Immediate Loading**: Cached conversations display instantly
- **Staleness Detection**: Data older than 5 minutes is considered stale
- **Background Refresh**: Stale data refreshes in background without blocking UI
- **Cache Management**: Manual cache clearing option available

### Cache Flow
1. User clicks conversation → Check cache
2. If cached and fresh → Display immediately
3. If cached but stale → Display cached data + refresh in background
4. If not cached → Load fresh data with loading indicator

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                          # Next.js API Routes
│   │   ├── chat/route.ts             # Main chat endpoint with memory
│   │   ├── conversations/            # Conversation management
│   │   ├── memory/route.ts           # Memory retrieval API
│   │   ├── usage/route.ts            # Usage analytics API
│   │   └── test-firebase/route.ts    # Firebase connection test
│   ├── chat/page.tsx                 # Main chat interface
│   ├── login/page.tsx                # Authentication pages
│   ├── signup/page.tsx
│   ├── usage/page.tsx                # Usage dashboard
│   └── layout.tsx
├── components/
│   ├── auth/                         # Authentication components
│   ├── chat/                         # Chat interface components
│   │   ├── ChatContainer.tsx         # Main chat layout
│   │   ├── ChatArea.tsx              # Message display area
│   │   ├── ConversationSidebar.tsx   # Conversation list with caching
│   │   ├── MemoryIndicator.tsx       # Memory status display
│   │   ├── UsageIndicator.tsx        # Usage stats display
│   │   └── MessageBubble.tsx         # Individual message component
│   └── ui/                           # Reusable UI components
├── contexts/
│   └── AuthContext.tsx               # Authentication context
├── lib/
│   ├── database.ts                   # Firestore operations
│   ├── firebase.ts                   # Firebase Admin SDK
│   ├── firebase-client.ts            # Firebase client SDK
│   ├── openai.ts                     # OpenAI configuration & pricing
│   ├── langchain/                    # LangChain integration
│   │   └── index.ts
│   ├── memory/                       # Memory management system
│   │   └── index.ts
│   └── utils.ts                      # Utility functions
└── types/
    └── chat.ts                       # TypeScript interfaces
```

## 🚀 Deployment on Vercel

### Why Vercel?
- **Zero Configuration**: Automatic Next.js detection and optimization
- **Global CDN**: Fast loading times worldwide
- **Serverless Functions**: Perfect for API routes
- **Automatic Deployments**: Git-based deployment pipeline
- **Environment Variables**: Secure credential management

### Deployment Process
1. **Repository Setup**: Push code to GitHub/GitLab/Bitbucket
2. **Vercel Import**: Connect repository to Vercel
3. **Environment Configuration**: Set all required environment variables
4. **Automatic Deployment**: Vercel builds and deploys automatically
5. **Domain Configuration**: Add custom domain (optional)

### Environment Variables Required
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-3.5-turbo

# App Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 📊 API Endpoints

### Chat & Memory
- `POST /api/chat` - Send message, get AI response with memory context
- `GET /api/memory` - Retrieve conversation memories and summaries
- `GET /api/conversations` - Get user's conversation list
- `GET /api/conversations/{id}/messages` - Get conversation messages

### Analytics & Usage
- `GET /api/usage` - Get usage statistics and analytics
- `GET /api/test-firebase` - Test Firebase connection

## 🔧 Setup Instructions

### 1. Clone & Install
```bash
git clone <repository-url>
cd fun-chatbot
npm install
```

### 2. Environment Setup
```bash
cp env.template .env.local
# Fill in your environment variables
```

### 3. Firebase Setup
1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password + Google)
4. Generate service account key
5. Update environment variables

### 4. OpenAI Setup
1. Create account at [OpenAI Platform](https://platform.openai.com/)
2. Add billing information
3. Generate API key
4. Add to environment variables

### 5. Run Development
```bash
npm run dev
```

## 🎯 Current Implementation Status

✅ **Core Chat System** - Basic chat functionality with OpenAI
✅ **Database Integration** - Firebase Firestore for data persistence
✅ **Memory Management** - Advanced conversation memory with LangChain
✅ **Caching System** - Smart client-side caching for performance
✅ **Usage Tracking** - Comprehensive analytics and cost tracking
✅ **User Authentication** - Firebase Auth with protected routes
✅ **Responsive UI** - Modern interface with Tailwind CSS
✅ **Vercel Deployment** - Production-ready deployment setup

## 🚀 Performance Features

- **Serverless Architecture**: Automatic scaling with Vercel
- **Intelligent Caching**: Reduces API calls and improves UX
- **Memory Optimization**: Efficient conversation memory management
- **Token Counting**: Accurate usage tracking for cost control
- **Background Processing**: Non-blocking UI operations

## 🔮 Future Enhancements

- [ ] **Real-time Updates** - WebSocket integration for live chat
- [ ] **File Uploads** - Support for image and document sharing
- [ ] **Voice Chat** - Speech-to-text and text-to-speech
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Analytics** - More detailed usage insights
- [ ] **Team Collaboration** - Shared conversations and workspaces

---

**Built with ❤️ using Next.js, Firebase, and OpenAI**
