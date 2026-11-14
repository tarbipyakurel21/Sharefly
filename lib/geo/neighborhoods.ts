export type Neighborhood = { name: string; lat: number; lng: number };

/** Approximate neighborhood centres around Princeton, NJ. Coarse on purpose; never a street address. */
export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Princeton University Campus", lat: 40.3431, lng: -74.6551 },
  { name: "Downtown Princeton", lat: 40.3573, lng: -74.6672 },
  { name: "Witherspoon-Jackson", lat: 40.3512, lng: -74.6690 },
  { name: "Princeton Junction", lat: 40.3156, lng: -74.6234 },
  { name: "West Windsor", lat: 40.2987, lng: -74.6293 },
  { name: "Plainsboro", lat: 40.3340, lng: -74.5857 },
  { name: "Lawrenceville", lat: 40.2976, lng: -74.7288 },
  { name: "Rocky Hill", lat: 40.4001, lng: -74.6355 },
  { name: "Hopewell", lat: 40.3896, lng: -74.7627 },
  { name: "Kingston", lat: 40.3770, lng: -74.6130 },
];

const norm = (s: string) => s.trim().toLowerCase();

export function lookupNeighborhood(name?: string | null): Neighborhood | null {
  if (!name) return null;
  const n = norm(name);
  return NEIGHBORHOODS.find((x) => norm(x.name) === n) ?? NEIGHBORHOODS.find((x) => norm(x.name).includes(n) || n.includes(norm(x.name))) ?? null;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const kmToMiles = (km: number) => km * 0.621371;
export const milesToKm = (mi: number) => mi / 0.621371;
