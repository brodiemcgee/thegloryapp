// Location users drawer - shows location details and users at a specific location

'use client';

import { useState } from 'react';
import { Location, User, Intent } from '@/types';
import { PresenceUser } from '@/hooks/usePresence';
import { XIcon, CheckIcon } from './icons';

interface LocationUsersDrawerProps {
  location: Location;
  usersAtLocation: {
    presenceUsers: PresenceUser[];
    nearbyUsers: User[];
  };
  currentUserId?: string;
  isCurrentUserSnapped: boolean;
  onClose: () => void;
  onUserClick?: (user: User) => void;
}

// Get ring color based on user intent
const getIntentColor = (intent: Intent): string => {
  switch (intent) {
    case 'looking_now': return '#ef4444'; // Red
    case 'looking_later': return '#3b82f6'; // Blue
    case 'chatting': return '#f59e0b'; // Amber
    case 'friends': return '#22c55e'; // Green
    default: return '#3b82f6';
  }
};

const typeLabels: Record<Location['type'], string> = {
  public: 'Public',
  private: 'Private',
  cruising: 'Cruising Spot',
  venue: 'Venue',
};

// Amenity icon mapping
const amenityLabels: Record<string, string> = {
  spa: 'Spa',
  sauna: 'Sauna',
  steam_room: 'Steam Room',
  private_rooms: 'Private Rooms',
  rooftop: 'Rooftop',
  massage: 'Massage',
  cafe: 'Cafe',
  wifi: 'WiFi',
  lockers: 'Lockers',
  dark_room: 'Dark Room',
  maze: 'Maze',
  cinema: 'Cinema',
  bar: 'Bar',
  dance_floor: 'Dance Floor',
  cruise_maze: 'Cruise Maze',
  leather_room: 'Leather Room',
  pool: 'Pool',
  sling: 'Sling',
  glory_holes: 'Glory Holes',
  video_lounge: 'Video Lounge',
  video_rooms: 'Video Rooms',
  shop: 'Shop',
  sun_terrace: 'Sun Terrace',
  lounge: 'Lounge',
};

type TabType = 'users' | 'info' | 'tips';

export default function LocationUsersDrawer({
  location,
  usersAtLocation,
  currentUserId,
  isCurrentUserSnapped,
  onClose,
  onUserClick,
}: LocationUsersDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const { presenceUsers, nearbyUsers } = usersAtLocation;
  const filteredNearbyUsers = nearbyUsers.filter(u => u.id !== currentUserId);
  const totalUsers = presenceUsers.length + filteredNearbyUsers.length + (isCurrentUserSnapped ? 1 : 0);

  const hasDetails = location.directions || location.best_times || location.entry_fee || location.amenities?.length;
  const hasTips = location.safety_tips || location.parking_info;

  // Render busy rating dots
  const renderBusyRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i <= rating ? 'bg-hole-accent' : 'bg-hole-border'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 z-10"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-hole-surface border-t border-hole-border rounded-t-2xl z-20 animate-slide-up max-h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-4 flex-shrink-0">
          {/* Handle */}
          <div className="w-10 h-1 bg-hole-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {location.name}
                {location.is_verified && (
                  <CheckIcon className="w-4 h-4 text-blue-500" />
                )}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-hole-muted">{typeLabels[location.type]}</span>
                {location.vibe && (
                  <span className="text-xs px-2 py-0.5 bg-hole-border rounded-full text-hole-muted">{location.vibe}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hole-border rounded-full transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <span className="text-hole-accent font-medium">{totalUsers}</span>
              <span className="text-hole-muted">here now</span>
            </div>
            {location.busy_rating && (
              <div className="flex items-center gap-2">
                <span className="text-hole-muted">Busy:</span>
                {renderBusyRating(location.busy_rating)}
              </div>
            )}
            {location.entry_fee && (
              <span className="text-hole-muted">{location.entry_fee}</span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-hole-border/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'info' ? 'bg-hole-surface text-white' : 'text-hole-muted hover:text-white'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'users' ? 'bg-hole-surface text-white' : 'text-hole-muted hover:text-white'
              }`}
            >
              Users ({totalUsers})
            </button>
            {hasTips && (
              <button
                onClick={() => setActiveTab('tips')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'tips' ? 'bg-hole-surface text-white' : 'text-hole-muted hover:text-white'
                }`}
              >
                Tips
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4 pb-4">
              {/* Description */}
              {location.description && (
                <p className="text-sm text-gray-300">{location.description}</p>
              )}

              {/* Directions */}
              {location.directions && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-1">How to find it</h4>
                  <p className="text-sm text-gray-300">{location.directions}</p>
                </div>
              )}

              {/* Best times */}
              {location.best_times && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-1">Best times</h4>
                  <p className="text-sm text-gray-300">{location.best_times}</p>
                </div>
              )}

              {/* Hours */}
              {location.hours && Object.keys(location.hours).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-2">Hours</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      location.hours?.[day] && (
                        <div key={day} className="flex justify-between">
                          <span className="text-hole-muted capitalize">{day.slice(0, 3)}</span>
                          <span className="text-gray-300">{location.hours[day]}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {location.amenities && location.amenities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {location.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="text-xs px-2 py-1 bg-hole-border rounded-full text-gray-300"
                      >
                        {amenityLabels[amenity] || amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Crowd info */}
              {(location.crowd_type || location.age_range || location.dress_code) && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-2">Crowd</h4>
                  <div className="space-y-1 text-sm">
                    {location.crowd_type && (
                      <div className="flex justify-between">
                        <span className="text-hole-muted">Type</span>
                        <span className="text-gray-300">{location.crowd_type}</span>
                      </div>
                    )}
                    {location.age_range && (
                      <div className="flex justify-between">
                        <span className="text-hole-muted">Age range</span>
                        <span className="text-gray-300">{location.age_range}</span>
                      </div>
                    )}
                    {location.dress_code && (
                      <div className="flex justify-between">
                        <span className="text-hole-muted">Dress</span>
                        <span className="text-gray-300">{location.dress_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact */}
              {(location.website || location.phone) && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-2">Contact</h4>
                  <div className="space-y-2">
                    {location.website && (
                      <a
                        href={location.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-hole-accent hover:underline"
                      >
                        {location.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    {location.phone && (
                      <a
                        href={`tel:${location.phone}`}
                        className="block text-sm text-hole-accent hover:underline"
                      >
                        {location.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="pb-4">
              {totalUsers > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {/* Current user if snapped */}
                  {isCurrentUserSnapped && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 bg-hole-accent/30 border-2 border-hole-accent rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-hole-accent">You</span>
                      </div>
                    </div>
                  )}

                  {/* Nearby users (from mock/DB data) */}
                  {filteredNearbyUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onUserClick?.(user)}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all group-hover:scale-110"
                          style={{ borderColor: getIntentColor(user.intent) }}
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-hole-border flex items-center justify-center">
                              <span className="text-lg font-medium">
                                {user.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Online indicator */}
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-hole-surface" />
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Online users from presence (real-time) */}
                  {presenceUsers.map((user) => (
                    <button
                      key={user.user_id}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-green-500 transition-all group-hover:scale-110"
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-hole-border flex items-center justify-center">
                              <span className="text-lg font-medium">
                                {user.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-hole-surface" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-hole-muted py-8">
                  No users at this location right now
                </div>
              )}
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-4 pb-4">
              {/* Safety tips */}
              {location.safety_tips && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-1">Safety tips</h4>
                  <p className="text-sm text-gray-300">{location.safety_tips}</p>
                </div>
              )}

              {/* Parking */}
              {location.parking_info && (
                <div>
                  <h4 className="text-xs font-semibold text-hole-muted uppercase tracking-wide mb-1">Parking</h4>
                  <p className="text-sm text-gray-300">{location.parking_info}</p>
                </div>
              )}

              {/* Community tips placeholder */}
              <div className="pt-4 border-t border-hole-border">
                <p className="text-sm text-hole-muted text-center">
                  Community tips coming soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-hole-border flex-shrink-0">
          <button
            className="w-full py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover"
            onClick={() => {
              if (location.lat && location.lng) {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank');
              }
            }}
          >
            Get Directions
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 200ms ease-out;
        }
      `}</style>
    </>
  );
}
