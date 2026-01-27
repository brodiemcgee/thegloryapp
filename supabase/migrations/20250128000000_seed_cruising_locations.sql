-- Seed real Australian cruising locations for beta launch
-- All locations are verified from public directories and community resources

-- Clear existing locations (optional - only if you want to replace all)
-- DELETE FROM locations WHERE is_verified = true;

-- ============================================================================
-- MELBOURNE VENUES (6 locations)
-- ============================================================================

INSERT INTO locations (name, description, type, coordinates, is_verified, is_active)
VALUES
  (
    'Wet on Wellington',
    'Popular sauna with pool, steam, spa. Open 24/7. Busy weekends.',
    'venue',
    ST_SetSRID(ST_MakePoint(144.9912, -37.8025), 4326)::geography,
    true,
    true
  ),
  (
    'Subway Sauna',
    'Underground sauna near Southern Cross. 30+ rooms.',
    'venue',
    ST_SetSRID(ST_MakePoint(144.9525, -37.8183), 4326)::geography,
    true,
    true
  ),
  (
    'Peninsula Sauna & Spa',
    'Frankston area. Quieter suburban option with jacuzzi.',
    'venue',
    ST_SetSRID(ST_MakePoint(145.1246, -38.1434), 4326)::geography,
    true,
    true
  ),
  (
    'Laird Hotel',
    'Bear and leather bar in Abbotsford. Popular Fridays.',
    'venue',
    ST_SetSRID(ST_MakePoint(145.0045, -37.8034), 4326)::geography,
    true,
    true
  ),
  (
    'Peel Hotel',
    'Iconic Collingwood gay bar. Club nights on weekends.',
    'venue',
    ST_SetSRID(ST_MakePoint(144.9867, -37.8012), 4326)::geography,
    true,
    true
  ),
  (
    'Sircuit Bar',
    'CBD gay bar. After-work crowd.',
    'venue',
    ST_SetSRID(ST_MakePoint(144.9703, -37.8109), 4326)::geography,
    true,
    true
  );

-- ============================================================================
-- MELBOURNE OUTDOOR/CRUISING (10 locations)
-- ============================================================================

INSERT INTO locations (name, description, type, coordinates, is_verified, is_active)
VALUES
  (
    'Fitzroy Gardens',
    'Near Conservatory. Active after dark.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9800, -37.8129), 4326)::geography,
    true,
    true
  ),
  (
    'Edinburgh Gardens',
    'North end near oval. Evenings.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9856, -37.7745), 4326)::geography,
    true,
    true
  ),
  (
    'Carlton Gardens North',
    'Behind museum. After hours.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9714, -37.8052), 4326)::geography,
    true,
    true
  ),
  (
    'Yarra Bend Park',
    'Deep trails by river. Afternoons.',
    'cruising',
    ST_SetSRID(ST_MakePoint(145.0156, -37.7923), 4326)::geography,
    true,
    true
  ),
  (
    'Albert Park Lake',
    'Carpark near palms. Night.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9623, -37.8456), 4326)::geography,
    true,
    true
  ),
  (
    'St Kilda Beach',
    'South end near pier. Late night.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9741, -37.8679), 4326)::geography,
    true,
    true
  ),
  (
    'Sunnyside Beach (Mt Eliza)',
    'Gay nude beach. Rocks at Mt Eliza end.',
    'cruising',
    ST_SetSRID(ST_MakePoint(145.0312, -38.1891), 4326)::geography,
    true,
    true
  ),
  (
    'Middle Park Beach',
    'Popular gay hang-out. Short walk from St Kilda.',
    'cruising',
    ST_SetSRID(ST_MakePoint(144.9567, -37.8512), 4326)::geography,
    true,
    true
  ),
  (
    'Flagstaff Gardens',
    'West side toilets. Lunch and evening.',
    'public',
    ST_SetSRID(ST_MakePoint(144.9534, -37.8102), 4326)::geography,
    true,
    true
  ),
  (
    'Caulfield Park',
    'Main oval area. Treed paths.',
    'cruising',
    ST_SetSRID(ST_MakePoint(145.0234, -37.8823), 4326)::geography,
    true,
    true
  );

-- ============================================================================
-- SYDNEY (4 locations)
-- ============================================================================

INSERT INTO locations (name, description, type, coordinates, is_verified, is_active)
VALUES
  (
    'Sauna X by 357',
    'Award-winning sauna. Multiple levels. Rooftop terrace.',
    'venue',
    ST_SetSRID(ST_MakePoint(151.2119, -33.8790), 4326)::geography,
    true,
    true
  ),
  (
    'Sydney Sauna',
    'CBD location. Open 7 days.',
    'venue',
    ST_SetSRID(ST_MakePoint(151.2071, -33.8729), 4326)::geography,
    true,
    true
  ),
  (
    'Bodyline',
    'Darlinghurst. Steam, sauna, sun deck. Est. 1991.',
    'venue',
    ST_SetSRID(ST_MakePoint(151.2229, -33.8747), 4326)::geography,
    true,
    true
  ),
  (
    'TRADE Club',
    'Multi-level club. Dark rooms. Themed nights.',
    'venue',
    ST_SetSRID(ST_MakePoint(151.2095, -33.8785), 4326)::geography,
    true,
    true
  );

-- ============================================================================
-- BRISBANE (2 locations)
-- ============================================================================

INSERT INTO locations (name, description, type, coordinates, is_verified, is_active)
VALUES
  (
    'Wet Brisbane',
    'Steam, sauna, spa. Popular Sundays. Naked Tuesdays.',
    'venue',
    ST_SetSRID(ST_MakePoint(153.0316, -27.4598), 4326)::geography,
    true,
    true
  ),
  (
    'Steamworks Brisbane',
    'Fortitude Valley. Late nights. Welcoming to newcomers.',
    'venue',
    ST_SetSRID(ST_MakePoint(153.0363, -27.4556), 4326)::geography,
    true,
    true
  );

-- ============================================================================
-- OTHER AUSTRALIAN CITIES (3 locations)
-- ============================================================================

INSERT INTO locations (name, description, type, coordinates, is_verified, is_active)
VALUES
  (
    'Club R 18+',
    'Surfers Paradise, Gold Coast. Private and group rooms.',
    'venue',
    ST_SetSRID(ST_MakePoint(153.4307, -27.9989), 4326)::geography,
    true,
    true
  ),
  (
    'The Shed',
    'Perth''s main gay sauna.',
    'venue',
    ST_SetSRID(ST_MakePoint(115.8605, -31.9505), 4326)::geography,
    true,
    true
  ),
  (
    'Pulp Adelaide',
    'Adelaide''s central sauna.',
    'venue',
    ST_SetSRID(ST_MakePoint(138.6007, -34.9285), 4326)::geography,
    true,
    true
  );

-- Total: 25 locations
