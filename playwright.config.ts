import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
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
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI
  }
});
