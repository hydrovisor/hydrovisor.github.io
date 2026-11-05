// Auflösung eines Etikett-Codes R9.2 (Plan 22 Testliste; UC14-AK2 fachlich, TZ, TO1, TO2): rein aus dem Bündel,
// ohne Netz. Injizierte Uhr 2026-12-14T08:00:00Z, Zeitzone Europe/Zurich, Teile aus tests/fixtures/regal.ts;
// Sichten nachgerechnet mit tests/fixtures/sichten.ts.
//
// Vertrag für src/domain/etikett/aufloesen.ts (vom Testentwickler festgelegt, wo Plan 22 offen ist):
//
//   export type Aufloesung =
//     | { ergebnis: 'gefunden'; ziel: { art: 'gefaess' | 'pruefen' | 'saeen' | 'messen'; code: string } }
//     | { ergebnis: 'entfernt'; text: string; kuerzel: string }   // «Gefäss 2.3 entfernt am 10.12.»
//     | { ergebnis: 'unbekannt'; text: 'Etikett nicht bekannt' };
//   export function etikettAufloesen(code: string, teile: Teile, zeitzone: Zeitzone): Aufloesung
//   export function aufrufVorgang(code: string, ergebnis: 'gefunden' | 'entfernt' | 'unbekannt', id: string,
//     jetzt: Date): Vorgang
//     // ein Schritt neu in etikett_aufruf mit client_id = id, code, aufgerufen_am = jetzt, ergebnis
import { describe, expect, it } from 'vitest';
import { entfernenVorgang } from '../../src/domain/anlage/entfernen.ts';
import { vorgangPruefen, type Schritt } from '../../src/domain/datenpfad/erfassung.ts';
import { aufrufVorgang, etikettAufloesen } from '../../src/domain/etikett/aufloesen.ts';
import { platzId, regalTeile, uid, vereinen, weitereAnlage } from '../fixtures/regal.ts';
import { sichtenNachrechnen, vorgangAnwenden, zeileAufnehmen } from '../fixtures/sichten.ts';

const JETZT = new Date('2026-12-14T08:00:00Z');
const Z = 'Europe/Zurich';
const UNBEKANNT = { ergebnis: 'unbekannt', text: 'Etikett nicht bekannt' };

describe('R9.2 Etikett auflösen', () => {
  const teile = regalTeile(JETZT);

  it('R9.2 R-2.3 gefunden, Ziel Gefäss', () => {
    expect(etikettAufloesen('R-2.3', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'gefaess', code: 'R-2.3' },
    });
    // ruhendes Gefäss 1.2 ist nicht in Prüfung: Ziel Gefäss
    expect(etikettAufloesen('R-1.2', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'gefaess', code: 'R-1.2' },
    });
  });

  it('R9.2 R-4.1 Station: Ziel Gefäss', () => {
    expect(etikettAufloesen('R-4.1', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'gefaess', code: 'R-4.1' },
    });
  });

  it('R9.2 R-A1 Ziel Säen mit Box', () => {
    expect(etikettAufloesen('R-A1', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'saeen', code: 'R-A1' },
    });
    expect(etikettAufloesen('R-A4', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'saeen', code: 'R-A4' },
    });
  });

  it('R9.2 R-W Ziel Messmaske', () => {
    expect(etikettAufloesen('R-W', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'messen', code: 'R-W' },
    });
  });

  it('R9.2 offene Prüfung von 3.3: Ziel Prüfen', () => {
    expect(etikettAufloesen('R-3.3', teile, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'pruefen', code: 'R-3.3' },
    });
    // Schritt 1 erledigt, Schritt 2 offen: weiter Prüfen
    const t = structuredClone(teile);
    zeileAufnehmen(
      t,
      'ereignis',
      {
        id: uid('46', 1),
        client_id: uid('46', 1),
        typ: 'gefaesspruefung',
        platz_id: platzId('3.3'),
        daten: { schritt: 1, ok: true },
        gilt_ab: '2026-12-14T07:00:00Z',
      },
      JETZT,
    );
    sichtenNachrechnen(t);
    expect(etikettAufloesen('R-3.3', t, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'pruefen', code: 'R-3.3' },
    });
  });

  it('R9.2 TZ entfernt: Text mit Kalendertag Zürich', () => {
    // 9.12. 23:30 UTC = 10.12. 00:30 in Zürich
    const t = vorgangAnwenden(
      teile,
      entfernenVorgang(platzId('1.2'), uid('42', 1), new Date('2026-12-09T23:30:00Z')),
      JETZT,
    );
    expect(etikettAufloesen('R-1.2', t, Z)).toEqual({
      ergebnis: 'entfernt',
      text: 'Gefäss 1.2 entfernt am 10.12.',
      kuerzel: 'R',
    });
  });

  it('R9.2 neues Gefäss am Platz eines entfernten: gefunden', () => {
    const entfernt = vorgangAnwenden(
      teile,
      entfernenVorgang(platzId('2.3'), uid('42', 1), new Date('2026-12-10T08:00:00Z')),
      JETZT,
    );
    expect(etikettAufloesen('R-2.3', entfernt, Z).ergebnis).toBe('entfernt');
    // neu erfasst am 12.12.: neue Belegung, Prüfung offen
    const t = structuredClone(entfernt);
    for (const g of t['gefaess'] ?? [])
      if (g['platz_id'] === platzId('2.3')) g['gueltig_bis'] = '2026-12-12T08:00:00Z';
    zeileAufnehmen(
      t,
      'gefaess',
      {
        ...(teile['gefaess'] ?? []).find((g) => g['platz_id'] === platzId('2.3')),
        id: uid('47', 1),
        client_id: uid('47', 1),
        gueltig_von: '2026-12-12T08:00:00Z',
        gueltig_bis: null,
      },
      JETZT,
    );
    zeileAufnehmen(
      t,
      'ereignis',
      {
        id: uid('47', 2),
        client_id: uid('47', 2),
        typ: 'gefaess_erfasst',
        platz_id: platzId('2.3'),
        gilt_ab: '2026-12-12T08:00:00Z',
      },
      JETZT,
    );
    sichtenNachrechnen(t);
    expect(etikettAufloesen('R-2.3', t, Z)).toEqual({
      ergebnis: 'gefunden',
      ziel: { art: 'pruefen', code: 'R-2.3' },
    });
  });

  it('R9.2 R-9.9, X-2.3 ohne Anlage X, «R23» und leerer Code: unbekannt', () => {
    for (const code of ['R-9.9', 'X-2.3', 'R23', '', 'r-2.3', 'R-', '-2.3'])
      expect(etikettAufloesen(code, teile, Z), `«${code}»`).toEqual(UNBEKANNT);
    // eine weitere Anlage T löst ihre eigenen Codes auf, nicht die von R
    const mitT = vereinen(teile, weitereAnlage('T', 'echt'));
    expect(etikettAufloesen('T-2.3', sichtenNachrechnen(mitT), Z)).toMatchObject({ ergebnis: 'gefunden' });
    expect(etikettAufloesen('T-4.4', sichtenNachrechnen(mitT), Z)).toEqual(UNBEKANNT);
  });

  it('R9.2 TO2 aufrufVorgang: eine Zeile etikett_aufruf mit client_id, code, aufgerufen_am = jetzt, ergebnis', () => {
    const id = uid('48', 1);
    const v = aufrufVorgang('R-2.3', 'gefunden', id, JETZT);
    expect(v).toHaveLength(1);
    const [s] = v as Extract<Schritt, { art: 'neu' }>[];
    expect(s).toMatchObject({
      art: 'neu',
      tabelle: 'etikett_aufruf',
      felder: { client_id: id, code: 'R-2.3', aufgerufen_am: JETZT.toISOString(), ergebnis: 'gefunden' },
    });
    expect(vorgangPruefen(v)).toEqual([]);
    // gleiche Eingabe, gleiche Zeile (Upsert auf client_id)
    expect(aufrufVorgang('R-2.3', 'gefunden', id, JETZT)).toEqual(v);
    expect(
      (aufrufVorgang('R-9.9', 'unbekannt', uid('48', 2), JETZT)[0] as Extract<Schritt, { art: 'neu' }>)
        .felder['ergebnis'],
    ).toBe('unbekannt');
  });
});
