'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Ban,
  Shield,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAuditLog } from '@/hooks/admin/useAuditLog';
import { cn, formatRelativeTime, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Appeal {
  id: string;
  user_id: string;
  action_id: string;
  reason: string;
  status: 'pending' | 'under_review' | 'upheld' | 'overturned';
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  user: {
    username: string;
    avatar_url: string | null;
    account_status: string;
  };
  action: {
    action: string;
    reason: string | null;
    duration_days: number | null;
    created_at: string;
    admin: {
      profiles: { username: string };
    };
  };
  reviewer?: {
    profiles: { username: string };
  };
}

type StatusFilter = 'all' | 'pending' | 'under_review' | 'upheld' | 'overturned';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  upheld: 'bg-red-100 text-red-700',
  overturned: 'bg-green-100 text-green-700',
};

const actionLabels: Record<string, string> = {
  warn: 'Warning',
  suspend: 'Suspension',
  ban: 'Ban',
};

export default function AppealsPage() {
  const { adminRoleId, isSuperAdmin, isAdmin } = useAdminAuth();
  const { logAppealAction } = useAuditLog();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAppeals = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('appeals')
        .select(`
          *,
          user:profiles(username, avatar_url, account_status),
          action:user_moderation_actions(
            action,
            reason,
            duration_days,
            created_at,
            admin:admin_roles(profiles(username))
          ),
          reviewer:admin_roles!appeals_reviewed_by_fkey(profiles(username))
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppeals(data || []);
    } catch (error) {
      console.error('Error loading appeals:', error);
      toast.error('Failed to load appeals');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  async function startReview(appealId: string) {
    try {
      const { error } = await supabase
        .from('appeals')
        .update({
          status: 'under_review',
          reviewed_by: adminRoleId,
        })
        .eq('id', appealId);

      if (error) throw error;
      toast.success('Review started');
      loadAppeals();
    } catch (error) {
      console.error('Error starting review:', error);
      toast.error('Failed to start review');
    }
  }

  async function resolveAppeal(appealId: string, decision: 'upheld' | 'overturned') {
    if (!reviewNotes.trim()) {
      toast.error('Please provide review notes');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('appeals')
        .update({
          status: decision,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminRoleId,
        })
        .eq('id', appealId);

      if (error) throw error;

      // If overturned, lift the moderation action
      if (decision === 'overturned' && selectedAppeal) {
        // Mark the moderation action as inactive
        await supabase
          .from('user_moderation_actions')
          .update({ is_active: false })
          .eq('id', selectedAppeal.action_id);

        // If user is banned/suspended, restore them
        if (selectedAppeal.action.action === 'ban' || selectedAppeal.action.action === 'suspend') {
          await supabase
            .from('profiles')
            .update({ account_status: 'active', suspension_expires_at: null })
            .eq('id', selectedAppeal.user_id);
        }
      }

      await logAppealAction(decision === 'upheld' ? 'uphold' : 'overturn', appealId, {
        review_notes: reviewNotes,
        original_action: selectedAppeal?.action.action,
      });

      toast.success(`Appeal ${decision}`);
      setSelectedAppeal(null);
      setReviewNotes('');
      loadAppeals();
    } catch (error) {
      console.error('Error resolving appeal:', error);
      toast.error('Failed to resolve appeal');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Only admins and super admins can review appeals
  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Access Restricted</h2>
        <p className="text-gray-600 mt-1">
          Only Admins and Super Admins can review appeals
        </p>
      </div>
    );
  }

  const pendingCount = appeals.filter((a) => a.status === 'pending').length;
  const reviewCount = appeals.filter((a) => a.status === 'under_review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appeals</h1>
          <p className="text-gray-600 mt-1">
            Review user appeals for moderation actions
          </p>
        </div>
        <button
          onClick={loadAppeals}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{reviewCount}</div>
              <div className="text-sm text-gray-600">Under Review</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {appeals.filter((a) => a.status === 'upheld').length}
              </div>
              <div className="text-sm text-gray-600">Upheld</div>
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
                {appeals.filter((a) => a.status === 'overturned').length}
              </div>
              <div className="text-sm text-gray-600">Overturned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'under_review', 'upheld', 'overturned'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              statusFilter === status
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Appeals List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900">No appeals found</h2>
            <p className="text-gray-600 mt-1">
              {statusFilter === 'pending' ? 'No pending appeals to review' : 'No appeals match this filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appeals.map((appeal) => (
              <div
                key={appeal.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedAppeal(appeal);
                  setReviewNotes(appeal.review_notes || '');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {appeal.user?.avatar_url ? (
                        <img
                          src={appeal.user.avatar_url}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          @{appeal.user?.username || 'Unknown'}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          statusColors[appeal.status]
                        )}>
                          {appeal.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Appealing {actionLabels[appeal.action?.action] || appeal.action?.action} - {formatRelativeTime(appeal.created_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                {appeal.reason && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 pl-16">
                    "{appeal.reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Appeal Review
                </h2>
                <button
                  onClick={() => setSelectedAppeal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    @{selectedAppeal.user?.username || 'Unknown'}
                  </h3>
                  <p className={cn(
                    'text-sm',
                    selectedAppeal.user?.account_status === 'active'
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}>
                    Account: {selectedAppeal.user?.account_status || 'unknown'}
                  </p>
                </div>
              </div>

              {/* Original Action */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Original Action</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-red-600">Action:</span>{' '}
                    <span className="font-medium">
                      {actionLabels[selectedAppeal.action?.action] || selectedAppeal.action?.action}
                      {selectedAppeal.action?.duration_days && ` (${selectedAppeal.action.duration_days} days)`}
                    </span>
                  </p>
                  {selectedAppeal.action?.reason && (
                    <p>
                      <span className="text-red-600">Reason:</span>{' '}
                      {selectedAppeal.action.reason}
                    </p>
                  )}
                  <p>
                    <span className="text-red-600">By:</span>{' '}
                    @{selectedAppeal.action?.admin?.profiles?.username || 'Unknown admin'}
                  </p>
                  <p>
                    <span className="text-red-600">Date:</span>{' '}
                    {formatDateTime(selectedAppeal.action?.created_at)}
                  </p>
                </div>
              </div>

              {/* Appeal Reason */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User's Appeal</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedAppeal.reason}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted {formatRelativeTime(selectedAppeal.created_at)}
                  </p>
                </div>
              </div>

              {/* Review Notes */}
              {selectedAppeal.status !== 'upheld' && selectedAppeal.status !== 'overturned' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Review Notes</h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Explain your decision..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              )}

              {/* Previous Review */}
              {selectedAppeal.review_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Review Decision</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedAppeal.review_notes}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Reviewed by @{selectedAppeal.reviewer?.profiles?.username || 'Unknown'}{' '}
                      {selectedAppeal.reviewed_at && formatRelativeTime(selectedAppeal.reviewed_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {(selectedAppeal.status === 'pending' || selectedAppeal.status === 'under_review') && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
                {selectedAppeal.status === 'pending' && (
                  <button
                    onClick={() => startReview(selectedAppeal.id)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Start Review
                  </button>
                )}
                {selectedAppeal.status === 'under_review' && (
                  <>
                    <button
                      onClick={() => resolveAppeal(selectedAppeal.id, 'upheld')}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Uphold Action
                    </button>
                    <button
                      onClick={() => resolveAppeal(selectedAppeal.id, 'overturned')}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Overturn Action
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
