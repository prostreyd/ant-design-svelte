import { withGuidepup } from '@guidepup/playwright';
import { devices } from '@playwright/test';

// A real screen reader needs one worker and a browser with a window (withGuidepup sets both).
export default withGuidepup({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  // The speech of a real screen reader has a timing of its own; the examples of Guidepup retry up to five times.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  projects: [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]
});
