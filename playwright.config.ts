import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  webServer: [
    { command: "node tests/e2e/matterport-stub.mjs", url: "http://localhost:4010", reuseExistingServer: false, timeout: 20_000, stdout: "ignore", gracefulShutdown: { signal: "SIGTERM", timeout: 1000 } },
    {
    command: "npm run db:seed -- --reset && next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { E2E_DIST_DIR: ".next-e2e", AI_PROVIDER: "mock", DEMO_MODE: "true", DATABASE_PATH: "data/e2e.db", SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret", REFERENCE_SPACES_PROVIDER: "costar", REFERENCE_SPACES_PATH: "tests/fixtures/reference-spaces.sample.json", MATTERPORT_API_KEY: "e2e-key", MATTERPORT_API_SECRET: "e2e-secret", MATTERPORT_API_URL: "http://localhost:4010/graph" },
    },
  ],
});
