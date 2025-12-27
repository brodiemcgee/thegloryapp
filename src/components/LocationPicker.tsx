// Location picker for encounter logging - mini map with address search and saved places

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSavedLocations, LocationData, SavedLocation } from '@/hooks/useSavedLocations';

// Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
}

// Quick location type tags (not saved)
const QUICK_TAGS = [
  { id: 'their_place', label: 'Their Place' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'sauna', label: 'Sauna' },
  { id: 'park', label: 'Park' },
  { id: 'car', label: 'Car' },
  { id: 'other', label: 'Other' },
];

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const { position, loading: geoLoading } = useGeolocation(true);
  const { locations: savedLocations, saveLocation, updateLocation } = useSavedLocations();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingPlace, setEditingPlace] = useState<SavedLocation | null>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = position
      ? [position.lng, position.lat] as [number, number]
      : [151.2093, -33.8688] as [number, number]; // Sydney default

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: 15,
      accessToken: MAPBOX_TOKEN,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Click to set location
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lat, lng);
      setSelectedTag(null);
      onChange({ lat, lng });
      reverseGeocode(lat, lng);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map center when position changes
  useEffect(() => {
    if (map.current && position && !value) {
      map.current.setCenter([position.lng, position.lat]);
      updateMarker(position.lat, position.lng);
      onChange({ lat: position.lat, lng: position.lng });
      reverseGeocode(position.lat, position.lng);
    }
  }, [position, mapLoaded]);

  // Update marker when value changes externally
  useEffect(() => {
    if (value && value.lat !== 0 && map.current && mapLoaded) {
      updateMarker(value.lat, value.lng);
      map.current.setCenter([value.lng, value.lat]);
      if (value.address && !address) {
        setAddress(value.address);
      }
    }
  }, [value, mapLoaded]);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new mapboxgl.Marker({ color: '#FF6B6B' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  }, []);

  // Reverse geocode to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const addr = data.features[0].place_name;
        setAddress(addr);
        onChange({ lat, lng, address: addr, name: selectedTag || undefined });
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
  };

  // Forward geocode address search
  const searchAddress = async () => {
    if (!address.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const addr = data.features[0].place_name;
        setAddress(addr);
        updateMarker(lat, lng);
        map.current?.setCenter([lng, lat]);
        onChange({ lat, lng, address: addr, name: selectedTag || undefined });
      }
    } catch (err) {
      console.error('Address search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Handle saved place selection
  const handleSavedPlaceSelect = (place: SavedLocation) => {
    setSelectedTag(place.name);
    updateMarker(place.lat, place.lng);
    map.current?.setCenter([place.lng, place.lat]);
    setAddress(place.address || '');
    onChange({
      lat: place.lat,
      lng: place.lng,
      address: place.address || undefined,
      name: place.name,
      savedLocationId: place.id,
    });
  };

  // Handle quick tag selection
  const handleQuickTagSelect = (tagId: string, label: string) => {
    if (selectedTag === tagId) {
      // Deselect
      setSelectedTag(null);
      if (position) {
        onChange({ lat: position.lat, lng: position.lng, name: undefined });
      } else {
        onChange(null);
      }
      return;
    }

    setSelectedTag(tagId);
    // Use current position with this tag name
    if (value && value.lat !== 0) {
      onChange({ ...value, name: label });
    } else if (position) {
      onChange({ lat: position.lat, lng: position.lng, name: label });
    } else {
      onChange({ lat: 0, lng: 0, name: label });
    }
  };

  // Save current location as a new place
  const handleSaveAsPlace = async () => {
    if (!newPlaceName.trim() || !value || value.lat === 0) return;

    try {
      const saved = await saveLocation(
        newPlaceName.trim(),
        value.lat,
        value.lng,
        address || undefined,
        newPlaceName.toLowerCase() === 'my place'
      );
      setSelectedTag(saved.name);
      setShowSaveAs(false);
      setNewPlaceName('');
      onChange({
        lat: saved.lat,
        lng: saved.lng,
        address: saved.address || undefined,
        name: saved.name,
        savedLocationId: saved.id,
      });
    } catch (err) {
      console.error('Failed to save place:', err);
    }
  };

  // Update a saved place's location
  const handleUpdatePlace = async (place: SavedLocation) => {
    if (!value || value.lat === 0) return;

    try {
      const updated = await updateLocation(place.id, {
        lat: value.lat,
        lng: value.lng,
        address: address || undefined,
      });
      setEditingPlace(null);
      onChange({
        lat: updated.lat,
        lng: updated.lng,
        address: updated.address || undefined,
        name: updated.name,
        savedLocationId: updated.id,
      });
    } catch (err) {
      console.error('Failed to update place:', err);
    }
  };

  // Get my place for special handling
  const myPlace = savedLocations.find(l => l.name.toLowerCase() === 'my place');

  return (
    <div className="space-y-3">
      {/* Saved places & quick tags */}
      <div className="flex flex-wrap gap-2">
        {/* My Place - special handling */}
        {myPlace ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => handleSavedPlaceSelect(myPlace)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedTag === myPlace.name
                  ? 'bg-hole-accent text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              My Place
            </button>
            {selectedTag === myPlace.name && (
              <button
                type="button"
                onClick={() => setEditingPlace(myPlace)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-hole-accent rounded-full flex items-center justify-center text-xs"
                title="Update location"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (value && value.lat !== 0) {
                setNewPlaceName('My Place');
                setShowSaveAs(true);
              }
            }}
            className="px-3 py-1.5 rounded-full text-sm bg-hole-surface border border-dashed border-hole-border hover:bg-hole-border text-hole-muted"
          >
            + My Place
          </button>
        )}

        {/* Other saved places */}
        {savedLocations
          .filter(l => l.name.toLowerCase() !== 'my place')
          .map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handleSavedPlaceSelect(place)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedTag === place.name
                  ? 'bg-hole-accent text-white'
                  : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
              }`}
            >
              {place.name}
            </button>
          ))}

        {/* Quick tags */}
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleQuickTagSelect(tag.id, tag.label)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedTag === tag.id
                ? 'bg-hole-accent text-white'
                : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
            }`}
          >
            {tag.label}
          </button>
        ))}

        {/* Save as new place */}
        {value && value.lat !== 0 && !showSaveAs && (
          <button
            type="button"
            onClick={() => setShowSaveAs(true)}
            className="px-3 py-1.5 rounded-full text-sm bg-hole-surface border border-dashed border-hole-border hover:bg-hole-border text-hole-muted"
          >
            + Save
          </button>
        )}
      </div>

      {/* Save as dialog */}
      {showSaveAs && (
        <div className="bg-hole-surface border border-hole-border rounded-lg p-3">
          <p className="text-xs text-hole-muted mb-2">Save this location as:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              placeholder="e.g., My Place, Work"
              className="flex-1 bg-hole-bg border border-hole-border rounded px-3 py-2 text-sm outline-none focus:border-hole-accent"
            />
            <button
              type="button"
              onClick={handleSaveAsPlace}
              disabled={!newPlaceName.trim()}
              className="px-3 py-2 bg-hole-accent text-white rounded text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveAs(false);
                setNewPlaceName('');
              }}
              className="px-3 py-2 bg-hole-border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Update place dialog */}
      {editingPlace && (
        <div className="bg-hole-surface border border-hole-border rounded-lg p-3">
          <p className="text-xs text-hole-muted mb-2">Update "{editingPlace.name}" to current location?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleUpdatePlace(editingPlace)}
              className="px-3 py-2 bg-hole-accent text-white rounded text-sm"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setEditingPlace(null)}
              className="px-3 py-2 bg-hole-border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mini Map */}
      <div
        ref={mapContainer}
        className="w-full h-40 rounded-lg overflow-hidden border border-hole-border"
        style={{ minHeight: '160px' }}
      />

      {/* Loading indicator */}
      {geoLoading && (
        <div className="text-xs text-hole-muted flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Getting your location...
        </div>
      )}

      {/* Address input */}
      <div>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
            placeholder="Enter address or click on map"
            className="flex-1 bg-hole-surface border border-hole-border rounded-lg px-3 py-2 text-sm outline-none focus:border-hole-accent"
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={searching || !address.trim()}
            className="px-4 py-2 bg-hole-accent text-white rounded-lg text-sm disabled:opacity-50"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
        {value && value.lat !== 0 && (
          <p className="text-xs text-hole-muted mt-1">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
