// Modal for configuring health settings (reminders, contact tracing)

'use client';

import { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { useHealthSettings } from '@/hooks/useHealthSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface HealthSettingsModalProps {
  onClose: () => void;
}

export default function HealthSettingsModal({ onClose }: HealthSettingsModalProps) {
  const { settings, loading, updateSettings } = useHealthSettings();
  const { isSupported: pushSupported, permission: pushPermission, isSubscribed: pushSubscribed, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();
  const [screenDays, setScreenDays] = useState(90);
  const [screenPartners, setScreenPartners] = useState(10);
  const [contactTracingOptIn, setContactTracingOptIn] = useState(false);
  const [prepReminders, setPrepReminders] = useState(false);
  const [prepReminderTime, setPrepReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);

  // Initialize form with current settings
  useEffect(() => {
    if (settings) {
      setScreenDays(settings.screen_reminder_days);
      setScreenPartners(settings.screen_reminder_partners);
      setContactTracingOptIn(settings.contact_tracing_opted_in);
      setPrepReminders(settings.prep_reminders_enabled);
      // Handle time format (could be HH:MM:SS from DB)
      const time = settings.prep_reminder_time?.slice(0, 5) || '09:00';
      setPrepReminderTime(time);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({
        screen_reminder_days: screenDays,
        screen_reminder_partners: screenPartners,
        contact_tracing_opted_in: contactTracingOptIn,
        prep_reminders_enabled: prepReminders,
        prep_reminder_time: prepReminderTime,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4">
          <p className="text-hole-muted text-center">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg p-4 space-y-5 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Health Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Reminder Settings */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-hole-muted">Screen Reminders</h3>

          <div>
            <label className="text-sm text-hole-muted mb-2 block">
              Remind me after this many days
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 180].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setScreenDays(days)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    screenDays === days
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-hole-muted mb-2 block">
              Or after this many partners
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setScreenPartners(count)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    screenPartners === count
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-hole-border" />

        {/* PrEP Reminders */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Medication Reminders</h3>
              <p className="text-xs text-hole-muted mt-1">
                Get reminded to take your daily PrEP
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrepReminders(!prepReminders)}
              className={`w-12 h-6 rounded-full transition-colors ${
                prepReminders ? 'bg-hole-accent' : 'bg-hole-surface'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  prepReminders ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Time picker - show when reminders enabled */}
          {prepReminders && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-hole-muted mb-2 block">
                  Reminder time
                </label>
                <select
                  value={prepReminderTime}
                  onChange={(e) => setPrepReminderTime(e.target.value)}
                  className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
                >
                  {Array.from({ length: 24 * 4 }, (_, i) => {
                    const hour = Math.floor(i / 4);
                    const minute = (i % 4) * 15;
                    const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Push notification requirement */}
              {pushSupported && !pushSubscribed && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-400 mb-2">
                    Enable push notifications to receive reminders even when the app is closed.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setTogglingPush(true);
                      try {
                        await subscribePush();
                      } finally {
                        setTogglingPush(false);
                      }
                    }}
                    disabled={togglingPush || pushPermission === 'denied'}
                    className="px-3 py-1.5 bg-yellow-500 text-black rounded text-xs font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50"
                  >
                    {togglingPush ? 'Enabling...' : 'Enable Notifications'}
                  </button>
                  {pushPermission === 'denied' && (
                    <p className="text-xs text-red-400 mt-2">
                      Notifications blocked. Please enable in browser settings.
                    </p>
                  )}
                </div>
              )}

              {pushSubscribed && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-xs text-green-400">
                    Push notifications enabled. You&apos;ll receive a reminder at {prepReminderTime}.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="border-t border-hole-border" />

        {/* Contact Tracing */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium">Anonymous Contact Tracing</h3>
              <p className="text-xs text-hole-muted mt-1">
                If someone you&apos;ve met tests positive, you&apos;ll receive an anonymous
                notification. Your identity is never shared.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContactTracingOptIn(!contactTracingOptIn)}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                contactTracingOptIn ? 'bg-hole-accent' : 'bg-hole-surface'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  contactTracingOptIn ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {contactTracingOptIn && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-green-400">
                You&apos;re helping keep the community safe. Thank you!
              </p>
            </div>
          )}

          {/* Push Notifications - only show if contact tracing is enabled */}
          {contactTracingOptIn && pushSupported && (
            <div className="flex items-start justify-between gap-4 pt-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium">Push Notifications</h4>
                <p className="text-xs text-hole-muted mt-1">
                  Get a discreet notification if you may have been exposed.
                  Message will just say &quot;New notification&quot; - no details shown.
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-xs text-red-400 mt-1">
                    Notifications blocked. Please enable in browser settings.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={togglingPush || pushPermission === 'denied'}
                onClick={async () => {
                  setTogglingPush(true);
                  try {
                    if (pushSubscribed) {
                      await unsubscribePush();
                    } else {
                      await subscribePush();
                    }
                  } finally {
                    setTogglingPush(false);
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                  pushSubscribed ? 'bg-hole-accent' : 'bg-hole-surface'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    pushSubscribed ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}
        </section>

        <div className="flex gap-3 pt-2">
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
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
