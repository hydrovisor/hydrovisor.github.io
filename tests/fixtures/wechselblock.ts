// Teile und Hilfen für den Wechselblock (Plan 139 Testliste; WB-AK1 bis WB-AK5; Konzept R5.6, R4.6). Ohne
// Personendaten. Gemeinsam für tests/unit/wechselblock.test.ts und tests/e2e/wechselblock.spec.ts.
//
// Werte, auf die die Tests rechnen:
// - ZEILEN_SIM: synthetische Zeilen 0 bis 17 mit Timer 15 min auf 11, 13 und 16, Messzeilen 3, 14 und 17, je 1 Aufzug,
//   keine Teilschritte (Simulationsmodell WB-AK1, WB-AK2).
// - standBis(kennung, zeiten): Abhakliste mit den Zeilen 0 bis zeiten.length − 1 erledigt zu den angegebenen Zeiten,
//   Messzeilen mit Messung; letzteAktionAm = letzter Haken (sonst `neu`).
// - aufgabe(): Ansatz-Aufgabe wie aus verteilteAufgaben() (Regal R, Kalendertag 12.1.2027 Zürich).
// - wechselblockTeile(): Regal R aus ansatzTeile() mit laufendem Wechsel 2.3 bis Zeile 10 (timer_ende 19:02) und
//   «Lösung wechseln» am 12.1.2027 in 1.1 und 2.1. ansatzTeile() macht am 12.1. keinen Wechsel fällig (1.1, 2.1, 2.2
//   sind leer in v_fuellzustand, Intervall 14 Tage ab 3./5./7.1.); deshalb hier Füllzustand «loesung» und
//   naechster_wechsel_am 12.1.2027 für 1.1 und 2.1 (Vorgabe nach dem letzten Neuansatz, nicht vorziehbar; Plan 139 A10
//   sinngemäss, die Neuansätze und der Becherversuch bleiben unverändert).
import type { Aufgabe, AufgabenTyp } from '../../src/domain/aufgaben.ts';
import { standNeu, type AblaufStand } from '../../src/domain/abhakliste/stand.ts';
import { MESSZEILEN, type SchrittTyp, type ZeileDef } from '../../src/domain/abhakliste/zeilen.ts';
import { ansatzTeile, LAUFEND, laufenderWechsel, um } from './ansatz.ts';
import { ANLAGE_R, platzId, uid, type Teile } from './regal.ts';

export { um };

/** Schritte 0 bis 17 wie in der Abhakliste */
const SCHRITTE: readonly SchrittTyp[] = [
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

export const TIMER_ZEILEN: readonly number[] = [11, 13, 16];

/** synthetische Zeilen 0 bis 17 für die Simulation */
export const ZEILEN_SIM: readonly ZeileDef[] = SCHRITTE.map((schritt, nr) => ({
  nr,
  schritt,
  titel: schritt,
  aufzuege: 1,
  ...(TIMER_ZEILEN.includes(nr) ? { timerMin: 15 } : {}),
  ...(MESSZEILEN[nr] ? { messfelder: [...(MESSZEILEN[nr] ?? [])] } : {}),
}));

/** Ort eines Gefässes in Regal R */
export const ort = (kennung: string) => ({ code: `R-${kennung}`, kennung });

/** ansatzId des lokalen Stands je Gefäss */
export const ansatzVon = (kennung: string) => uid('5b', Number(kennung.replace('.', '')));

/** neue Abhakliste in Regal R mit den synthetischen Zeilen */
export function neu(kennung: string, jetzt: Date): AblaufStand {
  return standNeu(
    { platzId: platzId(kennung), code: `R-${kennung}`, ansatzId: ansatzVon(kennung), defs: ZEILEN_SIM },
    jetzt,
  );
}

/** Abhakliste mit den Zeilen 0 bis zeiten.length − 1 erledigt (Messzeilen mit Messung) */
export function standBis(
  kennung: string,
  zeiten: readonly Date[],
  anlegen = zeiten[0] ?? um('18:00'),
): AblaufStand {
  const s = neu(kennung, anlegen);
  const zeilen = s.zeilen.map((z) => {
    const t = zeiten[z.nr];
    if (t === undefined) return z;
    return {
      ...z,
      erledigtAm: t.toISOString(),
      aufzuegeErledigt: z.aufzuege,
      ...(MESSZEILEN[z.nr] ? { messungId: uid('5c', z.nr + 1), begonnen: true } : {}),
    };
  });
  const letzte = zeiten.at(-1);
  const eins = zeiten[1];
  return {
    ...s,
    zeilen,
    letzteAktionAm: (letzte ?? anlegen).toISOString(),
    ...(eins ? { begonnenAm: eins.toISOString() } : {}),
  };
}

/** n Zeitpunkte ab `start` im Abstand von `schritt` Minuten */
export function takt(start: Date, n: number, schritt: number): Date[] {
  return Array.from({ length: n }, (_, i) => new Date(start.getTime() + i * schritt * 60_000));
}

/** Ansatz-Aufgabe in Regal R (oder einer anderen Anlage) wie aus verteilteAufgaben() */
export function aufgabe(e: {
  kennung: string;
  typ?: Extract<AufgabenTyp, 'loesung_wechseln' | 'ansatz' | 'station_echte_blaetter'>;
  faelligAm?: string;
  anzeigeAb?: string;
  tageUeberfaellig?: number;
  anlageId?: string;
  platzId?: string;
  kuerzel?: string;
}): Aufgabe {
  const typ = e.typ ?? 'loesung_wechseln';
  const faellig = e.faelligAm ?? '2027-01-12';
  const platz = e.platzId ?? platzId(e.kennung);
  const titel =
    typ === 'loesung_wechseln'
      ? 'Lösung wechseln'
      : typ === 'ansatz'
        ? 'Ansatz für Umsetzen'
        : 'Station auf 1. echte Blätter';
  return {
    schluessel: `${typ}|${platz}|${faellig}`,
    typ,
    bezug: platz,
    bezugArt: 'platz',
    faelligAm: faellig,
    anzeigeAb: e.anzeigeAb ?? faellig,
    tageUeberfaellig: e.tageUeberfaellig ?? 0,
    anlageId: e.anlageId ?? ANLAGE_R,
    datenart: 'echt',
    ort: {
      platzId: platz,
      code: `${e.kuerzel ?? 'R'}-${e.kennung}`,
      kennung: e.kennung,
      rolle: 'gefaess',
      bereichId: null,
    },
    titel,
    grund: 'Intervall',
    gewicht: 'wechsel',
    morgen: { erlaubt: true, verschoben: 0 },
    ueberspringen: false,
    pegelOk: false,
    erledigtKnopf: false,
  };
}

/** Abbruch des laufenden Wechsels in 2.3 (Schritt «abbruch» mit der nächsten offenen Zeile) */
export function mitAbbruch(t: Teile, nr: number): Teile {
  for (const a of t['naehrloesungsansatz'] ?? []) if (a['id'] === LAUFEND) a['status'] = 'abgebrochen';
  (t['ansatz_schritt'] ??= []).push({
    id: uid('4a', 200),
    client_id: uid('4a', 200),
    ansatz_id: LAUFEND,
    nr,
    schritt: 'abbruch',
    erledigt_am: um('18:49').toISOString(),
    soll_ml: null,
    ist_ml: null,
    ph_minus_ml: null,
    storniert_am: null,
  });
  return t;
}

/** Regal R für WB-AK4 und WB-AK5: 2.3 läuft bis Zeile 10 (Timer bis 19:02), «Lösung wechseln» fällig in 1.1 und 2.1 */
export function wechselblockTeile(): Teile {
  const t = laufenderWechsel(ansatzTeile(), 10);
  // letzter Neuansatz wie in ansatzTeile(): 1.1 am 3.1., 2.1 am 5.1.2027
  const faellig = new Map([
    [platzId('1.1'), '2027-01-03T17:00:00.000Z'],
    [platzId('2.1'), '2027-01-05T17:00:00.000Z'],
  ]);
  for (const g of t['gefaess'] ?? [])
    if (faellig.has(g['platz_id'] as string)) g['naechster_wechsel_am'] = '2027-01-12';
  for (const f of t['v_fuellzustand'] ?? []) {
    const letzter = faellig.get(f['platz_id'] as string);
    if (letzter === undefined) continue;
    f['fuellzustand'] = 'loesung';
    f['letzter_ansatz'] = letzter;
  }
  return t;
}
