import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { ConversationSummaryMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { OPENAI_MODEL } from '../openai';

// Initialize OpenAI LLM only if API key is available
export const llm = process.env.OPENAI_API_KEY 
  ? new ChatOpenAI({
      modelName: OPENAI_MODEL,
      temperature: 0.7,
      maxTokens: 1000,
    })
  : null;

// Custom prompt template for better conversation flow
const conversationPrompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant with access to conversation history and memory. 
Your goal is to provide helpful, accurate, and contextually relevant responses.

Current conversation:
{history}
Human: {input}
AI Assistant:`);

// Create conversation chain with summary memory
export function createConversationChain() {
  if (!llm) {
    throw new Error('OpenAI API key not configured');
  }
  
  const memory = new ConversationSummaryMemory({
    llm,
    memoryKey: 'history',
    returnMessages: true,
  });

  return new ConversationChain({
    llm,
    memory,
    prompt: conversationPrompt,
  });
}

// Export types for memory management
export interface MemoryContext {
  recentMessages: string[];
  conversationSummary: string;
  relevantMemories: string[];
  userContext: string;
}

export interface ConversationMemory {
  id: string;
  userId: string;
  conversationId: string;
  summary: string;
  keyTopics: string[];
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
} 