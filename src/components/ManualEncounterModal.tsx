// Modal for adding a manual encounter (person met outside the app)

'use client';

import { useState } from 'react';
import { XIcon, ChevronRightIcon } from './icons';
import LocationPicker from './LocationPicker';
import { LocationData } from '@/hooks/useSavedLocations';
import { ContactPickerModal } from './contacts';
import { ContactWithEncounters } from '@/hooks/useContacts';

// Activity types for encounter logging
export const ACTIVITY_OPTIONS = [
  { id: 'topped', label: 'Topped', category: 'anal' },
  { id: 'bottomed', label: 'Bottomed', category: 'anal' },
  { id: 'vers', label: 'Vers', category: 'anal' },
  { id: 'gave_oral', label: 'Gave Oral', category: 'oral' },
  { id: 'received_oral', label: 'Received Oral', category: 'oral' },
  { id: 'mutual_oral', label: 'Mutual Oral', category: 'oral' },
  { id: 'rimming_gave', label: 'Gave Rimming', category: 'oral' },
  { id: 'rimming_received', label: 'Received Rimming', category: 'oral' },
  { id: 'mutual_jo', label: 'Mutual JO', category: 'other' },
  { id: 'making_out', label: 'Making Out', category: 'other' },
  { id: 'other', label: 'Other', category: 'other' },
];

export const LOCATION_OPTIONS = [
  { id: 'my_place', label: 'My Place' },
  { id: 'their_place', label: 'Their Place' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'sauna', label: 'Sauna' },
  { id: 'bathhouse', label: 'Bathhouse' },
  { id: 'park', label: 'Park' },
  { id: 'car', label: 'Car' },
  { id: 'gym', label: 'Gym' },
  { id: 'bar', label: 'Bar/Club' },
  { id: 'other', label: 'Other' },
];

interface ManualEncounterModalProps {
  onClose: () => void;
  onSave: (
    metAt: string,
    name?: string,
    rating?: number,
    notes?: string,
    activities?: string[],
    locationType?: string,
    protectionUsed?: 'yes' | 'no' | 'na',
    locationLat?: number,
    locationLng?: number,
    locationAddress?: string,
    contactId?: string
  ) => Promise<void>;
}

export default function ManualEncounterModal({
  onClose,
  onSave,
}: ManualEncounterModalProps) {
  const [selectedContact, setSelectedContact] = useState<ContactWithEncounters | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [name, setName] = useState('');
  const [metAt, setMetAt] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [protectionUsed, setProtectionUsed] = useState<'yes' | 'no' | 'na' | ''>('');
  const [saving, setSaving] = useState(false);

  const toggleActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((a) => a !== activityId)
        : [...prev, activityId]
    );
  };

  const handleContactSelect = (contact: ContactWithEncounters) => {
    setSelectedContact(contact);
    setName(contact.name);
    setShowContactPicker(false);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setName('');
  };

  const handleSave = async () => {
    if (!metAt) return;

    try {
      setSaving(true);
      await onSave(
        metAt,
        selectedContact ? undefined : (name.trim() || undefined),
        rating || undefined,
        notes.trim() || undefined,
        activities.length > 0 ? activities : undefined,
        location?.name || undefined,
        protectionUsed || undefined,
        location?.lat && location.lat !== 0 ? location.lat : undefined,
        location?.lng && location.lng !== 0 ? location.lng : undefined,
        location?.address || undefined,
        selectedContact?.id
      );
      onClose();
    } catch (err) {
      console.error('Failed to save encounter:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Log Manual Encounter</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-hole-muted">
          Log an encounter with someone you met outside the app.
        </p>

        {/* Contact Selection */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Who?</label>
          {selectedContact ? (
            <div className="flex items-center gap-3 bg-hole-surface border border-hole-border rounded-lg p-3">
              <div className="w-10 h-10 bg-hole-border rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg text-hole-muted">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedContact.name}</p>
                <p className="text-sm text-hole-muted">
                  {selectedContact.encounter_count || 0} previous encounter{(selectedContact.encounter_count || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearContact}
                className="p-1 hover:bg-hole-border rounded transition-colors"
              >
                <XIcon className="w-4 h-4 text-hole-muted" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowContactPicker(true)}
              className="w-full flex items-center justify-between bg-hole-surface border border-hole-border rounded-lg p-3 hover:bg-hole-border transition-colors text-left"
            >
              <span className="text-hole-muted">Select or create contact...</span>
              <ChevronRightIcon className="w-5 h-5 text-hole-muted" />
            </button>
          )}
          {!selectedContact && (
            <p className="text-xs text-hole-muted mt-1">
              Or leave empty for anonymous encounter
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">When did you meet?</label>
          <input
            type="date"
            value={metAt}
            onChange={(e) => setMetAt(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
          />
        </div>

        {/* Activities */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">What happened? (optional)</label>

          {/* Anal */}
          <div className="mb-2">
            <p className="text-xs text-hole-muted mb-1">Anal</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.filter((a) => a.category === 'anal').map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => toggleActivity(activity.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activities.includes(activity.id)
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  {activity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Oral */}
          <div className="mb-2">
            <p className="text-xs text-hole-muted mb-1">Oral</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.filter((a) => a.category === 'oral').map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => toggleActivity(activity.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activities.includes(activity.id)
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  {activity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <p className="text-xs text-hole-muted mb-1">Other</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.filter((a) => a.category === 'other').map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => toggleActivity(activity.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activities.includes(activity.id)
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  {activity.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Where?</label>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        {/* Protection */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Protection? (optional)</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setProtectionUsed(protectionUsed === 'yes' ? '' : 'yes')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                protectionUsed === 'yes'
                  ? 'bg-green-500 text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setProtectionUsed(protectionUsed === 'na' ? '' : 'na')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                protectionUsed === 'na'
                  ? 'bg-gray-500 text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              N/A
            </button>
            <button
              type="button"
              onClick={() => setProtectionUsed(protectionUsed === 'no' ? '' : 'no')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                protectionUsed === 'no'
                  ? 'bg-red-500 text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">How was it? (optional)</label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(rating === star ? null : star)}
                className="p-1 transition-colors"
              >
                <svg
                  className={`w-8 h-8 ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-hole-muted'
                  }`}
                  fill={rating && star <= rating ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened? How was it?"
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!metAt || saving}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Encounter'}
          </button>
        </div>
      </div>

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <ContactPickerModal
          onClose={() => setShowContactPicker(false)}
          onSelect={handleContactSelect}
          onSkip={() => setShowContactPicker(false)}
        />
      )}
    </div>
  );
}
