'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FlaskConical,
  Mail,
  Send,
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
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { useBetaAdmin, BetaInvitation, BetaTester, BetaFeedback } from '@/hooks/admin/useBetaAdmin';
import toast from 'react-hot-toast';

type TabType = 'invite' | 'invitations' | 'testers' | 'feedback';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'invite', label: 'Send Invite', icon: Send },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'testers', label: 'Active Testers', icon: Users },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600',
  revoked: 'bg-red-100 text-red-700',
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
  const [activeTab, setActiveTab] = useState<TabType>('invite');
  const [invitations, setInvitations] = useState<BetaInvitation[]>([]);
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [stats, setStats] = useState({
    pendingInvites: 0,
    activeTesters: 0,
    completedTesters: 0,
    openFeedback: 0,
  });
  const [email, setEmail] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isLoading,
    fetchInvitations,
    fetchTesters,
    fetchFeedback,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
    grantPremium,
    dropTester,
    updateFeedbackStatus,
    getStats,
  } = useBetaAdmin();

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const [invs, tests, fb, st] = await Promise.all([
      fetchInvitations(),
      fetchTesters(),
      fetchFeedback(),
      getStats(),
    ]);
    setInvitations(invs);
    setTesters(tests);
    setFeedback(fb);
    setStats(st);
    setIsRefreshing(false);
  }, [fetchInvitations, fetchTesters, fetchFeedback, getStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const result = await sendInvitation(email);

    if (result.success) {
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      loadData();
    } else {
      toast.error(result.error || 'Failed to send invitation');
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    const success = await revokeInvitation(id);
    if (success) {
      toast.success('Invitation revoked');
      loadData();
    } else {
      toast.error('Failed to revoke invitation');
    }
    setSelectedItem(null);
  };

  const handleResendInvitation = async (invitation: BetaInvitation) => {
    const success = await resendInvitation(invitation);
    if (success) {
      toast.success('Invitation resent');
    } else {
      toast.error('Failed to resend invitation');
    }
    setSelectedItem(null);
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

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/beta/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
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
            Manage beta tester invitations and track progress
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingInvites}</div>
              <div className="text-sm text-gray-600">Pending Invites</div>
            </div>
          </div>
        </div>
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
          {/* Send Invite Tab */}
          {activeTab === 'invite' && (
            <div className="max-w-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Send Beta Invitation
              </h2>
              <p className="text-gray-600 mb-6">
                Invite a user to join the beta testing program. They'll receive an email with a unique invite link.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tester@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  />
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">Program Details</h3>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>1 hour engagement per week for 10 weeks</li>
                    <li>Submit bug reports and feedback</li>
                    <li>Reward: Lifetime free premium</li>
                    <li>Invitation expires in 7 days</li>
                  </ul>
                </div>

                <button
                  onClick={handleSendInvite}
                  disabled={isLoading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send Invitation
                </button>
              </div>
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div>
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900">No invitations yet</h2>
                  <p className="text-gray-600 mt-1">Send your first beta invitation to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{inv.email}</div>
                          <div className="text-sm text-gray-500">
                            Code: <span className="font-mono">{inv.code}</span>
                            {inv.invited_by_profile && (
                              <> · Invited by @{inv.invited_by_profile.username}</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          statusColors[inv.status]
                        )}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>

                        <div className="text-sm text-gray-500">
                          {inv.status === 'pending' && (
                            <>Expires {formatRelativeTime(inv.expires_at)}</>
                          )}
                          {inv.status === 'accepted' && inv.accepted_at && (
                            <>Accepted {formatRelativeTime(inv.accepted_at)}</>
                          )}
                        </div>

                        {inv.status === 'pending' && (
                          <div className="relative">
                            <button
                              onClick={() => setSelectedItem(selectedItem === inv.id ? null : inv.id)}
                              className="p-2 hover:bg-gray-200 rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {selectedItem === inv.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => copyInviteLink(inv.code)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => handleResendInvitation(inv)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" />
                                  Resend Email
                                </button>
                                <button
                                  onClick={() => handleRevokeInvitation(inv.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Revoke
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Testers Tab */}
          {activeTab === 'testers' && (
            <div>
              {testers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-medium text-gray-900">No testers yet</h2>
                  <p className="text-gray-600 mt-1">Testers will appear here once they accept invitations</p>
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
