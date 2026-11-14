// Gruppen einer Phasenkarte (Plan 226, UX4-AK1; R1.5): Sätze einer Karte mit gleicher Sorte, Kulturform und gleichem
// Übergang stehen als eine Zeile «Sorte × n». Antworten bleiben Ereignisse am Satz: gruppenAntworten() liefert je Satz
// die Antwort, die unverändert an antwortVorgang() geht. Rein, ohne Uhr: die Fälligkeit rechnet phasenKarten().
import { zeilen, type Teile } from '../anlage/teile.ts';
import { phasenBeginnZeit, type Fragekarte, type Fragezeile } from './fragen.ts';
import type { Phase } from './profil.ts';

export type Antwort = 'ja' | 'noch_nicht' | 'problem';

export interface Fragegruppe {
  /** sorteId|kulturform|von|nach, eindeutig innerhalb der Karte */
  schluessel: string;
  sorte: string;
  sorteId: string;
  kulturform: string;
  von: Phase;
  nach: Phase;
  uebergang: string;
  /** Phasentext; bei abweichenden Texten der des ältesten Phasenbeginns (A3) */
  text: string;
  frage: string;
  /** wahr, sobald ein Satz der Gruppe «prüfen» trägt (A3) */
  pruefen: boolean;
  /** aktive Pflanzungen aller Sätze der Gruppe (A1) */
  pflanzungen: number;
  zeilen: Fragezeile[];
}

export interface GruppenWahl {
  gruppe: Readonly<Record<string, Antwort>>;
  satz: Readonly<Record<string, Antwort>>;
}

/** Gruppen in der Reihenfolge der Zeilen der Karte; die erste Zeile einer Gruppe bestimmt ihren Platz */
export function phasenGruppen(teile: Teile, karte: Fragekarte): Fragegruppe[] {
  const sorteVon = new Map(
    zeilen<{ id: string; sorte_id: string }>(teile, 'satz').map((s) => [s.id, s.sorte_id] as const),
  );
  const aktive = new Map<string, number>();
  for (const z of zeilen<{ satz_id: string; status: string }>(teile, 'v_pflanzung_zustand'))
    if (z.status === 'aktiv') aktive.set(z.satz_id, (aktive.get(z.satz_id) ?? 0) + 1);
  const gruppen = new Map<string, Fragegruppe & { beginn: string }>();
  for (const z of karte.zeilen) {
    const sorteId = sorteVon.get(z.satzId) ?? z.sorte;
    const schluessel = `${sorteId}|${z.kulturform}|${z.von}|${z.nach}`;
    const beginn = phasenBeginnZeit(teile, z.satzId) ?? '';
    const g = gruppen.get(schluessel);
    if (!g) {
      gruppen.set(schluessel, {
        schluessel,
        sorte: z.sorte,
        sorteId,
        kulturform: z.kulturform,
        von: z.von,
        nach: z.nach,
        uebergang: z.uebergang,
        text: z.text,
        frage: z.frage,
        pruefen: z.pruefen,
        pflanzungen: aktive.get(z.satzId) ?? 0,
        zeilen: [z],
        beginn,
      });
      continue;
    }
    g.zeilen.push(z);
    g.pflanzungen += aktive.get(z.satzId) ?? 0;
    g.pruefen = g.pruefen || z.pruefen;
    if (beginn < g.beginn) {
      g.beginn = beginn;
      g.text = z.text;
    }
  }
  return [...gruppen.values()].map(({ beginn, ...g }) => {
    void beginn;
    return g;
  });
}

/** je Satz in der Reihenfolge der Karte: Einzelwahl vor Gruppenwahl vor «ja» */
export function gruppenAntworten(
  gruppen: readonly Fragegruppe[],
  wahl: GruppenWahl,
): { satzId: string; antwort: Antwort }[] {
  return gruppen.flatMap((g) =>
    g.zeilen.map((z) => ({
      satzId: z.satzId,
      antwort: wahl.satz[z.satzId] ?? wahl.gruppe[g.schluessel] ?? ('ja' as Antwort),
    })),
  );
}
