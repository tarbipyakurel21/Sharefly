import type { NextConfig } from "next";

// E2E_DIST_DIR lets the e2e run use its own build folder so it can run beside a normal `next dev`.
const config: NextConfig = {
  ...(process.env.E2E_DIST_DIR ? { distDir: process.env.E2E_DIST_DIR } : {}),
  serverExternalPackages: ["better-sqlite3", "sharp", "mongodb"],
};
export default config;
