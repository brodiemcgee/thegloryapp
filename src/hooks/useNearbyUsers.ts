// Hook for fetching nearby users with their photos

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { User, Intent } from '@/types';
import { calculateDistance, isWithinRadius } from '@/lib/geo';

interface UseNearbyUsersOptions {
  radiusKm?: number;
  intentFilter?: Intent | 'all';
}

interface DbProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  intent: Intent | null;
  availability: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_active: string;
  location: { type: string; coordinates: [number, number] } | null;
  ghost_mode: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  ethnicity: string | null;
  position: string | null;
  host_travel: string | null;
  smoker: string | null;
  drugs: string | null;
  safer_sex: string | null;
  hiv_status: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  looking_for: Record<string, unknown> | null;
  kinks: string[] | null;
  photos: Array<{ id: string; url: string; is_primary: boolean; is_nsfw: boolean }>;
}

export function useNearbyUsers(
  userPosition: { lat: number; lng: number } | null,
  options: UseNearbyUsersOptions = {}
) {
  const { radiusKm = 10, intentFilter = 'all' } = options;
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUsers();
    if (authUser) {
      fetchCurrentUserProfile();
    }
  }, [authUser]);

  // Fetch current user's profile separately to ensure it's always available
  const fetchCurrentUserProfile = async () => {
    if (!authUser) return;

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select(`
          id, username, avatar_url, bio, age, intent, availability,
          is_verified, is_online, last_active, location, ghost_mode,
          height_cm, weight_kg, body_type, ethnicity, position,
          host_travel, smoker, drugs, safer_sex, hiv_status,
          instagram_handle, twitter_handle, looking_for, kinks,
          photos (id, url, is_primary, is_nsfw)
        `)
        .eq('id', authUser.id)
        .single();

      if (dbError) {
        console.error('Failed to fetch current user profile:', dbError);
        return;
      }

      if (data) {
        const profile = transformProfile(data);
        setCurrentUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching current user profile:', err);
    }
  };

  // Transform a database profile to User type
  const transformProfile = (profile: DbProfile): User => {
    let location: { lat: number; lng: number } | undefined;
    if (profile.location && typeof profile.location === 'object' && 'coordinates' in profile.location) {
      const coords = profile.location as { coordinates: [number, number] };
      location = {
        lng: coords.coordinates[0],
        lat: coords.coordinates[1],
      };
    }

    const primaryPhoto = profile.photos?.find(p => p.is_primary);
    const avatarUrl = profile.avatar_url || primaryPhoto?.url || profile.photos?.[0]?.url || null;

    return {
      id: profile.id,
      username: profile.username,
      avatar_url: avatarUrl,
      bio: profile.bio || undefined,
      age: profile.age || undefined,
      intent: profile.intent || 'chatting',
      availability: (profile.availability as User['availability']) || 'offline',
      is_verified: profile.is_verified,
      is_online: profile.is_online,
      last_active: profile.last_active,
      location,
      photos: profile.photos?.map(p => p.url) || [],
      height_cm: profile.height_cm || undefined,
      weight_kg: profile.weight_kg || undefined,
      body_type: profile.body_type as User['body_type'],
      ethnicity: profile.ethnicity || undefined,
      position: profile.position as User['position'],
      host_travel: profile.host_travel as User['host_travel'],
      smoker: profile.smoker as User['smoker'],
      drugs: profile.drugs as User['drugs'],
      safer_sex: profile.safer_sex as User['safer_sex'],
      hiv_status: profile.hiv_status as User['hiv_status'],
      instagram_handle: profile.instagram_handle || undefined,
      twitter_handle: profile.twitter_handle || undefined,
      looking_for: profile.looking_for as User['looking_for'],
      kinks: profile.kinks || undefined,
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profiles with their photos
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          bio,
          age,
          intent,
          availability,
          is_verified,
          is_online,
          last_active,
          location,
          ghost_mode,
          height_cm,
          weight_kg,
          body_type,
          ethnicity,
          position,
          host_travel,
          smoker,
          drugs,
          safer_sex,
          hiv_status,
          instagram_handle,
          twitter_handle,
          looking_for,
          kinks,
          photos (id, url, is_primary, is_nsfw)
        `)
        .eq('ghost_mode', false)
        .eq('account_status', 'active')
        .order('last_active', { ascending: false });

      if (dbError) throw dbError;

      // Transform database profiles to User type
      const transformedUsers: User[] = (data || []).map((profile: DbProfile) => transformProfile(profile));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users based on position and options
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Calculate distances if position is available
    if (userPosition) {
      result = result.map(user => {
        if (user.location) {
          return {
            ...user,
            distance_km: calculateDistance(user.location, userPosition),
          };
        }
        return user;
      });

      // Filter by radius
      result = result.filter(user => {
        if (!user.location) return true; // Keep users without location
        return isWithinRadius(user.location, userPosition, radiusKm);
      });
    }

    // Filter by intent
    if (intentFilter !== 'all') {
      result = result.filter(user => user.intent === intentFilter);
    }

    // Sort by distance (closest first)
    result.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));

    return result;
  }, [users, userPosition, radiusKm, intentFilter]);


  return {
    users: filteredUsers,
    currentUserProfile,
    loading,
    error,
    refresh: fetchUsers,
  };
}
