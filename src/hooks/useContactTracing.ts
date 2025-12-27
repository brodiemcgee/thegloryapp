// Hook for managing anonymous contact tracing notifications

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface ContactTraceNotification {
  id: string;
  recipient_user_id: string;
  sti_type: string;
  exposure_date: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

// STI types that can be reported
export const STI_TYPES = [
  { id: 'chlamydia', label: 'Chlamydia', lookbackDays: 30 },
  { id: 'gonorrhea', label: 'Gonorrhea', lookbackDays: 30 },
  { id: 'syphilis', label: 'Syphilis', lookbackDays: 90 },
  { id: 'hiv', label: 'HIV', lookbackDays: 90 },
  { id: 'herpes', label: 'Herpes', lookbackDays: 30 },
  { id: 'hpv', label: 'HPV', lookbackDays: 90 },
  { id: 'mpox', label: 'Mpox', lookbackDays: 21 },
  { id: 'other', label: 'Other STI', lookbackDays: 30 },
];

export function useContactTracing() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ContactTraceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('contact_trace_notifications')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => n.read_at === null).length);
      setError(null);
    } catch (err) {
      console.error('Failed to load contact trace notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error: updateError } = await supabase
      .from('contact_trace_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_user_id', user.id);

    if (updateError) throw updateError;

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) throw new Error('Not authenticated');

    const { error: updateError } = await supabase
      .from('contact_trace_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_user_id', user.id)
      .is('read_at', null);

    if (updateError) throw updateError;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  // Send anonymous notifications for a positive result
  // This calls the SECURITY DEFINER function in the database
  const sendNotifications = async (stiType: string, testDate: string) => {
    if (!user) throw new Error('Not authenticated');

    const stiConfig = STI_TYPES.find((s) => s.id === stiType);
    const lookbackDays = stiConfig?.lookbackDays || 30;

    const { data, error: rpcError } = await supabase.rpc(
      'send_contact_trace_notifications',
      {
        p_user_id: user.id,
        p_sti_type: stiType,
        p_test_date: testDate,
        p_lookback_days: lookbackDays,
      }
    );

    if (rpcError) throw rpcError;

    const notificationCount = data as number;

    // If notifications were sent, trigger push notifications for recipients
    if (notificationCount > 0) {
      try {
        // Get recent notifications we just created (within last minute)
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const { data: recentNotifications } = await supabase
          .from('contact_trace_notifications')
          .select('recipient_user_id')
          .eq('sti_type', stiType)
          .gte('created_at', oneMinuteAgo);

        if (recentNotifications) {
          // Get unique recipient IDs
          const recipientIds = Array.from(new Set(recentNotifications.map(n => n.recipient_user_id)));

          // Send push notification to each recipient (fire and forget)
          for (const recipientId of recipientIds) {
            supabase.functions.invoke('send-push-notification', {
              body: { user_id: recipientId },
            }).catch(err => {
              console.warn('Push notification failed:', err);
            });
          }
        }
      } catch (pushErr) {
        // Don't fail the main operation if push fails
        console.warn('Failed to send push notifications:', pushErr);
      }
    }

    return notificationCount;
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.filter((n) => n.read_at === null);
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    sendNotifications,
    getUnreadNotifications,
    refresh: loadNotifications,
  };
}
