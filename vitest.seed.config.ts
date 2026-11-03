// Integrationstests des Seeds gegen die lokale Datenbank (Plan 10, [SQL]-AK über Vitest statt pgTAP).
// Eigener Bericht reports/vitest-seed.json, damit das Zusammenführen der Artefakte reports/vitest.json nicht überschreibt.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/seed/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: ['default', 'json'],
    outputFile: { json: 'reports/vitest-seed.json' },
  },
});
