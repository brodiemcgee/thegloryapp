// Modal for adding a manual encounter (person met outside the app)

'use client';

import { useState } from 'react';
import { XIcon } from './icons';

// Activity types for encounter logging
const ACTIVITY_OPTIONS = [
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

const LOCATION_OPTIONS = [
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

// Experience/vibe tags for encounter analytics
export const EXPERIENCE_TAG_OPTIONS = [
  { id: 'hot', label: '🔥 Hot', color: 'bg-red-500' },
  { id: 'fun', label: '🎉 Fun', color: 'bg-purple-500' },
  { id: 'romantic', label: '💕 Romantic', color: 'bg-pink-500' },
  { id: 'intense', label: '⚡ Intense', color: 'bg-orange-500' },
  { id: 'chill', label: '😌 Chill', color: 'bg-blue-500' },
  { id: 'quick', label: '⏱️ Quick', color: 'bg-gray-500' },
  { id: 'marathon', label: '🏃 Marathon', color: 'bg-green-500' },
  { id: 'awkward', label: '😬 Awkward', color: 'bg-yellow-600' },
  { id: 'kinky', label: '🔗 Kinky', color: 'bg-violet-500' },
  { id: 'vanilla', label: '🍦 Vanilla', color: 'bg-amber-200' },
  { id: 'connection', label: '✨ Connection', color: 'bg-cyan-500' },
  { id: 'anonymous', label: '👤 Anonymous', color: 'bg-gray-600' },
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
    protectionUsed?: 'yes' | 'no' | 'partial',
    experienceTags?: string[]
  ) => Promise<void>;
}

export default function ManualEncounterModal({
  onClose,
  onSave,
}: ManualEncounterModalProps) {
  const [name, setName] = useState('');
  const [metAt, setMetAt] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [experienceTags, setExperienceTags] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<string>('');
  const [protectionUsed, setProtectionUsed] = useState<'yes' | 'no' | 'partial' | ''>('');
  const [saving, setSaving] = useState(false);

  const toggleActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((a) => a !== activityId)
        : [...prev, activityId]
    );
  };

  const toggleExperienceTag = (tagId: string) => {
    setExperienceTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (!metAt) return;

    try {
      setSaving(true);
      await onSave(
        metAt,
        name.trim() || undefined,
        rating || undefined,
        notes.trim() || undefined,
        activities.length > 0 ? activities : undefined,
        locationType || undefined,
        protectionUsed || undefined,
        experienceTags.length > 0 ? experienceTags : undefined
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

        {/* Name */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name or leave blank for anonymous"
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
          />
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
          <label className="text-sm text-hole-muted mb-2 block">Where? (optional)</label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationType(locationType === loc.id ? '' : loc.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  locationType === loc.id
                    ? 'bg-hole-accent text-white'
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
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
              onClick={() => setProtectionUsed(protectionUsed === 'partial' ? '' : 'partial')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                protectionUsed === 'partial'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              Partial
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

        {/* Experience Tags */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">How would you describe it? (optional)</label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleExperienceTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  experienceTags.includes(tag.id)
                    ? `${tag.color} text-white`
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {tag.label}
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
    </div>
  );
}
