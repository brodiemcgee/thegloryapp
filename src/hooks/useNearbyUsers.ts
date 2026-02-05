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
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  intent: Intent | null;
  availability: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_active: string;
  location_json: { type: string; coordinates: [number, number] } | null;
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
  account_status: string | null;
  show_in_grid: boolean;
  show_on_map: boolean;
}

interface DbPhoto {
  id: string;
  profile_id: string;
  url: string;
  is_primary: boolean;
  is_nsfw: boolean;
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
      // Use RPC function to get profile with location as GeoJSON
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_profiles_with_location');

      if (profilesError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch current user profile:', profilesError);
        }
        return;
      }

      const currentProfile = (profilesData || []).find(
        (p: DbProfile) => p.id === authUser.id
      );

      if (currentProfile) {
        // Fetch photos for current user
        const { data: photosData } = await supabase
          .from('photos')
          .select('id, profile_id, url, is_primary, is_nsfw')
          .eq('profile_id', authUser.id);

        const profile = transformProfile(currentProfile, photosData || []);
        setCurrentUserProfile(profile);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching current user profile:', err);
      }
    }
  };

  // Transform a database profile to User type
  const transformProfile = (profile: DbProfile, photos: DbPhoto[] = []): User => {
    let location: { lat: number; lng: number } | undefined;
    if (profile.location_json && typeof profile.location_json === 'object' && 'coordinates' in profile.location_json) {
      location = {
        lng: profile.location_json.coordinates[0],
        lat: profile.location_json.coordinates[1],
      };
    }

    const profilePhotos = photos.filter(p => p.profile_id === profile.id);
    const primaryPhoto = profilePhotos.find(p => p.is_primary);
    const avatarUrl = profile.avatar_url || primaryPhoto?.url || profilePhotos[0]?.url || null;

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || undefined,
      avatar_url: avatarUrl,
      bio: profile.bio || undefined,
      age: profile.age || undefined,
      intent: profile.intent || 'chatting',
      availability: (profile.availability as User['availability']) || 'offline',
      is_verified: profile.is_verified,
      is_online: profile.is_online,
      last_active: profile.last_active,
      location,
      photos: profilePhotos.map(p => p.url) || [],
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
      show_in_grid: profile.show_in_grid,
      show_on_map: profile.show_on_map,
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profiles using RPC function (returns location as GeoJSON)
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_profiles_with_location');

      if (profilesError) throw profilesError;

      // Filter for active, non-ghost profiles
      const activeProfiles = (profilesData || []).filter(
        (p: DbProfile) => !p.ghost_mode && p.account_status === 'active'
      );

      // Fetch all photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('id, profile_id, url, is_primary, is_nsfw');

      if (photosError && process.env.NODE_ENV === 'development') {
        console.warn('Failed to fetch photos:', photosError);
      }

      const photos: DbPhoto[] = photosData || [];

      // Transform database profiles to User type
      const transformedUsers: User[] = activeProfiles.map((profile: DbProfile) =>
        transformProfile(profile, photos)
      );

      // Sort by last_active
      transformedUsers.sort((a, b) => {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        return bTime - aTime;
      });

      setUsers(transformedUsers);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch users:', err);
      }
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
    allUsers: users, // Unfiltered users for map view
    currentUserProfile,
    loading,
    error,
    refresh: fetchUsers,
  };
}
