// Tütenfoto ohne EXIF im privaten Bucket (Issue #37, Plan 37 Testliste E2E; UC4-AK6; Konzept 11.3, 11.6 Punkt 3).
// Gegen die lokale Datenbank und den lokalen Storage (Fixture konto.ts); nur ki-tuete ist über page.route gemockt,
// die Claude API wird nie aufgerufen. Das Testbild erzeugt der Test selbst: ein JPEG 2000 × 1500 aus dem Canvas
// des Browsers mit einem eingefügten APP1-Segment «Exif» mit erfundener Kamera und erfundener GPS-Angabe.
//
// Erwartete Oberfläche (Plan 37 Maskenablauf): #/sorten/neu mit zwei Fotofeldern «Vorderseite» und «Rückseite»
// (input type=file im Baustein PhotoField) und dem Knopf «Tüte lesen». Die Maske verkleinert auf die lange Kante
// 1568 px (JPEG 0.8, damit ohne EXIF), lädt nach saattueten/<sorte_id>/<uuid>.jpg hoch und ruft ki-tuete mit
// { fotopfade } auf. Das Objekt liest der Test mit der Service-Rolle zurück.
import { execSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { expect, test } from './konto.ts';

const FUNKTIONEN = 'http://127.0.0.1:54321/functions/v1';

function dienstSchluessel(): string {
  let ausgabe: string;
  try {
    ausgabe = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    ausgabe = execSync('npx --yes supabase@3.0.0 status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }
  const treffer = /^(?:SERVICE_ROLE_KEY|SECRET_KEY)="?([^"\r\n]+)"?$/m.exec(ausgabe);
  if (!treffer?.[1]) throw new Error('Service-Schlüssel der lokalen Datenbank fehlt (supabase start)');
  return treffer[1];
}

/** EXIF (TIFF, big endian): IFD0 mit Make «Testkamera» und GPS-Zeiger, GPS-IFD mit GPSLatitudeRef «N» */
function exifSegment(): Buffer {
  const tiff = Buffer.alloc(68);
  tiff.write('MM', 0, 'latin1');
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(2, 8);
  // Make: ASCII, 11 Zeichen ab Offset 38
  tiff.writeUInt16BE(0x010f, 10);
  tiff.writeUInt16BE(2, 12);
  tiff.writeUInt32BE(11, 14);
  tiff.writeUInt32BE(38, 18);
  // GPSInfo: LONG, Offset 50
  tiff.writeUInt16BE(0x8825, 22);
  tiff.writeUInt16BE(4, 24);
  tiff.writeUInt32BE(1, 26);
  tiff.writeUInt32BE(50, 30);
  tiff.writeUInt32BE(0, 34);
  tiff.write('Testkamera\0', 38, 'latin1');
  tiff.writeUInt16BE(1, 50);
  tiff.writeUInt16BE(0x0001, 52);
  tiff.writeUInt16BE(2, 54);
  tiff.writeUInt32BE(2, 56);
  tiff.write('N\0', 60, 'latin1');
  tiff.writeUInt32BE(0, 64);
  const inhalt = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const kopf = Buffer.alloc(4);
  kopf.writeUInt16BE(0xffe1, 0);
  kopf.writeUInt16BE(inhalt.length + 2, 2);
  return Buffer.concat([kopf, inhalt]);
}

async function bildMitExif(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2000;
    c.height = 1500;
    const g = c.getContext('2d');
    if (!g) throw new Error('kein Canvas');
    const verlauf = g.createLinearGradient(0, 0, 2000, 1500);
    verlauf.addColorStop(0, '#2e7d32');
    verlauf.addColorStop(1, '#f9a825');
    g.fillStyle = verlauf;
    g.fillRect(0, 0, 2000, 1500);
    g.fillStyle = '#ffffff';
    g.font = '160px sans-serif';
    g.fillText('Testsorte', 200, 800);
    return c.toDataURL('image/jpeg', 0.9).split(',')[1] ?? '';
  });
  const jpeg = Buffer.from(base64, 'base64');
  const bild = Buffer.concat([jpeg.subarray(0, 2), exifSegment(), jpeg.subarray(2)]);
  expect(bild.includes(Buffer.from('Exif\0\0', 'latin1'))).toBe(true);
  return bild;
}

/** Segmente bis SOS: APP-Marker und Masse aus SOF0 bis SOF2 */
function jpegLesen(b: Buffer): { app1Exif: boolean; breite: number; hoehe: number } {
  expect(b[0]).toBe(0xff);
  expect(b[1]).toBe(0xd8);
  let i = 2;
  let app1Exif = false;
  let breite = 0;
  let hoehe = 0;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) break;
    const marker = b[i + 1] ?? 0;
    if (marker === 0xda) break;
    const laenge = b.readUInt16BE(i + 2);
    if (marker === 0xe1 && b.subarray(i + 4, i + 10).toString('latin1') === 'Exif\0\0') app1Exif = true;
    if (marker >= 0xc0 && marker <= 0xc2) {
      hoehe = b.readUInt16BE(i + 5);
      breite = b.readUInt16BE(i + 7);
    }
    i += 2 + laenge;
  }
  return { app1Exif, breite, hoehe };
}

test('UC4-AK6 Foto mit EXIF über die Maske Sorten hochgeladen, aus dem Storage zurückgelesen: ohne EXIF, lange Kante 1568 px, JPEG', async ({
  page,
  konto,
}) => {
  const schluessel = dienstSchluessel();
  const anfragen: { fotopfade?: string[] }[] = [];
  await page.route(`${FUNKTIONEN}/ki-tuete`, async (route) => {
    anfragen.push((route.request().postDataJSON() ?? {}) as { fotopfade?: string[] });
    return route.fulfill({
      json: {
        ergebnis: 'von_hand',
        grund: 'nicht_eingerichtet',
        hinweis: 'Das Lesen der Tüte ist noch nicht eingerichtet. Trag die Werte von Hand ein.',
        dauerMs: 0,
      },
    });
  });
  await konto.anmelden(page);
  await page.goto('/#/sorten/neu');
  const bild = await bildMitExif(page);

  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'tuete-vorne.jpg', mimeType: 'image/jpeg', buffer: bild });
  await page.getByRole('button', { name: 'Tüte lesen', exact: true }).click();
  await expect.poll(() => anfragen.length, { timeout: 15_000 }).toBe(1);

  const pfade = anfragen[0]?.fotopfade ?? [];
  expect(pfade).toHaveLength(1);
  const pfad = pfade[0] ?? '';
  expect(pfad).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/);

  const antwort = await fetch(`${konto.apiUrl}/storage/v1/object/saattueten/${pfad}`, {
    headers: { apikey: schluessel, authorization: `Bearer ${schluessel}` },
  });
  expect(antwort.status).toBe(200);
  expect(antwort.headers.get('content-type') ?? '').toMatch(/image\/jpeg/);
  const gespeichert = Buffer.from(await antwort.arrayBuffer());
  const j = jpegLesen(gespeichert);
  expect(j.app1Exif).toBe(false);
  expect(gespeichert.includes(Buffer.from('Testkamera', 'latin1'))).toBe(false);
  expect(Math.max(j.breite, j.hoehe)).toBe(1568);
  expect(j.breite).toBe(1568);
  expect(j.hoehe).toBe(1176);
  expect(gespeichert.length).toBeLessThan(bild.length);

  // ohne Anmeldung (anon) kein Zugriff auf den privaten Bucket
  const anon = await fetch(`${konto.apiUrl}/storage/v1/object/public/saattueten/${pfad}`);
  expect(anon.ok).toBe(false);
});
