// Vorlage Deckel oder Platte erfassen (Plan 19; UC2 «Ablauf Deckel oder Platte»; Konzept 5.4; R9.3 Topf 50 oder
// 80 mm). Rein, ohne Zeitbezug.
import type { Schritt, Verstoss } from '../datenpfad/erfassung.ts';
import type { DeckeltypZeile } from './bestand.ts';
import { loecherJeReiheLesen } from './lochbild.ts';
import { nameDoppelt, nameLeer } from './name.ts';

export interface DeckeltypEingabe {
  name: string;
  /** Eingabe in cm, gespeichert in mm (50 oder 80) */
  topfdurchmesserCm: 5 | 8 | null;
  /** «Löcher je Reihe» von vorne nach hinten, z. B. «2, 2, 2» */
  loecherJeReihe: string;
  serviceOeffnung: boolean;
}

export function deckeltypPruefen(
  eingabe: DeckeltypEingabe,
  bestand: readonly Pick<DeckeltypZeile, 'name' | 'client_id'>[],
  /** bei einer Korrektur: die client_id der Vorlage, die ersetzt wird (ihr Name zählt nicht als doppelt) */
  ersetzt?: string,
): Verstoss[] {
  const verstoesse: Verstoss[] = [];
  if (nameLeer(eingabe.name)) verstoesse.push({ feld: 'name', grund: 'Gib einen Namen ein, z. B. «D6»' });
  else if (nameDoppelt(eingabe.name, bestand, ersetzt))
    verstoesse.push({ feld: 'name', grund: `Einen Deckel «${eingabe.name.trim()}» gibt es schon` });
  if (eingabe.topfdurchmesserCm !== 5 && eingabe.topfdurchmesserCm !== 8)
    verstoesse.push({ feld: 'topfdurchmesser_mm', grund: 'Wähle die Topfgrösse 5 oder 8 cm' });
  const lochbild = loecherJeReiheLesen(eingabe.loecherJeReihe);
  if (!lochbild.ok) verstoesse.push(...lochbild.verstoesse);
  return verstoesse;
}

/** neue Zeile deckeltyp; vorher deckeltypPruefen */
export function deckeltypSchritt(eingabe: DeckeltypEingabe, clientId: string): Schritt {
  const lochbild = loecherJeReiheLesen(eingabe.loecherJeReihe);
  return {
    art: 'neu',
    tabelle: 'deckeltyp',
    felder: {
      client_id: clientId,
      name: eingabe.name.trim(),
      topfdurchmesser_mm: eingabe.topfdurchmesserCm === null ? null : eingabe.topfdurchmesserCm * 10,
      loecher_je_reihe: lochbild.ok ? lochbild.reihen : [],
      service_oeffnung: eingabe.serviceOeffnung,
    },
  };
}
