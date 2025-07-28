import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function deserializeMessage(message: Record<string, unknown>): Record<string, unknown> {
  if (message && typeof message === 'object') {
    // Convert timestamp string back to Date object
    if (message.timestamp) {
      if (typeof message.timestamp === 'string') {
        message.timestamp = new Date(message.timestamp);
      } else if (typeof message.timestamp === 'object' && message.timestamp !== null && 'toDate' in message.timestamp) {
        // Firestore Timestamp object
        message.timestamp = (message.timestamp as { toDate: () => Date }).toDate();
      }
    }
  }
  return message;
}

export function formatTimestamp(date: Date): string {
  // Ensure we have a valid Date object
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatTimestamp:', date);
    return 'Invalid time';
  }
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
  
  if (isToday) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else if (isYesterday) {
    return `Yesterday, ${new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)}`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
} 