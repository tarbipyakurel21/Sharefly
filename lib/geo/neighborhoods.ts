export type Neighborhood = { name: string; lat: number; lng: number };

/**
 * Approximate neighborhood centres in Los Angeles, CA (listed first, the demo city) and Houston, TX: the two metros covered by the
 * Matterport scans in the reference-space dataset. Coarse on purpose; never a street address.
 */
export const NEIGHBORHOODS: Neighborhood[] = [
  // Los Angeles
  { name: "Downtown Los Angeles", lat: 34.0407, lng: -118.2468 },
  { name: "Koreatown", lat: 34.0578, lng: -118.3010 },
  { name: "Hollywood", lat: 34.0928, lng: -118.3287 },
  { name: "West Hollywood", lat: 34.0900, lng: -118.3617 },
  { name: "Westwood / UCLA", lat: 34.0689, lng: -118.4452 },
  { name: "Santa Monica", lat: 34.0195, lng: -118.4912 },
  { name: "USC / Exposition Park", lat: 34.0224, lng: -118.2851 },
  { name: "Silver Lake", lat: 34.0869, lng: -118.2702 },
  { name: "Echo Park", lat: 34.0782, lng: -118.2606 },
  { name: "Culver City", lat: 34.0211, lng: -118.3965 },
  { name: "Pasadena", lat: 34.1478, lng: -118.1445 },
  // Houston
  { name: "Downtown Houston", lat: 29.7604, lng: -95.3698 },
  { name: "Midtown Houston", lat: 29.7413, lng: -95.3800 },
  { name: "Montrose", lat: 29.7459, lng: -95.3913 },
  { name: "Museum District", lat: 29.7228, lng: -95.3893 },
  { name: "Rice University / Rice Village", lat: 29.7174, lng: -95.4018 },
  { name: "University of Houston", lat: 29.7199, lng: -95.3422 },
  { name: "Texas Medical Center", lat: 29.7075, lng: -95.4010 },
  { name: "Heights", lat: 29.7988, lng: -95.3980 },
  { name: "Galleria / Uptown", lat: 29.7387, lng: -95.4613 },
  { name: "Energy Corridor", lat: 29.7840, lng: -95.6390 },
  { name: "Katy", lat: 29.7858, lng: -95.8245 },
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
