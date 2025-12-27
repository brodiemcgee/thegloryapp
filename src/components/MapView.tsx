// Map screen - Mapbox integration with user pins and location markers

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mockUsers, mockLocations } from '@/data/mockData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePresence } from '@/hooks/usePresence';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { FilterIcon, CrosshairIcon, LayersIcon, NavigationIcon, PlusIcon, MenuIcon } from './icons';
import LocationDrawer from './LocationDrawer';
import MapHeatmap from './MapHeatmap';
import AddLocationModal from './AddLocationModal';
import { Location, User, Intent } from '@/types';
import { calculateDistance, isWithinRadius, offsetLocation, findNearestLocation } from '@/lib/geo';
import { useSettings } from '@/hooks/useSettings';
import LocationUsersDrawer from './LocationUsersDrawer';

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
  const [selectedLocationForUsers, setSelectedLocationForUsers] = useState<Location | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMapMenu, setShowMapMenu] = useState(false);
  const [intentFilter, setIntentFilter] = useState<Intent | 'all'>('all');
  const [isLocating, setIsLocating] = useState(false);
  const { position, loading: geoLoading, refresh: refreshLocation } = useGeolocation();
  const { onlineUsers, isConnected, updatePresence } = usePresence('map-presence');
  const { locationAccuracy, setLocationAccuracy } = useSettings();

  // Fetch real users from database
  const { users: dbUsers, currentUserProfile } = useNearbyUsers(position, {
    radiusKm: DEFAULT_RADIUS_KM,
    intentFilter,
  });

  // Default center (Sydney) - will use user position when available
  const defaultCenter: [number, number] = [151.2093, -33.8688];

  // Calculate the fuzzed position for privacy (consistent during session)
  const fuzzedPosition = useMemo(() => {
    if (!position) return null;
    return offsetLocation(position, locationAccuracy);
  }, [position, locationAccuracy]);

  // Check if user is within 25m of a verified location (snapping)
  const snappedLocation = useMemo(() => {
    if (!position) return null;
    return findNearestLocation(position, mockLocations, 25);
  }, [position]);

  // Final display position: snapped location takes priority over fuzzed position
  const displayPosition = useMemo(() => {
    if (snappedLocation) {
      return { lat: snappedLocation.lat, lng: snappedLocation.lng };
    }
    return fuzzedPosition;
  }, [snappedLocation, fuzzedPosition]);

  // Update presence with current position (snapped or fuzzed)
  useEffect(() => {
    if (displayPosition) {
      updatePresence({
        location: {
          lat: displayPosition.lat,
          lng: displayPosition.lng,
        },
        snapped_to_location_id: snappedLocation?.id,
      });
    }
  }, [displayPosition, snappedLocation, updatePresence]);

  // Combine real DB users with mock users for demo
  // Memoized to prevent marker flickering from unnecessary re-renders
  const filteredUsers = useMemo(() => {
    const dbUserIds = new Set(dbUsers.map(u => u.id));
    const filteredMockUsers = mockUsers.filter(u => !dbUserIds.has(u.id));
    const sourceUsers = [...dbUsers, ...filteredMockUsers];

    return sourceUsers.filter((user) => {
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
  }, [position, intentFilter, dbUsers]);

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

  // Calculate users at each location (from nearby users + presence data)
  const usersAtLocations = useMemo(() => {
    const locationUserMap: Record<string, {
      presenceUsers: typeof onlineUsers;
      nearbyUsers: User[];
    }> = {};

    // Initialize empty arrays for each location
    mockLocations.forEach(loc => {
      locationUserMap[loc.id] = { presenceUsers: [], nearbyUsers: [] };
    });

    // Find nearby users (within 50m of each location) from filteredUsers
    filteredUsers.forEach(user => {
      if (!user.location) return;

      mockLocations.forEach(loc => {
        const distanceKm = calculateDistance(user.location!, { lat: loc.lat, lng: loc.lng });
        if (distanceKm * 1000 <= 50) { // Within 50 meters
          locationUserMap[loc.id].nearbyUsers.push(user);
        }
      });
    });

    // Add users from presence who are snapped to locations
    onlineUsers.forEach(user => {
      const snappedId = (user as typeof user & { snapped_to_location_id?: string }).snapped_to_location_id;
      if (snappedId && locationUserMap[snappedId]) {
        locationUserMap[snappedId].presenceUsers.push(user);
      }
    });

    return locationUserMap;
  }, [onlineUsers, filteredUsers]);

  // Update location markers with user count badges
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing location markers
    locationMarkersRef.current.forEach((marker) => marker.remove());
    locationMarkersRef.current = [];

    mockLocations.forEach((location) => {
      if (!map.current) return;

      const usersData = usersAtLocations[location.id];
      const totalCount = (usersData?.nearbyUsers.length || 0) + (usersData?.presenceUsers.length || 0);

      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.cssText = `
        width: 40px;
        height: 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        z-index: 100;
      `;

      const inner = document.createElement('div');
      inner.style.cssText = `
        width: 28px;
        height: 28px;
        background: #3b82f6;
        border: 2px solid #ffffff;
        border-radius: 6px;
        transition: box-shadow 0.15s ease-out, border-color 0.15s ease-out;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Add location icon inside
      inner.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `;

      el.appendChild(inner);

      // Add user count badge if there are users
      if (totalCount > 0) {
        const badge = document.createElement('div');
        badge.style.cssText = `
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 8px;
          margin-top: 2px;
          min-width: 16px;
          text-align: center;
          border: 1px solid #0a0a0a;
        `;
        badge.textContent = totalCount.toString();
        el.appendChild(badge);
      }

      el.addEventListener('mouseenter', () => {
        inner.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
        inner.style.borderColor = '#60a5fa';
      });

      el.addEventListener('mouseleave', () => {
        inner.style.boxShadow = 'none';
        inner.style.borderColor = '#ffffff';
      });

      el.addEventListener('click', () => {
        // Show users drawer if there are users, otherwise regular location drawer
        if (totalCount > 0) {
          setSelectedLocationForUsers(location);
        } else {
          setSelectedLocation(location);
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      locationMarkersRef.current.push(marker);
    });
  }, [mapLoaded, usersAtLocations]);

  // Add/update user location marker (current user's profile photo at display position)
  useEffect(() => {
    if (!map.current || !displayPosition || !mapLoaded) return;

    // Remove existing marker
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
    }

    const userIntent = currentUserProfile?.intent || 'chatting';
    const ringColor = getIntentColor(userIntent);
    const hasAvatar = currentUserProfile?.avatar_url && currentUserProfile.avatar_url.length > 0;
    const initial = currentUserProfile?.username?.charAt(0).toUpperCase() || 'Y';

    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.cssText = `
      width: 52px;
      height: 52px;
      position: relative;
      cursor: pointer;
    `;

    // Create the ring/border element with pulsing animation for current user
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: 0 0 0 3px ${ringColor}50, 0 0 16px ${ringColor}70;
      animation: pulse 2s infinite;
      pointer-events: none;
    `;

    // Create the inner circle with photo or initial
    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: ${hasAvatar ? `url(${currentUserProfile?.avatar_url}) center/cover` : '#1f2937'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
      color: white;
      overflow: hidden;
      pointer-events: none;
    `;

    if (!hasAvatar) {
      inner.textContent = initial;
    }

    el.appendChild(ring);
    el.appendChild(inner);

    // Add "You" label below - show location name if snapped, otherwise fuzz distance
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: ${ringColor};
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    if (snappedLocation) {
      label.textContent = `@ ${snappedLocation.name}`;
    } else if (locationAccuracy > 0) {
      label.textContent = `You (~${locationAccuracy}m)`;
    } else {
      label.textContent = 'You';
    }
    el.appendChild(label);

    userLocationMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([displayPosition.lng, displayPosition.lat])
      .addTo(map.current);
  }, [displayPosition, mapLoaded, currentUserProfile, locationAccuracy, snappedLocation]);

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
            onClick={() => {
              setShowFilterMenu(!showFilterMenu);
              setShowMapMenu(false);
            }}
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

        {/* Map menu button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMapMenu(!showMapMenu);
              setShowFilterMenu(false);
            }}
            className={`p-3 border border-hole-border rounded-full touch-target shadow-lg transition-all ${
              showMapMenu
                ? 'bg-hole-accent text-white'
                : 'bg-hole-surface hover:bg-hole-border'
            }`}
            aria-label="Map menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Map menu dropdown */}
          {showMapMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-hole-surface border border-hole-border rounded-lg shadow-xl overflow-hidden z-10">
              {/* Add Location option */}
              <button
                onClick={() => {
                  setIsAddLocationModalOpen(true);
                  setShowMapMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm transition-colors text-white hover:bg-hole-border flex items-center gap-3"
              >
                <PlusIcon className="w-4 h-4" />
                Add Location
              </button>

              {/* Divider */}
              <div className="border-t border-hole-border" />

              {/* Location Accuracy section */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">Location Accuracy</span>
                  <span className="text-xs text-hole-muted">{locationAccuracy}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="25"
                  value={locationAccuracy}
                  onChange={(e) => setLocationAccuracy(Number(e.target.value))}
                  className="w-full h-2 bg-hole-border rounded-lg appearance-none cursor-pointer accent-hole-accent"
                />
                <div className="flex justify-between text-xs text-hole-muted mt-1">
                  <span>Exact</span>
                  <span>200m</span>
                </div>
              </div>
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

      {/* Bottom right buttons */}
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

      {/* Location users drawer */}
      {selectedLocationForUsers && (
        <LocationUsersDrawer
          location={selectedLocationForUsers}
          usersAtLocation={usersAtLocations[selectedLocationForUsers.id]}
          currentUserId={currentUserProfile?.id}
          isCurrentUserSnapped={snappedLocation?.id === selectedLocationForUsers.id}
          onClose={() => setSelectedLocationForUsers(null)}
        />
      )}
    </div>
  );
}
