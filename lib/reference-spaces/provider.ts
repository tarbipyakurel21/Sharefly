import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { searchSpaces } from "./filter";
import { CURATED_SPACES } from "./curated";
import { AtlasReferenceSpaceProvider } from "./atlas";
import { NullReferenceSpaceProvider, type ReferenceSpaceProvider, type StoreHealth } from "./base";
import { ReferenceSpaceSchema, type ReferenceSpace, type SearchFilters } from "./types";

export * from "./base";

const FileSchema = z.object({ spaces: z.array(z.unknown()) });
const g = globalThis as unknown as { __sfRef?: { file: string; mtime: number; spaces: ReferenceSpace[]; byId: Map<string, ReferenceSpace> } };

/** Offline demo record shown when the optional CoStar kit/API is not configured. */
class DemoReferenceSpaceProvider implements ReferenceSpaceProvider {
  isAvailable() { return true; }
  async search(f: Partial<SearchFilters>) { return searchSpaces(CURATED_SPACES, f); }
  async get(id: string) { return CURATED_SPACES.find((s) => s.id === id) ?? null; }
  async health(): Promise<StoreHealth> { return { provider: "none", store: "none", available: true, count: CURATED_SPACES.length, note: "Showing the built-in demo apartment; live reference-space data is not configured." }; }
}

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
  async search(f: Partial<SearchFilters>) { return searchSpaces([...(this.data()?.spaces ?? []), ...CURATED_SPACES], f); }
  async get(id: string) { return this.data()?.byId.get(id) ?? CURATED_SPACES.find((s) => s.id === id) ?? null; }
  async health(): Promise<StoreHealth> {
    const d = this.data();
    return d ? { provider: "costar", store: "json", available: d.spaces.length > 0, count: d.spaces.length } : { provider: "costar", store: "none", available: false, count: 0, note: "Reference space file not found. Run npm run import:costar." };
  }
}

export function getReferenceSpaceProvider(): ReferenceSpaceProvider {
  const env = getEnv();
  if (env.REFERENCE_SPACES_PROVIDER !== "costar") return new DemoReferenceSpaceProvider();
  const json = new JsonFileReferenceSpaceProvider(path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.REFERENCE_SPACES_PATH));
  const atlasUri = env.ATLAS_URI ?? env.MONGO_URI;
  if ((env.REFERENCE_SPACES_STORE === "atlas" || atlasUri) && atlasUri) {
    return new AtlasReferenceSpaceProvider(json.isAvailable() ? json : new NullReferenceSpaceProvider());
  }
  return json.isAvailable() ? json : new NullReferenceSpaceProvider();
}
