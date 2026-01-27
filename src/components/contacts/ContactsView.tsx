// Main contacts view - lists all contacts with filtering tabs

'use client';

import { useState, useMemo } from 'react';
import { XIcon, PlusIcon, SearchIcon } from '../icons';
import { useUnifiedContacts, useContacts, CreateContactData } from '@/hooks/useContacts';
import { UnifiedContact } from '@/types';
import ContactCard from './ContactCard';
import ContactDetailView from './ContactDetailView';
import ContactFormModal from './ContactFormModal';

type TabType = 'all' | 'app' | 'manual';

interface ContactsViewProps {
  onClose: () => void;
}

export default function ContactsView({ onClose }: ContactsViewProps) {
  const { contacts, appUserContacts, manualContacts, loading, refresh } = useUnifiedContacts();
  const { createContact } = useContacts();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<UnifiedContact | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter contacts based on active tab and search
  const filteredContacts = useMemo(() => {
    let list: UnifiedContact[];

    switch (activeTab) {
      case 'app':
        list = appUserContacts;
        break;
      case 'manual':
        list = contacts.filter((c) => c.type === 'manual');
        break;
      default:
        list = contacts;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(query));
  }, [contacts, appUserContacts, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = {
    all: contacts.length,
    app: appUserContacts.length,
    manual: manualContacts.length,
  };

  if (selectedContact) {
    return (
      <ContactDetailView
        contact={selectedContact}
        onBack={() => setSelectedContact(null)}
        onContactUpdated={() => {
          refresh();
          setSelectedContact(null);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        <h1 className="text-lg font-semibold">Contacts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            title="Add contact"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-hole-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-hole-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-hole-surface border border-hole-border rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-hole-accent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hole-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-hole-accent border-b-2 border-hole-accent'
              : 'text-hole-muted hover:text-white'
          }`}
        >
          All ({tabCounts.all})
        </button>
        <button
          onClick={() => setActiveTab('app')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'app'
              ? 'text-hole-accent border-b-2 border-hole-accent'
              : 'text-hole-muted hover:text-white'
          }`}
        >
          App Users ({tabCounts.app})
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-hole-accent border-b-2 border-hole-accent'
              : 'text-hole-muted hover:text-white'
          }`}
        >
          Manual ({tabCounts.manual})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-hole-muted">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {searchQuery ? (
              <>
                <p className="text-hole-muted mb-2">No contacts found</p>
                <p className="text-sm text-hole-muted">Try a different search term</p>
              </>
            ) : activeTab === 'all' ? (
              <>
                <p className="text-hole-muted mb-2">No contacts yet</p>
                <p className="text-sm text-hole-muted mb-4">
                  Contacts are created when you log encounters with people.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-hole-accent text-white rounded-lg text-sm font-medium hover:bg-hole-accent-hover transition-colors"
                >
                  Add Manual Contact
                </button>
              </>
            ) : activeTab === 'app' ? (
              <>
                <p className="text-hole-muted mb-2">No app user contacts</p>
                <p className="text-sm text-hole-muted">
                  Log encounters with app users to see them here.
                </p>
              </>
            ) : (
              <>
                <p className="text-hole-muted mb-2">No manual contacts</p>
                <p className="text-sm text-hole-muted mb-4">
                  Add contacts for people you meet outside the app.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-hole-accent text-white rounded-lg text-sm font-medium hover:bg-hole-accent-hover transition-colors"
                >
                  Add Contact
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={`${contact.type}-${contact.id}`}
                contact={contact}
                onClick={() => setSelectedContact(contact)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <ContactFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            await createContact(data as CreateContactData);
            setShowCreateModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
