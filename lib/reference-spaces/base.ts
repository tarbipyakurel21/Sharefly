import type { ReferenceSpace, SearchFilters } from "./types";

export type { ReferenceSpace } from "./types";

export type SearchResult = { spaces: ReferenceSpace[]; total: number };
export type StoreHealth = { provider: "costar" | "none"; store: "json" | "atlas" | "none"; available: boolean; count: number; note?: string };

export interface ReferenceSpaceProvider {
  isAvailable(): boolean | Promise<boolean>;
  search(filters: Partial<SearchFilters>): Promise<SearchResult>;
  get(id: string): Promise<ReferenceSpace | null>;
  health(): Promise<StoreHealth>;
}

/** Thrown when the configured store cannot be reached and there is nothing to fall back to. */
export class ReferenceSpaceUnavailable extends Error { constructor() { super("Reference spaces are unavailable."); } }

/** Default when the CoStar data is absent: nothing is offered and no related UI renders. */
export class NullReferenceSpaceProvider implements ReferenceSpaceProvider {
  isAvailable() { return false; }
  async search() { return { spaces: [], total: 0 }; }
  async get() { return null; }
  async health(): Promise<StoreHealth> { return { provider: "none", store: "none", available: false, count: 0 }; }
}
