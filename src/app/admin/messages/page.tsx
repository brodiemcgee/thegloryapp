'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Clock,
  RefreshCw,
  ChevronRight,
  Ban,
  Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAuditLog } from '@/hooks/admin/useAuditLog';
import { cn, formatRelativeTime, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FlaggedConversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  flag_reason: string;
  flag_count: number;
  user1: {
    id: string;
    username: string;
    avatar_url: string | null;
    account_status: string;
  };
  user2: {
    id: string;
    username: string;
    avatar_url: string | null;
    account_status: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  is_flagged?: boolean;
}

export default function MessagesPage() {
  const { adminRoleId } = useAdminAuth();
  const { logAction, logModeration } = useAuditLog();
  const [conversations, setConversations] = useState<FlaggedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<FlaggedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);

      // In production, this would query flagged conversations
      // For now, we'll load recent conversations
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_participant_1_fkey(id, username, avatar_url, account_status),
          user2:profiles!conversations_participant_2_fkey(id, username, avatar_url, account_status)
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Simulate flagging data (in production, this would come from a flagging system)
      const flaggedConversations = (data || []).map((conv) => ({
        ...conv,
        flag_reason: 'Reported by user',
        flag_count: Math.floor(Math.random() * 3) + 1,
      }));

      setConversations(flaggedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  async function loadMessages(conversationId: string) {
    try {
      setIsLoadingMessages(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function markSafe(conversationId: string) {
    await logAction({
      action: 'approve',
      resourceType: 'message',
      resourceId: conversationId,
      details: { action: 'marked_safe' },
    });
    toast.success('Conversation marked as safe');
    setSelectedConversation(null);
    loadConversations();
  }

  async function removeMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      await logAction({
        action: 'delete',
        resourceType: 'message',
        resourceId: messageId,
      });

      toast.success('Message removed');
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error removing message:', error);
      toast.error('Failed to remove message');
    }
  }

  async function suspendUser(userId: string, username: string) {
    try {
      const { error } = await supabase.rpc('suspend_user', {
        p_user_id: userId,
        p_reason: 'Flagged message content',
        p_duration_days: 7,
      });

      if (error) throw error;

      await logModeration('suspend', userId, { username, reason: 'Flagged message content' });
      toast.success(`User @${username} suspended for 7 days`);
      loadConversations();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Moderation</h1>
          <p className="text-gray-600 mt-1">
            Review flagged conversations
          </p>
        </div>
        <button
          onClick={loadConversations}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Flagged Conversations</h2>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No flagged conversations</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      loadMessages(conv.id);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      selectedConversation?.id === conv.id && 'bg-purple-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {conv.user1?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {conv.user2?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            @{conv.user1?.username || 'unknown'} & @{conv.user2?.username || 'unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(conv.updated_at)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    {conv.flag_count > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Flag className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600">
                          {conv.flag_count} flag{conv.flag_count > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Conversation between @{selectedConversation.user1?.username} and @{selectedConversation.user2?.username}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Started {formatRelativeTime(selectedConversation.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markSafe(selectedConversation.id)}
                        className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Mark Safe
                      </button>
                    </div>
                  </div>

                  {/* Participant Info */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {[selectedConversation.user1, selectedConversation.user2].map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">@{user?.username || 'unknown'}</p>
                            <p className={cn(
                              'text-xs',
                              user?.account_status === 'active' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {user?.account_status || 'unknown'}
                            </p>
                          </div>
                        </div>
                        {user && user.account_status === 'active' && (
                          <button
                            onClick={() => suspendUser(user.id, user.username)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                            title="Suspend user"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No messages in this conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isUser1 = message.sender_id === selectedConversation.participant_1;
                      const sender = isUser1 ? selectedConversation.user1 : selectedConversation.user2;

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'flex gap-3',
                            message.is_flagged && 'bg-red-50 -mx-6 px-6 py-2 rounded'
                          )}
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-500">
                              {sender?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                @{sender?.username || 'unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(message.created_at)}
                              </span>
                              {message.is_flagged && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Flagged
                                </span>
                              )}
                            </div>
                            {message.content && (
                              <p className="text-gray-700 break-words">{message.content}</p>
                            )}
                            {message.image_url && (
                              <div className="mt-2">
                                <img
                                  src={message.image_url}
                                  alt="Message attachment"
                                  className="max-w-xs rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeMessage(message.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                            title="Remove message"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full py-16">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                  <p className="text-gray-600 mt-1">
                    Choose a flagged conversation to review
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
