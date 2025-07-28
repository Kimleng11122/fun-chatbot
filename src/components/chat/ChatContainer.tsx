'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Conversation } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { MemoryIndicator, MemoryDetails } from './MemoryIndicator';
import { UsageIndicator } from './UsageIndicator';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TypingIndicator, EmptyState, ConversationSkeleton } from '@/components/ui/LoadingStates';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<{
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  }>({ memories: [], summary: '', memoryCount: 0, hasSummary: false });
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

  // Load conversation history on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/conversations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setConversationId(convId);
        // Load memory info for this conversation
        await loadMemoryInfo(convId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setMemoryInfo({ memories: [], summary: '', memoryCount: 0, hasSummary: false });
    setShowMemoryDetails(false);
  };

  const loadMemoryInfo = async (convId: string, currentMessage: string = '') => {
    try {
      const response = await fetch(
        `/api/memory?userId=${userId}&conversationId=${convId}&currentMessage=${encodeURIComponent(currentMessage)}`
      );
      if (response.ok) {
        const data = await response.json();
        setMemoryInfo(data);
      }
    } catch (error) {
      console.error('Error loading memory info:', error);
    }
  };

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
    setMessages(prev => [...prev, userMessage]);
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
      setMessages(prev => [...prev, data.message]);
      
      // Update conversation ID if it's a new conversation
      if (data.isNewConversation) {
        setConversationId(data.conversationId);
        // Reload conversations to show the new one
        await loadConversations();
      }
      
      // Load updated memory info
      if (data.conversationId) {
        await loadMemoryInfo(data.conversationId, content);
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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversation History */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
          <button
            onClick={startNewConversation}
            className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingHistory ? (
            <ConversationSkeleton count={5} />
          ) : conversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Start your first conversation to see it here"
            />
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => loadConversationMessages(conversation.id)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-gray-50 transition-colors',
                    conversationId === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  )}
                >
                  <div className="font-medium text-sm text-gray-800 truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conversation.messageCount} messages
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
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
          {messages.length === 0 ? (
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
    </div>
  );
} 