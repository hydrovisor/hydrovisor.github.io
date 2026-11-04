// Anlage anlegen mit Bereichen (UC1 Ablauf Anlage anlegen, Konzept 5.2; Plan 20): Prüfung und ein Vorgang für
// schreiben(). Rein: IDs und jetzt kommen von aussen.
import type { Schritt } from '../datenpfad/erfassung.ts';
import { KUERZEL_MUSTER } from './kuerzel.ts';
import { zeilen, type AnlageZeile, type Teile } from './teile.ts';

export type Betriebsart = 'dwc' | 'konstantpegel' | 'kratky_belueftet' | 'kratky';

export interface BereichEingabe {
  standardBetriebsart: Betriebsart;
  lichtleisten: number;
  lichtstunden: number;
  /** nutzbare Höhe über dem Deckel in cm */
  hoeheCm: number;
}

export interface AnlageEingabe {
  name: string;
  kuerzel: string;
  standort: 'indoor' | 'outdoor';
  lichtVon: string;
  lichtBis: string;
  luefter: string;
  karbonathaerte?: number;
  bereiche: BereichEingabe[];
}

/** Standardwerte der Ebenen 1 bis 4 (UC1, Konzept 5.2): Betriebsart, Leisten, 15 h, Höhe 45/20/15/15 cm */
export const STANDARD_BEREICHE: readonly BereichEingabe[] = [
  { standardBetriebsart: 'dwc', lichtleisten: 4, lichtstunden: 15, hoeheCm: 45 },
  { standardBetriebsart: 'dwc', lichtleisten: 2, lichtstunden: 15, hoeheCm: 20 },
  { standardBetriebsart: 'kratky_belueftet', lichtleisten: 2, lichtstunden: 15, hoeheCm: 15 },
  { standardBetriebsart: 'konstantpegel', lichtleisten: 2, lichtstunden: 15, hoeheCm: 15 },
];

export function standardBereich(nummer: number): BereichEingabe {
  return {
    ...(STANDARD_BEREICHE[nummer - 1] ?? {
      standardBetriebsart: 'dwc',
      lichtleisten: 2,
      lichtstunden: 15,
      hoeheCm: 20,
    }),
  };
}

export interface Fehler {
  feld: string;
  text: string;
}

const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

export function anlagePruefen(e: AnlageEingabe, teile: Teile): Fehler[] {
  const f: Fehler[] = [];
  if (e.name.trim() === '') f.push({ feld: 'name', text: 'Gib der Anlage einen Namen.' });
  if (!KUERZEL_MUSTER.test(e.kuerzel))
    f.push({ feld: 'kuerzel', text: 'Kürzel: 1 bis 3 Grossbuchstaben, z. B. T.' });
  // eindeutig unter allen nicht stornierten Anlagen, auch inaktiven (Index anlage_kuerzel_aktiv)
  else if (
    zeilen<AnlageZeile>(teile, 'anlage').some((a) => a.kuerzel === e.kuerzel && a.storniert_am === null)
  )
    f.push({ feld: 'kuerzel', text: `Kürzel ${e.kuerzel} ist schon vergeben.` });
  if (!UHRZEIT.test(e.lichtVon) || !UHRZEIT.test(e.lichtBis))
    f.push({ feld: 'licht', text: 'Lichtzeit als hh:mm, z. B. 06:00 bis 21:00.' });
  if (e.karbonathaerte !== undefined && !(e.karbonathaerte >= 0 && e.karbonathaerte < 100))
    f.push({ feld: 'karbonathaerte', text: 'Karbonathärte zwischen 0 und 99.9 °dH.' });
  if (e.bereiche.length < 1 || e.bereiche.length > 6) f.push({ feld: 'bereiche', text: '1 bis 6 Ebenen.' });
  e.bereiche.forEach((b, i) => {
    const n = i + 1;
    if (!(b.lichtstunden >= 0 && b.lichtstunden <= 24))
      f.push({ feld: `bereich-${n}`, text: `Ebene ${n}: Lichtstunden zwischen 0 und 24.` });
    if (!(Number.isInteger(b.hoeheCm) && b.hoeheCm > 0 && b.hoeheCm <= 300))
      f.push({ feld: `bereich-${n}`, text: `Ebene ${n}: nutzbare Höhe in ganzen cm, 1 bis 300.` });
    if (!(Number.isInteger(b.lichtleisten) && b.lichtleisten >= 0 && b.lichtleisten <= 20))
      f.push({ feld: `bereich-${n}`, text: `Ebene ${n}: Lichtleisten 0 bis 20.` });
  });
  return f;
}

/**
 * Vorgang für schreiben(): zuerst die Anlage mit fester id (Datenart echt, UC1), dann die Bereiche.
 * `ids` liefert neue UUIDs (Client-UUID, Konzept 11.4).
 */
export function anlageVorgang(e: AnlageEingabe, ids: () => string): Schritt[] {
  const anlageId = ids();
  const anlage: Schritt = {
    art: 'neu',
    tabelle: 'anlage',
    felder: {
      client_id: ids(),
      id: anlageId,
      name: e.name.trim(),
      kuerzel: e.kuerzel,
      standort: e.standort,
      datenart: 'echt',
      licht_von: e.lichtVon,
      licht_bis: e.lichtBis,
      luefter_einstellung: e.luefter.trim() === '' ? null : e.luefter.trim(),
      karbonathaerte_dh: e.karbonathaerte ?? null,
    },
  };
  const bereiche: Schritt[] = e.bereiche.map((b, i) => ({
    art: 'neu',
    tabelle: 'bereich',
    felder: {
      client_id: ids(),
      id: ids(),
      anlage_id: anlageId,
      nummer: i + 1,
      name: `Ebene ${i + 1}`,
      standard_betriebsart: b.standardBetriebsart,
      lichtleisten: b.lichtleisten,
      lichtstunden: b.lichtstunden,
      nutzbare_hoehe_mm: b.hoeheCm * 10,
    },
  }));
  return [anlage, ...bereiche];
}
