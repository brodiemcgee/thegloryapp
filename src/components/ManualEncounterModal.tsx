// Modal for adding a manual encounter (person met outside the app)

'use client';

import { useState } from 'react';
import { XIcon } from './icons';

interface ManualEncounterModalProps {
  onClose: () => void;
  onSave: (
    metAt: string,
    name?: string,
    rating?: number,
    notes?: string
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!metAt) return;

    try {
      setSaving(true);
      await onSave(
        metAt,
        name.trim() || undefined,
        rating || undefined,
        notes.trim() || undefined
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
    </div>
  );
}
