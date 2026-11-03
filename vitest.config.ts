// Unit-Tests (Vitest), Bericht für die AK-Abdeckung in reports/vitest.json (docs/spec/06_tests.md Abschnitt 2)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify('0.0.0+test'), __APP_COMMIT__: JSON.stringify('unbekannt') },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // tokens.css als Text für den Abgleich mit tokens.json (Plan 17); ohne include liefert ?raw bei CSS einen leeren Text
    css: { include: [/design-system\/tokens\.css/] },
    reporters: ['default', 'json'],
    outputFile: { json: 'reports/vitest.json' },
  },
});
