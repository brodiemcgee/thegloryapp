// Modal for adding/editing a health screen record

'use client';

import { useState, useMemo } from 'react';
import { XIcon } from './icons';
import { useContactTracing, STI_TYPES } from '@/hooks/useContactTracing';
import { useHealthSettings } from '@/hooks/useHealthSettings';
import { StiResult, StiResults, deriveStatusFromResults } from '@/hooks/useHealthScreens';

// Filtered STI list (exclude 'other')
const TESTABLE_STIS = STI_TYPES.filter(s => s.id !== 'other');

interface HealthScreenModalProps {
  onClose: () => void;
  onSave: (
    testDate: string,
    resultsDetail: StiResults,
    notes?: string
  ) => Promise<void>;
  initialData?: {
    testDate: string;
    resultsDetail?: StiResults | null;
    notes?: string | null;
  };
}

export default function HealthScreenModal({
  onClose,
  onSave,
  initialData,
}: HealthScreenModalProps) {
  const { sendNotifications } = useContactTracing();
  const { settings } = useHealthSettings();

  const [testDate, setTestDate] = useState(
    initialData?.testDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [stiResults, setStiResults] = useState<StiResults>(
    initialData?.resultsDetail || {}
  );
  const [saving, setSaving] = useState(false);

  const handleStiResultChange = (stiId: string, value: StiResult) => {
    setStiResults((prev) => ({
      ...prev,
      [stiId]: value,
    }));
  };

  // Check if all STIs have a selection
  const allStisFilled = useMemo(() => {
    return TESTABLE_STIS.every((sti) => stiResults[sti.id] !== undefined);
  }, [stiResults]);

  // Count positive results
  const positiveResults = useMemo(() => {
    return Object.entries(stiResults)
      .filter(([, result]) => result === 'positive')
      .map(([stiId]) => STI_TYPES.find(s => s.id === stiId)?.label || stiId);
  }, [stiResults]);

  // Derive overall status
  const derivedStatus = useMemo(() => {
    if (!allStisFilled) return null;
    return deriveStatusFromResults(stiResults);
  }, [stiResults, allStisFilled]);

  const handleSave = async () => {
    if (!testDate || !allStisFilled) return;

    try {
      setSaving(true);

      // If user has opted into contact tracing and has positive results, send notifications
      if (settings?.contact_tracing_opted_in && positiveResults.length > 0) {
        for (const [stiId, stiResult] of Object.entries(stiResults)) {
          if (stiResult === 'positive') {
            await sendNotifications(stiId, testDate);
          }
        }
      }

      await onSave(testDate, stiResults, notes || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to save health screen:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getResultButtonClass = (stiId: string, resultType: StiResult) => {
    const isSelected = stiResults[stiId] === resultType;
    const baseClass = 'px-2 py-1.5 text-xs rounded transition-colors font-medium';

    if (!isSelected) {
      return `${baseClass} bg-hole-bg border border-hole-border hover:bg-hole-border`;
    }

    switch (resultType) {
      case 'negative':
        return `${baseClass} bg-green-500 text-white`;
      case 'positive':
        return `${baseClass} bg-red-500 text-white`;
      case 'pending':
        return `${baseClass} bg-yellow-500 text-black`;
      case 'not_tested':
        return `${baseClass} bg-gray-500 text-white`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-4 max-h-[90vh] overflow-auto">
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

        {/* STI Results - ALWAYS visible, REQUIRED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-hole-muted font-medium">Test Results</label>
            <span className="text-xs text-hole-muted">
              {Object.keys(stiResults).length}/{TESTABLE_STIS.length} set
            </span>
          </div>

          <div className="bg-hole-surface rounded-lg p-3 space-y-3">
            {TESTABLE_STIS.map((sti) => (
              <div key={sti.id} className="flex items-center justify-between gap-2">
                <span className="text-sm flex-shrink-0">{sti.label}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStiResultChange(sti.id, 'negative')}
                    className={getResultButtonClass(sti.id, 'negative')}
                    title="Negative"
                  >
                    Neg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStiResultChange(sti.id, 'positive')}
                    className={getResultButtonClass(sti.id, 'positive')}
                    title="Positive"
                  >
                    Pos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStiResultChange(sti.id, 'pending')}
                    className={getResultButtonClass(sti.id, 'pending')}
                    title="Pending Results"
                  >
                    Pend
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStiResultChange(sti.id, 'not_tested')}
                    className={getResultButtonClass(sti.id, 'not_tested')}
                    title="Not Tested"
                  >
                    N/A
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Derived status preview */}
          {allStisFilled && derivedStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              derivedStatus === 'all_clear'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : derivedStatus === 'needs_followup'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
            }`}>
              {derivedStatus === 'all_clear' && (
                <>All clear - no positive results</>
              )}
              {derivedStatus === 'needs_followup' && (
                <>Needs follow-up: {positiveResults.join(', ')}</>
              )}
              {derivedStatus === 'pending' && (
                <>Some results still pending - remember to update when ready</>
              )}
            </div>
          )}

          {/* Contact tracing warning */}
          {positiveResults.length > 0 && settings?.contact_tracing_opted_in && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  Anonymous notifications will be sent to recent partners who have opted into contact tracing.
                </span>
              </div>
            </div>
          )}

          {/* Not all filled message */}
          {!allStisFilled && (
            <p className="text-xs text-hole-muted">
              Please set a result for all tests before saving. Use &quot;N/A&quot; for tests you didn&apos;t take.
            </p>
          )}
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
            disabled={!testDate || !allStisFilled || saving}
            className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
