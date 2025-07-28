import { Message } from '@/types/chat';
import { formatTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2',
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-800'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-xs mt-1 opacity-70',
          isUser ? 'text-blue-100' : 'text-gray-500'
        )}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
} 