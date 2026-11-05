// Etiketten R9.1 (Plan 22 Testliste; UC14-AK1, TZ, TO2): Link, QR-Matrix mit Dekodierprobe (jsQR), Inhalt,
// Liste mit Stand und Bestätigung «gedruckt». Injizierte Uhr 2026-12-14T08:00:00Z, Zeitzone Europe/Zurich, Teile aus
// tests/fixtures/regal.ts.
//
// Vertrag für src/domain/etikett/etikett.ts und qr.ts (vom Testentwickler festgelegt, wo Plan 22 offen ist):
//
//   export function etikettLink(code: string): string          // BASIS_URL + '#/e/' + code
//   export function etikettCode(kuerzel: string, kennung: string): string   // 'R' + '-' + '2.3'
//   export function codeZerlegen(code: string): { kuerzel: string; kennung: string } | undefined
//   export interface Etiketteninhalt { code: string; link: string; kennung: string; zeilen: string[]; klein: boolean }
//   export function etikettInhalt(teile: Teile, etikett: EtikettZeile, zeitzone: Zeitzone): Etiketteninhalt
//     // etikett ist die Zeile aus dem Teil «etikett»; code = etikett.code (nie neu zusammengesetzt)
//   export interface Etikettzeile { code: string; kennung: string; stand: string; ... }
//     // stand «nicht gedruckt» oder «gedruckt am 14.12.» (Kalendertag in der Zeitzone)
//   export function etikettListe(teile: Teile, anlageId: string, zeitzone: Zeitzone): Etikettzeile[]
//     // Gefässe nach Kennung, dann A1 bis A4, dann W; ohne entfernte Orte und ohne andere Anlagen (A11)
//   export function gedrucktVorgang(etiketten: readonly EtikettZeile[], jetzt: Date): Vorgang
//     // je Etikett ohne gedruckt_am ein Schritt
//     // { art: 'setzen', tabelle: 'etikett', clientId: etikett.client_id, felder: { gedruckt_am: jetzt.toISOString() } }
//   qr.ts: export function qrMatrix(text: string): boolean[][]   // matrix[zeile][spalte], true = dunkel, ohne Rand
//          export function qrSvgPfad(matrix: boolean[][], ruhezone?: number): { pfad: string; module: number }
//            // module = Kantenlänge einschliesslich Ruhezone (Standard 4)
import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { entfernenVorgang } from '../../src/domain/anlage/entfernen.ts';
import { vorgangPruefen } from '../../src/domain/datenpfad/erfassung.ts';
import {
  codeZerlegen,
  etikettCode,
  etikettInhalt,
  etikettLink,
  etikettListe,
  gedrucktVorgang,
} from '../../src/domain/etikett/etikett.ts';
import { qrMatrix, qrSvgPfad } from '../../src/domain/etikett/qr.ts';
import {
  ANLAGE_R,
  platzId,
  regalTeile,
  uid,
  vereinen,
  weitereAnlage,
  type Teile,
} from '../fixtures/regal.ts';
import { vorgangAnwenden } from '../fixtures/sichten.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');
const Z = 'Europe/Zurich';

type EtikettRoh = Record<string, unknown> & { code: string; client_id: string; gedruckt_am: string | null };

function etikett(teile: Teile, code: string): EtikettRoh {
  const e = (teile['etikett'] ?? []).find((z) => z['code'] === code);
  if (!e) throw new Error(`Etikett ${code} fehlt in den Teilen`);
  return e as EtikettRoh;
}

/** Matrix mit Ruhezone als RGBA-Puffer, 4 Pixel je Modul, dunkel = schwarz */
function rgba(matrix: boolean[][], ruhezone = 4, px = 4) {
  const module = matrix.length + 2 * ruhezone;
  const breite = module * px;
  const daten = new Uint8ClampedArray(breite * breite * 4).fill(255);
  matrix.forEach((zeile, y) =>
    zeile.forEach((dunkel, x) => {
      if (!dunkel) return;
      for (let dy = 0; dy < px; dy += 1)
        for (let dx = 0; dx < px; dx += 1) {
          const i = (((y + ruhezone) * px + dy) * breite + (x + ruhezone) * px + dx) * 4;
          daten[i] = 0;
          daten[i + 1] = 0;
          daten[i + 2] = 0;
        }
    }),
  );
  return { daten, breite };
}

/**
 * Fehlerkorrektur aus der Formatinformation (ISO/IEC 18004): Bits 14 und 13 stehen in Zeile 8, Spalten 0 und 1
 * und als zweite Kopie in Spalte 8, Zeilen n − 1 und n − 2; maskiert mit 0b10. L = 1, M = 0, Q = 3, H = 2.
 */
function fehlerkorrektur(matrix: boolean[][]): { erste: number; zweite: number } {
  const n = matrix.length;
  const bit = (w: boolean | undefined) => (w ? 1 : 0);
  const erste = ((bit(matrix[8]?.[0]) << 1) | bit(matrix[8]?.[1])) ^ 0b10;
  const zweite = ((bit(matrix[n - 1]?.[8]) << 1) | bit(matrix[n - 2]?.[8])) ^ 0b10;
  return { erste, zweite };
}
const Q = 3;

describe('UC14-AK1 Link und QR-Code (R9.1)', () => {
  it('UC14-AK1 Link für Gefäss 2.3 der Anlage R lautet https://hydrovisor.github.io/#/e/R-2.3', () => {
    expect(etikettLink('R-2.3')).toBe('https://hydrovisor.github.io/#/e/R-2.3');
    expect(etikettCode('R', '2.3')).toBe('R-2.3');
    expect(codeZerlegen('R-2.3')).toEqual({ kuerzel: 'R', kennung: '2.3' });
    expect(codeZerlegen('R-A1')).toEqual({ kuerzel: 'R', kennung: 'A1' });
    // Inhalt aus dem Bündel trägt denselben Link
    const teile = regalTeile(JETZT);
    expect(etikettInhalt(teile, etikett(teile, 'R-2.3'), Z)).toMatchObject({
      code: 'R-2.3',
      link: 'https://hydrovisor.github.io/#/e/R-2.3',
      kennung: '2.3',
    });
  });

  it('UC14-AK1 QR-Code mit Fehlerkorrektur Q ergibt mit jsQR genau diesen Link (auch R-A1, R-W, R-4.4)', () => {
    for (const code of ['R-2.3', 'R-A1', 'R-W', 'R-4.4']) {
      const link = etikettLink(code);
      const matrix = qrMatrix(link);
      expect(matrix.length, code).toBeGreaterThanOrEqual(21);
      expect(
        matrix.every((z) => z.length === matrix.length),
        `${code} quadratisch`,
      ).toBe(true);
      expect(fehlerkorrektur(matrix), `${code} Fehlerkorrektur Q`).toEqual({ erste: Q, zweite: Q });
      const { daten, breite } = rgba(matrix);
      const gelesen = jsQR(daten, breite, breite);
      expect(gelesen?.data, code).toBe(link);
      // bis 46 Zeichen passt der Link mit Q in Version 4 (33 Module); kurzer Code ohne Pfad (Erratum E4)
      expect(matrix.length, code).toBe(33);
    }
  });

  it('UC14-AK1 SVG-Pfad mit Ruhezone von 4 Modulen', () => {
    const matrix = qrMatrix(etikettLink('R-2.3'));
    const { pfad, module } = qrSvgPfad(matrix);
    expect(module).toBe(matrix.length + 8);
    expect(qrSvgPfad(matrix, 2).module).toBe(matrix.length + 4);
    expect(pfad).toMatch(/^M/);
    expect(qrSvgPfad(matrix).pfad).toBe(pfad);
  });

  it('UC14-AK1 Nachdruck erzeugt denselben Code und dieselbe QR-Matrix', () => {
    const teile = regalTeile(JETZT);
    const erst = etikettInhalt(teile, etikett(teile, 'R-2.3'), Z);
    // später gedruckt: gleicher Inhalt und gleiche Matrix
    const t2 = structuredClone(teile);
    const e2 = etikett(t2, 'R-2.3');
    e2.gedruckt_am = '2026-12-13T10:00:00Z';
    const nach = etikettInhalt(t2, e2, Z);
    expect(nach).toEqual(erst);
    expect(qrMatrix(nach.link)).toEqual(qrMatrix(erst.link));
    // Code stammt aus etikett.code, nicht aus Kürzel und Kennung neu zusammengesetzt
    const t3 = structuredClone(teile);
    for (const a of t3['anlage'] ?? []) a['kuerzel'] = 'Q';
    expect(etikettInhalt(t3, etikett(t3, 'R-2.3'), Z).code).toBe('R-2.3');
    expect(etikettInhalt(t3, etikett(t3, 'R-2.3'), Z).link).toBe('https://hydrovisor.github.io/#/e/R-2.3');
  });
});

describe('R9.1 Inhalt, Liste und Bestätigung', () => {
  const teile = regalTeile(JETZT);
  const inhalt = (code: string) => etikettInhalt(teile, etikett(teile, code), Z);

  it('R9.1 Zeilen: Gefäss 2.3 «Indoor-Regal · DWC» und «9 l · D2 · 6 × 8 cm»', () => {
    expect(inhalt('R-2.3')).toMatchObject({
      code: 'R-2.3',
      kennung: '2.3',
      zeilen: ['Indoor-Regal · DWC', '9 l · D2 · 6 × 8 cm'],
      klein: false,
    });
    expect(inhalt('R-3.1').zeilen).toEqual(['Indoor-Regal · Kratky belüftet', '9 l · D3 · 8 × 5 cm']);
  });

  it('R9.1 Station 4.4 mit S5: 13 × 5 cm', () => {
    expect(inhalt('R-4.4')).toMatchObject({
      kennung: '4.4',
      zeilen: ['Indoor-Regal · Konstantpegel', '2.3 l · S5 · 13 × 5 cm'],
      klein: false,
    });
    expect(inhalt('R-4.2').zeilen[1]).toBe('2.3 l · S8 · 4 × 8 cm');
  });

  it('R9.1 Anzuchtbox A1 klein: Lichtkeimer, Deckel offen; A3: Dunkelkeimer, Deckel zu', () => {
    expect(inhalt('R-A1')).toMatchObject({
      code: 'R-A1',
      kennung: 'A1',
      zeilen: ['Lichtkeimer', 'Deckel offen'],
      klein: true,
    });
    expect(inhalt('R-A3')).toMatchObject({
      kennung: 'A3',
      zeilen: ['Dunkelkeimer', 'Deckel zu'],
      klein: true,
    });
  });

  it('R9.1 Messstelle W', () => {
    expect(inhalt('R-W')).toMatchObject({
      code: 'R-W',
      kennung: 'W',
      zeilen: ['Indoor-Regal · Messstelle', 'Leitungswasser'],
      klein: false,
    });
  });

  it('R9.1 TZ Liste: Stand «nicht gedruckt» und «gedruckt am 14.12.» (Kalendertag Zürich, gedruckt_am 23:30 UTC am Vortag ergibt den Folgetag)', () => {
    const t = structuredClone(teile);
    etikett(t, 'R-2.3').gedruckt_am = '2026-12-13T23:30:00Z';
    etikett(t, 'R-W').gedruckt_am = '2026-12-13T22:59:00Z';
    const liste = etikettListe(t, ANLAGE_R, Z);
    const stand = (code: string) => liste.find((z) => z.code === code)?.stand;
    expect(stand('R-2.3')).toBe('gedruckt am 14.12.');
    expect(stand('R-W')).toBe('gedruckt am 13.12.');
    expect(stand('R-1.1')).toBe('nicht gedruckt');
    expect(stand('R-A1')).toBe('nicht gedruckt');
  });

  it('R9.1 Liste ohne Etiketten entfernter Gefässe und anderer Anlagen', () => {
    const andere = weitereAnlage('T', 'echt');
    const tPlatz = (andere['platz'] ?? [])[0]?.['id'];
    andere['etikett'] = [
      {
        id: uid('3e', 1),
        client_id: uid('3e', 1),
        code: 'T-2.3',
        platz_id: tPlatz,
        format: '70x42_3',
        gedruckt_am: null,
        storniert_am: null,
      },
    ];
    const mitT = vereinen(teile, andere);
    const t = vorgangAnwenden(mitT, entfernenVorgang(platzId('2.3'), uid('42', 1), JETZT), JETZT);
    const codes = etikettListe(t, ANLAGE_R, Z).map((z) => z.code);
    expect(codes).toEqual([
      'R-1.1',
      'R-1.2',
      'R-2.1',
      'R-2.2',
      'R-3.1',
      'R-3.2',
      'R-3.3',
      'R-4.1',
      'R-4.2',
      'R-4.3',
      'R-4.4',
      'R-4.5',
      'R-A1',
      'R-A2',
      'R-A3',
      'R-A4',
      'R-W',
    ]);
    // die andere Anlage hat ihre eigene Liste
    const tId = (andere['anlage'] ?? [])[0]?.['id'] as string;
    expect(etikettListe(t, tId, Z).map((z) => z.code)).toEqual(['T-2.3']);
  });

  it('R9.1 TO2 gedrucktVorgang setzt nur Etiketten ohne gedruckt_am, gleiche Eingabe gleiche Schritte', () => {
    const t = structuredClone(teile);
    etikett(t, 'R-2.2').gedruckt_am = '2026-12-01T09:00:00Z';
    const gewaehlt = ['R-2.1', 'R-2.2', 'R-2.3'].map((c) => etikett(t, c));
    const v = gedrucktVorgang(gewaehlt, JETZT);
    expect(v).toEqual([
      {
        art: 'setzen',
        tabelle: 'etikett',
        clientId: etikett(t, 'R-2.1').client_id,
        felder: { gedruckt_am: JETZT.toISOString() },
      },
      {
        art: 'setzen',
        tabelle: 'etikett',
        clientId: etikett(t, 'R-2.3').client_id,
        felder: { gedruckt_am: JETZT.toISOString() },
      },
    ]);
    expect(gedrucktVorgang(gewaehlt, JETZT)).toEqual(v);
    expect(vorgangPruefen(v)).toEqual([]);
    // alle schon gedruckt: kein Schritt
    expect(gedrucktVorgang([etikett(t, 'R-2.2')], JETZT)).toEqual([]);
  });
});
