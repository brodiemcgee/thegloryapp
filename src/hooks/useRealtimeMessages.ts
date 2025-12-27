// Realtime messages hook - Live chat with message subscriptions
// Subscribes to Supabase Postgres changes for real-time message delivery

'use client';

import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Message, AlbumShareMessage } from '@/types';
import { useAuth } from './useAuth';

interface UseRealtimeMessagesOptions {
  conversationId: string;
  otherUserId: string;
}

export function useRealtimeMessages({ conversationId, otherUserId }: UseRealtimeMessagesOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Load initial messages from database
  useEffect(() => {
    if (!user || conversationId === 'skip') return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user || conversationId === 'skip') return;

    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as Message;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    setChannel(messagesChannel);

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [conversationId, user]);

  // Send message function
  const sendMessage = useCallback(async (content: string, imageUrl?: string, albumShare?: AlbumShareMessage) => {
    if (!user || !content.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: content.trim(),
      image_url: imageUrl,
      album_share: albumShare,
      created_at: new Date().toISOString(),
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, newMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          image_url: imageUrl || null,
          album_share: albumShare || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one from database
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...data, receiver_id: otherUserId } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  }, [user, conversationId, otherUserId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    // Filter out temp message IDs
    const realMessageIds = messageIds.filter(id => !id.startsWith('temp-'));
    if (realMessageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', realMessageIds)
        .is('read_at', null);

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          realMessageIds.includes(msg.id)
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    isConnected: channel?.state === 'joined',
  };
}
