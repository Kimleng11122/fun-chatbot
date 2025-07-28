import { NextRequest, NextResponse } from 'next/server';
import { openai, OPENAI_MODEL, countTokens, calculateCost } from '@/lib/openai';
import { generateId } from '@/lib/utils';
import { ChatRequest, ChatResponse, Message } from '@/types/chat';
import { 
  saveMessage, 
  createConversation, 
  updateConversation, 
  getConversationMessages,
  saveUsageRecord
} from '@/lib/database';
import { memoryService } from '@/lib/memory';
import { llm } from '@/lib/langchain';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, userId, conversationId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    let currentConversationId = conversationId;
    let isNewConversation = false;

    // If no conversation ID, create a new conversation
    if (!currentConversationId) {
      const newConversation = await createConversation({
        userId,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      });
      currentConversationId = newConversation.id;
      isNewConversation = true;
    }

    // Create user message
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId,
    };

    // Save user message to database
    const savedUserMessage = await saveMessage(userMessage);

    // Get conversation history for context
    const conversationMessages = await getConversationMessages(currentConversationId);
    
    // Build memory context
    const memoryContext = await memoryService.buildMemoryContext(
      userId,
      message,
      conversationMessages.map(msg => ({ role: msg.role, content: msg.content }))
    );

    // Create enhanced prompt with memory context
    const enhancedPrompt = `
You are a helpful AI assistant with access to conversation history and memory. 
Your goal is to provide helpful, accurate, and contextually relevant responses.

${memoryContext.userContext ? `Previous relevant conversations:\n${memoryContext.userContext}\n` : ''}
${memoryContext.conversationSummary ? `Current conversation summary:\n${memoryContext.conversationSummary}\n` : ''}

Recent conversation:
${memoryContext.recentMessages.slice(-6).join('\n')}

Human: ${message}
AI Assistant:`;

    // Get AI response using LangChain
    const aiResponse = await llm.invoke(enhancedPrompt);
    const aiContent = aiResponse.content as string;

    // Calculate token usage
    const promptTokens = countTokens(enhancedPrompt);
    const completionTokens = countTokens(aiContent);
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(promptTokens, completionTokens, OPENAI_MODEL);

    // Save usage record
    await saveUsageRecord({
      userId,
      conversationId: currentConversationId,
      messageId: savedUserMessage.id,
      model: OPENAI_MODEL,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      timestamp: new Date(),
    });

    // Create AI message
    const aiMessage: Omit<Message, 'id'> = {
      role: 'assistant',
      content: aiContent,
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId,
    };

    // Save AI message to database
    const savedAiMessage = await saveMessage(aiMessage);

    // Update conversation metadata
    await updateConversation(currentConversationId, {
      messageCount: conversationMessages.length + 2, // +2 for user and AI messages
      title: isNewConversation ? message.slice(0, 50) + (message.length > 50 ? '...' : '') : undefined,
    });

    // Create conversation summary if we have enough messages
    if (conversationMessages.length >= 8) {
      try {
        await memoryService.createConversationSummary(
          userId,
          currentConversationId,
          conversationMessages.map(msg => ({ role: msg.role, content: msg.content }))
        );
      } catch (error) {
        console.error('Error creating conversation summary:', error);
      }
    }

    const response: ChatResponse = {
      message: savedAiMessage,
      conversationId: currentConversationId,
      isNewConversation,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 