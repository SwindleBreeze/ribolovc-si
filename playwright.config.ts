import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
// Use a preinstalled Chromium when provided (e.g. CI images that pin a different revision).
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Upstream weather/water APIs are replaced by generated fixtures so tests run offline.
    command: `node scripts/make-fixtures.mjs .e2e-fixtures && CONDITIONS_FIXTURE_DIR=.e2e-fixtures npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
