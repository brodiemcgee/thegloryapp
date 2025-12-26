'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Flag,
  Clock,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  MessageSquare,
  Image,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAuditLog } from '@/hooks/admin/useAuditLog';
import toast from 'react-hot-toast';

interface ReportDetail {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  action_taken: string | null;
  moderator_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  reported: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean;
    account_status: string;
    created_at: string;
  };
  assignee?: {
    profiles: { username: string };
  };
}

interface RelatedReport {
  id: string;
  reason: string;
  status: string;
  created_at: string;
}

const reasonLabels: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  fake_profile: 'Fake Profile',
  inappropriate_content: 'Inappropriate Content',
  underage: 'Underage Concern',
  violence: 'Violence/Threats',
  other: 'Other',
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-gray-900',
  low: 'bg-gray-200 text-gray-700',
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { adminRoleId, isSuperAdmin } = useAdminAuth();
  const { logReportAction, logModeration } = useAuditLog();
  const reportId = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [relatedReports, setRelatedReports] = useState<RelatedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  async function loadReport() {
    try {
      setIsLoading(true);

      // Fetch report with related data
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(id, username, avatar_url, is_verified),
          reported:profiles!reports_reported_id_fkey(id, username, avatar_url, bio, is_verified, account_status, created_at),
          assignee:admin_roles!reports_assigned_to_fkey(profiles(username))
        `)
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;
      setReport(reportData);
      setNotes(reportData.moderator_notes || '');

      // Fetch related reports on the same user
      const { data: relatedData } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .eq('reported_id', reportData.reported_id)
        .neq('id', reportId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRelatedReports(relatedData || []);

    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }

  async function assignToMe() {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('reports')
        .update({
          assigned_to: adminRoleId,
          status: 'in_progress',
        })
        .eq('id', reportId);

      if (error) throw error;
      await logReportAction('assign', reportId, { reason: report?.reason });
      toast.success('Report assigned to you');
      loadReport();
    } catch (error) {
      console.error('Error assigning report:', error);
      toast.error('Failed to assign report');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveNotes() {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('reports')
        .update({ moderator_notes: notes })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resolveReport(action: string, dismiss: boolean = false) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('reports')
        .update({
          status: dismiss ? 'dismissed' : 'resolved',
          action_taken: action,
          moderator_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: adminRoleId,
        })
        .eq('id', reportId);

      if (error) throw error;
      await logReportAction(dismiss ? 'dismiss' : 'resolve', reportId, {
        action_taken: action,
        reason: report?.reason,
        reported_user: report?.reported?.username
      });
      toast.success(dismiss ? 'Report dismissed' : 'Report resolved');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function suspendUser(days: number) {
    if (!report) return;

    try {
      setIsSubmitting(true);

      // Call the suspend function
      const { error } = await supabase.rpc('suspend_user', {
        p_user_id: report.reported_id,
        p_reason: `Report #${reportId.slice(0, 8)}: ${report.reason}`,
        p_duration_days: days,
      });

      if (error) throw error;

      await logModeration('suspend', report.reported_id, {
        duration_days: days,
        username: report.reported.username,
        from_report: reportId
      });

      // Resolve the report
      await resolveReport(`Suspended for ${days} days`);
      toast.success(`User suspended for ${days} days`);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function banUser() {
    if (!report) return;

    try {
      setIsSubmitting(true);

      // Call the ban function
      const { error } = await supabase.rpc('ban_user', {
        p_user_id: report.reported_id,
        p_reason: `Report #${reportId.slice(0, 8)}: ${report.reason}`,
      });

      if (error) throw error;

      await logModeration('ban', report.reported_id, {
        username: report.reported.username,
        from_report: reportId
      });

      // Resolve the report
      await resolveReport('Permanently banned');
      toast.success('User permanently banned');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Report not found</h2>
        <Link href="/admin/reports" className="text-purple-600 hover:underline mt-2 inline-block">
          Back to reports
        </Link>
      </div>
    );
  }

  const isResolved = report.status === 'resolved' || report.status === 'dismissed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/reports"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Report #{report.id.slice(0, 8)}
            </h1>
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              priorityColors[report.priority]
            )}>
              {report.priority.toUpperCase()}
            </span>
            {isResolved && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                report.status === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              )}>
                {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Reported {formatRelativeTime(report.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Details */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Report Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-sm text-gray-500">Reason</span>
                <p className={cn(
                  'mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                  report.reason === 'underage' || report.reason === 'violence'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                )}>
                  {reasonLabels[report.reason] || report.reason}
                </p>
              </div>

              {report.details && (
                <div>
                  <span className="text-sm text-gray-500">Details from reporter</span>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {report.details}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Submitted</span>
                  <p className="mt-1 text-gray-900">{formatDateTime(report.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <p className="mt-1 text-gray-900 capitalize">{report.status.replace('_', ' ')}</p>
                </div>
              </div>

              {report.resolved_at && (
                <div>
                  <span className="text-sm text-gray-500">Resolved</span>
                  <p className="mt-1 text-gray-900">{formatDateTime(report.resolved_at)}</p>
                  {report.action_taken && (
                    <p className="text-sm text-gray-600 mt-1">Action: {report.action_taken}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reported User */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Reported User</h2>
              <Link
                href={`/admin/users/${report.reported.id}`}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                View full profile <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {report.reported.avatar_url ? (
                    <img
                      src={report.reported.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      @{report.reported.username}
                    </h3>
                    {report.reported.is_verified && (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                    {report.reported.account_status !== 'active' && (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        report.reported.account_status === 'banned'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {report.reported.account_status}
                      </span>
                    )}
                  </div>
                  {report.reported.bio && (
                    <p className="text-sm text-gray-600 mt-1">{report.reported.bio}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Member since {formatDateTime(report.reported.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Notes */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Investigation Notes</h2>
            </div>
            <div className="p-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this investigation..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isResolved}
              />
              {!isResolved && (
                <button
                  onClick={saveNotes}
                  disabled={isSubmitting}
                  className="mt-3 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  Save notes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {!isResolved && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Actions</h2>
              </div>
              <div className="p-4 space-y-3">
                {!report.assigned_to && (
                  <button
                    onClick={assignToMe}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Assign to me
                  </button>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">SUSPEND USER</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 7, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => suspendUser(days)}
                        disabled={isSubmitting}
                        className="px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={banUser}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Permanent Ban
                </button>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">RESOLVE</p>
                  <button
                    onClick={() => resolveReport('No action taken')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-2 mb-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve (No Action)
                  </button>
                  <button
                    onClick={() => resolveReport('Report dismissed', true)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reporter Info */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Reporter</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    @{report.reporter.username}
                  </p>
                  {report.reporter.is_verified && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Reports */}
          {relatedReports.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  Related Reports ({relatedReports.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {relatedReports.map((related) => (
                  <Link
                    key={related.id}
                    href={`/admin/reports/${related.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {reasonLabels[related.reason] || related.reason}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatRelativeTime(related.created_at)}
                      </p>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      related.status === 'resolved' && 'bg-green-100 text-green-700',
                      related.status === 'dismissed' && 'bg-gray-100 text-gray-600',
                      related.status === 'open' && 'bg-yellow-100 text-yellow-700',
                      related.status === 'in_progress' && 'bg-blue-100 text-blue-700'
                    )}>
                      {related.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Assignment */}
          {report.assigned_to && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Assigned To</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium">
                      {report.assignee?.profiles?.username?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {report.assignee?.profiles?.username || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">Investigator</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
