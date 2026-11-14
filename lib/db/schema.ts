export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, neighborhood TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY, giver_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other', status TEXT NOT NULL DEFAULT 'draft', price_cents INTEGER NOT NULL DEFAULT 0,
  condition_note TEXT, purchased_from TEXT, neighborhood TEXT, lat REAL, lng REAL,
  width_m REAL, depth_m REAL, height_m REAL, dimensions_source TEXT NOT NULL DEFAULT 'unknown',
  ai_generated INTEGER NOT NULL DEFAULT 0, client_key TEXT UNIQUE, created_at TEXT NOT NULL, published_at TEXT
);
CREATE TABLE IF NOT EXISTS listing_photos (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE, url TEXT NOT NULL,
  width INTEGER, height INTEGER, sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), raw_text TEXT NOT NULL, categories TEXT NOT NULL DEFAULT '[]',
  keywords TEXT NOT NULL DEFAULT '[]', max_price_cents INTEGER, max_distance_km REAL, neighborhood TEXT, lat REAL, lng REAL,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  wishlist_id TEXT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE, score INTEGER NOT NULL, reasons TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL, UNIQUE(listing_id, wishlist_id)
);
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, length_m REAL NOT NULL, width_m REAL NOT NULL,
  height_m REAL NOT NULL, display_unit TEXT NOT NULL DEFAULT 'ft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS room_placements (
  id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
  label TEXT NOT NULL, category TEXT NOT NULL, x REAL NOT NULL, z REAL NOT NULL, rotation_y REAL NOT NULL DEFAULT 0,
  width_m REAL NOT NULL, depth_m REAL NOT NULL, height_m REAL NOT NULL, dimensions_confirmed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id),
  message TEXT, created_at TEXT NOT NULL, UNIQUE(listing_id, user_id)
);
CREATE TABLE IF NOT EXISTS measurement_requests (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE, requester_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, UNIQUE(listing_id, requester_id)
);
CREATE TABLE IF NOT EXISTS pickup_requests (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE, requester_id TEXT NOT NULL REFERENCES users(id),
  driver_id TEXT REFERENCES users(id), status TEXT NOT NULL DEFAULT 'open', from_neighborhood TEXT NOT NULL, to_neighborhood TEXT NOT NULL,
  preferred_window TEXT, note TEXT, driver_note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS driver_availability (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id), neighborhood TEXT NOT NULL, days TEXT NOT NULL DEFAULT '[]',
  vehicle_note TEXT, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  href TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, published_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
`;
