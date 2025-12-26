'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Shield,
  Ban,
  Clock,
  Calendar,
  MapPin,
  Flag,
  Image,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatDateTime, formatRelativeTime, formatDate } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import toast from 'react-hot-toast';

interface UserDetail {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  intent: string | null;
  availability: string | null;
  is_verified: boolean;
  is_online: boolean;
  account_status: string;
  last_active: string;
  created_at: string;
  ghost_mode: boolean;
  hide_from_contacts: boolean;
  verified_at: string | null;
  suspension_expires_at: string | null;
}

interface Photo {
  id: string;
  url: string;
  is_primary: boolean;
  is_nsfw: boolean;
  created_at: string;
}

interface ModerationAction {
  id: string;
  action: string;
  reason: string | null;
  duration_days: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  admin: {
    profiles: { username: string };
  };
}

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { adminRoleId, isSuperAdmin } = useAdminAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [reportsAgainst, setReportsAgainst] = useState<Report[]>([]);
  const [reportsFiled, setReportsFiled] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'reports' | 'history'>('profile');

  useEffect(() => {
    loadUserData();
  }, [userId]);

  async function loadUserData() {
    try {
      setIsLoading(true);

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch user's photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('profile_id', userId)
        .order('is_primary', { ascending: false });

      setPhotos(photosData || []);

      // Fetch moderation history
      const { data: historyData } = await supabase
        .from('user_moderation_actions')
        .select(`
          *,
          admin:admin_roles(profiles(username))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setModerationHistory(historyData || []);

      // Fetch reports against this user
      const { data: reportsAgainstData } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .eq('reported_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setReportsAgainst(reportsAgainstData || []);

      // Fetch reports filed by this user
      const { data: reportsFiledData } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setReportsFiled(reportsFiledData || []);

    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }

  async function suspendUser(days: number) {
    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc('suspend_user', {
        p_user_id: userId,
        p_reason: 'Admin action from user management',
        p_duration_days: days,
      });

      if (error) throw error;
      toast.success(`User suspended for ${days} days`);
      loadUserData();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function banUser() {
    if (!confirm('Are you sure you want to permanently ban this user?')) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc('ban_user', {
        p_user_id: userId,
        p_reason: 'Admin action from user management',
      });

      if (error) throw error;
      toast.success('User permanently banned');
      loadUserData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function unbanUser() {
    try {
      setIsSubmitting(true);

      const { error } = await supabase.rpc('unban_user', {
        p_user_id: userId,
        p_reason: 'Admin action from user management',
      });

      if (error) throw error;
      toast.success('User unbanned');
      loadUserData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyUser() {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminRoleId,
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User verified');
      loadUserData();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to verify user');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">User not found</h2>
        <Link href="/admin/users" className="text-purple-600 hover:underline mt-2 inline-block">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              @{user.username}
            </h1>
            {user.is_verified && (
              <Shield className="w-6 h-6 text-blue-500" />
            )}
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                user.account_status === 'active' && 'bg-green-100 text-green-700',
                user.account_status === 'suspended' && 'bg-yellow-100 text-yellow-700',
                user.account_status === 'banned' && 'bg-red-100 text-red-700'
              )}
            >
              {user.account_status?.charAt(0).toUpperCase() + user.account_status?.slice(1)}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Member since {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {(['profile', 'photos', 'reports', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
                      activeTab === tab
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'reports' && reportsAgainst.length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                        {reportsAgainst.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      {user.bio && (
                        <p className="text-gray-700 mb-4">{user.bio}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {user.age && (
                          <div>
                            <span className="text-sm text-gray-500">Age</span>
                            <p className="font-medium">{user.age}</p>
                          </div>
                        )}
                        {user.intent && (
                          <div>
                            <span className="text-sm text-gray-500">Intent</span>
                            <p className="font-medium capitalize">{user.intent}</p>
                          </div>
                        )}
                        {user.availability && (
                          <div>
                            <span className="text-sm text-gray-500">Availability</span>
                            <p className="font-medium capitalize">{user.availability}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm text-gray-500">Online</span>
                          <p className="font-medium flex items-center gap-2">
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              user.is_online ? 'bg-green-500' : 'bg-gray-400'
                            )} />
                            {user.is_online ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Joined</span>
                      </div>
                      <p className="font-medium">{formatDate(user.created_at)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Last Active</span>
                      </div>
                      <p className="font-medium">{formatRelativeTime(user.last_active)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Image className="w-4 h-4" />
                        <span className="text-sm">Photos</span>
                      </div>
                      <p className="font-medium">{photos.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Flag className="w-4 h-4" />
                        <span className="text-sm">Reports Against</span>
                      </div>
                      <p className={cn(
                        'font-medium',
                        reportsAgainst.length > 0 && 'text-red-600'
                      )}>
                        {reportsAgainst.length}
                      </p>
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-600">Ghost Mode</span>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          user.ghost_mode ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                        )}>
                          {user.ghost_mode ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-600">Hide from Contacts</span>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          user.hide_from_contacts ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                        )}>
                          {user.hide_from_contacts ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div>
                  {photos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No photos uploaded</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square rounded-lg overflow-hidden relative group"
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {photo.is_primary && (
                            <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                          {photo.is_nsfw && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                              NSFW
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Reports Against This User</h3>
                    {reportsAgainst.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No reports</p>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                        {reportsAgainst.map((report) => (
                          <Link
                            key={report.id}
                            href={`/admin/reports/${report.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                          >
                            <div>
                              <span className="font-medium capitalize">{report.reason.replace('_', ' ')}</span>
                              <p className="text-sm text-gray-500">{formatRelativeTime(report.created_at)}</p>
                            </div>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              report.status === 'resolved' && 'bg-green-100 text-green-700',
                              report.status === 'open' && 'bg-yellow-100 text-yellow-700',
                              report.status === 'dismissed' && 'bg-gray-100 text-gray-600'
                            )}>
                              {report.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Reports Filed By This User</h3>
                    {reportsFiled.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No reports filed</p>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                        {reportsFiled.map((report) => (
                          <Link
                            key={report.id}
                            href={`/admin/reports/${report.id}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                          >
                            <div>
                              <span className="font-medium capitalize">{report.reason.replace('_', ' ')}</span>
                              <p className="text-sm text-gray-500">{formatRelativeTime(report.created_at)}</p>
                            </div>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              report.status === 'resolved' && 'bg-green-100 text-green-700',
                              report.status === 'open' && 'bg-yellow-100 text-yellow-700',
                              report.status === 'dismissed' && 'bg-gray-100 text-gray-600'
                            )}>
                              {report.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {moderationHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No moderation history</p>
                  ) : (
                    <div className="space-y-4">
                      {moderationHistory.map((action) => (
                        <div
                          key={action.id}
                          className={cn(
                            'border rounded-lg p-4',
                            action.is_active ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium',
                                action.action === 'ban' && 'bg-red-100 text-red-700',
                                action.action === 'suspend' && 'bg-yellow-100 text-yellow-700',
                                action.action === 'warn' && 'bg-orange-100 text-orange-700',
                                action.action === 'unban' && 'bg-green-100 text-green-700',
                                action.action === 'verify' && 'bg-blue-100 text-blue-700'
                              )}>
                                {action.action === 'ban' && <Ban className="w-3 h-3" />}
                                {action.action.charAt(0).toUpperCase() + action.action.slice(1)}
                              </span>
                              {action.is_active && (
                                <span className="ml-2 text-xs text-yellow-700 font-medium">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(action.created_at)}
                            </span>
                          </div>
                          {action.reason && (
                            <p className="text-sm text-gray-600 mt-2">{action.reason}</p>
                          )}
                          {action.duration_days && (
                            <p className="text-sm text-gray-500 mt-1">
                              Duration: {action.duration_days} days
                              {action.expires_at && ` (expires ${formatDateTime(action.expires_at)})`}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            By {action.admin?.profiles?.username || 'Unknown admin'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              {!user.is_verified && (
                <button
                  onClick={verifyUser}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Verify User
                </button>
              )}

              {user.account_status === 'active' && (
                <>
                  <div className="border-t border-gray-200 pt-3">
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
                </>
              )}

              {(user.account_status === 'suspended' || user.account_status === 'banned') && (
                <button
                  onClick={unbanUser}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Remove Ban/Suspension
                </button>
              )}
            </div>
          </div>

          {/* Suspension Info */}
          {user.account_status === 'suspended' && user.suspension_expires_at && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Suspended</span>
              </div>
              <p className="text-sm text-yellow-600">
                Suspension expires {formatDateTime(user.suspension_expires_at)}
              </p>
            </div>
          )}

          {/* Verified Info */}
          {user.is_verified && user.verified_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Verified</span>
              </div>
              <p className="text-sm text-blue-600">
                Verified on {formatDate(user.verified_at)}
              </p>
            </div>
          )}

          {/* Stats Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Reports Against</span>
                <span className={cn(
                  'font-medium',
                  reportsAgainst.length > 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {reportsAgainst.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Reports Filed</span>
                <span className="font-medium text-gray-900">{reportsFiled.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Photos</span>
                <span className="font-medium text-gray-900">{photos.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Mod Actions</span>
                <span className="font-medium text-gray-900">{moderationHistory.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
