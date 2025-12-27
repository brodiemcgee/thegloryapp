// Messages screen - conversation list with tabs

'use client';

import { useState, useEffect } from 'react';
import { mockConversations } from '@/data/mockData';
import { Conversation } from '@/types';
import { CheckIcon } from './icons';
import ChatView from './ChatView';
import { useNavigation } from '@/contexts/NavigationContext';

type TabOption = 'all' | 'verified' | 'requests';

export default function MessagesView() {
  const [activeTab, setActiveTab] = useState<TabOption>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { targetMessageUser, clearTargetMessageUser } = useNavigation();

  // All conversations including any dynamically created ones
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

  // Handle navigation to a specific user's conversation
  useEffect(() => {
    if (targetMessageUser) {
      // Check if conversation already exists
      let existingConv = conversations.find(c => c.user.id === targetMessageUser.id);

      if (!existingConv) {
        // Create a new conversation with this user
        const newConversation: Conversation = {
          id: `conv-${targetMessageUser.id}-${Date.now()}`,
          user: targetMessageUser,
          last_message: null,
          unread_count: 0,
          updated_at: new Date().toISOString(),
        };
        setConversations(prev => [newConversation, ...prev]);
        existingConv = newConversation;
      }

      // Open the conversation
      setSelectedConversation(existingConv);
      clearTargetMessageUser();
    }
  }, [targetMessageUser, conversations, clearTargetMessageUser]);

  const tabs: { id: TabOption; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Verified' },
    { id: 'requests', label: 'Requests' },
  ];

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'verified') return conv.user.is_verified;
    if (activeTab === 'requests') return conv.unread_count > 0;
    return true;
  });

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (selectedConversation) {
    return (
      <ChatView
        conversation={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="p-4 border-b border-hole-border">
        <h1 className="text-lg font-semibold mb-4">Messages</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-hole-surface rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-hole-border text-white'
                  : 'text-hole-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hole-muted">No messages yet</p>
          </div>
        ) : (
          <div className="divide-y divide-hole-border">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="flex items-center gap-3 p-4 w-full text-left transition-colors hover:bg-hole-surface"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-hole-surface rounded-full flex items-center justify-center">
                    {conv.user.avatar_url ? (
                      <img
                        src={conv.user.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl text-hole-muted">?</span>
                    )}
                  </div>
                  {conv.user.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-hole-bg" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">{conv.user.username}</span>
                      {conv.user.is_verified && (
                        <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-hole-muted flex-shrink-0">
                      {conv.last_message && formatTime(conv.last_message.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-hole-muted truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-hole-accent rounded-full text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
