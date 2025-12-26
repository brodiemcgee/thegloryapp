'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Flag,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  reporter?: { username: string };
  reported?: { username: string; avatar_url: string | null };
  assignee?: { profiles: { username: string } };
}

type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'open' | 'in_progress' | 'resolved' | 'dismissed';

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
};

const priorityLabels: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const reasonLabels: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  fake_profile: 'Fake Profile',
  inappropriate_content: 'Inappropriate Content',
  underage: 'Underage Concern',
  violence: 'Violence/Threats',
  other: 'Other',
};

export default function ReportsPage() {
  const { adminRoleId } = useAdminAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>('open');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(username),
          reported:profiles!reports_reported_id_fkey(username, avatar_url),
          assignee:admin_roles!reports_assigned_to_fkey(profiles(username))
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (activeTab === 'open') {
        query = query.eq('status', 'open');
      } else if (activeTab === 'in_progress') {
        query = query.eq('status', 'in_progress');
      } else if (activeTab === 'resolved') {
        query = query.eq('status', 'resolved');
      } else if (activeTab === 'dismissed') {
        query = query.eq('status', 'dismissed');
      }

      // Apply priority filter
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, priorityFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReports]);

  async function assignToMe(reportId: string) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          assigned_to: adminRoleId,
          status: 'in_progress',
        })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Report assigned to you');
      loadReports();
    } catch (error) {
      console.error('Error assigning report:', error);
      toast.error('Failed to assign report');
    }
  }

  // Group reports by priority for Kanban view
  const groupedReports = {
    critical: reports.filter((r) => r.priority === 'critical'),
    high: reports.filter((r) => r.priority === 'high'),
    medium: reports.filter((r) => r.priority === 'medium'),
    low: reports.filter((r) => r.priority === 'low'),
  };

  const tabCounts = {
    open: reports.filter((r) => r.status === 'open').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
          <p className="text-gray-600 mt-1">
            Review and resolve user reports
          </p>
        </div>
        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(['open', 'in_progress', 'resolved', 'dismissed'] as StatusFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              {(tab === 'open' || tab === 'in_progress') && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {reports.filter((r) => r.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Priority:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'critical', 'high', 'medium', 'low'] as PriorityFilter[]).map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                priorityFilter === priority
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {priority === 'all' ? 'All' : priorityLabels[priority]}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid / Kanban */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-24 bg-gray-100 rounded" />
                <div className="h-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'open' ? (
        // Kanban view for open reports
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
            <div key={priority} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('w-3 h-3 rounded-full', priorityColors[priority])} />
                <h3 className="font-semibold text-gray-900">
                  {priorityLabels[priority]}
                </h3>
                <span className="text-sm text-gray-500">
                  ({groupedReports[priority].length})
                </span>
              </div>
              <div className="space-y-3">
                {groupedReports[priority].length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No {priority} priority reports
                  </p>
                ) : (
                  groupedReports[priority].map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onAssign={() => assignToMe(report.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List view for other tabs
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No reports in this category</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <ReportListItem key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  onAssign,
}: {
  report: Report;
  onAssign: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">
          #{report.id.slice(0, 8)}
        </span>
        <span className="text-xs text-gray-500">
          {formatRelativeTime(report.created_at)}
        </span>
      </div>

      <div className="mb-3">
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          report.reason === 'underage' || report.reason === 'violence'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        )}>
          {reasonLabels[report.reason] || report.reason}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-gray-500" />
        </div>
        <span className="text-sm text-gray-900 font-medium truncate">
          @{report.reported?.username || 'Unknown'}
        </span>
      </div>

      {report.details && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {report.details}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Link
          href={`/admin/reports/${report.id}`}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-center text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          View
        </Link>
        {!report.assigned_to && (
          <button
            onClick={onAssign}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Assign to me
          </button>
        )}
      </div>
    </div>
  );
}

function ReportListItem({ report }: { report: Report }) {
  return (
    <Link
      href={`/admin/reports/${report.id}`}
      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
    >
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityColors[report.priority])} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            @{report.reported?.username || 'Unknown'}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            report.reason === 'underage' || report.reason === 'violence'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          )}>
            {reasonLabels[report.reason] || report.reason}
          </span>
        </div>
        {report.details && (
          <p className="text-sm text-gray-600 truncate">{report.details}</p>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {report.assignee && (
          <span>Assigned to {report.assignee.profiles?.username}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatRelativeTime(report.created_at)}
        </span>
      </div>

      {report.status === 'resolved' && (
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      )}
      {report.status === 'dismissed' && (
        <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
    </Link>
  );
}
