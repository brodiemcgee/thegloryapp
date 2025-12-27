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

const MIN_AGE = 18;
const MAX_AGE = 70;
const MIN_AGE_RANGE = 5; // Minimum span between min and max age

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
          {filters.ageRange ? `${filters.ageRange[0]}-${filters.ageRange[1]}` : 'Age'}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  Age: {filters.ageRange ? `${filters.ageRange[0]} - ${filters.ageRange[1]}` : `${MIN_AGE} - ${MAX_AGE}`}
                </span>
                {filters.ageRange && (
                  <button
                    onClick={() => onChange({ ...filters, ageRange: null })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-hole-muted w-8">{MIN_AGE}</span>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-hole-muted block mb-1">Min</label>
                      <input
                        type="range"
                        min={MIN_AGE}
                        max={MAX_AGE - MIN_AGE_RANGE}
                        value={filters.ageRange?.[0] ?? MIN_AGE}
                        onChange={(e) => {
                          const minVal = Number(e.target.value);
                          const currentMax = filters.ageRange?.[1] ?? MAX_AGE;
                          // Ensure at least MIN_AGE_RANGE years between min and max
                          const maxVal = Math.max(currentMax, minVal + MIN_AGE_RANGE);
                          onChange({
                            ...filters,
                            ageRange: [minVal, Math.min(maxVal, MAX_AGE)]
                          });
                        }}
                        className="w-full h-2 bg-hole-border rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-hole-muted block mb-1">Max</label>
                      <input
                        type="range"
                        min={MIN_AGE + MIN_AGE_RANGE}
                        max={MAX_AGE}
                        value={filters.ageRange?.[1] ?? MAX_AGE}
                        onChange={(e) => {
                          const maxVal = Number(e.target.value);
                          const currentMin = filters.ageRange?.[0] ?? MIN_AGE;
                          // Ensure at least MIN_AGE_RANGE years between min and max
                          const minVal = Math.min(currentMin, maxVal - MIN_AGE_RANGE);
                          onChange({
                            ...filters,
                            ageRange: [Math.max(minVal, MIN_AGE), maxVal]
                          });
                        }}
                        className="w-full h-2 bg-hole-border rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-hole-muted w-8 text-right">{MAX_AGE}</span>
              </div>
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
