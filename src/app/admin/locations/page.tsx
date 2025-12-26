'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapPin,
  List,
  Map,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Flag,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useAuditLog } from '@/hooks/admin/useAuditLog';
import { cn, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  description: string | null;
  type: 'public' | 'private' | 'cruising' | 'venue';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  coordinates: { lat: number; lng: number } | null;
  creator?: { username: string } | null;
  check_in_count?: number;
}

type ViewMode = 'list' | 'map';
type StatusFilter = 'all' | 'verified' | 'unverified' | 'flagged';
type TypeFilter = 'all' | 'public' | 'private' | 'cruising' | 'venue';

const typeColors: Record<string, string> = {
  public: 'bg-blue-100 text-blue-700',
  private: 'bg-purple-100 text-purple-700',
  cruising: 'bg-pink-100 text-pink-700',
  venue: 'bg-green-100 text-green-700',
};

interface NewLocation {
  name: string;
  description: string;
  type: 'public' | 'private' | 'cruising' | 'venue';
  lat: string;
  lng: string;
}

const defaultNewLocation: NewLocation = {
  name: '',
  description: '',
  type: 'public',
  lat: '',
  lng: '',
};

export default function LocationsPage() {
  const { adminRoleId } = useAdminAuth();
  const { logAction } = useAuditLog();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocation, setNewLocation] = useState<NewLocation>(defaultNewLocation);
  const [isCreating, setIsCreating] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('locations')
        .select(`
          *,
          creator:profiles(username)
        `)
        .order('created_at', { ascending: false });

      // Apply search
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      // Apply status filter
      if (statusFilter === 'verified') {
        query = query.eq('is_verified', true);
      } else if (statusFilter === 'unverified') {
        query = query.eq('is_verified', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  async function verifyLocation(locationId: string) {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_verified: true })
        .eq('id', locationId);

      if (error) throw error;

      await logAction({
        action: 'approve',
        resourceType: 'location',
        resourceId: locationId,
      });

      toast.success('Location verified');
      loadLocations();
    } catch (error) {
      console.error('Error verifying location:', error);
      toast.error('Failed to verify location');
    }
  }

  async function removeLocation(locationId: string) {
    if (!confirm('Are you sure you want to remove this location?')) return;

    try {
      const { error } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', locationId);

      if (error) throw error;

      await logAction({
        action: 'delete',
        resourceType: 'location',
        resourceId: locationId,
      });

      toast.success('Location removed');
      loadLocations();
    } catch (error) {
      console.error('Error removing location:', error);
      toast.error('Failed to remove location');
    }
  }

  async function createLocation() {
    if (!newLocation.name.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    const lat = parseFloat(newLocation.lat);
    const lng = parseFloat(newLocation.lng);

    if (newLocation.lat && (isNaN(lat) || lat < -90 || lat > 90)) {
      toast.error('Invalid latitude (must be between -90 and 90)');
      return;
    }

    if (newLocation.lng && (isNaN(lng) || lng < -180 || lng > 180)) {
      toast.error('Invalid longitude (must be between -180 and 180)');
      return;
    }

    try {
      setIsCreating(true);

      const locationData: Record<string, unknown> = {
        name: newLocation.name.trim(),
        description: newLocation.description.trim() || null,
        type: newLocation.type,
        is_verified: true, // Admin-created locations are auto-verified
        is_active: true,
      };

      // Add coordinates if provided
      if (newLocation.lat && newLocation.lng) {
        locationData.lat = lat;
        locationData.lng = lng;
      }

      const { data, error } = await supabase
        .from('locations')
        .insert(locationData)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        action: 'create',
        resourceType: 'location',
        resourceId: data.id,
        details: { name: newLocation.name, type: newLocation.type },
      });

      toast.success('Location created successfully');
      setShowAddModal(false);
      setNewLocation(defaultNewLocation);
      loadLocations();
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Failed to create location');
    } finally {
      setIsCreating(false);
    }
  }

  const filteredLocations = locations.filter((loc) => loc.is_active !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Moderation</h1>
          <p className="text-gray-600 mt-1">
            {filteredLocations.length} locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'map' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={loadLocations}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="cruising">Cruising</option>
            <option value="venue">Venue</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900">No locations found</h2>
              <p className="text-gray-600 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                <div className="col-span-4">Location</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50"
                  >
                    {/* Location Info */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{location.name}</div>
                          {location.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {location.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                        typeColors[location.type]
                      )}>
                        {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {location.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <AlertTriangle className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* Created */}
                    <div className="col-span-2 text-sm text-gray-600">
                      <div>{formatRelativeTime(location.created_at)}</div>
                      {location.creator && (
                        <div className="text-xs text-gray-500">
                          by @{location.creator.username}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {!location.is_verified && (
                          <button
                            onClick={() => verifyLocation(location.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedLocation(location)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeLocation(location.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="h-[600px] flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Map View</h3>
              <p className="text-gray-600 mt-1">
                Map view requires Mapbox integration.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {filteredLocations.length} locations would be displayed here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Location Details
              </h2>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium text-gray-900">{selectedLocation.name}</p>
              </div>

              {selectedLocation.description && (
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-gray-700">{selectedLocation.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p className="font-medium capitalize">{selectedLocation.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium">
                    {selectedLocation.is_verified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </div>

              {selectedLocation.creator && (
                <div>
                  <label className="text-sm text-gray-500">Created by</label>
                  <p className="font-medium">@{selectedLocation.creator.username}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="text-gray-700">{formatRelativeTime(selectedLocation.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {!selectedLocation.is_verified && (
                <button
                  onClick={() => {
                    verifyLocation(selectedLocation.id);
                    setSelectedLocation(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Verify Location
                </button>
              )}
              <button
                onClick={() => {
                  removeLocation(selectedLocation.id);
                  setSelectedLocation(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Remove Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Location
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewLocation(defaultNewLocation);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="e.g., Central Park Restroom"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="Brief description of the location..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as NewLocation['type'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="cruising">Cruising</option>
                  <option value="venue">Venue</option>
                </select>
              </div>

              {/* Coordinates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinates (optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={newLocation.lat}
                      onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                      placeholder="Latitude (e.g., -33.8688)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newLocation.lng}
                      onChange={(e) => setNewLocation({ ...newLocation, lng: e.target.value })}
                      placeholder="Longitude (e.g., 151.2093)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Right-click on Google Maps and select coordinates to copy them
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewLocation(defaultNewLocation);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createLocation}
                disabled={isCreating || !newLocation.name.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Location'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
