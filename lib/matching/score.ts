import type { Category } from "@/lib/categories";
import { haversineKm, kmToMiles } from "@/lib/geo/neighborhoods";
import { MATCH_WEIGHTS as W, MATCH_THRESHOLD, NEAR_KM, DEFAULT_MAX_KM, RECENT_DAYS } from "./constants";
import { expandedTokens, singular } from "./text";

export type MatchListing = {
  id: string; giverId: string; title: string; description: string; category: Category;
  status: string; priceCents: number; lat: number | null; lng: number | null; publishedAt: string | null;
};
export type MatchWishlist = {
  id: string; userId: string; categories: Category[]; keywords: string[];
  maxPriceCents: number | null; maxDistanceKm: number | null; lat: number | null; lng: number | null; active: boolean;
};
export type MatchResult = { score: number; reasons: string[] };

export function evaluate(listing: MatchListing, wl: MatchWishlist, now: Date = new Date()): MatchResult | null {
  if (listing.status !== "available" || !wl.active) return null;
  if (listing.giverId === wl.userId) return null;
  if (wl.maxPriceCents !== null && listing.priceCents > wl.maxPriceCents) return null;

  let km: number | null = null;
  if (listing.lat !== null && listing.lng !== null && wl.lat !== null && wl.lng !== null) {
    km = haversineKm({ lat: listing.lat, lng: listing.lng }, { lat: wl.lat, lng: wl.lng });
    if (wl.maxDistanceKm !== null && km > wl.maxDistanceKm) return null;
  }

  const tokens = expandedTokens(`${listing.title} ${listing.description}`);
  const categoryHit = wl.categories.includes(listing.category);
  const kw = wl.keywords.map(singular);
  const hits = kw.filter((k) => tokens.has(k));
  if (!categoryHit && hits.length === 0) return null;

  const reasons: string[] = [];
  let score = 0;
  if (categoryHit) {
    score += W.category;
    reasons.push(`Matches "${listing.category}"`);
  }
  if (kw.length > 0 && hits.length > 0) {
    score += (W.keywords * hits.length) / kw.length;
    if (!categoryHit) reasons.push(`Mentions "${hits[0]}"`);
  }

  if (km === null) {
    score += W.distance / 2;
    reasons.push("Distance unknown: no neighborhood on this listing or wishlist");
  } else {
    const limit = wl.maxDistanceKm ?? DEFAULT_MAX_KM;
    const frac = km <= NEAR_KM ? 1 : Math.max(0, 1 - (km - NEAR_KM) / Math.max(limit - NEAR_KM, 0.001));
    score += W.distance * frac;
    const mi = kmToMiles(km);
    reasons.push(mi < 0.5 ? "Very close to you" : `About ${mi < 10 ? mi.toFixed(1).replace(/\.0$/, "") : Math.round(mi)} mile${Math.round(mi) === 1 ? "" : "s"} away`);
  }

  if (listing.priceCents === 0) {
    score += W.price;
    reasons.push(wl.maxPriceCents !== null ? "Free, within your budget" : "Free");
  } else if (wl.maxPriceCents !== null && wl.maxPriceCents > 0) {
    score += W.price * (1 - listing.priceCents / wl.maxPriceCents);
    reasons.push(`$${(listing.priceCents / 100).toFixed(0)}, within your budget`);
  } else {
    score += W.price / 2;
  }

  if (listing.publishedAt) {
    const ageDays = (now.getTime() - new Date(listing.publishedAt).getTime()) / 86_400_000;
    if (ageDays <= RECENT_DAYS) {
      score += W.recent;
      reasons.push("Just listed");
    }
  }

  const final = Math.round(Math.min(100, score));
  return final >= MATCH_THRESHOLD ? { score: final, reasons } : null;
}
