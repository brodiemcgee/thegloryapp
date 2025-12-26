// Map screen - Mapbox integration with user pins and location markers

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockUsers, mockLocations } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePresence } from '@/hooks/usePresence';
import { FilterIcon, CrosshairIcon, LayersIcon, NavigationIcon, PlusIcon } from './icons';
import LocationDrawer from './LocationDrawer';
import MapHeatmap from './MapHeatmap';
import AddLocationModal from './AddLocationModal';
import { Location, User, Intent } from '@/types';
import { calculateDistance, isWithinRadius } from '@/lib/geo';

// Set Mapbox token - will use env var in production
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Default radius for filtering users (in km)
const DEFAULT_RADIUS_KM = 10;

const INTENT_OPTIONS: { value: Intent | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'looking_now', label: 'Looking Now' },
  { value: 'looking_later', label: 'Looking Later' },
  { value: 'chatting', label: 'Chatting' },
  { value: 'friends', label: 'Friends' },
];

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const locationMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'users' | 'heatmap'>('users');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [intentFilter, setIntentFilter] = useState<Intent | 'all'>('all');
  const [isLocating, setIsLocating] = useState(false);
  const { position, loading: geoLoading, refresh: refreshLocation } = useGeolocation();
  const { onlineUsers, isConnected, updatePresence } = usePresence('map-presence');

  // Default center (Sydney) - will use user position when available
  const defaultCenter: [number, number] = [151.2093, -33.8688];

  // Update presence with current location when position changes
  useEffect(() => {
    if (position) {
      updatePresence({
        location: {
          lat: position.lat,
          lng: position.lng,
        },
      });
    }
  }, [position, updatePresence]);

  // Combine real online users from presence with mock users
  // In production, this would only use onlineUsers from presence
  // Memoized to prevent marker flickering from unnecessary re-renders
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      // Filter by location if position available
      if (position && user.location) {
        if (!isWithinRadius(user.location, position, DEFAULT_RADIUS_KM)) {
          return false;
        }
      }
      // Filter by intent
      if (intentFilter !== 'all' && user.intent !== intentFilter) {
        return false;
      }
      return true;
    });
  }, [position, intentFilter]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not set');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: position ? [position.lng, position.lat] : defaultCenter,
      zoom: 14,
      attributionControl: false,
    });

    mapInstance.on('load', () => {
      setMapLoaded(true);
    });

    map.current = mapInstance;

    return () => {
      // Clean up markers
      userMarkersRef.current.forEach((marker) => marker.remove());
      locationMarkersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Get ring color based on user intent
  const getIntentColor = (intent: Intent): string => {
    switch (intent) {
      case 'looking_now': return '#ef4444'; // Red - urgent/active
      case 'looking_later': return '#3b82f6'; // Blue - calm
      case 'chatting': return '#f59e0b'; // Amber - conversation
      case 'friends': return '#22c55e'; // Green - non-sexual
      default: return '#3b82f6';
    }
  };

  // Update user markers based on view mode and filtered users
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing user markers
    userMarkersRef.current.forEach((marker) => marker.remove());
    userMarkersRef.current = [];

    if (viewMode === 'users') {
      filteredUsers.forEach((user) => {
        if (!user.location || !map.current) return;

        const ringColor = getIntentColor(user.intent);
        const initial = user.username.charAt(0).toUpperCase();
        const hasAvatar = user.avatar_url && user.avatar_url.length > 0;

        const el = document.createElement('div');
        el.className = 'user-marker';
        el.style.cssText = `
          width: 48px;
          height: 48px;
          position: relative;
          cursor: pointer;
        `;

        // Create the ring/border element
        const ring = document.createElement('div');
        ring.style.cssText = `
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid ${ringColor};
          box-shadow: ${user.is_online ? `0 0 0 2px ${ringColor}40, 0 0 12px ${ringColor}60` : 'none'};
          transition: box-shadow 0.15s ease-out;
          pointer-events: none;
        `;

        // Create the inner circle with photo or initial
        const inner = document.createElement('div');
        inner.style.cssText = `
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: ${hasAvatar ? `url(${user.avatar_url}) center/cover` : '#1f2937'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: white;
          overflow: hidden;
          pointer-events: none;
        `;

        if (!hasAvatar) {
          inner.textContent = initial;
        }

        el.appendChild(ring);
        el.appendChild(inner);

        // Add verified badge if verified
        if (user.is_verified) {
          const badge = document.createElement('div');
          badge.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 14px;
            height: 14px;
            background: #22c55e;
            border: 2px solid #0a0a0a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          `;
          badge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" fill="none"/></svg>`;
          el.appendChild(badge);
        }

        // Add online indicator dot
        if (user.is_online) {
          const onlineDot = document.createElement('div');
          onlineDot.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            width: 10px;
            height: 10px;
            background: #22c55e;
            border: 2px solid #0a0a0a;
            border-radius: 50%;
            pointer-events: none;
          `;
          el.appendChild(onlineDot);
        }

        el.addEventListener('mouseenter', () => {
          ring.style.boxShadow = `0 0 0 4px ${ringColor}50, 0 0 16px ${ringColor}70`;
        });

        el.addEventListener('mouseleave', () => {
          ring.style.boxShadow = user.is_online ? `0 0 0 2px ${ringColor}40, 0 0 12px ${ringColor}60` : 'none';
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([user.location.lng, user.location.lat])
          .addTo(map.current!);

        userMarkersRef.current.push(marker);
      });
    }
  }, [viewMode, filteredUsers, mapLoaded]);

  // Update location markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing location markers
    locationMarkersRef.current.forEach((marker) => marker.remove());
    locationMarkersRef.current = [];

    mockLocations.forEach((location) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.cssText = `
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;

      const inner = document.createElement('div');
      inner.style.cssText = `
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 2px solid #ffffff;
        border-radius: 4px;
        transition: box-shadow 0.15s ease-out, border-color 0.15s ease-out;
      `;

      el.appendChild(inner);

      el.addEventListener('mouseenter', () => {
        inner.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
        inner.style.borderColor = '#60a5fa';
      });

      el.addEventListener('mouseleave', () => {
        inner.style.boxShadow = 'none';
        inner.style.borderColor = '#ffffff';
      });

      el.addEventListener('click', () => {
        setSelectedLocation(location);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      locationMarkersRef.current.push(marker);
    });
  }, [mapLoaded]);

  // Add/update user location marker
  useEffect(() => {
    if (!map.current || !position || !mapLoaded) return;

    // Remove existing marker
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
    }

    // Create user location marker (blue pulsing dot)
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
        animation: pulse 2s infinite;
      "></div>
    `;

    userLocationMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([position.lng, position.lat])
      .addTo(map.current);
  }, [position, mapLoaded]);

  const handleFindMyLocation = async () => {
    setIsLocating(true);
    refreshLocation();

    // Wait a bit for position to update, then fly to it
    setTimeout(() => {
      if (map.current && position) {
        map.current.flyTo({
          center: [position.lng, position.lat],
          zoom: 15,
          duration: 1000,
        });
      }
      setIsLocating(false);
    }, 1000);
  };

  const recenterMap = () => {
    if (!map.current) return;

    if (position) {
      map.current.flyTo({
        center: [position.lng, position.lat],
        zoom: 15,
        duration: 1000,
      });
    } else {
      // Request location if not available
      handleFindMyLocation();
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'users' ? 'heatmap' : 'users'));
  };

  const handleAddLocation = (locationData: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'cruising' | 'venue';
    lat: number;
    lng: number;
  }) => {
    console.log('New location submitted:', locationData);
    // In production, this would send to backend/Supabase for moderation
    // For now, just log it
  };

  // Prepare heatmap points from filtered users (memoized)
  const heatmapPoints = useMemo(() => {
    return filteredUsers
      .filter((user) => user.location)
      .map((user) => ({
        lat: user.location!.lat,
        lng: user.location!.lng,
        weight: user.is_online ? 2 : 1,
      }));
  }, [filteredUsers]);

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Heatmap layer */}
      {viewMode === 'heatmap' && (
        <MapHeatmap
          map={map.current}
          points={heatmapPoints}
          colors={['rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.9)']}
          intensity={1.2}
        />
      )}

      {/* No token fallback */}
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-hole-bg">
          <div className="text-center p-6">
            <p className="text-hole-muted mb-2">Map unavailable</p>
            <p className="text-sm text-hole-muted">Set NEXT_PUBLIC_MAPBOX_TOKEN</p>
          </div>
        </div>
      )}

      {/* Floating controls - right side */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Filter button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`p-3 border border-hole-border rounded-full touch-target shadow-lg transition-all ${
              intentFilter !== 'all'
                ? 'bg-hole-accent text-white'
                : 'bg-hole-surface hover:bg-hole-border'
            }`}
            aria-label="Filter users"
          >
            <FilterIcon className="w-5 h-5" />
          </button>

          {/* Filter dropdown */}
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-hole-surface border border-hole-border rounded-lg shadow-xl overflow-hidden z-10">
              {INTENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setIntentFilter(option.value);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    intentFilter === option.value
                      ? 'bg-hole-accent text-white'
                      : 'text-white hover:bg-hole-border'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Heatmap toggle */}
        <button
          onClick={toggleViewMode}
          className={`p-3 border border-hole-border rounded-full touch-target shadow-lg transition-all ${
            viewMode === 'heatmap'
              ? 'bg-hole-accent text-white'
              : 'bg-hole-surface hover:bg-hole-border'
          }`}
          aria-label="Toggle heatmap"
        >
          <LayersIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom right buttons - stacked vertically */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-10">
        {/* Location button */}
        <button
          onClick={recenterMap}
          disabled={isLocating || geoLoading}
          className={`p-3 border border-hole-border rounded-full touch-target shadow-lg transition-all ${
            isLocating || geoLoading
              ? 'bg-hole-accent text-white animate-pulse'
              : position
              ? 'bg-hole-surface hover:bg-hole-border'
              : 'bg-hole-surface hover:bg-hole-accent'
          }`}
          aria-label="Find my location"
        >
          <NavigationIcon className="w-5 h-5" />
        </button>

        {/* Add location button */}
        <button
          onClick={() => setIsAddLocationModalOpen(true)}
          className="p-3 bg-hole-accent hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          aria-label="Add location"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* View mode indicator */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="px-3 py-1 bg-hole-surface/80 backdrop-blur border border-hole-border rounded-full text-sm">
          {viewMode === 'users' ? `Users (${filteredUsers.length})` : 'Heatmap'}
        </div>
        {isConnected && (
          <div className="px-3 py-1 bg-hole-surface/80 backdrop-blur border border-hole-border rounded-full text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{onlineUsers.length} online</span>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        onSubmit={handleAddLocation}
      />

      {/* Location drawer */}
      {selectedLocation && (
        <LocationDrawer
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
