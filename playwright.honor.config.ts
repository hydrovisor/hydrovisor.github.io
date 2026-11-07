// Honor-Simulation am PC (Issue #120, T-01): Abläufe sichtbar im Bildschirm des Honor Magic5 Pro vorführen und die
// Bedienregeln prüfen. Nicht Teil des Prüftors. Gleicher Produktions-Build wie die E2E (vite build + vite preview),
// Daten aus den E2E-Fixtures (REST nachgebildet, ohne Datenbank). Aufruf: npm run sim:honor
// Umgebung: SIM_SCHNELL=1 ohne Fenster und ohne Pausen (zum Prüfen); SIM_TEMPO=<ms> Pause je Schritt (Vorgabe 900).
import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (!existsSync('dist/index.html')) throw new Error('dist fehlt: zuerst npm run build');

const schnell = process.env['SIM_SCHNELL'] === '1';

export default defineConfig({
  testDir: 'tests/honor',
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 4 * 60_000,
  outputDir: 'reports/honor/ergebnisse',
  reporter: [['list'], ['html', { outputFolder: 'reports/honor/bericht', open: 'never' }]],
  use: {
    // Honor Magic5 Pro in Chrome (A): 360 × 780 dp wie CLAUDE.md «Oberfläche», Pixeldichte 3.5, Touch, Android-Kennung
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 3.5,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; PGT-N19) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    browserName: 'chromium',
    headless: schnell,
    baseURL: 'http://localhost:4173',
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    serviceWorkers: 'block',
    video: schnell ? 'off' : { mode: 'on', size: { width: 360, height: 780 } },
    screenshot: 'off',
    trace: 'off',
    actionTimeout: 15_000,
  },
  projects: [{ name: 'honor' }],
  webServer: {
    command: 'npx vite preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
