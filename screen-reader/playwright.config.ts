import { withGuidepup } from '@guidepup/playwright';
import { devices } from '@playwright/test';

// A real screen reader needs one worker and a browser with a window (withGuidepup sets both).
export default withGuidepup({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  projects: [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]
});
