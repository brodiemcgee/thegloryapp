// Modal to display full encounter details

'use client';

import { Encounter } from '@/hooks/useEncounters';
import { XIcon } from './icons';

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

interface EncounterDetailModalProps {
  encounter: Encounter;
  onClose: () => void;
}

export default function EncounterDetailModal({ encounter, onClose }: EncounterDetailModalProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
  };

  // Get display name
  const displayName = encounter.target_user?.username || encounter.anonymous_name || 'Anonymous';
  const avatarUrl = encounter.target_user?.avatar_url;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-hole-bg border-t sm:border border-hole-border sm:rounded-lg flex flex-col max-h-[85vh] mb-16 sm:mb-0">
        {/* Fixed header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border shrink-0">
          <h2 className="text-lg font-semibold">Encounter Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Person info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-hole-surface rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-hole-muted">
                  {encounter.is_anonymous ? '?' : displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{displayName}</h3>
              {encounter.is_anonymous && (
                <span className="text-xs px-2 py-0.5 bg-hole-surface rounded-full text-hole-muted">
                  Manual Entry
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="bg-hole-surface rounded-lg p-4">
            <p className="text-sm text-hole-muted mb-1">When</p>
            <p className="font-medium">{formatDate(encounter.met_at)}</p>
            <p className="text-sm text-hole-muted">{formatTime(encounter.met_at)}</p>
          </div>

          {/* Activities */}
          {encounter.activities && encounter.activities.length > 0 && (
            <div>
              <p className="text-sm text-hole-muted mb-2">What happened</p>
              <div className="flex flex-wrap gap-2">
                {encounter.activities.map((activity) => (
                  <span
                    key={activity}
                    className="px-3 py-1.5 bg-hole-accent/20 text-hole-accent rounded-full text-sm"
                  >
                    {ACTIVITY_LABELS[activity] || activity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {(encounter.location_type || encounter.location_address) && (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-1">Location</p>
              {encounter.location_type && (
                <p className="font-medium">
                  {LOCATION_LABELS[encounter.location_type] || encounter.location_type}
                </p>
              )}
              {encounter.location_address && (
                <p className="text-sm text-hole-muted mt-1">{encounter.location_address}</p>
              )}
            </div>
          )}

          {/* Protection */}
          {encounter.protection_used && (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-1">Protection</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                encounter.protection_used === 'yes'
                  ? 'bg-green-500/20 text-green-400'
                  : encounter.protection_used === 'na'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {encounter.protection_used === 'yes' ? 'Yes - Protected' :
                 encounter.protection_used === 'na' ? 'N/A' : 'No - Unprotected'}
              </span>
            </div>
          )}

          {/* Rating */}
          {encounter.rating && (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-2">Rating</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-7 h-7 ${
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
                <span className="ml-2 text-hole-muted">{encounter.rating}/5</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {encounter.notes && (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-2">Notes</p>
              <p className="text-white whitespace-pre-wrap">{encounter.notes}</p>
            </div>
          )}

          {/* Experience tags */}
          {encounter.experience_tags && encounter.experience_tags.length > 0 && (
            <div>
              <p className="text-sm text-hole-muted mb-2">Experience</p>
              <div className="flex flex-wrap gap-2">
                {encounter.experience_tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-hole-surface border border-hole-border rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Logged date */}
          <div className="pt-4 border-t border-hole-border">
            <p className="text-xs text-hole-muted text-center">
              Logged on {new Date(encounter.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Footer with close button */}
        <div className="p-4 border-t border-hole-border shrink-0 bg-hole-bg">
          <button
            onClick={onClose}
            className="w-full py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
