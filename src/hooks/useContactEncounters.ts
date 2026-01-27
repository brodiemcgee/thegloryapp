// Hook for fetching encounters for a specific contact or profile

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Encounter } from './useEncounters';

export interface ContactEncounterStats {
  total: number;
  avgRating: number | null;
  firstMet: string | null;
  lastMet: string | null;
  // Activity analytics
  topActivities: { activity: string; count: number }[];
  // Location analytics
  topLocations: { location: string; count: number }[];
  // Protection stats
  protectionPercentage: number | null;
}

interface UseContactEncountersOptions {
  contactId?: string;    // For manual contacts
  profileId?: string;    // For app users (target_user_id)
}

export function useContactEncounters({ contactId, profileId }: UseContactEncountersOptions) {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load encounters for the contact or profile
  const loadEncounters = useCallback(async () => {
    if (!user || (!contactId && !profileId)) {
      setEncounters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
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

      // Filter by contact_id or target_user_id
      if (contactId) {
        query = query.eq('contact_id', contactId);
      } else if (profileId) {
        query = query.eq('target_user_id', profileId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEncounters(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load contact encounters:', err);
      setError('Failed to load encounters');
    } finally {
      setLoading(false);
    }
  }, [user, contactId, profileId]);

  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  // Calculate stats for the encounters
  const stats: ContactEncounterStats = useMemo(() => {
    const total = encounters.length;

    // First and last met dates
    let firstMet: string | null = null;
    let lastMet: string | null = null;
    if (total > 0) {
      const sorted = [...encounters].sort(
        (a, b) => new Date(a.met_at).getTime() - new Date(b.met_at).getTime()
      );
      firstMet = sorted[0].met_at;
      lastMet = sorted[sorted.length - 1].met_at;
    }

    // Average rating
    const ratingsSum = encounters.reduce((sum, e) => sum + (e.rating || 0), 0);
    const ratingsCount = encounters.filter((e) => e.rating !== null).length;
    const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : null;

    // Protection percentage
    const encountersWithProtection = encounters.filter((e) => e.protection_used !== null);
    const protectedCount = encounters.filter((e) => e.protection_used === 'yes').length;
    const protectionPercentage =
      encountersWithProtection.length > 0
        ? Math.round((protectedCount / encountersWithProtection.length) * 100)
        : null;

    // Activity analytics
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
      total,
      avgRating,
      firstMet,
      lastMet,
      topActivities,
      topLocations,
      protectionPercentage,
    };
  }, [encounters]);

  return {
    encounters,
    stats,
    loading,
    error,
    refresh: loadEncounters,
  };
}
