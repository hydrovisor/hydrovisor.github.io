// Korrekturen des Düngerrechners: ECSoll_ist, Restdosis, kIst und k-Vorschlag, Teilwechsel, «möglicherweise doppelt
// dosiert», Stabilität und Teil-Dosis-Stand (UC7; Konzept R4.1, R4.7, R4.8, E-F4-9; Plan 28). Rein; Einheiten wie
// rechner.ts.
import { KOMPONENTEN, type Komponente } from './einstellungen/einstellungen.ts';
import type { Datenart } from './kalibrierung/stand.ts';
import {
  ecAusMengen,
  gerundet,
  hinweis,
  kappungsgrenze,
  kWirksam,
  mengenRoh,
  type Dosis,
  type RechnerHinweis,
} from './rechner.ts';
import {
  bruch,
  durch,
  literText,
  mal,
  minus,
  runde,
  vergleich,
  type Bruch,
  type KSatz,
  type Mengen,
} from './rechner-zahlen.ts';

const summeMengen = (m: Mengen): number => KOMPONENTEN.reduce((s, c) => s + m[c], 0);

/** ECSoll_ist = ECWasser + Σ k_i · ist_i / V; Ist-Dosis in Hundertsteln ml/L (R4.8, E-F4-9) */
export function ecSollIst(e: { ist: Mengen; volumen: number; k: KSatz; ecWasser: number }): {
  exakt: Bruch;
  gerundet: number;
  istDosis: Bruch;
} {
  const exakt = ecAusMengen(e.k, e.ist, e.volumen, e.ecWasser);
  // Zehntel ml auf Hundertstel l → Hundertstel ml/L: (m / 10) / (V / 100) · 100 = 1000 · m / V
  const istDosis = durch(1000 * summeMengen(e.ist), e.volumen);
  return { exakt, gerundet: runde(exakt), istDosis };
}

export interface RestdosisErgebnis {
  mengen: Mengen;
  ecSollIst: number;
  /** |ECIst − ECSoll_ist| in Hundertsteln */
  abweichung: number;
  /** nur Anzeige, Tausendstel */
  kIst: number | null;
  hinweise: RechnerHinweis[];
}

/** Restdosis nach der Kontrollmessung (R4.7); ΔD mit k_wirksam der Einstellung, höchstens bis zur Grenze R4.4 (A12) */
export function restdosis(e: {
  ecZiel: Bruch;
  ecIst: number;
  ecWasser: number;
  ist: Mengen;
  volumen: number;
  k: KSatz;
  dosis: Dosis;
  grenzeGesamt?: Bruch;
}): RestdosisErgebnis {
  const soll = ecSollIst({ ist: e.ist, volumen: e.volumen, k: e.k, ecWasser: e.ecWasser });
  const abweichung = Math.abs(e.ecIst - soll.gerundet);
  const kIst = soll.istDosis.z > 0 ? runde(durch(1000 * (e.ecIst - e.ecWasser), soll.istDosis)) : null;
  const hinweise: RechnerHinweis[] = [];
  const null3: Mengen = { grow: 0, micro_hard_water: 0, bloom: 0 };
  const rest = minus(e.ecZiel, e.ecIst);
  if (rest.z <= 0) {
    if (rest.z < 0) hinweise.push(hinweis('restdosis_null'));
    return { mengen: null3, ecSollIst: soll.gerundet, abweichung, kIst, hinweise };
  }
  // ΔD in Hundertsteln ml/L: (Δ EC / 100) / (k_w / 1000) · 100 = 1000 · Δ / k_w
  let delta = durch(mal(1000, rest), kWirksam(e.k, e.dosis));
  const grenze = e.grenzeGesamt ?? kappungsgrenze(e.dosis);
  const frei = minus(grenze, soll.istDosis);
  if (vergleich(delta, frei) > 0) delta = frei.z > 0 ? frei : bruch(0);
  if (delta.z <= 0) return { mengen: null3, ecSollIst: soll.gerundet, abweichung, kIst, hinweise };
  return {
    mengen: gerundet(mengenRoh(delta, e.dosis, e.volumen)),
    ecSollIst: soll.gerundet,
    abweichung,
    kIst,
    hinweise,
  };
}

export type KVorschlag =
  | { art: 'kein'; grund: 'abweichung_klein' | 'unsicher' | 'nicht_echt' | 'endmessung_fehlt' }
  | { art: 'banner' }
  | { art: 'vorschlag'; kNeu: KSatz; kIst: number; rueckfrage: boolean; uebernehmbar: boolean };

/** k-Vorschlag nach der Kontrollmessung (R4.7, R4.1, G5) */
export function kVorschlag(e: {
  kontrolle: number;
  ecSollIstKontrolle: number;
  istDosis: Bruch;
  endmessung?: number | undefined;
  ecSollIstGesamt: number;
  ecWasser: number;
  k: KSatz;
  dosis: Dosis;
  uEc: number;
  unsicher: boolean;
  datenart: Datenart;
}): KVorschlag {
  if (e.datenart !== 'echt') return { art: 'kein', grund: 'nicht_echt' };
  if (e.unsicher) return { art: 'kein', grund: 'unsicher' };
  if (e.endmessung === undefined) return { art: 'kein', grund: 'endmessung_fehlt' };
  if (e.endmessung > e.ecSollIstGesamt + 30) return { art: 'banner' };
  if (Math.abs(e.kontrolle - e.ecSollIstKontrolle) <= e.uEc)
    return { art: 'kein', grund: 'abweichung_klein' };
  if (e.istDosis.z <= 0) return { art: 'kein', grund: 'abweichung_klein' };
  const kIstExakt = durch(1000 * (e.kontrolle - e.ecWasser), e.istDosis);
  const kw = kWirksam(e.k, e.dosis);
  const faktor = durch(kIstExakt, kw);
  const kNeu = Object.fromEntries(KOMPONENTEN.map((c) => [c, runde(mal(e.k[c], faktor))])) as Record<
    Komponente,
    number
  >;
  // Änderung über 20 %: |kIst − k_w| · 5 > k_w
  const rueckfrage = vergleich(mal(absolut(minus(kIstExakt, kw)), 5), kw) > 0;
  const uebernehmbar = vergleich(kIstExakt, 200) >= 0 && vergleich(kIstExakt, 450) <= 0;
  return { art: 'vorschlag', kNeu, kIst: runde(kIstExakt), rueckfrage, uebernehmbar };
}

const absolut = (b: Bruch): Bruch => (b.z < 0 ? bruch(-b.z, b.n) : b);

export type Teilwechsel = { art: 'absaugen'; liter: number; text: string } | { art: 'nicht_noetig' };

/** Teilwechsel: V_ab = V · (ECIst − ECZiel) / (ECIst − ECWasser), auf 0.1 l (R4.8, A11) */
export function teilwechsel(e: {
  volumen: number;
  ecIst: number;
  ecZiel: number;
  ecWasser: number;
}): Teilwechsel {
  if (e.ecIst <= e.ecZiel || e.ecIst <= e.ecWasser) return { art: 'nicht_noetig' };
  // Hundertstel l → Zehntel l: / 10
  const roh = durch(e.volumen * (e.ecIst - e.ecZiel), 10 * (e.ecIst - e.ecWasser));
  const liter = Math.max(1, runde(roh));
  return { art: 'absaugen', liter, text: `${literText(liter)} absaugen und mit Wasser ersetzen` };
}

/** «Möglicherweise doppelt dosiert», wenn Kontrolle > gerundete Teil-EC + 0.25 (R4.8, E-F4-9) */
export function doppeltDosiert(e: {
  kontrolle: number;
  ecSollIstTeil: number;
  teilwechsel: { volumen: number; ecIst: number; ecZiel: number; ecWasser: number };
}): { hinweis: boolean; angebot?: Teilwechsel } {
  if (e.kontrolle <= e.ecSollIstTeil + 25) return { hinweis: false };
  return { hinweis: true, angebot: teilwechsel(e.teilwechsel) };
}

export interface StabilZeile {
  begonnenAm: Date;
  kontrolle?: number | undefined;
  ecSollIst?: number | undefined;
  unsicher: boolean;
  datenart: Datenart;
  istStation: boolean;
  storniert: boolean;
  abgebrochen: boolean;
}

/**
 * k stabil: die drei jüngsten gültigen Neuansätze nach der letzten k-Änderung (nur echt, ohne Stationen) liegen je
 * höchstens max(0.10, u_EC) neben ECSoll_ist; ohne Kontrollmessung oder mit «unsicher» bricht die Folge (R4.7, A13).
 */
export function kStabil(ansaetze: readonly StabilZeile[], uEc: number, kGeaendertAm: Date): boolean {
  const toleranz = Math.max(10, uEc);
  const juengste = ansaetze
    .filter(
      (a) =>
        a.datenart === 'echt' &&
        !a.istStation &&
        !a.storniert &&
        !a.abgebrochen &&
        a.begonnenAm.getTime() >= kGeaendertAm.getTime(),
    )
    .sort((a, b) => b.begonnenAm.getTime() - a.begonnenAm.getTime())
    .slice(0, 3);
  return (
    juengste.length === 3 &&
    juengste.every(
      (a) =>
        !a.unsicher &&
        a.kontrolle !== undefined &&
        a.ecSollIst !== undefined &&
        Math.abs(a.kontrolle - a.ecSollIst) <= toleranz,
    )
  );
}

export type KQuelle = 'startwert' | 'becherversuch' | 'vorschlag_uebernommen' | 'zurueckgesetzt' | string;

/** Teil-Dosis-Stand (R4.7, Konzept 9.4): Station 100; Startwert 75; stabil und nicht Klasse D 100; sonst 85 (A14) */
export function teilDosis(e: {
  kQuellen: readonly KQuelle[];
  kStabil: boolean;
  istStation: boolean;
  zielbereichKlasseD: boolean;
}): 75 | 85 | 100 {
  if (e.istStation) return 100;
  if (e.kQuellen.some((q) => q === 'startwert')) return 75;
  if (e.kStabil && !e.zielbereichKlasseD) return 100;
  return 85;
}
