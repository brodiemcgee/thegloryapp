// Modal for logging a medication dose (PrEP or DoxyPep)

'use client';

import { useState } from 'react';
import { XIcon } from './icons';

interface MedicationLogModalProps {
  type: 'prep' | 'doxypep';
  onClose: () => void;
  onSave: (takenAt?: Date, notes?: string) => Promise<void>;
}

export default function MedicationLogModal({
  type,
  onClose,
  onSave,
}: MedicationLogModalProps) {
  const [takenAt, setTakenAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(
        takenAt ? new Date(takenAt) : undefined,
        notes.trim() || undefined
      );
      onClose();
    } catch (err) {
      console.error('Failed to log medication:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const title = type === 'prep' ? 'Log PrEP Dose' : 'Log DoxyPep Dose';
  const description =
    type === 'prep'
      ? 'Record your daily PrEP dose.'
      : 'Record a DoxyPep dose (typically within 72 hours of an encounter).';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-hole-muted">{description}</p>

        {/* Taken At */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">
            When did you take it?
          </label>
          <input
            type="datetime-local"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
          />
        </div>

        {/* Quick Time Options */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTakenAt(new Date().toISOString().slice(0, 16))}
            className="flex-1 py-2 bg-hole-surface border border-hole-border rounded-lg text-sm hover:bg-hole-border transition-colors"
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => {
              const date = new Date();
              date.setHours(9, 0, 0, 0);
              setTakenAt(date.toISOString().slice(0, 16));
            }}
            className="flex-1 py-2 bg-hole-surface border border-hole-border rounded-lg text-sm hover:bg-hole-border transition-colors"
          >
            9 AM Today
          </button>
          <button
            type="button"
            onClick={() => {
              const date = new Date();
              date.setHours(21, 0, 0, 0);
              setTakenAt(date.toISOString().slice(0, 16));
            }}
            className="flex-1 py-2 bg-hole-surface border border-hole-border rounded-lg text-sm hover:bg-hole-border transition-colors"
          >
            9 PM Today
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
            rows={2}
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
            disabled={saving}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Dose'}
          </button>
        </div>
      </div>
    </div>
  );
}
