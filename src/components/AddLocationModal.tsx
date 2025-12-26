// Modal for adding new locations/spots

'use client';

import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { XIcon } from './icons';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type LocationType = 'public' | 'private' | 'cruising' | 'venue';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (location: {
    name: string;
    description: string;
    type: LocationType;
    lat: number;
    lng: number;
  }) => void;
}

export default function AddLocationModal({
  isOpen,
  onClose,
  onSubmit,
}: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LocationType>('public');
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const { position } = useGeolocation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Default center (Sydney)
  const defaultCenter: [number, number] = [151.2093, -33.8688];

  useEffect(() => {
    if (!isOpen || !mapContainer.current || map.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const center = position
      ? [position.lng, position.lat]
      : defaultCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center as [number, number],
      zoom: 14,
      attributionControl: false,
    });

    // Add click handler to drop pin
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedPosition({ lat, lng });

      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: #ef4444;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          cursor: pointer;
        `;

        marker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [isOpen, position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedPosition) return;

    onSubmit?.({
      name: name.trim(),
      description: description.trim(),
      type,
      lat: selectedPosition.lat,
      lng: selectedPosition.lng,
    });

    // Reset form
    setName('');
    setDescription('');
    setType('public');
    setSelectedPosition(null);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setType('public');
    setSelectedPosition(null);
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-hole-surface border border-hole-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hole-border">
          <h2 className="text-xl font-semibold">Add New Spot</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-hole-border rounded-lg transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Map */}
            <div className="relative h-64 bg-hole-bg">
              <div ref={mapContainer} className="w-full h-full" />
              {!MAPBOX_TOKEN && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-hole-muted text-sm">Map unavailable</p>
                </div>
              )}
              <div className="absolute top-2 left-2 right-2 bg-hole-surface/90 backdrop-blur border border-hole-border rounded-lg p-2">
                <p className="text-sm text-hole-muted">
                  {selectedPosition
                    ? 'Pin dropped! Adjust by clicking the map.'
                    : 'Click on the map to drop a pin'}
                </p>
              </div>
            </div>

            {/* Form fields */}
            <div className="p-4 space-y-4">
              {/* Address search (placeholder for future implementation) */}
              <div>
                <label className="block text-sm text-hole-muted mb-2">
                  Or search address (optional)
                </label>
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Search for a location..."
                  className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-2 outline-none focus:border-hole-accent transition-colors"
                  disabled
                />
                <p className="text-xs text-hole-muted mt-1">
                  Coming soon - for now, use the map
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm text-hole-muted mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Central Park Restroom"
                  required
                  className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-2 outline-none focus:border-hole-accent transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-hole-muted mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this spot..."
                  rows={3}
                  className="w-full bg-hole-bg border border-hole-border rounded-lg px-4 py-2 outline-none focus:border-hole-accent transition-colors resize-none"
                />
              </div>

              {/* Type selector */}
              <div>
                <label className="block text-sm text-hole-muted mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'public' as LocationType, label: 'Public Restroom' },
                    { value: 'private' as LocationType, label: 'Private Spot' },
                    { value: 'cruising' as LocationType, label: 'Cruising Area' },
                    { value: 'venue' as LocationType, label: 'Venue/Club' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        type === option.value
                          ? 'bg-hole-accent text-white'
                          : 'bg-hole-border text-gray-300 hover:bg-hole-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info message */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  Your submission will be reviewed by moderators before appearing on the map.
                </p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 p-4 border-t border-hole-border">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-hole-border hover:bg-hole-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !selectedPosition}
                className="flex-1 px-4 py-3 bg-hole-accent hover:bg-red-600 disabled:bg-hole-border disabled:text-hole-muted disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Submit for Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
