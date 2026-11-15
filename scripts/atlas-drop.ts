/**
 * Drops the Atlas collection used by ShareFly (and only that collection) so no kit data stays in the cluster.
 * Run after the hackathon:  npm run atlas:drop -- --yes
 * Without --yes it only reports what it would drop.
 */
import { MongoClient } from "mongodb";
import { atlasConfig } from "./atlas-env";

async function main() {
  const { uri, db, collection } = atlasConfig();
  const yes = process.argv.includes("--yes");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, appName: "sharefly" });
  try {
    const database = client.db(db);
    const exists = (await database.listCollections({ name: collection }, { nameOnly: true }).toArray()).length > 0;
    if (!exists) { console.log(`${db}.${collection} does not exist. Nothing to drop.`); return; }
    const n = await database.collection(collection).estimatedDocumentCount();
    if (!yes) { console.log(`Would drop ${db}.${collection} (${n} documents). Re-run with --yes to do it.`); return; }
    await database.dropCollection(collection);
    const still = (await database.listCollections({ name: collection }, { nameOnly: true }).toArray()).length > 0;
    if (still) { console.error(`Drop did not take effect for ${db}.${collection}.`); process.exit(1); }
    console.log(`Dropped ${db}.${collection} (${n} documents). Verified it no longer exists.`);
    console.log("Also remove the Atlas database user / IP access entry and rotate ATLAS_URI if you shared it.");
  } finally { await client.close(); }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
