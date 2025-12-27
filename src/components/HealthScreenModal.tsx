// Modal for adding/editing a health screen record

'use client';

import { useState } from 'react';
import { XIcon } from './icons';

interface HealthScreenModalProps {
  onClose: () => void;
  onSave: (
    testDate: string,
    result?: 'all_clear' | 'needs_followup' | 'pending',
    notes?: string
  ) => Promise<void>;
  initialData?: {
    testDate: string;
    result?: 'all_clear' | 'needs_followup' | 'pending' | null;
    notes?: string | null;
  };
}

export default function HealthScreenModal({
  onClose,
  onSave,
  initialData,
}: HealthScreenModalProps) {
  const [testDate, setTestDate] = useState(
    initialData?.testDate || new Date().toISOString().split('T')[0]
  );
  const [result, setResult] = useState<'all_clear' | 'needs_followup' | 'pending' | ''>(
    initialData?.result || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!testDate) return;

    try {
      setSaving(true);
      await onSave(testDate, result || undefined, notes || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to save health screen:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resultOptions: { value: 'all_clear' | 'needs_followup' | 'pending'; label: string }[] = [
    { value: 'all_clear', label: 'All Clear' },
    { value: 'needs_followup', label: 'Needs Follow-up' },
    { value: 'pending', label: 'Pending Results' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Health Screen' : 'Log Health Screen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Test Date */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Test Date</label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
          />
        </div>

        {/* Result */}
        <div>
          <label className="text-sm text-hole-muted mb-2 block">Result (optional)</label>
          <div className="flex flex-wrap gap-2">
            {resultOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResult(result === opt.value ? '' : opt.value)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  result === opt.value
                    ? opt.value === 'all_clear'
                      ? 'bg-green-500 text-white'
                      : opt.value === 'needs_followup'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {opt.label}
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!testDate || saving}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
