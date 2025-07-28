import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContainer />
    </ProtectedRoute>
  );
} 