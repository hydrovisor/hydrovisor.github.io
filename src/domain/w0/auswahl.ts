// Teilfreigabe je Art (03_import_w0.md 8.4, Konzept 9.5, A3): Eine Art ist voll, wenn profilwert.csv für alle
// fünf Phasen anwendbar auf Ebene Art führt und jede anwendbare Phase die Pflichtgrössen «mindestens auf Ebene
// Art» hat. Sonst lädt der Seed nur die Artmerkmale; Arten der ersten Runde zusätzlich ihre Keimungswerte.
import { artMerkmale, datei, ersteRunde, wert, zeilen } from './bestand.ts';
import type { Pflichtgroesse } from './konstanten.ts';
import { PHASEN } from './schema.ts';
import type { W0Dateien } from './typen.ts';

export interface Auswahl {
  voll: Set<string>;
  nurMerkmale: Map<string, string>;
  keimungVorab: Set<string>;
}

/** Keimungswerte, die für die Arten der ersten Runde vorab gehen (8.4) */
export const KEIMUNG_VORAB = ['keimart', 'keimtemp', 'dauer'];

export function artAuswahl(dateien: W0Dateien, pflichtgroessen: Pflichtgroesse[]): Auswahl {
  const voll = new Set<string>();
  const nurMerkmale = new Map<string, string>();
  const runde = ersteRunde(dateien);
  const mitProfil = datei(dateien, 'profilwert') !== undefined;
  const pw = zeilen(dateien, 'profilwert').filter((z) => wert(z, 'ebene') === 'art');

  for (const artId of artMerkmale(dateien).keys()) {
    if (!mitProfil) {
      nurMerkmale.set(artId, 'profilwert.csv nicht geliefert');
      continue;
    }
    const eigene = pw.filter((z) => wert(z, 'bezug') === artId);
    const hat = (phase: string, groesse: string) =>
      eigene.find((z) => wert(z, 'phase') === phase && wert(z, 'groesse') === groesse);
    const gruende: string[] = [];
    for (const phase of PHASEN) {
      const anwendbar = hat(phase, 'anwendbar');
      if (!anwendbar) {
        gruende.push(`Phase ${phase} ohne anwendbar`);
        continue;
      }
      if (anwendbar['text_wert'] !== 'ja') continue;
      for (const p of pflichtgroessen) {
        if (p.phase === phase && p.mindestensArt && !hat(phase, p.groesse))
          gruende.push(`Phase ${phase} ohne ${p.groesse} auf Ebene Art`);
      }
    }
    if (gruende.length === 0) voll.add(artId);
    else nurMerkmale.set(artId, gruende.join('; '));
  }
  const keimungVorab = new Set([...runde].filter((a) => nurMerkmale.has(a)));
  return { voll, nurMerkmale, keimungVorab };
}
