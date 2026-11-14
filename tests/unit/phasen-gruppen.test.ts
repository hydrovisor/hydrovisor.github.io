// UX4 Phasenkarten je Sorte gebündelt (Issue #226, Plan 226 Testliste; UX4-AK1; R1.5, G1, G2). Injizierte Uhr,
// Zeitzone Europe/Zurich, ids als Zähler; Fixture tests/fixtures/phasen.ts (gleicheSaetzeTeile nach dem Muster S9).
//
// Vertrag (Plan 226 «Signaturen und Datenfluss»):
//   src/domain/phasen/gruppen.ts
//     type Antwort = 'ja' | 'noch_nicht' | 'problem'
//     Fragegruppe { schluessel: 'sorteId|kulturform|von|nach'; sorte; sorteId; kulturform; von; nach; uebergang; text;
//                   frage; pruefen; pflanzungen; zeilen: Fragezeile[] }
//       pflanzungen = Zahl der aktiven Pflanzungen der Sätze (v_pflanzung_zustand); pruefen = ein Satz trägt pruefen;
//       text = Text der ersten Zeile, bei abweichenden Texten der des ältesten Phasenbeginns (A3)
//     phasenGruppen(teile, karte): Fragegruppe[] in der Reihenfolge der Zeilen (erste Zeile einer Gruppe zählt)
//     GruppenWahl { gruppe: Record<schluessel, Antwort>; satz: Record<satzId, Antwort> }
//     gruppenAntworten(gruppen, wahl): { satzId; antwort }[] je Satz in der Reihenfolge der Karte,
//       wahl.satz[satzId] ?? wahl.gruppe[schluessel] ?? 'ja'
// Ohne Personendaten.
import { describe, expect, it } from 'vitest';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  antwortVorgang,
  PHASENLOGIK_AB,
  phasenKarten,
  type Fragekarte,
} from '../../src/domain/phasen/fragen.ts';
import { gruppenAntworten, phasenGruppen, type GruppenWahl } from '../../src/domain/phasen/gruppen.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import {
  antwortDazu,
  GLEICH,
  GLEICH_JETZT,
  GLEICH_SAAT,
  GLEICH_TITEL,
  gleicheSaetzeTeile,
  phasenNachrechnen,
  phasenSatz,
  phasenTeile,
  satzId,
  SORTE,
} from '../fixtures/phasen.ts';
import type { Teile } from '../fixtures/regal.ts';

const Z = ZEITZONE;
const J = GLEICH_JETZT;
const zaehler = () => {
  let n = 0;
  return () => `3c000000-0000-4000-8000-${String((n += 1)).padStart(12, '0')}`;
};
type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu').map((s) => s.felder);
const daten = (f: Record<string, unknown> | undefined) => (f?.['daten'] ?? {}) as Record<string, unknown>;

const LOLLO = GLEICH.lollo.map((nr) => satzId(nr));
const EICHBLATT = satzId(GLEICH.eichblatt);
const LEER: GruppenWahl = { gruppe: {}, satz: {} };

/** die eine Fragekarte mit diesem Titel */
function karteVon(t: Teile, jetzt: Date, titel = GLEICH_TITEL): Fragekarte {
  const k = phasenKarten(t, jetzt, Z, PHASENLOGIK_AB).fragen.find((x) => x.titel === titel);
  if (!k) throw new Error(`keine Karte «${titel}»`);
  return k;
}

/** Vorgang aus den Gruppenantworten und aus denselben Einzelantworten, je mit frischem Zähler */
function beideVorgaenge(
  t: Teile,
  jetzt: Date,
  gruppenwahl: GruppenWahl,
  einzeln: { satzId: string; antwort: 'ja' | 'noch_nicht' | 'problem' }[],
): { gruppe: Vorgang; einzeln: Vorgang } {
  const gruppen = phasenGruppen(t, karteVon(t, jetzt));
  return {
    gruppe: antwortVorgang(t, gruppenAntworten(gruppen, gruppenwahl), zaehler(), jetzt, Z, PHASENLOGIK_AB),
    einzeln: antwortVorgang(t, einzeln, zaehler(), jetzt, Z, PHASENLOGIK_AB),
  };
}

describe('UX4-AK1 phasenGruppen und gruppenAntworten', () => {
  it('UX4-AK1 phasenGruppen fasst 5 Sätze Lollo Rossa Keimung → Anzucht einer Karte zu einer Gruppe mit pflanzungen 5 zusammen; Eichblatt bildet eine eigene Gruppe', () => {
    const t = gleicheSaetzeTeile();
    const karte = karteVon(t, J);
    expect(karte.zeilen).toHaveLength(6);
    const gruppen = phasenGruppen(t, karte);
    expect(gruppen).toHaveLength(2);
    const [lollo, eichblatt] = gruppen;
    expect(lollo).toMatchObject({
      schluessel: `${SORTE.lollo}|kopf|keimung|anzucht`,
      sorte: 'Lollo Rossa',
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      von: 'keimung',
      nach: 'anzucht',
      uebergang: 'Keimung → Anzucht',
      text: 'Tag 4 von 2–7',
      frage: 'Keimblätter offen',
      pruefen: false,
      pflanzungen: 5,
    });
    expect(lollo?.zeilen.map((z) => z.satzId)).toEqual(LOLLO);
    expect(eichblatt).toMatchObject({
      schluessel: `${SORTE.eichblatt}|kopf|keimung|anzucht`,
      sorte: 'Eichblatt',
      pflanzungen: 1,
    });
    expect(eichblatt?.zeilen.map((z) => z.satzId)).toEqual([EICHBLATT]);
    // die Zeilen sind die der Karte, unverändert
    expect(gruppen.flatMap((g) => g.zeilen)).toEqual(karte.zeilen);
  });

  it('UX4-AK1 gleiche Sorte mit anderem Übergang oder anderer Kulturform bildet eine eigene Gruppe', () => {
    // 23.1.2027 09:00 Zürich: 81 und 84 kopf in Keimung (Frage seit 11.1.), 82 kopf in Anzucht seit 11.1. (Frage 23.1.),
    // 83 schnitt in Keimung; alle Lollo Rossa, gesät 7.1. in A1
    const jetzt = new Date('2027-01-23T08:00:00Z');
    const t = phasenTeile(jetzt);
    const satz = (nr: number, kulturform: string) =>
      phasenSatz(t, { nr, sorteId: SORTE.lollo, kulturform, saatdatum: GLEICH_SAAT, pflanzungen: 1 });
    satz(81, 'kopf');
    satz(82, 'kopf');
    antwortDazu(t, { nr: 82, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
    satz(83, 'schnitt');
    satz(84, 'kopf');
    phasenNachrechnen(t);

    const gruppen = phasenGruppen(t, karteVon(t, jetzt));
    expect(gruppen.map((g) => g.schluessel)).toEqual([
      `${SORTE.lollo}|kopf|keimung|anzucht`,
      `${SORTE.lollo}|kopf|anzucht|wachstum`,
      `${SORTE.lollo}|schnitt|keimung|anzucht`,
    ]);
    expect(gruppen.map((g) => g.zeilen.map((z) => z.satzId))).toEqual([
      [satzId(81), satzId(84)],
      [satzId(82)],
      [satzId(83)],
    ]);
    expect(gruppen.map((g) => g.pflanzungen)).toEqual([2, 1, 1]);
    expect(gruppen[1]).toMatchObject({ uebergang: 'Anzucht → Wachstum', von: 'anzucht', nach: 'wachstum' });
    expect(new Set(gruppen.map((g) => g.schluessel)).size).toBe(gruppen.length);
  });

  it('UX4-AK1 Gruppe «Ja»: antwortVorgang(gruppenAntworten(...)) ist gleich antwortVorgang mit den 5 Einzelantworten «Ja» (gleiche ids-Folge, gleiches jetzt; satz_id, daten, war_faellig_am, aufgabe_schluessel, gilt_ab)', () => {
    const t = gleicheSaetzeTeile();
    const gruppen = phasenGruppen(t, karteVon(t, J));
    const lolloSchluessel = gruppen[0]?.schluessel ?? '';
    const wahl: GruppenWahl = { gruppe: { [lolloSchluessel]: 'ja' }, satz: {} };
    expect(gruppenAntworten(gruppen, wahl)).toEqual([
      ...LOLLO.map((s) => ({ satzId: s, antwort: 'ja' })),
      { satzId: EICHBLATT, antwort: 'ja' },
    ]);
    // ohne jede Wahl ebenfalls «Ja» (vorgewählt)
    expect(gruppenAntworten(gruppen, LEER)).toEqual(gruppenAntworten(gruppen, wahl));

    const v = beideVorgaenge(
      t,
      J,
      wahl,
      [...LOLLO, EICHBLATT].map((s) => ({ satzId: s, antwort: 'ja' as const })),
    );
    expect(v.gruppe).toEqual(v.einzeln);
    const felder = neue(v.gruppe);
    expect(felder).toHaveLength(6);
    expect(felder.slice(0, 5).map((f) => f['satz_id'])).toEqual(LOLLO);
    for (const f of felder) {
      expect(f).toMatchObject({
        typ: 'phase_antwort',
        gilt_ab: J.toISOString(),
        war_faellig_am: '2027-01-11',
        aufgabe_schluessel: `phase_bestaetigen|${String(f['satz_id'])}|2027-01-11`,
      });
      expect(daten(f)).toMatchObject({ phase: 'anzucht', antwort: 'ja', nachgefuehrt: false });
    }
  });

  it('UX4-AK1 Gruppe «Ja» mit Einzelwahl «Noch nicht» für Satz 3 ist gleich den Einzelantworten 4 × ja, 1 × noch_nicht in der Reihenfolge der Karte', () => {
    const t = gleicheSaetzeTeile();
    const gruppen = phasenGruppen(t, karteVon(t, J));
    const s3 = LOLLO[2] as string;
    const wahl: GruppenWahl = {
      gruppe: { [gruppen[0]?.schluessel ?? '']: 'ja' },
      satz: { [s3]: 'noch_nicht' },
    };
    const erwartet = [...LOLLO, EICHBLATT].map((s) => ({
      satzId: s,
      antwort: s === s3 ? ('noch_nicht' as const) : ('ja' as const),
    }));
    expect(gruppenAntworten(gruppen, wahl)).toEqual(erwartet);
    const v = beideVorgaenge(t, J, wahl, erwartet);
    expect(v.gruppe).toEqual(v.einzeln);
    const felder = neue(v.gruppe);
    expect(felder.map((f) => daten(f)['antwort'])).toEqual(['ja', 'ja', 'noch_nicht', 'ja', 'ja', 'ja']);
    expect(felder[2]?.['satz_id']).toBe(s3);
  });

  it('UX4-AK1 Gruppe «Problem» und «Noch nicht» gelten für alle Sätze der Gruppe; eine spätere Gruppenwahl löscht die Einzelwahl nicht in gruppenAntworten, das Löschen ist Sache der Maske', () => {
    const t = gleicheSaetzeTeile();
    const gruppen = phasenGruppen(t, karteVon(t, J));
    const lollo = gruppen[0]?.schluessel ?? '';
    const eichblatt = gruppen[1]?.schluessel ?? '';

    const problem = gruppenAntworten(gruppen, { gruppe: { [lollo]: 'problem' }, satz: {} });
    expect(problem.map((a) => a.antwort)).toEqual([
      'problem',
      'problem',
      'problem',
      'problem',
      'problem',
      'ja',
    ]);
    const nochNicht = gruppenAntworten(gruppen, {
      gruppe: { [lollo]: 'noch_nicht', [eichblatt]: 'problem' },
      satz: {},
    });
    expect(nochNicht.map((a) => a.antwort)).toEqual([
      'noch_nicht',
      'noch_nicht',
      'noch_nicht',
      'noch_nicht',
      'noch_nicht',
      'problem',
    ]);

    // Einzelwahl vor Gruppe vor «ja»
    const s1 = LOLLO[0] as string;
    const gemischt = gruppenAntworten(gruppen, {
      gruppe: { [lollo]: 'problem' },
      satz: { [s1]: 'ja', [EICHBLATT]: 'noch_nicht' },
    });
    expect(gemischt).toEqual([
      { satzId: s1, antwort: 'ja' },
      ...LOLLO.slice(1).map((s) => ({ satzId: s, antwort: 'problem' })),
      { satzId: EICHBLATT, antwort: 'noch_nicht' },
    ]);
    const v = antwortVorgang(t, gemischt, zaehler(), J, Z, PHASENLOGIK_AB);
    expect(neue(v).map((f) => daten(f)['antwort'])).toEqual([
      'ja',
      'problem',
      'problem',
      'problem',
      'problem',
      'noch_nicht',
    ]);
  });

  it('UX4-AK1 ein Satz mit 2 Pflanzungen zählt 2 in pflanzungen, bleibt eine Zeile und erhält ein Ereignis', () => {
    const t = phasenTeile(J);
    for (const nr of GLEICH.lollo)
      phasenSatz(t, {
        nr,
        sorteId: SORTE.lollo,
        kulturform: 'kopf',
        saatdatum: GLEICH_SAAT,
        pflanzungen: nr === 83 ? 2 : 1,
      });
    phasenNachrechnen(t);
    const gruppen = phasenGruppen(t, karteVon(t, J));
    expect(gruppen).toHaveLength(1);
    expect(gruppen[0]?.pflanzungen).toBe(6);
    expect(gruppen[0]?.zeilen.map((z) => z.satzId)).toEqual(LOLLO);
    const antworten = gruppenAntworten(gruppen, LEER);
    expect(antworten).toHaveLength(5);
    const felder = neue(antwortVorgang(t, antworten, zaehler(), J, Z, PHASENLOGIK_AB));
    expect(felder).toHaveLength(5);
    expect(felder.filter((f) => f['satz_id'] === satzId(83))).toHaveLength(1);
  });

  it('UX4-AK1 pruefen der Gruppe ist wahr, sobald ein Satz pruefen trägt', () => {
    // 26.1.2027 09:00 Zürich: 81 in Anzucht seit 14.1. (Tag 12, nicht prüfen), 82 seit 11.1. (Tag 15 > max 14, prüfen)
    const jetzt = new Date('2027-01-26T08:00:00Z');
    const t = phasenTeile(jetzt);
    phasenSatz(t, {
      nr: 81,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: GLEICH_SAAT,
      pflanzungen: 1,
    });
    antwortDazu(t, { nr: 81, phase: 'anzucht', tag: '2027-01-14', erwartetAm: '2027-01-11' });
    phasenSatz(t, {
      nr: 82,
      sorteId: SORTE.lollo,
      kulturform: 'kopf',
      saatdatum: GLEICH_SAAT,
      pflanzungen: 1,
    });
    antwortDazu(t, { nr: 82, phase: 'anzucht', tag: '2027-01-11', erwartetAm: '2027-01-11' });
    phasenNachrechnen(t);

    const karte = karteVon(t, jetzt);
    expect(karte.zeilen.map((z) => z.pruefen)).toEqual([false, true]);
    const gruppen = phasenGruppen(t, karte);
    expect(gruppen).toHaveLength(1);
    expect(gruppen[0]?.pruefen).toBe(true);
    // abweichende Texte: der des ältesten Phasenbeginns (82, Anzucht seit 11.1.), nicht der ersten Zeile (A3)
    expect(gruppen[0]?.text).toBe('Tag 15 von 10–14');

    // ohne prüfenden Satz: falsch
    const ohne = gleicheSaetzeTeile();
    expect(phasenGruppen(ohne, karteVon(ohne, J)).map((g) => g.pruefen)).toEqual([false, false]);
  });

  it('UX4-AK1 keine pflanzung_id in den Antworten (R1.5 am Satz); vorgangPruefen ohne Verstoss', () => {
    const t = gleicheSaetzeTeile();
    const gruppen = phasenGruppen(t, karteVon(t, J));
    const antworten = gruppenAntworten(gruppen, {
      gruppe: { [gruppen[0]?.schluessel ?? '']: 'ja' },
      satz: { [LOLLO[2] as string]: 'noch_nicht' },
    });
    for (const a of antworten) expect(Object.keys(a).sort()).toEqual(['antwort', 'satzId']);
    const v = antwortVorgang(t, antworten, zaehler(), J, Z, PHASENLOGIK_AB);
    expect(v).toHaveLength(6);
    for (const f of neue(v)) {
      expect(f['pflanzung_id'] ?? null).toBeNull();
      expect(daten(f)['ausloesende_pflanzung_id']).toBeUndefined();
      expect(typeof f['satz_id']).toBe('string');
    }
    expect(vorgangPruefen(v)).toEqual([]);
  });

  it('UX4-AK1 TZ Frage am 23:30 Zürich fällig: Gruppenantwort trägt denselben war_faellig_am wie die Einzelantwort', () => {
    // 11.1. 23:30 Zürich (Winterzeit, 22:30 UTC) und 11.1. 00:30 Zürich (10.1. 23:30 UTC): derselbe Kalendertag
    for (const jetzt of [new Date('2027-01-11T22:30:00Z'), new Date('2027-01-10T23:30:00Z')]) {
      const t = gleicheSaetzeTeile(jetzt);
      const v = beideVorgaenge(
        t,
        jetzt,
        LEER,
        [...LOLLO, EICHBLATT].map((s) => ({ satzId: s, antwort: 'ja' as const })),
      );
      expect(v.gruppe).toEqual(v.einzeln);
      for (const f of neue(v.gruppe)) {
        expect(f['war_faellig_am']).toBe('2027-01-11');
        expect(f['gilt_ab']).toBe(jetzt.toISOString());
      }
    }
    // 10.1. 23:30 Zürich: noch keine Karte, also auch keine Gruppe
    const vorher = new Date('2027-01-10T22:30:00Z');
    const t = gleicheSaetzeTeile(vorher);
    expect(
      phasenKarten(t, vorher, Z, PHASENLOGIK_AB).fragen.find((k) => k.titel === GLEICH_TITEL),
    ).toBeUndefined();
  });
});
