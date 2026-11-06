// Anbindung von Zielbereich und Leitkultur an die Abhakliste (Plan 34 «Anbindung an abhakliste/rechnung.ts», Testliste
// abhakliste-rechnung.test.ts; ersetzt Plan 29 A11). Konzept R2.2, R2.3, R2.5, R4.3, R4.5; RF7; TO2. Injizierte Uhr
// ZB_JETZT (Mo 18.1.2027 09:00 Zürich), Zeitzone Europe/Zurich; Teile aus tests/fixtures/zielbereich.ts.
//
// Vertrag (Plan 34, vom Testentwickler präzisiert, wo der Plan offen ist):
//   src/domain/abhakliste/rechnung.ts
//     rechnungEingaben(teile, platzId, jetzt, zeitzone, e?) → Rechnungseingaben aus Plan 29, ergänzt um
//       zweck: Zweck; leitkultur: Ergebnis von leitkultur(); pflanzungIds (= gerechnet_fuer); gerechnetFuer aus
//       gerechnetFuerText(); eingabe.zielbereich aus schnittmenge().ec nur bei art 'ok'; phBand aus schnittmenge().ph.
//   src/domain/abhakliste/vorgaenge.ts
//     KopfAngaben.leitkulturArtId?: string → naehrloesungsansatz.leitkultur_art_id (sonst null)
//     leitkulturGewaehltVorgang(platzId, artId, ids, jetzt): Vorgang mit einem Schritt
//       { art: 'neu', tabelle: 'ereignis', felder: { id, client_id, typ: 'leitkultur_gewaehlt', platz_id,
//         daten: { art_id }, gilt_ab } }
import { describe, expect, it } from 'vitest';
import { rechnen, rechnungEingaben } from '../../src/domain/abhakliste/rechnung.ts';
import {
  abhaken,
  messungZuordnen,
  standNeu,
  type AblaufMessung,
  type AblaufStand,
} from '../../src/domain/abhakliste/stand.ts';
import {
  kopfVorgang,
  leitkulturGewaehltVorgang,
  type KopfAngaben,
} from '../../src/domain/abhakliste/vorgaenge.ts';
import { zeilenAus } from '../../src/domain/abhakliste/zeilen.ts';
import { vorgangPruefen, type Schritt, type Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import { neuansatz, type NeuansatzErgebnis } from '../../src/domain/rechner.ts';
import { ZEITZONE } from '../../src/domain/zeit.ts';
import type { Teile } from '../fixtures/regal.ts';
import {
  ART,
  ereignisDazu,
  platzId,
  RESERVIERT_23,
  satzDazu,
  STEHEND_23,
  ZB_JETZT,
  zielbereichTeile,
} from '../fixtures/zielbereich.ts';

const J = ZB_JETZT;
const Z = ZEITZONE;
const P11 = platzId('1.1');
const P23 = platzId('2.3');
const sortiert = (l: readonly string[]) => [...l].sort();

type Neu = Extract<Schritt, { art: 'neu' }>;
const neue = (v: Vorgang) => v.filter((s): s is Neu => s.art === 'neu');

/** zwei Arten im Gleichstand aller Stufen in 1.1: Rucola und Spinat, je ein Topf, Wachstum */
function gleichstand11(): Teile {
  const t = zielbereichTeile();
  satzDazu(t, {
    nr: 50,
    sorte: 'rucola',
    kulturform: 'babyleaf',
    saatdatum: '2026-12-20',
    phase: 'wachstum',
    anzahl: 1,
    stehend: { toepfe: ['1.1.1'], umgesetztAm: '2027-01-05T08:00:00.000Z' },
  });
  satzDazu(t, {
    nr: 51,
    sorte: 'matador',
    kulturform: 'babyleaf',
    saatdatum: '2026-12-20',
    phase: 'wachstum',
    anzahl: 1,
    stehend: { toepfe: ['1.1.2'], umgesetztAm: '2027-01-05T08:00:00.000Z' },
  });
  return t;
}

describe('R2.2 Zielbereich nach Zweck in rechnungEingaben', () => {
  it('R2.2 rechnungEingaben für 2.3 mit Umsetzen in 2 Tagen rechnet mit Zielbereich 1.0 bis 1.2, Stadium echte_blaetter und gerechnet_fuer der 6 Pflanzungen', () => {
    // stehende Lollo Rossa vor 4 Tagen umgesetzt (Einwurzeln, R4.3), Eichblatt zieht am 20.1. ein
    const t = zielbereichTeile({ umsetzenAm: '2027-01-20', umgesetztAm: '2027-01-14T08:00:00.000Z' });
    const r = rechnungEingaben(t, P23, J, Z);
    expect(r.zweck).toBe('umsetzen');
    expect(r.eingabe.zielbereich).toEqual({ min: 100, max: 120 });
    expect(r.phBand).toEqual({ min: 580, max: 650 });
    expect(r.stadiumVorschlag).toBe('echte_blaetter');
    expect(r.eingabe.stadium).toBe('echte_blaetter');
    expect(sortiert(r.pflanzungIds)).toEqual(sortiert([...STEHEND_23, ...RESERVIERT_23]));
    expect(r.gerechnetFuer).toBe('3 × Salat Wachstum, 3 reserviert Salat Anzucht');
    expect(r.leitkultur).toEqual({ art: 'art', artId: ART.salat, grund: 'einzige' });
    expect(r.volumen).toBe(900);
    expect(rechnen(r)).toBeDefined();
  });

  it('R2.3 rechnungEingaben: Übersteuerung des Stadiums geht dem Vorschlag vor, der Vorschlag bleibt', () => {
    const t = zielbereichTeile({ umsetzenAm: '2027-01-20', umgesetztAm: '2027-01-14T08:00:00.000Z' });
    const r = rechnungEingaben(t, P23, J, Z, { stadiumGewaehlt: 'wachstum' });
    expect(r.stadiumVorschlag).toBe('echte_blaetter');
    expect(r.eingabe.stadium).toBe('wachstum');
  });

  it('R2.3 rechnungEingaben für 2.3 mit stehender Leitkultur in Wachstum nach Tag 7: Stadium wachstum (Beispiel 2.3 am 4.3.)', () => {
    const r = rechnungEingaben(zielbereichTeile(), P23, J, Z);
    expect(r.zweck).toBe('umsetzen');
    expect(r.stadiumVorschlag).toBe('wachstum');
    expect(r.eingabe.zielbereich).toEqual({ min: 100, max: 120 });
  });

  it('R2.2 rechnungEingaben Bewertung: Umsetzen erst in 4 Tagen zählt nur die stehenden (1.0 bis 1.4)', () => {
    const r = rechnungEingaben(zielbereichTeile({ umsetzenAm: '2027-01-22' }), P23, J, Z);
    expect(r.zweck).toBe('bewertung');
    expect(r.eingabe.zielbereich).toEqual({ min: 100, max: 140 });
    expect(sortiert(r.pflanzungIds)).toEqual(sortiert(STEHEND_23));
    expect(r.gerechnetFuer).toBe('3 × Salat Wachstum');
  });

  it('R2.2 leere Schnittmenge ergibt eingabe_noetig mit Vorschlag wachstum (bis R2.4, A15)', () => {
    const t = zielbereichTeile();
    satzDazu(t, {
      nr: 52,
      sorte: 'lollo',
      saatdatum: '2026-12-01',
      phase: 'wachstum',
      anzahl: 2,
      stehend: { toepfe: ['1.1.1', '1.1.2'], umgesetztAm: '2026-12-28T08:00:00.000Z' },
    });
    satzDazu(t, {
      nr: 53,
      sorte: 'ochsenherz',
      kulturform: 'dauerkultur_frucht',
      saatdatum: '2026-11-20',
      phase: 'wachstum',
      anzahl: 1,
      stehend: { toepfe: ['1.1.3'], umgesetztAm: '2026-12-20T08:00:00.000Z' },
    });
    const r = rechnungEingaben(t, P11, J, Z);
    expect(r.zweck).toBe('bewertung');
    expect(r.eingabe.zielbereich).toBeUndefined();
    expect(r.leitkultur).toEqual({ art: 'art', artId: ART.tomate, grund: 'kulturdauer' });
    expect(neuansatz(r.eingabe)).toEqual({
      art: 'eingabe_noetig',
      felder: ['ziel_ec', 'stadium'],
      vorschlagStadium: 'wachstum',
    });
    expect(rechnen(r)).toBeUndefined();
  });

  it('R2.2 rechnungEingaben ohne zählende (RF7): kein Zielbereich, kein Stadium, «niemand»; mit Ziel-EC und Stadium von Hand rechnet er', () => {
    const t = zielbereichTeile();
    const P21 = platzId('2.1');
    const r = rechnungEingaben(t, P21, J, Z);
    expect(r.zweck).toBe('ohne');
    expect(r.eingabe.zielbereich).toBeUndefined();
    expect(r.stadiumVorschlag).toBeUndefined();
    expect(r.pflanzungIds).toEqual([]);
    expect(r.gerechnetFuer).toBe('niemand, Ziel-EC und Stadium von Hand');
    expect(neuansatz(r.eingabe).art).toBe('eingabe_noetig');
    const vonHand = rechnungEingaben(t, P21, J, Z, { stadiumGewaehlt: 'wachstum', zielEcGewaehlt: 120 });
    expect(rechnen(vonHand)).toBeDefined();
  });

  it('R2.3 rechnungEingaben Station: Stadium aus dem Eintritt des ältesten Satzes (Tag 14 / Tag 15, R4.5)', () => {
    const t = zielbereichTeile();
    satzDazu(t, {
      nr: 54,
      sorte: 'lollo',
      saatdatum: '2026-12-28',
      phase: 'anzucht',
      anzahl: 2,
      station: { kennung: '4.4', eintrittAm: '2027-01-04T08:00:00.000Z' },
    });
    const P44 = platzId('4.4');
    const tag14 = rechnungEingaben(t, P44, J, Z);
    expect(tag14.eingabe.istStation).toBe(true);
    expect(tag14.stadiumVorschlag).toBe('wurzeln_keimung');
    const tag15 = rechnungEingaben(t, P44, new Date('2027-01-19T08:00:00Z'), Z);
    expect(tag15.stadiumVorschlag).toBe('echte_blaetter');
  });
});

describe('R2.3 Leitkultur in rechnungEingaben', () => {
  it('R2.3 rechnungEingaben bei wahl_noetig liefert die Kandidaten; nach leitkultur_gewaehlt die Leitkultur für den Kopf', () => {
    const t = gleichstand11();
    const vorher = rechnungEingaben(t, P11, J, Z);
    expect(vorher.leitkultur.art).toBe('wahl_noetig');
    if (vorher.leitkultur.art === 'wahl_noetig')
      expect(sortiert(vorher.leitkultur.kandidaten)).toEqual(sortiert([ART.rucola, ART.spinat]));
    ereignisDazu(t, 'ereignis_platz', {
      typ: 'leitkultur_gewaehlt',
      platzId: P11,
      giltAb: '2027-01-18T07:55:00.000Z',
      daten: { art_id: ART.spinat },
    });
    const nachher = rechnungEingaben(t, P11, J, Z);
    expect(nachher.leitkultur).toEqual({ art: 'art', artId: ART.spinat, grund: 'gewaehlt' });
    // Rucola Wachstum 0.5–0.9 Zuwachs + 0.5 ∩ Spinat 1.2–1.8
    expect(nachher.eingabe.zielbereich).toEqual({ min: 120, max: 140 });
  });
});

// Kopf beim Haken von Zeile 4 (Plan 29 A4), mit Leitkultur und Pflanzungen aus der Grundlage (R2.5)
const T0 = new Date('2027-01-18T17:30:00.000Z');
const ANSATZ = '29000000-0000-4000-8000-000000000034';
const MESSUNG_3: AblaufMessung = {
  id: '24000000-0000-4000-8000-000000000334',
  ec: 50,
  temperatur: 2000,
  giltAb: '2027-01-18T17:33:00.000Z',
};

function zaehler(praefix = '4d'): () => string {
  let k = 0;
  return () => {
    k += 1;
    return `${praefix}000000-0000-4000-8000-${String(k).padStart(12, '0')}`;
  };
}

function rechnung(): NeuansatzErgebnis {
  const r = neuansatz({
    volumen: 900,
    stadium: 'wachstum',
    zielbereich: { min: 100, max: 120 },
    ecWasser: 50,
    k: { grow: 300, micro_hard_water: 300, bloom: 300 },
    teilDosis: 100,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
  });
  if (r.art !== 'ergebnis') throw new Error('Rechnung erwartet');
  return r;
}

/** Stand mit den Zeilen 0 bis 4 abgehakt (Zeile 3 mit Frischwassermessung) */
function bisZeile4(): AblaufStand {
  const defs = zeilenAus(
    {
      rechnung: rechnung(),
      ersterAnsatz: false,
      volumen: 900,
      kalibrierung: { art: 'gueltig', letzte: '2027-01-11T07:00:00.000Z', faelligAm: '2027-01-31' },
      festeTermine: ['2027-01-31'],
      phZiel: 625,
    },
    T0,
    ZEITZONE,
  );
  let s = standNeu({ platzId: P23, code: 'R-2.3', ansatzId: ANSATZ, defs }, T0);
  for (let nr = 0; nr <= 4; nr += 1) {
    const zeit = new Date(T0.getTime() + nr * 60_000);
    s = abhaken(nr === 3 ? messungZuordnen(s, 3, MESSUNG_3) : s, nr, zeit);
  }
  return s;
}

function kopf(e: Partial<KopfAngaben> = {}): KopfAngaben {
  return {
    volumen: 900,
    pflanzungIds: [...STEHEND_23, ...RESERVIERT_23],
    schnappschuss: {
      zielbereich: { ph_min: 5.8, ph_max: 6.5, ec_min: 1.0, ec_max: 1.2 },
      betriebsart: 'dwc',
      k: { grow: 0.3, micro_hard_water: 0.3, bloom: 0.3 },
    },
    ecWasser: 50,
    rechnung: rechnung(),
    ...e,
  };
}

describe('R2.3 Kopf und Wahl der Leitkultur (vorgaenge.ts)', () => {
  it('R2.3 Kopf in vorgaenge.ts enthält leitkultur_art_id und gerechnet_fuer aus der Grundlage (R2.5)', () => {
    const v = kopfVorgang(bisZeile4(), kopf({ leitkulturArtId: ART.salat }), zaehler()).vorgang;
    const k = neue(v).find((s) => s.tabelle === 'naehrloesungsansatz');
    expect(k?.felder['leitkultur_art_id']).toBe(ART.salat);
    expect(k?.felder['gerechnet_fuer']).toEqual([...STEHEND_23, ...RESERVIERT_23]);
    // ohne Leitkultur (Zweck ohne): null
    const ohne = kopfVorgang(bisZeile4(), kopf({ pflanzungIds: [] }), zaehler()).vorgang;
    const k0 = neue(ohne).find((s) => s.tabelle === 'naehrloesungsansatz');
    expect(k0?.felder['leitkultur_art_id']).toBeNull();
    expect(k0?.felder['gerechnet_fuer']).toEqual([]);
  });

  it('R2.3 TO2 leitkulturGewaehltVorgang: Ereignis leitkultur_gewaehlt {art_id} am Platz, gleiche Wiederholung gleiche client_id', () => {
    const v = leitkulturGewaehltVorgang(P11, ART.spinat, zaehler('4e'), J);
    expect(vorgangPruefen(v)).toEqual([]);
    const [s] = neue(v);
    expect(neue(v)).toHaveLength(1);
    expect(s?.tabelle).toBe('ereignis');
    expect(s?.felder).toMatchObject({
      typ: 'leitkultur_gewaehlt',
      platz_id: P11,
      daten: { art_id: ART.spinat },
      gilt_ab: J.toISOString(),
    });
    expect(s?.felder['id']).toBe(s?.felder['client_id']);
    expect(leitkulturGewaehltVorgang(P11, ART.spinat, zaehler('4e'), J)).toEqual(v);
  });
});
