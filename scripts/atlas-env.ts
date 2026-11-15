import fs from "node:fs";

/** Reads .env.local like Next does (scripts run outside Next). Values already in the environment win. */
export function loadLocalEnv() {
  for (const f of [".env.local", ".env"]) if (fs.existsSync(f)) { try { process.loadEnvFile(f); } catch { /* unreadable: ignore */ } }
}

export function atlasConfig() {
  loadLocalEnv();
  const uri = process.env.ATLAS_URI;
  if (!uri) { console.error("ATLAS_URI is not set. Put it in .env.local (never commit it)."); process.exit(1); }
  return { uri, db: process.env.ATLAS_DB || "sharefly", collection: process.env.ATLAS_COLLECTION || "reference_spaces" };
}
