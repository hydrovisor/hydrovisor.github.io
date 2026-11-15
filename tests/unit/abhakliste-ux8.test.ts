// UX8 (Issue #230, Plan 230): Spülen in der Dosierzeile. Die Abhakliste Lösungswechsel hat 16 Zeilen; die Zeilen 6 und 8
// «Messbecher spülen» entfallen, Micro (5) und Grow (7) tragen den Hinweis «danach Messbecher spülen». Nummern,
// Messzeilen 3, 14, 17, Timer und Mengen bleiben; laufende Wechsel mit Zeilen 6 und 8 (lokaler Stand oder Bündel)
// lassen sich fortsetzen und abschliessen (Entscheid Tims vom 14.11.2026, Abweichung von R4.6; 8.1 Regel 2).
// Injizierte Uhr, Zeitzone Europe/Zurich. Rechenbeispiel 2.3 aus Konzept R4.2 und UC7-AK1: 9 l, Wachstum,
// Zielbereich 1.0 bis 1.4, Wasser 0.5, k 0.3, Teil-Dosis 100 % → Micro 7.0, Grow 10.5, Bloom 3.5 ml.
//
// Vertrag (Plan 230 «Betroffene Dateien»):
//   zeilen.ts  zeilenAus() ohne Zeilen 6 und 8; hinweis 'danach Messbecher spülen' an 5 und 7;
//              ENTFALLENE_ZEILEN = [6, 8] (A1)
//   stand.ts   defsUebernehmen() lässt Zeilen ohne Definition weg; abwaehlbar() prüft die nächste Zeile der Liste;
//              standAusSchritten() übergeht Schritte 6 und 8
//   block.ts   buendelZeile(): nächste Zeile der Liste nach der höchsten erledigten, Schritte spuelen zählen nicht
import { describe, expect, it } from 'vitest';
import { buendelZeile, wechselblock, type BlockGlied } from '../../src/domain/abhakliste/block.ts';
import {
  abhaken,
  abwaehlbar,
  aktiveZeile,
  aufzugAbhaken,
  defsUebernehmen,
  messungZuordnen,
  rueckfrage,
  rueckfrageBeantworten,
  standAusSchritten,
  standNeu,
  timerEnde,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import { abschlussVorgang } from '../../src/domain/abhakliste/vorgaenge.ts';
import * as zeilenModul from '../../src/domain/abhakliste/zeilen.ts';
import { zeilenAus, type ZeileDef } from '../../src/domain/abhakliste/zeilen.ts';
import type { Schritt } from '../../src/domain/datenpfad/erfassung.ts';
import type { Kalibrierstand } from '../../src/domain/kalibrierung/stand.ts';
import { neuansatz, type NeuansatzErgebnis } from '../../src/domain/rechner.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import { ansatzTeile, laufenderWechsel } from '../fixtures/ansatz.ts';
import { aufgabe, um } from '../fixtures/wechselblock.ts';

// 12.1.2027 18:30 Zürich
const T0 = new Date('2027-01-12T17:30:00.000Z');
const min = (m: number, s = 0) => new Date(T0.getTime() + (m * 60 + s) * 1000);
const PLATZ = '2b000000-0000-4000-8000-000000000005';
const ANSATZ = '29000000-0000-4000-8000-000000000001';
const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;
const SPUELHINWEIS = 'danach Messbecher spülen';
/** Zeilen der neuen Abhakliste (16) */
const NEUE_NR = [0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function rechnung(): NeuansatzErgebnis {
  const r = neuansatz({
    volumen: 900,
    stadium: 'wachstum',
    zielbereich: { min: 100, max: 140 },
    ecWasser: 50,
    k: K,
    teilDosis: 100,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
  });
  if (r.art !== 'ergebnis') throw new Error('Rechnung erwartet');
  return r;
}

const GUELTIG: Kalibrierstand = {
  art: 'gueltig',
  letzte: '2027-01-11T07:00:00.000Z',
  faelligAm: '2027-01-31',
};

function defs(): ZeileDef[] {
  return zeilenAus(
    {
      rechnung: rechnung(),
      ersterAnsatz: false,
      volumen: 900,
      kalibrierung: GUELTIG,
      festeTermine: ['2027-01-31', '2027-02-24'],
      phZiel: 625,
    },
    T0,
    ZEITZONE,
  );
}

/** Definition vor UX8: die neuen Zeilen plus «Messbecher spülen» in 6 und 8 (alter lokaler Stand) */
function alteDefs(): ZeileDef[] {
  const spuelen = (nr: number): ZeileDef => ({
    nr,
    schritt: 'spuelen',
    titel: 'Messbecher spülen',
    aufzuege: 1,
  });
  const ohne = defs().filter((d) => d.nr !== 6 && d.nr !== 8);
  return [...ohne, spuelen(6), spuelen(8)].sort((a, b) => a.nr - b.nr);
}

const def = (d: readonly ZeileDef[], nr: number) => {
  const z = d.find((x) => x.nr === nr);
  if (!z) throw new Error(`Zeile ${nr} fehlt`);
  return z;
};
const zeile = (s: AblaufStand, nr: number) => {
  const z = s.zeilen.find((x) => x.nr === nr);
  if (!z) throw new Error(`Zeilenstand ${nr} fehlt`);
  return z;
};
const nummern = (s: AblaufStand) => s.zeilen.map((z) => z.nr);
const erledigt = (s: AblaufStand) => s.zeilen.filter((z) => z.erledigtAm !== undefined).map((z) => z.nr);

function neu(d: readonly ZeileDef[] = defs()): AblaufStand {
  return standNeu({ platzId: PLATZ, code: 'R-2.3', ansatzId: ANSATZ, defs: d }, T0);
}

type Messung = Parameters<typeof messungZuordnen>[2];
const MESSUNG: Readonly<Record<number, Messung>> = {
  3: { id: '24000000-0000-4000-8000-000000000301', ec: 50, temperatur: 2000 },
  14: { id: '24000000-0000-4000-8000-000000000314', ph: 620, ec: 120, temperatur: 2000 },
  17: { id: '24000000-0000-4000-8000-000000000317', ph: 620, ec: 120, temperatur: 2000 },
};

/** hakt die Zeilen der Reihe nach ab, je eine Minute nach `ab`; Messzeilen erhalten vorher ihre Messung */
function bis(s: AblaufStand, nrs: readonly number[], ab: number): AblaufStand {
  return nrs.reduce((st, nr, i) => {
    const m = MESSUNG[nr];
    return abhaken(m ? messungZuordnen(st, nr, m) : st, nr, min(ab + i));
  }, s);
}

/** hakt ab der aktiven Zeile alles bis 17 ab; Timerzeilen genau an ihrem Ende */
function fertig(s: AblaufStand, ab: Date): AblaufStand {
  let st = s;
  let t = ab;
  for (let runde = 0; runde < 30; runde += 1) {
    const nr = aktiveZeile(st);
    if (nr === undefined) return st;
    const ende = timerEnde(st, nr);
    if (ende && ende > t) t = ende;
    const m = MESSUNG[nr];
    const vorher = st;
    st = abhaken(m ? messungZuordnen(st, nr, m) : st, nr, t);
    if (zeile(st, nr).erledigtAm === undefined || st === vorher)
      throw new Error(`Zeile ${nr} nicht abhakbar`);
    t = new Date(t.getTime() + 60_000);
  }
  throw new Error('Liste endet nicht');
}

/** fester ids-Zähler */
function zaehler(praefix = '4e'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${praefix}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

describe('UX8-AK1 16 Zeilen, Spülen in der Dosierzeile', () => {
  it('UX8-AK1 zeilenAus liefert 16 Zeilen mit nr 0–5, 7, 9–17 und ohne Schritt spuelen', () => {
    const d = defs();
    expect(d).toHaveLength(16);
    expect(d.map((z) => z.nr)).toEqual(NEUE_NR);
    expect(d.map((z) => z.schritt)).not.toContain('spuelen');
    expect(d.map((z) => z.titel)).not.toContain('Messbecher spülen');
    // ENTFALLENE_ZEILEN als benannte Konstante (A1)
    expect((zeilenModul as Record<string, unknown>)['ENTFALLENE_ZEILEN']).toEqual([6, 8]);
  });

  it('UX8-AK1 Micro und Grow tragen den Hinweis «danach Messbecher spülen», Bloom nicht', () => {
    const d = defs();
    expect(def(d, 5).hinweis).toBe(SPUELHINWEIS);
    expect(def(d, 7).hinweis).toBe(SPUELHINWEIS);
    expect(def(d, 9).hinweis).toBeUndefined();
    // der Hinweis hängt nicht am Messmittel (A5): auch ohne Rechnung
    const ohne = zeilenAus(
      {
        rechnung: undefined,
        ersterAnsatz: false,
        volumen: 900,
        kalibrierung: GUELTIG,
        festeTermine: [],
        phZiel: 625,
      },
      T0,
      ZEITZONE,
    );
    expect([def(ohne, 5).hinweis, def(ohne, 7).hinweis, def(ohne, 9).hinweis]).toEqual([
      SPUELHINWEIS,
      SPUELHINWEIS,
      undefined,
    ]);
  });

  it('UX8-AK1 Mengen 70 / 105 / 35, Timer 11, 13, 16 und Messfelder 3, 14, 17 unverändert; Timer 11 endet Haken 10 + 15 min', () => {
    const d = defs();
    expect(d.map((z) => z.schritt)).toEqual([
      'kalibrierung_pruefen',
      'absaugen',
      'frischwasser',
      'frischwasser_messen',
      'gerechnet_fuer',
      'micro',
      'grow',
      'bloom',
      'umruehren',
      'timer',
      'ph_einstellen',
      'timer',
      'kontrollmessung',
      'restdosis',
      'timer',
      'endmessung',
    ]);
    expect([def(d, 5).sollMl, def(d, 7).sollMl, def(d, 9).sollMl]).toEqual([70, 105, 35]);
    expect([def(d, 5).zugabe, def(d, 7).zugabe, def(d, 9).zugabe]).toEqual(['Micro', 'Grow', 'Bloom']);
    expect([def(d, 11).timerMin, def(d, 13).timerMin, def(d, 16).timerMin]).toEqual([15, 15, 15]);
    expect(def(d, 3).messfelder).toEqual(['ec', 'temperatur']);
    expect(def(d, 14).messfelder).toEqual(['ph', 'ec', 'temperatur']);
    expect(def(d, 17).messfelder).toEqual(['ph', 'ec', 'temperatur']);
    // Zeile 10 um T0 + 8 min (neun Haken 0–5, 7, 9, 10): Zeile 11 frei genau 15 min danach
    const s = bis(neu(), [0, 1, 2, 3, 4, 5, 7, 9, 10], 0);
    expect(erledigt(s)).toEqual([0, 1, 2, 3, 4, 5, 7, 9, 10]);
    expect(aktiveZeile(s)).toBe(11);
    expect(timerEnde(s, 11)?.toISOString()).toBe(min(23).toISOString());
    expect(abhaken(s, 11, min(22, 59))).toEqual(s);
    expect(zeile(abhaken(s, 11, min(23)), 11).erledigtAm).toBe(min(23).toISOString());
  });
});

describe('UX8-AK2 laufende Wechsel mit Zeilen 6 und 8 (8.1 Regel 2)', () => {
  it('UX8-AK2 alter Stand mit 18 Zeilen und offener Zeile 6: nach defsUebernehmen ist 7 aktiv, erledigte Zeilen 0–5 mit istMl und schrittClientId erhalten, bis 17 abschliessbar (abschlussVorgang schreibt Zeile 17)', () => {
    let alt = bis(neu(alteDefs()), [0, 1, 2, 3, 4, 5], 1);
    expect(aktiveZeile(alt)).toBe(6);
    // Kopf und Schritte 4 und 5 schon gesendet (wie nach schrittVorgang)
    alt = {
      ...alt,
      kopfGeschrieben: true,
      volumen: 900,
      zeilen: alt.zeilen.map((z) =>
        z.nr === 4 || z.nr === 5
          ? { ...z, schrittClientId: `4e000000-0000-4000-8000-00000000010${z.nr}` }
          : z,
      ),
    };
    const vorher = JSON.parse(JSON.stringify(alt)) as AblaufStand;

    const s = defsUebernehmen(alt, defs());
    expect(nummern(s)).toEqual(NEUE_NR);
    expect(aktiveZeile(s)).toBe(7);
    expect(erledigt(s)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const nr of [0, 1, 2, 3, 4, 5]) expect(zeile(s, nr), `Zeile ${nr}`).toEqual(zeile(vorher, nr));
    expect(zeile(s, 5).istMl).toBe(70);
    expect(zeile(s, 5).schrittClientId).toBe('4e000000-0000-4000-8000-000000000105');
    expect(s.ausstehend).toEqual(vorher.ausstehend);

    const ende = fertig(s, min(8));
    expect(aktiveZeile(ende)).toBeUndefined();
    expect(erledigt(ende)).toEqual(NEUE_NR);
    const { vorgang } = abschlussVorgang(
      ende,
      { ecErwartetFinal: 120, kVorschlag: 280, echt: true },
      zaehler(),
    );
    const schritt17 = vorgang.find((v) => v.art === 'neu' && v.tabelle === 'ansatz_schritt');
    expect(schritt17?.art === 'neu' ? schritt17.felder : undefined).toMatchObject({
      ansatz_id: ANSATZ,
      nr: 17,
      schritt: 'endmessung',
    });
  });

  it('UX8-AK2 alter Stand mit abgehakter Zeile 6 und offenem Grow: Haken 0–5 erhalten, ausstehende Schritte unverändert, 7 aktiv', () => {
    const ausstehend: Schritt[] = [
      {
        art: 'neu',
        tabelle: 'ansatz_schritt',
        felder: {
          id: '4e000000-0000-4000-8000-000000000206',
          client_id: '4e000000-0000-4000-8000-000000000206',
          ansatz_id: ANSATZ,
          nr: 6,
          schritt: 'spuelen',
          erledigt_am: min(7).toISOString(),
        },
      } as Schritt,
    ];
    const alt = { ...bis(neu(alteDefs()), [0, 1, 2, 3, 4, 5, 6], 1), ausstehend };
    expect(erledigt(alt)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const vorher = JSON.parse(JSON.stringify(alt)) as AblaufStand;

    const s = defsUebernehmen(alt, defs());
    expect(nummern(s)).toEqual(NEUE_NR);
    expect(erledigt(s)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const nr of [0, 1, 2, 3, 4, 5]) expect(zeile(s, nr), `Zeile ${nr}`).toEqual(zeile(vorher, nr));
    // der Schritt 6 bleibt ausstehend und wird gesendet (Ereignis bleibt gültig, A2)
    expect(s.ausstehend).toEqual(vorher.ausstehend);
    expect(aktiveZeile(s)).toBe(7);
    expect(zeile(abhaken(s, 7, min(9)), 7).istMl).toBe(105);
  });

  it('UX8-AK2 standAusSchritten mit Schritten 0–8 inklusive spuelen 6 und 8: 9 aktiv, keine Zeile 6 oder 8 im Stand', () => {
    const TYP = [
      'kalibrierung_pruefen',
      'absaugen',
      'frischwasser',
      'frischwasser_messen',
      'gerechnet_fuer',
      'micro',
      'spuelen',
      'grow',
      'spuelen',
    ];
    const schritte = TYP.map((schritt, nr) => ({
      nr,
      schritt,
      erledigt_am: min(nr).toISOString(),
      storniert_am: null,
      client_id: `4e000000-0000-4000-8000-0000000003${String(nr).padStart(2, '0')}`,
      ist_ml: nr === 5 ? 7 : nr === 7 ? 10.5 : null,
    }));
    const s = standAusSchritten(
      {
        platzId: PLATZ,
        code: 'R-2.3',
        ansatzId: ANSATZ,
        defs: defs(),
        schritte,
        begonnenAm: min(1).toISOString(),
        volumen: 900,
      },
      min(10),
    );
    expect(nummern(s)).toEqual(NEUE_NR);
    expect(erledigt(s)).toEqual([0, 1, 2, 3, 4, 5, 7]);
    expect(aktiveZeile(s)).toBe(9);
    expect(zeile(s, 7).istMl).toBe(105);
    expect(zeile(s, 7).schrittClientId).toBe('4e000000-0000-4000-8000-000000000307');
  });

  it('UX8-AK2 buendelZeile: höchste erledigte 5 → 7, 6 → 7, 7 → 9, 8 → 9; storniertes 5 bei gültigem 6 → 5; Text «Grow» bzw. «Bloom»', () => {
    const TYP = ['kalibrierung_pruefen', 'absaugen', 'frischwasser', 'frischwasser_messen', 'gerechnet_fuer'];
    const TYP_ALT = [...TYP, 'micro', 'spuelen', 'grow', 'spuelen'];
    const schritte = (bisNr: number) =>
      TYP_ALT.slice(0, bisNr + 1).map((schritt, nr) => ({
        nr,
        schritt,
        erledigt_am: min(nr).toISOString(),
        storniert_am: null as string | null,
      }));
    expect(buendelZeile(schritte(5), null).zeile).toBe(7);
    expect(buendelZeile(schritte(6), null).zeile).toBe(7);
    expect(buendelZeile(schritte(7), null).zeile).toBe(9);
    expect(buendelZeile(schritte(8), null).zeile).toBe(9);
    const storno5 = schritte(6).map((x) => (x.nr === 5 ? { ...x, storniert_am: min(7).toISOString() } : x));
    expect(buendelZeile(storno5, null).zeile).toBe(5);

    // Text im Block: «2.3 · Zeile 7 Grow», «2.3 · Zeile 9 Bloom» (Gerätewechsel, Bündel mit Altdaten)
    const glied = (bisNr: number): BlockGlied | undefined =>
      wechselblock(
        { teile: laufenderWechsel(ansatzTeile(), bisNr), aufgaben: [aufgabe({ kennung: '1.1' })], lokal: [] },
        um('18:50'),
        ZEITZONE,
      )[0]?.glieder.find((g) => g.kennung === '2.3');
    expect(glied(5)).toMatchObject({ zeile: 7, zeilenText: 'Grow', quelle: 'buendel' });
    expect(glied(6)).toMatchObject({ zeile: 7, zeilenText: 'Grow', quelle: 'buendel' });
    expect(glied(7)).toMatchObject({ zeile: 9, zeilenText: 'Bloom', quelle: 'buendel' });
    expect(glied(8)).toMatchObject({ zeile: 9, zeilenText: 'Bloom', quelle: 'buendel' });
  });

  it('UX8-AK2 abwaehlbar: nach 5 ist 5 abwählbar, nach Aufzug in 7 nicht mehr', () => {
    const d = defs().map((z) => (z.nr === 7 ? { ...z, sollMl: 610, aufzuege: 2 } : z));
    const nachFuenf = bis(neu(d), [0, 1, 2, 3, 4, 5], 1);
    expect(aktiveZeile(nachFuenf)).toBe(7);
    expect(abwaehlbar(nachFuenf, 5)).toBe(true);
    const begonnen = aufzugAbhaken(nachFuenf, 7, min(8));
    expect(zeile(begonnen, 7).begonnen).toBe(true);
    expect(zeile(begonnen, 7).erledigtAm).toBeUndefined();
    expect(abwaehlbar(begonnen, 5)).toBe(false);
  });

  it('UX8-AK2 Rückfrage nach 2:01 Pause vor Grow; «Ja, war schon drin» hakt 7 ab, 9 aktiv', () => {
    const vorGrow = abhaken(bis(neu(), [0, 1, 2, 3, 4], 1), 5, min(12));
    expect(aktiveZeile(vorGrow)).toBe(7);
    expect(rueckfrage(vorGrow, defs(), min(14), ZEITZONE)).toBeUndefined();
    expect(rueckfrage(vorGrow, defs(), min(14, 1), ZEITZONE)?.text).toBe(
      'Zuletzt bestätigt: Micro 7.0 ml um 18:42. Grow schon im Wasser?',
    );
    const ja = rueckfrageBeantworten(vorGrow, 'ja', min(15));
    expect(erledigt(ja)).toEqual([0, 1, 2, 3, 4, 5, 7]);
    expect(zeile(ja, 7).istMl).toBe(105);
    expect(aktiveZeile(ja)).toBe(9);
    const nein = rueckfrageBeantworten(vorGrow, 'nein', min(15));
    expect(erledigt(nein)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(aktiveZeile(nein)).toBe(7);
  });
});
