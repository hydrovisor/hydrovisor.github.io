// Lesezugriffe auf die W0-Dateien, gemeinsam für Validator, Artauswahl und Abbildung.
import { DATEI, type DateiName } from './schema.ts';
import type { CsvTabelle, W0Dateien, Zeile } from './typen.ts';

export function datei(d: W0Dateien, name: DateiName): CsvTabelle | undefined {
  return d[DATEI[name]];
}

export function zeilen(d: W0Dateien, name: DateiName): Zeile[] {
  return datei(d, name)?.zeilen ?? [];
}

export function wert(z: Zeile, spalte: string): string | null {
  return z[spalte] ?? null;
}

/** Artmerkmale je Art (Zeilen von art.csv ohne Kulturform): art_id → feld → Zeile */
export function artMerkmale(d: W0Dateien): Map<string, Map<string, Zeile>> {
  const je = new Map<string, Map<string, Zeile>>();
  for (const z of zeilen(d, 'art')) {
    const artId = wert(z, 'art_id');
    const feld = wert(z, 'feld');
    if (!artId || !feld || wert(z, 'kulturform') !== null) continue;
    const felder = je.get(artId) ?? new Map<string, Zeile>();
    felder.set(feld, z);
    je.set(artId, felder);
  }
  return je;
}

/** Kulturform-Felder je Art und Kulturform: art_id → kulturform → feld → Zeile */
export function artKulturformen(d: W0Dateien): Map<string, Map<string, Map<string, Zeile>>> {
  const je = new Map<string, Map<string, Map<string, Zeile>>>();
  for (const z of zeilen(d, 'art')) {
    const artId = wert(z, 'art_id');
    const kf = wert(z, 'kulturform');
    const feld = wert(z, 'feld');
    if (!artId || !kf || !feld) continue;
    const formen = je.get(artId) ?? new Map<string, Map<string, Zeile>>();
    const felder = formen.get(kf) ?? new Map<string, Zeile>();
    felder.set(feld, z);
    formen.set(kf, felder);
    je.set(artId, formen);
  }
  return je;
}

function merkmal(d: W0Dateien, feld: string): Map<string, string> {
  const ergebnis = new Map<string, string>();
  for (const [artId, felder] of artMerkmale(d)) {
    const w = felder.get(feld)?.['wert'];
    if (w) ergebnis.set(artId, w);
  }
  return ergebnis;
}

/** name_de → art_id (Entscheid W13) */
export function artNachName(d: W0Dateien): Map<string, string> {
  return new Map([...merkmal(d, 'name_de')].map(([artId, name]) => [name, artId]));
}

/** art_id → kulturgruppe_id */
export function artGruppe(d: W0Dateien): Map<string, string> {
  return merkmal(d, 'kulturgruppe_id');
}

/** Arten der ersten Runde: Arten, auf die sorten.csv verweist (4.3.1, A3) */
export function ersteRunde(d: W0Dateien): Set<string> {
  const nachName = artNachName(d);
  const arten = new Set<string>();
  for (const s of zeilen(d, 'sorten')) {
    const artId = nachName.get(wert(s, 'art') ?? '');
    if (artId) arten.add(artId);
  }
  return arten;
}
