// Heatmap layer component for Mapbox

'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight?: number;
}

interface MapHeatmapProps {
  map: mapboxgl.Map | null;
  points: HeatmapPoint[];
  colors?: string[];
  intensity?: number;
}

export default function MapHeatmap({
  map,
  points,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'],
  intensity = 1,
}: MapHeatmapProps) {
  useEffect(() => {
    if (!map || points.length === 0) return;

    // Wait for map to be fully loaded
    const addHeatmapLayer = () => {
      // Remove existing heatmap layers if they exist
      if (map.getLayer('heatmap-layer')) {
        map.removeLayer('heatmap-layer');
      }
      if (map.getSource('heatmap-source')) {
        map.removeSource('heatmap-source');
      }

      // Create GeoJSON from points
      const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: points.map((point) => ({
          type: 'Feature',
          properties: {
            weight: point.weight || 1,
          },
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat],
          },
        })),
      };

      // Add source
      map.addSource('heatmap-source', {
        type: 'geojson',
        data: geojson,
      });

      // Add heatmap layer
      map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          // Increase weight as diameter increases
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0,
            0,
            6,
            1,
          ],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            intensity * 0.5,
            15,
            intensity * 1.5,
          ],
          // Assign color values be applied to points depending on their density
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 0, 255, 0)',
            0.2,
            colors[0] || '#3b82f6',
            0.4,
            colors[1] || '#8b5cf6',
            0.6,
            colors[2] || '#ec4899',
            0.8,
            colors[3] || '#ef4444',
          ],
          // Increase radius as zoom increases
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            10,
            15,
            30,
          ],
          // Decrease opacity to transition into the circle layer
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7,
            0.8,
            15,
            0.6,
          ],
        },
      });
    };

    if (map.isStyleLoaded()) {
      addHeatmapLayer();
    } else {
      map.once('load', addHeatmapLayer);
    }

    return () => {
      if (map.getLayer('heatmap-layer')) {
        map.removeLayer('heatmap-layer');
      }
      if (map.getSource('heatmap-source')) {
        map.removeSource('heatmap-source');
      }
    };
  }, [map, points, colors, intensity]);

  return null; // This component doesn't render anything directly
}
