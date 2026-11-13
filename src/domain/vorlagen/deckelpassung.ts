// Deckelwahl im Assistenten «Gefäss erfassen» und in «Gefäss ändern» (Entscheid 0021, Rückmeldung Tim 13.11.2026):
// Beschreibung je Deckel (Lochzahl, Topfgrösse, Reihen) und Passung zur gewählten Box über die Grundfläche.
// Rein, ohne Zeitbezug.
//
// Die Grundfläche gehört nicht zum Datenmodell (deckeltyp hat keine Masse). Sie folgt aus Konzept 5.3 und 5.4: D1, D2
// und D3 liegen auf Rako 40 × 30, D4 und D6 auf Rako 30 × 20, S8 und S5 auf der ovalen Wanne Leni Flori 36. Ein Deckel
// gehört zu einem dieser sieben Typen, wenn Lochbild und Topfgrösse gleich sind; der Name zählt nicht (Demo «Demo D1»,
// eigene Namen). Ein Deckel mit anderem Lochbild hat keine bekannte Grundfläche und bleibt immer wählbar (A1).
import { DECKEL_VORSCHLAEGE, type DeckelVorschlag } from './deckel-vorschlaege.ts';
import { lochbildText, lochzahl } from './lochbild.ts';

export type Grundflaeche = 'rako_40_30' | 'rako_30_20' | 'leni_flori_36';

/** Nennmasse der Grundflächen in mm (Konzept 5.3; Leni Flori 36: 36.5 × 13.5 cm, oval); Text mit festen Leerzeichen */
export const GRUNDFLAECHEN: Record<
  Grundflaeche,
  { form: 'rechteckig' | 'oval'; laengeMm: number; breiteMm: number; text: string }
> = {
  rako_40_30: { form: 'rechteckig', laengeMm: 400, breiteMm: 300, text: 'Rako 40\u00a0×\u00a030' },
  rako_30_20: { form: 'rechteckig', laengeMm: 300, breiteMm: 200, text: 'Rako 30\u00a0×\u00a020' },
  leni_flori_36: { form: 'oval', laengeMm: 365, breiteMm: 135, text: 'Leni Flori\u00a036' },
};

/** Grundfläche der sieben Typen aus Konzept 5.3 (Plätze) und 5.4 (Deckel je Platz) */
const GRUNDFLAECHE_JE_TYP: Record<string, Grundflaeche> = {
  D1: 'rako_40_30',
  D2: 'rako_40_30',
  D3: 'rako_40_30',
  D4: 'rako_30_20',
  D6: 'rako_30_20',
  S8: 'leni_flori_36',
  S5: 'leni_flori_36',
};

/**
 * Abweichung je Seite von der Nennmasse, in mm (A2): Rako-Innenmasse liegen rund 35 mm unter den Aussenmassen; Tim
 * kann innen oder aussen messen. Die Nennmasse liegen 100 mm auseinander; bei Überlappung gilt die nächste Grundfläche.
 */
export const TOLERANZ_MM = 60;

/** Zeilen aus dem Bündel (teile.ts) oder aus vorlagenAusTeilen (bestand.ts); numeric kann als Text kommen */
type Lochbild = { topfdurchmesser_mm: number | string; loecher_je_reihe: readonly (number | string)[] };
type Box = { form: string; innen_l_mm: number | string; innen_b_mm: number | string };

const gleicheReihen = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((n, i) => n === b[i]);

/** Typ aus Konzept 5.4 mit gleichem Lochbild und gleicher Topfgrösse; sonst undefined */
export function deckelTyp(deckel: Lochbild): DeckelVorschlag | undefined {
  return DECKEL_VORSCHLAEGE.find(
    (v) =>
      v.topfCm * 10 === Number(deckel.topfdurchmesser_mm) &&
      gleicheReihen(v.reihen, deckel.loecher_je_reihe.map(Number)),
  );
}

export function deckelGrundflaeche(deckel: Lochbild): Grundflaeche | undefined {
  const typ = deckelTyp(deckel);
  return typ ? GRUNDFLAECHE_JE_TYP[typ.name] : undefined;
}

/**
 * nächste Grundfläche gleicher Form, beide Seiten höchstens TOLERANZ_MM daneben; Länge ist die längere Seite; bei
 * gleichem Abstand zu zwei Grundflächen keine
 */
export function boxGrundflaeche(box: Box): Grundflaeche | undefined {
  const l = Math.max(Number(box.innen_l_mm), Number(box.innen_b_mm));
  const b = Math.min(Number(box.innen_l_mm), Number(box.innen_b_mm));
  let beste: { g: Grundflaeche | undefined; abstand: number } | undefined;
  for (const [g, nenn] of Object.entries(GRUNDFLAECHEN) as [
    Grundflaeche,
    (typeof GRUNDFLAECHEN)[Grundflaeche],
  ][]) {
    if (nenn.form !== box.form) continue;
    const dl = Math.abs(l - nenn.laengeMm);
    const db = Math.abs(b - nenn.breiteMm);
    if (dl > TOLERANZ_MM || db > TOLERANZ_MM) continue;
    // Gleichstand zweier Grundflächen: keine (Rückfallweg «box_unbekannt», Prüfer Runde 1, Befund 3)
    if (!beste || dl + db < beste.abstand) beste = { g, abstand: dl + db };
    else if (dl + db === beste.abstand) beste = { g: undefined, abstand: beste.abstand };
  }
  return beste?.g;
}

/** «6 Löcher · 8 cm · Reihen 3, 3» */
export function deckelBeschreibung(deckel: Lochbild): string {
  const n = lochzahl(deckel.loecher_je_reihe.map(Number));
  const cm = Number(deckel.topfdurchmesser_mm) / 10;
  return `${String(n)} ${n === 1 ? 'Loch' : 'Löcher'} · ${String(cm)} cm · Reihen ${lochbildText(deckel.loecher_je_reihe.map(Number))}`;
}

export type Passung = 'passt' | 'unbekannt' | 'passt_nicht';

export interface DeckelOption<D extends Lochbild> {
  deckel: D;
  beschreibung: string;
  /** «für Rako 40 × 30»; undefined bei unbekanntem Lochbild */
  fuer: string | undefined;
  passung: Passung;
  /** nach Konzept 5.4 für die Kennung des Gefässes vorgesehen */
  vorgesehen: boolean;
}

export interface Deckelauswahl<D extends Lochbild> {
  /** gezeigte Deckel: vorgesehener zuerst, dann nach Name */
  sichtbar: DeckelOption<D>[];
  /** ausgeblendet, weil die Grundfläche nicht zur Box passt; «Alle Deckel zeigen» blendet sie ein */
  ausgeblendet: DeckelOption<D>[];
  /** box_unbekannt: Box ohne passende Grundfläche; keiner_passt: kein Deckel mit bekannter Grundfläche passt */
  hinweis?: 'box_unbekannt' | 'keiner_passt';
}

const nachName = (a: { deckel: { name: string } }, b: { deckel: { name: string } }) =>
  a.deckel.name.localeCompare(b.deckel.name, 'de-CH', { numeric: true });

/**
 * Deckel für Schritt 3: ohne Box alle; mit Box die passenden und die mit unbekanntem Lochbild. Hat die Box keine
 * bekannte Grundfläche oder passt kein Deckel mit bekannter Grundfläche, erscheinen alle mit Hinweis (Rückfallweg).
 */
export function deckelAuswahl<D extends Lochbild & { name: string }>(
  deckel: readonly D[],
  box: Box | undefined,
  kennung: string | undefined,
): Deckelauswahl<D> {
  const flaeche = box ? boxGrundflaeche(box) : undefined;
  const optionen = deckel.map((d): DeckelOption<D> => {
    const typ = deckelTyp(d);
    const eigene = typ ? GRUNDFLAECHE_JE_TYP[typ.name] : undefined;
    return {
      deckel: d,
      beschreibung: deckelBeschreibung(d),
      fuer: eigene ? GRUNDFLAECHEN[eigene].text : undefined,
      passung:
        eigene === undefined || flaeche === undefined
          ? 'unbekannt'
          : eigene === flaeche
            ? 'passt'
            : 'passt_nicht',
      vorgesehen: typ !== undefined && kennung !== undefined && typ.fuer.includes(kennung),
    };
  });
  const ordnen = (liste: DeckelOption<D>[]) =>
    [...liste].sort((a, b) => Number(b.vorgesehen) - Number(a.vorgesehen) || nachName(a, b));
  if (!box) return { sichtbar: ordnen(optionen), ausgeblendet: [] };
  if (flaeche === undefined)
    return { sichtbar: ordnen(optionen), ausgeblendet: [], hinweis: 'box_unbekannt' };
  if (!optionen.some((o) => o.passung === 'passt'))
    return {
      sichtbar: ordnen(optionen),
      ausgeblendet: [],
      ...(optionen.some((o) => o.passung === 'passt_nicht') ? { hinweis: 'keiner_passt' as const } : {}),
    };
  return {
    sichtbar: ordnen(optionen.filter((o) => o.passung !== 'passt_nicht')),
    ausgeblendet: ordnen(optionen.filter((o) => o.passung === 'passt_nicht')),
  };
}

/**
 * Vorwahl ohne Tipp: der einzige sichtbare Deckel, ausser er passt nachweislich nicht (Prüfer Runde 1, Befund 1), sonst
 * der einzige passende, sonst der für die Kennung vorgesehene, wenn er passt (Konzept 5.4: fester Deckel je Platz)
 */
export function deckelVorwahl<D extends Lochbild & { id: string; name: string }>(
  auswahl: Deckelauswahl<D>,
): string | undefined {
  const { sichtbar } = auswahl;
  const einziger = sichtbar.length === 1 ? sichtbar[0] : undefined;
  if (einziger) return einziger.passung === 'passt_nicht' ? undefined : einziger.deckel.id;
  const passend = sichtbar.filter((o) => o.passung === 'passt');
  if (passend.length === 1) return passend[0]?.deckel.id;
  const vorgesehen = passend.filter((o) => o.vorgesehen);
  return vorgesehen.length === 1 ? vorgesehen[0]?.deckel.id : undefined;
}
