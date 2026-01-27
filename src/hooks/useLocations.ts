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
