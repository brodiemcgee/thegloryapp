// Modal for selecting or creating a contact when logging an encounter

'use client';

import { useState, useMemo } from 'react';
import { XIcon, PlusIcon, SearchIcon } from '../icons';
import { useContacts, ContactWithEncounters, CreateContactData } from '@/hooks/useContacts';
import ContactFormModal from './ContactFormModal';

interface ContactPickerModalProps {
  onClose: () => void;
  onSelect: (contact: ContactWithEncounters) => void;
  onSkip?: () => void;  // Option to skip and use anonymous_name
}

export default function ContactPickerModal({
  onClose,
  onSelect,
  onSkip,
}: ContactPickerModalProps) {
  const { contacts, loading, createContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.social_handle?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleCreate = async (data: CreateContactData) => {
    const newContact = await createContact(data);
    onSelect(newContact);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border flex-shrink-0">
          <h2 className="text-lg font-semibold">Select Contact</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-hole-border flex-shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-hole-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full bg-hole-surface border border-hole-border rounded-lg py-3 pl-10 pr-4 outline-none focus:border-hole-accent"
            />
          </div>
        </div>

        {/* Create New Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 p-4 hover:bg-hole-surface transition-colors border-b border-hole-border flex-shrink-0"
        >
          <div className="w-10 h-10 bg-hole-accent/20 rounded-full flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-hole-accent" />
          </div>
          <span className="font-medium text-hole-accent">Create New Contact</span>
        </button>

        {/* Contacts List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-hole-muted">Loading...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-hole-muted">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </div>
          ) : (
            <div className="divide-y divide-hole-border">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-hole-surface transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg text-hole-muted">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-sm text-hole-muted">
                      {contact.encounter_count || 0} encounter{(contact.encounter_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skip Option */}
        {onSkip && (
          <div className="p-4 border-t border-hole-border flex-shrink-0">
            <button
              onClick={onSkip}
              className="w-full py-3 text-hole-muted hover:text-white transition-colors text-sm"
            >
              Skip - log without contact
            </button>
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <ContactFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
