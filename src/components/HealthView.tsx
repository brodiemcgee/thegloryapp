// Health & Encounters tracking page

'use client';

import { useState } from 'react';
import { useHealthScreens } from '@/hooks/useHealthScreens';
import { useEncounters } from '@/hooks/useEncounters';
import { useHealthSettings } from '@/hooks/useHealthSettings';
import { useContactTracing } from '@/hooks/useContactTracing';
import { PlusIcon, SettingsIcon } from './icons';
import HealthScreenModal from './HealthScreenModal';
import ManualEncounterModal from './ManualEncounterModal';
import EncounterCard from './EncounterCard';
import MedicationTracker from './MedicationTracker';
import HealthSettingsModal from './HealthSettingsModal';
import { ContactTraceAlerts } from './ContactTraceAlert';

export default function HealthView() {
  const { latestScreen, daysSinceLastTest, addScreen, loading: healthLoading } = useHealthScreens();
  const { encounters, stats, addManualEncounter, loading: encountersLoading } = useEncounters();
  const { settings } = useHealthSettings();
  const { notifications, markAsRead } = useContactTracing();
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showEncounterModal, setShowEncounterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Calculate partners since last screen
  const partnersSinceLastScreen = latestScreen
    ? encounters.filter(
        (e) => new Date(e.met_at) > new Date(latestScreen.test_date)
      ).length
    : encounters.length;

  // Check if screen reminder should show
  const shouldShowScreenReminder = () => {
    if (!settings) return false;

    const daysThreshold = settings.screen_reminder_days;
    const partnersThreshold = settings.screen_reminder_partners;

    const daysExceeded = daysSinceLastTest !== null && daysSinceLastTest >= daysThreshold;
    const partnersExceeded = partnersSinceLastScreen >= partnersThreshold;

    return daysExceeded || partnersExceeded;
  };

  // Get color class based on days since last test
  const getHealthStatusColor = () => {
    if (daysSinceLastTest === null) return 'text-hole-muted';
    if (daysSinceLastTest < 90) return 'text-green-500';
    if (daysSinceLastTest < 180) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthStatusBg = () => {
    if (daysSinceLastTest === null) return 'bg-hole-surface';
    if (daysSinceLastTest < 90) return 'bg-green-500/10 border-green-500/20';
    if (daysSinceLastTest < 180) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddHealthScreen = async (
    testDate: string,
    result?: 'all_clear' | 'needs_followup' | 'pending',
    notes?: string
  ) => {
    await addScreen(testDate, result, notes);
  };

  const handleAddManualEncounter = async (
    metAt: string,
    name?: string,
    rating?: number,
    notes?: string,
    activities?: string[],
    locationType?: string,
    protectionUsed?: 'yes' | 'no' | 'na',
    locationLat?: number,
    locationLng?: number,
    locationAddress?: string
  ) => {
    await addManualEncounter(metAt, name, rating, notes, activities, locationType, protectionUsed, locationLat, locationLng, locationAddress);
  };

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        <h1 className="text-lg font-semibold">Health & Encounters</h1>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
        >
          <SettingsIcon className="w-5 h-5 text-hole-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Contact Trace Alerts */}
        <ContactTraceAlerts
          notifications={notifications}
          onDismiss={markAsRead}
        />

        {/* Screen Reminder Banner */}
        {shouldShowScreenReminder() && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-yellow-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-yellow-400">Time for a health screen</p>
                <p className="text-sm text-hole-muted mt-1">
                  {daysSinceLastTest !== null && daysSinceLastTest >= (settings?.screen_reminder_days || 90)
                    ? `It's been ${daysSinceLastTest} days since your last test.`
                    : `You've had ${partnersSinceLastScreen} partner${partnersSinceLastScreen !== 1 ? 's' : ''} since your last test.`}
                </p>
              </div>
              <button
                onClick={() => setShowHealthModal(true)}
                className="flex-shrink-0 px-3 py-1.5 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-400 transition-colors"
              >
                Log Test
              </button>
            </div>
          </div>
        )}

        {/* Health Screen Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-hole-muted font-medium">Last Health Screen</h2>
            <button
              onClick={() => setShowHealthModal(true)}
              className="text-xs text-hole-accent hover:underline"
            >
              {latestScreen ? 'Update' : 'Add'}
            </button>
          </div>

          <div className={`rounded-lg p-4 border ${getHealthStatusBg()}`}>
            {healthLoading ? (
              <p className="text-hole-muted">Loading...</p>
            ) : latestScreen ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${getHealthStatusColor()}`}>
                    {formatDate(latestScreen.test_date)}
                  </span>
                  {latestScreen.result && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        latestScreen.result === 'all_clear'
                          ? 'bg-green-500/20 text-green-400'
                          : latestScreen.result === 'needs_followup'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {latestScreen.result === 'all_clear'
                        ? 'All Clear'
                        : latestScreen.result === 'needs_followup'
                        ? 'Needs Follow-up'
                        : 'Pending'}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${getHealthStatusColor()}`}>
                  {daysSinceLastTest === 0
                    ? 'Today'
                    : daysSinceLastTest === 1
                    ? '1 day ago'
                    : `${daysSinceLastTest} days ago`}
                </p>
                {daysSinceLastTest !== null && daysSinceLastTest >= 90 && (
                  <p className="text-xs text-hole-muted mt-2">
                    {daysSinceLastTest >= 180
                      ? 'Consider scheduling a test soon'
                      : 'A regular checkup is recommended every 3 months'}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-hole-muted mb-3">No health screen logged yet</p>
                <button
                  onClick={() => setShowHealthModal(true)}
                  className="px-4 py-2 bg-hole-accent text-white rounded-lg text-sm font-medium hover:bg-hole-accent-hover transition-colors"
                >
                  Log Your First Test
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Medication Tracker Section */}
        <section>
          <MedicationTracker />
        </section>

        {/* Quick Stats Section */}
        <section>
          <h2 className="text-sm text-hole-muted font-medium mb-3">Quick Stats</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-hole-surface rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-hole-accent">{stats.thisMonth}</p>
              <p className="text-xs text-hole-muted">This month</p>
            </div>
            <div className="bg-hole-surface rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-hole-muted">Total</p>
            </div>
            <div className="bg-hole-surface rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">
                {stats.avgRating ? stats.avgRating.toFixed(1) : '-'}
              </p>
              <p className="text-xs text-hole-muted">Avg rating</p>
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
            <div className="bg-hole-surface rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.uniqueLocations || '-'}</p>
              <p className="text-xs text-hole-muted">Locations</p>
            </div>
            <div className="bg-hole-surface rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.regulars || '-'}</p>
              <p className="text-xs text-hole-muted">Regulars</p>
            </div>
          </div>
        </section>

        {/* Encounters Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-hole-muted font-medium">Encounters</h2>
            <button
              onClick={() => setShowEncounterModal(true)}
              className="flex items-center gap-1 text-xs text-hole-accent hover:underline"
            >
              <PlusIcon className="w-4 h-4" />
              Add Manual
            </button>
          </div>

          {encountersLoading ? (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-hole-muted text-center">Loading encounters...</p>
            </div>
          ) : encounters.length === 0 ? (
            <div className="bg-hole-surface rounded-lg p-6 text-center">
              <p className="text-hole-muted mb-3">No encounters logged yet</p>
              <p className="text-xs text-hole-muted mb-4">
                Encounters are logged when you use the "Met" button on user profiles or chats,
                or you can add manual entries for people you meet outside the app.
              </p>
              <button
                onClick={() => setShowEncounterModal(true)}
                className="px-4 py-2 bg-hole-surface border border-hole-border text-white rounded-lg text-sm font-medium hover:bg-hole-border transition-colors"
              >
                Add Manual Entry
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {encounters.map((encounter) => (
                <EncounterCard key={encounter.id} encounter={encounter} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showHealthModal && (
        <HealthScreenModal
          onClose={() => setShowHealthModal(false)}
          onSave={handleAddHealthScreen}
        />
      )}
      {showEncounterModal && (
        <ManualEncounterModal
          onClose={() => setShowEncounterModal(false)}
          onSave={handleAddManualEncounter}
        />
      )}
      {showSettingsModal && (
        <HealthSettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </div>
  );
}
