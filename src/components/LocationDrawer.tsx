// Location drawer - shows spot info when tapped on map

'use client';

import { Location } from '@/types';
import { XIcon, CheckIcon } from './icons';

interface LocationDrawerProps {
  location: Location;
  onClose: () => void;
}

export default function LocationDrawer({ location, onClose }: LocationDrawerProps) {
  const typeLabels: Record<Location['type'], string> = {
    public: 'Public',
    private: 'Private',
    cruising: 'Cruising Spot',
    venue: 'Venue',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 z-10"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-hole-surface border-t border-hole-border rounded-t-2xl z-20 animate-slide-up">
        <div className="p-4">
          {/* Handle */}
          <div className="w-10 h-1 bg-hole-border rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {location.name}
                {location.is_verified && (
                  <CheckIcon className="w-4 h-4 text-blue-500" />
                )}
              </h3>
              <p className="text-sm text-hole-muted">{typeLabels[location.type]}</p>
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

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-hole-accent font-medium">{location.user_count}</span>
              <span className="text-hole-muted">active now</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button className="flex-1 py-3 bg-hole-accent text-white rounded-lg font-medium transition-colors hover:bg-hole-accent-hover">
              View Users
            </button>
            <button className="px-4 py-3 bg-hole-border text-white rounded-lg font-medium transition-colors hover:bg-hole-muted">
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
