-- Function to get all active locations with coordinates as GeoJSON
CREATE OR REPLACE FUNCTION get_locations_with_coordinates()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  type location_type,
  coordinates_json jsonb,
  created_by uuid,
  is_verified boolean,
  is_active boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.description,
    l.type,
    ST_AsGeoJSON(l.coordinates)::jsonb as coordinates_json,
    l.created_by,
    l.is_verified,
    l.is_active,
    l.created_at
  FROM locations l
  WHERE l.is_active = true
  ORDER BY l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
