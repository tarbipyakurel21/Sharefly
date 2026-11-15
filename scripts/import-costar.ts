/**
 * Builds data/reference-spaces.json from the CoStar hackathon kit (local only, gitignored).
 * Usage: npm run import:costar [-- --kit costar-hackathon-kit --out data/reference-spaces.json]
 * Streams the 190 MB property file so memory stays small.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { buildReferenceSpaces, type Enums, type KitListing, type KitProperty, type SkipReason } from "../lib/reference-spaces/transform";
import type { ReferenceSpace } from "../lib/reference-spaces/types";

const arg = (name: string, dflt: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const kit = path.resolve(arg("kit", process.env.COSTAR_KIT_DIR ?? "costar-hackathon-kit"));
const out = path.resolve(arg("out", process.env.REFERENCE_SPACES_PATH ?? "data/reference-spaces.json"));

async function* lines(file: string) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const l of rl) if (l.trim()) yield l;
}

export async function runImport(kitDir: string) {
  const listingFile = path.join(kitDir, "data/apartment-listing.jsonl");
  const propertyFile = path.join(kitDir, "data/commercial-property.jsonl");
  const enumsFile = path.join(kitDir, "schemas/enums.json");
  for (const f of [listingFile, propertyFile, enumsFile]) if (!fs.existsSync(f)) throw new Error(`Missing ${f}. Pass --kit <folder> or set COSTAR_KIT_DIR.`);
  const enums = JSON.parse(fs.readFileSync(enumsFile, "utf8")) as Enums;

  const listings = new Map<number, KitListing>();
  let badLines = 0;
  for await (const l of lines(listingFile)) {
    try { const r = JSON.parse(l) as KitListing; if (typeof r.propertyId === "number") listings.set(r.propertyId, r); else badLines++; } catch { badLines++; }
  }

  const spaces: ReferenceSpace[] = [];
  const skipped = new Map<SkipReason, number>();
  const seenProps = new Set<number>();
  const bump = (r: SkipReason, n = 1) => skipped.set(r, (skipped.get(r) ?? 0) + n);
  const take = (res: ReturnType<typeof buildReferenceSpaces>) => { spaces.push(...res.spaces); for (const s of res.skipped) bump(s.reason); };

  for await (const l of lines(propertyFile)) {
    // Cheap pre-check avoids parsing the ~2/3 of records that have no listing.
    const m = /^\{"id":(\d+)/.exec(l);
    if (m && !listings.has(Number(m[1]))) continue;
    let prop: KitProperty;
    try { prop = JSON.parse(l) as KitProperty; } catch { badLines++; continue; }
    const id = m ? Number(m[1]) : prop.id;
    if (id == null || !listings.has(id)) continue;
    seenProps.add(id);
    take(buildReferenceSpaces(listings.get(id)!, prop, enums));
  }
  for (const [pid, listing] of listings) if (!seenProps.has(pid)) take(buildReferenceSpaces(listing, undefined, enums));

  spaces.sort((a, b) => a.id.localeCompare(b.id));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ source: "CoStar hackathon kit", generatedAt: new Date().toISOString(), count: spaces.length, spaces }));
  return { spaces, skipped, badLines, communities: listings.size };
}

if (process.argv[1]?.endsWith("import-costar.ts")) {
  runImport(kit).then(({ spaces, skipped, badLines, communities }) => {
    const total = [...skipped.values()].reduce((a, b) => a + b, 0);
    console.log(`Communities read: ${communities}`);
    console.log(`Reference spaces written: ${spaces.length} -> ${path.relative(process.cwd(), out)}`);
    console.log(`Skipped floor plans: ${total}${badLines ? `, unreadable lines: ${badLines}` : ""}`);
    for (const [r, n] of skipped) console.log(`  ${r}: ${n}`);
    const withTour = spaces.filter((s) => s.matterport.community.length || s.matterport.floorPlan.length || s.matterport.unit.length).length;
    console.log(`With a Matterport model id: ${withTour}; with a nearby college: ${spaces.filter((s) => s.colleges.length).length}; student lifestyle: ${spaces.filter((s) => s.lifestyle === "student").length}`);
  }).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
