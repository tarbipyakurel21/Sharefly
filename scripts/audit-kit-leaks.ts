/**
 * Fails if anything that identifies a CoStar kit property appears in a tracked file or in git history:
 * Matterport model ids, community names, street addresses or photo links.
 * Needs the local kit (it builds the list of things to look for from it) and `npm run import:costar` output.
 * Usage: npm run audit:kit [-- --no-history]   Output is counts and file paths only, never the matched value.
 */
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";

const ROOT = process.cwd();
/** Published openly by CoStar for the hackathon, so allowed in the repo. */
const PUBLIC_IDS = new Set(["2K7G7cdukZV"]);
const kit = path.resolve(process.env.COSTAR_KIT_DIR ?? "costar-hackathon-kit");
const spacesFile = path.resolve(process.env.REFERENCE_SPACES_PATH ?? "data/reference-spaces.json");
if (!fs.existsSync(kit) || !fs.existsSync(spacesFile)) { console.log("Kit or data/reference-spaces.json not found: nothing to audit against. Skipped."); process.exit(0); }

const ids = new Set<string>(), names = new Set<string>(), photos = new Set<string>(), addrs = new Set<string>();
for (const s of JSON.parse(fs.readFileSync(spacesFile, "utf8")).spaces as { matterport: Record<string, string[]>; communityName: string | null; photoUrl: string | null }[]) {
  for (const k of ["unit", "floorPlan", "community"]) for (const i of s.matterport[k]) ids.add(i);
  if (s.communityName && s.communityName.length >= 10) names.add(s.communityName);
  if (s.photoUrl) photos.add(s.photoUrl);
}
for (const f of ["commercial-properties.csv", "residential-listings.csv"]) {
  const file = path.join(kit, f); if (!fs.existsSync(file)) continue;
  const [head, ...rows] = fs.readFileSync(file, "utf8").split("\n"); const h = head.split(",");
  const iM = h.indexOf("MatterportModelId"), iA = h.indexOf("Address");
  for (const l of rows) { const c = l.split(","); if (iM >= 0 && c[iM]) ids.add(c[iM].trim()); if (iA >= 0 && c[iA]) { const a = c[iA].replace(/"/g, "").trim(); if (a.length >= 8) addrs.add(a); } }
}
for (const i of PUBLIC_IDS) ids.delete(i);

const findings: string[] = [];
function scan(where: string, text: string) {
  const kinds = new Set<string>();
  for (const t of new Set(text.match(/[A-Za-z0-9]{8,24}/g) ?? [])) if (ids.has(t)) kinds.add("model-id");
  for (const [kind, set] of [["photo-url", photos], ["address", addrs], ["community-name", names]] as const) for (const v of set) if (text.includes(v)) { kinds.add(kind); break; }
  if (kinds.size) findings.push(`${where}: ${[...kinds].join(", ")}`);
}
const git = (args: string) => cp.execSync(`git ${args}`, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const tracked = git("ls-files").split("\n").filter(Boolean);
for (const f of tracked) { if (f.startsWith("legacy/")) continue; try { scan(`working tree ${f}`, fs.readFileSync(path.join(ROOT, f), "utf8")); } catch { /* deleted or binary */ } }
const seen = new Set<string>();
for (const rev of process.argv.includes("--no-history") ? [] : git("rev-list --all").split("\n").filter(Boolean)) {
  for (const line of git(`ls-tree -r ${rev}`).split("\n").filter(Boolean)) {
    const [meta, file] = line.split("\t"); const sha = meta.split(" ")[2];
    if (seen.has(sha) || file.startsWith("legacy/")) continue; seen.add(sha);
    try { scan(`history ${rev.slice(0, 7)} ${file}`, git(`cat-file -p ${sha}`)); } catch { /* binary */ }
  }
}
console.log(`Checked ${tracked.length} tracked files and ${seen.size} historical blobs against ${ids.size} model ids, ${names.size} names, ${addrs.size} addresses, ${photos.size} photo links.`);
if (findings.length) { console.error(`LEAKS FOUND (${findings.length}):\n${findings.join("\n")}`); process.exit(1); }
console.log("Clean.");
