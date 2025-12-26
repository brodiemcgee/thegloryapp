// Map screen - Mapbox integration with user pins and location markers

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockUsers, mockLocations } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePresence } from '@/hooks/usePresence';
import { FilterIcon, CrosshairIcon } from './icons';
import LocationDrawer from './LocationDrawer';
import MapHeatmap from './MapHeatmap';
import AddLocationModal from './AddLocationModal';
import AddLocationButton from './AddLocationButton';
import { Location, User } from '@/types';
import { calculateDistance, isWithinRadius } from '@/lib/geo';

// Set Mapbox token - will use env var in production
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Default radius for filtering users (in km)
const DEFAULT_RADIUS_KM = 10;

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [viewMode, setViewMode] = useState<'users' | 'heatmap'>('users');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [userMarkers, setUserMarkers] = useState<mapboxgl.Marker[]>([]);
  const [locationMarkers, setLocationMarkers] = useState<mapboxgl.Marker[]>([]);
  const { position } = useGeolocation();
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
  const filteredUsers = position
    ? mockUsers.filter(
        (user) =>
          user.location &&
          isWithinRadius(user.location, position, DEFAULT_RADIUS_KM)
      )
    : mockUsers;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox token not set');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: position ? [position.lng, position.lat] : defaultCenter,
      zoom: 14,
      attributionControl: false,
    });

    return () => {
      // Clean up markers
      userMarkers.forEach((marker) => marker.remove());
      locationMarkers.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [position]);

  // Update user markers based on view mode and filtered users
  useEffect(() => {
    if (!map.current) return;

    // Remove existing user markers
    userMarkers.forEach((marker) => marker.remove());

    if (viewMode === 'users') {
      // Add user markers for filtered users
      const newMarkers: mapboxgl.Marker[] = [];

      filteredUsers.forEach((user) => {
        if (!user.location || !map.current) return;

        const el = document.createElement('div');
        el.className = 'user-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: ${user.is_online ? '#ef4444' : '#737373'};
          border: 2px solid ${user.is_verified ? '#ffffff' : '#404040'};
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([user.location.lng, user.location.lat])
          .addTo(map.current!);

        newMarkers.push(marker);
      });

      setUserMarkers(newMarkers);
    }
  }, [viewMode, filteredUsers, map.current]);

  // Update location markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing location markers
    locationMarkers.forEach((marker) => marker.remove());

    const newMarkers: mapboxgl.Marker[] = [];

    mockLocations.forEach((location) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border: 2px solid #ffffff;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      el.addEventListener('click', () => {
        setSelectedLocation(location);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      newMarkers.push(marker);
    });

    setLocationMarkers(newMarkers);
  }, [map.current]);

  const recenterMap = () => {
    if (!map.current || !position) return;
    map.current.flyTo({
      center: [position.lng, position.lat],
      zoom: 14,
      duration: 1000,
    });
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

  // Prepare heatmap points from filtered users
  const heatmapPoints = filteredUsers
    .filter((user) => user.location)
    .map((user) => ({
      lat: user.location!.lat,
      lng: user.location!.lng,
      weight: user.is_online ? 2 : 1,
    }));

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

      {/* Floating controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleViewMode}
          className={`p-3 border border-hole-border rounded-full touch-target shadow-lg transition-all ${
            viewMode === 'heatmap'
              ? 'bg-hole-accent text-white'
              : 'bg-hole-surface hover:bg-hole-border'
          }`}
          aria-label="Toggle view mode"
        >
          <FilterIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Recenter button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={recenterMap}
          className="p-3 bg-hole-surface border border-hole-border rounded-full touch-target shadow-lg transition-colors hover:bg-hole-border"
          aria-label="Recenter map"
        >
          <CrosshairIcon className="w-5 h-5" />
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

      {/* Add Location Button (FAB) */}
      <AddLocationButton onClick={() => setIsAddLocationModalOpen(true)} />

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
