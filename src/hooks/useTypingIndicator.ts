// Typing indicator hook - Broadcast and receive typing status
// Uses Supabase Realtime broadcast to show when someone is typing

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface TypingEvent {
  user_id: string;
  is_typing: boolean;
  timestamp: number;
}

const TYPING_TIMEOUT = 2000; // Stop typing after 2 seconds

export function useTypingIndicator(conversationId: string, otherUserId: string) {
  const { user } = useAuth();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Subscribe to typing events
  useEffect(() => {
    if (!user) return;

    const typingChannel = supabase.channel(`typing:${conversationId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const event = payload.payload as TypingEvent;

        // Only care about the other user's typing status
        if (event.user_id === otherUserId) {
          setIsOtherUserTyping(event.is_typing);

          // Auto-clear typing indicator after timeout
          if (event.is_typing) {
            setTimeout(() => {
              setIsOtherUserTyping(false);
            }, TYPING_TIMEOUT + 500);
          }
        }
      })
      .subscribe((status) => {
        console.log('Typing channel status:', status);
      });

    setChannel(typingChannel);

    return () => {
      typingChannel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, otherUserId, user]);

  // Broadcast typing status with debounce
  const setTyping = useCallback((isTyping: boolean) => {
    if (!channel || !user) return;

    const now = Date.now();

    if (isTyping) {
      // Only broadcast if enough time has passed since last broadcast
      if (now - lastTypingRef.current > 500) {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            is_typing: true,
            timestamp: now,
          } as TypingEvent,
        });
        lastTypingRef.current = now;
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after timeout
      typingTimeoutRef.current = setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            is_typing: false,
            timestamp: Date.now(),
          } as TypingEvent,
        });
      }, TYPING_TIMEOUT);
    } else {
      // Immediately broadcast stop typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          is_typing: false,
          timestamp: now,
        } as TypingEvent,
      });
    }
  }, [channel, user]);

  return {
    isOtherUserTyping,
    setTyping,
  };
}
