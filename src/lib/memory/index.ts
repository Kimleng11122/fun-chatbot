import { llm } from '../langchain';
import { db } from '../firebase';
import { ConversationMemory, MemoryContext } from '../langchain';

// Memory management service
export class MemoryService {
  private static instance: MemoryService;

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

  // Create conversation summary
  async createConversationSummary(
    userId: string,
    conversationId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<ConversationMemory> {
    try {
      if (!llm) {
        throw new Error('OpenAI API key not configured');
      }

      this.checkDatabase();

      // Create summary prompt
      const summaryPrompt = `
        Summarize the following conversation in 2-3 sentences. 
        Extract key topics and important information that would be useful for future context.
        
        Conversation:
        ${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Summary:`;

      const summaryResponse = await llm.invoke(summaryPrompt);
      const summary = summaryResponse.content as string;

      // Extract key topics
      const topicsPrompt = `
        Extract 3-5 key topics from this conversation summary:
        ${summary}
        
        Topics (comma-separated):`;

      const topicsResponse = await llm.invoke(topicsPrompt);
      const keyTopics = (topicsResponse.content as string)
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);

      // Calculate importance based on conversation length and content
      const importance = Math.min(messages.length / 10, 1.0);

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
    } catch (error) {
      console.error('Error creating conversation summary:', error);
      throw error;
    }
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

  // Build memory context for AI response
  async buildMemoryContext(
    userId: string,
    currentMessage: string,
    recentMessages: Array<{ role: string; content: string }>
  ): Promise<MemoryContext> {
    try {
      // Get relevant memories
      const relevantMemories = await this.getRelevantMemories(userId, currentMessage);

      // Create conversation summary if we have enough messages
      let conversationSummary = '';
      if (recentMessages.length >= 5) {
        const summary = await this.createConversationSummary(
          userId,
          `temp_${Date.now()}`,
          recentMessages
        );
        conversationSummary = summary.summary;
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
}

export const memoryService = MemoryService.getInstance(); 