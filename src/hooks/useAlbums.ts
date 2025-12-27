// Hook for managing user's albums

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { ALBUM_LIMITS } from '@/contexts/SubscriptionContext';
import type { Album } from '@/types';

interface UseAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  createAlbum: (name: string) => Promise<Album | null>;
  updateAlbum: (id: string, updates: Partial<Album>) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  canCreateAlbum: boolean;
  albumLimits: typeof ALBUM_LIMITS['free'];
  refresh: () => Promise<void>;
}

export function useAlbums(): UseAlbumsReturn {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const albumLimits = ALBUM_LIMITS[subscription.tier];

  const fetchAlbums = useCallback(async () => {
    if (!user) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('albums')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setAlbums(data || []);
      }
    } catch (err) {
      setError('Failed to load albums');
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const canCreateAlbum = albums.length < albumLimits.maxAlbums;

  const createAlbum = useCallback(async (name: string): Promise<Album | null> => {
    if (!user) {
      setError('Not authenticated');
      return null;
    }

    if (!canCreateAlbum) {
      setError(`You can only create ${albumLimits.maxAlbums} album${albumLimits.maxAlbums > 1 ? 's' : ''} with your current plan`);
      return null;
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      setError('Album name must be 1-50 characters');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('albums')
        .insert({
          owner_id: user.id,
          name: trimmedName,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      setAlbums((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      setError('Failed to create album');
      console.error('Error creating album:', err);
      return null;
    }
  }, [user, canCreateAlbum, albumLimits.maxAlbums]);

  const updateAlbum = useCallback(async (id: string, updates: Partial<Album>): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('albums')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setAlbums((prev) =>
        prev.map((album) =>
          album.id === id ? { ...album, ...updates, updated_at: new Date().toISOString() } : album
        )
      );
    } catch (err) {
      setError('Failed to update album');
      console.error('Error updating album:', err);
    }
  }, [user]);

  const deleteAlbum = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('albums')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setAlbums((prev) => prev.filter((album) => album.id !== id));
    } catch (err) {
      setError('Failed to delete album');
      console.error('Error deleting album:', err);
    }
  }, [user]);

  return {
    albums,
    loading,
    error,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    canCreateAlbum,
    albumLimits,
    refresh: fetchAlbums,
  };
}
