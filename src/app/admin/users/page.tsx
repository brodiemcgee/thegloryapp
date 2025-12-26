'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn, formatRelativeTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  is_verified: boolean;
  is_online: boolean;
  account_status: string;
  last_active: string;
  created_at: string;
  _report_count?: number;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'banned';
type VerifiedFilter = 'all' | 'verified' | 'unverified';

const PAGE_SIZE = 50;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      // Apply search
      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('account_status', statusFilter);
      }

      // Apply verified filter
      if (verifiedFilter === 'verified') {
        query = query.eq('is_verified', true);
      } else if (verifiedFilter === 'unverified') {
        query = query.eq('is_verified', false);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, verifiedFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, verifiedFilter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            {totalCount.toLocaleString()} total users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Export functionality placeholder
              toast.success('Export started');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as VerifiedFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900">No users found</h2>
            <p className="text-gray-600 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2">Last Active</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserProfile }) {
  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
    >
      {/* User Info */}
      <div className="col-span-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-500">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {user.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              @{user.username}
            </span>
            {user.is_verified && (
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-gray-500 truncate">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            user.account_status === 'active' && 'bg-green-100 text-green-700',
            user.account_status === 'suspended' && 'bg-yellow-100 text-yellow-700',
            user.account_status === 'banned' && 'bg-red-100 text-red-700'
          )}
        >
          {user.account_status === 'banned' && <Ban className="w-3 h-3" />}
          {user.account_status === 'suspended' && <AlertTriangle className="w-3 h-3" />}
          {user.account_status?.charAt(0).toUpperCase() + user.account_status?.slice(1) || 'Active'}
        </span>
      </div>

      {/* Joined */}
      <div className="col-span-2 text-sm text-gray-600">
        {formatDate(user.created_at)}
      </div>

      {/* Last Active */}
      <div className="col-span-2 text-sm text-gray-600">
        {formatRelativeTime(user.last_active)}
      </div>

      {/* Actions */}
      <div className="col-span-2 text-sm text-purple-600 font-medium">
        View Profile →
      </div>
    </Link>
  );
}
