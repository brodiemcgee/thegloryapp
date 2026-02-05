// Modal to display and edit encounter details

'use client';

import { useState } from 'react';
import { Encounter } from '@/hooks/useEncounters';
import { XIcon, EditIcon, TrashIcon } from './icons';
import { ACTIVITY_OPTIONS } from './ManualEncounterModal';
import LocationPicker from './LocationPicker';
import { LocationData } from '@/hooks/useSavedLocations';
import { toast } from 'react-hot-toast';

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
  onUpdate?: (id: string, updates: Partial<Encounter>) => Promise<Encounter>;
  onDelete?: (id: string) => Promise<void>;
}

export default function EncounterDetailModal({
  encounter,
  onClose,
  onUpdate,
  onDelete,
}: EncounterDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [metAt, setMetAt] = useState(encounter.met_at.split('T')[0]);
  const [rating, setRating] = useState<number | null>(encounter.rating);
  const [notes, setNotes] = useState(encounter.notes || '');
  const [activities, setActivities] = useState<string[]>(encounter.activities || []);
  const [location, setLocation] = useState<LocationData | null>(
    encounter.location_type
      ? {
          name: encounter.location_type,
          lat: encounter.location_lat || 0,
          lng: encounter.location_lng || 0,
          address: encounter.location_address || undefined,
        }
      : null
  );
  const [protectionUsed, setProtectionUsed] = useState<'yes' | 'no' | 'na' | ''>(
    encounter.protection_used || ''
  );
  const [anonymousName, setAnonymousName] = useState(encounter.anonymous_name || '');

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

  const toggleActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((a) => a !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    try {
      setSaving(true);
      await onUpdate(encounter.id, {
        met_at: metAt,
        rating: rating || null,
        notes: notes.trim() || null,
        activities: activities.length > 0 ? activities : null,
        location_type: location?.name || null,
        location_lat: location?.lat && location.lat !== 0 ? location.lat : null,
        location_lng: location?.lng && location.lng !== 0 ? location.lng : null,
        location_address: location?.address || null,
        protection_used: protectionUsed || null,
        anonymous_name: encounter.is_anonymous ? anonymousName.trim() || null : encounter.anonymous_name,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update encounter:', err);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setDeleting(true);
      await onDelete(encounter.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete encounter:', err);
      toast.error('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    // Reset form to original values
    setMetAt(encounter.met_at.split('T')[0]);
    setRating(encounter.rating);
    setNotes(encounter.notes || '');
    setActivities(encounter.activities || []);
    setLocation(
      encounter.location_type
        ? {
            name: encounter.location_type,
            lat: encounter.location_lat || 0,
            lng: encounter.location_lng || 0,
            address: encounter.location_address || undefined,
          }
        : null
    );
    setProtectionUsed(encounter.protection_used || '');
    setAnonymousName(encounter.anonymous_name || '');
    setIsEditing(false);
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
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Encounter' : 'Encounter Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && onUpdate && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
                title="Edit"
              >
                <EditIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-hole-surface rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
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
            <div className="flex-1">
              {isEditing && encounter.is_anonymous ? (
                <input
                  type="text"
                  value={anonymousName}
                  onChange={(e) => setAnonymousName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full text-xl font-semibold bg-hole-surface border border-hole-border rounded-lg px-3 py-2 outline-none focus:border-hole-accent"
                />
              ) : (
                <h3 className="text-xl font-semibold">{displayName}</h3>
              )}
              {encounter.is_anonymous && !isEditing && (
                <span className="text-xs px-2 py-0.5 bg-hole-surface rounded-full text-hole-muted">
                  Manual Entry
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">When did you meet?</label>
              <input
                type="date"
                value={metAt}
                onChange={(e) => setMetAt(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent"
              />
            </div>
          ) : (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-1">When</p>
              <p className="font-medium">{formatDate(encounter.met_at)}</p>
              <p className="text-sm text-hole-muted">{formatTime(encounter.met_at)}</p>
            </div>
          )}

          {/* Activities */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">What happened?</label>
              {/* Anal */}
              <div className="mb-2">
                <p className="text-xs text-hole-muted mb-1">Anal</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.filter((a) => a.category === 'anal').map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        activities.includes(activity.id)
                          ? 'bg-hole-accent text-white'
                          : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                      }`}
                    >
                      {activity.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Oral */}
              <div className="mb-2">
                <p className="text-xs text-hole-muted mb-1">Oral</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.filter((a) => a.category === 'oral').map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        activities.includes(activity.id)
                          ? 'bg-hole-accent text-white'
                          : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                      }`}
                    >
                      {activity.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Other */}
              <div>
                <p className="text-xs text-hole-muted mb-1">Other</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.filter((a) => a.category === 'other').map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        activities.includes(activity.id)
                          ? 'bg-hole-accent text-white'
                          : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                      }`}
                    >
                      {activity.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : encounter.activities && encounter.activities.length > 0 ? (
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
          ) : null}

          {/* Location */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">Where?</label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          ) : (encounter.location_type || encounter.location_address) ? (
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
          ) : null}

          {/* Protection */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">Protection?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProtectionUsed(protectionUsed === 'yes' ? '' : 'yes')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    protectionUsed === 'yes'
                      ? 'bg-green-500 text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setProtectionUsed(protectionUsed === 'no' ? '' : 'no')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    protectionUsed === 'no'
                      ? 'bg-red-500 text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setProtectionUsed(protectionUsed === 'na' ? '' : 'na')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    protectionUsed === 'na'
                      ? 'bg-gray-500 text-white'
                      : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                  }`}
                >
                  N/A
                </button>
              </div>
            </div>
          ) : encounter.protection_used ? (
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
          ) : null}

          {/* Rating */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">How was it?</label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? null : star)}
                    className="p-1 transition-colors"
                  >
                    <svg
                      className={`w-8 h-8 ${
                        rating && star <= rating ? 'text-yellow-400' : 'text-hole-muted'
                      }`}
                      fill={rating && star <= rating ? 'currentColor' : 'none'}
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
                  </button>
                ))}
              </div>
            </div>
          ) : encounter.rating ? (
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
          ) : null}

          {/* Notes */}
          {isEditing ? (
            <div>
              <label className="text-sm text-hole-muted mb-2 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="w-full bg-hole-surface border border-hole-border rounded-lg p-3 outline-none focus:border-hole-accent transition-colors resize-none"
                rows={3}
              />
            </div>
          ) : encounter.notes ? (
            <div className="bg-hole-surface rounded-lg p-4">
              <p className="text-sm text-hole-muted mb-2">Notes</p>
              <p className="text-white whitespace-pre-wrap">{encounter.notes}</p>
            </div>
          ) : null}

          {/* Experience tags (view only for now) */}
          {!isEditing && encounter.experience_tags && encounter.experience_tags.length > 0 && (
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

          {/* Delete button */}
          {onDelete && (
            <div className="pt-4 border-t border-hole-border">
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-center text-hole-muted">
                    Are you sure you want to delete this encounter?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-hole-surface border border-hole-border rounded-lg text-sm font-medium hover:bg-hole-border transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Encounter
                </button>
              )}
            </div>
          )}

          {/* Logged date (view mode only) */}
          {!isEditing && (
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hole-border shrink-0 bg-hole-bg">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                className="flex-1 py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium hover:bg-hole-accent-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-hole-surface border border-hole-border rounded-lg font-medium hover:bg-hole-border transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
