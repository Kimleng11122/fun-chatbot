import { db } from './firebase';
import { Message, Conversation, User } from '@/types/chat';

// Users collection
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const userRef = db.collection('users').doc();
  const newUser: User = {
    ...user,
    id: userRef.id,
  };
  
  await userRef.set(newUser);
  return newUser;
}

export async function getUser(userId: string): Promise<User | null> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;
  
  const data = userDoc.data();
  if (!data) return null;
  
  return {
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    lastActive: data.lastActive?.toDate ? data.lastActive.toDate() : data.lastActive,
  } as User;
}

// Conversations collection
export async function createConversation(conversation: Omit<Conversation, 'id'>): Promise<Conversation> {
  const conversationRef = db.collection('conversations').doc();
  const newConversation: Conversation = {
    ...conversation,
    id: conversationRef.id,
  };
  
  await conversationRef.set(newConversation);
  return newConversation;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const conversationDoc = await db.collection('conversations').doc(conversationId).get();
  return conversationDoc.exists ? (conversationDoc.data() as Conversation) : null;
}

export async function updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
  // Filter out undefined values to avoid Firestore errors
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  await db.collection('conversations').doc(conversationId).update({
    ...filteredUpdates,
    updatedAt: new Date(),
  });
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const snapshot = await db
    .collection('conversations')
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as Conversation;
  });
}

// Messages collection
export async function saveMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const messageRef = db.collection('messages').doc();
  const newMessage: Message = {
    ...message,
    id: messageRef.id,
  };
  
  await messageRef.set(newMessage);
  return newMessage;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const snapshot = await db
    .collection('messages')
    .where('conversationId', '==', conversationId)
    .orderBy('timestamp', 'asc')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
    } as Message;
  });
}

export async function saveConversationWithMessages(
  conversation: Omit<Conversation, 'id'>,
  messages: Omit<Message, 'id' | 'conversationId'>[]
): Promise<{ conversation: Conversation; messages: Message[] }> {
  const batch = db.batch();
  
  // Create conversation
  const conversationRef = db.collection('conversations').doc();
  const newConversation: Conversation = {
    ...conversation,
    id: conversationRef.id,
  };
  batch.set(conversationRef, newConversation);
  
  // Create messages
  const messagesToSave: Message[] = [];
  messages.forEach((message, index) => {
    const messageRef = db.collection('messages').doc();
    const newMessage: Message = {
      ...message,
      id: messageRef.id,
      conversationId: newConversation.id,
    };
    batch.set(messageRef, newMessage);
    messagesToSave.push(newMessage);
  });
  
  await batch.commit();
  return { conversation: newConversation, messages: messagesToSave };
} 