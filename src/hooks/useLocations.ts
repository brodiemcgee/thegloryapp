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

/**
 * Hook to fetch cruising locations from Supabase database
 *
 * Transforms PostGIS geography format to simple lat/lng for the app.
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

      // Build query - select with PostGIS coordinates extraction
      let query = supabase
        .from('locations')
        .select(`
          id,
          name,
          description,
          type,
          coordinates,
          created_by,
          is_verified,
          is_active
        `)
        .eq('is_active', true);

      // Filter by verified if requested
      if (verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      // Filter by type(s) if provided
      if (type) {
        if (Array.isArray(type)) {
          query = query.in('type', type);
        } else {
          query = query.eq('type', type);
        }
      }

      // Order by name for consistent display
      query = query.order('name');

      const { data, error: fetchError } = await query;

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
      const transformedLocations: Location[] = data.map((row) => {
        // PostGIS returns coordinates as GeoJSON or WKB
        // Supabase returns it as a string like "POINT(lng lat)" or as GeoJSON
        let lat = 0;
        let lng = 0;

        if (row.coordinates) {
          // If it's a GeoJSON object
          if (typeof row.coordinates === 'object' && 'coordinates' in row.coordinates) {
            const coords = row.coordinates.coordinates as [number, number];
            lng = coords[0];
            lat = coords[1];
          }
          // If it's a WKT string like "POINT(lng lat)"
          else if (typeof row.coordinates === 'string') {
            const match = row.coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
            if (match) {
              lng = parseFloat(match[1]);
              lat = parseFloat(match[2]);
            }
          }
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
