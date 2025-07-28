import { NextRequest, NextResponse } from 'next/server';
import { openai, OPENAI_MODEL } from '@/lib/openai';
import { generateId } from '@/lib/utils';
import { ChatRequest, ChatResponse, Message, Conversation } from '@/types/chat';
import { 
  saveMessage, 
  createConversation, 
  updateConversation, 
  getConversationMessages
} from '@/lib/database';

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

    // For now, we'll use the userId directly
    // In a production app, you'd verify the user exists in your database

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
    
    // Prepare messages for OpenAI (include conversation history)
    const openaiMessages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Be concise and friendly in your responses.',
      },
      ...conversationMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Create AI message
    const aiMessage: Omit<Message, 'id'> = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      conversationId: currentConversationId,
      userId,
    };

    // Save AI message to database
    const savedAiMessage = await saveMessage(aiMessage);

    // Update conversation metadata
    const updateData: Partial<Conversation> = {
      messageCount: conversationMessages.length + 2, // +2 for user and AI messages
    };
    
    // Only update title for new conversations
    if (isNewConversation) {
      updateData.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }
    
    await updateConversation(currentConversationId, updateData);

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