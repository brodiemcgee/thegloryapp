// Hook for managing conversations with database persistence

'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface ConversationResult {
  id: string;
  isNew: boolean;
}

export function useConversation() {
  const { user } = useAuth();

  // Get or create a conversation with another user
  const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<ConversationResult | null> => {
    if (!user) return null;

    try {
      // First, check if conversation already exists
      // A conversation exists if current user is participant_1 or participant_2
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .single();

      if (existing && !searchError) {
        return { id: existing.id, isNew: false };
      }

      // If not found (PGRST116 = no rows), create new conversation
      if (searchError && searchError.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error searching for conversation:', searchError);
        }
        return null;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
        })
        .select('id')
        .single();

      if (createError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating conversation:', createError);
        }
        return null;
      }

      return { id: newConv.id, isNew: true };
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in getOrCreateConversation:', err);
      }
      return null;
    }
  }, [user]);

  // Load all conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1,
          participant_2,
          created_at,
          updated_at
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading conversations:', error);
        }
        return [];
      }

      return data || [];
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in loadConversations:', err);
      }
      return [];
    }
  }, [user]);

  return {
    getOrCreateConversation,
    loadConversations,
  };
}
