// Encounter card component - displays a single encounter entry

'use client';

import { Encounter } from '@/hooks/useEncounters';
import { EXPERIENCE_TAG_OPTIONS } from './ManualEncounterModal';

// Activity labels for display
const ACTIVITY_LABELS: Record<string, string> = {
  topped: 'Topped',
  bottomed: 'Bottomed',
  vers: 'Vers',
  gave_oral: 'Gave Oral',
  received_oral: 'Received Oral',
  mutual_oral: 'Mutual Oral',
  rimming_gave: 'Gave Rimming',
  rimming_received: 'Received Rimming',
  mutual_jo: 'Mutual JO',
  making_out: 'Making Out',
  other: 'Other',
};

// Location labels for display
const LOCATION_LABELS: Record<string, string> = {
  my_place: 'My Place',
  their_place: 'Their Place',
  hotel: 'Hotel',
  sauna: 'Sauna',
  bathhouse: 'Bathhouse',
  park: 'Park',
  car: 'Car',
  gym: 'Gym',
  bar: 'Bar/Club',
  other: 'Other',
};

interface EncounterCardProps {
  encounter: Encounter;
  onClick?: () => void;
}

export default function EncounterCard({ encounter, onClick }: EncounterCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Get display name - either target user's username or anonymous name
  const displayName = encounter.target_user?.username || encounter.anonymous_name || 'Anonymous';

  // Get avatar or placeholder
  const avatarUrl = encounter.target_user?.avatar_url;

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-hole-surface rounded-lg hover:bg-hole-border transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-hole-border rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg text-hole-muted">
              {encounter.is_anonymous ? '?' : displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{displayName}</span>
              {encounter.is_anonymous && (
                <span className="text-xs px-2 py-0.5 bg-hole-border rounded-full text-hole-muted">
                  Manual
                </span>
              )}
            </div>
            <span className="text-xs text-hole-muted flex-shrink-0">
              {formatDate(encounter.met_at)}
            </span>
          </div>

          {/* Activity, Location, Protection row */}
          {(encounter.activities?.length || encounter.location_type || encounter.protection_used) && (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              {/* Activities - show first one or two */}
              {encounter.activities && encounter.activities.length > 0 && (
                <span className="text-hole-muted">
                  {encounter.activities.slice(0, 2).map(a => ACTIVITY_LABELS[a] || a).join(', ')}
                  {encounter.activities.length > 2 && ` +${encounter.activities.length - 2}`}
                </span>
              )}

              {/* Location */}
              {encounter.location_type && (
                <>
                  {encounter.activities?.length ? <span className="text-hole-muted">•</span> : null}
                  <span className="text-hole-muted">
                    {LOCATION_LABELS[encounter.location_type] || encounter.location_type}
                  </span>
                </>
              )}

              {/* Protection status */}
              {encounter.protection_used && (
                <>
                  {(encounter.activities?.length || encounter.location_type) ? <span className="text-hole-muted">•</span> : null}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    encounter.protection_used === 'yes'
                      ? 'bg-green-500/20 text-green-400'
                      : encounter.protection_used === 'partial'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {encounter.protection_used === 'yes' ? 'Protected' :
                     encounter.protection_used === 'partial' ? 'Partial' : 'Unprotected'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Rating */}
          {encounter.rating && (
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= encounter.rating! ? 'text-yellow-400' : 'text-hole-muted'
                  }`}
                  fill={star <= encounter.rating! ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
            </div>
          )}

          {/* Experience Tags */}
          {encounter.experience_tags && encounter.experience_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {encounter.experience_tags.map((tagId) => {
                const tag = EXPERIENCE_TAG_OPTIONS.find((t) => t.id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className={`px-2 py-0.5 rounded-full text-xs ${tag.color} text-white`}
                  >
                    {tag.label}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Notes preview */}
          {encounter.notes && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{encounter.notes}</p>
          )}
        </div>
      </div>
    </button>
  );
}
