// Hook for managing encounter records (both from app and manual entries)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Encounter {
  id: string;
  user_id: string;
  target_user_id: string | null;
  met_at: string;
  notes: string | null;
  rating: number | null;
  is_anonymous: boolean;
  anonymous_name: string | null;
  created_at: string;
  // Joined profile data for app users
  target_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface EncounterStats {
  thisMonth: number;
  total: number;
  avgRating: number | null;
}

export function useEncounters() {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load encounters from database
  const loadEncounters = useCallback(async () => {
    if (!user) {
      setEncounters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch encounters with target user profile info
      const { data, error: fetchError } = await supabase
        .from('encounters')
        .select(`
          *,
          target_user:profiles!encounters_target_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('met_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEncounters(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load encounters:', err);
      setError('Failed to load encounters');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  // Calculate stats
  const stats: EncounterStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = encounters.filter(
      (e) => new Date(e.met_at) >= startOfMonth
    ).length;

    const total = encounters.length;

    const ratingsSum = encounters.reduce(
      (sum, e) => sum + (e.rating || 0),
      0
    );
    const ratingsCount = encounters.filter((e) => e.rating !== null).length;
    const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : null;

    return { thisMonth, total, avgRating };
  }, [encounters]);

  // Add a new encounter (for app users - from profile/chat)
  const addEncounter = async (
    targetUserId: string,
    metAt: string,
    rating?: number,
    notes?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('encounters')
      .insert({
        user_id: user.id,
        target_user_id: targetUserId,
        met_at: metAt,
        rating: rating || null,
        notes: notes || null,
        is_anonymous: false,
        anonymous_name: null,
      })
      .select(`
        *,
        target_user:profiles!encounters_target_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (insertError) throw insertError;

    // Add to local state
    setEncounters((prev) => [data, ...prev]);

    return data;
  };

  // Add a manual/anonymous encounter (for people met outside app)
  const addManualEncounter = async (
    metAt: string,
    name?: string,
    rating?: number,
    notes?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('encounters')
      .insert({
        user_id: user.id,
        target_user_id: null,
        met_at: metAt,
        rating: rating || null,
        notes: notes || null,
        is_anonymous: true,
        anonymous_name: name || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Add to local state
    setEncounters((prev) => [data, ...prev]);

    return data;
  };

  // Update an encounter
  const updateEncounter = async (
    id: string,
    updates: Partial<Pick<Encounter, 'met_at' | 'rating' | 'notes' | 'anonymous_name'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error: updateError } = await supabase
      .from('encounters')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        target_user:profiles!encounters_target_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (updateError) throw updateError;

    // Update local state
    setEncounters((prev) =>
      prev.map((e) => (e.id === id ? data : e))
    );

    return data;
  };

  // Delete an encounter
  const deleteEncounter = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('encounters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Remove from local state
    setEncounters((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    encounters,
    stats,
    loading,
    error,
    addEncounter,
    addManualEncounter,
    updateEncounter,
    deleteEncounter,
    refresh: loadEncounters,
  };
}
