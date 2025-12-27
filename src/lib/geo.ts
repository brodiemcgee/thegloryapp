// Geo utilities using Turf.js for accurate distance calculations

import { point } from '@turf/helpers';
import distance from '@turf/distance';
import { Location } from '@/types';

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

// Session-based random values for consistent offset during a session
let sessionAngle: number | null = null;
let sessionDistanceFactor: number | null = null;

/**
 * Generate session-consistent random values
 * These stay the same for the entire browser session
 */
function getSessionRandomValues(): { angle: number; distanceFactor: number } {
  if (sessionAngle === null || sessionDistanceFactor === null) {
    sessionAngle = Math.random() * 2 * Math.PI;
    sessionDistanceFactor = Math.random();
  }
  return { angle: sessionAngle, distanceFactor: sessionDistanceFactor };
}

/**
 * Offset a location by a random amount within a given radius for privacy
 * The offset is consistent within a browser session (marker won't jump around)
 * @param position Original position with lat/lng
 * @param radiusMeters Maximum radius to offset by (0-200m)
 * @returns New position offset by a random but consistent amount
 */
export function offsetLocation(
  position: GeoPoint,
  radiusMeters: number
): GeoPoint {
  if (radiusMeters <= 0) return position;

  const { angle, distanceFactor } = getSessionRandomValues();
  const distance = distanceFactor * radiusMeters;

  // Convert meters to approximate degrees
  // 1 degree latitude = ~111,320 meters
  // 1 degree longitude varies by latitude
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(position.lat * Math.PI / 180);

  const offsetLat = (distance * Math.cos(angle)) / metersPerDegreeLat;
  const offsetLng = (distance * Math.sin(angle)) / metersPerDegreeLng;

  return {
    lat: position.lat + offsetLat,
    lng: position.lng + offsetLng,
  };
}

/**
 * Find the nearest verified location within a given distance threshold
 * @param position User's current position
 * @param locations Array of locations to check
 * @param maxDistanceMeters Maximum distance in meters to consider (default 25m)
 * @returns The nearest verified location within threshold, or null if none found
 */
export function findNearestLocation(
  position: GeoPoint,
  locations: Location[],
  maxDistanceMeters: number = 25
): Location | null {
  const verifiedLocations = locations.filter(l => l.is_verified);

  let nearestLocation: Location | null = null;
  let nearestDistance = Infinity;

  for (const location of verifiedLocations) {
    const distanceKm = calculateDistance(position, { lat: location.lat, lng: location.lng });
    const distanceMeters = distanceKm * 1000;

    if (distanceMeters <= maxDistanceMeters && distanceMeters < nearestDistance) {
      nearestDistance = distanceMeters;
      nearestLocation = location;
    }
  }

  return nearestLocation;
}
