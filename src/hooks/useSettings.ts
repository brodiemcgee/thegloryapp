// Settings hook for app preferences

'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  sfw_mode: false, // NSFW by default per spec
  location_enabled: true,
  push_notifications: true,
  ghost_mode: false,
  hide_from_contacts: false,
  location_accuracy: 100, // Default 100m fuzz for privacy
  show_in_grid: true,
  show_on_map: true,
};

const STORAGE_KEY = 'thehole_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch {
          // Invalid JSON, use defaults
        }
      }
      setLoaded(true);
    }
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleSfwMode = () => updateSettings({ sfw_mode: !settings.sfw_mode });
  const toggleLocation = () => updateSettings({ location_enabled: !settings.location_enabled });
  const toggleGhostMode = () => updateSettings({ ghost_mode: !settings.ghost_mode });
  const setLocationAccuracy = (meters: number) => updateSettings({ location_accuracy: Math.max(0, Math.min(200, meters)) });

  return {
    settings,
    loaded,
    updateSettings,
    toggleSfwMode,
    toggleLocation,
    toggleGhostMode,
    setLocationAccuracy,
    isSfw: settings.sfw_mode,
    locationAccuracy: settings.location_accuracy,
  };
}
