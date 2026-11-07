// Eine Beschreibung der Bündelteile und eine Kürzung für Heute und Push (Plan 31 Lösungsweg 1 und Testliste «Vitest»;
// R5.1, G1; UC8-AK10). Die Beschreibung (Buendelteil, BUENDEL_TEILE, SEITE) wandert unverändert nach
// src/domain/datenpfad/buendel-teile.ts, src/daten/buendel.ts exportiert sie weiter; die Kürzung nach dem Laden wird
// teileKuerzen() in src/domain/datenpfad/buendel.ts. buendel-laden.test.ts bleibt als Regression unverändert.
// Erwartete Kürzung von Hand nach dem bisherigen Block in erstelleBuendelLaden() (Pläne 20, 27, 29; Runde 1 Befund 9):
// - naehrloesungsansatz: letzter Ansatz je Ort, letzter nicht abgebrochener Neuansatz oder Teilwechsel je Ort, letzter
//   nicht abgebrochener Neuansatz je Ort, dazu Nachfüllen nach diesem Neuansatz;
// - ansatz_position: nur Positionen dieser Ansätze;
// - ansatz_schritt: nur Schritte laufender Neuansätze unter diesen Ansätzen;
// - v_messung_unsicher: nur Zeilen zu Messungen im Teil messung.
import { describe, expect, it } from 'vitest';
import {
  BUENDEL_TEILE as BUENDEL_TEILE_DATEN,
  SEITE as SEITE_DATEN,
  erstelleBuendelLaden,
} from '../../src/daten/buendel.ts';
import type { Buendeladapter, Buendelspeicher } from '../../src/daten/buendel.ts';
import { teileKuerzen } from '../../src/domain/datenpfad/buendel.ts';
import { BUENDEL_TEILE, SEITE } from '../../src/domain/datenpfad/buendel-teile.ts';
import type { Zeitkontext } from '../../src/domain/datenpfad/erfassung.ts';

const KONTEXT: Zeitkontext = { jetzt: new Date('2027-01-12T08:00:00.000Z'), zeitzone: 'Europe/Zurich' };
const P1 = '0c000000-0000-4000-8000-000000000001';
const P2 = '0c000000-0000-4000-8000-000000000002';
const id = (n: number) => `0e200000-0000-4000-8000-${String(n).padStart(12, '0')}`;
type Zeile = Record<string, unknown>;

const ansatz = (n: number, platz: string, typ: string, tag: string, status = 'abgeschlossen'): Zeile => ({
  id: id(n),
  platz_id: platz,
  typ,
  status,
  begonnen_am: `${tag}T08:00:00.000Z`,
  storniert_am: null,
});

/** Rohdaten wie aus der Datenbank */
function roh(): Record<string, Zeile[]> {
  return {
    naehrloesungsansatz: [
      // P1: Neuansatz 1.1., Nachfüllen 3.1., Neuansatz 5.1., Nachfüllen 7.1., pH-Korrektur 8.1.
      ansatz(1, P1, 'neuansatz', '2027-01-01'),
      ansatz(2, P1, 'nachfuellen', '2027-01-03'),
      ansatz(3, P1, 'neuansatz', '2027-01-05'),
      ansatz(4, P1, 'nachfuellen', '2027-01-07'),
      ansatz(5, P1, 'ph_korrektur', '2027-01-08'),
      // P2: Neuansatz 2.1., abgebrochener Neuansatz 9.1., laufender Neuansatz 11.1.
      ansatz(6, P2, 'neuansatz', '2027-01-02'),
      ansatz(7, P2, 'neuansatz', '2027-01-09', 'abgebrochen'),
      ansatz(8, P2, 'neuansatz', '2027-01-11', 'laufend'),
    ],
    ansatz_position: [1, 3, 5, 6, 8].map((n) => ({ id: `pos-${n}`, ansatz_id: id(n) })),
    ansatz_schritt: [3, 8].map((n) => ({ id: `schritt-${n}`, ansatz_id: id(n) })),
    messung: [{ id: 'm-1' }, { id: 'm-2' }],
    v_messung_unsicher: [{ messung_id: 'm-1' }, { messung_id: 'm-alt' }],
  };
}

const ids = (l: readonly unknown[] | undefined, feld = 'id') =>
  [...((l ?? []) as Zeile[])].map((z) => String(z[feld])).sort();

const ERWARTET = {
  naehrloesungsansatz: [id(3), id(4), id(5), id(8)].sort(),
  ansatz_position: ['pos-3', 'pos-5', 'pos-8'],
  ansatz_schritt: ['schritt-8'],
  v_messung_unsicher: ['m-1'],
};

function geprueft(teile: Record<string, readonly unknown[]>) {
  return {
    naehrloesungsansatz: ids(teile['naehrloesungsansatz']),
    ansatz_position: ids(teile['ansatz_position']),
    ansatz_schritt: ids(teile['ansatz_schritt']),
    v_messung_unsicher: ids(teile['v_messung_unsicher'], 'messung_id'),
  };
}

describe('teileKuerzen (I1b-06)', () => {
  it('UC8-AK10 teileKuerzen gleich der bisherigen Kürzung', () => {
    expect(geprueft(teileKuerzen(roh()))).toEqual(ERWARTET);
  });

  it('UC8-AK10 erstelleBuendelLaden kürzt gleich wie teileKuerzen', async () => {
    const daten = roh();
    const adapter: Buendeladapter = {
      istTim: async () => ({ data: true, error: null }) as never,
      seite: async (teil, { von, bis }) =>
        ({ data: (daten[teil.name] ?? []).slice(von, bis + 1), error: null }) as never,
    };
    let gespeichert: Record<string, readonly unknown[]> | undefined;
    const speicher: Buendelspeicher = {
      ersetzen: async (b) => {
        gespeichert = b.teile;
      },
    };
    const ergebnis = await erstelleBuendelLaden(adapter, speicher, {
      appVersion: '0.0.0+test',
      nutzerId: '00000000-0000-4000-8000-0000000000e2',
    })(KONTEXT);
    expect(ergebnis.status).toBe('geladen');
    expect(geprueft(gespeichert ?? {})).toEqual(ERWARTET);
    expect(geprueft(gespeichert ?? {})).toEqual(geprueft(teileKuerzen(roh())));
  });

  it('UC8-AK10 teileKuerzen ist rein: fehlende Teile bleiben fehlend, Eingabe unverändert', () => {
    expect(teileKuerzen({})).toEqual({});
    const nurMessung = { messung: [{ id: 'm-1' }] };
    expect(Object.keys(teileKuerzen(nurMessung))).toEqual(['messung']);
    const eingabe = roh();
    const kopie = structuredClone(eingabe);
    teileKuerzen(eingabe);
    expect(eingabe).toEqual(kopie);
  });

  it('UC8-AK10 BUENDEL_TEILE und SEITE aus src/domain gleich denen aus src/daten (verschoben, weiter exportiert)', () => {
    expect(BUENDEL_TEILE_DATEN).toEqual(BUENDEL_TEILE);
    expect(SEITE).toBe(1000);
    expect(SEITE_DATEN).toBe(SEITE);
    const namen = BUENDEL_TEILE.map((t) => t.name);
    for (const name of ['naehrloesungsansatz', 'ereignis_platz', 'einstellung', 'messung', 'aufschub'])
      expect(namen).toContain(name);
    expect(BUENDEL_TEILE.find((t) => t.name === 'ereignis_platz')?.typen).toContain('stromausfall');
  });
});
