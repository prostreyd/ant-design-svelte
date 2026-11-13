import { defineConfig, devices } from '@playwright/test';

// The tests run against the built site (npm run build), served like GitHub Pages serves it.
// Build and test with the same BASE_PATH to check the site under its real base path, for example
//   BASE_PATH=/ant-design-svelte npm run build && BASE_PATH=/ant-design-svelte npm run test:e2e
const base = process.env.BASE_PATH ?? '';
// DOCS_PORT: a run of its own, next to another one.
const port = Number(process.env.DOCS_PORT ?? 4175);
const url = `http://localhost:${port}${base}/`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: url, trace: 'retain-on-failure' },
  // Every test runs in all three engines.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node scripts/serve-build.mjs',
    url,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port), BASE_PATH: base }
  }
});
