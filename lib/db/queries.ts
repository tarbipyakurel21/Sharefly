import type { Document } from "mongodb";
import { col, newId, nextSeq, nowIso } from "./client";
import type { Category } from "@/lib/categories";
import { RoomSourceSchema, type RoomSource } from "@/lib/reference-spaces/types";
import { lookupNeighborhood } from "@/lib/geo/neighborhoods";
import type { Listing, ListingStatus, MatchRow, Notification, Pickup, PickupStatusT, Placement, Room, User, Wishlist, Driver } from "./types";

// Every document uses the string id as `_id`; the rest of the fields use the same camelCase names as the domain types.
type Doc = Document;
const out = <T>(d: Doc): T => { const { _id, ...rest } = d; return { id: _id, ...rest } as T; };
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isDup = (e: unknown) => (e as { code?: number })?.code === 11000;

// ---------- users ----------
const toUser = (d: Doc): User => ({ id: d._id as unknown as string, name: d.name, email: d.email, neighborhood: d.neighborhood ?? null });
export async function getUser(id: string): Promise<User | null> {
  const d = await (await col("users")).findOne({ _id: id as never });
  return d ? toUser(d) : null;
}
export async function listUsers(): Promise<User[]> {
  return (await (await col("users")).find().sort({ name: 1 }).toArray()).map(toUser);
}
export async function upsertUserByEmail(name: string, email: string, neighborhood?: string | null, id?: string): Promise<User> {
  const users = await col("users");
  const em = email.toLowerCase();
  const existing = await users.findOne({ email: em });
  if (existing) return toUser(existing);
  const uid = id ?? newId();
  try {
    await users.insertOne({ _id: uid as never, name, email: em, neighborhood: neighborhood ?? null, createdAt: nowIso() });
  } catch (e) {
    if (!isDup(e)) throw e;
    const again = await users.findOne({ email: em });
    if (again) return toUser(again);
    throw e;
  }
  return (await getUser(uid))!;
}
export const firstName = (n: string) => n.trim().split(/\s+/)[0];

// ---------- listings ----------
async function hydrateListings(docs: Doc[]): Promise<Listing[]> {
  const ids = [...new Set(docs.map((d) => d.giverId as string))];
  const users = ids.length ? await (await col("users")).find({ _id: { $in: ids as never[] } }).toArray() : [];
  const names = new Map(users.map((u) => [u._id as unknown as string, u.name as string]));
  return docs.flatMap((d) => {
    const giverName = names.get(d.giverId);
    if (giverName === undefined) return [];
    const { clientKey: _ck, ...rest } = out<Listing & { clientKey?: string | null }>(d);
    return [{ ...rest, giverName, photoUrl: d.photoUrl ?? null } as Listing];
  });
}
export async function getListing(id: string): Promise<Listing | null> {
  const d = await (await col("listings")).findOne({ _id: id as never });
  return d ? (await hydrateListings([d]))[0] ?? null : null;
}
export async function getListingByClientKey(key: string): Promise<Listing | null> {
  const d = await (await col("listings")).findOne({ clientKey: key });
  return d ? (await hydrateListings([d]))[0] ?? null : null;
}

export type NewListing = {
  id?: string; giverId: string; title: string; description?: string; category: Category; priceCents?: number;
  conditionNote?: string | null; purchasedFrom?: string | null; neighborhood?: string | null;
  widthM?: number | null; depthM?: number | null; heightM?: number | null; aiGenerated?: boolean; clientKey?: string | null;
  photo?: { url: string; width?: number | null; height?: number | null } | null; model?: { url: string; format: "glb" | "usdz" } | null; publishedAt?: string; createdAt?: string;
};
export async function createListing(n: NewListing): Promise<Listing> {
  const id = n.id ?? newId();
  const nb = lookupNeighborhood(n.neighborhood);
  const hasDims = n.widthM != null && n.depthM != null && n.heightM != null;
  const now = n.publishedAt ?? nowIso();
  await (await col("listings")).insertOne({
    _id: id as never, giverId: n.giverId, title: n.title, description: n.description ?? "", category: n.category, status: "available",
    priceCents: 0, // everything on ShareFly is free conditionNote: n.conditionNote ?? null, purchasedFrom: n.purchasedFrom ?? null,
    neighborhood: n.neighborhood ?? null, lat: nb?.lat ?? null, lng: nb?.lng ?? null,
    widthM: hasDims ? n.widthM : null, depthM: hasDims ? n.depthM : null, heightM: hasDims ? n.heightM : null,
    dimensionsSource: hasDims ? "giver_provided" : "unknown", aiGenerated: !!n.aiGenerated, clientKey: n.clientKey ?? null,
    createdAt: n.createdAt ?? now, publishedAt: now,
    model: n.model ?? null, photoUrl: n.photo?.url ?? null, photoWidth: n.photo?.width ?? null, photoHeight: n.photo?.height ?? null,
  });
  return (await getListing(id))!;
}

export type ListingFilters = { q?: string; category?: string; neighborhood?: string; freeOnly?: boolean; giverId?: string; status?: string; limit?: number };
export async function listListings(f: ListingFilters = {}): Promise<Listing[]> {
  const and: Doc[] = [{ status: f.status ?? "available" }];
  if (f.category) and.push({ category: f.category });
  if (f.neighborhood) and.push({ neighborhood: f.neighborhood });
  if (f.freeOnly) and.push({ priceCents: 0 });
  if (f.giverId) and.push({ giverId: f.giverId });
  if (f.q) {
    for (const w of f.q.toLowerCase().split(/\s+/).filter(Boolean)) {
      const re = new RegExp(escapeRe(w), "i");
      and.push({ $or: [{ title: re }, { description: re }, { category: re }] });
    }
  }
  const docs = await (await col("listings")).find({ $and: and }).sort({ publishedAt: -1 }).limit(f.limit ?? 60).toArray();
  return hydrateListings(docs);
}
export const allAvailableListings = () => listListings({ limit: 1000 });

export async function updateListing(id: string, patch: Partial<{ title: string; description: string; category: Category; priceCents: number; conditionNote: string | null;
  purchasedFrom: string | null; neighborhood: string | null; widthM: number | null; depthM: number | null; heightM: number | null; extraMeasurements: { label: string; valueM: number }[]; status: ListingStatus }>) {
  const set: Doc = {};
  for (const k of ["title", "description", "category", "conditionNote", "purchasedFrom", "status"] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  if (patch.neighborhood !== undefined) {
    const nb = lookupNeighborhood(patch.neighborhood);
    set.neighborhood = patch.neighborhood; set.lat = nb?.lat ?? null; set.lng = nb?.lng ?? null;
  }
  if (patch.widthM !== undefined || patch.depthM !== undefined || patch.heightM !== undefined) {
    const has = patch.widthM != null && patch.depthM != null && patch.heightM != null;
    set.widthM = has ? patch.widthM : null; set.depthM = has ? patch.depthM : null; set.heightM = has ? patch.heightM : null;
    set.dimensionsSource = has ? "giver_provided" : "unknown";
  }
  if (patch.extraMeasurements !== undefined) set.extraMeasurements = patch.extraMeasurements;
  if (Object.keys(set).length) await (await col("listings")).updateOne({ _id: id as never }, { $set: set });
  return getListing(id);
}

export async function setListingModel(id: string, model: { url: string; format: "glb" | "usdz" } | null) {
  await (await col("listings")).updateOne({ _id: id as never }, { $set: { model } });
  return getListing(id);
}

/** Names people have given their own measurements, most used first. Suggestions and hints for the screenshot reader; nothing is trained. */
export async function popularMeasurementLabels(limit = 15): Promise<string[]> {
  try {
    const rows = await (await col("listings")).aggregate([
      { $match: { "extraMeasurements.0": { $exists: true } } },
      { $unwind: "$extraMeasurements" },
      { $group: { _id: { $toLower: "$extraMeasurements.label" }, n: { $sum: 1 }, shown: { $first: "$extraMeasurements.label" } } },
      { $sort: { n: -1, _id: 1 } }, { $limit: limit },
    ]).toArray();
    return rows.map((r) => String(r.shown));
  } catch { return []; }
}

export async function addInterest(listingId: string, userId: string, message?: string | null): Promise<boolean> {
  const r = await (await col("interests")).updateOne({ listingId, userId },
    { $setOnInsert: { _id: newId() as never, listingId, userId, message: message ?? null, createdAt: nowIso() } }, { upsert: true });
  return r.upsertedCount > 0;
}
export const hasInterest = async (listingId: string, userId: string) => !!(await (await col("interests")).findOne({ listingId, userId }));

// measurement requests
export async function createMeasurementRequest(listingId: string, requesterId: string): Promise<boolean> {
  const r = await (await col("measurementRequests")).updateOne({ listingId, requesterId },
    { $setOnInsert: { _id: newId() as never, listingId, requesterId, status: "open", createdAt: nowIso() } }, { upsert: true });
  return r.upsertedCount > 0;
}
export const hasMeasurementRequest = async (listingId: string, userId: string) => !!(await (await col("measurementRequests")).findOne({ listingId, requesterId: userId }));
export async function openMeasurementRequesters(listingId: string): Promise<string[]> {
  return (await (await col("measurementRequests")).find({ listingId, status: "open" }).toArray()).map((r) => r.requesterId as string);
}
export async function answerMeasurementRequests(listingId: string) {
  await (await col("measurementRequests")).updateMany({ listingId, status: "open" }, { $set: { status: "answered" } });
}
export const countOpenMeasurementRequests = async (listingId: string) => col("measurementRequests").then((c) => c.countDocuments({ listingId, status: "open" }));

// ---------- wishlists ----------
const toWishlist = (d: Doc): Wishlist => out<Wishlist>(d);
export async function getWishlist(id: string): Promise<Wishlist | null> {
  const d = await (await col("wishlists")).findOne({ _id: id as never });
  return d ? toWishlist(d) : null;
}
export async function listWishlists(userId: string): Promise<Wishlist[]> {
  return (await (await col("wishlists")).find({ userId }).sort({ createdAt: -1 }).toArray()).map(toWishlist);
}
export async function activeWishlists(): Promise<Wishlist[]> {
  return (await (await col("wishlists")).find({ active: true }).toArray()).map(toWishlist);
}

export type WishlistInput = { rawText: string; categories: Category[]; keywords: string[]; maxPriceCents: number | null; maxDistanceKm: number | null; neighborhood?: string | null; active?: boolean };
export async function createWishlist(userId: string, w: WishlistInput, id?: string): Promise<Wishlist> {
  const nb = lookupNeighborhood(w.neighborhood);
  const wid = id ?? newId();
  await (await col("wishlists")).insertOne({
    _id: wid as never, userId, rawText: w.rawText, categories: w.categories, keywords: w.keywords, maxPriceCents: w.maxPriceCents, maxDistanceKm: w.maxDistanceKm,
    neighborhood: w.neighborhood ?? null, lat: nb?.lat ?? null, lng: nb?.lng ?? null, active: w.active !== false, createdAt: nowIso(),
  });
  return (await getWishlist(wid))!;
}
export async function updateWishlist(id: string, w: Partial<WishlistInput>): Promise<Wishlist | null> {
  const cur = await getWishlist(id);
  if (!cur) return null;
  const m = { ...cur, ...w };
  const nb = lookupNeighborhood(m.neighborhood);
  await (await col("wishlists")).updateOne({ _id: id as never }, { $set: {
    rawText: m.rawText, categories: m.categories, keywords: m.keywords, maxPriceCents: m.maxPriceCents, maxDistanceKm: m.maxDistanceKm,
    neighborhood: m.neighborhood ?? null, lat: nb?.lat ?? null, lng: nb?.lng ?? null, active: !!m.active,
  } });
  return getWishlist(id);
}
export async function deleteWishlist(id: string) {
  await (await col("wishlists")).deleteOne({ _id: id as never });
  await (await col("matches")).deleteMany({ wishlistId: id });
}

// ---------- matches ----------
export async function upsertMatch(listingId: string, wishlistId: string, score: number, reasons: string[]): Promise<{ created: boolean }> {
  const r = await (await col("matches")).updateOne({ listingId, wishlistId },
    { $set: { score, reasons }, $setOnInsert: { _id: newId() as never, listingId, wishlistId, status: "new", createdAt: nowIso() } }, { upsert: true });
  return { created: r.upsertedCount > 0 };
}
const wishlistIdsOf = async (userId: string) => (await (await col("wishlists")).find({ userId }, { projection: { _id: 1 } }).toArray()).map((w) => w._id as unknown as string);
export async function matchesForUser(userId: string): Promise<MatchRow[]> {
  const wishes = await (await col("wishlists")).find({ userId }).toArray();
  if (!wishes.length) return [];
  const text = new Map(wishes.map((w) => [w._id as unknown as string, w.rawText as string]));
  const rows = await (await col("matches")).find({ wishlistId: { $in: [...text.keys()] }, status: { $ne: "dismissed" } }).sort({ createdAt: -1, score: -1 }).toArray();
  const listings = await hydrateListings(await (await col("listings")).find({ _id: { $in: [...new Set(rows.map((r) => r.listingId as string))] as never[] } }).toArray());
  const byId = new Map(listings.map((l) => [l.id, l]));
  return rows.flatMap((r) => {
    const listing = byId.get(r.listingId);
    return listing ? [{ id: r._id as unknown as string, listingId: r.listingId, wishlistId: r.wishlistId, score: r.score, reasons: r.reasons, status: r.status, createdAt: r.createdAt, listing, wishlistText: text.get(r.wishlistId) ?? "" } as MatchRow] : [];
  });
}
export async function matchOwner(matchId: string): Promise<string | null> {
  const m = await (await col("matches")).findOne({ _id: matchId as never });
  if (!m) return null;
  const w = await (await col("wishlists")).findOne({ _id: m.wishlistId });
  return (w?.userId as string | undefined) ?? null;
}
export const setMatchStatus = async (id: string, status: "seen" | "dismissed") => { await (await col("matches")).updateOne({ _id: id as never }, { $set: { status } }); };
export async function matchForListingAndUser(listingId: string, userId: string): Promise<{ id: string } | undefined> {
  const ids = await wishlistIdsOf(userId);
  if (!ids.length) return undefined;
  const m = await (await col("matches")).findOne({ listingId, wishlistId: { $in: ids }, status: { $ne: "dismissed" } });
  return m ? { id: m._id as unknown as string } : undefined;
}
export const countMatchesForListing = async (listingId: string) => col("matches").then((c) => c.countDocuments({ listingId }));
export async function markMatchesSeenForListing(listingId: string, userId: string) {
  const ids = await wishlistIdsOf(userId);
  if (ids.length) await (await col("matches")).updateMany({ status: "new", listingId, wishlistId: { $in: ids } }, { $set: { status: "seen" } });
}
export async function newMatchCount(userId: string): Promise<number> {
  const ids = await wishlistIdsOf(userId);
  if (!ids.length) return 0;
  const rows = await (await col("matches")).find({ wishlistId: { $in: ids }, status: "new" }, { projection: { listingId: 1 } }).toArray();
  if (!rows.length) return 0;
  const avail = new Set((await (await col("listings")).find({ _id: { $in: rows.map((r) => r.listingId) }, status: "available" }, { projection: { _id: 1 } }).toArray()).map((l) => l._id as unknown as string));
  return rows.filter((r) => avail.has(r.listingId)).length;
}

// ---------- notifications ----------
export async function notify(userId: string, type: string, title: string, body: string, href: string) {
  await (await col("notifications")).insertOne({ _id: newId() as never, userId, type, title, body, href, readAt: null, createdAt: nowIso(), seq: nextSeq() });
}
const toNotif = (d: Doc): Notification => ({ id: d._id as unknown as string, userId: d.userId, type: d.type, title: d.title, body: d.body, href: d.href, readAt: d.readAt ?? null, createdAt: d.createdAt });
export async function listNotifications(userId: string, limit = 30): Promise<Notification[]> {
  return (await (await col("notifications")).find({ userId }).sort({ createdAt: -1, seq: -1 }).limit(limit).toArray()).map(toNotif);
}
export const unreadCount = async (userId: string): Promise<number> => col("notifications").then((c) => c.countDocuments({ userId, readAt: null }));
/** Deletes one of the person's notifications, or all of them when no id is given. Only their own rows are ever touched. */
export async function deleteNotifications(userId: string, id?: string) {
  await (await col("notifications")).deleteMany(id ? { userId, _id: id as never } : { userId });
}
export async function markNotificationsRead(userId: string, id?: string) {
  const c = await col("notifications");
  await c.updateMany({ userId, readAt: null, ...(id ? { _id: id as never } : {}) }, { $set: { readAt: nowIso() } });
}

// ---------- rooms (placements are embedded in the room document so a layout save is one atomic write) ----------
const parseSource = (raw: unknown): RoomSource | null => {
  if (!raw) return null;
  const p = RoomSourceSchema.safeParse(typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw);
  return p.success ? p.data : null;
};
const toRoom = (d: Doc): Room => ({ id: d._id as unknown as string, userId: d.userId, name: d.name, lengthM: d.lengthM, widthM: d.widthM, heightM: d.heightM, displayUnit: d.displayUnit, source: parseSource(d.source), createdAt: d.createdAt, updatedAt: d.updatedAt });
export async function listRooms(userId: string): Promise<Room[]> {
  return (await (await col("rooms")).find({ userId }).sort({ createdAt: 1 }).toArray()).map(toRoom);
}
export async function getRoom(id: string): Promise<Room | null> { const d = await (await col("rooms")).findOne({ _id: id as never }); return d ? toRoom(d) : null; }
export async function createRoom(userId: string, r: { name: string; lengthM: number; widthM: number; heightM: number; displayUnit: "ft" | "m"; source?: RoomSource | null }, id?: string): Promise<Room> {
  const rid = id ?? newId(); const t = nowIso();
  await (await col("rooms")).insertOne({ _id: rid as never, userId, name: r.name, lengthM: r.lengthM, widthM: r.widthM, heightM: r.heightM, displayUnit: r.displayUnit, source: r.source ?? null, placements: [], createdAt: t, updatedAt: t });
  return (await getRoom(rid))!;
}
export async function updateRoom(id: string, r: Partial<{ name: string; lengthM: number; widthM: number; heightM: number; displayUnit: "ft" | "m" }>) {
  const c = await getRoom(id); if (!c) return null; const m = { ...c, ...r };
  // A size that was measured by Matterport stops being labelled as such once it is edited.
  const edited = m.lengthM !== c.lengthM || m.widthM !== c.widthM || m.heightM !== c.heightM;
  const source = c.source && c.source.dimensions === "matterport" && edited ? { ...c.source, dimensions: "adjusted" as const } : c.source;
  await (await col("rooms")).updateOne({ _id: id as never }, { $set: { name: m.name, lengthM: m.lengthM, widthM: m.widthM, heightM: m.heightM, displayUnit: m.displayUnit, source: source ?? null, updatedAt: nowIso() } });
  return getRoom(id);
}
export const deleteRoom = async (id: string) => { await (await col("rooms")).deleteOne({ _id: id as never }); };
export async function listPlacements(roomId: string): Promise<Placement[]> {
  const d = await (await col("rooms")).findOne({ _id: roomId as never }, { projection: { placements: 1 } });
  return ((d?.placements ?? []) as Omit<Placement, "roomId">[]).map((p) => ({ ...p, roomId }));
}
export async function replacePlacements(roomId: string, ps: Omit<Placement, "roomId">[]) {
  await (await col("rooms")).updateOne({ _id: roomId as never }, { $set: { placements: ps.map(({ roomId: _r, ...p }: Omit<Placement, "roomId"> & { roomId?: string }) => ({ ...p, dimensionsConfirmed: !!p.dimensionsConfirmed })), updatedAt: nowIso() } });
}
/** When a giver adds real dimensions, confirm every placement of that listing. */
export async function confirmPlacementsForListing(listingId: string, w: number, d: number, h: number) {
  await (await col("rooms")).updateMany({ "placements.listingId": listingId },
    { $set: { "placements.$[p].widthM": w, "placements.$[p].depthM": d, "placements.$[p].heightM": h, "placements.$[p].dimensionsConfirmed": true } },
    { arrayFilters: [{ "p.listingId": listingId }] });
}

// ---------- pickups ----------
async function hydratePickups(docs: Doc[]): Promise<Pickup[]> {
  if (!docs.length) return [];
  const listings = await (await col("listings")).find({ _id: { $in: [...new Set(docs.map((d) => d.listingId))] } }).toArray();
  const uids = [...new Set(docs.flatMap((d) => [d.requesterId, d.driverId].filter(Boolean)))];
  const users = await (await col("users")).find({ _id: { $in: uids } }).toArray();
  const L = new Map(listings.map((l) => [l._id as unknown as string, l]));
  const U = new Map(users.map((u) => [u._id as unknown as string, u.name as string]));
  return docs.flatMap((d) => {
    const l = L.get(d.listingId); const rn = U.get(d.requesterId);
    if (!l || rn === undefined) return [];
    return [{
      id: d._id as unknown as string, listingId: d.listingId, listingTitle: l.title, listingPhotoUrl: l.photoUrl ?? null, listingStatus: l.status, requesterId: d.requesterId,
      requesterName: rn, driverId: d.driverId ?? null, driverName: d.driverId ? U.get(d.driverId) ?? null : null, status: d.status, fromNeighborhood: d.fromNeighborhood,
      toNeighborhood: d.toNeighborhood, preferredWindow: d.preferredWindow ?? null, note: d.note ?? null, driverNote: d.driverNote ?? null, createdAt: d.createdAt, giverId: l.giverId,
    } as Pickup];
  });
}
export async function getPickup(id: string): Promise<Pickup | null> { const d = await (await col("pickups")).findOne({ _id: id as never }); return d ? (await hydratePickups([d]))[0] ?? null : null; }
export async function listOpenPickups(): Promise<Pickup[]> { return hydratePickups(await (await col("pickups")).find({ status: { $in: ["open", "offered"] } }).sort({ createdAt: -1 }).toArray()); }
export async function listMyPickups(userId: string): Promise<Pickup[]> { return hydratePickups(await (await col("pickups")).find({ $or: [{ requesterId: userId }, { driverId: userId }] }).sort({ updatedAt: -1 }).toArray()); }
export async function activePickupForListing(listingId: string, requesterId: string): Promise<{ id: string } | undefined> {
  const d = await (await col("pickups")).findOne({ listingId, requesterId, status: { $in: ["open", "offered", "accepted"] } });
  return d ? { id: d._id as unknown as string } : undefined;
}
export async function createPickup(p: { id?: string; listingId: string; requesterId: string; fromNeighborhood: string; toNeighborhood: string; preferredWindow?: string | null; note?: string | null; status?: PickupStatusT; driverId?: string | null }): Promise<Pickup> {
  const id = p.id ?? newId(); const t = nowIso();
  await (await col("pickups")).insertOne({ _id: id as never, listingId: p.listingId, requesterId: p.requesterId, driverId: p.driverId ?? null, status: p.status ?? "open",
    fromNeighborhood: p.fromNeighborhood, toNeighborhood: p.toNeighborhood, preferredWindow: p.preferredWindow ?? null, note: p.note ?? null, driverNote: null, createdAt: t, updatedAt: t });
  return (await getPickup(id))!;
}
/** Atomic compare-and-set so two drivers offering at once cannot both win. */
export async function transitionPickupRow(id: string, fromStatus: PickupStatusT, toStatus: PickupStatusT, driverId: string | null | undefined, driverNote?: string | null): Promise<boolean> {
  const set: Doc = driverId === undefined ? { status: toStatus, updatedAt: nowIso() } : { status: toStatus, driverId, driverNote: driverId ? driverNote ?? null : null, updatedAt: nowIso() };
  const r = await (await col("pickups")).updateOne({ _id: id as never, status: fromStatus }, { $set: set });
  return r.modifiedCount > 0;
}
const toDriver = (d: Doc): Driver => ({ id: d._id as unknown as string, userId: d.userId, neighborhood: d.neighborhood, days: d.days ?? [], vehicleNote: d.vehicleNote ?? null, active: !!d.active });
export async function getDriver(userId: string): Promise<Driver | null> { const d = await (await col("drivers")).findOne({ userId }); return d ? toDriver(d) : null; }
export async function upsertDriver(userId: string, d: { neighborhood: string; days: string[]; vehicleNote?: string | null; active?: boolean }): Promise<Driver> {
  await (await col("drivers")).updateOne({ userId },
    { $set: { neighborhood: d.neighborhood, days: d.days, vehicleNote: d.vehicleNote ?? null, active: d.active !== false }, $setOnInsert: { _id: newId() as never, userId } }, { upsert: true });
  return (await getDriver(userId))!;
}
export async function driversInNeighborhood(nb: string): Promise<Driver[]> { return (await (await col("drivers")).find({ active: true, neighborhood: nb }).toArray()).map(toDriver); }

// ---------- counts used by pages ----------
export const countInterests = async (listingId: string): Promise<number> => col("interests").then((c) => c.countDocuments({ listingId }));
/** Per-wishlist count of matches whose listing is still available and that were not dismissed. */
export async function matchCountsByWishlist(wishlistIds: string[]): Promise<Record<string, number>> {
  if (!wishlistIds.length) return {};
  const rows = await (await col("matches")).find({ wishlistId: { $in: wishlistIds }, status: { $ne: "dismissed" } }, { projection: { listingId: 1, wishlistId: 1 } }).toArray();
  const avail = new Set((await (await col("listings")).find({ _id: { $in: [...new Set(rows.map((r) => r.listingId))] }, status: "available" }, { projection: { _id: 1 } }).toArray()).map((l) => l._id as unknown as string));
  const counts: Record<string, number> = {};
  for (const r of rows) if (avail.has(r.listingId)) counts[r.wishlistId] = (counts[r.wishlistId] ?? 0) + 1;
  return counts;
}
export const clearMatchesForWishlist = async (wishlistId: string) => { await (await col("matches")).deleteMany({ wishlistId }); };
