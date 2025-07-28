'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { MemoryIndicator, MemoryDetails } from './MemoryIndicator';
import { UsageIndicator } from '@/components/chat/UsageIndicator';
import { generateId } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TypingIndicator, EmptyState } from '@/components/ui/LoadingStates';

// Extend Window interface for the cache update function
declare global {
  interface Window {
    updateConversationCache?: (conversationId: string, messages: Message[], memoryInfo: {
      memories: string[];
      summary: string;
      memoryCount: number;
      hasSummary: boolean;
    }) => void;
  }
}

interface ChatAreaProps {
  conversationId: string | null;
  messages: Message[];
  memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  };
  isLoadingConversation: boolean;
  onMessagesUpdate: (conversationId: string, messages: Message[], memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  }) => void;
}

export function ChatArea({ 
  conversationId, 
  messages, 
  memoryInfo, 
  isLoadingConversation,
  onMessagesUpdate 
}: ChatAreaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get authenticated user
  const { user, logout } = useAuth();
  const userId = user?.uid || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      conversationId: conversationId || 'temp',
      userId,
    };

    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          userId,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add AI response to chat
      const finalMessages = [...updatedMessages, data.message];
      
      // Update parent with new messages
      if (data.conversationId) {
        // Update cache in sidebar
        if (typeof window !== 'undefined' && window.updateConversationCache) {
          window.updateConversationCache(data.conversationId, finalMessages, memoryInfo);
        }
        
        // Update parent state
        onMessagesUpdate(data.conversationId, finalMessages, memoryInfo);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        conversationId: conversationId || 'temp',
        userId,
      };
      const finalMessages = [...updatedMessages, errorMessage];
      onMessagesUpdate(conversationId || '', finalMessages, memoryInfo);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">AI Chat Assistant</h1>
          <p className="text-sm text-gray-600">
            {conversationId ? 'Continuing conversation...' : 'Start a new conversation!'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <UsageIndicator />
          <span className="text-sm text-gray-600">
            Welcome, {user?.displayName || user?.email || 'User'}
          </span>
          <a
            href="/usage"
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            Usage
          </a>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingConversation ? (
          <div className="space-y-4">
            {/* Loading skeleton for conversation */}
            <div className="animate-pulse">
              {/* Memory indicator skeleton */}
              <div className="bg-gray-200 rounded-lg p-3 mb-4">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              
              {/* Message skeletons */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${i % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200'}`}>
                    <div className="space-y-2">
                      <div className={`h-4 bg-gray-300 rounded ${i % 2 === 0 ? 'w-32' : 'w-48'}`}></div>
                      <div className={`h-4 bg-gray-300 rounded ${i % 2 === 0 ? 'w-24' : 'w-36'}`}></div>
                      <div className={`h-3 bg-gray-300 rounded w-16`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            title="Welcome to the chat!"
            description="Start a conversation by typing a message below"
          />
        ) : (
          <div className="space-y-4">
            {/* Memory Indicator */}
            <MemoryIndicator
              memoryCount={memoryInfo.memoryCount}
              hasSummary={memoryInfo.hasSummary}
              onToggleDetails={() => setShowMemoryDetails(!showMemoryDetails)}
              showDetails={showMemoryDetails}
            />
            
            {/* Memory Details */}
            {showMemoryDetails && (
              <MemoryDetails
                memories={memoryInfo.memories}
                summary={memoryInfo.summary}
                onClose={() => setShowMemoryDetails(false)}
              />
            )}
            
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
} 