import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/lib/memory';
import { getConversationMessages } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    const currentMessage = searchParams.get('currentMessage') || '';

    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'userId and conversationId are required' },
        { status: 400 }
      );
    }

    // Get conversation messages
    const messages = await getConversationMessages(conversationId);
    
    // Build memory context
    const memoryContext = await memoryService.buildMemoryContext(
      userId,
      currentMessage,
      messages.map(msg => ({ role: msg.role, content: msg.content }))
    );

    return NextResponse.json({
      memories: memoryContext.relevantMemories,
      summary: memoryContext.conversationSummary,
      memoryCount: memoryContext.relevantMemories.length,
      hasSummary: !!memoryContext.conversationSummary,
    });
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memory information' },
      { status: 500 }
    );
  }
} 