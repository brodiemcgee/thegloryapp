// Profile views hook - track who viewed your profile

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewer_username: string;
  viewer_avatar_url: string | null;
  viewed_at: string;
}

// Mock data - in production this would come from Supabase
const MOCK_VIEWS: ProfileView[] = [];

const STORAGE_KEY = 'thehole_profile_views';

export function useProfileViews() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    // Load views from localStorage
    if (typeof window !== 'undefined' && user) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setViews(parsed);
          setViewCount(parsed.length);
        } catch {
          // Invalid JSON, use empty array
        }
      }
    }
  }, [user]);

  const logView = (viewedUserId: string) => {
    // Don't log view if ghost mode is enabled
    if (settings.ghost_mode) {
      return;
    }

    // Don't log if viewing own profile
    if (user && user.id === viewedUserId) {
      return;
    }

    // In production, this would call an API endpoint to log the view
    // For now, we'll just store it locally as a demonstration
    // The actual view would be logged in the viewed user's profile_views table
    console.log('Profile view logged:', { viewer: user?.id, viewed: viewedUserId });
  };

  const getViewers = (): ProfileView[] => {
    // In production, this would fetch from Supabase
    return views;
  };

  const clearViews = () => {
    if (typeof window !== 'undefined' && user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
      setViews([]);
      setViewCount(0);
    }
  };

  // Mock function to add a view (for testing)
  const addMockView = (viewerUsername: string) => {
    if (!user) return;

    const newView: ProfileView = {
      id: Math.random().toString(36).substring(7),
      viewer_id: Math.random().toString(36).substring(7),
      viewer_username: viewerUsername,
      viewer_avatar_url: null,
      viewed_at: new Date().toISOString(),
    };

    const updatedViews = [newView, ...views];
    setViews(updatedViews);
    setViewCount(updatedViews.length);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(updatedViews));
    }
  };

  return {
    views: getViewers(),
    viewCount,
    logView,
    clearViews,
    addMockView, // For testing only
  };
}
