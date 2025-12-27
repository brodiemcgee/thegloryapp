// Modal for configuring health settings (reminders, contact tracing)

'use client';

import { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { useHealthSettings } from '@/hooks/useHealthSettings';

interface HealthSettingsModalProps {
  onClose: () => void;
}

export default function HealthSettingsModal({ onClose }: HealthSettingsModalProps) {
  const { settings, loading, updateSettings } = useHealthSettings();
  const [screenDays, setScreenDays] = useState(90);
  const [screenPartners, setScreenPartners] = useState(10);
  const [contactTracingOptIn, setContactTracingOptIn] = useState(false);
  const [prepReminders, setPrepReminders] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form with current settings
  useEffect(() => {
    if (settings) {
      setScreenDays(settings.screen_reminder_days);
      setScreenPartners(settings.screen_reminder_partners);
      setContactTracingOptIn(settings.contact_tracing_opted_in);
      setPrepReminders(settings.prep_reminders_enabled);
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
              <h3 className="text-sm font-medium">PrEP Reminders</h3>
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
