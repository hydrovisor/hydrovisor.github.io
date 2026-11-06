// Teile für «Umsetzen einfach» und «Verschieben» (Plan 33 Testliste): Regal R mit Wissen aus tests/fixtures/saeen.ts
// (ohne den Satz in 2.3), Sätze über satzAnlegen() aus tests/fixtures/keimung.ts, Ereignisse wie aus den früheren
// Masken (keimung, Stationseintritt verschieben, phase_antwort am Satz, umsetzen), v_sollwert für Anzucht und Wachstum
// und eine Wissenskarte «Topf umsetzen». Die Sichten rechnet umsetzSichtenNachrechnen() aus tests/fixtures/sichten.ts
// nach. Gemeinsam für Unit und E2E. Ohne Personendaten.
//
// Werte, auf die die Tests rechnen (Uhr UMSETZ_JETZT 2027-01-19T08:00:00Z = Zürich 19.1. 09:00):
// - Satz Lollo Rossa (Nr. 80, Salat 5 cm, Umsetzen ab 21, bis 28) in A1, gesät 7.1. (Tag 12), 6 Schwämme à 2 Samen,
//   am 11.1. alle gekeimt (2 von 2) und auf 4.4 Loch 1 bis 6 gestellt; Zieltöpfe 2.3.1 bis 2.3.5 an den Pflanzungen
//   1 bis 5 (umsetzen_geplant_am 28.1.), Pflanzung 6 ist Reserve ohne Zieltopf; Phase Anzucht seit 15.1.
//   Ohne Reserve (reserve: false) 5 Schwämme.
// - Satz Rucola (Nr. 82, 5 cm, Umsetzen ab 14, bis 21) in A1, gesät 5.1., 5 Schwämme, ohne Zieltopf, am 8.1. gekeimt
//   und auf 4.4 Loch 7 bis 11; Phase Anzucht. Fällig ohne Reservierung am 19.1. (Saat + 14).
// - Satz Ochsenherz (Nr. 83, Tomate 8 cm, Umsetzen ab 28, bis 35) in A1, gesät 31.12.2026, 1 Schwamm mit Zieltopf
//   2.1.2; am 7.1. mit dem Topf 2.1.2 auf 4.2 Loch 1 (Stationseintritt mit netztopf_id, Konzept 8.1 Regel 10).
// - bestand23: 2.3.1 Eichblatt (Nr. 84) und 2.3.4 Lollo Rossa (Nr. 85), beide gesät 19.12.2026, umgesetzt am 9.1.
//   aus 4.5, Phase Wachstum; 2.1.6 Eichblatt (Nr. 87), umgesetzt am 5.1.; Direktsaat Rucola in 3.1 (Nr. 86, gesät
//   5.1., Zieltopf 3.1.1, gekeimt 8.1.).
// - v_sollwert Anzucht: Salat pH 5.8–6.2, EC 0.8–1.2; Rucola pH 6.0–6.5, EC 0.8–1.2; Tomate pH 5.8–6.3, EC 1.0–1.6.
//   Wachstum: Salat pH 5.8–6.3, EC 1.0–1.4; Rucola pH 6.0–6.5, EC 1.0–1.4; Tomate pH 5.8–6.3, EC 1.4–2.0.
import { gefaessId, netztopfId, platzId, uid, type Teile } from './regal.ts';
import { pflanzungId, reservierungId, satzAnlegen } from './keimung.ts';
import { PACKUNG, saatTeile, SORTE } from './saeen.ts';
import { umsetzSichtenNachrechnen } from './sichten.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };

export const UMSETZ_JETZT = new Date('2027-01-19T08:00:00Z');
/** geplantes Umsetzdatum von Lollo Rossa und Ochsenherz: 28.1. (Saat + «Umsetzen ab») */
export const UMSETZ_FAELLIG = new Date('2027-01-28T08:00:00Z');

export const NR = {
  lollo: 80,
  rucola: 82,
  tomate: 83,
  eichblatt23: 84,
  lolloAlt: 85,
  direkt: 86,
  eichblatt21: 87,
};
export const SATZ = {
  lollo: uid('27', NR.lollo),
  rucola: uid('27', NR.rucola),
  tomate: uid('27', NR.tomate),
  eichblatt23: uid('27', NR.eichblatt23),
  lolloAlt: uid('27', NR.lolloAlt),
  direkt: uid('27', NR.direkt),
  eichblatt21: uid('27', NR.eichblatt21),
} as const;
/** Pflanzungen: L[1] bis L[6] Lollo Rossa, R[1] bis R[5] Rucola, TOMATE, EICHBLATT_23 (2.3.1), LOLLO_ALT (2.3.4) */
export const L = [0, 1, 2, 3, 4, 5, 6].map((i) => pflanzungId(NR.lollo, i));
export const R = [0, 1, 2, 3, 4, 5].map((i) => pflanzungId(NR.rucola, i));
export const TOMATE = pflanzungId(NR.tomate, 1);
export const EICHBLATT_23 = pflanzungId(NR.eichblatt23, 1);
export const LOLLO_ALT = pflanzungId(NR.lolloAlt, 1);
export const EICHBLATT_21 = pflanzungId(NR.eichblatt21, 1);
export const DIREKT = pflanzungId(NR.direkt, 1);

export const WISSEN_TOPF_UMSETZEN =
  'Topf senkrecht herausheben, Wurzeln nicht abreissen und im Zielgefäss gleich tief einsetzen.';

let nr = 0;
/** Ereignis wie eine Zeile der Tabelle ereignis (gilt_ab ISO); gibt die id zurück */
export function ereignis(
  t: Teile,
  e: {
    typ: string;
    giltAb: string;
    pflanzungId?: string;
    satzId?: string;
    netztopfId?: string;
    platzId?: string;
    daten?: Record<string, unknown>;
    id?: string;
  },
): string {
  nr += 1;
  const id = e.id ?? uid('3f', nr);
  (t['ereignis'] ??= []).push({
    id,
    client_id: id,
    typ: e.typ,
    pflanzung_id: e.pflanzungId ?? null,
    satz_id: e.satzId ?? null,
    netztopf_id: e.netztopfId ?? null,
    platz_id: e.platzId ?? null,
    daten: e.daten ?? {},
    gilt_ab: e.giltAb,
    erfasst_am: e.giltAb,
    ...o,
  });
  return id;
}

/** Keimung (alle gekeimt) und Stationseintritt aus der Box wie keimVorgang() */
function aufDieStation(
  t: Teile,
  e: {
    pflanzungen: string[];
    box: string;
    station: string;
    ab: number;
    giltAb: string;
    samen: number;
    topf?: string;
  },
): void {
  e.pflanzungen.forEach((p, i) => {
    ereignis(t, {
      typ: 'keimung',
      pflanzungId: p,
      giltAb: e.giltAb,
      daten: { samen_gesaet: e.samen, samen_gekeimt: e.samen, keimtemp_eingehalten: true },
    });
    ereignis(t, {
      typ: 'verschieben',
      pflanzungId: p,
      ...(e.topf ? { netztopfId: netztopfId(e.topf) } : {}),
      giltAb: e.giltAb,
      daten: { von_platz_id: platzId(e.box), nach_platz_id: platzId(e.station), nach_loch_nr: e.ab + i },
    });
  });
}

/** phase_antwort {phase, antwort: ja} am Satz */
export function phaseDazu(t: Teile, satzId: string, phase: string, giltAb: string): string {
  return ereignis(t, { typ: 'phase_antwort', satzId, giltAb, daten: { phase, antwort: 'ja' } });
}

/** umsetzen an der Pflanzung in den Topf mit Kennung (von Station und Loch nach Heimplatz des Topfs) */
export function umgesetzt(
  t: Teile,
  pflanzung: string,
  topf: string,
  giltAb: string,
  von: [string, number],
): string {
  const [a, b, l] = topf.split('.');
  return ereignis(t, {
    typ: 'umsetzen',
    pflanzungId: pflanzung,
    netztopfId: netztopfId(topf),
    giltAb,
    daten: {
      von_platz_id: platzId(von[0]),
      von_loch_nr: von[1],
      nach_platz_id: platzId(`${a}.${b}`),
      nach_loch_nr: Number(l),
    },
  });
}

/** Kurzprüfung eines Punkts am Platz */
export function kurzpruefungDazu(
  t: Teile,
  kennung: string,
  punkt: string,
  ok: boolean,
  giltAb: string,
): string {
  return ereignis(t, { typ: 'kurzpruefung', platzId: platzId(kennung), giltAb, daten: { punkt, ok } });
}

/** v_sollwert Anzucht und Wachstum (pH, EC gesamt) für Salat, Rucola und Tomate */
function sollwerte(): Zeile[] {
  const w: [string, string, number, number, number, number][] = [
    // sorte, phase, ph_min, ph_max, ec_min, ec_max
    [SORTE.lollo, 'anzucht', 5.8, 6.2, 0.8, 1.2],
    [SORTE.eichblatt, 'anzucht', 5.8, 6.2, 0.8, 1.2],
    [SORTE.rucola, 'anzucht', 6.0, 6.5, 0.8, 1.2],
    [SORTE.ochsenherz, 'anzucht', 5.8, 6.3, 1.0, 1.6],
    [SORTE.lollo, 'wachstum', 5.8, 6.3, 1.0, 1.4],
    [SORTE.eichblatt, 'wachstum', 5.8, 6.3, 1.0, 1.4],
    [SORTE.rucola, 'wachstum', 6.0, 6.5, 1.0, 1.4],
    [SORTE.ochsenherz, 'wachstum', 5.8, 6.3, 1.4, 2.0],
  ];
  return w.flatMap(([sorte, phase, phMin, phMax, ecMin, ecMax]) => [
    {
      sorte_id: sorte,
      phase,
      groesse: 'ph',
      wert_min: phMin,
      wert_typ: null,
      wert_max: phMax,
      text_wert: null,
      herkunft_ebene: 'art',
      ec_basis_quelle: null,
    },
    {
      sorte_id: sorte,
      phase,
      groesse: 'ec',
      wert_min: ecMin,
      wert_typ: null,
      wert_max: ecMax,
      text_wert: null,
      herkunft_ebene: 'art',
      ec_basis_quelle: 'gesamt',
    },
  ]);
}

export interface UmsetzOptionen {
  jetzt?: Date;
  /** Zieltöpfe der Lollo-Pflanzungen 1, 2, … (Vorgabe 2.3.1 bis 2.3.5) */
  zieltoepfe?: string[];
  /** Pflanzung 6 als Reserve (Vorgabe ja) */
  reserve?: boolean;
  /** Rucola auf 4.4 (Vorgabe ja) */
  rucola?: boolean;
  /** Ochsenherz mit 8-cm-Zieltopf 2.1.2 auf 4.2 (Vorgabe ja) */
  tomate?: boolean;
  /** Bestand in 2.3 (2.3.1 Eichblatt, 2.3.4 Lollo Rossa), 2.1.6 Eichblatt, Direktsaat in 3.1 (Vorgabe nein) */
  bestand23?: boolean;
}

/** Regal R mit Sämlingen auf den Stationen (siehe Kopf); Sichten nachgerechnet */
export function umsetzTeile(e: UmsetzOptionen = {}): Teile {
  const t = saatTeile(e.jetzt ?? UMSETZ_JETZT, { ohneSatzIn23: true });
  t['v_sollwert'] = [...(t['v_sollwert'] ?? []), ...sollwerte()];
  t['reservierung'] = [];
  t['ereignis_pflanzung'] = [];
  t['wissenseintrag'] = [
    {
      id: uid('38', 1),
      ebene: 'allgemein',
      art_id: null,
      kulturgruppe_id: null,
      phase: null,
      typ: 'topf_umsetzen',
      text: WISSEN_TOPF_UMSETZEN,
      gueltig_bis: null,
    },
  ];

  // Lollo Rossa: 6 (oder 5) Schwämme, Zieltöpfe, auf 4.4 ab Loch 1
  const reserve = e.reserve ?? true;
  const lollo = satzAnlegen(t, {
    nr: NR.lollo,
    saatgutId: PACKUNG.lollo,
    box: 'A1',
    schwaemme: reserve ? 6 : 5,
    samen: 2,
    zieltoepfe: e.zieltoepfe ?? ['2.3.1', '2.3.2', '2.3.3', '2.3.4', '2.3.5'],
  });
  aufDieStation(t, {
    pflanzungen: lollo,
    box: 'A1',
    station: '4.4',
    ab: 1,
    giltAb: '2027-01-11T08:00:00.000Z',
    samen: 2,
  });
  phaseDazu(t, SATZ.lollo, 'anzucht', '2027-01-15T08:00:00.000Z');

  if (e.rucola ?? true) {
    const rucola = satzAnlegen(t, {
      nr: NR.rucola,
      sorteId: SORTE.rucola,
      saatgutId: PACKUNG.rucola,
      kulturform: 'babyleaf',
      box: 'A1',
      schwaemme: 5,
      samen: 2,
      saatdatum: '2027-01-05',
      zieltoepfe: [],
    });
    aufDieStation(t, {
      pflanzungen: rucola,
      box: 'A1',
      station: '4.4',
      ab: 7,
      giltAb: '2027-01-08T08:00:00.000Z',
      samen: 2,
    });
    phaseDazu(t, SATZ.rucola, 'anzucht', '2027-01-12T08:00:00.000Z');
  }

  if (e.tomate ?? true) {
    const tomate = satzAnlegen(t, {
      nr: NR.tomate,
      sorteId: SORTE.ochsenherz,
      saatgutId: PACKUNG.ochsenherz,
      kulturform: 'dauerkultur_frucht',
      box: 'A1',
      schwaemme: 1,
      samen: 1,
      saatdatum: '2026-12-31',
      zieltoepfe: ['2.1.2'],
    });
    aufDieStation(t, {
      pflanzungen: tomate,
      box: 'A1',
      station: '4.2',
      ab: 1,
      giltAb: '2027-01-07T08:00:00.000Z',
      samen: 1,
      topf: '2.1.2',
    });
    phaseDazu(t, SATZ.tomate, 'anzucht', '2027-01-12T08:00:00.000Z');
  }

  if (e.bestand23) {
    const bestand: [number, string, string, [string, number], string][] = [
      // nr, sorte, topf, von, umgesetzt
      [NR.eichblatt23, SORTE.eichblatt, '2.3.1', ['4.5', 1], '2027-01-09T09:00:00.000Z'],
      [NR.lolloAlt, SORTE.lollo, '2.3.4', ['4.5', 2], '2027-01-09T09:00:00.000Z'],
      [NR.eichblatt21, SORTE.eichblatt, '2.1.6', ['4.5', 3], '2027-01-05T09:00:00.000Z'],
    ];
    for (const [n, sorte, topf, von, am] of bestand) {
      const [p] = satzAnlegen(t, {
        nr: n,
        sorteId: sorte,
        saatgutId: null,
        box: 'A2',
        schwaemme: 1,
        samen: 1,
        saatdatum: n === NR.eichblatt21 ? '2026-12-15' : '2026-12-19',
        zieltoepfe: [],
      }) as [string];
      aufDieStation(t, {
        pflanzungen: [p],
        box: 'A2',
        station: von[0],
        ab: von[1],
        giltAb: n === NR.eichblatt21 ? '2026-12-19T08:00:00.000Z' : '2026-12-23T08:00:00.000Z',
        samen: 1,
      });
      umgesetzt(t, p, topf, am, von);
      phaseDazu(t, uid('27', n), 'wachstum', am.replace('T09', 'T10'));
    }
    const [direkt] = satzAnlegen(t, {
      nr: NR.direkt,
      sorteId: SORTE.rucola,
      saatgutId: null,
      kulturform: 'babyleaf',
      direktsaat: '3.1',
      schwaemme: 1,
      samen: 2,
      saatdatum: '2027-01-05',
      zieltoepfe: ['3.1.1'],
    }) as [string];
    ereignis(t, {
      typ: 'keimung',
      pflanzungId: direkt,
      giltAb: '2027-01-08T08:00:00.000Z',
      daten: { samen_gesaet: 2, samen_gekeimt: 2, keimtemp_eingehalten: true },
    });
  }
  return umsetzSichtenNachrechnen(t);
}

/**
 * Regal für Verschieben und Tausch (UC6-AK3, UC6-AK8): Bestand in 2.3 und 2.1, Lollo-Satz mit Zieltöpfen ausserhalb
 * von 2.3 ausser 2.3.6 (reserviert): 2.3.6, 1.1.1, 1.1.2, 1.1.3, 1.1.4.
 */
export function verschiebTeile(jetzt = UMSETZ_JETZT): Teile {
  return umsetzTeile({
    jetzt,
    bestand23: true,
    zieltoepfe: ['2.3.6', '1.1.1', '1.1.2', '1.1.3', '1.1.4'],
  });
}

/** Reservierung k des Lollo-Satzes (Tabelle reservierung) */
export const lolloReservierung = (k: number) => reservierungId(NR.lollo, k);

export { gefaessId, netztopfId, platzId };
