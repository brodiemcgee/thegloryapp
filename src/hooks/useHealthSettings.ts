// Hook for managing health settings (reminders, contact tracing opt-in)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface HealthSettings {
  user_id: string;
  screen_reminder_days: number;
  screen_reminder_partners: number;
  contact_tracing_opted_in: boolean;
  prep_reminders_enabled: boolean;
  prep_reminder_time: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<HealthSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  screen_reminder_days: 90,
  screen_reminder_partners: 10,
  contact_tracing_opted_in: false,
  prep_reminders_enabled: false,
  prep_reminder_time: '09:00',
};

export function useHealthSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<HealthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('health_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings for new user
        const { data: newSettings, error: insertError } = await supabase
          .from('health_settings')
          .insert({
            user_id: user.id,
            ...DEFAULT_SETTINGS,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load health settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update settings
  const updateSettings = async (
    updates: Partial<Omit<HealthSettings, 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user || !settings) throw new Error('Not authenticated');

    const { data, error: updateError } = await supabase
      .from('health_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    setSettings(data);
    return data;
  };

  // Toggle contact tracing opt-in
  const toggleContactTracing = async () => {
    if (!settings) return;
    return updateSettings({
      contact_tracing_opted_in: !settings.contact_tracing_opted_in,
    });
  };

  // Toggle PrEP reminders
  const togglePrepReminders = async () => {
    if (!settings) return;
    return updateSettings({
      prep_reminders_enabled: !settings.prep_reminders_enabled,
    });
  };

  // Update screen reminder days
  const setScreenReminderDays = async (days: number) => {
    return updateSettings({ screen_reminder_days: days });
  };

  // Update screen reminder partner threshold
  const setScreenReminderPartners = async (count: number) => {
    return updateSettings({ screen_reminder_partners: count });
  };

  // Update PrEP reminder time
  const setPrepReminderTime = async (time: string) => {
    return updateSettings({ prep_reminder_time: time });
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    toggleContactTracing,
    togglePrepReminders,
    setScreenReminderDays,
    setScreenReminderPartners,
    setPrepReminderTime,
    refresh: loadSettings,
  };
}
