import type { ReferenceSpace, SearchFilters } from "./types";

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rule: a max-rent filter only keeps spaces whose lowest rent is known and within budget. Unknown rent is never assumed cheap. */
export function matchesFilters(s: ReferenceSpace, f: Partial<SearchFilters>): boolean {
  if (f.city && s.city.toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.beds != null && (f.beds >= 4 ? (s.beds ?? -1) < 4 : s.beds !== f.beds)) return false;
  if (f.maxRent != null && (s.minRentUsd == null || s.minRentUsd > f.maxRent)) return false;
  if (f.lifestyle && s.lifestyle !== f.lifestyle) return false;
  if (f.nearCollege === "true" && s.colleges.length === 0) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [s.communityName, s.floorPlanName, s.city, ...s.colleges.map((c) => c.name)].filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.lat != null && f.lng != null && haversineKm({ lat: f.lat, lng: f.lng }, s) > (f.radiusKm ?? 10)) return false;
  return true;
}

export function searchSpaces(all: ReferenceSpace[], f: Partial<SearchFilters>): { spaces: ReferenceSpace[]; total: number } {
  const hits = all.filter((s) => matchesFilters(s, f));
  const near = f.lat != null && f.lng != null ? { lat: f.lat, lng: f.lng } : null;
  hits.sort((a, b) => (near ? haversineKm(near, a) - haversineKm(near, b) : 0) || (a.communityName ?? "~").localeCompare(b.communityName ?? "~") || (a.beds ?? 99) - (b.beds ?? 99));
  return { spaces: hits.slice(0, f.limit ?? 24), total: hits.length };
}
