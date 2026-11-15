import { ReferenceSpaceSchema, type ReferenceSpace, type SearchFilters } from "./types";

/**
 * What goes into MongoDB Atlas. Deliberately smaller than ReferenceSpace: only what search and the room flow read.
 * Left out on purpose: photo links and the kit's property / floor plan numbers.
 */
export type AtlasDoc = {
  _id: string;
  communityName: string | null; floorPlanName: string | null; city: string; state: string;
  beds: number | null; baths: number | null; minSqft: number | null; maxSqft: number | null;
  minRentUsd: number | null; maxRentUsd: number | null; rentBasis: ReferenceSpace["rentBasis"];
  lifestyle: ReferenceSpace["lifestyle"];
  colleges: ReferenceSpace["colleges"];
  matterport: ReferenceSpace["matterport"];
  units: ReferenceSpace["units"];
  /** GeoJSON point, [lng, lat]. Absent when the space has no coordinates. */
  loc?: { type: "Point"; coordinates: [number, number] };
};

export function toAtlasDoc(s: ReferenceSpace): AtlasDoc {
  const d: AtlasDoc = {
    _id: s.id, communityName: s.communityName, floorPlanName: s.floorPlanName, city: s.city, state: s.state,
    beds: s.beds, baths: s.baths, minSqft: s.minSqft, maxSqft: s.maxSqft, minRentUsd: s.minRentUsd, maxRentUsd: s.maxRentUsd,
    rentBasis: s.rentBasis, lifestyle: s.lifestyle, colleges: s.colleges, matterport: s.matterport, units: s.units,
  };
  if (s.lat != null && s.lng != null) d.loc = { type: "Point", coordinates: [s.lng, s.lat] };
  return d;
}

/** Validates what came back from Atlas. Returns null for a malformed document instead of throwing. */
export function fromAtlasDoc(raw: unknown): ReferenceSpace | null {
  if (!raw || typeof raw !== "object") return null;
  const { _id, loc, ...rest } = raw as AtlasDoc & { loc?: AtlasDoc["loc"] };
  const p = ReferenceSpaceSchema.safeParse({
    ...rest, id: _id, propertyId: null, floorPlanId: null, unitsAvailable: null, photoUrl: null,
    lat: loc?.coordinates?.[1] ?? null, lng: loc?.coordinates?.[0] ?? null,
  });
  return p.success ? p.data : null;
}

const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Mirrors `matchesFilters` (filter.ts) as a MongoDB query so Atlas does the filtering. */
export function buildAtlasFilter(f: Partial<SearchFilters>): Record<string, unknown> {
  const q: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];
  if (f.city) q.city = { $regex: `^${esc(f.city)}$`, $options: "i" };
  if (f.beds != null) q.beds = f.beds >= 4 ? { $gte: 4 } : f.beds;
  if (f.maxRent != null) q.minRentUsd = { $lte: f.maxRent }; // null never satisfies $lte: unknown rent is not "cheap"
  if (f.lifestyle) q.lifestyle = f.lifestyle;
  if (f.nearCollege === "true") q["colleges.0"] = { $exists: true };
  if (f.q) {
    const r = { $regex: esc(f.q), $options: "i" };
    and.push({ $or: [{ communityName: r }, { floorPlanName: r }, { city: r }, { "colleges.name": r }] });
  }
  if (f.lat != null && f.lng != null) q.loc = { $geoWithin: { $centerSphere: [[f.lng, f.lat], (f.radiusKm ?? 10) / 6371] } };
  if (and.length) q.$and = and;
  return q;
}
