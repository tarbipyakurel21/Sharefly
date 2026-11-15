import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npm run db:seed -- --reset && next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { AI_PROVIDER: "mock", DEMO_MODE: "true", DATABASE_PATH: "data/e2e.db", SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret", REFERENCE_SPACES_PROVIDER: "costar", REFERENCE_SPACES_PATH: "tests/fixtures/reference-spaces.sample.json" },
  },
});
