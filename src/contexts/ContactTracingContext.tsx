// Context for sharing contact tracing state across components

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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

interface ContactTracingContextType {
  notifications: ContactTraceNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotifications: (stiType: string, testDate: string) => Promise<number>;
  getUnreadNotifications: () => ContactTraceNotification[];
  refresh: () => Promise<void>;
}

const ContactTracingContext = createContext<ContactTracingContextType | null>(null);

export function ContactTracingProvider({ children }: { children: ReactNode }) {
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
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const { data: recentNotifications } = await supabase
          .from('contact_trace_notifications')
          .select('recipient_user_id')
          .eq('sti_type', stiType)
          .gte('created_at', oneMinuteAgo);

        if (recentNotifications) {
          const recipientIds = Array.from(new Set(recentNotifications.map(n => n.recipient_user_id)));

          for (const recipientId of recipientIds) {
            supabase.functions.invoke('send-push-notification', {
              body: { user_id: recipientId },
            }).catch(err => {
              console.warn('Push notification failed:', err);
            });
          }
        }
      } catch (pushErr) {
        console.warn('Failed to send push notifications:', pushErr);
      }
    }

    return notificationCount;
  };

  // Get unread notifications
  const getUnreadNotifications = () => {
    return notifications.filter((n) => n.read_at === null);
  };

  return (
    <ContactTracingContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        sendNotifications,
        getUnreadNotifications,
        refresh: loadNotifications,
      }}
    >
      {children}
    </ContactTracingContext.Provider>
  );
}

export function useContactTracingContext() {
  const context = useContext(ContactTracingContext);
  if (!context) {
    throw new Error('useContactTracingContext must be used within a ContactTracingProvider');
  }
  return context;
}
