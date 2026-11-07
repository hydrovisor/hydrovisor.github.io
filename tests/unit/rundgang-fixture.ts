// Bündel-Teile für den Rundgang, die Heute-Karten und «Nach Stromausfall» (Plan 30 Testliste; UC8, Rundgang-AK2,
// AK4, AK5; R5.1, R5.2, R5.4, R10.1, R10.4, R10.5). Baut auf den Bausteinen von tests/unit/aufgaben-fixture.ts auf
// (Import, keine Änderung dort). Uhr wie dort: Di 12.1.2027 09:00 Zürich (JETZT). Keine Personendaten.
//
// regal() liefert Anlage R (echt) mit Laufweg A1, 4.4, 4.5, 3.1, 3.2, 3.3, 2.1, 1.1 und Anlage X (demo):
// - Messgerät u_EC 0.10, u_pH 0.10; Kalibrierung 1.1. (fällig 31.1.), pH-Kontrolle 5.1. → pH-Kontrolle fällig 12.1.
// - Ebene 4: A1 Lichtkeimer mit Satz 1 Lollo Rossa (Saat 22.12.2026, gekeimt, Reservierung auf R-1.9.1 geplant
//   12.1. → Würfel feucht, Umsetzen 12.1.) und Satz 2 Lollo Rossa (Saat 8.1., ohne Keimprüfung → Keimung prüfen);
//   A3 Dunkelkeimer ohne Satz (keine Aufgabe); 4.4 Station (Konstantpegel, feste Dosis, P4, 2.3 l): Neuansatz 2.1.,
//   Messung 10.1. → Messen und nachfüllen 12.1.; 4.5 Konstantpegel (P3): Neuansatz 2.1., Messung 11.1., Wurzeln
//   5.1. → Wurzeln prüfen 12.1., Messen 13.1.
// - Ebene 3: 3.1 und 3.2 Kratky belüftet (P3), 3.3 Kratky ohne Pumpe; Neuansatz je 28.12.2026, Wurzeln 7.1.;
//   Messung 3.1 am 5.1. über ⅓ → Messen 12.1.; 3.2 und 3.3 am 6.1. über ⅓ → Messen 13.1.
// - Ebene 2: 2.1 Konstantpegel (P2, 30 l): Neuansatz 2.1., Messung 10.1., Wurzeln 8.1. → Messen und nachfüllen
//   12.1.; 2.2 DWC (P2) ohne Ansatz (leer, keine Aufgabe).
// - Ebene 1: 1.1 DWC (P1): Neuansatz 2.1., Messung 10.1., Wurzeln 8.1. → Messen und nachfüllen 12.1.
// - alle Gefässe mit Lösung: Kurzprüfung 12.1.; v_zielbereich pH 6.0–6.5, EC 1.0–1.4, 18–22 °C.
// - Anlage X (demo): X-1.1 DWC (P1) mit Neuansatz 2.1. und Messung 9.1.
// Rundgang-Orte am 12.1. (mit mindestens einer Rundgang-Aufgabe): A1, 4.4, 4.5, 3.1, 3.2, 3.3, 2.1, 1.1 (8).
//
// Daneben Bausteine für Stand und Plan von Hand (planVon(), aufgabe()), damit die Tests des Ablaufs und der
// Abschlussliste nicht von der Plan-Rechnung abhängen.
import type { Aufgabe, AufgabenTyp } from '../../src/domain/aufgaben.ts';
import type { RundgangOrt, RundgangPlan } from '../../src/domain/rundgang/plan.ts';
import type { Vorgang } from '../../src/domain/datenpfad/erfassung.ts';
import {
  ANLAGE,
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  ansatzDazu,
  boxDazu,
  fertig,
  gefaessDazu,
  jetztAm,
  kalibrierungDazu,
  keimungDazu,
  kurzpruefungDazu,
  leer,
  messungDazu,
  netztopfDazu,
  phKontrolleDazu,
  platzId,
  reservierungDazu,
  satzDazu,
  schluessel,
  uid,
  zh,
  type Teile,
  type Zeile,
} from './aufgaben-fixture.ts';

export {
  ANLAGE,
  HEUTE,
  JETZT,
  MESSGERAET,
  ZONE,
  jetztAm,
  platzId,
  schluessel,
  uid,
  zh,
  type Teile,
  type Zeile,
};

/** Laufweg der Anlage R nach Plan 30 Testliste */
export const LAUFWEG: readonly string[] = ['A1', '4.4', '4.5', '3.1', '3.2', '3.3', '2.1', '1.1'];

/** bereich_id der Ebene n in Anlage R (wie aufgaben-fixture.ts) */
export const bereichId = (n: number) => uid('b0', `R${n}`);

/** Codes der Rundgang-Orte am 12.1. in Laufweg-Reihenfolge */
export const RUNDGANG_ORTE: readonly string[] = LAUFWEG.map((k) => `R-${k}`);

const liste = (t: Teile, name: string) => (t[name] ??= []);

/** Zielbereich je Gefäss (v_zielbereich), damit Bewertung und Massnahme ein Sollband haben */
function zielbereichDazu(t: Teile, code: string): void {
  liste(t, 'v_zielbereich').push({
    platz_id: platzId(code),
    ph_min: 6.0,
    ph_max: 6.5,
    ec_min: 1.0,
    ec_max: 1.4,
    temp_min: 18,
    temp_max: 22,
    zaehlende_pflanzungen: 1,
  });
}

/** Regal R (echt) und X (demo) am 12.1.2027; `laufweg: null` ohne Laufweg */
export function regal(o: { laufweg?: readonly string[] | null } = {}): Teile {
  const t = leer();
  const r = liste(t, 'anlage').find((a) => a['id'] === ANLAGE.R) as Zeile;
  r['laufweg'] = o.laufweg === null ? [] : [...(o.laufweg ?? LAUFWEG)];
  const x = liste(t, 'anlage').find((a) => a['id'] === ANLAGE.X) as Zeile;
  x['laufweg'] = [];
  t['messgeraet'] = [{ id: MESSGERAET, modell: 'Aquamaster P160 Pro2', u_ec: 0.1, u_ph: 0.1 }];
  (liste(t, 'einstellung')[0] as Zeile)['kannengroesse_l'] = 10;
  kalibrierungDazu(t, zh('2027-01-01'));
  phKontrolleDazu(t, zh('2027-01-05'));

  // Ebene 4
  boxDazu(t, 'R-A1', 'box_licht');
  boxDazu(t, 'R-A3', 'box_dunkel');
  gefaessDazu(t, {
    code: 'R-4.4',
    betriebsart: 'konstantpegel',
    luftpumpe: 'P4',
    festeDosis: true,
    volumenL: 2.3,
  });
  gefaessDazu(t, { code: 'R-4.5', betriebsart: 'konstantpegel', luftpumpe: 'P3', volumenL: 2.3 });
  // Ebene 3
  gefaessDazu(t, { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
  gefaessDazu(t, { code: 'R-3.2', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
  gefaessDazu(t, { code: 'R-3.3', betriebsart: 'kratky' });
  // Ebene 2
  gefaessDazu(t, { code: 'R-2.1', betriebsart: 'konstantpegel', luftpumpe: 'P2', volumenL: 30 });
  gefaessDazu(t, { code: 'R-2.2', betriebsart: 'dwc', luftpumpe: 'P2' });
  // Ebene 1
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });

  for (const code of ['R-1.1', 'R-2.1', 'R-4.4', 'R-4.5'])
    ansatzDazu(t, code, { begonnen: zh('2027-01-02') });
  for (const code of ['R-3.1', 'R-3.2', 'R-3.3']) ansatzDazu(t, code, { begonnen: zh('2026-12-28') });

  messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10') });
  messungDazu(t, 'R-2.1', { gilt: zh('2027-01-10') });
  messungDazu(t, 'R-3.1', { gilt: zh('2027-01-05'), temperatur: 19.0, fuellstand: 'ueber_drittel' });
  messungDazu(t, 'R-3.2', { gilt: zh('2027-01-06'), temperatur: 19.0, fuellstand: 'ueber_drittel' });
  messungDazu(t, 'R-3.3', { gilt: zh('2027-01-06'), temperatur: 18.0, fuellstand: 'ueber_drittel' });
  messungDazu(t, 'R-4.4', { gilt: zh('2027-01-10'), temperatur: 21.0 });
  messungDazu(t, 'R-4.5', { gilt: zh('2027-01-11'), temperatur: 21.0 });

  kurzpruefungDazu(t, 'R-1.1', zh('2027-01-08'), 'wurzeln');
  kurzpruefungDazu(t, 'R-2.1', zh('2027-01-08'), 'wurzeln');
  for (const code of ['R-3.1', 'R-3.2', 'R-3.3']) kurzpruefungDazu(t, code, zh('2027-01-07'), 'wurzeln');
  kurzpruefungDazu(t, 'R-4.4', zh('2027-01-08'), 'wurzeln');
  kurzpruefungDazu(t, 'R-4.5', zh('2027-01-05'), 'wurzeln');

  for (const code of ['R-1.1', 'R-2.1', 'R-2.2', 'R-3.1', 'R-3.2', 'R-3.3', 'R-4.4', 'R-4.5'])
    zielbereichDazu(t, code);

  // Satz 1 in A1, gekeimt, reserviert auf einen Topf ohne Gefäss im Regal (nur die Satzaufgabe Umsetzen)
  netztopfDazu(t, 'R-1.9.1');
  const s1 = satzDazu(t, { nr: 1, sorte: 'lollo', box: 'R-A1', saat: '2026-12-22', schwaemme: 1 });
  for (const p of s1) {
    keimungDazu(t, p, 2, zh('2026-12-26'));
    reservierungDazu(t, p, 'R-1.9.1', '2027-01-12');
  }
  // Satz 2 in A1, noch nicht geprüft
  satzDazu(t, { nr: 2, sorte: 'lollo', box: 'R-A1', saat: '2027-01-08' });

  // Anlage X (demo)
  gefaessDazu(t, { code: 'X-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'X-1.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'X-1.1', { gilt: zh('2027-01-09') });
  kurzpruefungDazu(t, 'X-1.1', zh('2027-01-08'), 'wurzeln');
  return fertig(t);
}

/**
 * Vorgang auf die Teile anwenden, wie das Bündel ihn danach liefert: Ereignisse in ereignis_platz (mit id =
 * client_id), Ansätze mit Status abgeschlossen und begonnen_am = gilt_ab, Positionen und Messungen unverändert;
 * danach die Sichten nachrechnen. Verändert `t` und gibt es zurück.
 */
export function vorgangDazu(t: Teile, vorgang: Vorgang): Teile {
  for (const s of vorgang) {
    if (s.art === 'storno') {
      for (const z of Object.values(t).flat())
        if (z['client_id'] === s.clientId) z['storniert_am'] = JETZT.toISOString();
      continue;
    }
    if (s.art !== 'neu') continue;
    const f: Zeile = { id: s.felder.client_id, storniert_am: null, ...s.felder };
    if (s.tabelle === 'ereignis') {
      f['platz_id'] ??= null;
      f['daten'] ??= {};
      liste(t, 'ereignis_platz').push(f);
    } else if (s.tabelle === 'naehrloesungsansatz') {
      f['status'] ??= 'abgeschlossen';
      f['begonnen_am'] ??= f['gilt_ab'];
      liste(t, 'naehrloesungsansatz').push(f);
    } else liste(t, s.tabelle).push(f);
  }
  return fertig(t);
}

/** Stromausfall an einer Anlage (Teil ereignis_platz, Plan 30 A9); beginn und ende als ISO */
export function stromausfallDazu(
  t: Teile,
  e: { beginn: string; ende: string; anlage?: 'R' | 'X'; storniert?: boolean },
): string {
  const id = uid('e7', `strom#${liste(t, 'ereignis_platz').length + 1}`);
  liste(t, 'ereignis_platz').push({
    id,
    client_id: id,
    typ: 'stromausfall',
    anlage_id: ANLAGE[e.anlage ?? 'R'],
    bereich_id: null,
    platz_id: null,
    satz_id: null,
    pflanzung_id: null,
    daten: { beginn: e.beginn, ende: e.ende },
    gilt_ab: e.ende,
    storniert_am: e.storniert ? e.ende : null,
  });
  return id;
}

/** Ereignis am Bereich (Sammel-Tipp licht oder luefter) */
export function bereichEreignisDazu(
  t: Teile,
  ebene: number,
  punkt: 'licht' | 'luefter',
  gilt: string,
  ok = true,
) {
  const id = uid('e8', `bereich#${liste(t, 'ereignis_platz').length + 1}`);
  liste(t, 'ereignis_platz').push({
    id,
    client_id: id,
    typ: 'kurzpruefung',
    anlage_id: ANLAGE.R,
    bereich_id: bereichId(ebene),
    platz_id: null,
    satz_id: null,
    pflanzung_id: null,
    daten: { punkt, ok, ausnahmen: [] },
    gilt_ab: gilt,
    storniert_am: null,
  });
  return id;
}

const BETRIEBSART: Readonly<Record<string, string>> = {
  'R-1.1': 'dwc',
  'R-1.2': 'dwc',
  'R-2.1': 'konstantpegel',
  'R-2.2': 'dwc',
  'R-3.1': 'kratky_belueftet',
  'R-3.2': 'kratky_belueftet',
  'R-3.3': 'kratky',
  'R-4.4': 'konstantpegel',
  'R-4.5': 'konstantpegel',
};

const TITEL: Partial<Record<AufgabenTyp, string>> = {
  messen_nachfuellen: 'Messen und nachfüllen',
  messen: 'Messen',
  kurzpruefung: 'Kurzprüfung',
  wurzeln_pruefen: 'Wurzeln prüfen',
  wuerfel_feucht: 'Würfel feucht',
  nachfuellen_kratky: 'Nachfüllen Kratky',
};

/** Aufgabe von Hand (Form wie faelligeAufgaben()) am Ort `code` der Anlage R */
export function aufgabe(typ: AufgabenTyp, code: string, faelligAm = HEUTE): Aufgabe {
  const kennung = code.slice(2);
  const anzucht = kennung.startsWith('A');
  const bereich = anzucht ? 4 : Number(kennung.split('.')[0]);
  return {
    schluessel: schluessel(typ, platzId(code), faelligAm),
    typ,
    bezug: platzId(code),
    bezugArt: 'platz',
    faelligAm,
    anzeigeAb: faelligAm,
    tageUeberfaellig: 0,
    anlageId: ANLAGE.R,
    datenart: 'echt',
    ort: {
      platzId: platzId(code),
      code,
      kennung,
      rolle: anzucht ? 'anzuchtort' : 'gefaess',
      bereichId: bereichId(bereich),
    },
    titel: TITEL[typ] ?? typ,
    grund: 'heute fällig',
    gewicht: 'routine',
    morgen: { erlaubt: true, verschoben: 0 },
    ueberspringen: false,
    pegelOk: typ === 'messen_nachfuellen',
    erledigtKnopf: false,
  };
}

/** Ort des Plans von Hand: Mess-Aufgabe nach Betriebsart (Kratky «Messen», sonst «Messen und nachfüllen») */
export function ortVon(code: string, mess = true): RundgangOrt {
  const betriebsart = BETRIEBSART[code];
  const kratky = (betriebsart ?? '').startsWith('kratky');
  const messAufgabe = mess ? aufgabe(kratky ? 'messen' : 'messen_nachfuellen', code) : undefined;
  return {
    platzId: platzId(code),
    code,
    ...(betriebsart ? { betriebsart } : {}),
    ...(messAufgabe ? { messAufgabe } : {}),
    nachfuellen: mess && !kratky,
    aufgaben: [aufgabe('kurzpruefung', code), ...(messAufgabe ? [messAufgabe] : [])],
  };
}

/** Plan von Hand: je Ebene die Orte in Rundgang-Reihenfolge; Kurzprüfung je Ort mit dem Punkt der Betriebsart */
export function planVon(
  ebenen: readonly { nr: number; orte: readonly RundgangOrt[] }[],
  tag = HEUTE,
): RundgangPlan {
  return {
    anlageId: ANLAGE.R,
    tag,
    ebenen: ebenen.map((e) => ({
      bereichId: bereichId(e.nr),
      name: `Ebene ${e.nr}`,
      mitLichtLuefter: true,
      kurzpruefung: e.orte.map((o) => {
        const kratky = (o.betriebsart ?? '').startsWith('kratky');
        return {
          platzId: o.platzId,
          code: o.code,
          punkt: kratky ? ('luftzone' as const) : ('pumpe' as const),
          text: kratky ? 'Luftzone vorhanden' : 'Pumpe sprudelt',
          aufgabe: aufgabe('kurzpruefung', o.code),
        };
      }),
      orte: [...e.orte],
    })),
    orteZahl: ebenen.reduce((n, e) => n + e.orte.length, 0),
  };
}

/** Ergebnisse der Kurzprüfung einer Ebene des Plans: alle ok, ausser den genannten «platzId|punkt» */
export function kurzpruefungErgebnis(
  plan: RundgangPlan,
  ebene: number,
  abweichungen: readonly string[] = [],
): { platzId: string | null; bereichId: string | null; punkt: string; ok: boolean }[] {
  const e = plan.ebenen[ebene];
  if (!e) throw new Error(`Ebene ${ebene} fehlt im Plan`);
  return [
    { platzId: null, bereichId: e.bereichId, punkt: 'licht', ok: true },
    { platzId: null, bereichId: e.bereichId, punkt: 'luefter', ok: true },
    ...e.kurzpruefung.map((z) => ({
      platzId: z.platzId,
      bereichId: e.bereichId,
      punkt: z.punkt,
      ok: !abweichungen.includes(`${z.platzId}|${z.punkt}`),
    })),
  ];
}
