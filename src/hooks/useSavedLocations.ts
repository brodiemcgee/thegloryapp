// Hook for managing saved locations (My Place, etc.)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  name?: string; // For saved location reference
  savedLocationId?: string;
}

export function useSavedLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved locations
  const loadLocations = useCallback(async () => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (fetchError) throw fetchError;

      setLocations(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load saved locations:', err);
      setError('Failed to load saved locations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Save a new location
  const saveLocation = async (
    name: string,
    lat: number,
    lng: number,
    address?: string,
    isDefault?: boolean
  ) => {
    if (!user) throw new Error('Not authenticated');

    // If setting as default, unset other defaults first
    if (isDefault) {
      await supabase
        .from('saved_locations')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error: insertError } = await supabase
      .from('saved_locations')
      .upsert({
        user_id: user.id,
        name,
        lat,
        lng,
        address: address || null,
        is_default: isDefault || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,name',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update local state
    setLocations((prev) => {
      const existing = prev.find((l) => l.name === name);
      if (existing) {
        return prev.map((l) => (l.name === name ? data : l));
      }
      return [...prev, data];
    });

    return data;
  };

  // Update an existing location
  const updateLocation = async (
    id: string,
    updates: Partial<Pick<SavedLocation, 'name' | 'address' | 'lat' | 'lng' | 'is_default'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await supabase
        .from('saved_locations')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error: updateError } = await supabase
      .from('saved_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    setLocations((prev) => prev.map((l) => (l.id === id ? data : l)));

    return data;
  };

  // Delete a saved location
  const deleteLocation = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('saved_locations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // Get "My Place" or default location
  const getMyPlace = () => {
    return locations.find((l) => l.name.toLowerCase() === 'my place') ||
           locations.find((l) => l.is_default) ||
           null;
  };

  return {
    locations,
    loading,
    error,
    saveLocation,
    updateLocation,
    deleteLocation,
    getMyPlace,
    refresh: loadLocations,
  };
}
