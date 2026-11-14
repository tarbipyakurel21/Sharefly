import { CATEGORIES, type Category } from "@/lib/categories";
import { categoriesIn, keywordsIn } from "./text";
import { milesToKm } from "@/lib/geo/neighborhoods";

export type WishlistIntent = {
  categories: Category[];
  keywords: string[];
  maxPriceCents: number | null;
  maxDistanceKm: number | null;
};

export function parseWishlistText(text: string): WishlistIntent {
  const t = text.toLowerCase();
  let maxPriceCents: number | null = null;
  const price =
    t.match(/(?:under|below|less than|up to|max(?:imum)?|budget(?: of)?|for)\s*\$?\s*(\d+(?:\.\d{1,2})?)/) ||
    t.match(/\$\s?(\d+(?:\.\d{1,2})?)\s*(?:or less|max|budget)?/);
  if (price) maxPriceCents = Math.round(parseFloat(price[1]) * 100);
  else if (/\bfree\b/.test(t)) maxPriceCents = 0;

  let maxDistanceKm: number | null = null;
  const dist = t.match(/within\s*(\d+(?:\.\d+)?)\s*(miles?|mi|km|kilometers?|kilometres?)/);
  if (dist) {
    const v = parseFloat(dist[1]);
    maxDistanceKm = /^k/.test(dist[2]) ? v : Math.round(milesToKm(v) * 100) / 100;
  }

  return {
    categories: categoriesIn(text).filter((c) => CATEGORIES.includes(c)),
    keywords: keywordsIn(text).slice(0, 12),
    maxPriceCents,
    maxDistanceKm,
  };
}
