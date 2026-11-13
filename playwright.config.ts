import { defineConfig, devices } from '@playwright/test';

// E2E_PORT: a run of its own, next to another one (a second working copy, the library and the site together).
const port = Number(process.env.E2E_PORT ?? 4174);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure'
  },
  // Every test runs in all three engines. A file named `*.chromium.spec.ts` is for something only Chromium can do
  // (the Chrome DevTools Protocol) and is left out of the other two.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: '**/*.chromium.spec.ts' },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: '**/*.chromium.spec.ts' }
  ],
  webServer: {
    command: 'npx vite --config vite.e2e.config.ts',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI
  }
});
