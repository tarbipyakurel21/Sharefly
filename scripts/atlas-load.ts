/**
 * Loads data/reference-spaces.json (from `npm run import:costar`) into ONE Atlas collection.
 * Stores only the fields the picker needs (see lib/reference-spaces/atlas-doc.ts). Safe to re-run: it upserts by id.
 * Undo after the hackathon with `npm run atlas:drop -- --yes`.
 */
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { atlasConfig } from "./atlas-env";
import { toAtlasDoc, type AtlasDoc } from "../lib/reference-spaces/atlas-doc";
import { ReferenceSpaceSchema, type ReferenceSpace } from "../lib/reference-spaces/types";

async function main() {
  const { uri, db, collection } = atlasConfig();
  const file = path.resolve(process.env.REFERENCE_SPACES_PATH ?? "data/reference-spaces.json");
  if (!fs.existsSync(file)) { console.error(`Missing ${file}. Run npm run import:costar first.`); process.exit(1); }
  const spaces: ReferenceSpace[] = [];
  for (const r of JSON.parse(fs.readFileSync(file, "utf8")).spaces as unknown[]) { const p = ReferenceSpaceSchema.safeParse(r); if (p.success) spaces.push(p.data); }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, appName: "sharefly" });
  try {
    const col = client.db(db).collection<AtlasDoc>(collection);
    for (let i = 0; i < spaces.length; i += 1000) {
      const docs = spaces.slice(i, i + 1000).map(toAtlasDoc);
      await col.bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })), { ordered: false });
    }
    await col.createIndexes([
      { key: { city: 1, beds: 1 }, name: "city_beds" },
      { key: { loc: "2dsphere" }, name: "loc_2dsphere", sparse: true },
      { key: { communityName: 1, beds: 1 }, name: "community_beds" },
    ]);
    console.log(`Upserted ${spaces.length} reference spaces into ${db}.${collection} (${await col.estimatedDocumentCount()} total).`);
    console.log("After the hackathon: npm run atlas:drop -- --yes");
  } finally { await client.close(); }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
