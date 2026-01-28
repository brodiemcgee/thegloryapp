// Modal for adding/editing a manual contact

'use client';

import { useState, useEffect } from 'react';
import { XIcon, ChevronDownIcon } from '../icons';
import { Contact, ContactHivStatus } from '@/types';
import { CreateContactData, UpdateContactData } from '@/hooks/useContacts';

// Activity options for what they're into
const ACTIVITY_OPTIONS = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'vers', label: 'Vers' },
  { id: 'vers_top', label: 'Vers Top' },
  { id: 'vers_bottom', label: 'Vers Bottom' },
  { id: 'oral', label: 'Oral' },
  { id: 'rimming', label: 'Rimming' },
  { id: 'kink', label: 'Kink' },
];

const HIV_STATUS_OPTIONS: { value: ContactHivStatus; label: string }[] = [
  { value: 'negative', label: 'Negative' },
  { value: 'positive', label: 'Positive' },
  { value: 'undetectable', label: 'Undetectable' },
  { value: 'on_prep', label: 'On PrEP' },
  { value: 'unknown', label: 'Unknown' },
];

interface ContactFormModalProps {
  contact?: Contact;  // If provided, edit mode
  onClose: () => void;
  onSave: (data: CreateContactData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function ContactFormModal({
  contact,
  onClose,
  onSave,
  onDelete,
}: ContactFormModalProps) {
  const isEdit = !!contact;

  const [name, setName] = useState(contact?.name || '');
  const [notes, setNotes] = useState(contact?.notes || '');
  const [phoneHint, setPhoneHint] = useState(contact?.phone_hint || '');
  const [socialHandle, setSocialHandle] = useState(contact?.social_handle || '');
  const [preferredActivities, setPreferredActivities] = useState<string[]>(contact?.preferred_activities || []);
  const [hivStatus, setHivStatus] = useState<ContactHivStatus | ''>(contact?.hiv_status || '');
  const [lastTestedDate, setLastTestedDate] = useState(contact?.last_tested_date || '');
  const [healthNotes, setHealthNotes] = useState(contact?.health_notes || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHealthSection, setShowHealthSection] = useState(false);

  // Expand health section if any health data exists
  useEffect(() => {
    if (contact?.hiv_status || contact?.last_tested_date || contact?.health_notes) {
      setShowHealthSection(true);
    }
  }, [contact]);

  const toggleActivity = (activityId: string) => {
    setPreferredActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((a) => a !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        notes: notes.trim() || undefined,
        phone_hint: phoneHint.trim() || undefined,
        social_handle: socialHandle.trim() || undefined,
        preferred_activities: preferredActivities.length > 0 ? preferredActivities : undefined,
        hiv_status: hivStatus || undefined,
        last_tested_date: lastTestedDate || undefined,
        health_notes: healthNotes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save contact:', err);
      alert('Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setSaving(true);
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Name (required) */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What do you call them?"
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
          />
        </div>

        {/* Identification Section */}
        <div className="space-y-3">
          <h3 className="text-sm text-hole-muted font-medium">Identification</h3>

          <div>
            <label className="text-xs text-hole-muted mb-1 block">Phone Hint</label>
            <input
              type="text"
              value={phoneHint}
              onChange={(e) => setPhoneHint(e.target.value)}
              placeholder="e.g., ends in 1234"
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 text-sm outline-none focus:border-hole-accent"
            />
          </div>

          <div>
            <label className="text-xs text-hole-muted mb-1 block">Social Handle</label>
            <input
              type="text"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
              placeholder="Instagram, Twitter, etc."
              className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 text-sm outline-none focus:border-hole-accent"
            />
          </div>

        </div>

        {/* Preferred Activities */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Into</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => toggleActivity(activity.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  preferredActivities.includes(activity.id)
                    ? 'bg-hole-accent text-white'
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {activity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health Section (collapsible) */}
        <div className="border-t border-hole-border pt-4">
          <button
            type="button"
            onClick={() => setShowHealthSection(!showHealthSection)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm text-hole-muted font-medium">Health Info</span>
            <ChevronDownIcon className={`w-4 h-4 text-hole-muted transition-transform ${showHealthSection ? 'rotate-180' : ''}`} />
          </button>

          {showHealthSection && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-hole-muted mb-1 block">HIV Status</label>
                <select
                  value={hivStatus}
                  onChange={(e) => setHivStatus(e.target.value as ContactHivStatus | '')}
                  className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 text-sm outline-none focus:border-hole-accent"
                >
                  <option value="">Not specified</option>
                  {HIV_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-hole-muted mb-1 block">Last Tested</label>
                <input
                  type="date"
                  value={lastTestedDate}
                  onChange={(e) => setLastTestedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 text-sm outline-none focus:border-hole-accent"
                />
              </div>

              <div>
                <label className="text-xs text-hole-muted mb-1 block">Health Notes</label>
                <textarea
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="Any relevant health info..."
                  className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 text-sm outline-none focus:border-hole-accent resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes about this person..."
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isEdit && onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-hole-bg/95 flex items-center justify-center p-4">
            <div className="bg-hole-surface border border-hole-border rounded-lg p-4 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-semibold">Delete Contact?</h3>
              <p className="text-sm text-hole-muted">
                This will permanently delete {name} from your contacts. Encounters linked to this contact will be preserved but no longer linked.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-hole-border rounded-lg font-medium hover:bg-hole-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
