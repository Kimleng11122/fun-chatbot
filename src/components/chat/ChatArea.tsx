'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { EnhancedChatInput } from './EnhancedChatInput';
import { MemoryIndicator, MemoryDetails } from './MemoryIndicator';
import { UsageIndicator } from '@/components/chat/UsageIndicator';
import { generateId, deserializeMessage } from '@/lib/utils';
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
  console.log('ChatArea rendered with props:', {
    conversationId,
    messagesCount: messages.length,
    isLoadingConversation,
    timestamp: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get authenticated user
  const { user, logout, loading: authLoading } = useAuth();

  // Debug authentication state
  console.log('Auth state:', { 
    user: !!user, 
    uid: user?.uid, 
    email: user?.email,
    loading: authLoading,
    timestamp: new Date().toISOString()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to clean up message content by removing JSON analysis text
  const cleanMessageContent = (content: string): string => {
    // Remove JSON analysis patterns that might be embedded in the content
    const jsonPatterns = [
      /\[Image Analysis:.*?\]/gs,
      /\[Image Processing Error:.*?\]/gs,
      /"json\s*\{.*?\}/gs,
      /\{.*?"detailed_description".*?\}/gs,
      /\[Image Analysis: ""json\s*\{.*?\}\]/gs,
      /"detailed_description":\s*"[^"]*"/gs,
      /"text_content_visible":\s*"[^"]*"/gs,
      /"main_objects_and_elements":\s*\[[^\]]*\]/gs,
      /"color_scheme":\s*\[[^\]]*\]/gs
    ];
    
    let cleanedContent = content;
    jsonPatterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '');
    });
    
    // Clean up extra whitespace and newlines
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    // Remove any remaining JSON-like structures
    cleanedContent = cleanedContent.replace(/\{[^}]*"detailed_description"[^}]*\}/g, '');
    cleanedContent = cleanedContent.replace(/\[[^\]]*"detailed_description"[^\]]*\]/g, '');
    
    return cleanedContent;
  };

  // Clean messages when they are loaded
  const cleanedMessages = messages.map(message => {
    const originalContent = message.content;
    const cleanedContent = cleanMessageContent(message.content);
    
    // Debug logging for content cleaning
    if (originalContent !== cleanedContent) {
      console.log('Cleaned message content:', {
        messageId: message.id,
        originalLength: originalContent.length,
        cleanedLength: cleanedContent.length,
        originalPreview: originalContent.substring(0, 200) + '...',
        cleanedPreview: cleanedContent.substring(0, 200) + '...'
      });
    }
    
    return {
      ...message,
      content: cleanedContent
    };
  });

  useEffect(() => {
    scrollToBottom();
  }, [cleanedMessages]);

  const sendMessage = async (content: string, images?: File[]) => {
    console.log('sendMessage called with:', { content, images: images?.length, user: !!user, uid: user?.uid, authLoading });
    
    // Allow sending if there's content OR images
    if (!content.trim() && (!images || images.length === 0)) return;

    // Check if authentication is still loading
    if (authLoading) {
      console.error('Authentication still loading');
      throw new Error('Please wait for authentication to complete.');
    }

    // Check if user is authenticated
    if (!user || !user.uid) {
      console.error('User not authenticated', { user: !!user, uid: user?.uid });
      throw new Error('User not authenticated. Please log in.');
    }

    console.log('User authenticated:', { uid: user.uid, email: user.email });

    // Create user message with image attachments if present
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      conversationId: conversationId || 'temp',
      userId: user.uid,
      messageType: images && images.length > 0 ? 'image-upload' : 'text',
    };

    // If images are present, create image attachments for immediate display
    if (images && images.length > 0) {
      const imageAttachments = images.map((image) => ({
        id: generateId(),
        url: URL.createObjectURL(image),
        filename: image.name,
        size: image.size,
        mimeType: image.type,
        width: 0, // Will be updated when image loads
        height: 0, // Will be updated when image loads
        uploadTimestamp: new Date(),
      }));
      userMessage.images = imageAttachments;
    }

    // Immediately add user message to chat for instant feedback
    const updatedMessages = [...messages, userMessage];
    onMessagesUpdate(conversationId || '', updatedMessages, memoryInfo);
    
    setIsLoading(true);

    try {
      let response;
      
      if (images && images.length > 0) {
        // Handle image upload with FormData
        const formData = new FormData();
        formData.append('message', content);
        formData.append('userId', user.uid);
        if (conversationId) {
          formData.append('conversationId', conversationId);
        }
        
        // Add images to FormData
        images.forEach((image) => {
          formData.append('images', image);
        });
        
        response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle text-only message
        const requestBody = {
          message: content,
          userId: user.uid,
          conversationId,
        };
        console.log('Sending JSON request:', requestBody);
        
        const jsonBody = JSON.stringify(requestBody);
        console.log('JSON stringified body:', jsonBody);
        console.log('Request URL:', '/api/chat');
        console.log('Request method:', 'POST');
        console.log('Request headers:', { 'Content-Type': 'application/json' });
        
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonBody,
        });
        
        console.log('Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      if (!response.ok) {
        let errorText = '';
        let errorJson = null;
        
        try {
          // Try to get the response as JSON first
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          // If JSON parsing fails, try as text
          try {
            errorText = await response.text();
          } catch {
            errorText = 'Unable to read error response';
          }
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          json: errorJson,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        const errorMessage = errorJson?.error || errorText || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to send message: ${errorMessage}`);
      }

      const data = await response.json();
      
      // Deserialize the AI message to ensure proper timestamp conversion
      const deserializedMessage = deserializeMessage(data.message) as unknown as Message;
      
      // Add AI response to chat (user message is already displayed)
      const finalMessages = [...updatedMessages, deserializedMessage];
      
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
      
      // Create more informative error message
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        errorContent = `Error: ${error.message}`;
      } else if (typeof error === 'string') {
        errorContent = `Error: ${error}`;
      }
      
      // Add error message (user message is already displayed)
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        conversationId: conversationId || 'temp',
        userId: user?.uid || '',
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
        ) : cleanedMessages.length === 0 ? (
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
            
            {cleanedMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <EnhancedChatInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
} 