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
  activities: string[] | null;
  experience_tags: string[] | null;
  location_type: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  protection_used: 'yes' | 'no' | 'na' | null;
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
  protectionPercentage: number | null;
  uniqueLocations: number;
  regulars: number; // People encountered more than once
  // Activity analytics
  topActivities: { activity: string; count: number }[];
  topExperienceTags: { tag: string; count: number }[];
  topLocations: { location: string; count: number }[];
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

    // Calculate protection percentage
    const encountersWithProtection = encounters.filter((e) => e.protection_used !== null);
    const protectedCount = encounters.filter((e) => e.protection_used === 'yes').length;
    const protectionPercentage = encountersWithProtection.length > 0
      ? Math.round((protectedCount / encountersWithProtection.length) * 100)
      : null;

    // Count unique locations
    const locations = new Set(
      encounters
        .filter((e) => e.location_type !== null)
        .map((e) => e.location_type)
    );
    const uniqueLocations = locations.size;

    // Count regulars (same person encountered more than once)
    const targetUserCounts = new Map<string, number>();
    encounters.forEach((e) => {
      if (e.target_user_id) {
        targetUserCounts.set(
          e.target_user_id,
          (targetUserCounts.get(e.target_user_id) || 0) + 1
        );
      }
    });
    const regulars = Array.from(targetUserCounts.values()).filter((count) => count > 1).length;

    // Activity analytics - count occurrences of each activity
    const activityCounts = new Map<string, number>();
    encounters.forEach((e) => {
      if (e.activities) {
        e.activities.forEach((activity) => {
          activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
        });
      }
    });
    const topActivities = Array.from(activityCounts.entries())
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Experience tag analytics
    const experienceTagCounts = new Map<string, number>();
    encounters.forEach((e) => {
      if (e.experience_tags) {
        e.experience_tags.forEach((tag) => {
          experienceTagCounts.set(tag, (experienceTagCounts.get(tag) || 0) + 1);
        });
      }
    });
    const topExperienceTags = Array.from(experienceTagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Location analytics
    const locationCounts = new Map<string, number>();
    encounters.forEach((e) => {
      if (e.location_type) {
        locationCounts.set(e.location_type, (locationCounts.get(e.location_type) || 0) + 1);
      }
    });
    const topLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      thisMonth,
      total,
      avgRating,
      protectionPercentage,
      uniqueLocations,
      regulars,
      topActivities,
      topExperienceTags,
      topLocations,
    };
  }, [encounters]);

  // Add a new encounter (for app users - from profile/chat)
  const addEncounter = async (
    targetUserId: string,
    metAt: string,
    rating?: number,
    notes?: string,
    activities?: string[],
    locationType?: string,
    protectionUsed?: 'yes' | 'no' | 'na'
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
        activities: activities || null,
        location_type: locationType || null,
        protection_used: protectionUsed || null,
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
    notes?: string,
    activities?: string[],
    locationType?: string,
    protectionUsed?: 'yes' | 'no' | 'na',
    locationLat?: number,
    locationLng?: number,
    locationAddress?: string
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
        activities: activities || null,
        location_type: locationType || null,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        location_address: locationAddress || null,
        protection_used: protectionUsed || null,
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
    updates: Partial<Pick<Encounter, 'met_at' | 'rating' | 'notes' | 'anonymous_name' | 'activities' | 'experience_tags' | 'location_type' | 'location_lat' | 'location_lng' | 'location_address' | 'protection_used'>>
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
