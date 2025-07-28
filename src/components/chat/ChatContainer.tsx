'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatArea } from './ChatArea';

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<{
    memories: string[];
    summary: string;
    memoryCount: number;
    hasSummary: boolean;
  }>({ memories: [], summary: '', memoryCount: 0, hasSummary: false });

  const handleConversationSelect = (
    convId: string, 
    convMessages: Message[], 
    convMemoryInfo: {
      memories: string[];
      summary: string;
      memoryCount: number;
      hasSummary: boolean;
    }
  ) => {
    setConversationId(convId);
    setMessages(convMessages);
    setMemoryInfo(convMemoryInfo);
  };

  const handleLoadingStateChange = (isLoading: boolean) => {
    setIsLoadingConversation(isLoading);
  };

  const handleMessagesUpdate = (
    convId: string, 
    updatedMessages: Message[], 
    updatedMemoryInfo: {
      memories: string[];
      summary: string;
      memoryCount: number;
      hasSummary: boolean;
    }
  ) => {
    setConversationId(convId);
    setMessages(updatedMessages);
    setMemoryInfo(updatedMemoryInfo);
  };

      return (
      <div className="flex h-screen bg-gray-50">
        <ConversationSidebar
          onConversationSelect={handleConversationSelect}
          onLoadingStateChange={handleLoadingStateChange}
          selectedConversationId={conversationId}
        />
        <ChatArea
          conversationId={conversationId}
          messages={messages}
          memoryInfo={memoryInfo}
          isLoadingConversation={isLoadingConversation}
          onMessagesUpdate={handleMessagesUpdate}
        />
      </div>
    );
} 