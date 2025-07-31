import { llm } from '../langchain';
import { db } from '../firebase';
import { ConversationMemory, MemoryContext } from '../langchain';

// Memory management service
export class MemoryService {
  private static instance: MemoryService;
  private quotaErrorCount = 0;
  private lastQuotaError = 0;
  private summaryGenerationDisabled = false;

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  // Helper function to check if database is available
  private checkDatabase() {
    if (!db) {
      throw new Error('Firebase not configured. Please check your environment variables.');
    }
  }

  // Enhanced error handling for OpenAI quota issues
  private async handleOpenAIError(error: unknown, operation: string): Promise<{ success: boolean; fallback?: unknown }> {
    console.error(`OpenAI error in ${operation}:`, error);
    
    // Type guard to check if error is an object with properties
    if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
      const errorObj = error as { name?: string; message?: string; status?: number };
      
      // Check for specific quota-related errors
      if (errorObj.name === 'InsufficientQuotaError' || 
          errorObj.status === 429 || 
          errorObj.message?.includes('quota') ||
          errorObj.message?.includes('billing')) {
        
        // Track quota errors
        this.quotaErrorCount++;
        this.lastQuotaError = Date.now();
        
        // Disable summary generation for 1 hour after 3 quota errors
        if (this.quotaErrorCount >= 3) {
          this.summaryGenerationDisabled = true;
          console.warn('Summary generation disabled due to repeated quota errors. Will re-enable in 1 hour.');
        }
        
        console.warn(`OpenAI quota exceeded for ${operation}. Using fallback mechanism.`);
        return { success: false };
      }
      
      // Check for rate limiting
      if (errorObj.name === 'RateLimitError' || errorObj.status === 429) {
        console.warn(`OpenAI rate limit exceeded for ${operation}. Using fallback mechanism.`);
        return { success: false };
      }
      
      // Check for authentication errors
      if (errorObj.name === 'AuthenticationError' || errorObj.status === 401) {
        console.error(`OpenAI authentication failed for ${operation}. Check your API key.`);
        return { success: false };
      }
    }
    
    // Re-throw other errors
    throw error;
  }

  // Simple text-based summary generation (fallback when OpenAI is unavailable)
  private generateFallbackSummary(messages: Array<{ role: string; content: string }>): { summary: string; keyTopics: string[] } {
    try {
      // Extract all text content
      const allText = messages.map(msg => msg.content).join(' ');
      
      // Simple keyword extraction
      const words = allText.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      // Count word frequency
      const wordCount: Record<string, number> = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      // Get top keywords
      const topKeywords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
      
      // Create simple summary
      const firstMessage = messages[0]?.content || '';
      const lastMessage = messages[messages.length - 1]?.content || '';
      
      let summary = `Conversation about ${topKeywords.slice(0, 3).join(', ')}`;
      if (firstMessage && lastMessage) {
        summary += `. Started with: "${firstMessage.slice(0, 50)}..." and ended with: "${lastMessage.slice(0, 50)}..."`;
      }
      
      return {
        summary,
        keyTopics: topKeywords
      };
    } catch (error) {
      console.error('Error generating fallback summary:', error);
      return {
        summary: 'Conversation summary unavailable',
        keyTopics: ['general conversation']
      };
    }
  }

  // Create conversation summary with enhanced error handling
  async createConversationSummary(
    userId: string,
    conversationId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<ConversationMemory> {
    try {
      if (!llm) {
        console.warn('OpenAI LLM not configured. Using fallback summary generation.');
        const fallback = this.generateFallbackSummary(messages);
        return this.saveMemory(userId, conversationId, fallback.summary, fallback.keyTopics, messages.length);
      }

      this.checkDatabase();

      // Create summary prompt
      const summaryPrompt = `
        Summarize the following conversation in 2-3 sentences. 
        Extract key topics and important information that would be useful for future context.
        
        Conversation:
        ${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Summary:`;

      let summary: string;
      let keyTopics: string[];

      try {
        const summaryResponse = await llm.invoke(summaryPrompt);
        summary = summaryResponse.content as string;

        // Extract key topics
        const topicsPrompt = `
          Extract 3-5 key topics from this conversation summary:
          ${summary}
          
          Topics (comma-separated):`;

        const topicsResponse = await llm.invoke(topicsPrompt);
        keyTopics = (topicsResponse.content as string)
          .split(',')
          .map(topic => topic.trim())
          .filter(topic => topic.length > 0);
              } catch (error: unknown) {
          const errorResult = await this.handleOpenAIError(error, 'conversation summary');
        
        if (!errorResult.success) {
          // Use fallback summary generation
          const fallback = this.generateFallbackSummary(messages);
          summary = fallback.summary;
          keyTopics = fallback.keyTopics;
        } else {
          throw error; // Re-throw if it's not a quota/rate limit error
        }
      }

      return this.saveMemory(userId, conversationId, summary, keyTopics, messages.length);
    } catch (error) {
      console.error('Error creating conversation summary:', error);
      throw error;
    }
  }

  // Helper method to save memory to database
  private async saveMemory(
    userId: string, 
    conversationId: string, 
    summary: string, 
    keyTopics: string[], 
    messageCount: number
  ): Promise<ConversationMemory> {
    // Calculate importance based on conversation length and content
    const importance = Math.min(messageCount / 10, 1.0);

    const memory: ConversationMemory = {
      id: `${conversationId}_summary`,
      userId,
      conversationId,
      summary,
      keyTopics,
      importance,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    // Save to Firestore
    await db!.collection('conversation_memories').doc(memory.id).set(memory);
    return memory;
  }

  // Retrieve relevant memories for a given query
  async getRelevantMemories(
    userId: string,
    currentMessage: string,
    limit: number = 3
  ): Promise<ConversationMemory[]> {
    try {
      this.checkDatabase();
      // Get all user memories
      const memoriesSnapshot = await db!
        .collection('conversation_memories')
        .where('userId', '==', userId)
        .orderBy('lastAccessed', 'desc')
        .limit(20)
        .get();

      const memories = memoriesSnapshot.docs.map(doc => doc.data() as ConversationMemory);

      if (memories.length === 0) return [];

      // Simple relevance scoring based on keyword matching
      // In a production app, you'd use embeddings for semantic search
      const relevantMemories = memories
        .map(memory => ({
          ...memory,
          relevanceScore: this.calculateRelevance(currentMessage, memory),
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ relevanceScore, ...memory }) => memory);

      // Update last accessed for retrieved memories
      for (const memory of relevantMemories) {
        await db!
          .collection('conversation_memories')
          .doc(memory.id)
          .update({ lastAccessed: new Date() });
      }

      return relevantMemories;
    } catch (error) {
      console.error('Error retrieving relevant memories:', error);
      return [];
    }
  }

  // Calculate relevance score between current message and memory
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

  // Build memory context for AI response with enhanced error handling
  async buildMemoryContext(
    userId: string,
    currentMessage: string,
    recentMessages: Array<{ role: string; content: string }>
  ): Promise<MemoryContext> {
    try {
      // Get relevant memories
      const relevantMemories = await this.getRelevantMemories(userId, currentMessage);

      // Create conversation summary if we have enough messages and OpenAI is available
      let conversationSummary = '';
      if (recentMessages.length >= 5 && llm) {
        try {
          const summary = await this.createConversationSummary(
            userId,
            `temp_${Date.now()}`,
            recentMessages
          );
          conversationSummary = summary.summary;
        } catch (error: unknown) {
          const errorResult = await this.handleOpenAIError(error, 'buildMemoryContext');
          
          if (!errorResult.success) {
            console.warn('Skipping conversation summary due to OpenAI quota/rate limit issues');
            // Continue without summary - this is expected behavior when quota is exceeded
          } else {
            console.error('Error creating conversation summary in buildMemoryContext:', error);
            // Continue without summary if it fails for other reasons
          }
        }
      }

      // Build user context from relevant memories
      const userContext = relevantMemories
        .map(memory => `Previous conversation: ${memory.summary}`)
        .join('\n');

      return {
        recentMessages: recentMessages.map(msg => `${msg.role}: ${msg.content}`),
        conversationSummary,
        relevantMemories: relevantMemories.map(memory => memory.summary),
        userContext,
      };
    } catch (error) {
      console.error('Error building memory context:', error);
      return {
        recentMessages: recentMessages.map(msg => `${msg.role}: ${msg.content}`),
        conversationSummary: '',
        relevantMemories: [],
        userContext: '',
      };
    }
  }

  // Configuration method to check if summary generation should be enabled
  shouldGenerateSummary(): boolean {
    // Check if OpenAI is configured and available
    if (!llm) {
      return false;
    }
    
    // Check if summary generation is temporarily disabled due to quota errors
    if (this.summaryGenerationDisabled) {
      // Re-enable after 1 hour
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      if (Date.now() - this.lastQuotaError > oneHour) {
        this.summaryGenerationDisabled = false;
        this.quotaErrorCount = 0;
        console.log('Summary generation re-enabled after quota error timeout.');
      } else {
        return false;
      }
    }
    
    return true;
  }

  // Method to get OpenAI status for debugging
  getOpenAIStatus(): { 
    configured: boolean; 
    model?: string; 
    error?: string;
    quotaErrors?: number;
    summaryDisabled?: boolean;
    lastQuotaError?: number;
  } {
    if (!llm) {
      return { 
        configured: false, 
        error: 'OpenAI LLM not configured. Check OPENAI_API_KEY environment variable.' 
      };
    }
    
    return { 
      configured: true, 
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0125',
      quotaErrors: this.quotaErrorCount,
      summaryDisabled: this.summaryGenerationDisabled,
      lastQuotaError: this.lastQuotaError > 0 ? this.lastQuotaError : undefined
    };
  }
}

export const memoryService = MemoryService.getInstance(); 