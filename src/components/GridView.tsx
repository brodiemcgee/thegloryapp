// Grid screen - user cards with filters and sorting

'use client';

import { useState, useMemo } from 'react';
import { mockUsers } from '@/data/mockData';
import { User, Intent } from '@/types';
import { FilterIcon, GridIcon, CheckIcon } from './icons';
import UserCard from './UserCard';
import UserProfile from './UserProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, sortByDistance } from '@/lib/geo';

type SortOption = 'distance' | 'active';
type FilterOption = Intent | 'all';

export default function GridView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [intentFilter, setIntentFilter] = useState<FilterOption>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { position } = useGeolocation();

  const filteredUsers = useMemo(() => {
    let result = [...mockUsers];

    // Filter out users with ghost mode enabled (they won't appear in the grid)
    // Note: In production, this would be handled by the backend/database query
    // Ghost mode users simply won't be returned in API responses
    // For now, we'll assume all mock users are visible (no ghost_mode property)

    // Calculate accurate distances if we have user position
    if (position) {
      result = result.map((user) => {
        if (user.location) {
          return {
            ...user,
            distance_km: calculateDistance(user.location, position),
          };
        }
        return user;
      });
    }

    // Filter by intent
    if (intentFilter !== 'all') {
      result = result.filter((u) => u.intent === intentFilter);
    }

    // Filter verified only
    if (verifiedOnly) {
      result = result.filter((u) => u.is_verified);
    }

    // Sort
    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    } else {
      result.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());
    }

    return result;
  }, [intentFilter, verifiedOnly, sortBy, position]);

  const intentOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'looking', label: 'Looking' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'discrete', label: 'Discrete' },
  ];

  if (selectedUser) {
    return <UserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hole-border">
        <h1 className="text-lg font-semibold">Nearby</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            aria-label="Toggle view"
          >
            <GridIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-hole-accent text-white' : 'hover:bg-hole-surface'
            }`}
            aria-label="Toggle filters"
          >
            <FilterIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 border-b border-hole-border bg-hole-surface space-y-4">
          {/* Intent filter */}
          <div>
            <label className="text-sm text-hole-muted mb-2 block">Intent</label>
            <div className="flex flex-wrap gap-2">
              {intentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntentFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    intentFilter === opt.value
                      ? 'bg-hole-accent text-white'
                      : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort and verified */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-hole-muted">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-hole-border text-white text-sm rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="distance">Distance</option>
                <option value="active">Last active</option>
              </select>
            </div>
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                verifiedOnly ? 'bg-blue-500 text-white' : 'bg-hole-border text-gray-300'
              }`}
            >
              <CheckIcon className="w-4 h-4" />
              Verified only
            </button>
          </div>
        </div>
      )}

      {/* User grid/list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hole-muted">No users match your filters</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                : 'flex flex-col gap-2'
            }
          >
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                variant={viewMode}
                onClick={() => setSelectedUser(user)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
