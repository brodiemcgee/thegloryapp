// Grid screen - user cards with filters and sorting

'use client';

import { useState, useMemo } from 'react';
import { mockUsers, currentUser } from '@/data/mockData';
import { User } from '@/types';
import { GridIcon } from './icons';
import UserCard from './UserCard';
import UserProfile from './UserProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { useFavorites } from '@/hooks/useFavorites';
import { calculateDistance } from '@/lib/geo';
import FilterBar, { FilterState, defaultFilters } from './FilterBar';

type SortOption = 'distance' | 'active';

export default function GridView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { position } = useGeolocation();
  const { favorites } = useFavorites();

  // Fetch real users from database
  const { users: dbUsers, currentUserProfile, loading } = useNearbyUsers(position, {});

  // Check if user is active within time threshold
  const isActiveWithin = (lastActive: string, minutes: number): boolean => {
    const lastActiveTime = new Date(lastActive).getTime();
    const now = Date.now();
    return (now - lastActiveTime) / (1000 * 60) <= minutes;
  };

  const filteredUsers = useMemo(() => {
    // Combine real DB users with mock users for demo
    const dbUserIds = new Set(dbUsers.map(u => u.id));
    const filteredMockUsers = mockUsers.filter(u => !dbUserIds.has(u.id));
    let result = [...dbUsers, ...filteredMockUsers];

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

    // Filter by online status
    if (filters.online === 'online') {
      result = result.filter((u) => u.last_active && isActiveWithin(u.last_active, 2));
    } else if (filters.online === 'recent') {
      result = result.filter((u) => u.last_active && isActiveWithin(u.last_active, 30));
    }

    // Filter by favorites
    if (filters.favorites) {
      const favoriteIds = new Set(favorites.map(f => f.target_user_id));
      result = result.filter((u) => favoriteIds.has(u.id));
    }

    // Filter by intent
    if (filters.intent !== 'all') {
      result = result.filter((u) => u.intent === filters.intent);
    }

    // Filter by age range
    if (filters.ageRange) {
      const [minAge, maxAge] = filters.ageRange;
      result = result.filter((u) => {
        if (!u.age) return false;
        return u.age >= minAge && u.age <= maxAge;
      });
    }

    // Filter by position
    if (filters.position !== 'all') {
      result = result.filter((u) => u.position === filters.position);
    }

    // Sort
    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    } else {
      result.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());
    }

    // Always show current user first (use db profile if available)
    const currentProfile = currentUserProfile || currentUser;
    result = result.filter(u => u.id !== currentProfile.id);
    return [{ ...currentProfile, distance_km: 0 }, ...result];
  }, [dbUsers, filters, sortBy, position, currentUserProfile, favorites]);

  if (selectedUser) {
    return <UserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="h-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hole-border">
        <h1 className="text-lg font-semibold">Nearby</h1>
        <div className="flex items-center gap-2">
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-hole-surface text-white text-sm rounded-lg px-2 py-1.5 outline-none border border-hole-border"
          >
            <option value="distance">By Distance</option>
            <option value="active">By Active</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            aria-label="Toggle view"
          >
            <GridIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* User grid/list */}
      <div className="flex-1 overflow-auto p-2">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-hole-muted">No users match your filters</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5'
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
