import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { searchSpaces } from "./filter";
import { ReferenceSpaceSchema, type ReferenceSpace, type SearchFilters } from "./types";

export type { ReferenceSpace } from "./types";

export type SearchResult = { spaces: ReferenceSpace[]; total: number };
export type StoreHealth = { provider: "costar" | "none"; store: "json" | "none"; available: boolean; count: number; note?: string };

export interface ReferenceSpaceProvider {
  isAvailable(): boolean;
  search(filters: Partial<SearchFilters>): Promise<SearchResult>;
  get(id: string): Promise<ReferenceSpace | null>;
  health(): Promise<StoreHealth>;
}

/** Default when the CoStar data is absent: nothing is offered and no related UI renders. */
export class NullReferenceSpaceProvider implements ReferenceSpaceProvider {
  isAvailable() { return false; }
  async search() { return { spaces: [], total: 0 }; }
  async get() { return null; }
  async health(): Promise<StoreHealth> { return { provider: "none", store: "none", available: false, count: 0 }; }
}

const FileSchema = z.object({ spaces: z.array(z.unknown()) });
const g = globalThis as unknown as { __sfRef?: { file: string; mtime: number; spaces: ReferenceSpace[]; byId: Map<string, ReferenceSpace> } };

function loadFile(file: string) {
  const mtime = fs.statSync(file).mtimeMs;
  if (g.__sfRef && g.__sfRef.file === file && g.__sfRef.mtime === mtime) return g.__sfRef;
  const raw = FileSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const spaces: ReferenceSpace[] = [];
  for (const r of raw.spaces) { const p = ReferenceSpaceSchema.safeParse(r); if (p.success) spaces.push(p.data); }
  g.__sfRef = { file, mtime, spaces, byId: new Map(spaces.map((s) => [s.id, s])) };
  return g.__sfRef;
}

/** Reads the compact file written by scripts/import-costar.ts. Works offline. */
export class JsonFileReferenceSpaceProvider implements ReferenceSpaceProvider {
  constructor(private file: string) {}
  private data() { try { return loadFile(this.file); } catch { return null; } }
  isAvailable() { return !!this.data()?.spaces.length; }
  async search(f: Partial<SearchFilters>) { return searchSpaces(this.data()?.spaces ?? [], f); }
  async get(id: string) { return this.data()?.byId.get(id) ?? null; }
  async health(): Promise<StoreHealth> {
    const d = this.data();
    return d ? { provider: "costar", store: "json", available: d.spaces.length > 0, count: d.spaces.length } : { provider: "costar", store: "none", available: false, count: 0, note: "Reference space file not found. Run npm run import:costar." };
  }
}

export function getReferenceSpaceProvider(): ReferenceSpaceProvider {
  const env = getEnv();
  if (env.REFERENCE_SPACES_PROVIDER !== "costar") return new NullReferenceSpaceProvider();
  const p = new JsonFileReferenceSpaceProvider(path.resolve(process.cwd(), env.REFERENCE_SPACES_PATH));
  return p.isAvailable() ? p : new NullReferenceSpaceProvider();
}
