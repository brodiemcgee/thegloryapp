// Shared modal for logging encounters (used by ChatView, UserProfile, and HealthView)

'use client';

import { useState } from 'react';
import { XIcon } from './icons';
import { ACTIVITY_OPTIONS } from './ManualEncounterModal';
import LocationPicker from './LocationPicker';
import { LocationData } from '@/hooks/useSavedLocations';

interface EncounterFormModalProps {
  onClose: () => void;
  onSave: (encounter: {
    met_at: string;
    notes?: string;
    rating?: number;
    activities?: string[];
    location_type?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    protection_used?: 'yes' | 'no' | 'na';
  }) => Promise<void>;
  username?: string; // Optional - for displaying who the encounter is with
  previousEncounterCount?: number; // How many times you've met before
}

export default function EncounterFormModal({
  onClose,
  onSave,
  username,
  previousEncounterCount = 0,
}: EncounterFormModalProps) {
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

  const handleSave = async () => {
    if (!metAt) return;

    try {
      setSaving(true);
      await onSave({
        met_at: metAt,
        notes: notes.trim() || undefined,
        rating: rating || undefined,
        activities: activities.length > 0 ? activities : undefined,
        location_type: location?.name || undefined,
        location_lat: location?.lat && location.lat !== 0 ? location.lat : undefined,
        location_lng: location?.lng && location.lng !== 0 ? location.lng : undefined,
        location_address: location?.address || undefined,
        protection_used: protectionUsed || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save encounter:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg flex flex-col max-h-[85vh] mb-16 sm:mb-0">
        {/* Fixed header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border shrink-0">
          <h2 className="text-lg font-semibold">
            {username ? `Log Encounter with ${username}` : 'Log Encounter'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* Previous encounters summary */}
        {previousEncounterCount > 0 && (
          <div className="bg-hole-surface rounded-lg p-3">
            <p className="text-sm text-hole-muted">
              You've logged {previousEncounterCount} encounter{previousEncounterCount !== 1 ? 's' : ''} with {username || 'this person'}
            </p>
          </div>
        )}

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
              onClick={() => setProtectionUsed(protectionUsed === 'no' ? '' : 'no')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                protectionUsed === 'no'
                  ? 'bg-red-500 text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              No
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
            placeholder="Any additional details..."
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
            rows={3}
          />
        </div>
        </div>

        {/* Fixed footer with buttons */}
        <div className="p-4 border-t border-hole-border shrink-0 bg-hole-bg">
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
      </div>
    </div>
  );
}
