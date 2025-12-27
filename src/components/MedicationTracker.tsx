// Medication tracker section for HealthView - displays PrEP and DoxyPep status

'use client';

import { useState } from 'react';
import { useMedication } from '@/hooks/useMedication';
import MedicationLogModal from './MedicationLogModal';

export default function MedicationTracker() {
  const { stats, logPrep, logDoxyPep, loading } = useMedication();
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [showDoxyPepModal, setShowDoxyPepModal] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogPrep = async (takenAt?: Date, notes?: string) => {
    await logPrep(takenAt, notes);
  };

  const handleLogDoxyPep = async (takenAt?: Date, notes?: string) => {
    await logDoxyPep(takenAt, notes);
  };

  if (loading) {
    return (
      <div className="bg-hole-surface rounded-lg p-4">
        <p className="text-hole-muted text-center">Loading medications...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-hole-surface rounded-lg p-4 space-y-4">
        <h3 className="text-sm text-hole-muted font-medium">Medications</h3>

        {/* PrEP Section */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">PrEP</span>
              {stats.prepTakenToday ? (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                  Taken today
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                  Not taken today
                </span>
              )}
            </div>
            <div className="text-sm text-hole-muted mt-1">
              {stats.prepStreak > 0 ? (
                <span>
                  {stats.prepStreak} day streak
                </span>
              ) : (
                <span>Last: {formatDate(stats.lastPrepDate)}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPrepModal(true)}
            className="px-4 py-2 bg-hole-bg border border-hole-border rounded-lg text-sm font-medium hover:bg-hole-border transition-colors"
          >
            Log PrEP
          </button>
        </div>

        <div className="border-t border-hole-border" />

        {/* DoxyPep Section */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">DoxyPep</span>
              {stats.doxyPepThisWeek > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  {stats.doxyPepThisWeek} this week
                </span>
              )}
            </div>
            <div className="text-sm text-hole-muted mt-1">
              Last: {formatDate(stats.lastDoxyPepDate)}
            </div>
          </div>
          <button
            onClick={() => setShowDoxyPepModal(true)}
            className="px-4 py-2 bg-hole-bg border border-hole-border rounded-lg text-sm font-medium hover:bg-hole-border transition-colors"
          >
            Log DoxyPep
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPrepModal && (
        <MedicationLogModal
          type="prep"
          onClose={() => setShowPrepModal(false)}
          onSave={handleLogPrep}
        />
      )}
      {showDoxyPepModal && (
        <MedicationLogModal
          type="doxypep"
          onClose={() => setShowDoxyPepModal(false)}
          onSave={handleLogDoxyPep}
        />
      )}
    </>
  );
}
