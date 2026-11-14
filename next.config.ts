import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};
export default config;
