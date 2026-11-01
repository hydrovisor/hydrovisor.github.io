// Vite-Erweiterungen des Grundgerüsts: Version und Commit (version.json) und die App-Icons aus dem Design System.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { appVersion, commitBestimmen } from '../src/version.ts';

const WURZEL = resolve(import.meta.dirname, '..');
const ICON_ORDNER = resolve(WURZEL, 'design-system/assets/App-Icons');

/** Ausgeliefert unter /icons/<datei>; Quelle bleibt design-system/ (Konzept 10) */
export const ICONS = [
  'app-icon-192.png',
  'app-icon-512.png',
  'app-icon-maskable-512.png',
  'favicon.svg',
  'favicon-32.png',
] as const;

function gitHead(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { cwd: WURZEL, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return undefined;
  }
}

/** Setzt __APP_VERSION__ und __APP_COMMIT__ und schreibt dist/version.json mit { version, commit } */
export function buildInfo(): Plugin {
  const paket = JSON.parse(readFileSync(resolve(WURZEL, 'package.json'), 'utf8')) as { version: string };
  const commit = commitBestimmen({
    viteCommit: process.env['VITE_COMMIT'],
    cfPagesCommit: process.env['CF_PAGES_COMMIT_SHA'],
    gitHead: gitHead(),
  });
  const version = appVersion(paket.version, commit);
  return {
    name: 'hydrovisor-build-info',
    config: () => ({
      define: { __APP_VERSION__: JSON.stringify(version), __APP_COMMIT__: JSON.stringify(commit) },
    }),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version, commit }) + '\n',
      });
    },
  };
}

/** Liefert die App-Icons aus design-system/assets/App-Icons unter /icons/ aus, im Build und in der Entwicklung */
export function designSystemIcons(): Plugin {
  return {
    name: 'hydrovisor-design-system-icons',
    generateBundle() {
      for (const datei of ICONS) {
        this.emitFile({
          type: 'asset',
          fileName: `icons/${datei}`,
          source: readFileSync(resolve(ICON_ORDNER, datei)),
        });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, weiter) => {
        const datei = ICONS.find((d) => req.url === `/icons/${d}`);
        if (!datei) return weiter();
        res.setHeader('Content-Type', datei.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
        res.end(readFileSync(resolve(ICON_ORDNER, datei)));
      });
    },
  };
}
