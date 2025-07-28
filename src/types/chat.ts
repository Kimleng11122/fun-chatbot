export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId: string;
  userId: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  isNewConversation: boolean;
} 