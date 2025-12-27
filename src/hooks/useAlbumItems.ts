// Hook for managing items within an album

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { ALBUM_LIMITS } from '@/contexts/SubscriptionContext';
import type { AlbumItem, AlbumItemType } from '@/types';

interface UseAlbumItemsReturn {
  items: AlbumItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<AlbumItem, 'id' | 'album_id' | 'sort_order' | 'created_at'>) => Promise<AlbumItem | null>;
  removeItem: (itemId: string) => Promise<void>;
  reorderItems: (itemIds: string[]) => Promise<void>;
  canAddItem: boolean;
  canAddVideo: boolean;
  itemLimits: typeof ALBUM_LIMITS['free'];
  refresh: () => Promise<void>;
}

export function useAlbumItems(albumId: string | null): UseAlbumItemsReturn {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemLimits = ALBUM_LIMITS[subscription.tier];

  const fetchItems = useCallback(async () => {
    if (!user || !albumId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('album_items')
        .select('*')
        .eq('album_id', albumId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setItems(data || []);
      }
    } catch (err) {
      setError('Failed to load album items');
      console.error('Error fetching album items:', err);
    } finally {
      setLoading(false);
    }
  }, [user, albumId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const canAddItem = items.length < itemLimits.maxItemsPerAlbum;
  const canAddVideo = itemLimits.videosAllowed;

  const addItem = useCallback(async (
    item: Omit<AlbumItem, 'id' | 'album_id' | 'sort_order' | 'created_at'>
  ): Promise<AlbumItem | null> => {
    if (!user || !albumId) {
      setError('Not authenticated');
      return null;
    }

    if (!canAddItem) {
      setError(`You can only add ${itemLimits.maxItemsPerAlbum} items per album`);
      return null;
    }

    // Check video permissions
    if (item.type === 'video' && !canAddVideo) {
      setError('Videos are only available for premium users');
      return null;
    }

    // Validate video constraints
    if (item.type === 'video') {
      if (item.duration_seconds && item.duration_seconds > itemLimits.maxVideoSeconds) {
        setError(`Videos cannot exceed ${itemLimits.maxVideoSeconds} seconds`);
        return null;
      }
      if (item.file_size_bytes && item.file_size_bytes > itemLimits.maxVideoSizeMB * 1024 * 1024) {
        setError(`Videos cannot exceed ${itemLimits.maxVideoSizeMB}MB`);
        return null;
      }
    }

    try {
      const nextSortOrder = items.length;

      const { data, error: insertError } = await supabase
        .from('album_items')
        .insert({
          album_id: albumId,
          type: item.type,
          url: item.url,
          thumbnail_url: item.thumbnail_url,
          duration_seconds: item.duration_seconds,
          file_size_bytes: item.file_size_bytes,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      setItems((prev) => [...prev, data]);
      return data;
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding album item:', err);
      return null;
    }
  }, [user, albumId, canAddItem, canAddVideo, itemLimits, items.length]);

  const removeItem = useCallback(async (itemId: string): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('album_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError('Failed to remove item');
      console.error('Error removing album item:', err);
    }
  }, [user]);

  const reorderItems = useCallback(async (itemIds: string[]): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      // Update sort_order for each item
      const updates = itemIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      // Batch update - upsert each item's sort_order
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('album_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (updateError) {
          setError(updateError.message);
          return;
        }
      }

      // Reorder local state
      const reordered = itemIds.map((id) => items.find((item) => item.id === id)!).filter(Boolean);
      setItems(reordered);
    } catch (err) {
      setError('Failed to reorder items');
      console.error('Error reordering album items:', err);
    }
  }, [user, items]);

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    reorderItems,
    canAddItem,
    canAddVideo,
    itemLimits,
    refresh: fetchItems,
  };
}
