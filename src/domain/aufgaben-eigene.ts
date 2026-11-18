// Aufgaben-Rechnung, Stufe 2 «Eigene Aufgabe» (Plan 249; Konzept R5.2 letzte Zeile, R5.3, U9, U11, 8.1 Regel 2,
// Entscheid 0029): eigene wiederkehrende Aufgaben je Anlage mit Name und Intervall. Fälligkeit = jüngste Erledigung
// (Ereignis aufgabe_erledigt) oder jüngstes «Überspringen» über die Kette ersetzt_id + Intervall, ohne beides der
// Erfassungstag der ersten Zeile (A1). Nichts wird als Zustand gespeichert; eine Änderung ist Storno plus neue Zeile mit
// ersetzt_id (A9). Rein; importiert aus den übrigen Aufgaben-Modulen nur Typen (wie aufgaben-stromausfall.ts).
import { anlagenAus, zeilen, type Teile } from './anlage/teile.ts';
import type { Verstoss, Vorgang } from './datenpfad/erfassung.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen, type Zeitzone } from './zeit.ts';
import type { Rohaufgabe } from './aufgaben.ts';
import type { AufschubZeile } from './aufgaben-aufschub.ts';
import type { Regelkontext } from './aufgaben-regeln.ts';

export type EigeneTyp = 'eigene_aufgabe';
export const EIGENE_TYP: EigeneTyp = 'eigene_aufgabe';
/** Spalte «Morgen» der Tabelle R5.2: ja, ohne Grenze */
export const MORGEN_EIGENE = 'ja' as const;

export const NAME_MAX = 80;
export const INTERVALL_MIN = 1;
export const INTERVALL_MAX = 365;

interface EigeneZeile {
  id: string;
  client_id?: string | null;
  anlage_id: string;
  name: string;
  intervall_d: number | string;
  erfasst_am: string;
  ersetzt_id?: string | null;
  storniert_am?: string | null;
}

interface ErledigtZeile {
  id: string;
  typ: string;
  aufgabe_schluessel?: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}

export interface EigeneDefinition {
  id: string;
  clientId: string;
  anlageId: string;
  name: string;
  intervallD: number;
  /** Rohwert erfasst_am der Zeile */
  erfasstAm: string;
  /** eigene Id und alle Vorgänger über ersetzt_id */
  kette: readonly string[];
}

export interface EigeneEingabe {
  name: string;
  intervallD: number;
}

const offen = (z: { storniert_am?: string | null }) => (z.storniert_am ?? null) === null;
const vorsatz = (id: string) => `${EIGENE_TYP}|${id}|`;

/** Kette ab einer Zeile rückwärts über ersetzt_id (auch stornierte Vorgänger, A10); bricht bei einem Kreis ab */
function ketteVon(z: EigeneZeile, nachId: ReadonlyMap<string, EigeneZeile>): EigeneZeile[] {
  const kette: EigeneZeile[] = [];
  const gesehen = new Set<string>();
  for (let k: EigeneZeile | undefined = z; k && !gesehen.has(k.id); k = nachId.get(k.ersetzt_id ?? '')) {
    gesehen.add(k.id);
    kette.push(k);
  }
  return kette;
}

/**
 * Aktive Definitionen: nicht storniert, ohne nicht stornierten Nachfolger (TO2, A9), Anlage aktiv; nach Name, dann Id.
 */
export function eigeneDefinitionen(teile: Teile, anlageId?: string): EigeneDefinition[] {
  const alle = zeilen<EigeneZeile>(teile, 'eigene_aufgabe');
  const nachId = new Map(alle.map((z) => [z.id, z]));
  const ersetzt = new Set(alle.filter(offen).map((z) => z.ersetzt_id ?? ''));
  const anlagen = new Set(anlagenAus(teile).map((a) => a.id));
  return alle
    .filter((z) => offen(z) && !ersetzt.has(z.id) && anlagen.has(z.anlage_id))
    .filter((z) => anlageId === undefined || z.anlage_id === anlageId)
    .map((z) => ({
      id: z.id,
      clientId: z.client_id ?? z.id,
      anlageId: z.anlage_id,
      name: z.name,
      intervallD: Number(z.intervall_d),
      erfasstAm: z.erfasst_am,
      kette: ketteVon(z, nachId).map((k) => k.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de') || a.id.localeCompare(b.id));
}

/** Erledigungen aus beiden Ereignis-Teilen, je id einmal, ohne Storno */
function erledigungen(teile: Teile): ErledigtZeile[] {
  const gesehen = new Set<string>();
  return [
    ...zeilen<ErledigtZeile>(teile, 'ereignis_platz'),
    ...zeilen<ErledigtZeile>(teile, 'ereignis'),
  ].filter(
    (e) => e.typ === 'aufgabe_erledigt' && offen(e) && !gesehen.has(e.id) && Boolean(gesehen.add(e.id)),
  );
}

const schluesselVon = (e: ErledigtZeile): string =>
  e.aufgabe_schluessel ??
  (typeof e.daten?.['aufgabe_schluessel'] === 'string' ? e.daten['aufgabe_schluessel'] : '');

const spaetester = (tage: readonly string[]): string | undefined => [...tage].sort().at(-1);

/** Erfassungstag der ältesten Zeile der Kette (A1) */
function ersterTag(d: EigeneDefinition, teile: Teile, zeitzone: Zeitzone): string {
  const nachId = new Map(zeilen<EigeneZeile>(teile, 'eigene_aufgabe').map((z) => [z.id, z]));
  const erste = nachId.get(d.kette.at(-1) ?? d.id);
  return kalendertag(new Date(erste?.erfasst_am ?? d.erfasstAm), zeitzone);
}

/**
 * Fälligkeit (R5.2 letzte Zeile, R5.3): jüngster Tag aus Erledigung und «Überspringen» der Kette + Intervall; ohne
 * beides der Erfassungstag der ersten Zeile. `zuletztErledigtAm` nur, wenn es eine Erledigung gibt.
 */
export function eigeneFaelligkeit(
  d: EigeneDefinition,
  teile: Teile,
  aufschuebe: readonly AufschubZeile[],
  zeitzone: Zeitzone,
): { faelligAm: string; zuletztErledigtAm?: string } {
  const vorsaetze = d.kette.map(vorsatz);
  const passt = (s: string) => vorsaetze.some((v) => s.startsWith(v));
  const erledigt = spaetester(
    erledigungen(teile)
      .filter((e) => passt(schluesselVon(e)))
      .map((e) => kalendertag(new Date(e.gilt_ab), zeitzone)),
  );
  const uebersprungen = spaetester(
    aufschuebe
      .filter((a) => a.art === 'ueberspringen' && offen(a) && passt(a.aufgabe_schluessel))
      .map((a) => a.gesetzt_am),
  );
  const grundlage = spaetester([erledigt, uebersprungen].filter((t): t is string => t !== undefined));
  const faelligAm =
    grundlage === undefined ? ersterTag(d, teile, zeitzone) : tagPlus(grundlage, d.intervallD);
  return erledigt === undefined ? { faelligAm } : { faelligAm, zuletztErledigtAm: erledigt };
}

const tageText = (n: number) => `${n} ${n === 1 ? 'Tag' : 'Tagen'}`;
const intervallText = (n: number) => (n === 1 ? 'jeden Tag' : `alle ${n} Tage`);

/** Grund nach U11 (A7): «alle 30 Tage · zuletzt vor 3 Tagen» oder «… · noch nie erledigt» */
function grundText(d: EigeneDefinition, zuletzt: string | undefined, heute: string): string {
  const seit =
    zuletzt === undefined ? 'noch nie erledigt' : `zuletzt vor ${tageText(tageZwischen(zuletzt, heute))}`;
  return `${intervallText(d.intervallD)} · ${seit}`;
}

/** je aktive Definition eine Rohaufgabe mit Bezug Definition (A5), Gewicht Routine (A4), ohne Ort */
export function eigeneAufgaben(k: Regelkontext): Rohaufgabe[] {
  const datenart = new Map(anlagenAus(k.teile).map((a) => [a.id, a.datenart]));
  return eigeneDefinitionen(k.teile).map((d) => {
    const f = eigeneFaelligkeit(d, k.teile, k.aufschuebe, k.zeitzone);
    return {
      schluessel: `${vorsatz(d.id)}${f.faelligAm}`,
      typ: EIGENE_TYP,
      bezug: d.id,
      bezugArt: 'eigene_aufgabe',
      faelligAm: f.faelligAm,
      anlageId: d.anlageId,
      datenart: datenart.get(d.anlageId) ?? 'echt',
      titel: d.name,
      gewicht: 'routine',
      grund: grundText(d, f.zuletztErledigtAm, k.heute),
    };
  });
}

/** Liste für die Maske Anlage (A16: ursprüngliche Fälligkeit, nicht das Anzeigedatum nach «Morgen») */
export function eigeneAufgabenListe(
  teile: Teile,
  anlageId: string,
  stichtag: Date,
  zeitzone: Zeitzone,
): { definition: EigeneDefinition; faelligAm: string; text: string }[] {
  const heute = kalendertag(stichtag, zeitzone);
  const aufschuebe = zeilen<AufschubZeile>(teile, 'aufschub').filter(offen);
  return eigeneDefinitionen(teile, anlageId).map((d) => {
    const { faelligAm } = eigeneFaelligkeit(d, teile, aufschuebe, zeitzone);
    const ueber = tageZwischen(faelligAm, heute);
    const wann =
      ueber === 0
        ? 'heute fällig'
        : ueber > 0
          ? `seit ${tageText(ueber)} fällig`
          : `fällig ${tagKurz(faelligAm)}`;
    return { definition: d, faelligAm, text: `${intervallText(d.intervallD)} · ${wann}` };
  });
}

/** Name nach Trim 1 bis 80 Zeichen (A11), Intervall ganzzahlig 1 bis 365 (A2) */
export function eigeneEingabePruefen(e: EigeneEingabe): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  const name = e.name.trim();
  if (name === '') verstoesse.push({ feld: 'name', grund: 'Bitte einen Namen eingeben.' });
  else if (name.length > NAME_MAX)
    verstoesse.push({ feld: 'name', grund: `Bitte höchstens ${NAME_MAX} Zeichen eingeben.` });
  if (!Number.isInteger(e.intervallD) || e.intervallD < INTERVALL_MIN || e.intervallD > INTERVALL_MAX)
    verstoesse.push({
      feld: 'intervall_d',
      grund: `Bitte eine ganze Zahl zwischen ${INTERVALL_MIN} und ${INTERVALL_MAX} eingeben.`,
    });
  return verstoesse;
}

/** neue Definition; leer bei ungültiger Eingabe */
export function eigeneAnlegenVorgang(anlageId: string, e: EigeneEingabe, id: string): Vorgang {
  if (eigeneEingabePruefen(e).length > 0) return [];
  return [
    {
      art: 'neu',
      tabelle: 'eigene_aufgabe',
      felder: { id, client_id: id, anlage_id: anlageId, name: e.name.trim(), intervall_d: e.intervallD },
    },
  ];
}

/** Änderung = neue Zeile mit ersetzt_id, danach Storno der alten (A9); leer, wenn unverändert oder ungültig */
export function eigeneAendernVorgang(alt: EigeneDefinition, e: EigeneEingabe, id: string): Vorgang {
  if (eigeneEingabePruefen(e).length > 0) return [];
  const name = e.name.trim();
  if (name === alt.name.trim() && e.intervallD === alt.intervallD) return [];
  return [
    {
      art: 'neu',
      tabelle: 'eigene_aufgabe',
      felder: {
        id,
        client_id: id,
        anlage_id: alt.anlageId,
        name,
        intervall_d: e.intervallD,
        ersetzt_id: alt.id,
      },
    },
    { art: 'storno', tabelle: 'eigene_aufgabe', clientId: alt.clientId, grund: 'korrektur' },
  ];
}

/** Entfernen = Storno ohne Nachfolger (A12) */
export function eigeneEntfernenVorgang(alt: EigeneDefinition): Vorgang {
  return [{ art: 'storno', tabelle: 'eigene_aufgabe', clientId: alt.clientId, grund: 'korrektur' }];
}
