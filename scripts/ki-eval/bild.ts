// Verkleinerung der Tütenfotos wie der spätere Client (Konzept 11.3; Plan 14): Canvas in Playwright-Chromium,
// längste Kante 1568 px, JPEG 0.8; Canvas schreibt kein EXIF (GPS bleibt weg). Keine neue Abhängigkeit.
import { chromium, type Browser } from '@playwright/test';
import { BILD_KANTE_MAX } from '../../src/domain/ki/modelle.ts';

export interface Bildwandler {
  wandeln(bytes: Uint8Array): Promise<Uint8Array>;
  schliessen(): Promise<void>;
}

export async function bildwandlerStarten(): Promise<Bildwandler> {
  const browser: Browser = await chromium.launch();
  const seite = await browser.newPage();
  return {
    async wandeln(bytes) {
      const ein = Buffer.from(bytes).toString('base64');
      const aus = await seite.evaluate(
        async ({ daten, kante }) => {
          const blob = await (await fetch(`data:application/octet-stream;base64,${daten}`)).blob();
          const bild = await createImageBitmap(blob);
          const faktor = Math.min(1, kante / Math.max(bild.width, bild.height));
          const canvas = new OffscreenCanvas(
            Math.round(bild.width * faktor),
            Math.round(bild.height * faktor),
          );
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas ohne 2D-Kontext');
          ctx.drawImage(bild, 0, 0, canvas.width, canvas.height);
          const jpeg = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
          const puffer = new Uint8Array(await jpeg.arrayBuffer());
          let text = '';
          for (let i = 0; i < puffer.length; i += 0x8000)
            text += String.fromCharCode(...puffer.subarray(i, i + 0x8000));
          return btoa(text);
        },
        { daten: ein, kante: BILD_KANTE_MAX },
      );
      return new Uint8Array(Buffer.from(aus, 'base64'));
    },
    schliessen: () => browser.close(),
  };
}
