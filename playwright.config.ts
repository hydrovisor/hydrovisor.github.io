// E2E gegen den Produktions-Build: vite build, dann vite preview (docs/spec/06_tests.md 1 und 7).
// Honor-Viewport bis zum Gerätetest: E2E mit 360 × 640 dp (CLAUDE.md, Oberfläche).
import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (!existsSync('dist/index.html')) throw new Error('dist fehlt: zuerst npm run build');

export default defineConfig({
  testDir: 'tests/e2e',
  // seriell, weil TO7 dist/sw.js für die Dauer des Tests ändert
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'reports/playwright.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    viewport: { width: 360, height: 640 },
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'npx vite preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
  },
});
