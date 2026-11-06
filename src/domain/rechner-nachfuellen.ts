// Nachfüllen, Verdünnen, Kratky belüftet und die Messung für den Rechner (UC7; Konzept R4.4, R4.5, R4.9, R4.10, R10.3;
// Plan 28). Rein; Einheiten wie rechner.ts, Liter der Ergebnisse in Zehnteln l (A11).
import { istVeraltet, type AnsatzZeile } from './bewertung/verlauf.ts';
import {
  dosisSumme,
  gerundet,
  hinweis,
  kappungsgrenze,
  kWirksam,
  mengenRoh,
  messmittelJe,
  type Dosis,
  type RechnerHinweis,
  type Zielbereich,
} from './rechner.ts';
import {
  bruch,
  durch,
  ecText,
  mal,
  minus,
  plus,
  runde,
  vergleich,
  type Bruch,
  type KSatz,
  type Mengen,
  type Messmittel,
} from './rechner-zahlen.ts';
import type { Komponente } from './einstellungen/einstellungen.ts';
import { kalendertag, type Zeitzone } from './zeit.ts';

interface Messung {
  id: string;
  platz_id: string | null;
  gilt_ab: string;
  ansatz_id: string | null;
}

/** Jüngste Messung des Platzes, nicht veraltet und vom heutigen Kalendertag in Zürich (R4.9, R10.3, UC7-AK10) */
export function messungFuerRechner<M extends Messung>(
  e: { platzId: string; messungen: readonly M[]; ansaetze: readonly AnsatzZeile[] },
  jetzt: Date,
  zeitzone: Zeitzone,
):
  | { art: 'messung'; messung: M }
  | { art: 'neue_messung_noetig'; grund: 'keine' | 'veraltet' | 'nicht_heute' } {
  const juengste = e.messungen
    .filter((m) => m.platz_id === e.platzId)
    .sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab))[0];
  if (!juengste) return { art: 'neue_messung_noetig', grund: 'keine' };
  if (istVeraltet(juengste, e.ansaetze)) return { art: 'neue_messung_noetig', grund: 'veraltet' };
  if (kalendertag(new Date(juengste.gilt_ab), zeitzone) !== kalendertag(jetzt, zeitzone))
    return { art: 'neue_messung_noetig', grund: 'nicht_heute' };
  return { art: 'messung', messung: juengste };
}

/** Nachgefülltes Volumen V2 in Hundertsteln l aus ganzen Kannen und einer Teilkanne (R4.9) */
export function kannenLiter(ganze: number, kanne: number, teilkanne: number): number {
  return ganze * kanne + teilkanne;
}

export interface NachfuellErgebnis {
  /** Dosis je Liter Nachfüllwasser in Hundertsteln ml/L */
  dMlL: number;
  mengen: Mengen;
  messmittel: Readonly<Record<Komponente, Messmittel>>;
  nurWasser: boolean;
  kontrolleFolgetag: boolean;
  hinweise: RechnerHinweis[];
}

/** Nachfüllen (R4.9): d = (ECZiel · V − EC1 · V1 − ECWasser · V2) / (k_wirksam · V2), Grenzen 1.5 · D_Ansatz und R4.4 */
export function nachfuellen(e: {
  volumen: number;
  nachgefuellt: number;
  ec1: number;
  ecWasser: number;
  zielbereich: Zielbereich;
  k: KSatz;
  dosis: Dosis;
  dAnsatz: number;
  istStation: boolean;
  ueberHerstellerdosisBestaetigt: boolean;
  spritzen?: readonly number[];
}): NachfuellErgebnis {
  const v2 = e.nachgefuellt;
  const fertig = (d: Bruch, dMlL: number, hinweise: RechnerHinweis[], kontrolleFolgetag = false) => {
    const mengen = gerundet(mengenRoh(d, e.dosis, v2));
    return {
      dMlL,
      mengen,
      messmittel: messmittelJe(mengen, e.spritzen),
      nurWasser: false,
      kontrolleFolgetag,
      hinweise,
    };
  };
  if (e.istStation) {
    // feste Dosis je Liter, ohne Formel (R4.5)
    const D = dosisSumme(e.dosis);
    return fertig(bruch(D), D, []);
  }
  const zb = e.zielbereich;
  const hinweise: RechnerHinweis[] = [];
  // Ziel = Bandmitte, angehoben auf ECWasser + 0.30; ECWasser über o − 0.30 → o (Regeln 1 und 3 von zielEc, A15)
  let ziel = bruch(zb.min + zb.max, 2);
  if (e.ecWasser > zb.max - 30) ziel = bruch(zb.max);
  else if (vergleich(ziel, e.ecWasser + 30) < 0) ziel = bruch(Math.min(e.ecWasser + 30, zb.max));
  const v1 = e.volumen - v2;
  const kw = kWirksam(e.k, e.dosis);
  // EC in Hundertsteln, V in Hundertsteln l, k in Tausendsteln: d (Hundertstel ml/L) = 100 · 1000 · Zähler / (k_w · V2 · 100)
  const zaehler = minus(minus(mal(ziel, e.volumen), e.ec1 * v1), e.ecWasser * v2);
  if (zaehler.z <= 0) {
    const leer: Mengen = { grow: 0, micro_hard_water: 0, bloom: 0 };
    return {
      dMlL: 0,
      mengen: leer,
      messmittel: messmittelJe(leer, e.spritzen),
      nurWasser: true,
      kontrolleFolgetag: false,
      hinweise: [hinweis('nur_wasser')],
    };
  }
  const dExakt = durch(mal(1000, zaehler), mal(kw, v2));
  let dH = Math.max(1, runde(dExakt));
  // Grenze 1.5 · D_Ansatz als Ganzzahlvergleich 2 · d ≤ 3 · D_Ansatz (R4.9)
  const grenzeAnsatz = bruch(3 * e.dAnsatz, 2);
  const grenzeR44 = kappungsgrenze(e.dosis);
  let kontrolleFolgetag = false;
  let gekappt = false;
  if (2 * dH > 3 * e.dAnsatz) {
    dH = runde(grenzeAnsatz);
    gekappt = true;
  }
  if (vergleich(dH, grenzeR44) > 0) {
    if (e.ueberHerstellerdosisBestaetigt) {
      kontrolleFolgetag = true;
      hinweise.push(hinweis('ueber_herstellerdosis'));
    } else {
      dH = runde(grenzeR44);
      gekappt = true;
    }
  }
  if (gekappt) {
    const erwartet = durch(plus(e.ec1 * v1, mal(plus(e.ecWasser, durch(mal(kw, dH), 1000)), v2)), e.volumen);
    hinweise.push(
      hinweis('ziel_nicht_erreichbar', `Ziel nicht ganz erreichbar, erwartete EC ${ecText(runde(erwartet))}`),
    );
  }
  return fertig(bruch(dH), dH, hinweise, kontrolleFolgetag);
}

/** Verdünnen (R4.9): VWasser = V1 · (EC1 − ECZiel) / (ECZiel − ECWasser), gekappt auf das freie Volumen */
export function verduennen(e: {
  v1: number;
  ec1: number;
  ecZiel: number;
  ecWasser: number;
  betriebsvolumen: number;
}):
  | { art: 'kein_verduennen_noetig'; liter: 0 }
  | { art: 'nicht_erreichbar' }
  | { art: 'wasser'; noetig: number; liter: number; gekappt: boolean; ecErwartet: number } {
  if (e.ec1 <= e.ecZiel) return { art: 'kein_verduennen_noetig', liter: 0 };
  if (e.ecZiel <= e.ecWasser) return { art: 'nicht_erreichbar' };
  // Hundertstel l → Zehntel l
  const noetig = Math.max(1, runde(durch(e.v1 * (e.ec1 - e.ecZiel), 10 * (e.ecZiel - e.ecWasser))));
  const frei = Math.max(0, Math.floor((e.betriebsvolumen - e.v1) / 10));
  const liter = Math.min(noetig, frei);
  const vWasser = liter * 10;
  const ecErwartet = runde(durch(e.v1 * e.ec1 + vWasser * e.ecWasser, e.v1 + vWasser));
  return { art: 'wasser', noetig, liter, gekappt: liter < noetig, ecErwartet };
}

export type Fuellstand = 'ueber_drittel' | 'unter_drittel';

/**
 * Kratky belüftet (R4.10): über einem Drittel keine Aufgabe; EC über der oberen Grenze nur Wasser, sonst halbe
 * Konzentration der Satzdosis; höchstens 2.5 cm über der Innenfläche des Gefässmodells, auf 0.1 l (A17).
 */
export function kratkyNachfuellen(e: {
  fuellstand: Fuellstand;
  ecIst: number;
  zielbereich: Zielbereich;
  dAnsatz: number;
  innenLMm: number;
  innenBMm: number;
}):
  | { art: 'keine_aufgabe' }
  | { art: 'nur_wasser'; hoechstensLiter: number }
  | { art: 'halbe_konzentration'; dMlL: number; hoechstensLiter: number } {
  if (e.fuellstand === 'ueber_drittel') return { art: 'keine_aufgabe' };
  // mm³ → Zehntel l: / 100 000
  const hoechstensLiter = runde(bruch(e.innenLMm * e.innenBMm * 25, 100_000));
  if (e.ecIst > e.zielbereich.max) return { art: 'nur_wasser', hoechstensLiter };
  return { art: 'halbe_konzentration', dMlL: runde(bruch(e.dAnsatz, 2)), hoechstensLiter };
}
