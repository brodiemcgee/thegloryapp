'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Image,
  Flag,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatRelativeTime } from '@/lib/utils';
import { StatsCard } from '@/components/admin/StatsCard';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';

interface DashboardStats {
  activeUsers24h: number;
  pendingPhotos: number;
  openReports: number;
  newLocations: number;
  activeUsersTrend: number;
  reportsTrend: number;
}

interface PriorityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  link: string;
  time: string;
}

interface ActivityItem {
  id: string;
  action: string;
  admin: string;
  target: string;
  time: string;
}

export default function AdminDashboard() {
  const { adminProfile, isSuperAdmin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers24h: 0,
    pendingPhotos: 0,
    openReports: 0,
    newLocations: 0,
    activeUsersTrend: 0,
    reportsTrend: 0,
  });
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);

      // Fetch stats in parallel
      const [
        activeUsersResult,
        pendingPhotosResult,
        openReportsResult,
        newLocationsResult,
        recentActivityResult,
      ] = await Promise.all([
        // Active users in last 24h
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Pending photo reviews
        supabase
          .from('reported_photo_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Open reports
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),

        // New locations (pending)
        supabase
          .from('location_moderation')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Recent activity from audit logs
        supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            resource_type,
            resource_id,
            created_at,
            admin_roles(
              profiles(username)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setStats({
        activeUsers24h: activeUsersResult.count || 0,
        pendingPhotos: pendingPhotosResult.count || 0,
        openReports: openReportsResult.count || 0,
        newLocations: newLocationsResult.count || 0,
        activeUsersTrend: 8.5, // Mock trend data
        reportsTrend: -12.3,
      });

      // Load priority alerts (high priority + critical reports)
      const { data: priorityReports } = await supabase
        .from('reports')
        .select('id, reason, created_at, reported_id')
        .in('priority', ['high', 'critical'])
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      if (priorityReports) {
        const alertItems: PriorityAlert[] = priorityReports.map((report) => ({
          id: report.id,
          type: report.reason === 'underage' || report.reason === 'violence' ? 'critical' : 'high',
          title: `${report.reason.replace('_', ' ').toUpperCase()} Report`,
          description: `Report #${report.id.slice(0, 8)} requires attention`,
          link: `/admin/reports/${report.id}`,
          time: formatRelativeTime(report.created_at),
        }));
        setAlerts(alertItems);
      }

      // Map activity items
      if (recentActivityResult.data) {
        const activityItems: ActivityItem[] = recentActivityResult.data.map((log: any) => ({
          id: log.id,
          action: formatAction(log.action),
          admin: log.admin_roles?.profiles?.username || 'Unknown',
          target: log.resource_type,
          time: formatRelativeTime(log.created_at),
        }));
        setActivities(activityItems);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatAction(action: string): string {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {adminProfile?.username || 'Admin'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Users (24h)"
          value={stats.activeUsers24h}
          trend={stats.activeUsersTrend}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Pending Photos"
          value={stats.pendingPhotos}
          icon={Image}
          color="blue"
          href="/admin/photos"
        />
        <StatsCard
          title="Open Reports"
          value={stats.openReports}
          trend={stats.reportsTrend}
          icon={Flag}
          color="red"
          href="/admin/reports"
        />
        <StatsCard
          title="New Locations"
          value={stats.newLocations}
          icon={MapPin}
          color="green"
          href="/admin/locations"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-900">Priority Alerts</h2>
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">All clear!</p>
                <p className="text-gray-500 text-sm mt-1">No urgent items require attention</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.link}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-2 h-2 mt-2 rounded-full flex-shrink-0',
                      alert.type === 'critical' && 'bg-red-500',
                      alert.type === 'high' && 'bg-orange-500',
                      alert.type === 'medium' && 'bg-yellow-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{alert.time}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          {alerts.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href="/admin/reports?priority=high,critical"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View all priority reports
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/admin/photos"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Photos</p>
                <p className="text-sm text-gray-500">{stats.pendingPhotos} pending</p>
              </div>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Investigate Reports</p>
                <p className="text-sm text-gray-500">{stats.openReports} open</p>
              </div>
            </Link>
            <Link
              href="/admin/locations"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Approve Locations</p>
                <p className="text-sm text-gray-500">{stats.newLocations} pending</p>
              </div>
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">User & moderation metrics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <Link
            href="/admin/audit"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 px-6 py-3"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {activity.admin.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.admin}</span>
                    {' '}
                    {activity.action.toLowerCase()}
                    {' '}
                    <span className="text-gray-600">{activity.target}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {activity.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
