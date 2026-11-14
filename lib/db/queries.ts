import { getDb, newId, nowIso } from "./client";
import type { Category } from "@/lib/categories";
import { lookupNeighborhood } from "@/lib/geo/neighborhoods";
import type { Listing, ListingStatus, MatchRow, Notification, Pickup, PickupStatusT, Placement, Room, User, Wishlist, Driver } from "./types";


type Row = any;
const bool = (v: unknown) => v === 1 || v === true;

// ---------- users ----------
const toUser = (r: Row): User => ({ id: r.id, name: r.name, email: r.email, neighborhood: r.neighborhood });
export const getUser = (id: string): User | null => {
  const r = getDb().prepare("SELECT * FROM users WHERE id=?").get(id);
  return r ? toUser(r) : null;
};
export const listUsers = (): User[] => getDb().prepare("SELECT * FROM users ORDER BY name").all().map(toUser);
export function upsertUserByEmail(name: string, email: string, neighborhood?: string | null, id?: string): User {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE email=?").get(email.toLowerCase());
  if (existing) return toUser(existing);
  const uid = id ?? newId();
  db.prepare("INSERT INTO users (id,name,email,neighborhood,created_at) VALUES (?,?,?,?,?)").run(uid, name, email.toLowerCase(), neighborhood ?? null, nowIso());
  return getUser(uid)!;
}
export const firstName = (n: string) => n.trim().split(/\s+/)[0];

// ---------- listings ----------
const LISTING_SELECT = `SELECT l.*, u.name AS giver_name,
  (SELECT url FROM listing_photos p WHERE p.listing_id=l.id ORDER BY sort_order LIMIT 1) AS photo_url
  FROM listings l JOIN users u ON u.id=l.giver_id`;
const toListing = (r: Row): Listing => ({
  id: r.id, giverId: r.giver_id, giverName: r.giver_name, title: r.title, description: r.description, category: r.category as Category,
  status: r.status as ListingStatus, priceCents: r.price_cents, conditionNote: r.condition_note, purchasedFrom: r.purchased_from,
  neighborhood: r.neighborhood, lat: r.lat, lng: r.lng, widthM: r.width_m, depthM: r.depth_m, heightM: r.height_m,
  dimensionsSource: r.dimensions_source, aiGenerated: bool(r.ai_generated), createdAt: r.created_at, publishedAt: r.published_at, photoUrl: r.photo_url,
});
export const getListing = (id: string): Listing | null => {
  const r = getDb().prepare(`${LISTING_SELECT} WHERE l.id=?`).get(id);
  return r ? toListing(r) : null;
};
export const getListingByClientKey = (key: string): Listing | null => {
  const r = getDb().prepare(`${LISTING_SELECT} WHERE l.client_key=?`).get(key);
  return r ? toListing(r) : null;
};

export type NewListing = {
  id?: string; giverId: string; title: string; description?: string; category: Category; priceCents?: number;
  conditionNote?: string | null; purchasedFrom?: string | null; neighborhood?: string | null;
  widthM?: number | null; depthM?: number | null; heightM?: number | null; aiGenerated?: boolean; clientKey?: string | null;
  photo?: { url: string; width?: number | null; height?: number | null } | null; publishedAt?: string; createdAt?: string;
};
export function createListing(n: NewListing): Listing {
  const db = getDb();
  const id = n.id ?? newId();
  const nb = lookupNeighborhood(n.neighborhood);
  const hasDims = n.widthM != null && n.depthM != null && n.heightM != null;
  const now = n.publishedAt ?? nowIso();
  db.transaction(() => {
    db.prepare(`INSERT INTO listings (id,giver_id,title,description,category,status,price_cents,condition_note,purchased_from,neighborhood,lat,lng,
      width_m,depth_m,height_m,dimensions_source,ai_generated,client_key,created_at,published_at)
      VALUES (?,?,?,?,?,'available',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, n.giverId, n.title, n.description ?? "", n.category, n.priceCents ?? 0, n.conditionNote ?? null, n.purchasedFrom ?? null,
      n.neighborhood ?? null, nb?.lat ?? null, nb?.lng ?? null, hasDims ? n.widthM : null, hasDims ? n.depthM : null, hasDims ? n.heightM : null,
      hasDims ? "giver_provided" : "unknown", n.aiGenerated ? 1 : 0, n.clientKey ?? null, n.createdAt ?? now, now);
    if (n.photo) db.prepare("INSERT INTO listing_photos (id,listing_id,url,width,height,sort_order) VALUES (?,?,?,?,?,0)").run(newId(), id, n.photo.url, n.photo.width ?? null, n.photo.height ?? null);
  })();
  return getListing(id)!;
}

export type ListingFilters = { q?: string; category?: string; neighborhood?: string; freeOnly?: boolean; giverId?: string; status?: string; limit?: number };
export function listListings(f: ListingFilters = {}): Listing[] {
  const where: string[] = [];
  const args: unknown[] = [];
  where.push("l.status = ?"); args.push(f.status ?? "available");
  if (f.category) { where.push("l.category = ?"); args.push(f.category); }
  if (f.neighborhood) { where.push("l.neighborhood = ?"); args.push(f.neighborhood); }
  if (f.freeOnly) where.push("l.price_cents = 0");
  if (f.giverId) { where.push("l.giver_id = ?"); args.push(f.giverId); }
  if (f.q) {
    for (const w of f.q.toLowerCase().split(/\s+/).filter(Boolean)) {
      where.push("(lower(l.title) LIKE ? OR lower(l.description) LIKE ? OR l.category LIKE ?)");
      args.push(`%${w}%`, `%${w}%`, `%${w}%`);
    }
  }
  const sql = `${LISTING_SELECT} WHERE ${where.join(" AND ")} ORDER BY l.published_at DESC LIMIT ?`;
  return getDb().prepare(sql).all(...args, f.limit ?? 60).map(toListing);
}
export const allAvailableListings = () => listListings({ limit: 1000 });

export function updateListing(id: string, patch: Partial<{ title: string; description: string; category: Category; priceCents: number; conditionNote: string | null;
  purchasedFrom: string | null; neighborhood: string | null; widthM: number | null; depthM: number | null; heightM: number | null; status: ListingStatus }>) {
  const db = getDb();
  const sets: string[] = []; const args: unknown[] = [];
  const map: Record<string, string> = { title: "title", description: "description", category: "category", priceCents: "price_cents", conditionNote: "condition_note", purchasedFrom: "purchased_from", status: "status" };
  for (const [k, col] of Object.entries(map)) if ((patch as Row)[k] !== undefined) { sets.push(`${col}=?`); args.push((patch as Row)[k]); }
  if (patch.neighborhood !== undefined) {
    const nb = lookupNeighborhood(patch.neighborhood);
    sets.push("neighborhood=?", "lat=?", "lng=?"); args.push(patch.neighborhood, nb?.lat ?? null, nb?.lng ?? null);
  }
  if (patch.widthM !== undefined || patch.depthM !== undefined || patch.heightM !== undefined) {
    const has = patch.widthM != null && patch.depthM != null && patch.heightM != null;
    sets.push("width_m=?", "depth_m=?", "height_m=?", "dimensions_source=?");
    args.push(has ? patch.widthM : null, has ? patch.depthM : null, has ? patch.heightM : null, has ? "giver_provided" : "unknown");
  }
  if (!sets.length) return getListing(id);
  db.prepare(`UPDATE listings SET ${sets.join(",")} WHERE id=?`).run(...args, id);
  return getListing(id);
}

export function addInterest(listingId: string, userId: string, message?: string | null): boolean {
  const r = getDb().prepare("INSERT OR IGNORE INTO interests (id,listing_id,user_id,message,created_at) VALUES (?,?,?,?,?)").run(newId(), listingId, userId, message ?? null, nowIso());
  return r.changes > 0;
}
export const hasInterest = (listingId: string, userId: string) => !!getDb().prepare("SELECT 1 FROM interests WHERE listing_id=? AND user_id=?").get(listingId, userId);

// measurement requests
export function createMeasurementRequest(listingId: string, requesterId: string): boolean {
  const r = getDb().prepare("INSERT OR IGNORE INTO measurement_requests (id,listing_id,requester_id,status,created_at) VALUES (?,?,?, 'open', ?)").run(newId(), listingId, requesterId, nowIso());
  return r.changes > 0;
}
export const hasMeasurementRequest = (listingId: string, userId: string) => !!getDb().prepare("SELECT 1 FROM measurement_requests WHERE listing_id=? AND requester_id=?").get(listingId, userId);
export const openMeasurementRequesters = (listingId: string): string[] =>
  getDb().prepare("SELECT requester_id FROM measurement_requests WHERE listing_id=? AND status='open'").all(listingId).map((r: Row) => r.requester_id);
export function answerMeasurementRequests(listingId: string) {
  getDb().prepare("UPDATE measurement_requests SET status='answered' WHERE listing_id=? AND status='open'").run(listingId);
}
export const countOpenMeasurementRequests = (listingId: string) => (getDb().prepare("SELECT COUNT(*) c FROM measurement_requests WHERE listing_id=? AND status='open'").get(listingId) as Row).c as number;

// ---------- wishlists ----------
const toWishlist = (r: Row): Wishlist => ({
  id: r.id, userId: r.user_id, rawText: r.raw_text, categories: JSON.parse(r.categories), keywords: JSON.parse(r.keywords),
  maxPriceCents: r.max_price_cents, maxDistanceKm: r.max_distance_km, neighborhood: r.neighborhood, lat: r.lat, lng: r.lng, active: bool(r.active), createdAt: r.created_at,
});
export const getWishlist = (id: string): Wishlist | null => {
  const r = getDb().prepare("SELECT * FROM wishlists WHERE id=?").get(id);
  return r ? toWishlist(r) : null;
};
export const listWishlists = (userId: string): Wishlist[] => getDb().prepare("SELECT * FROM wishlists WHERE user_id=? ORDER BY created_at DESC").all(userId).map(toWishlist);
export const activeWishlists = (): Wishlist[] => getDb().prepare("SELECT * FROM wishlists WHERE active=1").all().map(toWishlist);

export type WishlistInput = { rawText: string; categories: Category[]; keywords: string[]; maxPriceCents: number | null; maxDistanceKm: number | null; neighborhood?: string | null; active?: boolean };
export function createWishlist(userId: string, w: WishlistInput, id?: string): Wishlist {
  const nb = lookupNeighborhood(w.neighborhood);
  const wid = id ?? newId();
  getDb().prepare(`INSERT INTO wishlists (id,user_id,raw_text,categories,keywords,max_price_cents,max_distance_km,neighborhood,lat,lng,active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(wid, userId, w.rawText, JSON.stringify(w.categories), JSON.stringify(w.keywords), w.maxPriceCents, w.maxDistanceKm, w.neighborhood ?? null, nb?.lat ?? null, nb?.lng ?? null, w.active === false ? 0 : 1, nowIso());
  return getWishlist(wid)!;
}
export function updateWishlist(id: string, w: Partial<WishlistInput>): Wishlist | null {
  const cur = getWishlist(id);
  if (!cur) return null;
  const m = { ...cur, ...w };
  const nb = lookupNeighborhood(m.neighborhood);
  getDb().prepare(`UPDATE wishlists SET raw_text=?,categories=?,keywords=?,max_price_cents=?,max_distance_km=?,neighborhood=?,lat=?,lng=?,active=? WHERE id=?`)
    .run(m.rawText, JSON.stringify(m.categories), JSON.stringify(m.keywords), m.maxPriceCents, m.maxDistanceKm, m.neighborhood ?? null, nb?.lat ?? null, nb?.lng ?? null, m.active ? 1 : 0, id);
  return getWishlist(id);
}
export const deleteWishlist = (id: string) => { getDb().prepare("DELETE FROM wishlists WHERE id=?").run(id); };

// ---------- matches ----------
export function upsertMatch(listingId: string, wishlistId: string, score: number, reasons: string[]): { created: boolean } {
  const db = getDb();
  const ex = db.prepare("SELECT id FROM matches WHERE listing_id=? AND wishlist_id=?").get(listingId, wishlistId);
  if (ex) { db.prepare("UPDATE matches SET score=?, reasons=? WHERE id=?").run(score, JSON.stringify(reasons), (ex as Row).id); return { created: false }; }
  db.prepare("INSERT INTO matches (id,listing_id,wishlist_id,score,reasons,status,created_at) VALUES (?,?,?,?,?,'new',?)").run(newId(), listingId, wishlistId, score, JSON.stringify(reasons), nowIso());
  return { created: true };
}
export function matchesForUser(userId: string): MatchRow[] {
  const rows = getDb().prepare(`SELECT m.*, w.raw_text AS wishlist_text FROM matches m JOIN wishlists w ON w.id=m.wishlist_id
    WHERE w.user_id=? AND m.status!='dismissed' ORDER BY m.created_at DESC, m.score DESC`).all(userId);
  return rows.flatMap((r: Row) => {
    const listing = getListing(r.listing_id);
    return listing ? [{ id: r.id, listingId: r.listing_id, wishlistId: r.wishlist_id, score: r.score, reasons: JSON.parse(r.reasons), status: r.status, createdAt: r.created_at, listing, wishlistText: r.wishlist_text }] : [];
  });
}
export const matchOwner = (matchId: string): string | null => {
  const r = getDb().prepare("SELECT w.user_id u FROM matches m JOIN wishlists w ON w.id=m.wishlist_id WHERE m.id=?").get(matchId) as Row;
  return r?.u ?? null;
};
export const setMatchStatus = (id: string, status: "seen" | "dismissed") => { getDb().prepare("UPDATE matches SET status=? WHERE id=?").run(status, id); };
export const matchForListingAndUser = (listingId: string, userId: string) => getDb().prepare(
  "SELECT m.id FROM matches m JOIN wishlists w ON w.id=m.wishlist_id WHERE m.listing_id=? AND w.user_id=? AND m.status!='dismissed'").get(listingId, userId) as { id: string } | undefined;
export const countMatchesForListing = (listingId: string) => (getDb().prepare("SELECT COUNT(*) c FROM matches WHERE listing_id=?").get(listingId) as Row).c as number;
export const markMatchesSeenForListing = (listingId: string, userId: string) => {
  getDb().prepare("UPDATE matches SET status='seen' WHERE status='new' AND listing_id=? AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id=?)").run(listingId, userId);
};

// ---------- notifications ----------
export function notify(userId: string, type: string, title: string, body: string, href: string) {
  getDb().prepare("INSERT INTO notifications (id,user_id,type,title,body,href,read_at,created_at) VALUES (?,?,?,?,?,?,NULL,?)").run(newId(), userId, type, title, body, href, nowIso());
}
const toNotif = (r: Row): Notification => ({ id: r.id, userId: r.user_id, type: r.type, title: r.title, body: r.body, href: r.href, readAt: r.read_at, createdAt: r.created_at });
export const listNotifications = (userId: string, limit = 30): Notification[] => getDb().prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT ?").all(userId, limit).map(toNotif);
export const unreadCount = (userId: string): number => (getDb().prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL").get(userId) as Row).c;
export const markNotificationsRead = (userId: string, id?: string) => {
  if (id) getDb().prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND id=? AND read_at IS NULL").run(nowIso(), userId, id);
  else getDb().prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").run(nowIso(), userId);
};

// ---------- rooms ----------
const toRoom = (r: Row): Room => ({ id: r.id, userId: r.user_id, name: r.name, lengthM: r.length_m, widthM: r.width_m, heightM: r.height_m, displayUnit: r.display_unit, createdAt: r.created_at, updatedAt: r.updated_at });
export const listRooms = (userId: string): Room[] => getDb().prepare("SELECT * FROM rooms WHERE user_id=? ORDER BY created_at").all(userId).map(toRoom);
export const getRoom = (id: string): Room | null => { const r = getDb().prepare("SELECT * FROM rooms WHERE id=?").get(id); return r ? toRoom(r) : null; };
export function createRoom(userId: string, r: { name: string; lengthM: number; widthM: number; heightM: number; displayUnit: "ft" | "m" }, id?: string): Room {
  const rid = id ?? newId(); const t = nowIso();
  getDb().prepare("INSERT INTO rooms (id,user_id,name,length_m,width_m,height_m,display_unit,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(rid, userId, r.name, r.lengthM, r.widthM, r.heightM, r.displayUnit, t, t);
  return getRoom(rid)!;
}
export function updateRoom(id: string, r: Partial<{ name: string; lengthM: number; widthM: number; heightM: number; displayUnit: "ft" | "m" }>) {
  const c = getRoom(id); if (!c) return null; const m = { ...c, ...r };
  getDb().prepare("UPDATE rooms SET name=?,length_m=?,width_m=?,height_m=?,display_unit=?,updated_at=? WHERE id=?").run(m.name, m.lengthM, m.widthM, m.heightM, m.displayUnit, nowIso(), id);
  return getRoom(id);
}
export const deleteRoom = (id: string) => { getDb().prepare("DELETE FROM rooms WHERE id=?").run(id); };
const toPlacement = (r: Row): Placement => ({ id: r.id, roomId: r.room_id, listingId: r.listing_id, label: r.label, category: r.category, x: r.x, z: r.z, rotationY: r.rotation_y, widthM: r.width_m, depthM: r.depth_m, heightM: r.height_m, dimensionsConfirmed: bool(r.dimensions_confirmed) });
export const listPlacements = (roomId: string): Placement[] => getDb().prepare("SELECT * FROM room_placements WHERE room_id=? ORDER BY rowid").all(roomId).map(toPlacement);
export function replacePlacements(roomId: string, ps: Omit<Placement, "roomId">[]) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("DELETE FROM room_placements WHERE room_id=?").run(roomId);
    const ins = db.prepare("INSERT INTO room_placements (id,room_id,listing_id,label,category,x,z,rotation_y,width_m,depth_m,height_m,dimensions_confirmed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    for (const p of ps) ins.run(p.id, roomId, p.listingId, p.label, p.category, p.x, p.z, p.rotationY, p.widthM, p.depthM, p.heightM, p.dimensionsConfirmed ? 1 : 0);
    db.prepare("UPDATE rooms SET updated_at=? WHERE id=?").run(nowIso(), roomId);
  })();
}
/** When a giver adds real dimensions, confirm every placement of that listing. */
export function confirmPlacementsForListing(listingId: string, w: number, d: number, h: number) {
  getDb().prepare("UPDATE room_placements SET width_m=?, depth_m=?, height_m=?, dimensions_confirmed=1 WHERE listing_id=?").run(w, d, h, listingId);
}

// ---------- pickups ----------
const PICKUP_SELECT = `SELECT p.*, l.title AS listing_title, l.status AS listing_status, l.giver_id AS giver_id,
  (SELECT url FROM listing_photos ph WHERE ph.listing_id=l.id ORDER BY sort_order LIMIT 1) AS photo_url,
  ru.name AS requester_name, du.name AS driver_name
  FROM pickup_requests p JOIN listings l ON l.id=p.listing_id JOIN users ru ON ru.id=p.requester_id LEFT JOIN users du ON du.id=p.driver_id`;
const toPickup = (r: Row): Pickup => ({
  id: r.id, listingId: r.listing_id, listingTitle: r.listing_title, listingPhotoUrl: r.photo_url, listingStatus: r.listing_status, requesterId: r.requester_id,
  requesterName: r.requester_name, driverId: r.driver_id, driverName: r.driver_name, status: r.status, fromNeighborhood: r.from_neighborhood,
  toNeighborhood: r.to_neighborhood, preferredWindow: r.preferred_window, note: r.note, driverNote: r.driver_note, createdAt: r.created_at, giverId: r.giver_id,
});
export const getPickup = (id: string): Pickup | null => { const r = getDb().prepare(`${PICKUP_SELECT} WHERE p.id=?`).get(id); return r ? toPickup(r) : null; };
export const listOpenPickups = (): Pickup[] => getDb().prepare(`${PICKUP_SELECT} WHERE p.status IN ('open','offered') ORDER BY p.created_at DESC`).all().map(toPickup);
export const listMyPickups = (userId: string): Pickup[] => getDb().prepare(`${PICKUP_SELECT} WHERE p.requester_id=? OR p.driver_id=? ORDER BY p.updated_at DESC`).all(userId, userId).map(toPickup);
export const activePickupForListing = (listingId: string, requesterId: string) =>
  getDb().prepare("SELECT id FROM pickup_requests WHERE listing_id=? AND requester_id=? AND status IN ('open','offered','accepted')").get(listingId, requesterId) as { id: string } | undefined;
export function createPickup(p: { id?: string; listingId: string; requesterId: string; fromNeighborhood: string; toNeighborhood: string; preferredWindow?: string | null; note?: string | null; status?: PickupStatusT; driverId?: string | null }): Pickup {
  const id = p.id ?? newId(); const t = nowIso();
  getDb().prepare("INSERT INTO pickup_requests (id,listing_id,requester_id,driver_id,status,from_neighborhood,to_neighborhood,preferred_window,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, p.listingId, p.requesterId, p.driverId ?? null, p.status ?? "open", p.fromNeighborhood, p.toNeighborhood, p.preferredWindow ?? null, p.note ?? null, t, t);
  return getPickup(id)!;
}
/** Atomic compare-and-set so two drivers offering at once cannot both win. */
export function transitionPickupRow(id: string, fromStatus: PickupStatusT, toStatus: PickupStatusT, driverId: string | null | undefined, driverNote?: string | null): boolean {
  const r = driverId === undefined
    ? getDb().prepare("UPDATE pickup_requests SET status=?, updated_at=? WHERE id=? AND status=?").run(toStatus, nowIso(), id, fromStatus)
    : getDb().prepare("UPDATE pickup_requests SET status=?, driver_id=?, driver_note=?, updated_at=? WHERE id=? AND status=?").run(toStatus, driverId, driverId ? driverNote ?? null : null, nowIso(), id, fromStatus);
  return r.changes > 0;
}
const toDriver = (r: Row): Driver => ({ id: r.id, userId: r.user_id, neighborhood: r.neighborhood, days: JSON.parse(r.days), vehicleNote: r.vehicle_note, active: bool(r.active) });
export const getDriver = (userId: string): Driver | null => { const r = getDb().prepare("SELECT * FROM driver_availability WHERE user_id=?").get(userId); return r ? toDriver(r) : null; };
export function upsertDriver(userId: string, d: { neighborhood: string; days: string[]; vehicleNote?: string | null; active?: boolean }): Driver {
  const db = getDb();
  const ex = getDriver(userId);
  if (ex) db.prepare("UPDATE driver_availability SET neighborhood=?, days=?, vehicle_note=?, active=? WHERE user_id=?").run(d.neighborhood, JSON.stringify(d.days), d.vehicleNote ?? null, d.active === false ? 0 : 1, userId);
  else db.prepare("INSERT INTO driver_availability (id,user_id,neighborhood,days,vehicle_note,active) VALUES (?,?,?,?,?,?)").run(newId(), userId, d.neighborhood, JSON.stringify(d.days), d.vehicleNote ?? null, d.active === false ? 0 : 1);
  return getDriver(userId)!;
}
export const driversInNeighborhood = (nb: string): Driver[] => getDb().prepare("SELECT * FROM driver_availability WHERE active=1 AND neighborhood=?").all(nb).map(toDriver);

export const newMatchCount = (userId: string): number => (getDb().prepare(
  "SELECT COUNT(*) c FROM matches m JOIN wishlists w ON w.id=m.wishlist_id JOIN listings l ON l.id=m.listing_id WHERE w.user_id=? AND m.status='new' AND l.status='available'").get(userId) as Row).c;
