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

// Usage tracking types
export interface UsageRecord {
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

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalMessages: number;
  averageTokensPerMessage: number;
  usageByModel: Record<string, { tokens: number; cost: number; messages: number }>;
  usageByDate: Record<string, { tokens: number; cost: number; messages: number }>;
}

export interface PricingInfo {
  model: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  description: string;
}

export interface UsageResponse {
  stats: UsageStats;
  recentUsage: UsageRecord[];
  pricing: PricingInfo[];
} 