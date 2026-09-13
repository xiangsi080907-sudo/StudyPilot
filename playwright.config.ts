import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run dev",
    env: {
      ...process.env,
      AUTH_SECRET: "playwright-test-secret-not-for-production",
      // The local dev server does not send Vercel's forwarded origin headers.
      AUTH_URL: "http://127.0.0.1:3000",
    },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
