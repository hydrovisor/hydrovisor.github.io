// UX4 Abernten direkt in Heute (Issue #226, Plan 226 Testliste; UX4-AK5; R1.7, G1, G2). Injizierte Uhr um('2027-02-18')
// = Zürich 18.2. 09:00 (Lollo Rossa in 2.3 erntereif), Zeitzone Europe/Zurich, ids als Zähler; Teile aus
// tests/fixtures/ernte.ts (LOLLO[1], LOLLO[2] in 2.3, LOLLO[3] als Stationsrest auf 4.4).
//
// Vertrag (Plan 226 «Signaturen und Datenfluss»):
//   src/domain/phasen/ernte.ts
//     ernteUmfang(teile, pflanzungId): string[] aktive Pflanzungen desselben Satzes mit demselben platz_id (auch null),
//       nach id; nicht aktiv oder unbekannt → []. Wörtlich aus pflanzenAnsicht().umfang herausgelöst.
//     alleAberntenVorgang(teile, pflanzungId, ids, jetzt, zeitzone): Vorgang =
//       ernteVorgang(teile, { pflanzungIds: ernteUmfang(teile, pflanzungId), art: 'ab' }, ids, jetzt, zeitzone);
//       leer bei leerem Umfang (R1.7).
// Ohne Personendaten.
import { describe, expect, it } from 'vitest';
import {
  rueckgaengigVorgang,
  vorgangPruefen,
  type Schritt,
  type Vorgang,
} from '../../src/domain/datenpfad/erfassung.ts';
import { pflanzenAnsicht } from '../../src/domain/phasen/ansicht.ts';
import { teileNach } from '../../src/domain/phasen/ende.ts';
import {
  alleAberntenVorgang,
  ernteAufgaben,
  ernteUmfang,
  ernteVorgang,
} from '../../src/domain/phasen/ernte.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  EISSALAT,
  ernteDazu,
  ernteSichtenNachrechnen,
  ernteTeile,
  ernteVorgangAnwenden,
  LOLLO,
  SATZ,
  um,
} from '../fixtures/ernte.ts';
import { uid } from '../fixtures/regal.ts';

const J = um('2027-02-18');
const Z = ZEITZONE;
const L1 = LOLLO[1] as string;
const L2 = LOLLO[2] as string;
const L3 = LOLLO[3] as string;

function neueIds(praefix = '6a'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return uid(praefix, n);
  };
}

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);
type Zeile = Record<string, unknown>;
const teil = (t: unknown, name: string) => ((t as Record<string, Zeile[]>)[name] ?? []) as Zeile[];
const status = (t: unknown, p: string) =>
  teil(t, 'v_pflanzung_zustand').find((z) => z['pflanzung_id'] === p)?.['status'];
const ernteMoeglich = (t: unknown, jetzt: Date) =>
  ernteAufgaben(t as Parameters<typeof ernteAufgaben>[0], jetzt, Z).filter(
    (a) => a.typ === 'ernte_moeglich' && a.satzId === SATZ.lollo,
  );

describe('UX4-AK5 ernteUmfang und alleAberntenVorgang', () => {
  it('UX4-AK5 alleAberntenVorgang(L1) ist gleich ernteVorgang mit pflanzenAnsicht(L1).umfang und art ab (gleiche ids, gleiches jetzt)', () => {
    const t = ernteTeile();
    const umfang = pflanzenAnsicht(t, L1, J, Z)?.umfang ?? [];
    expect(umfang).toEqual([L1, L2].sort());
    const v = alleAberntenVorgang(t, L1, neueIds(), J, Z);
    expect(v).toEqual(ernteVorgang(t, { pflanzungIds: umfang, art: 'ab' }, neueIds(), J, Z));
    const felder = neue(v);
    expect(felder).toHaveLength(2);
    expect(felder.map((f) => f['pflanzung_id'])).toEqual([L1, L2].sort());
    for (const f of felder) {
      expect(f).toMatchObject({ typ: 'ernte', gilt_ab: J.toISOString(), daten: { art: 'ab' } });
      expect(f['client_id']).toBe(f['id']);
    }
    expect(v.every((s) => s.art === 'neu' && s.tabelle === 'ereignis')).toBe(true);
    expect(vorgangPruefen(v)).toEqual([]);
    // von L2 aus derselbe Umfang
    expect(alleAberntenVorgang(t, L2, neueIds(), J, Z)).toEqual(v);
  });

  it('UX4-AK5 ernteUmfang: aktive Pflanzungen desselben Satzes am selben Platz nach id; der Stationsrest LOLLO[3] auf 4.4 gehört nicht dazu', () => {
    const t = ernteTeile();
    expect(ernteUmfang(t, L1)).toEqual([L1, L2].sort());
    expect(ernteUmfang(t, L2)).toEqual([L1, L2].sort());
    expect(ernteUmfang(t, L1)).not.toContain(L3);
    expect(ernteUmfang(t, L3)).toEqual([L3]);
    // anderer Satz am selben Platz 2.3 (Eissalat) zählt nicht
    expect(ernteUmfang(t, EISSALAT)).toEqual([EISSALAT]);
    // Vorgang vom Stationsrest aus: nur LOLLO[3]
    expect(neue(alleAberntenVorgang(t, L3, neueIds(), J, Z)).map((f) => f['pflanzung_id'])).toEqual([L3]);
  });

  it('UX4-AK5 ernteUmfang ist gleich pflanzenAnsicht().umfang für jede aktive Pflanzung der Fixture', () => {
    const t = ernteTeile();
    const aktive = teil(t, 'v_pflanzung_zustand')
      .filter((z) => z['status'] === 'aktiv')
      .map((z) => String(z['pflanzung_id']));
    expect(aktive.length).toBeGreaterThanOrEqual(8);
    for (const p of aktive) expect(ernteUmfang(t, p), p).toEqual(pflanzenAnsicht(t, p, J, Z)?.umfang);
  });

  it('UX4-AK5 nicht aktive oder unbekannte Pflanzung: alleAberntenVorgang leer', () => {
    const t = ernteTeile();
    ernteDazu(t, EISSALAT, 'ab', '2027-02-17');
    ernteSichtenNachrechnen(t);
    expect(status(t, EISSALAT)).not.toBe('aktiv');
    expect(ernteUmfang(t, EISSALAT)).toEqual([]);
    expect(alleAberntenVorgang(t, EISSALAT, neueIds(), J, Z)).toEqual([]);

    const unbekannt = uid('28', 9999);
    expect(ernteUmfang(t, unbekannt)).toEqual([]);
    expect(alleAberntenVorgang(t, unbekannt, neueIds(), J, Z)).toEqual([]);
  });

  it('UX4-AK5 nach dem Vorgang (teileNach) sind alle Pflanzungen des Umfangs geerntet, ernteAufgaben ohne «Ernte möglich» für den Satz am Ort; nach rueckgaengigVorgang wieder aktiv und die Aufgabe wieder da', () => {
    const t = ernteTeile();
    expect(ernteMoeglich(t, J)).toHaveLength(1);
    expect(ernteMoeglich(t, J)[0]?.pflanzungId).toBe(L1);

    const v = alleAberntenVorgang(t, L1, neueIds(), J, Z);
    const nach = teileNach(t, v, J, Z);
    expect(status(nach, L1)).toBe('geerntet');
    expect(status(nach, L2)).toBe('geerntet');
    expect(status(nach, L3)).toBe('aktiv');
    expect(ernteMoeglich(nach, J)).toEqual([]);
    // Gegenprobe mit dem Datenbank-Spiegel
    const db = ernteVorgangAnwenden(structuredClone(t), v, J);
    expect(status(db, L1)).toBe('geerntet');
    expect(ernteMoeglich(db, J)).toEqual([]);

    // Rückgängig: Stornos in umgekehrter Reihenfolge, Grund rueckgaengig; die Überlagerung entfernt die Zeilen
    const r = rueckgaengigVorgang(v);
    expect(r).toEqual(
      [...neue(v)].reverse().map((f) => ({
        art: 'storno',
        tabelle: 'ereignis',
        clientId: f['client_id'],
        grund: 'rueckgaengig',
      })),
    );
    const zurueck = teileNach(t, [...v, ...r], J, Z);
    expect(status(zurueck, L1)).toBe('aktiv');
    expect(status(zurueck, L2)).toBe('aktiv');
    expect(ernteMoeglich(zurueck, J)).toEqual(ernteMoeglich(t, J));
  });

  it('UX4-AK5 Einmalernte (Eissalat, 1 Pflanzung): ein ernte ab, kein abschluss', () => {
    const t = ernteTeile();
    const jetzt = um('2027-03-04');
    const v = alleAberntenVorgang(t, EISSALAT, neueIds(), jetzt, Z);
    const felder = neue(v);
    expect(felder).toHaveLength(1);
    expect(felder[0]).toMatchObject({
      typ: 'ernte',
      pflanzung_id: EISSALAT,
      gilt_ab: jetzt.toISOString(),
      daten: { art: 'ab' },
    });
    expect(felder.filter((f) => f['typ'] === 'abschluss')).toEqual([]);
    expect(v).toEqual(ernteVorgang(t, { pflanzungIds: [EISSALAT], art: 'ab' }, neueIds(), jetzt, Z));
  });

  it('UX4-AK5 TZ gilt_ab ist jetzt als ISO-Zeit, auch um 23:30 Zürich', () => {
    const t = ernteTeile();
    // 18.2. 23:30 Zürich (Winterzeit, 22:30 UTC)
    const spaet = new Date('2027-02-18T22:30:00Z');
    const felder = neue(alleAberntenVorgang(t, L1, neueIds(), spaet, Z));
    expect(felder).toHaveLength(2);
    for (const f of felder) expect(f['gilt_ab']).toBe('2027-02-18T22:30:00.000Z');
    // die Aufgabe des Tages ist danach erledigt
    const nach = teileNach(t, alleAberntenVorgang(t, L1, neueIds(), spaet, Z), spaet, Z);
    expect(ernteMoeglich(nach, spaet)).toEqual([]);
  });
});
