// Geo utilities using Turf.js for accurate distance calculations

import { point } from '@turf/helpers';
import distance from '@turf/distance';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Turf.js
 * @param point1 First point with lat/lng
 * @param point2 Second point with lat/lng
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const from = point([point1.lng, point1.lat]);
  const to = point([point2.lng, point2.lat]);
  return distance(from, to, { units: 'kilometers' });
}

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted string like "500m" or "1.2km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Check if a point is within a given radius of a center point
 * @param point Point to check
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  point: GeoPoint,
  center: GeoPoint,
  radiusKm: number
): boolean {
  const dist = calculateDistance(point, center);
  return dist <= radiusKm;
}

/**
 * Sort items by distance from a center point
 * @param items Array of items with location property
 * @param centerPoint Center point to calculate distances from
 * @returns Sorted array with distance_km property added
 */
export function sortByDistance<T extends { location?: GeoPoint }>(
  items: T[],
  centerPoint: GeoPoint
): (T & { distance_km: number })[] {
  return items
    .filter((item) => item.location) // Only items with location
    .map((item) => ({
      ...item,
      distance_km: calculateDistance(item.location!, centerPoint),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
}
