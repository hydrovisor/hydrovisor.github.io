// CSV nach RFC 4180 lesen (03_import_w0.md 2.1): UTF-8 ohne BOM, Komma, Kopfzeile Pflicht, LF.
// Leeres Feld heisst «kein Wert» (null), nie 0. Formatfehler sind Verstösse V1 (A11).
import type { CsvTabelle, Verstoss } from './typen.ts';

export type { CsvTabelle } from './typen.ts';

const BOM = '﻿';

function v1(datei: string, zeileId: string | null, wert: string | null, text: string): Verstoss {
  return { datei, zeileId, regel: 'V1', wert, text };
}

/** Zerlegt den Text in Datensätze aus Feldern; null bei offenem Anführungszeichen */
function datensaetze(text: string): string[][] | null {
  const saetze: string[][] = [];
  let satz: string[] = [];
  let feld = '';
  let inAnfuehrung = false;
  let i = 0;
  while (i < text.length) {
    const z = text[i];
    if (inAnfuehrung) {
      if (z === '"') {
        if (text[i + 1] === '"') {
          feld += '"';
          i += 2;
          continue;
        }
        inAnfuehrung = false;
      } else feld += z;
    } else if (z === '"' && feld === '') inAnfuehrung = true;
    else if (z === ',') {
      satz.push(feld);
      feld = '';
    } else if (z === '\n') {
      satz.push(feld);
      saetze.push(satz);
      satz = [];
      feld = '';
    } else feld += z;
    i += 1;
  }
  if (inAnfuehrung) return null;
  if (feld !== '' || satz.length > 0) {
    satz.push(feld);
    saetze.push(satz);
  }
  return saetze;
}

export function csvLesen(datei: string, text: string): CsvTabelle | Verstoss[] {
  const fehler: Verstoss[] = [];
  if (text.startsWith(BOM))
    fehler.push(v1(datei, null, 'BOM', 'Datei beginnt mit BOM (UTF-8 ohne BOM verlangt)'));
  if (text.includes('\r')) fehler.push(v1(datei, null, 'CR', 'Zeilenende CRLF statt LF'));
  if (fehler.length > 0) return fehler;

  const saetze = datensaetze(text);
  if (saetze === null) return [v1(datei, null, null, 'Anführungszeichen nicht geschlossen')];
  const [kopf, ...rest] = saetze;
  if (!kopf || kopf.every((s) => s === '')) return [v1(datei, null, null, 'Kopfzeile fehlt')];

  const doppelt = kopf.filter((s, i) => kopf.indexOf(s) !== i);
  for (const s of doppelt) fehler.push(v1(datei, null, s, `Spalte doppelt: ${s}`));

  const zeilen = rest.map((felder) => {
    if (felder.length !== kopf.length) {
      fehler.push(
        v1(datei, felder[0] || null, String(felder.length), `${felder.length} Felder statt ${kopf.length}`),
      );
    }
    return Object.fromEntries(kopf.map((s, i) => [s, felder[i] || null]));
  });
  if (fehler.length > 0) return fehler;
  return { datei, spalten: kopf, zeilen };
}
