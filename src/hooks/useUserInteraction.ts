// Hook for managing user interactions (favorites, notes, met, ratings)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UserInteraction {
  id: string;
  user_id: string;
  target_user_id: string;
  is_favorite: boolean;
  notes: string | null;
  has_met: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export function useUserInteraction(targetUserId: string) {
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<UserInteraction | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing interaction
  useEffect(() => {
    if (!user || !targetUserId) {
      setLoading(false);
      return;
    }

    const fetchInteraction = async () => {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching interaction:', error);
      }

      setInteraction(data);
      setLoading(false);
    };

    fetchInteraction();
  }, [user, targetUserId]);

  // Upsert interaction helper
  const upsertInteraction = useCallback(async (updates: Partial<UserInteraction>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_interactions')
      .upsert({
        user_id: user.id,
        target_user_id: targetUserId,
        ...interaction,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,target_user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting interaction:', error);
      return null;
    }

    setInteraction(data);
    return data;
  }, [user, targetUserId, interaction]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    const newValue = !interaction?.is_favorite;

    // Optimistic update
    setInteraction(prev => prev ? { ...prev, is_favorite: newValue } : {
      id: '',
      user_id: user?.id || '',
      target_user_id: targetUserId,
      is_favorite: newValue,
      notes: null,
      has_met: false,
      rating: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await upsertInteraction({ is_favorite: newValue });
  }, [interaction, upsertInteraction, user, targetUserId]);

  // Update notes
  const updateNotes = useCallback(async (notes: string) => {
    setInteraction(prev => prev ? { ...prev, notes } : null);
    await upsertInteraction({ notes });
  }, [upsertInteraction]);

  // Toggle met status
  const toggleMet = useCallback(async () => {
    const newValue = !interaction?.has_met;

    setInteraction(prev => prev ? { ...prev, has_met: newValue } : {
      id: '',
      user_id: user?.id || '',
      target_user_id: targetUserId,
      is_favorite: false,
      notes: null,
      has_met: newValue,
      rating: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await upsertInteraction({ has_met: newValue });
  }, [interaction, upsertInteraction, user, targetUserId]);

  // Set rating
  const setRating = useCallback(async (rating: number | null) => {
    setInteraction(prev => prev ? { ...prev, rating } : {
      id: '',
      user_id: user?.id || '',
      target_user_id: targetUserId,
      is_favorite: false,
      notes: null,
      has_met: false,
      rating,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await upsertInteraction({ rating });
  }, [upsertInteraction, user, targetUserId]);

  return {
    interaction,
    loading,
    isFavorite: interaction?.is_favorite || false,
    notes: interaction?.notes || '',
    hasMet: interaction?.has_met || false,
    rating: interaction?.rating || null,
    toggleFavorite,
    updateNotes,
    toggleMet,
    setRating,
  };
}
