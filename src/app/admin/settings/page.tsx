'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Clock,
  AlertTriangle,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SettingsState {
  // Content Policies
  autoFlagKeywords: string[];
  maxReportsBeforeAutoSuspend: number;
  suspensionDurations: number[];

  // Notifications
  emailNotificationsEnabled: boolean;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
  notifyOnCriticalReports: boolean;
  notifyOnNewAdminLogin: boolean;

  // Data Retention
  auditLogRetentionDays: number;
  deletedUserDataRetentionDays: number;

  // System
  maintenanceMode: boolean;
  registrationOpen: boolean;
  requireEmailVerification: boolean;
}

const defaultSettings: SettingsState = {
  autoFlagKeywords: ['underage', 'minor', 'illegal'],
  maxReportsBeforeAutoSuspend: 5,
  suspensionDurations: [1, 7, 30],
  emailNotificationsEnabled: true,
  slackWebhookUrl: '',
  discordWebhookUrl: '',
  notifyOnCriticalReports: true,
  notifyOnNewAdminLogin: false,
  auditLogRetentionDays: 365,
  deletedUserDataRetentionDays: 30,
  maintenanceMode: false,
  registrationOpen: true,
  requireEmailVerification: true,
};

export default function SettingsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'policies' | 'notifications' | 'data' | 'system'>('policies');

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveSettings = async () => {
    setIsLoading(true);
    // In production, this would save to the database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setIsLoading(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Access Restricted</h2>
        <p className="text-gray-600 mt-1">
          Only Super Admins can access settings
        </p>
      </div>
    );
  }

  const sections = [
    { id: 'policies', label: 'Content Policies', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Retention', icon: Database },
    { id: 'system', label: 'System', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system behavior and policies
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  activeSection === section.id
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Content Policies */}
            {activeSection === 'policies' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Policies</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-Flag Keywords
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Messages containing these keywords will be automatically flagged for review
                      </p>
                      <textarea
                        value={settings.autoFlagKeywords.join('\n')}
                        onChange={(e) => updateSetting('autoFlagKeywords', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Enter keywords, one per line..."
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-Suspend Threshold
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Automatically suspend users after this many reports
                      </p>
                      <input
                        type="number"
                        value={settings.maxReportsBeforeAutoSuspend}
                        onChange={(e) => updateSetting('maxReportsBeforeAutoSuspend', parseInt(e.target.value))}
                        min={1}
                        max={20}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suspension Duration Options (days)
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Available suspension duration options for moderators
                      </p>
                      <input
                        type="text"
                        value={settings.suspensionDurations.join(', ')}
                        onChange={(e) => updateSetting('suspensionDurations', e.target.value.split(',').map((n) => parseInt(n.trim())).filter(Boolean))}
                        placeholder="1, 7, 30"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>

                <div className="space-y-4">
                  <ToggleSetting
                    label="Email Notifications"
                    description="Send email notifications for important events"
                    enabled={settings.emailNotificationsEnabled}
                    onChange={(v) => updateSetting('emailNotificationsEnabled', v)}
                  />

                  <ToggleSetting
                    label="Critical Report Alerts"
                    description="Notify immediately when critical reports are filed"
                    enabled={settings.notifyOnCriticalReports}
                    onChange={(v) => updateSetting('notifyOnCriticalReports', v)}
                  />

                  <ToggleSetting
                    label="New Admin Login Alerts"
                    description="Notify when an admin logs in"
                    enabled={settings.notifyOnNewAdminLogin}
                    onChange={(v) => updateSetting('notifyOnNewAdminLogin', v)}
                  />

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slack Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.slackWebhookUrl}
                      onChange={(e) => updateSetting('slackWebhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discord Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.discordWebhookUrl}
                      onChange={(e) => updateSetting('discordWebhookUrl', e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Retention */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audit Log Retention (days)
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      How long to keep admin audit logs
                    </p>
                    <input
                      type="number"
                      value={settings.auditLogRetentionDays}
                      onChange={(e) => updateSetting('auditLogRetentionDays', parseInt(e.target.value))}
                      min={30}
                      max={3650}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deleted User Data Retention (days)
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      How long to keep data after a user deletes their account
                    </p>
                    <input
                      type="number"
                      value={settings.deletedUserDataRetentionDays}
                      onChange={(e) => updateSetting('deletedUserDataRetentionDays', parseInt(e.target.value))}
                      min={0}
                      max={365}
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Data Retention Notice</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Ensure your data retention policies comply with applicable privacy laws (GDPR, CCPA, etc.).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System */}
            {activeSection === 'system' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>

                <div className="space-y-4">
                  <ToggleSetting
                    label="Maintenance Mode"
                    description="Put the app in maintenance mode (users will see a maintenance page)"
                    enabled={settings.maintenanceMode}
                    onChange={(v) => updateSetting('maintenanceMode', v)}
                    danger
                  />

                  <ToggleSetting
                    label="Registration Open"
                    description="Allow new users to register"
                    enabled={settings.registrationOpen}
                    onChange={(v) => updateSetting('registrationOpen', v)}
                  />

                  <ToggleSetting
                    label="Require Email Verification"
                    description="Require users to verify their email before using the app"
                    enabled={settings.requireEmailVerification}
                    onChange={(v) => updateSetting('requireEmailVerification', v)}
                  />

                  {settings.maintenanceMode && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-800">Maintenance Mode Active</h3>
                          <p className="text-sm text-red-700 mt-1">
                            Users cannot access the app while maintenance mode is enabled.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
  danger = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <h3 className={cn('font-medium', danger ? 'text-red-900' : 'text-gray-900')}>
          {label}
        </h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          enabled
            ? danger
              ? 'bg-red-500'
              : 'bg-purple-600'
            : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
            enabled && 'translate-x-6'
          )}
        />
      </button>
    </div>
  );
}
