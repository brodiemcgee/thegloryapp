// Conversations context for persisting chat state across navigation

'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Conversation, Message, User } from '@/types';
import { mockConversations } from '@/data/mockData';

// localStorage keys
const STORAGE_KEYS = {
  CONVERSATIONS: 'thehole_conversations',
  LOCAL_MESSAGES: 'thehole_local_messages',
};

// Helper to safely parse JSON from localStorage
const getFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

// Helper to save to localStorage
const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

interface ConversationsContextType {
  conversations: Conversation[];
  selectedConversationId: string | null;
  localMessages: Record<string, Message[]>;
  getSelectedConversation: () => Conversation | null;
  selectConversation: (conversation: Conversation | null) => void;
  getOrCreateConversation: (user: User) => Conversation;
  addLocalMessage: (conversationId: string, message: Message) => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  // Initialize state from localStorage, merging with mock data
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = getFromStorage<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    // Merge stored conversations with mock data, avoiding duplicates
    const storedIds = new Set(stored.map(c => c.id));
    const mockNotStored = mockConversations.filter(c => !storedIds.has(c.id));
    return [...stored, ...mockNotStored];
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>(() =>
    getFromStorage<Record<string, Message[]>>(STORAGE_KEYS.LOCAL_MESSAGES, {})
  );

  // Save conversations to localStorage when they change
  useEffect(() => {
    // Only save non-mock conversations (ones we created)
    const nonMockConversations = conversations.filter(c => c.id.startsWith('conv-'));
    saveToStorage(STORAGE_KEYS.CONVERSATIONS, nonMockConversations);
  }, [conversations]);

  // Save local messages to localStorage when they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LOCAL_MESSAGES, localMessages);
  }, [localMessages]);

  // Use ref to avoid stale closure issues in getOrCreateConversation
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const getSelectedConversation = useCallback((): Conversation | null => {
    if (!selectedConversationId) return null;
    return conversationsRef.current.find(c => c.id === selectedConversationId) || null;
  }, [selectedConversationId]);

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setSelectedConversationId(conversation?.id || null);
  }, []);

  const getOrCreateConversation = useCallback((user: User): Conversation => {
    // Check if conversation already exists using ref for current value
    const existing = conversationsRef.current.find(c => c.user.id === user.id);
    if (existing) {
      return existing;
    }

    // Create a new conversation
    const newConversation: Conversation = {
      id: `conv-${user.id}-${Date.now()}`,
      user,
      last_message: null,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };

    // Add to state
    setConversations(prev => {
      // Double-check it doesn't exist (race condition protection)
      if (prev.find(c => c.user.id === user.id)) {
        return prev;
      }
      return [newConversation, ...prev];
    });

    // Also update ref immediately for synchronous access
    conversationsRef.current = [newConversation, ...conversationsRef.current];

    return newConversation;
  }, []);

  const addLocalMessage = useCallback((conversationId: string, message: Message) => {
    setLocalMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));

    // Update the conversation's last_message
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          last_message: message,
          updated_at: message.created_at,
        };
      }
      return conv;
    }));
  }, []);

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        selectedConversationId,
        localMessages,
        getSelectedConversation,
        selectConversation,
        getOrCreateConversation,
        addLocalMessage,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
}
