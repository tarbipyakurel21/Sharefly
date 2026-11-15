// Server only: holds the Atlas connection string. Never import from a "use client" file.
import { MongoClient, type Collection } from "mongodb";
import { getEnv } from "@/lib/env";
import { CURATED_SPACES } from "./curated";
import { buildAtlasFilter, fromAtlasDoc, type AtlasDoc } from "./atlas-doc";
import { searchSpaces } from "./filter";
import { ReferenceSpaceUnavailable, type ReferenceSpaceProvider, type SearchResult, type StoreHealth } from "./base";
import type { ReferenceSpace, SearchFilters } from "./types";

const g = globalThis as unknown as { __sfMongo?: MongoClient };

/** One shared client. Short timeouts so a down cluster fails fast and the JSON fallback takes over. */
export function atlasCollection(): Collection<AtlasDoc> {
  const env = getEnv();
  if (!env.ATLAS_URI) throw new Error("ATLAS_URI is not set.");
  g.__sfMongo ??= new MongoClient(env.ATLAS_URI, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000, socketTimeoutMS: 5000, appName: "sharefly" });
  return g.__sfMongo.db(env.ATLAS_DB).collection<AtlasDoc>(env.ATLAS_COLLECTION);
}

/** Reference spaces from MongoDB Atlas. Any Atlas failure falls back to the local JSON store, then to "unavailable". */
export class AtlasReferenceSpaceProvider implements ReferenceSpaceProvider {
  constructor(private fallback: ReferenceSpaceProvider, private collection: () => Collection<AtlasDoc> = atlasCollection) {}

  async isAvailable() { return true; } // configured; per-request failures fall back

  async search(f: Partial<SearchFilters>): Promise<SearchResult> {
    const curated = searchSpaces(CURATED_SPACES, f);
    try {
      const col = this.collection();
      const q = buildAtlasFilter(f);
      const limit = f.limit ?? 24;
      const [docs, total] = await Promise.all([
        col.find(q, { maxTimeMS: 4000 }).sort({ communityName: 1, beds: 1, _id: 1 }).limit(limit).toArray(),
        col.countDocuments(q, { maxTimeMS: 4000 }),
      ]);
      const spaces = docs.flatMap((d) => { const s = fromAtlasDoc(d); return s ? [s] : []; });
      return { spaces: [...curated.spaces, ...spaces].slice(0, limit), total: total + curated.total };
    } catch {
      return this.fallbackOrThrow(() => this.fallback.search(f));
    }
  }

  async get(id: string): Promise<ReferenceSpace | null> {
    const c = CURATED_SPACES.find((s) => s.id === id);
    if (c) return c;
    try { return fromAtlasDoc(await this.collection().findOne({ _id: id }, { maxTimeMS: 4000 })); }
    catch { return this.fallbackOrThrow(() => this.fallback.get(id)); }
  }

  async health(): Promise<StoreHealth> {
    try {
      const count = await this.collection().estimatedDocumentCount({ maxTimeMS: 4000 });
      return { provider: "costar", store: "atlas", available: count > 0, count };
    } catch {
      const h = await this.fallback.health();
      return { ...h, note: "Atlas is unreachable; using the local file." };
    }
  }

  private async fallbackOrThrow<T>(run: () => Promise<T>): Promise<T> {
    if (!(await this.fallback.isAvailable())) throw new ReferenceSpaceUnavailable();
    return run();
  }
}
