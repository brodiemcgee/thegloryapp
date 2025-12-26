'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Crown,
  Eye,
  MoreVertical,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAuditLog } from '@/hooks/admin/useAuditLog';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AdminMember {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive';
  last_admin_login: string | null;
  created_at: string;
  profile: {
    username: string;
    avatar_url: string | null;
  } | null;
  invited_by_profile?: {
    profiles: { username: string };
  } | null;
  stats?: {
    actions_taken: number;
    reports_resolved: number;
  };
}

interface InviteModalState {
  isOpen: boolean;
  email: string;
  role: 'admin' | 'moderator';
  isSubmitting: boolean;
}

const roleIcons = {
  super_admin: Crown,
  admin: Shield,
  moderator: Eye,
};

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
};

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  moderator: 'bg-gray-100 text-gray-700',
};

export default function TeamPage() {
  const { isSuperAdmin, adminRoleId } = useAdminAuth();
  const { logAction } = useAuditLog();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState<InviteModalState>({
    isOpen: false,
    email: '',
    role: 'moderator',
    isSubmitting: false,
  });
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('admin_roles')
        .select(`
          *,
          profile:profiles(username, avatar_url),
          invited_by_profile:admin_roles!admin_roles_invited_by_fkey(profiles(username))
        `)
        .order('role', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each admin
      const membersWithStats = await Promise.all(
        (data || []).map(async (member) => {
          const { count: actionsCount } = await supabase
            .from('user_moderation_actions')
            .select('*', { count: 'exact', head: true })
            .eq('admin_id', member.id);

          const { count: reportsCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('resolved_by', member.id);

          return {
            ...member,
            stats: {
              actions_taken: actionsCount || 0,
              reports_resolved: reportsCount || 0,
            },
          };
        })
      );

      setMembers(membersWithStats);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function updateMemberRole(memberId: string, newRole: 'admin' | 'moderator') {
    if (!isSuperAdmin) {
      toast.error('Only super admins can change roles');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      await logAction({
        action: 'update',
        resourceType: 'admin',
        resourceId: memberId,
        details: { new_role: newRole },
      });

      toast.success(`Role updated to ${roleLabels[newRole]}`);
      loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  }

  async function toggleMemberStatus(memberId: string, currentStatus: string) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can change status');
      return;
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      await logAction({
        action: 'update',
        resourceType: 'admin',
        resourceId: memberId,
        details: { new_status: newStatus },
      });

      toast.success(`Admin ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      loadMembers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  }

  async function removeMember(memberId: string) {
    if (!isSuperAdmin) {
      toast.error('Only super admins can remove members');
      return;
    }

    if (!confirm('Are you sure you want to remove this admin? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await logAction({
        action: 'delete',
        resourceType: 'admin',
        resourceId: memberId,
      });

      toast.success('Admin removed');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove admin');
    }
  }

  async function inviteAdmin() {
    if (!isSuperAdmin) {
      toast.error('Only super admins can invite new admins');
      return;
    }

    // For now, show a placeholder message
    // In production, this would send an email invitation
    toast.success(`Invitation would be sent to ${inviteModal.email}`);
    setInviteModal({ ...inviteModal, isOpen: false, email: '' });
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Access Restricted</h2>
        <p className="text-gray-600 mt-1">
          Only Super Admins can access team management
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage admins and moderators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMembers}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setInviteModal({ ...inviteModal, isOpen: true })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4" />
            Invite Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['super_admin', 'admin', 'moderator'] as const).map((role) => {
          const count = members.filter((m) => m.role === role && m.status === 'active').length;
          const Icon = roleIcons[role];
          return (
            <div key={role} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', roleColors[role])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{roleLabels[role]}s</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Table */}
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
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900">No team members</h2>
            <p className="text-gray-600 mt-1">Invite your first admin to get started</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-4">Member</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Last Login</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                return (
                  <div
                    key={member.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center"
                  >
                    {/* Member Info */}
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-gray-500">
                            {member.profile?.username?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          @{member.profile?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.stats?.actions_taken || 0} actions, {member.stats?.reports_resolved || 0} reports
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        roleColors[member.role]
                      )}>
                        <RoleIcon className="w-3 h-3" />
                        {roleLabels[member.role]}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {member.status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </div>

                    {/* Last Login */}
                    <div className="col-span-2 text-sm text-gray-600">
                      {member.last_admin_login
                        ? formatRelativeTime(member.last_admin_login)
                        : 'Never'}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 relative">
                      {member.role !== 'super_admin' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          {selectedMember === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              {member.role === 'moderator' && (
                                <button
                                  onClick={() => {
                                    updateMemberRole(member.id, 'admin');
                                    setSelectedMember(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  Promote to Admin
                                </button>
                              )}
                              {member.role === 'admin' && (
                                <button
                                  onClick={() => {
                                    updateMemberRole(member.id, 'moderator');
                                    setSelectedMember(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  Demote to Moderator
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  toggleMemberStatus(member.id, member.status);
                                  setSelectedMember(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                {member.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  removeMember(member.id);
                                  setSelectedMember(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {inviteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invite New Admin
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteModal.email}
                  onChange={(e) => setInviteModal({ ...inviteModal, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteModal.role}
                  onChange={(e) => setInviteModal({ ...inviteModal, role: e.target.value as 'admin' | 'moderator' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Role Permissions:</p>
                <ul className="space-y-1">
                  <li><strong>Moderator:</strong> Review content, manage reports</li>
                  <li><strong>Admin:</strong> All moderator permissions + user management, analytics</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setInviteModal({ ...inviteModal, isOpen: false })}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={inviteAdmin}
                disabled={!inviteModal.email || inviteModal.isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
