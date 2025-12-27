// Conversations context for persisting chat state across navigation

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Conversation, Message, User } from '@/types';
import { mockConversations } from '@/data/mockData';

interface ConversationsContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  localMessages: Record<string, Message[]>; // conversationId -> messages
  selectConversation: (conversation: Conversation | null) => void;
  getOrCreateConversation: (user: User) => Conversation;
  addLocalMessage: (conversationId: string, message: Message) => void;
  getLocalMessages: (conversationId: string) => Message[];
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setSelectedConversation(conversation);
  }, []);

  const getOrCreateConversation = useCallback((user: User): Conversation => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.user.id === user.id);
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

    setConversations(prev => [newConversation, ...prev]);
    return newConversation;
  }, [conversations]);

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

  const getLocalMessages = useCallback((conversationId: string): Message[] => {
    return localMessages[conversationId] || [];
  }, [localMessages]);

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        selectedConversation,
        localMessages,
        selectConversation,
        getOrCreateConversation,
        addLocalMessage,
        getLocalMessages,
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
