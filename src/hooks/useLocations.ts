// Hook for fetching locations from Supabase database

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Location } from '@/types';

interface UseLocationsOptions {
  /** Filter by location type */
  type?: Location['type'] | Location['type'][];
  /** Only show verified locations */
  verifiedOnly?: boolean;
}

interface UseLocationsResult {
  /** Array of locations */
  locations: Location[];
  /** Whether the initial fetch is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh locations from database */
  refresh: () => Promise<void>;
}

interface DbLocation {
  id: string;
  name: string;
  description: string | null;
  type: string;
  coordinates_json: { type: string; coordinates: [number, number] } | null;
  created_by: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  // Premium fields
  directions: string | null;
  best_times: string | null;
  parking_info: string | null;
  safety_tips: string | null;
  amenities: string[] | null;
  photos: string[] | null;
  cover_photo: string | null;
  hours: Record<string, string> | null;
  website: string | null;
  phone: string | null;
  entry_fee: string | null;
  dress_code: string | null;
  crowd_type: string | null;
  vibe: string | null;
  age_range: string | null;
  busy_rating: number | null;
  avg_rating: number | null;
  last_verified_at: string | null;
}

/**
 * Hook to fetch cruising locations from Supabase database
 *
 * Uses RPC function to get coordinates as GeoJSON.
 * Returns all active, optionally verified locations.
 *
 * @example
 * ```tsx
 * const { locations, loading, error } = useLocations();
 * const { locations: venues } = useLocations({ type: 'venue' });
 * ```
 */
export function useLocations(options: UseLocationsOptions = {}): UseLocationsResult {
  const { type, verifiedOnly = false } = options;

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setError(null);

      // Use RPC function to get locations with coordinates as GeoJSON
      const { data, error: fetchError } = await supabase
        .rpc('get_locations_with_coordinates');

      if (fetchError) {
        console.error('Error fetching locations:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data) {
        setLocations([]);
        return;
      }

      // Transform database format to app format
      let transformedLocations: Location[] = (data as DbLocation[]).map((row) => {
        let lat = 0;
        let lng = 0;

        if (row.coordinates_json && row.coordinates_json.coordinates) {
          lng = row.coordinates_json.coordinates[0];
          lat = row.coordinates_json.coordinates[1];
        }

        return {
          id: row.id,
          name: row.name,
          description: row.description || '',
          type: row.type as Location['type'],
          lat,
          lng,
          user_count: 0, // Will be populated by presence data
          created_by: row.created_by || '',
          is_verified: row.is_verified || false,
          // Premium fields
          directions: row.directions || undefined,
          best_times: row.best_times || undefined,
          parking_info: row.parking_info || undefined,
          safety_tips: row.safety_tips || undefined,
          amenities: row.amenities || undefined,
          photos: row.photos || undefined,
          cover_photo: row.cover_photo || undefined,
          hours: row.hours || undefined,
          website: row.website || undefined,
          phone: row.phone || undefined,
          entry_fee: row.entry_fee || undefined,
          dress_code: row.dress_code || undefined,
          crowd_type: row.crowd_type || undefined,
          vibe: row.vibe || undefined,
          age_range: row.age_range || undefined,
          busy_rating: row.busy_rating || undefined,
          avg_rating: row.avg_rating || undefined,
          last_verified_at: row.last_verified_at || undefined,
        };
      });

      // Apply client-side filters
      if (verifiedOnly) {
        transformedLocations = transformedLocations.filter(loc => loc.is_verified);
      }

      if (type) {
        if (Array.isArray(type)) {
          transformedLocations = transformedLocations.filter(loc => type.includes(loc.type));
        } else {
          transformedLocations = transformedLocations.filter(loc => loc.type === type);
        }
      }

      setLocations(transformedLocations);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, [type, verifiedOnly]);

  // Fetch on mount and when options change
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations,
  };
}
