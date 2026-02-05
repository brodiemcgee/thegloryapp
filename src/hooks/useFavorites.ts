// Hook for fetching user's favorites

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Favorite {
  id: string;
  target_user_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_interactions')
        .select('id, target_user_id, created_at')
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching favorites:', error);
        }
      } else {
        setFavorites(data || []);
      }
      setLoading(false);
    };

    fetchFavorites();

    // Subscribe to changes
    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_interactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isFavorite = (targetUserId: string): boolean => {
    return favorites.some(f => f.target_user_id === targetUserId);
  };

  return {
    favorites,
    loading,
    isFavorite,
  };
}
