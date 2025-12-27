// Location picker for encounter logging - allows current location, saved places, or manual entry

'use client';

import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSavedLocations, LocationData, SavedLocation } from '@/hooks/useSavedLocations';

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
}

// Preset location types (for quick selection without GPS)
const LOCATION_PRESETS = [
  { id: 'my_place', label: 'My Place' },
  { id: 'their_place', label: 'Their Place' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'sauna', label: 'Sauna' },
  { id: 'bathhouse', label: 'Bathhouse' },
  { id: 'park', label: 'Park' },
  { id: 'car', label: 'Car' },
  { id: 'gym', label: 'Gym' },
  { id: 'bar', label: 'Bar/Club' },
  { id: 'other', label: 'Other' },
];

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { position, loading: geoLoading } = useGeolocation(true);
  const { locations: savedLocations, saveLocation, getMyPlace } = useSavedLocations();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Auto-select current location on mount if available
  useEffect(() => {
    if (position && !value && !geoLoading) {
      // Default to current location
      setUseCurrentLocation(true);
      onChange({
        lat: position.lat,
        lng: position.lng,
      });
    }
  }, [position, geoLoading]);

  const handlePresetSelect = (presetId: string) => {
    if (selectedPreset === presetId) {
      // Deselect
      setSelectedPreset(null);
      setUseCurrentLocation(false);
      onChange(null);
      return;
    }

    setSelectedPreset(presetId);
    setUseCurrentLocation(false);

    // Check if this is a saved location
    const savedLocation = savedLocations.find(
      (l) => l.name.toLowerCase() === presetId.replace('_', ' ')
    );

    if (savedLocation) {
      onChange({
        lat: savedLocation.lat,
        lng: savedLocation.lng,
        address: savedLocation.address || undefined,
        name: savedLocation.name,
        savedLocationId: savedLocation.id,
      });
    } else if (position) {
      // Use current location with the preset name
      onChange({
        lat: position.lat,
        lng: position.lng,
        name: LOCATION_PRESETS.find((p) => p.id === presetId)?.label,
      });
    } else {
      // No GPS, just store the name for now
      onChange({
        lat: 0,
        lng: 0,
        name: LOCATION_PRESETS.find((p) => p.id === presetId)?.label,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!position) return;

    setSelectedPreset(null);
    setUseCurrentLocation(true);
    onChange({
      lat: position.lat,
      lng: position.lng,
    });
  };

  const handleSaveCurrentAsPlace = async () => {
    if (!position || !saveName.trim()) return;

    try {
      const saved = await saveLocation(
        saveName.trim(),
        position.lat,
        position.lng,
        undefined, // Could add reverse geocoding later
        saveName.toLowerCase() === 'my place'
      );

      onChange({
        lat: saved.lat,
        lng: saved.lng,
        name: saved.name,
        savedLocationId: saved.id,
      });

      setShowSaveDialog(false);
      setSaveName('');
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  };

  const handleSelectSavedLocation = (location: SavedLocation) => {
    setSelectedPreset(null);
    setUseCurrentLocation(false);
    onChange({
      lat: location.lat,
      lng: location.lng,
      address: location.address || undefined,
      name: location.name,
      savedLocationId: location.id,
    });
  };

  // Check if My Place is saved
  const myPlace = getMyPlace();

  return (
    <div className="space-y-3">
      {/* Current location button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoLoading || !position}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            useCurrentLocation && !selectedPreset
              ? 'bg-hole-accent text-white'
              : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
          } ${geoLoading || !position ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {geoLoading ? 'Getting location...' : 'Current Location'}
        </button>

        {position && !showSaveDialog && (
          <button
            type="button"
            onClick={() => setShowSaveDialog(true)}
            className="text-xs text-hole-accent hover:underline"
          >
            Save as...
          </button>
        )}
      </div>

      {/* Save location dialog */}
      {showSaveDialog && (
        <div className="bg-hole-surface border border-hole-border rounded-lg p-3 space-y-2">
          <p className="text-xs text-hole-muted">Save current location as:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g., My Place"
              className="flex-1 bg-hole-bg border border-hole-border rounded px-3 py-2 text-sm outline-none focus:border-hole-accent"
            />
            <button
              type="button"
              onClick={handleSaveCurrentAsPlace}
              disabled={!saveName.trim()}
              className="px-3 py-2 bg-hole-accent text-white rounded text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
              }}
              className="px-3 py-2 bg-hole-border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved locations */}
      {savedLocations.length > 0 && (
        <div>
          <p className="text-xs text-hole-muted mb-2">Saved Places</p>
          <div className="flex flex-wrap gap-2">
            {savedLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelectSavedLocation(location)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  value?.savedLocationId === location.id
                    ? 'bg-hole-accent text-white'
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location type presets */}
      <div>
        <p className="text-xs text-hole-muted mb-2">Or select type</p>
        <div className="flex flex-wrap gap-2">
          {LOCATION_PRESETS.map((preset) => {
            // Check if this preset matches a saved location
            const isSaved = savedLocations.some(
              (l) => l.name.toLowerCase() === preset.label.toLowerCase()
            );
            // Don't show preset if already in saved locations
            if (isSaved) return null;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedPreset === preset.id
                    ? 'bg-hole-accent text-white'
                    : 'bg-hole-surface border border-hole-border hover:bg-hole-border'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected location display */}
      {value && (value.lat !== 0 || value.name) && (
        <div className="bg-hole-surface/50 rounded-lg p-2 text-xs text-hole-muted">
          {value.name && <span className="font-medium text-white">{value.name}</span>}
          {value.lat !== 0 && (
            <span className="ml-2">
              ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
