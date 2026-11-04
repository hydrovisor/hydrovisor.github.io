// Bildmasse aus dem JPEG-Kopf (Issue #14, Plan 14 Testliste; 04_architektur.md 6 «höchstens 2 × 1568 px»).
// Fixtures: tests/fixtures/ki/jpeg_1600x10.jpg und jpeg_1568x10.jpg (Chromium-Canvas, ohne EXIF).
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   supabase/functions/ki-tuete/jpeg.ts
//     jpegMasse(bytes: Uint8Array): { breite: number; hoehe: number } | undefined
//   Liest Breite und Höhe aus dem ersten SOF-Segment (SOF0 bis SOF15 ohne DHT C4, JPG C8, DAC CC) und überspringt
//   die übrigen Segmente über ihre Länge. Kein JPEG oder kein SOF bis zum Dateiende → undefined. Die Grenze
//   1568 px prüft die Hülle.
import { strict as assert } from 'node:assert';
import { jpegMasse } from './jpeg.ts';

async function fixture(datei: string): Promise<Uint8Array> {
  return await Deno.readFile(new URL(`../../../tests/fixtures/ki/${datei}`, import.meta.url));
}

/** Segment mit Marker und Nutzdaten; die Länge zählt die zwei Längenbytes mit */
function segment(marker: number, nutzdaten: number[]): number[] {
  const laenge = nutzdaten.length + 2;
  return [0xff, marker, laenge >> 8, laenge & 0xff, ...nutzdaten];
}

function sof(marker: number, breite: number, hoehe: number): number[] {
  return segment(marker, [8, hoehe >> 8, hoehe & 0xff, breite >> 8, breite & 0xff, 1, 1, 0x11, 0]);
}

Deno.test(
  '04-6 jpegMasse: 1568 × 10 erkannt; 1600 × 10 erkannt (Hülle lehnt ab); PNG und abgeschnittene Datei → undefined',
  async () => {
    const gross = await fixture('jpeg_1600x10.jpg');
    const grenze = await fixture('jpeg_1568x10.jpg');
    assert.deepEqual(jpegMasse(grenze), { breite: 1568, hoehe: 10 });
    assert.deepEqual(jpegMasse(gross), { breite: 1600, hoehe: 10 });

    // Fotos der Eval-Fixtures: 64 × 96
    assert.deepEqual(jpegMasse(await fixture('fotos/sorte-eval-a-1.jpg')), { breite: 64, hoehe: 96 });

    // Hochformat und progressives JPEG (SOF2), davor APP0 und DHT (C4 ist kein SOF)
    const progressiv = Uint8Array.from([
      0xff,
      0xd8,
      ...segment(0xe0, [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
      ...segment(0xc4, [0, 0, 0, 0, 0]),
      ...sof(0xc2, 1176, 1568),
      0xff,
      0xd9,
    ]);
    assert.deepEqual(jpegMasse(progressiv), { breite: 1176, hoehe: 1568 });

    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 6, 0x40, 0,
      0, 0, 10,
    ]);
    assert.equal(jpegMasse(png), undefined);
    assert.equal(jpegMasse(gross.slice(0, 30)), undefined);
    assert.equal(jpegMasse(new Uint8Array()), undefined);
    assert.equal(jpegMasse(Uint8Array.from([0xff, 0xd8])), undefined);
    // SOF angekündigt, aber vor den Massen abgeschnitten
    assert.equal(jpegMasse(Uint8Array.from([0xff, 0xd8, ...sof(0xc0, 1600, 10).slice(0, 6)])), undefined);
  },
);
