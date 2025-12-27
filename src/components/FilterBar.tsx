// Horizontal filter bar component for Map and Grid views

'use client';

import { useState } from 'react';
import { Intent, Position } from '@/types';

export interface FilterState {
  online: 'all' | 'online' | 'recent';
  favorites: boolean;
  intent: Intent | 'all';
  ageRange: [number, number] | null;
  position: Position | 'all';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  showFavorites?: boolean;
}

const INTENT_OPTIONS: { value: Intent | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-hole-border' },
  { value: 'looking_now', label: 'Now', color: 'bg-red-500' },
  { value: 'looking_later', label: 'Later', color: 'bg-blue-500' },
  { value: 'chatting', label: 'Chat', color: 'bg-amber-500' },
  { value: 'friends', label: 'Friends', color: 'bg-green-500' },
];

const POSITION_OPTIONS: { value: Position | 'all'; label: string }[] = [
  { value: 'all', label: 'Any Pos' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'vers', label: 'Vers' },
  { value: 'vers_top', label: 'V.Top' },
  { value: 'vers_bottom', label: 'V.Btm' },
  { value: 'side', label: 'Side' },
];

const ONLINE_OPTIONS: { value: 'all' | 'online' | 'recent'; label: string }[] = [
  { value: 'all', label: 'Anyone' },
  { value: 'online', label: 'Online' },
  { value: 'recent', label: 'Recent' },
];

const AGE_OPTIONS: { value: [number, number] | null; label: string }[] = [
  { value: null, label: 'Any Age' },
  { value: [18, 25], label: '18-25' },
  { value: [25, 35], label: '25-35' },
  { value: [35, 45], label: '35-45' },
  { value: [45, 99], label: '45+' },
];

export default function FilterBar({ filters, onChange, showFavorites = true }: FilterBarProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const toggleFilter = (filterName: string) => {
    setExpandedFilter(expandedFilter === filterName ? null : filterName);
  };

  const getActiveCount = () => {
    let count = 0;
    if (filters.online !== 'all') count++;
    if (filters.favorites) count++;
    if (filters.intent !== 'all') count++;
    if (filters.ageRange !== null) count++;
    if (filters.position !== 'all') count++;
    return count;
  };

  const activeCount = getActiveCount();

  return (
    <div className="border-b border-hole-border bg-hole-bg">
      {/* Main filter chips - horizontally scrollable */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
        {/* Online filter */}
        <button
          onClick={() => toggleFilter('online')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.online !== 'all'
              ? 'bg-green-500 text-white'
              : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
          }`}
        >
          {filters.online === 'all' ? 'Online' : filters.online === 'online' ? '● Online' : '◐ Recent'}
        </button>

        {/* Favorites filter */}
        {showFavorites && (
          <button
            onClick={() => onChange({ ...filters, favorites: !filters.favorites })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.favorites
                ? 'bg-pink-500 text-white'
                : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
            }`}
          >
            {filters.favorites ? '★ Favs' : '☆ Favs'}
          </button>
        )}

        {/* Intent filter */}
        <button
          onClick={() => toggleFilter('intent')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.intent !== 'all'
              ? INTENT_OPTIONS.find(o => o.value === filters.intent)?.color + ' text-white'
              : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
          }`}
        >
          {filters.intent === 'all' ? 'Intent' : INTENT_OPTIONS.find(o => o.value === filters.intent)?.label}
        </button>

        {/* Age filter */}
        <button
          onClick={() => toggleFilter('age')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.ageRange !== null
              ? 'bg-purple-500 text-white'
              : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
          }`}
        >
          {filters.ageRange ? `${filters.ageRange[0]}-${filters.ageRange[1] === 99 ? '+' : filters.ageRange[1]}` : 'Age'}
        </button>

        {/* Position filter */}
        <button
          onClick={() => toggleFilter('position')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filters.position !== 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-hole-surface text-gray-300 hover:bg-hole-border'
          }`}
        >
          {filters.position === 'all' ? 'Position' : POSITION_OPTIONS.find(o => o.value === filters.position)?.label}
        </button>

        {/* Clear all button */}
        {activeCount > 0 && (
          <button
            onClick={() => onChange({
              online: 'all',
              favorites: false,
              intent: 'all',
              ageRange: null,
              position: 'all',
            })}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-hole-surface text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Expanded filter options */}
      {expandedFilter && (
        <div className="px-3 py-2 border-t border-hole-border bg-hole-surface">
          {expandedFilter === 'online' && (
            <div className="flex flex-wrap gap-2">
              {ONLINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange({ ...filters, online: opt.value });
                    setExpandedFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.online === opt.value
                      ? 'bg-green-500 text-white'
                      : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {expandedFilter === 'intent' && (
            <div className="flex flex-wrap gap-2">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange({ ...filters, intent: opt.value });
                    setExpandedFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.intent === opt.value
                      ? opt.color + ' text-white'
                      : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {expandedFilter === 'age' && (
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChange({ ...filters, ageRange: opt.value });
                    setExpandedFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    JSON.stringify(filters.ageRange) === JSON.stringify(opt.value)
                      ? 'bg-purple-500 text-white'
                      : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {expandedFilter === 'position' && (
            <div className="flex flex-wrap gap-2">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange({ ...filters, position: opt.value });
                    setExpandedFilter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.position === opt.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Default filter state
export const defaultFilters: FilterState = {
  online: 'all',
  favorites: false,
  intent: 'all',
  ageRange: null,
  position: 'all',
};
