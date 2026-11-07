// Aufgaben-Rechnung, Stufe 2 «Nach Stromausfall» (Plan 30 Lösungsweg 5; UC8 Ablauf 8, R5.1, R5.2 letzte Zeilen, R5.4,
// G2, G5): je nicht storniertem Ereignis `stromausfall {beginn, ende}` an einer Anlage die Folgeaufgaben, fällig am
// Kalendertag des Endes in Zürich; bei DWC und Dauer über 6 Stunden am Folgetag Wurzeln und Messung. Erledigt durch
// «Erledigt» oder die passende Erfassung ab dem Ende (A10). Rein; importiert aus den übrigen Aufgaben-Modulen nur Typen,
// damit die Tabellen unten auch ohne Ladereihenfolge bereitstehen.
import { anlagenAus, ms, zeilen, type AnlageZeile, type Teile } from './anlage/teile.ts';
import { kalendertag, tagPlus } from './zeit.ts';
import type { AufgabenOrt, BezugArt, Rohaufgabe } from './aufgaben.ts';
import type { OrtLage, Regelkontext } from './aufgaben-regeln.ts';

export type StromTyp =
  'strom_pumpen' | 'strom_ac10_licht' | 'strom_wassertemperatur' | 'strom_wurzeln' | 'strom_messen';

/** Reihenfolge = letzte Zeilen der Tabelle R5.2 */
export const STROM_LISTE: readonly StromTyp[] = [
  'strom_pumpen',
  'strom_ac10_licht',
  'strom_wassertemperatur',
  'strom_wurzeln',
  'strom_messen',
];
export const STROM_TYPEN: ReadonlySet<StromTyp> = new Set<StromTyp>(STROM_LISTE);

/** Spalte «Morgen» der Tabelle R5.2: nie */
export const MORGEN_STROM: Record<StromTyp, 'nein'> = {
  strom_pumpen: 'nein',
  strom_ac10_licht: 'nein',
  strom_wassertemperatur: 'nein',
  strom_wurzeln: 'nein',
  strom_messen: 'nein',
};

/** DWC bei Dauer über 6 Stunden (ausschliesslich) */
export const STROM_GRENZE_STUNDEN = 6;

const TITEL: Record<StromTyp, string> = {
  strom_pumpen: 'Pumpen prüfen nach Stromausfall',
  strom_ac10_licht: 'AC10-Zeitplan und Licht prüfen',
  strom_wassertemperatur: 'Wassertemperatur messen',
  strom_wurzeln: 'Wurzeln prüfen nach Stromausfall',
  strom_messen: 'Messen nach Stromausfall',
};

interface Ereignis {
  id: string;
  typ: string;
  anlage_id?: string | null;
  bereich_id?: string | null;
  platz_id: string | null;
  daten?: Record<string, unknown> | null;
  aufgabe_schluessel?: string | null;
  gilt_ab: string;
  storniert_am?: string | null;
}
interface Messung {
  platz_id: string | null;
  temperatur?: number | string | null;
  gilt_ab: string;
  storniert_am?: string | null;
}

const offen = (z: { storniert_am?: string | null }) => (z.storniert_am ?? null) === null;
const datenVon = (e: Ereignis) => e.daten ?? {};
const schluessel = (typ: StromTyp, bezug: string, tag: string) => `${typ}|${bezug}|${tag}`;

/** Ereignisse aus beiden Bündelteilen, je id einmal, ohne Storno */
function ereignisse(teile: Teile): Ereignis[] {
  const gesehen = new Set<string>();
  return [...zeilen<Ereignis>(teile, 'ereignis'), ...zeilen<Ereignis>(teile, 'ereignis_platz')].filter(
    (e) => offen(e) && !gesehen.has(e.id) && Boolean(gesehen.add(e.id)),
  );
}

/** Ort, an dem die Folgeaufgaben des Gefässes gelten: mit Lösung, nicht ruht und nicht entfernt (R5.4) */
const gepflegt = (lage: OrtLage) =>
  lage.gefaess !== undefined &&
  lage.fuellzustand === 'loesung' &&
  lage.status !== 'ruht' &&
  lage.status !== 'entfernt';

/** Bereiche der Anlage mit Kurzprüfung im Rundgang: Gefäss mit Lösung oder Anzuchtbox mit Satz (Plan 30) */
function bereicheMitKurzpruefung(k: Regelkontext, lagen: readonly OrtLage[]): Set<string> {
  const bereiche = new Set<string>();
  for (const lage of lagen) {
    const box =
      lage.anzuchtort !== undefined && k.pflanzen.some((p) => p.aktiv && p.platzId === lage.platz.id);
    if ((gepflegt(lage) || box) && lage.ort.bereichId !== null) bereiche.add(lage.ort.bereichId);
  }
  return bereiche;
}

/** Folgeaufgaben aller Stromausfälle (Stufe 2, R5.2) */
export function stromausfallAufgaben(k: Regelkontext, orte: ReadonlyMap<string, OrtLage>): Rohaufgabe[] {
  const alle = ereignisse(k.teile);
  const erledigt = new Set(
    alle
      .filter((e) => e.typ === 'aufgabe_erledigt')
      .map((e) => e.aufgabe_schluessel ?? datenVon(e)['aufgabe_schluessel']),
  );
  const messungen = zeilen<Messung>(k.teile, 'messung').filter(offen);
  const anlagen = new Map(anlagenAus(k.teile).map((a) => [a.id, a]));
  const aufgaben: Rohaufgabe[] = [];
  for (const s of alle.filter((e) => e.typ === 'stromausfall')) {
    const anlage = anlagen.get(s.anlage_id ?? '');
    const beginn = ms(String(datenVon(s)['beginn'] ?? ''));
    const ende = ms(String(datenVon(s)['ende'] ?? s.gilt_ab));
    if (!anlage || Number.isNaN(beginn) || Number.isNaN(ende)) continue;
    const tag = kalendertag(new Date(ende), k.zeitzone);
    const folgetag = tagPlus(tag, 1);
    const lang = ende - beginn > STROM_GRENZE_STUNDEN * 3_600_000;
    const lagen = [...orte.values()].filter((l) => l.anlage.id === anlage.id);
    // eine Erfassung zählt ab dem Ende des Ausfalls und ab dem Fälligkeitstag (A10)
    const danach = (iso: string, faelligAm: string) =>
      ms(iso) >= ende && kalendertag(new Date(iso), k.zeitzone) >= faelligAm;
    const kurz = (platzId: string, punkte: readonly string[], faelligAm: string) =>
      alle.some(
        (e) =>
          e.typ === 'kurzpruefung' &&
          e.platz_id === platzId &&
          punkte.includes(String(datenVon(e)['punkt'])) &&
          danach(e.gilt_ab, faelligAm),
      );
    const gemessen = (platzId: string, faelligAm: string, mitTemperatur: boolean) =>
      messungen.some(
        (m) =>
          m.platz_id === platzId &&
          (!mitTemperatur || (m.temperatur ?? null) !== null) &&
          danach(m.gilt_ab, faelligAm),
      );
    const dazu = (typ: StromTyp, faelligAm: string, fertig: boolean, ort?: AufgabenOrt) => {
      const bezug = ort?.platzId ?? anlage.id;
      const key = schluessel(typ, bezug, faelligAm);
      if (fertig || erledigt.has(key)) return;
      aufgaben.push(neu(typ, bezug, ort ? 'platz' : 'anlage', faelligAm, anlage, key, ort));
    };

    // an der Anlage (Abweichung 2): Pumpen über alle Gefässe mit Luftpumpe, Licht über alle Bereiche
    const mitPumpe = lagen.filter((l) => gepflegt(l) && (l.gefaess?.luftpumpe ?? null) !== null);
    dazu(
      'strom_pumpen',
      tag,
      mitPumpe.length > 0 &&
        mitPumpe.every((l) =>
          kurz(
            l.platz.id,
            l.gefaess?.betriebsart === 'kratky_belueftet'
              ? ['pumpe', 'luftzone', 'loesung_topfboden']
              : ['pumpe'],
            tag,
          ),
        ),
    );
    const bereiche = bereicheMitKurzpruefung(k, lagen);
    dazu(
      'strom_ac10_licht',
      tag,
      bereiche.size > 0 &&
        [...bereiche].every((b) =>
          alle.some(
            (e) =>
              e.typ === 'kurzpruefung' &&
              e.bereich_id === b &&
              (e.platz_id ?? null) === null &&
              datenVon(e)['punkt'] === 'licht' &&
              datenVon(e)['ok'] !== false &&
              danach(e.gilt_ab, tag),
          ),
        ),
    );
    // je Gefäss
    for (const lage of lagen.filter(gepflegt)) {
      const p = lage.platz.id;
      dazu('strom_wassertemperatur', tag, gemessen(p, tag, true), lage.ort);
      if (!lang || lage.gefaess?.betriebsart !== 'dwc') continue;
      dazu('strom_wurzeln', folgetag, kurz(p, ['wurzeln'], folgetag), lage.ort);
      dazu('strom_messen', folgetag, gemessen(p, folgetag, false), lage.ort);
    }
  }
  return aufgaben;
}

function neu(
  typ: StromTyp,
  bezug: string,
  bezugArt: BezugArt,
  faelligAm: string,
  anlage: AnlageZeile,
  key: string,
  ort?: AufgabenOrt,
): Rohaufgabe {
  return {
    schluessel: key,
    typ,
    bezug,
    bezugArt,
    faelligAm,
    anlageId: anlage.id,
    datenart: anlage.datenart,
    ...(ort ? { ort } : {}),
    titel: TITEL[typ],
    // Abweichung, Sauerstoffmangel (R5.5)
    gewicht: 'ausserhalb',
  };
}

/** Schritt «Stromausfall erfassen» (ein neues Ereignis, mit Vorgang verträglich) */
export interface StromausfallSchritt {
  art: 'neu';
  tabelle: 'ereignis';
  felder: {
    id: string;
    client_id: string;
    typ: 'stromausfall';
    anlage_id: string;
    daten: { beginn: string; ende: string };
    gilt_ab: string;
  };
}

/** «Stromausfall erfassen»: Ereignis an der Anlage; leer bei Ende vor Beginn oder Beginn nach jetzt */
export function stromausfallVorgang(
  e: { anlageId: string; beginn: Date; ende: Date },
  id: string,
  jetzt: Date,
): StromausfallSchritt[] {
  if (e.ende.getTime() < e.beginn.getTime() || e.beginn.getTime() > jetzt.getTime()) return [];
  return [
    {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: 'stromausfall',
        anlage_id: e.anlageId,
        daten: { beginn: e.beginn.toISOString(), ende: e.ende.toISOString() },
        gilt_ab: e.ende.toISOString(),
      },
    },
  ];
}
