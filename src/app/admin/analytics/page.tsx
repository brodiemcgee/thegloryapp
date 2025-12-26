'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Image,
  MessageSquare,
  Flag,
  Shield,
  Ban,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { cn, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface DailyMetric {
  date: string;
  users: number;
  photos: number;
  messages: number;
  reports: number;
}

interface ModerationMetric {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export default function AnalyticsPage() {
  const { adminRole } = useAdminAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersToday, setNewUsersToday] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [openReports, setOpenReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const [bannedUsers, setBannedUsers] = useState(0);

  // Chart data
  const [userGrowthData, setUserGrowthData] = useState<DailyMetric[]>([]);
  const [moderationData, setModerationData] = useState<ModerationMetric[]>([]);
  const [reportsByReason, setReportsByReason] = useState<ModerationMetric[]>([]);
  const [activityData, setActivityData] = useState<DailyMetric[]>([]);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(usersCount || 0);

      // Fetch active users (active in last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', yesterday.toISOString());
      setActiveUsers(activeCount || 0);

      // Fetch new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      setNewUsersToday(newCount || 0);

      // Fetch total photos
      const { count: photosCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true });
      setTotalPhotos(photosCount || 0);

      // Fetch total messages
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      setTotalMessages(messagesCount || 0);

      // Fetch open reports
      const { count: openCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      setOpenReports(openCount || 0);

      // Fetch resolved reports
      const { count: resolvedCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');
      setResolvedReports(resolvedCount || 0);

      // Fetch banned users
      const { count: bannedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'banned');
      setBannedUsers(bannedCount || 0);

      // Generate user growth chart data
      const growthData: DailyMetric[] = [];
      for (let i = daysBack; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { count: dayUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', date.toISOString());

        growthData.push({
          date: dateStr,
          users: dayUsers || 0,
          photos: 0,
          messages: 0,
          reports: 0,
        });

        // Only sample every few days for longer ranges to reduce queries
        if (daysBack > 30 && i % 7 !== 0 && i !== 0) continue;
      }
      setUserGrowthData(growthData.filter((_, i) => daysBack <= 30 || i % 7 === 0 || i === growthData.length - 1));

      // Fetch moderation action breakdown
      const { data: actionData } = await supabase
        .from('user_moderation_actions')
        .select('action')
        .gte('created_at', startDate.toISOString());

      const actionCounts: Record<string, number> = {
        warn: 0,
        suspend: 0,
        ban: 0,
        unban: 0,
        verify: 0,
      };
      (actionData || []).forEach((item) => {
        if (actionCounts[item.action] !== undefined) {
          actionCounts[item.action]++;
        }
      });

      setModerationData([
        { name: 'Warnings', value: actionCounts.warn, color: '#FCD34D' },
        { name: 'Suspensions', value: actionCounts.suspend, color: '#FB923C' },
        { name: 'Bans', value: actionCounts.ban, color: '#EF4444' },
        { name: 'Unbans', value: actionCounts.unban, color: '#22C55E' },
        { name: 'Verifications', value: actionCounts.verify, color: '#3B82F6' },
      ]);

      // Fetch reports by reason
      const { data: reasonData } = await supabase
        .from('reports')
        .select('reason')
        .gte('created_at', startDate.toISOString());

      const reasonCounts: Record<string, number> = {};
      (reasonData || []).forEach((item) => {
        reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
      });

      const reasonColors: Record<string, string> = {
        harassment: '#EF4444',
        spam: '#6B7280',
        fake_profile: '#8B5CF6',
        inappropriate_content: '#F97316',
        underage: '#DC2626',
        violence: '#B91C1C',
        other: '#9CA3AF',
      };

      setReportsByReason(
        Object.entries(reasonCounts).map(([name, value]) => ({
          name: name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value,
          color: reasonColors[name] || '#9CA3AF',
        }))
      );

      // Generate activity data (simplified - would need proper aggregation in production)
      const activityData: DailyMetric[] = [];
      const sampleDays = Math.min(daysBack, 14);
      for (let i = sampleDays; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count: dayPhotos } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        const { count: dayMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        const { count: dayReports } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        activityData.push({
          date: dateStr,
          users: 0,
          photos: dayPhotos || 0,
          messages: dayMessages || 0,
          reports: dayReports || 0,
        });
      }
      setActivityData(activityData);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active (24h)',
      value: activeUsers,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'New Today',
      value: newUsersToday,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Photos',
      value: totalPhotos,
      icon: Image,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Total Messages',
      value: totalMessages,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Open Reports',
      value: openReports,
      icon: Flag,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Resolved Reports',
      value: resolvedReports,
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Banned Users',
      value: bannedUsers,
      icon: Ban,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Platform metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.success('Export started')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.title}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bgColor)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatNumber(stat.value)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#userGradient)"
                  name="Total Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="photos" name="Photos" fill="#EC4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="messages" name="Messages" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reports" name="Reports" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moderation Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Actions</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : moderationData.every((d) => d.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No moderation actions in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={moderationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {moderationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Reports by Reason */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Reason</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : reportsByReason.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No reports in this period
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={reportsByReason}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportsByReason.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? '-' : formatNumber(openReports + resolvedReports)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Reports</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? '-' : resolvedReports}
            </div>
            <div className="text-sm text-gray-600 mt-1">Resolved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? '-' : openReports}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {isLoading || (openReports + resolvedReports) === 0
                ? '-'
                : `${Math.round((resolvedReports / (openReports + resolvedReports)) * 100)}%`}
            </div>
            <div className="text-sm text-gray-600 mt-1">Resolution Rate</div>
          </div>
        </div>
      </div>

      {/* Super Admin Only: Revenue Section */}
      {adminRole === 'super_admin' && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue Analytics</h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Super Admin Only</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">$0</div>
              <div className="text-sm text-purple-200 mt-1">MRR</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-purple-200 mt-1">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">0%</div>
              <div className="text-sm text-purple-200 mt-1">Churn Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">$0</div>
              <div className="text-sm text-purple-200 mt-1">LTV</div>
            </div>
          </div>
          <p className="text-sm text-purple-200 mt-4 text-center">
            Revenue tracking will be available once subscriptions are implemented
          </p>
        </div>
      )}
    </div>
  );
}
