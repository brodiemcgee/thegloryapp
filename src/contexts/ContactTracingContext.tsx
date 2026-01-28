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
  time_ago_text: string | null;  // Vague timing like "about 2 weeks ago"
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

// Contact that needs to be notified
export interface ContactToNotify {
  contact_type: 'app_user' | 'manual_with_phone' | 'manual_no_phone';
  contact_id: string;
  contact_name: string;
  phone_number: string | null;
  time_ago_text: string;
  met_at: string;
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

interface NotificationResult {
  appUsersNotified: number;
  smsMessagesSent: number;
  manualContactsNoPhone: ContactToNotify[];  // Contacts user needs to reach out to manually
}

interface ContactTracingContextType {
  notifications: ContactTraceNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendAllNotifications: (stiTypes: string[], testDate: string) => Promise<NotificationResult>;
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

  // Send all notifications for positive results
  // - App users get in-app notifications
  // - Manual contacts with phone numbers get SMS
  // - Manual contacts without phone numbers are returned for user to contact manually
  const sendAllNotifications = async (
    stiTypes: string[],
    testDate: string
  ): Promise<NotificationResult> => {
    if (!user) throw new Error('Not authenticated');

    const result: NotificationResult = {
      appUsersNotified: 0,
      smsMessagesSent: 0,
      manualContactsNoPhone: [],
    };

    // Track contacts we've already processed to avoid duplicates across STI types
    const processedAppUsers = new Set<string>();
    const processedSmsContacts = new Set<string>();
    const processedNoPhoneContacts = new Set<string>();

    for (const stiType of stiTypes) {
      // Get all contacts for this STI type
      const { data: contacts, error: fetchError } = await supabase.rpc(
        'get_contacts_for_notification',
        {
          p_user_id: user.id,
          p_test_date: testDate,
        }
      );

      if (fetchError) {
        console.error('Error fetching contacts:', fetchError);
        continue;
      }

      const allContacts = (contacts || []) as ContactToNotify[];

      // Process app users - send in-app notifications
      for (const contact of allContacts.filter(c => c.contact_type === 'app_user')) {
        if (processedAppUsers.has(contact.contact_id)) continue;
        processedAppUsers.add(contact.contact_id);

        // Send in-app notification via the existing RPC
        const { data: count, error: rpcError } = await supabase.rpc(
          'send_contact_trace_notifications',
          {
            p_user_id: user.id,
            p_sti_type: stiType,
            p_test_date: testDate,
          }
        );

        if (!rpcError && count) {
          result.appUsersNotified += count as number;

          // Trigger push notifications
          try {
            supabase.functions.invoke('send-push-notification', {
              body: { user_id: contact.contact_id },
            }).catch(err => {
              console.warn('Push notification failed:', err);
            });
          } catch (pushErr) {
            console.warn('Failed to send push notification:', pushErr);
          }
        }
      }

      // Process manual contacts with phone numbers - send SMS
      for (const contact of allContacts.filter(c => c.contact_type === 'manual_with_phone')) {
        if (processedSmsContacts.has(contact.contact_id)) continue;
        processedSmsContacts.add(contact.contact_id);

        try {
          const { error: smsError } = await supabase.functions.invoke('send-contact-trace-sms', {
            body: {
              phone_number: contact.phone_number,
              sti_type: stiType,
              time_ago_text: contact.time_ago_text,
            },
          });

          if (!smsError) {
            result.smsMessagesSent++;
          } else {
            console.warn('SMS send failed:', smsError);
          }
        } catch (smsErr) {
          console.warn('Failed to send SMS:', smsErr);
        }
      }

      // Collect manual contacts without phone numbers
      for (const contact of allContacts.filter(c => c.contact_type === 'manual_no_phone')) {
        if (processedNoPhoneContacts.has(contact.contact_id)) continue;
        processedNoPhoneContacts.add(contact.contact_id);
        result.manualContactsNoPhone.push(contact);
      }
    }

    return result;
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
        sendAllNotifications,
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
