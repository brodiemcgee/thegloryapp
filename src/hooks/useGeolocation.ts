// Geolocation hook for user position

'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useGeolocation(enabled: boolean = true): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getPosition = useCallback(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  }, [enabled]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  // Watch position changes
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        // Silently fail watch updates
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return {
    position,
    error,
    loading,
    refresh: getPosition,
  };
}
