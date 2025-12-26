// Supabase client configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client - will use placeholder values during build, real values at runtime
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// Auth helper functions
export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function signInWithEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  return { data, error };
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Realtime channel helpers
export function subscribeToPresence(channelName: string, callbacks: {
  onSync?: () => void;
  onJoin?: (key: string, newPresence: unknown) => void;
  onLeave?: (key: string, leftPresence: unknown) => void;
}) {
  const channel = supabase.channel(channelName);

  channel
    .on('presence', { event: 'sync' }, () => callbacks.onSync?.())
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onJoin?.(key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onLeave?.(key, leftPresences);
    })
    .subscribe();

  return channel;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (payload: unknown) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
}
