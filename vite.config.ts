// Vite mit React und vite-plugin-pwa im Modus «prompt» mit eigenem Service Worker (docs/spec/04_architektur.md 1, 7)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { buildInfo, designSystemIcons } from './scripts/vite-erweiterungen.ts';
import { SCOPE_PFAD, START_PFAD } from './src/adressen.ts';

export default defineConfig({
  base: SCOPE_PFAD,
  plugins: [
    react(),
    buildInfo(),
    designSystemIcons(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      injectRegister: false,
      // Precache der App-Shell; version.json bleibt ausserhalb, damit der Rauchtest den Server liest
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        id: SCOPE_PFAD,
        name: 'Hydrovisor',
        short_name: 'Hydrovisor',
        description: 'Hydroponik mit Weitsicht.',
        lang: 'de-CH',
        start_url: START_PFAD,
        scope: SCOPE_PFAD,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0F3D4C',
        background_color: '#F2F5F4',
        icons: [
          { src: 'icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/app-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  preview: { port: 4173, strictPort: true },
});
