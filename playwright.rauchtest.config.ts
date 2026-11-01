// Rauchtest nach dem Pages-Deploy (deploy.yml, docs/spec/04_architektur.md Abschnitt 9, docs/plaene/7.md):
// mobile Chrome-Emulation gegen BASIS_URL, version.json = ERWARTETER_COMMIT, dann erscheint Heute oder die Anmeldung.
// Von Hand gegen die Vorschau: BASIS_URL=https://<zweig>.hydrovisor-vorschau.pages.dev/ ERWARTETER_COMMIT=<sha>
import { defineConfig, devices } from '@playwright/test';

const basis = process.env['BASIS_URL'];
if (!basis) throw new Error('BASIS_URL fehlt, z. B. https://hydrovisor.github.io/');
if (!process.env['ERWARTETER_COMMIT']) throw new Error('ERWARTETER_COMMIT fehlt');
// Pages liefert nach dem Deploy bis zu 10 min aus dem Cache; der Test fragt bis zu dieser Zeit nach
const wartenS = Number(process.env['RAUCHTEST_WARTEN_S'] ?? '300');

export default defineConfig({
  testDir: 'tests/rauchtest',
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: (wartenS + 60) * 1000,
  reporter: [['list'], ['json', { outputFile: 'reports/rauchtest.json' }]],
  use: {
    ...devices['Pixel 7'],
    // Honor-Viewport bis zum Gerätetest (CLAUDE.md, Oberfläche)
    viewport: { width: 360, height: 780 },
    baseURL: basis.endsWith('/') ? basis : `${basis}/`,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'mobil-chrome' }],
});
