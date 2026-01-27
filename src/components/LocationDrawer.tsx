// Location drawer - shows spot info when tapped on map

'use client';

import { Location } from '@/types';
import { XIcon, CheckIcon } from './icons';

interface LocationDrawerProps {
  location: Location;
  onClose: () => void;
  onViewUsers?: () => void;
}

export default function LocationDrawer({ location, onClose, onViewUsers }: LocationDrawerProps) {
  const typeLabels: Record<Location['type'], string> = {
    public: 'Public',
    private: 'Private',
    cruising: 'Cruising Spot',
    venue: 'Venue',
  };

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
      <div className="absolute bottom-0 left-0 right-0 bg-hole-surface border-t border-hole-border rounded-t-2xl z-20 animate-slide-up max-h-[70vh] flex flex-col">
        <div className="p-4 overflow-y-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-hole-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
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

          {/* Description */}
          {location.description && (
            <p className="text-sm text-gray-300 mb-4">{location.description}</p>
          )}

          {/* Quick stats */}
          <div className="flex items-center flex-wrap gap-4 text-sm mb-4">
            <div className="flex items-center gap-1">
              <span className="text-hole-accent font-medium">{location.user_count}</span>
              <span className="text-hole-muted">active now</span>
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

          {/* Key info preview */}
          {(location.directions || location.best_times) && (
            <div className="space-y-2 mb-4 pb-4 border-b border-hole-border">
              {location.directions && (
                <div>
                  <span className="text-xs text-hole-muted uppercase">Location: </span>
                  <span className="text-sm text-gray-300">{location.directions.slice(0, 100)}{location.directions.length > 100 ? '...' : ''}</span>
                </div>
              )}
              {location.best_times && (
                <div>
                  <span className="text-xs text-hole-muted uppercase">Best times: </span>
                  <span className="text-sm text-gray-300">{location.best_times.slice(0, 80)}{location.best_times.length > 80 ? '...' : ''}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover"
              onClick={onViewUsers}
            >
              View Details
            </button>
            <button
              className="px-4 py-3 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted"
              onClick={() => {
                if (location.lat && location.lng) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank');
                }
              }}
            >
              Directions
            </button>
          </div>
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
