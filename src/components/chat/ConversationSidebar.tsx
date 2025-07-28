'use client';

import { useState, useEffect } from 'react';
import { Message, Conversation } from '@/types/chat';
import { cn, deserializeMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { TypingIndicator, EmptyState, ConversationSkeleton } from '@/components/ui/LoadingStates';

interface ConversationSidebarProps {
  onConversationSelect: (conversationId: string, messages: Message[], memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  }) => void;
  onLoadingStateChange: (isLoading: boolean) => void;
  selectedConversationId: string | null;
}

interface CachedConversation {
  messages: Message[];
  memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  };
  lastFetched: number;
}

export function ConversationSidebar({ onConversationSelect, onLoadingStateChange, selectedConversationId }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [conversationCache, setConversationCache] = useState<Record<string, CachedConversation>>({});

  
  // Get authenticated user
  const { user } = useAuth();
  const userId = user?.uid || '';

  // Load conversation list on component mount
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

  const loadConversationData = async (conversationId: string) => {
    try {
      onLoadingStateChange(true);
      
      // Load messages and memory info in parallel
      const [messagesResponse, memoryResponse] = await Promise.all([
        fetch(`/api/conversations/${conversationId}/messages`),
        fetch(`/api/memory?userId=${userId}&conversationId=${conversationId}`)
      ]);

      if (!messagesResponse.ok || !memoryResponse.ok) {
        throw new Error('Failed to load conversation data');
      }

      const [messagesData, memoryData] = await Promise.all([
        messagesResponse.json(),
        memoryResponse.json()
      ]);

      // Deserialize messages to ensure proper timestamp conversion
      const messages: Message[] = messagesData.messages.map((msg: Record<string, unknown>) => 
        deserializeMessage(msg) as unknown as Message
      );
      const memoryInfo = {
        memories: memoryData.memories,
        summary: memoryData.summary,
        memoryCount: memoryData.memoryCount,
        hasSummary: memoryData.hasSummary,
      };

      // Cache the conversation data
      setConversationCache(prev => ({
        ...prev,
        [conversationId]: {
          messages,
          memoryInfo,
          lastFetched: Date.now(),
        }
      }));

      // Emit to parent
      onConversationSelect(conversationId, messages, memoryInfo);
    } catch (error) {
      console.error('Error loading conversation data:', error);
    } finally {
      onLoadingStateChange(false);
    }
  };

  const handleConversationClick = async (conversationId: string) => {
    // Check if we have cached data
    const cached = conversationCache[conversationId];
    
    if (cached) {
      // Use cached data immediately
      onConversationSelect(conversationId, cached.messages, cached.memoryInfo);
      
      // Optionally refresh in background if data is stale (older than 5 minutes)
      const isStale = Date.now() - cached.lastFetched > 5 * 60 * 1000;
      if (isStale) {
        // Show brief loading state for stale data refresh
        onLoadingStateChange(true);
        setTimeout(() => {
          loadConversationData(conversationId);
        }, 100);
      }
    } else {
      // Load fresh data
      await loadConversationData(conversationId);
    }
  };

  const startNewConversation = () => {
    onConversationSelect('', [], {
      memories: [],
      summary: '',
      memoryCount: 0,
      hasSummary: false,
    });
  };

  const updateConversationCache = (conversationId: string, messages: Message[], memoryInfo: {
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  }) => {
    setConversationCache(prev => ({
      ...prev,
      [conversationId]: {
        messages,
        memoryInfo,
        lastFetched: Date.now(),
      }
    }));
  };

  // Expose method to parent for updating cache when new messages are sent
  useEffect(() => {
    window.updateConversationCache = updateConversationCache;
  }, []);

  return (
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
              {conversations.map((conversation) => {
                const isCached = !!conversationCache[conversation.id];
                const isStale = isCached && (Date.now() - conversationCache[conversation.id].lastFetched > 5 * 60 * 1000);
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    className={cn(
                      'w-full text-left p-3 hover:bg-gray-50 transition-colors',
                      selectedConversationId === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    )}
                  >
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>{conversation.messageCount} messages</span>
                      {isCached && (
                        <span className={cn(
                          'text-xs px-1 rounded',
                          isStale ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        )}>
                          {isStale ? 'Stale' : 'Cached'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
        )}
      </div>
      
      {/* Cache Status */}
      <div className="text-xs text-gray-500 p-2 border-t">
        <div className="flex items-center justify-between">
          <span>Cache: {Object.keys(conversationCache).length} conversations</span>
          <button
            onClick={() => setConversationCache({})}
            className="text-red-600 hover:text-red-800"
            title="Clear cache"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
} 