// Hook for managing user interactions (favorites, notes, encounters)

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

export interface Encounter {
  id: string;
  user_id: string;
  target_user_id: string;
  met_at: string;
  notes: string | null;
  rating: number | null;
  activities: string[] | null;
  experience_tags: string[] | null;
  location_type: string | null;
  protection_used: 'yes' | 'no' | 'partial' | null;
  created_at: string;
}

export function useUserInteraction(targetUserId: string) {
  const { user } = useAuth();
  const [interaction, setInteraction] = useState<UserInteraction | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing interaction and encounters
  useEffect(() => {
    if (!user || !targetUserId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch interaction
      const { data: interactionData, error: interactionError } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .single();

      if (interactionError && interactionError.code !== 'PGRST116') {
        console.error('Error fetching interaction:', interactionError);
      }

      setInteraction(interactionData);

      // Fetch encounters
      const { data: encountersData, error: encountersError } = await supabase
        .from('encounters')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_user_id', targetUserId)
        .order('met_at', { ascending: false });

      if (encountersError) {
        console.error('Error fetching encounters:', encountersError);
      }

      setEncounters(encountersData || []);
      setLoading(false);
    };

    fetchData();
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

  // Add a new encounter
  const addEncounter = useCallback(async (encounter: {
    met_at: string;
    notes?: string;
    rating?: number;
    activities?: string[];
    experience_tags?: string[];
    location_type?: string;
    protection_used?: 'yes' | 'no' | 'partial';
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('encounters')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        met_at: encounter.met_at,
        notes: encounter.notes || null,
        rating: encounter.rating || null,
        activities: encounter.activities || null,
        experience_tags: encounter.experience_tags || null,
        location_type: encounter.location_type || null,
        protection_used: encounter.protection_used || null,
        is_anonymous: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding encounter:', error);
      return null;
    }

    // Add to local state
    setEncounters(prev => [data, ...prev]);
    return data;
  }, [user, targetUserId]);

  // Delete an encounter
  const deleteEncounter = useCallback(async (encounterId: string) => {
    const { error } = await supabase
      .from('encounters')
      .delete()
      .eq('id', encounterId);

    if (error) {
      console.error('Error deleting encounter:', error);
      return false;
    }

    setEncounters(prev => prev.filter(e => e.id !== encounterId));
    return true;
  }, []);

  return {
    interaction,
    encounters,
    loading,
    isFavorite: interaction?.is_favorite || false,
    notes: interaction?.notes || '',
    hasMet: encounters.length > 0,
    toggleFavorite,
    updateNotes,
    addEncounter,
    deleteEncounter,
  };
}
