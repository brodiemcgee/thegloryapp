// Hook for managing medication logs (PrEP and DoxyPep tracking)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_type: 'prep' | 'doxypep';
  taken_at: string;
  notes: string | null;
  encounter_id: string | null;
  created_at: string;
}

export interface MedicationStats {
  prepTakenToday: boolean;
  prepStreak: number;
  lastPrepDate: string | null;
  lastDoxyPepDate: string | null;
  doxyPepThisWeek: number;
}

export function useMedication() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load medication logs from database
  const loadLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch recent medication logs (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error: fetchError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', ninetyDaysAgo.toISOString())
        .order('taken_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLogs(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load medication logs:', err);
      setError('Failed to load medication logs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Calculate medication stats
  const stats: MedicationStats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // PrEP logs
    const prepLogs = logs.filter((l) => l.medication_type === 'prep');
    const prepTakenToday = prepLogs.some(
      (l) => l.taken_at.split('T')[0] === today
    );
    const lastPrepDate = prepLogs.length > 0 ? prepLogs[0].taken_at : null;

    // Calculate PrEP streak
    let prepStreak = 0;
    if (prepLogs.length > 0) {
      const uniqueDates = new Set(prepLogs.map((l) => l.taken_at.split('T')[0]));
      const sortedDates = Array.from(uniqueDates).sort().reverse();

      // Check if today or yesterday has a log (streak must be current)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (sortedDates[0] === today || sortedDates[0] === yesterdayStr) {
        let checkDate = new Date(sortedDates[0]);
        for (const dateStr of sortedDates) {
          const logDate = new Date(dateStr);
          const daysDiff = Math.floor(
            (checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff <= 1) {
            prepStreak++;
            checkDate = logDate;
          } else {
            break;
          }
        }
      }
    }

    // DoxyPep logs
    const doxyPepLogs = logs.filter((l) => l.medication_type === 'doxypep');
    const lastDoxyPepDate = doxyPepLogs.length > 0 ? doxyPepLogs[0].taken_at : null;
    const doxyPepThisWeek = doxyPepLogs.filter(
      (l) => new Date(l.taken_at) >= weekAgo
    ).length;

    return {
      prepTakenToday,
      prepStreak,
      lastPrepDate,
      lastDoxyPepDate,
      doxyPepThisWeek,
    };
  }, [logs]);

  // Log a PrEP dose
  const logPrep = async (takenAt?: Date, notes?: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user.id,
        medication_type: 'prep',
        taken_at: (takenAt || new Date()).toISOString(),
        notes: notes || null,
        encounter_id: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    setLogs((prev) => [data, ...prev]);
    return data;
  };

  // Log a DoxyPep dose (optionally linked to an encounter)
  const logDoxyPep = async (
    takenAt?: Date,
    notes?: string,
    encounterId?: string
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user.id,
        medication_type: 'doxypep',
        taken_at: (takenAt || new Date()).toISOString(),
        notes: notes || null,
        encounter_id: encounterId || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    setLogs((prev) => [data, ...prev]);
    return data;
  };

  // Delete a medication log
  const deleteLog = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Get logs for a specific type
  const getLogsByType = (type: 'prep' | 'doxypep') => {
    return logs.filter((l) => l.medication_type === type);
  };

  return {
    logs,
    stats,
    loading,
    error,
    logPrep,
    logDoxyPep,
    deleteLog,
    getLogsByType,
    refresh: loadLogs,
  };
}
