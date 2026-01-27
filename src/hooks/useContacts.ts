// Hook for managing contacts (people you've had encounters with)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Contact, UnifiedContact, User, ContactHivStatus } from '@/types';
import { Encounter } from './useEncounters';

export interface ContactWithEncounters extends Contact {
  encounters?: Encounter[];
}

export interface CreateContactData {
  name: string;
  notes?: string;
  phone_hint?: string;
  social_handle?: string;
  appearance_notes?: string;
  preferred_activities?: string[];
  hiv_status?: ContactHivStatus;
  last_tested_date?: string;
  health_notes?: string;
}

export interface UpdateContactData extends Partial<CreateContactData> {}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactWithEncounters[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts with encounter counts
  const loadContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Fetch encounters to compute stats
      const { data: encountersData, error: encountersError } = await supabase
        .from('encounters')
        .select('id, contact_id, met_at')
        .eq('user_id', user.id)
        .not('contact_id', 'is', null);

      if (encountersError) throw encountersError;

      // Compute encounter counts and last_met for each contact
      const encountersByContact = new Map<string, { count: number; last_met: string }>();
      (encountersData || []).forEach((e) => {
        const existing = encountersByContact.get(e.contact_id);
        if (!existing) {
          encountersByContact.set(e.contact_id, { count: 1, last_met: e.met_at });
        } else {
          existing.count++;
          if (new Date(e.met_at) > new Date(existing.last_met)) {
            existing.last_met = e.met_at;
          }
        }
      });

      // Attach computed stats to contacts
      const contactsWithStats = (contactsData || []).map((contact) => {
        const stats = encountersByContact.get(contact.id);
        return {
          ...contact,
          encounter_count: stats?.count || 0,
          last_met: stats?.last_met || null,
        };
      });

      setContacts(contactsWithStats);
      setError(null);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Create a new contact
  const createContact = async (data: CreateContactData): Promise<Contact> => {
    if (!user) throw new Error('Not authenticated');

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        name: data.name,
        notes: data.notes || null,
        phone_hint: data.phone_hint || null,
        social_handle: data.social_handle || null,
        appearance_notes: data.appearance_notes || null,
        preferred_activities: data.preferred_activities || null,
        hiv_status: data.hiv_status || null,
        last_tested_date: data.last_tested_date || null,
        health_notes: data.health_notes || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Add to local state
    setContacts((prev) => [{ ...newContact, encounter_count: 0, last_met: null }, ...prev]);

    return newContact;
  };

  // Update a contact
  const updateContact = async (id: string, data: UpdateContactData): Promise<Contact> => {
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.notes !== undefined) updates.notes = data.notes || null;
    if (data.phone_hint !== undefined) updates.phone_hint = data.phone_hint || null;
    if (data.social_handle !== undefined) updates.social_handle = data.social_handle || null;
    if (data.appearance_notes !== undefined) updates.appearance_notes = data.appearance_notes || null;
    if (data.preferred_activities !== undefined) updates.preferred_activities = data.preferred_activities || null;
    if (data.hiv_status !== undefined) updates.hiv_status = data.hiv_status || null;
    if (data.last_tested_date !== undefined) updates.last_tested_date = data.last_tested_date || null;
    if (data.health_notes !== undefined) updates.health_notes = data.health_notes || null;

    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update local state
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedContact } : c))
    );

    return updatedContact;
  };

  // Delete a contact
  const deleteContact = async (id: string): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Remove from local state
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Get a single contact by ID
  const getContact = (id: string): ContactWithEncounters | undefined => {
    return contacts.find((c) => c.id === id);
  };

  // Search contacts by name
  const searchContacts = (query: string): ContactWithEncounters[] => {
    if (!query.trim()) return contacts;
    const lowerQuery = query.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  };

  return {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    getContact,
    searchContacts,
    refresh: loadContacts,
  };
}

// Hook to get unified contacts list (app users + manual contacts)
export function useUnifiedContacts() {
  const { user } = useAuth();
  const { contacts: manualContacts, loading: contactsLoading } = useContacts();
  const [appUserContacts, setAppUserContacts] = useState<UnifiedContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Load app users who have encounters
  const loadAppUserContacts = useCallback(async () => {
    if (!user) {
      setAppUserContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch encounters with app users (target_user_id is set)
      const { data: encounters, error: encountersError } = await supabase
        .from('encounters')
        .select(`
          id,
          target_user_id,
          met_at,
          target_user:profiles!encounters_target_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .not('target_user_id', 'is', null);

      if (encountersError) throw encountersError;

      // Group by target_user_id
      const userEncounters = new Map<string, {
        profile: User;
        count: number;
        first_met: string;
        last_met: string;
      }>();

      (encounters || []).forEach((e) => {
        if (!e.target_user_id || !e.target_user) return;

        const existing = userEncounters.get(e.target_user_id);
        if (!existing) {
          userEncounters.set(e.target_user_id, {
            profile: e.target_user as unknown as User,
            count: 1,
            first_met: e.met_at,
            last_met: e.met_at,
          });
        } else {
          existing.count++;
          if (new Date(e.met_at) < new Date(existing.first_met)) {
            existing.first_met = e.met_at;
          }
          if (new Date(e.met_at) > new Date(existing.last_met)) {
            existing.last_met = e.met_at;
          }
        }
      });

      // Convert to UnifiedContact format
      const appUsers: UnifiedContact[] = Array.from(userEncounters.entries()).map(
        ([userId, data]) => ({
          type: 'app_user' as const,
          id: userId,
          name: data.profile.display_name || data.profile.username,
          avatar_url: data.profile.avatar_url,
          encounter_count: data.count,
          first_met: data.first_met,
          last_met: data.last_met,
          profile: data.profile,
        })
      );

      setAppUserContacts(appUsers);
    } catch (err) {
      console.error('Failed to load app user contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppUserContacts();
  }, [loadAppUserContacts]);

  // Combine and sort all contacts
  const allContacts: UnifiedContact[] = useMemo(() => {
    const manual: UnifiedContact[] = manualContacts.map((c) => ({
      type: 'manual' as const,
      id: c.id,
      name: c.name,
      avatar_url: null,
      encounter_count: c.encounter_count || 0,
      first_met: null, // Would need to compute from encounters
      last_met: c.last_met || null,
      contact: c,
    }));

    const all = [...appUserContacts, ...manual];

    // Sort by last_met descending (most recent first)
    return all.sort((a, b) => {
      if (!a.last_met && !b.last_met) return 0;
      if (!a.last_met) return 1;
      if (!b.last_met) return -1;
      return new Date(b.last_met).getTime() - new Date(a.last_met).getTime();
    });
  }, [appUserContacts, manualContacts]);

  return {
    contacts: allContacts,
    appUserContacts,
    manualContacts,
    loading: loading || contactsLoading,
    refresh: loadAppUserContacts,
  };
}
