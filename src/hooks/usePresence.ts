// Realtime presence hook - Track user online status and location
// Uses Supabase Realtime Presence to broadcast and track user state

'use client';

import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';

export interface PresenceUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  location?: {
    lat: number;
    lng: number;
  };
  snapped_to_location_id?: string; // ID of location user is snapped to (within 25m)
  intent?: string;
  availability?: string;
  online_at: string;
}

interface PresenceState {
  [key: string]: PresenceUser[];
}

export function usePresence(channelName: string = 'global-presence') {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    // Don't broadcast presence if ghost mode is enabled
    if (settings.ghost_mode) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    // Create presence channel
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence state
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<PresenceUser>();
        const users = extractUsers(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, () => {
        // User joined
      })
      .on('presence', { event: 'leave' }, () => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Track this user's presence
          // In production, this would broadcast real user data from the database
          const presenceState: PresenceUser = {
            user_id: user.id,
            username: user.email?.split('@')[0] || 'Anonymous',
            avatar_url: null,
            online_at: new Date().toISOString(),
          };

          await presenceChannel.track(presenceState);
        }
      });

    setChannel(presenceChannel);

    // Cleanup on unmount
    return () => {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
      setIsConnected(false);
    };
  }, [user, channelName, settings.ghost_mode]);

  // Update presence with location (memoized to prevent re-render cascades)
  const updatePresence = useCallback(async (updates: Partial<PresenceUser>) => {
    if (!channel || !user) return;

    const currentState = channel.presenceState<PresenceUser>();
    const myPresence = currentState[user.id]?.[0] || {};

    await channel.track({
      ...myPresence,
      ...updates,
      user_id: user.id,
      online_at: new Date().toISOString(),
    });
  }, [channel, user]);

  return {
    onlineUsers,
    isConnected,
    updatePresence,
  };
}

// Helper to flatten presence state into user array
function extractUsers(state: PresenceState): PresenceUser[] {
  const users: PresenceUser[] = [];

  Object.keys(state).forEach((key) => {
    const presences = state[key];
    if (presences && presences.length > 0) {
      // Take the most recent presence for each user
      users.push(presences[0]);
    }
  });

  return users;
}
