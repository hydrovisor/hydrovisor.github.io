// Belegung einer Anlage für die Übersicht «Anlagen» (Plan 216, Entscheid 0025): Ebenen von oben nach unten mit
// belegten, reservierten und freien Töpfen je Gefäss, Anzuchtboxen mit Inhalt, Messstellen. Rein: liest nur Teile des
// Bündels, keine Uhr (A7: Stand des Bündels, keine Prognose).
import { deckelBelegung, sorteDesSatzes } from '../pflanzung/topf.ts';
import {
  anzuchtortAm,
  bereicheAus,
  gefaessAm,
  gefaessStatus,
  nachKennung,
  plaetzeAus,
  zeilen,
  type PlatzZeile,
  type Teile,
} from './teile.ts';
import { statusBadge } from './uebersicht.ts';

export interface TopfZahlen {
  belegt: number;
  reserviert: number;
  frei: number;
}

export interface SortenAnzahl {
  sorte: string;
  anzahl: number;
}

export type Topfpunkt = 'belegt' | 'reserviert' | 'frei';

export interface GefaessBelegung extends TopfZahlen {
  code: string;
  kennung: string;
  /** Löcher des Deckels; 0 ohne Gefäss oder ohne Deckel mit Löchern (A2) */
  loecher: number;
  /** aktive Pflanzungen am Platz */
  pflanzen: number;
  ohneGefaess: boolean;
  sorten: SortenAnzahl[];
  /** Prüfstatus als Wort («nicht geprüft», «Volumen offen», «ruht») */
  badge?: string;
  /** Zustand je Loch in Lochfolge */
  punkte: Topfpunkt[];
}

export interface EbeneBelegung extends TopfZahlen {
  /** «Ebene 3» oder «ohne Ebene» */
  titel: string;
  ebene?: number;
  gefaesse: GefaessBelegung[];
}

export interface BoxBelegung {
  code: string;
  kennung: string;
  typ: 'hell' | 'dunkel';
  belegt: number;
  platzzahl: number;
  sorten: SortenAnzahl[];
}

export interface AnlagenBelegung extends TopfZahlen {
  ebenen: EbeneBelegung[];
  boxen: BoxBelegung[];
  messstellen: { code: string; kennung: string }[];
}

interface ZustandZeile {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
}
interface SatzZeile {
  id: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  storniert_am: string | null;
}

/** Sorten mit Anzahl, nach Anzahl absteigend, dann Name (A5) */
function sortenZaehlen(teile: Teile, satzIds: readonly string[]): SortenAnzahl[] {
  const zahl = new Map<string, number>();
  for (const id of satzIds) {
    const name = sorteDesSatzes(teile, id) ?? 'Sorte';
    zahl.set(name, (zahl.get(name) ?? 0) + 1);
  }
  return [...zahl]
    .map(([sorte, anzahl]) => ({ sorte, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.sorte.localeCompare(b.sorte, 'de'));
}

const summe = (l: readonly TopfZahlen[]): TopfZahlen => ({
  belegt: l.reduce((s, x) => s + x.belegt, 0),
  reserviert: l.reduce((s, x) => s + x.reserviert, 0),
  frei: l.reduce((s, x) => s + x.frei, 0),
});

/** Belegung der Anlage: Ebenen (höchste Nummer zuerst, «ohne Ebene» am Schluss), Boxen hell vor dunkel, W */
export function anlagenBelegung(teile: Teile, anlageId: string): AnlagenBelegung {
  const anlage = zeilen<{ id: string; kuerzel: string }>(teile, 'anlage').find((a) => a.id === anlageId);
  if (!anlage) return { ...summe([]), ebenen: [], boxen: [], messstellen: [] };
  const code = (p: PlatzZeile) => `${anlage.kuerzel}-${p.kennung}`;
  const plaetze = plaetzeAus(teile, anlageId).sort(nachKennung);

  const saetze = zeilen<SatzZeile>(teile, 'satz').filter((s) => s.storniert_am === null);
  const satzOrt = new Map(saetze.map((s) => [s.id, s.anzuchtort_platz_id ?? s.direktsaat_platz_id]));
  const aktiv = zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').filter(
    (z) => z.status === 'aktiv' && satzOrt.has(z.satz_id),
  );

  const gefaess = (p: PlatzZeile): GefaessBelegung => {
    const g = gefaessAm(teile, p.id);
    const badge = g ? statusBadge(gefaessStatus(teile, g.id)) : undefined;
    // wie die Maske «Gefäss»: ohne Ortsereignis steht die Pflanzung im Direktsaat-Gefäss ihres Satzes
    const hier = aktiv.filter(
      (z) =>
        z.platz_id === p.id ||
        (z.platz_id === null && saetze.some((s) => s.id === z.satz_id && s.direktsaat_platz_id === p.id)),
    );
    const loecher = g ? deckelBelegung(teile, p.id) : [];
    const punkte = loecher.map((l): Topfpunkt => l.zustand);
    return {
      code: code(p),
      kennung: p.kennung,
      loecher: loecher.length,
      pflanzen: hier.length,
      ohneGefaess: g === undefined,
      belegt: punkte.filter((x) => x === 'belegt').length,
      reserviert: punkte.filter((x) => x === 'reserviert').length,
      frei: punkte.filter((x) => x === 'frei').length,
      sorten: sortenZaehlen(
        teile,
        hier.map((z) => z.satz_id),
      ),
      punkte,
      ...(badge ? { badge } : {}),
    };
  };

  const ebenen: EbeneBelegung[] = [];
  const gefaessPlaetze = plaetze.filter((p) => p.rolle === 'gefaess');
  for (const b of bereicheAus(teile, anlageId).sort((x, y) => y.nummer - x.nummer)) {
    const gefaesse = gefaessPlaetze.filter((p) => p.bereich_id === b.id).map(gefaess);
    if (gefaesse.length > 0) ebenen.push({ titel: b.name, ebene: b.nummer, ...summe(gefaesse), gefaesse });
  }
  const bekannt = new Set(bereicheAus(teile, anlageId).map((b) => b.id));
  const ohne = gefaessPlaetze.filter((p) => p.bereich_id === null || !bekannt.has(p.bereich_id)).map(gefaess);
  if (ohne.length > 0) ebenen.push({ titel: 'ohne Ebene', ...summe(ohne), gefaesse: ohne });

  // Inhalt einer Box wie in Säen (boxBelegung, A3): aktive Pflanzungen ohne Platz aus Sätzen dieser Box
  const boxen = plaetze
    .filter((p) => p.rolle === 'anzuchtort')
    .map((p): BoxBelegung => {
      const box = anzuchtortAm(teile, p.id);
      const drin = aktiv.filter((z) => z.platz_id === null && satzOrt.get(z.satz_id) === p.id);
      const platzzahl = Number((box as { platzzahl?: number | string } | undefined)?.platzzahl ?? 25);
      const dunkel = box?.typ === 'box_dunkel';
      return {
        code: code(p),
        kennung: p.kennung,
        typ: dunkel ? 'dunkel' : 'hell',
        belegt: drin.length,
        platzzahl: Number.isFinite(platzzahl) && platzzahl > 0 ? platzzahl : 25,
        sorten: sortenZaehlen(
          teile,
          drin.map((z) => z.satz_id),
        ),
      };
    })
    .sort((a, b) => Number(a.typ === 'dunkel') - Number(b.typ === 'dunkel') || nachKennung(a, b));

  const messstellen = plaetze
    .filter((p) => p.rolle === 'messstelle')
    .map((p) => ({ code: code(p), kennung: p.kennung }));

  return { ...summe(ebenen), ebenen, boxen, messstellen };
}
