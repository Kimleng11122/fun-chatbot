export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId: string;
  userId: string;
  // New fields for images
  images?: ImageAttachment[];
  messageType?: 'text' | 'image-upload' | 'image-analysis' | 'image-generation' | 'image-modification';
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
  images?: File[];
  messageType?: 'text' | 'image-upload' | 'image-generation' | 'image-modification';
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  isNewConversation: boolean;
}

// New interfaces for image support
export interface ImageAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  uploadTimestamp: Date;
  analysis?: ImageAnalysis;
  modifications?: ImageModification[];
}

export interface ImageAnalysis {
  description: string;
  textContent?: string;
  objects: string[];
  colors: string[];
  confidence: number;
}

export interface ImageModification {
  id: string;
  originalImageId: string;
  prompt: string;
  generatedImageUrl: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  conversationContext?: string;
}

export interface ImageGenerationResponse {
  url: string;
  prompt: string;
  size: string;
  timestamp: Date;
}

export interface ImageUploadRequest {
  file: File;
  userId: string;
  conversationId: string;
}

export interface ImageUploadResponse {
  image: ImageAttachment;
  analysis?: ImageAnalysis;
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
  // New fields for image usage tracking
  imageAnalysisCost?: number;
  imageGenerationCost?: number;
  imageModificationCost?: number;
  storageCost?: number;
}

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalMessages: number;
  averageTokensPerMessage: number;
  usageByModel: Record<string, { tokens: number; cost: number; messages: number }>;
  usageByDate: Record<string, { tokens: number; cost: number; messages: number }>;
  // New fields for image usage
  totalImages: number;
  totalImageAnalysis: number;
  totalImageGenerations: number;
  imageCosts: {
    analysis: number;
    generation: number;
    storage: number;
  };
}

export interface PricingInfo {
  model: string;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  description: string;
  // New fields for image pricing
  imageAnalysisPrice?: number;
  imageGenerationPrice?: number;
}

export interface UsageResponse {
  stats: UsageStats;
  recentUsage: UsageRecord[];
  pricing: PricingInfo[];
} 