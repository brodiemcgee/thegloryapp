// Contact detail view - shows full contact info with encounter timeline

'use client';

import { useState } from 'react';
import { UnifiedContact, Contact } from '@/types';
import { useContactEncounters } from '@/hooks/useContactEncounters';
import { useContacts, CreateContactData } from '@/hooks/useContacts';
import { ChevronLeftIcon, EditIcon } from '../icons';
import EncounterCard from '../EncounterCard';
import EncounterDetailModal from '../EncounterDetailModal';
import ContactFormModal from './ContactFormModal';
import { Encounter } from '@/hooks/useEncounters';

// Labels for activities
const ACTIVITY_LABELS: Record<string, string> = {
  top: 'Top',
  bottom: 'Bottom',
  vers: 'Vers',
  vers_top: 'Vers Top',
  vers_bottom: 'Vers Bottom',
  oral: 'Oral',
  rimming: 'Rimming',
  kink: 'Kink',
};

// Labels for HIV status
const HIV_STATUS_LABELS: Record<string, string> = {
  negative: 'Negative',
  positive: 'Positive',
  undetectable: 'Undetectable',
  on_prep: 'On PrEP',
  unknown: 'Unknown',
};

interface ContactDetailViewProps {
  contact: UnifiedContact;
  onBack: () => void;
  onContactUpdated?: () => void;
}

export default function ContactDetailView({
  contact,
  onBack,
  onContactUpdated,
}: ContactDetailViewProps) {
  const { updateContact, deleteContact } = useContacts();
  const { encounters, stats, loading } = useContactEncounters(
    contact.type === 'manual'
      ? { contactId: contact.id }
      : { profileId: contact.id }
  );

  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const manualContact = contact.type === 'manual' ? contact.contact : null;

  const handleUpdate = async (data: CreateContactData) => {
    if (!manualContact) return;
    await updateContact(manualContact.id, data);
    onContactUpdated?.();
  };

  const handleDelete = async () => {
    if (!manualContact) return;
    await deleteContact(manualContact.id);
    onBack();
    onContactUpdated?.();
  };

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-hole-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1">{contact.name}</h1>
        {contact.type === 'manual' && (
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <EditIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Profile Section */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-hole-surface rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {contact.avatar_url ? (
              <img
                src={contact.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-hole-muted">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{contact.name}</h2>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
              contact.type === 'app_user'
                ? 'bg-hole-accent/20 text-hole-accent'
                : 'bg-hole-border text-hole-muted'
            }`}>
              {contact.type === 'app_user' ? 'App User' : 'Manual Contact'}
            </span>

            {contact.type === 'app_user' && contact.profile && (
              <p className="text-sm text-hole-muted mt-2">@{contact.profile.username}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-hole-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-hole-accent">{stats.total}</p>
            <p className="text-xs text-hole-muted">Encounters</p>
          </div>
          <div className="bg-hole-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">
              {stats.avgRating ? stats.avgRating.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-hole-muted">Avg Rating</p>
          </div>
          <div className="bg-hole-surface rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${
              stats.protectionPercentage !== null
                ? stats.protectionPercentage >= 80
                  ? 'text-green-400'
                  : stats.protectionPercentage >= 50
                  ? 'text-yellow-400'
                  : 'text-red-400'
                : ''
            }`}>
              {stats.protectionPercentage !== null ? `${stats.protectionPercentage}%` : '-'}
            </p>
            <p className="text-xs text-hole-muted">Protected</p>
          </div>
        </div>

        {/* First/Last Met */}
        <div className="bg-hole-surface rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-hole-muted">First met</span>
            <span>{formatDate(stats.firstMet)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-hole-muted">Last met</span>
            <span>{formatDate(stats.lastMet)}</span>
          </div>
        </div>

        {/* Manual Contact Details */}
        {manualContact && (
          <>
            {/* Identification */}
            {(manualContact.phone_number || manualContact.social_handle) && (
              <div className="bg-hole-surface rounded-lg p-4 space-y-3">
                <h3 className="text-sm text-hole-muted font-medium">Identification</h3>
                {manualContact.phone_number && (
                  <div>
                    <span className="text-xs text-hole-muted">Phone</span>
                    <p className="text-sm">{manualContact.phone_number}</p>
                  </div>
                )}
                {manualContact.social_handle && (
                  <div>
                    <span className="text-xs text-hole-muted">Social</span>
                    <p className="text-sm">{manualContact.social_handle}</p>
                  </div>
                )}
              </div>
            )}

            {/* Preferences */}
            {manualContact.preferred_activities && manualContact.preferred_activities.length > 0 && (
              <div>
                <h3 className="text-sm text-hole-muted font-medium mb-2">Into</h3>
                <div className="flex flex-wrap gap-2">
                  {manualContact.preferred_activities.map((activity) => (
                    <span
                      key={activity}
                      className="px-3 py-1.5 bg-hole-surface rounded-full text-sm"
                    >
                      {ACTIVITY_LABELS[activity] || activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Health Info */}
            {(manualContact.hiv_status || manualContact.last_tested_date || manualContact.health_notes) && (
              <div className="bg-hole-surface rounded-lg p-4 space-y-3">
                <h3 className="text-sm text-hole-muted font-medium">Health Info</h3>
                {manualContact.hiv_status && (
                  <div className="flex justify-between">
                    <span className="text-sm text-hole-muted">HIV Status</span>
                    <span className="text-sm">{HIV_STATUS_LABELS[manualContact.hiv_status]}</span>
                  </div>
                )}
                {manualContact.last_tested_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-hole-muted">Last Tested</span>
                    <span className="text-sm">{formatDate(manualContact.last_tested_date)}</span>
                  </div>
                )}
                {manualContact.health_notes && (
                  <div>
                    <span className="text-xs text-hole-muted">Notes</span>
                    <p className="text-sm text-gray-300">{manualContact.health_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {manualContact.notes && (
              <div>
                <h3 className="text-sm text-hole-muted font-medium mb-2">Notes</h3>
                <div className="bg-hole-surface rounded-lg p-4">
                  <p className="text-sm text-gray-300">{manualContact.notes}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Top Activities */}
        {stats.topActivities.length > 0 && (
          <div>
            <h3 className="text-sm text-hole-muted font-medium mb-2">Top Activities</h3>
            <div className="flex flex-wrap gap-2">
              {stats.topActivities.map(({ activity, count }) => (
                <span
                  key={activity}
                  className="px-3 py-1.5 bg-hole-surface rounded-full text-sm"
                >
                  {ACTIVITY_LABELS[activity] || activity} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Encounter Timeline */}
        <div>
          <h3 className="text-sm text-hole-muted font-medium mb-3">
            Encounters ({stats.total})
          </h3>

          {loading ? (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-hole-muted text-center">Loading...</p>
            </div>
          ) : encounters.length === 0 ? (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-hole-muted text-center">No encounters recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {encounters.map((encounter) => (
                <EncounterCard
                  key={encounter.id}
                  encounter={encounter}
                  onClick={() => setSelectedEncounter(encounter)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedEncounter && (
        <EncounterDetailModal
          encounter={selectedEncounter}
          onClose={() => setSelectedEncounter(null)}
          onDelete={async () => {
            setSelectedEncounter(null);
          }}
        />
      )}

      {showEditModal && manualContact && (
        <ContactFormModal
          contact={manualContact}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
