// Map screen - Mapbox integration with user pins and location markers

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLocations } from '@/hooks/useLocations';
import { usePresence } from '@/hooks/usePresence';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { NavigationIcon, PlusIcon, MenuIcon } from './icons';
import LocationDrawer from './LocationDrawer';
import MapHeatmap from './MapHeatmap';
import AddLocationModal from './AddLocationModal';
import UserProfile from './UserProfile';
import { Location, User, Intent } from '@/types';
import { calculateDistance, offsetLocation, findNearestLocation } from '@/lib/geo';
import { useSettings } from '@/hooks/useSettings';
import LocationUsersDrawer from './LocationUsersDrawer';
import FilterBar, { FilterState, defaultFilters } from './FilterBar';
import { useFavorites } from '@/hooks/useFavorites';

// Set Mapbox token - will use env var in production
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Default radius for filtering users (in km)
const DEFAULT_RADIUS_KM = 10;

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'users' | 'heatmap'>('users');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedLocationForUsers, setSelectedLocationForUsers] = useState<Location | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [showMapMenu, setShowMapMenu] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLocating, setIsLocating] = useState(false);
  const { position, loading: geoLoading, refresh: refreshLocation } = useGeolocation();
  const { onlineUsers, isConnected, updatePresence } = usePresence('map-presence');
  const { locationAccuracy, setLocationAccuracy } = useSettings();
  const { favorites } = useFavorites();
  const { locations: dbLocations, loading: locationsLoading } = useLocations();

  // Fetch real users from database
  const { allUsers: dbUsers, currentUserProfile } = useNearbyUsers(position, {
    radiusKm: DEFAULT_RADIUS_KM,
  });

  // Default center (Melbourne) - will use user position when available
  const defaultCenter: [number, number] = [144.9631, -37.8136];

  // Calculate the fuzzed position for privacy (consistent during session)
  const fuzzedPosition = useMemo(() => {
    if (!position) return null;
    return offsetLocation(position, locationAccuracy);
  }, [position, locationAccuracy]);

  // Check if user is within 25m of a verified location (snapping)
  const snappedLocation = useMemo(() => {
    if (!position) return null;
    return findNearestLocation(position, dbLocations, 25);
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
      userMarkersRef.current.clear();
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

  // Check if user is active within time threshold
  const isActiveWithin = (lastActive: string, minutes: number): boolean => {
    const lastActiveTime = new Date(lastActive).getTime();
    const now = Date.now();
    return (now - lastActiveTime) / (1000 * 60) <= minutes;
  };

  // Get users to display on map (stable reference for markers)
  // Filtered by all filter criteria
  const usersForMarkers = useMemo(() => {
    // Use only real database users with locations
    let result = (dbUsers || []).filter(u => u.location);

    // Filter by map visibility
    result = result.filter(user => user.show_on_map !== false);

    // Filter by online status
    if (filters.online === 'online') {
      result = result.filter((u) => u.last_active && isActiveWithin(u.last_active, 2));
    } else if (filters.online === 'recent') {
      result = result.filter((u) => u.last_active && isActiveWithin(u.last_active, 30));
    }

    // Filter by favorites
    if (filters.favorites) {
      const favoriteIds = new Set(favorites.map(f => f.target_user_id));
      result = result.filter((u) => favoriteIds.has(u.id));
    }

    // Filter by intent
    if (filters.intent !== 'all') {
      result = result.filter((u) => u.intent === filters.intent);
    }

    // Filter by age range
    if (filters.ageRange) {
      const [minAge, maxAge] = filters.ageRange;
      result = result.filter((u) => {
        if (!u.age) return false;
        return u.age >= minAge && u.age <= maxAge;
      });
    }

    // Filter by position
    if (filters.position !== 'all') {
      result = result.filter((u) => u.position === filters.position);
    }

    return result;
  }, [filters, dbUsers, favorites]);

  // Create a marker element for a user (extracted function for reuse)
  // Uses simple CSS without position/z-index on container to avoid Mapbox conflicts
  const createUserMarkerElement = (user: User, onClick: () => void) => {
    const ringColor = getIntentColor(user.intent);
    const initial = user.username.charAt(0).toUpperCase();
    const hasAvatar = user.avatar_url && user.avatar_url.length > 0;

    // Check if user is recently active (within 10 min) for glow effect
    const isRecentlyActive = user.last_active &&
      (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60) <= 10;

    // Simple container - no position/z-index to avoid Mapbox conflicts
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '48px';
    el.style.height = '48px';
    el.style.cursor = 'pointer';

    // Create the ring/border element
    const ring = document.createElement('div');
    ring.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: ${isRecentlyActive ? `0 0 0 2px ${ringColor}40, 0 0 12px ${ringColor}60` : 'none'};
      box-sizing: border-box;
    `;

    // Create the inner circle with photo or initial
    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${hasAvatar ? `url(${user.avatar_url}) center/cover` : '#1f2937'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      color: white;
      overflow: hidden;
    `;

    if (!hasAvatar) {
      inner.textContent = initial;
    }

    el.appendChild(ring);
    el.appendChild(inner);

    // Add verified badge if verified (inside element bounds)
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
      `;
      badge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" fill="none"/></svg>`;
      el.appendChild(badge);
    }

    // Add activity indicator dot based on last_active time
    // Green: < 2 min, Yellow: < 10 min, Red: < 30 min, None: > 30 min
    const getActivityColor = (): string | null => {
      if (!user.last_active) return null;
      const lastActive = new Date(user.last_active).getTime();
      const now = Date.now();
      const minutesAgo = (now - lastActive) / (1000 * 60);

      if (minutesAgo <= 2) return '#22c55e'; // Green - online now
      if (minutesAgo <= 10) return '#eab308'; // Yellow - recently active
      if (minutesAgo <= 30) return '#ef4444'; // Red - was active
      return null; // Offline - no dot
    };

    const activityColor = getActivityColor();
    if (activityColor) {
      const activityDot = document.createElement('div');
      activityDot.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        width: 10px;
        height: 10px;
        background: ${activityColor};
        border: 2px solid #0a0a0a;
        border-radius: 50%;
      `;
      el.appendChild(activityDot);
    }

    el.addEventListener('click', onClick);

    return el;
  };

  // Update user markers based on view mode and users
  // Uses Map to track markers by user ID for stable updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (viewMode === 'users') {
      const currentUserIds = new Set(usersForMarkers.map(u => u.id));
      const existingUserIds = new Set(userMarkersRef.current.keys());

      // Remove markers for users no longer in the list
      existingUserIds.forEach(userId => {
        if (!currentUserIds.has(userId)) {
          const marker = userMarkersRef.current.get(userId);
          if (marker) {
            marker.remove();
            userMarkersRef.current.delete(userId);
          }
        }
      });

      // Add or update markers for current users
      usersForMarkers.forEach((user) => {
        if (!user.location || !map.current) return;

        const existingMarker = userMarkersRef.current.get(user.id);

        if (existingMarker) {
          // Marker exists - only update position if needed (coordinates are stable for mock data)
          // Don't recreate the marker element
        } else {
          // Create new marker for new user with explicit offset for stable positioning
          const el = createUserMarkerElement(user, () => {
            setSelectedUser(user);
          });

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'top-left',
            offset: [-24, -24] // Half of 48px to center
          })
            .setLngLat([user.location.lng, user.location.lat])
            .addTo(map.current!);

          userMarkersRef.current.set(user.id, marker);
        }
      });
    } else {
      // Heatmap mode - remove all user markers
      userMarkersRef.current.forEach((marker) => marker.remove());
      userMarkersRef.current.clear();
    }
  }, [viewMode, usersForMarkers, mapLoaded]);

  // Calculate users at each location (from nearby users + presence data)
  const usersAtLocations = useMemo(() => {
    const locationUserMap: Record<string, {
      presenceUsers: typeof onlineUsers;
      nearbyUsers: User[];
    }> = {};

    // Initialize empty arrays for each location
    dbLocations.forEach(loc => {
      locationUserMap[loc.id] = { presenceUsers: [], nearbyUsers: [] };
    });

    // Find nearby users (within 50m of each location) from usersForMarkers
    usersForMarkers.forEach(user => {
      if (!user.location) return;

      dbLocations.forEach(loc => {
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
  }, [onlineUsers, usersForMarkers]);

  // Get icon SVG based on location type
  const getLocationIcon = (type: Location['type']): string => {
    switch (type) {
      case 'public':
        // Restroom/WC icon
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
        </svg>`;
      case 'private':
        // House icon
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>`;
      case 'cruising':
        // Tree/park icon
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L8 8h3v4H8l4 6 4-6h-3V8h3L12 2zM5 18v2h14v-2H5z"/>
        </svg>`;
      case 'venue':
        // Bar/drink icon
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z"/>
        </svg>`;
      default:
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>`;
    }
  };

  // Location marker color (purple - distinct from user intent colors)
  const locationColor = '#a855f7';

  // Update location markers with user count badges
  // Use stable Map-based tracking and simple CSS to prevent zoom issues
  const locationMarkersMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // In heatmap mode, remove all location markers (same as user markers)
    if (viewMode === 'heatmap') {
      locationMarkersMapRef.current.forEach((marker) => marker.remove());
      locationMarkersMapRef.current.clear();
      return;
    }

    const currentLocationIds = new Set(dbLocations.map(l => l.id));

    // Remove markers for locations no longer present
    locationMarkersMapRef.current.forEach((marker, id) => {
      if (!currentLocationIds.has(id)) {
        marker.remove();
        locationMarkersMapRef.current.delete(id);
      }
    });

    dbLocations.forEach((location) => {
      if (!map.current) return;

      // Skip if marker already exists (don't recreate)
      if (locationMarkersMapRef.current.has(location.id)) {
        return;
      }

      const usersData = usersAtLocations[location.id];
      const totalCount = (usersData?.nearbyUsers.length || 0) + (usersData?.presenceUsers.length || 0);

      // Use simple, clean element structure - no position/z-index on container
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.width = '48px';
      el.style.height = '48px';
      el.style.cursor = 'pointer';

      // Create ring/border element
      const ring = document.createElement('div');
      ring.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid ${locationColor};
        box-shadow: 0 0 0 2px ${locationColor}40, 0 0 12px ${locationColor}60;
        box-sizing: border-box;
      `;

      // Create inner circle with icon
      const inner = document.createElement('div');
      inner.style.cssText = `
        position: absolute;
        top: 4px;
        left: 4px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${locationColor};
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      inner.innerHTML = getLocationIcon(location.type);

      el.appendChild(ring);
      el.appendChild(inner);

      // Add user count badge if there are users (inside bounds)
      if (totalCount > 0) {
        const badge = document.createElement('div');
        badge.style.cssText = `
          position: absolute;
          bottom: 0;
          right: 0;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0a0a0a;
        `;
        badge.textContent = totalCount.toString();
        el.appendChild(badge);
      }

      el.addEventListener('click', () => {
        setSelectedLocationForUsers(location);
      });

      // Use offset to explicitly center the marker
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'top-left',
        offset: [-24, -24] // Half of 48px to center
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      locationMarkersMapRef.current.set(location.id, marker);
    });
  }, [mapLoaded, viewMode, usersAtLocations]);

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

    // Simple container - no position/z-index to avoid Mapbox conflicts
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '52px';
    el.style.height = '52px';
    el.style.cursor = 'pointer';

    // Create the ring/border element (no animation to avoid zoom issues)
    const ring = document.createElement('div');
    ring.style.cssText = `
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: 0 0 0 3px ${ringColor}50, 0 0 16px ${ringColor}70;
      box-sizing: border-box;
    `;

    // Create the inner circle with photo or initial
    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: ${hasAvatar ? `url(${currentUserProfile?.avatar_url}) center/cover` : '#1f2937'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
      color: white;
      overflow: hidden;
    `;

    if (!hasAvatar) {
      inner.textContent = initial;
    }

    el.appendChild(ring);
    el.appendChild(inner);

    // Add "You" label below (inside bounds, adjusted position)
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: 52px;
      left: 0;
      width: 52px;
      display: flex;
      justify-content: center;
    `;
    const labelInner = document.createElement('span');
    labelInner.style.cssText = `
      background: ${ringColor};
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    if (snappedLocation) {
      labelInner.textContent = `@ ${snappedLocation.name}`;
    } else if (locationAccuracy > 0) {
      labelInner.textContent = `You (~${locationAccuracy}m)`;
    } else {
      labelInner.textContent = 'You';
    }
    label.appendChild(labelInner);
    el.appendChild(label);

    // Use explicit offset for stable positioning
    userLocationMarker.current = new mapboxgl.Marker({
      element: el,
      anchor: 'top-left',
      offset: [-26, -26] // Half of 52px to center
    })
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

  // Prepare heatmap points from users AND cruising spots (memoized)
  const heatmapPoints = useMemo(() => {
    // User points
    const userPoints = usersForMarkers
      .filter((user) => user.location)
      .map((user) => ({
        lat: user.location!.lat,
        lng: user.location!.lng,
        weight: user.is_online ? 2 : 1,
      }));

    // Cruising spot points (weighted by user count at each location)
    const locationPoints = dbLocations.map((location) => {
      const usersData = usersAtLocations[location.id];
      const totalCount = (usersData?.nearbyUsers.length || 0) + (usersData?.presenceUsers.length || 0);
      // Base weight of 1 + bonus for each user at the location
      // Verified locations with more users show as hotter spots
      const weight = Math.max(1, totalCount * 1.5);
      return {
        lat: location.lat,
        lng: location.lng,
        weight: weight,
      };
    });

    return [...userPoints, ...locationPoints];
  }, [usersForMarkers, usersAtLocations]);

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Filter bar at top */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Map container */}
      <div className="flex-1 relative">
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
          {/* Map menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMapMenu(!showMapMenu)}
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

              {/* Divider */}
              <div className="border-t border-hole-border" />

              {/* Heatmap toggle */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Show Heatmap</span>
                  <button
                    onClick={toggleViewMode}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      viewMode === 'heatmap' ? 'bg-hole-accent' : 'bg-hole-border'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        viewMode === 'heatmap' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-hole-muted mt-1">
                  Show user density instead of individual markers
                </p>
              </div>
            </div>
            )}
          </div>
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
            {viewMode === 'users' ? `Users (${usersForMarkers.length})` : 'Heatmap'}
          </div>
          {isConnected && (
            <div className="px-3 py-1 bg-hole-surface/80 backdrop-blur border border-hole-border rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>{onlineUsers.length} online</span>
            </div>
          )}
        </div>
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
          onUserClick={(user) => {
            setSelectedUser(user);
            setSelectedLocationForUsers(null);
          }}
        />
      )}

      {/* User profile overlay */}
      {selectedUser && (
        <div className="absolute inset-0 z-[200]">
          <UserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />
        </div>
      )}
    </div>
  );
}
