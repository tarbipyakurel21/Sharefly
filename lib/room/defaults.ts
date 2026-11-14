import type { Category } from "@/lib/categories";

/** Typical sizes in meters: width (x), depth (z), height (y). Used only when real dimensions are unknown. */
export const TYPICAL_SIZE: Record<Category, { w: number; d: number; h: number }> = {
  desk: { w: 1.2, d: 0.6, h: 0.75 },
  chair: { w: 0.5, d: 0.5, h: 0.9 },
  table: { w: 1.2, d: 0.7, h: 0.75 },
  sofa: { w: 1.9, d: 0.9, h: 0.85 },
  bed: { w: 1.4, d: 2.0, h: 0.5 },
  mattress: { w: 1.4, d: 2.0, h: 0.25 },
  dresser: { w: 1.0, d: 0.5, h: 0.8 },
  bookshelf: { w: 0.8, d: 0.3, h: 1.8 },
  storage: { w: 0.8, d: 0.45, h: 1.0 },
  lamp: { w: 0.3, d: 0.3, h: 1.5 },
  rug: { w: 1.6, d: 2.3, h: 0.02 },
  kitchenware: { w: 0.4, d: 0.4, h: 0.3 },
  appliance: { w: 0.5, d: 0.5, h: 0.5 },
  electronics: { w: 0.6, d: 0.3, h: 0.5 },
  decor: { w: 0.4, d: 0.2, h: 0.5 },
  clothing: { w: 0.4, d: 0.3, h: 0.1 },
  books: { w: 0.3, d: 0.2, h: 0.3 },
  other: { w: 0.6, d: 0.6, h: 0.6 },
};

export const ROOM_LIMITS = { minLW: 1, maxLW: 30, minH: 1.8, maxH: 6 };
