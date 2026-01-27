'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FlaskConical,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  MoreVertical,
  Bug,
  MessageSquare,
  Lightbulb,
  Crown,
  Settings,
  Copy,
  ExternalLink,
  Save,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useBetaAdmin, BetaTester, BetaFeedback } from '@/hooks/admin/useBetaAdmin';
import toast from 'react-hot-toast';

type TabType = 'settings' | 'testers' | 'feedback';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'testers', label: 'Active Testers', icon: Users },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

const statusColors = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
  dropped: 'bg-red-100 text-red-700',
  open: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const feedbackTypeIcons = {
  bug: Bug,
  feedback: MessageSquare,
  suggestion: Lightbulb,
};

export default function BetaTestersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [stats, setStats] = useState({
    pendingInvites: 0,
    activeTesters: 0,
    completedTesters: 0,
    openFeedback: 0,
  });
  const [settings, setSettings] = useState({
    maxTesters: 50,
    isOpen: true,
  });
  const [editedSettings, setEditedSettings] = useState({
    maxTesters: 50,
    isOpen: true,
  });
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const {
    isLoading,
    fetchTesters,
    fetchFeedback,
    fetchSettings,
    updateSettings,
    grantPremium,
    dropTester,
    updateFeedbackStatus,
    getStats,
  } = useBetaAdmin();

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const [tests, fb, st, sett] = await Promise.all([
      fetchTesters(),
      fetchFeedback(),
      getStats(),
      fetchSettings(),
    ]);
    setTesters(tests);
    setFeedback(fb);
    setStats(st);
    if (sett) {
      setSettings(sett);
      setEditedSettings(sett);
    }
    setIsRefreshing(false);
  }, [fetchTesters, fetchFeedback, getStats, fetchSettings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSettingsChanged(
      editedSettings.maxTesters !== settings.maxTesters ||
      editedSettings.isOpen !== settings.isOpen
    );
  }, [editedSettings, settings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const success = await updateSettings(editedSettings.maxTesters, editedSettings.isOpen);
    if (success) {
      setSettings(editedSettings);
      toast.success('Settings saved');
    } else {
      toast.error('Failed to save settings');
    }
    setIsSavingSettings(false);
  };

  const handleGrantPremium = async (testerId: string) => {
    if (!confirm('Grant lifetime premium to this tester? This action cannot be undone.')) return;

    const success = await grantPremium(testerId);
    if (success) {
      toast.success('Lifetime premium granted!');
      loadData();
    } else {
      toast.error('Failed to grant premium. Ensure tester has completed all 10 weeks.');
    }
    setSelectedItem(null);
  };

  const handleDropTester = async (testerId: string) => {
    if (!confirm('Mark this tester as dropped? They will no longer be tracked.')) return;

    const success = await dropTester(testerId);
    if (success) {
      toast.success('Tester marked as dropped');
      loadData();
    } else {
      toast.error('Failed to update tester status');
    }
    setSelectedItem(null);
  };

  const handleUpdateFeedback = async (feedbackId: string, status: 'reviewed' | 'resolved') => {
    const success = await updateFeedbackStatus(feedbackId, status);
    if (success) {
      toast.success(`Feedback marked as ${status}`);
      loadData();
    } else {
      toast.error('Failed to update feedback');
    }
    setSelectedItem(null);
  };

  const copyBetaLink = () => {
    const link = `${window.location.origin}/beta`;
    navigator.clipboard.writeText(link);
    toast.success('Beta link copied!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-purple-600" />
            Beta Testers
          </h1>
          <p className="text-gray-600 mt-1">
            Manage beta program settings and track tester progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyBetaLink}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
          >
            <Copy className="w-4 h-4" />
            Copy Beta Link
          </button>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeTesters}</div>
              <div className="text-sm text-gray-600">Active Testers</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.completedTesters}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {settings.maxTesters - stats.activeTesters - stats.completedTesters}
              </div>
              <div className="text-sm text-gray-600">Spots Left</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Bug className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.openFeedback}</div>
              <div className="text-sm text-gray-600">Open Feedback</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Beta Program Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure the beta program capacity and availability. Share the beta link with potential testers.
                </p>
              </div>

              {/* Beta Link */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Public Beta Link
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-purple-200 text-purple-700 text-sm">
                    {typeof window !== 'undefined' ? `${window.location.origin}/beta` : '/beta'}
                  </code>
                  <button
                    onClick={copyBetaLink}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Share this link with potential beta testers
                </p>
              </div>

              {/* Max Testers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Beta Testers
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editedSettings.maxTesters}
                  onChange={(e) => setEditedSettings({
                    ...editedSettings,
                    maxTesters: parseInt(e.target.value) || 50
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {stats.activeTesters + stats.completedTesters} / {settings.maxTesters} spots filled
                </p>
              </div>

              {/* Program Open/Closed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Status
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setEditedSettings({ ...editedSettings, isOpen: true })}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border-2 transition-colors text-center',
                      editedSettings.isOpen
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    )}
                  >
                    <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Open</span>
                  </button>
                  <button
                    onClick={() => setEditedSettings({ ...editedSettings, isOpen: false })}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg border-2 transition-colors text-center',
                      !editedSettings.isOpen
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    )}
                  >
                    <XCircle className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Closed</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {editedSettings.isOpen
                    ? 'New testers can join if spots are available'
                    : 'No new testers can join, even if spots are available'}
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={!settingsChanged || isSavingSettings}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Active Testers Tab */}
          {activeTab === 'testers' && (
            <div>
              {testers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900">No testers yet</h2>
                  <p className="text-gray-600 mt-1">Testers will appear here once they join via the beta link</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testers.map((tester) => {
                    const progressPercent = (tester.weeks_completed / 10) * 100;
                    const weeksArray = Array.from({ length: 10 }, (_, i) => {
                      const log = tester.activity_logs?.find(l => l.week_number === i + 1);
                      return log;
                    });

                    return (
                      <div
                        key={tester.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {tester.profile?.avatar_url ? (
                                <img
                                  src={tester.profile.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-medium text-gray-500">
                                  {tester.profile?.username?.charAt(0).toUpperCase() || 'T'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                @{tester.profile?.username || 'Unknown'}
                                {tester.lifetime_premium_granted && (
                                  <Crown className="w-4 h-4 text-purple-600" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Started {formatRelativeTime(tester.start_date)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              statusColors[tester.status]
                            )}>
                              {tester.status.charAt(0).toUpperCase() + tester.status.slice(1)}
                            </span>

                            {tester.status === 'active' && (
                              <div className="relative">
                                <button
                                  onClick={() => setSelectedItem(selectedItem === tester.id ? null : tester.id)}
                                  className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>

                                {selectedItem === tester.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    {tester.weeks_completed >= 10 && (
                                      <button
                                        onClick={() => handleGrantPremium(tester.id)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-purple-600"
                                      >
                                        <Crown className="w-4 h-4" />
                                        Grant Premium
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDropTester(tester.id)}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Mark as Dropped
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">
                              {tester.weeks_completed}/10 weeks
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Weekly breakdown */}
                        <div className="flex gap-1">
                          {weeksArray.map((log, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex-1 h-8 rounded flex items-center justify-center text-xs font-medium',
                                log?.meets_requirement
                                  ? 'bg-green-100 text-green-700'
                                  : log
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-400'
                              )}
                              title={log ? `Week ${i + 1}: ${log.activity_score} pts` : `Week ${i + 1}: Not started`}
                            >
                              {log?.meets_requirement ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : log ? (
                                <Clock className="w-4 h-4" />
                              ) : (
                                i + 1
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div>
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900">No feedback yet</h2>
                  <p className="text-gray-600 mt-1">Feedback from testers will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.map((fb) => {
                    const TypeIcon = feedbackTypeIcons[fb.type];
                    return (
                      <div
                        key={fb.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              fb.type === 'bug' ? 'bg-red-100' :
                              fb.type === 'feedback' ? 'bg-blue-100' : 'bg-green-100'
                            )}>
                              <TypeIcon className={cn(
                                'w-5 h-5',
                                fb.type === 'bug' ? 'text-red-600' :
                                fb.type === 'feedback' ? 'text-blue-600' : 'text-green-600'
                              )} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{fb.title}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                By @{fb.tester?.profile?.username || 'Unknown'}
                                {' · '}{formatRelativeTime(fb.created_at)}
                              </div>
                              <p className="text-gray-600 mt-2 text-sm">{fb.description}</p>
                              {fb.screenshot_url && (
                                <a
                                  href={fb.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Screenshot
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                              statusColors[fb.status]
                            )}>
                              {fb.status}
                            </span>

                            {fb.status !== 'resolved' && (
                              <div className="relative">
                                <button
                                  onClick={() => setSelectedItem(selectedItem === fb.id ? null : fb.id)}
                                  className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>

                                {selectedItem === fb.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    {fb.status === 'open' && (
                                      <button
                                        onClick={() => handleUpdateFeedback(fb.id, 'reviewed')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Clock className="w-4 h-4" />
                                        Mark Reviewed
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateFeedback(fb.id, 'resolved')}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark Resolved
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
