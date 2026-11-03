// Hilfen für die W0-Tests (Plan 10, Testliste): Fixtures lesen und im Speicher abwandeln.
// Rein, ohne Dateizugriff: das Lesen der Dateien liegt in w0-fixture.ts (Vite) und tests/seed (Node).
//
// Vorausgesetzt aus src/domain/w0/csv.ts (Plan 10, «Betroffene Dateien»):
//   interface CsvTabelle { datei: string; spalten: string[]; zeilen: Record<string, string | null>[] }
//   csvLesen(datei: string, text: string): CsvTabelle | Verstoss[]
// Schlüssel von W0Dateien und Wert von Verstoss.datei ist der Pfad relativ zum Repository (A), z. B.
// 'data/wissensbasis/freigegeben/profilwert.csv'; derselbe Pfad steht in der Datenbank in quelldatei.
import { csvLesen } from '../../src/domain/w0/csv.ts';

export type Zeile = Record<string, string | null>;
export interface Tabelle {
  datei: string;
  spalten: string[];
  zeilen: Zeile[];
}
export type Dateien = Record<string, Tabelle>;

export const PFAD = {
  quelle: 'data/wissensbasis/freigegeben/quelle.csv',
  kulturgruppe: 'data/wissensbasis/freigegeben/kulturgruppe.csv',
  art: 'data/wissensbasis/freigegeben/art.csv',
  profilwert: 'data/wissensbasis/freigegeben/profilwert.csv',
  saatempfehlung: 'data/wissensbasis/freigegeben/saatempfehlung.csv',
  sorten: 'data/stammdaten/sorten.csv',
  duengerschema: 'data/stammdaten/duengerschema.csv',
  wissenseintrag: 'data/wissen/wissenseintrag.csv',
} as const;

export const ALLE_PFADE: string[] = Object.values(PFAD);

/** Rohtexte je Pfad (mit beliebigem Präfix) in Tabellen je Pfad relativ zum Repository */
export function dateienAus(roh: Record<string, string>, praefix: string): Dateien {
  const dateien: Dateien = {};
  for (const [pfad, text] of Object.entries(roh)) {
    const datei = pfad.replace(/\\/g, '/').slice(praefix.length);
    if (!ALLE_PFADE.includes(datei)) continue;
    const tabelle = csvLesen(datei, text);
    if (Array.isArray(tabelle)) throw new Error(`Fixture ${datei} nicht lesbar: ${JSON.stringify(tabelle)}`);
    dateien[datei] = tabelle as unknown as Tabelle;
  }
  return dateien;
}

export function tabelle(d: Dateien, pfad: string): Tabelle {
  const t = d[pfad];
  if (!t) throw new Error(`Datei fehlt in der Fixture: ${pfad}`);
  return t;
}

export function zeile(d: Dateien, pfad: string, zeileId: string): Zeile {
  const z = tabelle(d, pfad).zeilen.find((x) => x['zeile_id'] === zeileId);
  if (!z) throw new Error(`Zeile fehlt in der Fixture: ${pfad} ${zeileId}`);
  return z;
}

/** Kopie der Vorlage mit Änderungen anhängen (neue zeile_id in den Änderungen angeben) */
export function kopie(d: Dateien, pfad: string, vorlageId: string, aenderungen: Zeile): Zeile {
  const neu = { ...zeile(d, pfad, vorlageId), ...aenderungen };
  tabelle(d, pfad).zeilen.push(neu);
  return neu;
}

export function entfernen(d: Dateien, pfad: string, zeileId: string): void {
  const t = tabelle(d, pfad);
  const vorher = t.zeilen.length;
  t.zeilen = t.zeilen.filter((x) => x['zeile_id'] !== zeileId);
  if (t.zeilen.length !== vorher - 1) throw new Error(`Zeile nicht entfernt: ${pfad} ${zeileId}`);
}

export function spalteAnhaengen(d: Dateien, pfad: string, spalte: string, wert: string | null): void {
  const t = tabelle(d, pfad);
  t.spalten.push(spalte);
  for (const z of t.zeilen) z[spalte] = wert;
}

export function spalteEntfernen(d: Dateien, pfad: string, spalte: string): void {
  const t = tabelle(d, pfad);
  t.spalten = t.spalten.filter((s) => s !== spalte);
  t.zeilen = t.zeilen.map((z) => Object.fromEntries(Object.entries(z).filter(([s]) => s !== spalte)));
}

/** Tabelle zurück in CSV-Text (RFC 4180, LF), Spalten in der angegebenen Reihenfolge */
export function alsCsv(t: Tabelle, spalten: string[] = t.spalten): string {
  const feld = (w: string | null | undefined): string =>
    w === null || w === undefined ? '' : /[",\n]/.test(w) ? `"${w.replace(/"/g, '""')}"` : w;
  return (
    [spalten.join(','), ...t.zeilen.map((z) => spalten.map((s) => feld(z[s])).join(','))].join('\n') + '\n'
  );
}

/** Artmerkmale der Stammfelder für eine zusätzliche Art (Gegenprobe), Herkunft wie die Fixture */
export function artStammfelder(d: Dateien, artId: string, nameDe: string, kulturgruppeId: string): void {
  const werte: Record<string, string> = {
    name_de: nameDe,
    name_wiss: artId.replace(/_/g, ' '),
    gbif_key: '9000099',
    kulturgruppe_id: kulturgruppeId,
  };
  for (const [feld, wert] of Object.entries(werte)) {
    kopie(d, PFAD.art, `art.test_art_a.${feld}`, { zeile_id: `art.${artId}.${feld}`, art_id: artId, wert });
  }
}

export function muss<T>(wert: T | undefined | null, was: string): T {
  if (wert === undefined || wert === null) throw new Error(`fehlt: ${was}`);
  return wert;
}
