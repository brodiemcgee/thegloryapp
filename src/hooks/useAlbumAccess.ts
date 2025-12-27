// Hook for managing album access grants

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { AlbumAccessGrant, Album, AlbumItem } from '@/types';

interface AlbumAccessWithOwner extends AlbumAccessGrant {
  album?: Album;
  owner_username?: string;
  owner_avatar_url?: string;
}

interface UseAlbumAccessReturn {
  // For album owners - who has access to my albums
  grantsGiven: AlbumAccessGrant[];
  // For viewers - albums shared with me
  grantsReceived: AlbumAccessWithOwner[];
  loading: boolean;
  error: string | null;
  grantAccess: (albumId: string, recipientId: string, conversationId?: string) => Promise<string | null>;
  revokeAccess: (grantId: string) => Promise<void>;
  lockAccess: (grantId: string) => Promise<void>;
  unlockAccess: (grantId: string) => Promise<void>;
  hasAccess: (albumId: string) => boolean;
  getAccessInfo: (albumId: string) => AlbumAccessGrant | null;
  refreshGiven: () => Promise<void>;
  refreshReceived: () => Promise<void>;
}

export function useAlbumAccess(): UseAlbumAccessReturn {
  const { user } = useAuth();
  const [grantsGiven, setGrantsGiven] = useState<AlbumAccessGrant[]>([]);
  const [grantsReceived, setGrantsReceived] = useState<AlbumAccessWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch grants given by the user
  const fetchGrantsGiven = useCallback(async () => {
    if (!user) {
      setGrantsGiven([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('album_access_grants')
        .select('*')
        .eq('granted_by', user.id)
        .order('granted_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching grants given:', fetchError);
      } else {
        setGrantsGiven(data || []);
      }
    } catch (err) {
      console.error('Error fetching grants given:', err);
    }
  }, [user]);

  // Fetch grants received by the user
  const fetchGrantsReceived = useCallback(async () => {
    if (!user) {
      setGrantsReceived([]);
      return;
    }

    try {
      // Get grants with album info and owner info
      const { data, error: fetchError } = await supabase
        .from('album_access_grants')
        .select(`
          *,
          album:albums(id, name, cover_url, item_count),
          owner:profiles!album_access_grants_granted_by_fkey(username, avatar_url)
        `)
        .eq('granted_to', user.id)
        .eq('is_locked', false)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('granted_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching grants received:', fetchError);
      } else {
        // Transform the data to flatten the structure
        const transformed = (data || []).map((grant: any) => ({
          ...grant,
          album: grant.album,
          owner_username: grant.owner?.username,
          owner_avatar_url: grant.owner?.avatar_url,
        }));
        setGrantsReceived(transformed);
      }
    } catch (err) {
      console.error('Error fetching grants received:', err);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchGrantsGiven(), fetchGrantsReceived()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchGrantsGiven, fetchGrantsReceived]);

  // Grant access to an album
  const grantAccess = useCallback(async (
    albumId: string,
    recipientId: string,
    conversationId?: string
  ): Promise<string | null> => {
    if (!user) {
      setError('Not authenticated');
      return null;
    }

    try {
      // Use the database function which handles expiration calculation
      const { data, error: grantError } = await supabase
        .rpc('grant_album_access', {
          p_album_id: albumId,
          p_recipient_id: recipientId,
          p_conversation_id: conversationId || null,
        });

      if (grantError) {
        setError(grantError.message);
        return null;
      }

      // Refresh grants
      await fetchGrantsGiven();
      return data;
    } catch (err) {
      setError('Failed to grant access');
      console.error('Error granting album access:', err);
      return null;
    }
  }, [user, fetchGrantsGiven]);

  // Revoke access (delete the grant)
  const revokeAccess = useCallback(async (grantId: string): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('album_access_grants')
        .delete()
        .eq('id', grantId)
        .eq('granted_by', user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setGrantsGiven((prev) => prev.filter((grant) => grant.id !== grantId));
    } catch (err) {
      setError('Failed to revoke access');
      console.error('Error revoking album access:', err);
    }
  }, [user]);

  // Lock access (soft revoke - keeps record but prevents access)
  const lockAccess = useCallback(async (grantId: string): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('album_access_grants')
        .update({ is_locked: true })
        .eq('id', grantId)
        .eq('granted_by', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setGrantsGiven((prev) =>
        prev.map((grant) =>
          grant.id === grantId ? { ...grant, is_locked: true } : grant
        )
      );
    } catch (err) {
      setError('Failed to lock access');
      console.error('Error locking album access:', err);
    }
  }, [user]);

  // Unlock access (re-enable access)
  const unlockAccess = useCallback(async (grantId: string): Promise<void> => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('album_access_grants')
        .update({ is_locked: false })
        .eq('id', grantId)
        .eq('granted_by', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setGrantsGiven((prev) =>
        prev.map((grant) =>
          grant.id === grantId ? { ...grant, is_locked: false } : grant
        )
      );
    } catch (err) {
      setError('Failed to unlock access');
      console.error('Error unlocking album access:', err);
    }
  }, [user]);

  // Check if user has access to a specific album
  const hasAccess = useCallback((albumId: string): boolean => {
    const now = new Date();
    return grantsReceived.some(
      (grant) =>
        grant.album_id === albumId &&
        !grant.is_locked &&
        (grant.expires_at === null || new Date(grant.expires_at) > now)
    );
  }, [grantsReceived]);

  // Get access info for a specific album
  const getAccessInfo = useCallback((albumId: string): AlbumAccessGrant | null => {
    return grantsReceived.find((grant) => grant.album_id === albumId) || null;
  }, [grantsReceived]);

  return {
    grantsGiven,
    grantsReceived,
    loading,
    error,
    grantAccess,
    revokeAccess,
    lockAccess,
    unlockAccess,
    hasAccess,
    getAccessInfo,
    refreshGiven: fetchGrantsGiven,
    refreshReceived: fetchGrantsReceived,
  };
}

// Hook for checking access to a specific album (for viewers)
export function useAlbumViewer(albumId: string | null) {
  const { user } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [accessInfo, setAccessInfo] = useState<AlbumAccessGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!user || !albumId) {
        setAlbum(null);
        setItems([]);
        setAccessInfo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch album (RLS will check access)
        const { data: albumData, error: albumError } = await supabase
          .from('albums')
          .select('*')
          .eq('id', albumId)
          .single();

        if (albumError) {
          if (albumError.code === 'PGRST116') {
            setError('Album not found or access denied');
          } else {
            setError(albumError.message);
          }
          setAlbum(null);
          setItems([]);
          setLoading(false);
          return;
        }

        setAlbum(albumData);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('album_items')
          .select('*')
          .eq('album_id', albumId)
          .order('sort_order', { ascending: true });

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
        } else {
          setItems(itemsData || []);
        }

        // Fetch access info (if not owner)
        if (albumData.owner_id !== user.id) {
          const { data: accessData } = await supabase
            .from('album_access_grants')
            .select('*')
            .eq('album_id', albumId)
            .eq('granted_to', user.id)
            .single();

          setAccessInfo(accessData || null);
        }
      } catch (err) {
        setError('Failed to load album');
        console.error('Error fetching album:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [user, albumId]);

  // Calculate time remaining
  const timeRemaining = accessInfo?.expires_at
    ? Math.max(0, new Date(accessInfo.expires_at).getTime() - Date.now())
    : null;

  const isExpired = timeRemaining !== null && timeRemaining <= 0;
  const isOwner = album?.owner_id === user?.id;

  return {
    album,
    items,
    accessInfo,
    loading,
    error,
    timeRemaining,
    isExpired,
    isOwner,
  };
}
