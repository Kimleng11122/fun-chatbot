import { generateId } from './utils';

const USER_ID_KEY = 'chatbot_user_id';
const USER_NAME_KEY = 'chatbot_user_name';

export function getUserId(): string {
  if (typeof window === 'undefined') return 'server-user';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = 'user-' + generateId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return 'Server User';
  
  let userName = localStorage.getItem(USER_NAME_KEY);
  if (!userName) {
    userName = `User ${getUserId().slice(-6)}`;
    localStorage.setItem(USER_NAME_KEY, userName);
  }
  return userName;
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name);
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
} 