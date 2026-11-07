// Abhakliste Lösungswechsel: Zeilen und Ablaufstand (Plan 29 Testliste abhakliste-stand; Loesungswechsel-AK1, AK5
// als Regel; Konzept R4.6, R4.11, U4, U7, 8.1 Regel 2, 11.4). Injizierte Uhr, Zeitzone Europe/Zurich.
// Rechenbeispiel 2.3 aus Konzept R4.2 und UC7-AK1: 9 l, Wachstum, Zielbereich 1.0 bis 1.4, Wasser 0.5, k 0.3,
// Teil-Dosis 100 % → Grow 10.5, Micro 7.0, Bloom 3.5 ml. Rückfrage nach R4.6: «Zuletzt bestätigt: Micro 7.0 ml um
// 18:42. Grow schon im Wasser?».
//
// Vertrag (Plan 29 «Signaturen», vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/abhakliste/zeilen.ts
//     zeilenAus(e: { rechnung; ersterAnsatz; volumen (Hundertstel l); kalibrierung: Kalibrierstand; festeTermine;
//                    phZiel; restdosis? }, jetzt, zeitzone): ZeileDef[]
//     ZeileDef = { nr; schritt (Enum ansatz_schritt_typ); titel; sollMl? (Zehntel); messmittel?; aufzuege;
//                  timerMin?; messfelder?: ('ph' | 'ec' | 'temperatur')[]; hinweis? }
//   src/domain/abhakliste/stand.ts
//     standNeu(e: { platzId; code; ansatzId; defs: readonly ZeileDef[] }, jetzt): AblaufStand   (Konstruktor, vom
//       Testentwickler ergänzt; der Stand kennt danach Soll, Aufzüge und Timer seiner Zeilen und ist JSON-serialisierbar)
//     abhaken(stand, nr, jetzt), abwaehlen(stand, nr, jetzt), aufzugAbhaken(stand, nr, jetzt),
//     mengeAendern(stand, nr, istMl, jetzt), messungZuordnen(stand, nr, messung): AblaufStand
//       Ein unzulässiger Übergang gibt den Stand unverändert zurück (gleicher Inhalt).
//     aktiveZeile(stand): number | undefined; abwaehlbar(stand, nr): boolean
//     feldFrei(nr, eingabe: { ph?; ec?; temperatur? }, feld): boolean
//     rueckfrage(stand, defs, jetzt, zeitzone): { text: string } | undefined
//     rueckfrageBeantworten(stand, 'ja' | 'nein', jetzt): AblaufStand
//     wachBis(timerEnde: Date): Date
//     zustandAusSchritten(schritte, messungen): { status; abgeschlossenAm?; timerEnde?; kontrollmessungId?;
//       endmessungId? } mit derselben Regel wie ansatz_zustand_nachrechnen() (Zeitpunkte als ISO-Text oder Date)
import { describe, expect, it } from 'vitest';
import {
  abhaken,
  abwaehlbar,
  abwaehlen,
  aktiveZeile,
  aufzugAbhaken,
  feldFrei,
  mengeAendern,
  messungZuordnen,
  rueckfrage,
  rueckfrageBeantworten,
  standNeu,
  wachBis,
  zustandAusSchritten,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import { zeilenAus, type ZeileDef } from '../../src/domain/abhakliste/zeilen.ts';
import type { Kalibrierstand } from '../../src/domain/kalibrierung/stand.ts';
import { neuansatz, type NeuansatzErgebnis } from '../../src/domain/rechner.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';

// 12.1.2027 18:30 Zürich
const T0 = new Date('2027-01-12T17:30:00.000Z');
const min = (m: number, s = 0) => new Date(T0.getTime() + (m * 60 + s) * 1000);
const PLATZ = '2b000000-0000-4000-8000-000000000005';
const ANSATZ = '29000000-0000-4000-8000-000000000001';
const K = { grow: 300, micro_hard_water: 300, bloom: 300 } as const;

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

function defs(extra: Partial<Parameters<typeof zeilenAus>[0]> = {}): ZeileDef[] {
  return zeilenAus(
    {
      rechnung: rechnung(),
      ersterAnsatz: false,
      volumen: 900,
      kalibrierung: GUELTIG,
      festeTermine: ['2027-01-31', '2027-02-24'],
      phZiel: 625,
      ...extra,
    } as Parameters<typeof zeilenAus>[0],
    T0,
    ZEITZONE,
  );
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
const erledigt = (s: AblaufStand) => s.zeilen.filter((z) => z.erledigtAm !== undefined).map((z) => z.nr);

function neu(d: readonly ZeileDef[] = defs()): AblaufStand {
  return standNeu({ platzId: PLATZ, code: 'R-2.3', ansatzId: ANSATZ, defs: d }, T0);
}

type Messung = Parameters<typeof messungZuordnen>[2];
/** Messwerte der Messzeilen 3, 14, 17 in Hundertsteln (Frischwasser 0.50 bei 20 °C, Kontrolle und Ende 6.2 / 1.20) */
const MESSUNG: Readonly<Record<number, Messung>> = {
  3: { id: '24000000-0000-4000-8000-000000000301', ec: 50, temperatur: 2000 } as unknown as Messung,
  14: {
    id: '24000000-0000-4000-8000-000000000314',
    ph: 620,
    ec: 120,
    temperatur: 2000,
  } as unknown as Messung,
  17: {
    id: '24000000-0000-4000-8000-000000000317',
    ph: 620,
    ec: 120,
    temperatur: 2000,
  } as unknown as Messung,
};

/** hakt die Zeilen der Reihe nach ab, je eine Minute nach `ab`; Messzeilen erhalten vorher ihre Messung */
function bis(s: AblaufStand, nrs: readonly number[], ab: number): AblaufStand {
  return nrs.reduce((st, nr, i) => {
    const m = MESSUNG[nr];
    return abhaken(m ? messungZuordnen(st, nr, m) : st, nr, min(ab + i));
  }, s);
}

const iso = (x: unknown) => (x === undefined || x === null ? undefined : new Date(x as string).toISOString());

describe('Zeilen 0 bis 17 (R4.6)', () => {
  it('Loesungswechsel-AK1 Zeilen 0 bis 17 in fester Reihenfolge mit Schritt, Mengen aus dem Rechner, Timern und Messfeldern', () => {
    const d = defs();
    expect(d.map((z) => z.nr)).toEqual([...Array(18).keys()]);
    const schritte = d.map((z) => z.schritt);
    expect(schritte.slice(0, 16)).toEqual([
      'kalibrierung_pruefen',
      'absaugen',
      'frischwasser',
      'frischwasser_messen',
      'gerechnet_fuer',
      'micro',
      'spuelen',
      'grow',
      'spuelen',
      'bloom',
      'umruehren',
      'timer',
      'ph_einstellen',
      'timer',
      'kontrollmessung',
      'restdosis',
    ]);
    expect(['umruehren', 'timer']).toContain(schritte[16]);
    expect(schritte[17]).toBe('endmessung');
    expect(def(d, 2).titel).toBe('Frischwasser 9 l, temperiert');
    expect([def(d, 5).sollMl, def(d, 7).sollMl, def(d, 9).sollMl]).toEqual([70, 105, 35]);
    expect(def(d, 5).messmittel).toBeDefined();
    expect([def(d, 11).timerMin, def(d, 13).timerMin, def(d, 16).timerMin]).toEqual([15, 15, 15]);
    expect(def(d, 3).messfelder).toEqual(['ec', 'temperatur']);
    expect(def(d, 14).messfelder).toEqual(['ph', 'ec', 'temperatur']);
    expect(def(d, 17).messfelder).toEqual(['ph', 'ec', 'temperatur']);
    expect(def(d, 0).titel).toMatch(/^Kalibrierung gültig bis \d{2}\.\d{2}\.$/);
  });

  it('Loesungswechsel-AK1 Zeile 0: Ablauf in 3 Tagen ohne festen Termin → «zuerst kalibrieren, 10 min»; fester Termin am Ablauftag oder Ablauf in 4 Tagen → kein Hinweis', () => {
    const hinweis = (d: readonly ZeileDef[]) => JSON.stringify(def(d, 0).hinweis ?? '');
    const in3 = { ...GUELTIG, faelligAm: '2027-01-15' } as Kalibrierstand;
    const in4 = { ...GUELTIG, faelligAm: '2027-01-16' } as Kalibrierstand;
    expect(hinweis(defs({ kalibrierung: in3, festeTermine: ['2027-01-31'] }))).toContain(
      'zuerst kalibrieren, 10 min',
    );
    expect(hinweis(defs({ kalibrierung: in3, festeTermine: ['2027-01-15'] }))).not.toContain(
      'zuerst kalibrieren',
    );
    expect(hinweis(defs({ kalibrierung: in4, festeTermine: ['2027-01-31'] }))).not.toContain(
      'zuerst kalibrieren',
    );
    expect(hinweis(defs({ kalibrierung: { art: 'erstkalibrierung' } }))).toContain(
      'zuerst kalibrieren, 10 min',
    );
  });

  it('Loesungswechsel-AK1 der erste Ansatz zählt in Zeile 2 die Kannen (R4.4, Prüfschritt 4)', () => {
    expect(JSON.stringify(def(defs({ ersterAnsatz: true }), 2))).toContain('Kannen zählen');
    expect(JSON.stringify(def(defs(), 2))).not.toContain('Kannen zählen');
  });
});

describe('Haken in fester Reihenfolge (R4.6, U4)', () => {
  it('Loesungswechsel-AK1 nur die nächste offene Zeile ist abhakbar, Zeilen 0 bis 17 in fester Reihenfolge', () => {
    let s = neu();
    expect(aktiveZeile(s)).toBe(0);
    expect(abhaken(s, 1, min(1))).toEqual(s);
    expect(abhaken(s, 17, min(1))).toEqual(s);
    s = bis(s, [0, 1, 2], 1);
    expect(erledigt(s)).toEqual([0, 1, 2]);
    expect(aktiveZeile(s)).toBe(3);
    expect(abhaken(s, 5, min(5))).toEqual(s);
    // ein Haken übernimmt Soll als Ist
    s = bis(s, [3, 4, 5], 4);
    expect(zeile(s, 5).istMl).toBe(70);
    expect(aktiveZeile(s)).toBe(6);
  });

  it('Loesungswechsel-AK1 ein Haken ist abwählbar, solange die nächste Zeile nicht begonnen ist', () => {
    let s = bis(neu(), [0, 1], 1);
    expect(abwaehlbar(s, 1)).toBe(true);
    // nur die zuletzt erledigte Zeile
    expect(abwaehlbar(s, 0)).toBe(false);
    expect(abwaehlen(s, 0, min(3))).toEqual(s);
    s = abwaehlen(s, 1, min(3));
    expect(erledigt(s)).toEqual([0]);
    expect(aktiveZeile(s)).toBe(1);
    // ein laufender Timer zählt nicht als Beginn (A8)
    s = bis(neu(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1);
    expect(aktiveZeile(s)).toBe(11);
    expect(abwaehlbar(s, 10)).toBe(true);
  });

  it('Loesungswechsel-AK1 nach Aufzug, Menge ändern oder Messung der nächsten Zeile nicht mehr abwählbar', () => {
    const d = defs().map((z) => (z.nr === 5 ? { ...z, sollMl: 610, aufzuege: 2 } : z));
    const vorFuenf = bis(neu(d), [0, 1, 2, 3, 4], 1);
    expect(abwaehlbar(vorFuenf, 4)).toBe(true);
    expect(abwaehlbar(aufzugAbhaken(vorFuenf, 5, min(7)), 4)).toBe(false);
    expect(abwaehlbar(mengeAendern(vorFuenf, 5, 600, min(7)), 4)).toBe(false);
    const vorDrei = bis(neu(d), [0, 1, 2], 1);
    expect(abwaehlbar(vorDrei, 2)).toBe(true);
    const gemessen = messungZuordnen(vorDrei, 3, MESSUNG[3] as Messung);
    expect(abwaehlbar(gemessen, 2)).toBe(false);
    expect(abwaehlen(gemessen, 2, min(5))).toEqual(gemessen);
  });

  it('Loesungswechsel-AK1 pH vor EC: Kontroll- und Endmessung geben EC erst nach dem pH frei', () => {
    for (const nr of [14, 17]) {
      expect(feldFrei(nr, {}, 'ph')).toBe(true);
      expect(feldFrei(nr, {}, 'ec')).toBe(false);
      expect(feldFrei(nr, { temperatur: 2000 }, 'ec')).toBe(false);
      expect(feldFrei(nr, { ph: 620 }, 'ec')).toBe(true);
    }
    // Frischwasser messen (Zeile 3): EC und °C ohne pH
    expect(feldFrei(3, {}, 'ec')).toBe(true);
  });

  it('Loesungswechsel-AK1 «Menge ändern» setzt die Ist-Menge; 61.0 ml in 2 Aufzügen, erst der zweite Tipp hakt ab (R4.11)', () => {
    const d = defs().map((z) => (z.nr === 5 ? { ...z, sollMl: 610, aufzuege: 2 } : z));
    let s = bis(neu(d), [0, 1, 2, 3, 4], 1);
    s = aufzugAbhaken(s, 5, min(7));
    expect(zeile(s, 5).erledigtAm).toBeUndefined();
    expect(zeile(s, 5).aufzuegeErledigt).toBe(1);
    s = aufzugAbhaken(s, 5, min(8));
    expect(zeile(s, 5).erledigtAm).toBeDefined();
    expect(zeile(s, 5).istMl).toBe(610);
    const geaendert = abhaken(mengeAendern(bis(neu(), [0, 1, 2, 3, 4], 1), 5, 65, min(7)), 5, min(8));
    expect(zeile(geaendert, 5).istMl).toBe(65);
  });
});

describe('Timer gegen die absolute Endzeit (R4.6, U7, E-F4-6)', () => {
  it('Loesungswechsel-AK3 Zeile 11 gesperrt bis genau timerEnde = Haken Zeile 10 + 15 min, auch nach einem Neustart', () => {
    // Zeile 10 um T0 + 10 min
    const s = bis(neu(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0);
    expect(abhaken(s, 11, min(10, 1))).toEqual(s);
    expect(abhaken(s, 11, min(24, 59))).toEqual(s);
    expect(zeile(abhaken(s, 11, min(25)), 11).erledigtAm).toBeDefined();
    // Neustart: serialisierter Stand, 16 min nach dem Haken von Zeile 10
    const neustart = JSON.parse(JSON.stringify(s)) as AblaufStand;
    expect(zeile(abhaken(neustart, 11, min(26)), 11).erledigtAm).toBeDefined();
    expect(wachBis(min(25)).toISOString()).toBe(min(27).toISOString());
  });
});

describe('Rückfrage nach einer Pause (R4.6, A6)', () => {
  const vorGrow = () => abhaken(bis(neu(), [0, 1, 2, 3, 4], 1), 5, min(12));

  it('Loesungswechsel-AK5 genau 2:00 Pause ohne Rückfrage, 2:01 mit Zeitstempel: Zuletzt bestätigt: Micro 7.0 ml um 18:42. Grow schon im Wasser?', () => {
    const s = vorGrow();
    expect(rueckfrage(s, defs(), min(14), ZEITZONE)).toBeUndefined();
    expect(rueckfrage(s, defs(), min(14, 1), ZEITZONE)?.text).toBe(
      'Zuletzt bestätigt: Micro 7.0 ml um 18:42. Grow schon im Wasser?',
    );
  });

  it('Loesungswechsel-AK5 «Ja, war schon drin» hakt bis und mit Grow ab, «Nein, jetzt geben» lässt die Liste vor Grow', () => {
    const s = vorGrow();
    const ja = rueckfrageBeantworten(s, 'ja', min(15));
    expect(erledigt(ja)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(zeile(ja, 7).istMl).toBe(105);
    expect(aktiveZeile(ja)).toBe(8);
    const nein = rueckfrageBeantworten(s, 'nein', min(15));
    expect(erledigt(nein)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(aktiveZeile(nein)).toBe(6);
    expect(rueckfrage(nein, defs(), min(15), ZEITZONE)).toBeUndefined();
  });

  it('Loesungswechsel-AK5 Rückfrage nur im Dosierblock: nicht vor Zeile 5 und nicht vor einer Timer- oder Messzeile', () => {
    const vorMicro = bis(neu(), [0, 1, 2, 3, 4], 1);
    expect(rueckfrage(vorMicro, defs(), min(30), ZEITZONE)).toBeUndefined();
    const vorTimer = bis(neu(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0);
    expect(rueckfrage(vorTimer, defs(), min(40), ZEITZONE)).toBeUndefined();
  });
});

describe('Zustand aus Schritten wie in der Datenbank (8.1 Regel 2, Risiko 11; Fälle wie 16_ansatz_zustand)', () => {
  // 10.1.2027 in Zürich (UTC+1): erledigt_am je Zeile wie im pgTAP-Test
  const ZEITEN = [
    '18:00',
    '18:01',
    '18:05',
    '18:07',
    '18:08',
    '18:10',
    '18:11',
    '18:12',
    '18:13',
    '18:14',
    '18:15',
    '18:30',
    '18:35',
    '18:50',
    '18:52',
    '18:55',
    '19:10',
    '19:12',
  ];
  const zuerich = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number) as [number, number];
    return new Date(Date.UTC(2027, 0, 10, h - 1, m)).toISOString();
  };
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
    'bloom',
    'umruehren',
    'timer',
    'ph_einstellen',
    'timer',
    'kontrollmessung',
    'restdosis',
    'timer',
    'endmessung',
  ];
  const schritt = (nr: number, extra: Record<string, unknown> = {}) => ({
    nr,
    schritt: TYP[nr],
    erledigt_am: zuerich(ZEITEN[nr] as string),
    storniert_am: null as string | null,
    ...extra,
  });
  const bisNr = (n: number) => [...Array(n + 1).keys()].map((nr) => schritt(nr));
  type S = Parameters<typeof zustandAusSchritten>[0];
  type M = Parameters<typeof zustandAusSchritten>[1];
  const z = (s: unknown[], m: unknown[] = []) => {
    const r = zustandAusSchritten(s as unknown as S, m as unknown as M);
    return {
      status: r.status,
      abgeschlossenAm: iso(r.abgeschlossenAm),
      timerEnde: iso(r.timerEnde),
      kontrollmessungId: r.kontrollmessungId ?? undefined,
      endmessungId: r.endmessungId ?? undefined,
    };
  };

  it('Loesungswechsel-AK3 vertauschte Reihenfolge ergibt denselben Zustand: abgeschlossen 19:12, timer_ende 19:10', () => {
    const auf = z(bisNr(17));
    const gemischt = [17, 5, 0, 16, 3, 1, 15, 2, 12, 4, 14, 6, 13, 7, 11, 8, 10, 9].map((nr) => schritt(nr));
    expect(z(gemischt)).toEqual(auf);
    expect(auf).toMatchObject({
      status: 'abgeschlossen',
      abgeschlossenAm: zuerich('19:12'),
      timerEnde: zuerich('19:10'),
    });
  });

  it('Loesungswechsel-AK3 Timer: ohne Zeile 10 keiner, nach 10 um 18:30, nach 12 um 18:50, nach 15 um 19:10', () => {
    expect(z(bisNr(9)).timerEnde).toBeUndefined();
    expect(z(bisNr(10)).timerEnde).toBe(zuerich('18:30'));
    expect(z(bisNr(12)).timerEnde).toBe(zuerich('18:50'));
    expect(z(bisNr(15)).timerEnde).toBe(zuerich('19:10'));
  });

  it('Loesungswechsel-AK3 Storno rechnet zurück: Zeile 17 → laufend, Zeile 12 → Timer wieder aus Zeile 10', () => {
    const storno = '2027-01-10T18:30:00.000Z';
    const ohne17 = bisNr(17).map((s) => (s.nr === 17 ? { ...s, storniert_am: storno } : s));
    expect(z(ohne17)).toMatchObject({
      status: 'laufend',
      abgeschlossenAm: undefined,
      timerEnde: zuerich('19:10'),
    });
    const ohne12 = bisNr(12).map((s) => (s.nr === 12 ? { ...s, storniert_am: storno } : s));
    expect(z(ohne12).timerEnde).toBe(zuerich('18:30'));
  });

  it('Loesungswechsel-AK4 Abbruchzeile setzt abgebrochen mit ihrem erledigt_am, ihr Storno wieder laufend', () => {
    const abbruch = { ...schritt(8), schritt: 'abbruch', erledigt_am: zuerich('18:20') };
    expect(z([...bisNr(7), abbruch])).toMatchObject({
      status: 'abgebrochen',
      abgeschlossenAm: zuerich('18:20'),
    });
    const storniert = { ...abbruch, storniert_am: '2027-01-10T17:25:00.000Z' };
    expect(z([...bisNr(7), storniert])).toMatchObject({ status: 'laufend', abgeschlossenAm: undefined });
  });

  it('Loesungswechsel-AK3 Kontroll- und Endmessung: jüngste gültige Messung der Messart', () => {
    const m = (id: string, messart: string, hhmm: string, storniert: string | null = null) => ({
      id,
      messart,
      gilt_ab: zuerich(hhmm),
      storniert_am: storniert,
      ansatz_id: ANSATZ,
    });
    const k1 = m('24000000-0000-4000-8000-000000000511', 'kontrolle_ansatz', '18:51');
    const k2 = m('24000000-0000-4000-8000-000000000512', 'kontrolle_ansatz', '18:52');
    const e1 = m('24000000-0000-4000-8000-000000000521', 'end_ansatz', '19:11');
    expect(z(bisNr(16), [k1, k2, e1])).toMatchObject({ kontrollmessungId: k2.id, endmessungId: e1.id });
    const storniert = '2027-01-10T18:20:00.000Z';
    expect(
      z(bisNr(16), [k1, { ...k2, storniert_am: storniert }, { ...e1, storniert_am: storniert }]),
    ).toMatchObject({ kontrollmessungId: k1.id, endmessungId: undefined });
  });
});
