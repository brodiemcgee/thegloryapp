// Hook for managing health screen (STI testing) records

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// STI result types
export type StiResult = 'positive' | 'negative' | 'pending' | 'not_tested';

export interface StiResults {
  [stiId: string]: StiResult;
}

export interface HealthScreen {
  id: string;
  user_id: string;
  test_date: string;
  result: 'all_clear' | 'needs_followup' | 'pending' | null;
  results_detail: StiResults | null;
  notes: string | null;
  created_at: string;
}

// Derive overall status from individual STI results
export function deriveStatusFromResults(results: StiResults): 'all_clear' | 'needs_followup' | 'pending' {
  const values = Object.values(results);
  if (values.some(r => r === 'positive')) return 'needs_followup';
  if (values.some(r => r === 'pending')) return 'pending';
  return 'all_clear';
}

export function useHealthScreens() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<HealthScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load health screens from database
  const loadScreens = useCallback(async () => {
    if (!user) {
      setScreens([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('health_screens')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false });

      if (fetchError) throw fetchError;

      setScreens(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load health screens:', err);
      setError('Failed to load health records');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadScreens();
  }, [loadScreens]);

  // Get the most recent health screen
  const latestScreen = screens.length > 0 ? screens[0] : null;

  // Calculate days since last test
  const daysSinceLastTest = latestScreen
    ? Math.floor(
        (Date.now() - new Date(latestScreen.test_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Add a new health screen record
  const addScreen = async (
    testDate: string,
    resultsDetail: StiResults,
    notes?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    // Derive overall result from individual STI results
    const result = deriveStatusFromResults(resultsDetail);

    const { data, error: insertError } = await supabase
      .from('health_screens')
      .insert({
        user_id: user.id,
        test_date: testDate,
        result,
        results_detail: resultsDetail,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Add to local state (at beginning since sorted by date desc)
    setScreens((prev) => [data, ...prev]);

    return data;
  };

  // Update an existing health screen
  const updateScreen = async (
    id: string,
    updates: Partial<Pick<HealthScreen, 'test_date' | 'results_detail' | 'notes'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    // If results_detail is being updated, derive the new result
    const updatePayload: Record<string, unknown> = { ...updates };
    if (updates.results_detail) {
      updatePayload.result = deriveStatusFromResults(updates.results_detail);
    }

    const { data, error: updateError } = await supabase
      .from('health_screens')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update local state
    setScreens((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );

    return data;
  };

  // Delete a health screen
  const deleteScreen = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('health_screens')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Remove from local state
    setScreens((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    screens,
    latestScreen,
    daysSinceLastTest,
    loading,
    error,
    addScreen,
    updateScreen,
    deleteScreen,
    refresh: loadScreens,
  };
}
