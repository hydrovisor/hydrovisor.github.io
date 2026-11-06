// Düngerrechner: Herstellerdosis, k_wirksam, inneres Band, ECWasser, Zielwahl, Neuansatz und Stationen (UC7; Konzept
// R4.1 bis R4.5, R4.7 Teil-Dosis, R4.11; Plan 28). Rein; Einheiten nach Plan 28: EC in Hundertsteln, k in
// Tausendsteln, Dosis in Hundertsteln ml/L, Volumen in Hundertsteln l, Mengen in Zehnteln ml.
import { KOMPONENTEN, type Komponente } from './einstellungen/einstellungen.ts';
import type { Phase } from './phasen/profil.ts';
import {
  bruch,
  durch,
  mal,
  messmittel,
  min,
  minus,
  plus,
  runde,
  rundeMenge,
  rundungsabweichungEc,
  summe,
  vergleich,
  type Bruch,
  type KSatz,
  type Mengen,
  type MengenBruch,
  type Messmittel,
} from './rechner-zahlen.ts';
import { kalendertag, tageZwischen, type Zeitzone } from './zeit.ts';

export type Stadium = 'wurzeln_keimung' | 'echte_blaetter' | 'wachstum' | 'vorbluete' | 'bluete_frucht';
export type Dosis = Readonly<Record<Komponente, number>>;
export interface Zielbereich {
  min: number;
  max: number;
}

export type HinweisCode =
  | 'ziel_nicht_erreichbar'
  | 'wasser_zu_hoch_fuer_gefaess'
  | 'untergrenze_wasser'
  | 'wasser_hoch'
  | 'messgeraet_oder_wasser_pruefen'
  | 'kalibrierung_pruefen'
  | 'ueber_herstellerdosis'
  | 'restdosis_null'
  | 'doppelt_dosiert'
  | 'mehr_ec_als_erwartet'
  | 'nur_wasser'
  | 'kein_verduennen_noetig'
  | 'verduennen_unmoeglich'
  | 'verduennen_gekappt'
  | 'eingabe_noetig';
export interface RechnerHinweis {
  code: HinweisCode;
  text: string;
}

export const HINWEIS: Readonly<Record<HinweisCode, string>> = {
  ziel_nicht_erreichbar: 'Ziel nicht ganz erreichbar',
  wasser_zu_hoch_fuer_gefaess: 'Leitungswasser zu hoch für dieses Gefäss',
  untergrenze_wasser: 'Ziel auf Leitungswasser + 0.30 angehoben',
  wasser_hoch: 'Leitungswasser ab 1.00 mS/cm: Wasser prüfen',
  messgeraet_oder_wasser_pruefen: 'Messgerät oder Wasser prüfen',
  kalibrierung_pruefen: 'Kalibrierung prüfen',
  ueber_herstellerdosis: 'Über der Herstellerdosis: Kontrollmessung am Folgetag',
  restdosis_null: 'Schon über dem Ziel: keine Restdosis',
  doppelt_dosiert: 'Möglicherweise doppelt dosiert',
  mehr_ec_als_erwartet: 'Mehr EC als erwartet: Dosis, Volumen oder Kanne prüfen',
  nur_wasser: 'Nur Wasser nachfüllen',
  kein_verduennen_noetig: 'Kein Verdünnen nötig',
  verduennen_unmoeglich: 'Mit Wasser allein nicht erreichbar',
  verduennen_gekappt: 'Auf das freie Volumen begrenzt',
  eingabe_noetig: 'Ziel-EC und Stadium eingeben',
};

export const hinweis = (code: HinweisCode, text = HINWEIS[code]): RechnerHinweis => ({ code, text });

/** Herstellerdosis je Stadium in Hundertsteln ml/L (R4.3, Düngeplan Abschnitt 2); «reife» wird nie verwendet */
export const HERSTELLERDOSIS: Readonly<Record<Stadium, Dosis>> = {
  wurzeln_keimung: { grow: 50, micro_hard_water: 50, bloom: 50 },
  echte_blaetter: { grow: 100, micro_hard_water: 100, bloom: 100 },
  wachstum: { grow: 180, micro_hard_water: 120, bloom: 60 },
  vorbluete: { grow: 200, micro_hard_water: 200, bloom: 150 },
  bluete_frucht: { grow: 80, micro_hard_water: 160, bloom: 240 },
};

/** Abstand zwischen ECWasser und ECZiel mindestens 0.30 (R4.2) */
const UNTERGRENZE = 30;
/** Kappung R4.4: 5.5 ml/L absolut */
const KAPPUNG_ABSOLUT = 550;

export const dosisSumme = (d: Dosis): number => KOMPONENTEN.reduce((s, c) => s + d[c], 0);

/** Σ k_i · d_i / D in Tausendsteln (R4.1, Anteile des Stadiums) */
export function kWirksam(k: KSatz, dosis: Dosis): Bruch {
  const D = dosisSumme(dosis);
  return durch(summe(KOMPONENTEN.map((c) => k[c] * dosis[c])), D);
}

/** EC in Hundertsteln aus Dosis (Hundertstel ml/L) und k (Tausendstel): Σ k_i · d_i / 1000 */
export function ecAusDosis(k: KSatz, dosis: Readonly<Record<Komponente, Bruch | number>>): Bruch {
  return durch(summe(KOMPONENTEN.map((c) => mal(k[c], dosis[c]))), 1000);
}

/** [u + ¼ · (o − u), o − ¼ · (o − u)], Grenzen eingeschlossen (R4.2) */
export function inneresBand(zb: Zielbereich): { unten: Bruch; oben: Bruch } {
  const viertel = bruch(zb.max - zb.min, 4);
  return { unten: plus(zb.min, viertel), oben: minus(zb.max, viertel) };
}

/** ECWasser mit Plausibilität 0.20 bis 1.00, Abgleich mit W und Rückfall 0.50 (R4.1, R4.6 Zeile 3) */
export function ecWasser(e: { frischwasser?: number | undefined; letzteW?: number | undefined }): {
  wert: number;
  quelle: 'frischwasser' | 'w' | 'annahme';
  hinweise: RechnerHinweis[];
} {
  const hinweise: RechnerHinweis[] = [];
  let wert = 50;
  let quelle: 'frischwasser' | 'w' | 'annahme' = 'annahme';
  if (e.frischwasser !== undefined && e.frischwasser >= 20 && e.frischwasser <= 100) {
    wert = e.frischwasser;
    quelle = 'frischwasser';
    if (e.letzteW !== undefined && Math.abs(e.frischwasser - e.letzteW) > 15)
      hinweise.push(hinweis('kalibrierung_pruefen'));
  } else {
    if (e.frischwasser !== undefined) hinweise.push(hinweis('messgeraet_oder_wasser_pruefen'));
    if (e.letzteW !== undefined) {
      wert = e.letzteW;
      quelle = 'w';
    }
  }
  if (wert >= 100) hinweise.push(hinweis('wasser_hoch'));
  return { wert, quelle, hinweise };
}

/** Zielwahl nach R4.2 in der Reihenfolge von Plan 28 A8 */
export function zielEc(e: { zielbereich: Zielbereich; ecSoll: Bruch; ecWasser: number }): {
  ecZiel: Bruch;
  skalieren: boolean;
  hinweise: RechnerHinweis[];
} {
  const { zielbereich: zb, ecWasser: w } = e;
  if (w > zb.max - UNTERGRENZE)
    return { ecZiel: bruch(zb.max), skalieren: true, hinweise: [hinweis('wasser_zu_hoch_fuer_gefaess')] };
  const band = inneresBand(zb);
  if (vergleich(e.ecSoll, band.unten) >= 0 && vergleich(e.ecSoll, band.oben) <= 0)
    return { ecZiel: e.ecSoll, skalieren: false, hinweise: [] };
  return { ...untergrenze(bruch(zb.min + zb.max, 2), w, zb.max), skalieren: true };
}

function untergrenze(
  ziel: Bruch,
  w: number,
  obergrenze?: number,
): { ecZiel: Bruch; hinweise: RechnerHinweis[] } {
  const unten = bruch(w + UNTERGRENZE);
  if (vergleich(ziel, unten) >= 0) return { ecZiel: ziel, hinweise: [] };
  return {
    ecZiel: obergrenze === undefined ? unten : min(unten, bruch(obergrenze)),
    hinweise: [hinweis('untergrenze_wasser')],
  };
}

/** Grenze R4.4 in Hundertsteln ml/L: min(5.5, 1.2 · D) */
export function kappungsgrenze(dosis: Dosis): Bruch {
  return min(bruch(KAPPUNG_ABSOLUT), bruch(6 * dosisSumme(dosis), 5));
}

/** Feste Dosis der Stationen (R4.5) */
export function stationsDosis(stadium: 'wurzeln_keimung' | 'echte_blaetter'): Dosis {
  return HERSTELLERDOSIS[stadium];
}

/** Kontrollband der Station: + 0.30 bis + 0.60 bzw. + 0.80 bis + 1.20 über ECWasser (R4.5) */
export function kontrollband(stadium: 'wurzeln_keimung' | 'echte_blaetter', ecWasser: number): Zielbereich {
  return stadium === 'wurzeln_keimung'
    ? { min: ecWasser + 30, max: ecWasser + 60 }
    : { min: ecWasser + 80, max: ecWasser + 120 };
}

/** Mengen in Zehnteln ml aus einer Gesamtdosis D (Hundertstel ml/L) im Verhältnis des Stadiums auf V (Hundertstel l) */
export function mengenRoh(gesamt: Bruch, dosis: Dosis, volumen: number, prozent = 100): MengenBruch {
  const D = dosisSumme(dosis);
  const je = (c: Komponente) => durch(mal(mal(mal(gesamt, dosis[c]), volumen), prozent), D * 1000 * 100);
  return { grow: je('grow'), micro_hard_water: je('micro_hard_water'), bloom: je('bloom') };
}

export const gerundet = (m: MengenBruch): Mengen => ({
  grow: rundeMenge(m.grow),
  micro_hard_water: rundeMenge(m.micro_hard_water),
  bloom: rundeMenge(m.bloom),
});

export const messmittelJe = (
  m: Mengen,
  spritzen?: readonly number[],
): Readonly<Record<Komponente, Messmittel>> => ({
  grow: messmittel(m.grow, spritzen),
  micro_hard_water: messmittel(m.micro_hard_water, spritzen),
  bloom: messmittel(m.bloom, spritzen),
});

export interface NeuansatzEingabe {
  volumen: number;
  stadium?: Stadium | undefined;
  dosis?: Dosis | undefined;
  zielbereich?: Zielbereich | undefined;
  zielEcGewaehlt?: number | undefined;
  ecWasser: number;
  k: KSatz;
  teilDosis: 75 | 85 | 100;
  istStation: boolean;
  ueberHerstellerdosisBestaetigt: boolean;
  spritzen?: readonly number[];
}

export interface NeuansatzErgebnis {
  art: 'ergebnis';
  stadium: Stadium;
  dosisHersteller: Dosis;
  /** gerundet je Komponente, nur zum Speichern */
  dosisVerwendet: Dosis;
  ecSoll: number;
  ecZiel: number;
  skaliert: boolean;
  gekappt: boolean;
  kontrolleFolgetag: boolean;
  teilDosis: 75 | 85 | 100;
  mengen: Mengen;
  mengenTeil: Mengen;
  messmittel: Readonly<Record<Komponente, Messmittel>>;
  ecErwartetTeil: number;
  rundungsabweichungEc: number;
  kontrollband?: Zielbereich;
  hinweise: RechnerHinweis[];
}

export interface EingabeNoetig {
  art: 'eingabe_noetig';
  felder: readonly ('ziel_ec' | 'stadium')[];
  vorschlagStadium: 'wachstum';
}

/** EC in Hundertsteln aus Mengen (Zehntel ml) auf V (Hundertstel l): ECWasser + Σ k_i · m_i / V */
export function ecAusMengen(k: KSatz, mengen: Mengen, volumen: number, ecWasser: number): Bruch {
  return plus(ecWasser, durch(summe(KOMPONENTEN.map((c) => k[c] * mengen[c])), volumen));
}

export function neuansatz(e: NeuansatzEingabe): NeuansatzErgebnis | EingabeNoetig {
  const station = e.istStation && (e.stadium === 'wurzeln_keimung' || e.stadium === 'echte_blaetter');
  if (!e.stadium || (!station && !e.zielbereich && e.zielEcGewaehlt === undefined))
    return { art: 'eingabe_noetig', felder: ['ziel_ec', 'stadium'], vorschlagStadium: 'wachstum' };
  const stadium = e.stadium;
  const dosis = station
    ? stationsDosis(stadium as 'wurzeln_keimung' | 'echte_blaetter')
    : (e.dosis ?? HERSTELLERDOSIS[stadium]);
  const D = bruch(dosisSumme(dosis));
  const ecSoll = plus(e.ecWasser, ecAusDosis(e.k, dosis));
  const hinweise: RechnerHinweis[] = [];

  let ecZiel = ecSoll;
  let skaliert = false;
  let gekappt = false;
  let kontrolleFolgetag = false;
  let dNeu: Bruch = D;
  const teil: 75 | 85 | 100 = station ? 100 : e.teilDosis;

  if (!station) {
    if (e.zielbereich) {
      const z = zielEc({ zielbereich: e.zielbereich, ecSoll, ecWasser: e.ecWasser });
      ecZiel = z.ecZiel;
      skaliert = z.skalieren;
      hinweise.push(...z.hinweise);
    } else {
      const z = untergrenze(bruch(e.zielEcGewaehlt ?? 0), e.ecWasser);
      ecZiel = z.ecZiel;
      skaliert = true;
      hinweise.push(...z.hinweise);
    }
    if (skaliert) dNeu = durch(mal(D, minus(ecZiel, e.ecWasser)), minus(ecSoll, e.ecWasser));
    const grenze = kappungsgrenze(dosis);
    if (vergleich(dNeu, grenze) > 0) {
      if (e.ueberHerstellerdosisBestaetigt) {
        kontrolleFolgetag = true;
        hinweise.push(hinweis('ueber_herstellerdosis'));
      } else {
        dNeu = grenze;
        gekappt = true;
        ecZiel = plus(e.ecWasser, durch(mal(kWirksam(e.k, dosis), dNeu), 1000));
        hinweise.push(hinweis('ziel_nicht_erreichbar'));
      }
    }
  }

  const roh = mengenRoh(dNeu, dosis, e.volumen);
  const rohTeil = mengenRoh(dNeu, dosis, e.volumen, teil);
  const mengen = gerundet(roh);
  const mengenTeil = gerundet(rohTeil);
  const dosisVerwendet: Dosis = {
    grow: runde(durch(mal(dNeu, dosis.grow), D)),
    micro_hard_water: runde(durch(mal(dNeu, dosis.micro_hard_water), D)),
    bloom: runde(durch(mal(dNeu, dosis.bloom), D)),
  };
  return {
    art: 'ergebnis',
    stadium,
    dosisHersteller: HERSTELLERDOSIS[stadium],
    dosisVerwendet,
    ecSoll: runde(ecSoll),
    ecZiel: runde(ecZiel),
    skaliert,
    gekappt,
    kontrolleFolgetag,
    teilDosis: teil,
    mengen,
    mengenTeil,
    messmittel: messmittelJe(mengenTeil, e.spritzen),
    ecErwartetTeil: runde(ecAusMengen(e.k, mengenTeil, e.volumen, e.ecWasser)),
    rundungsabweichungEc: rundungsabweichungEc(rohTeil, mengenTeil, e.k, e.volumen),
    ...(station
      ? { kontrollband: kontrollband(stadium as 'wurzeln_keimung' | 'echte_blaetter', e.ecWasser) }
      : {}),
    hinweise,
  };
}

export type StadiumEingabe =
  | { ort: 'anzuchtbox' }
  | { ort: 'station'; aeltesterEintrittAm: Date }
  | { ort: 'zielgefaess'; direktsaat: boolean; phaseLeitkultur: Phase; umgesetztAm?: Date | undefined };

const NACH_PHASE: Readonly<Record<Phase, Stadium>> = {
  keimung: 'echte_blaetter',
  anzucht: 'echte_blaetter',
  wachstum: 'wachstum',
  bluete: 'vorbluete',
  fruchtbildung_reife: 'bluete_frucht',
};

/** Herstellerstadium nach R4.3; Tage als Kalendertage in Zürich (G2) */
export function herstellerstadium(
  e: StadiumEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): Stadium | 'anfeuchten' {
  const tage = (seit: Date) => tageZwischen(kalendertag(seit, zeitzone), kalendertag(jetzt, zeitzone));
  if (e.ort === 'anzuchtbox') return 'anfeuchten';
  if (e.ort === 'station') return tage(e.aeltesterEintrittAm) <= 14 ? 'wurzeln_keimung' : 'echte_blaetter';
  if (e.direktsaat) return 'wachstum';
  if (e.umgesetztAm && tage(e.umgesetztAm) <= 7) return 'echte_blaetter';
  return NACH_PHASE[e.phaseLeitkultur];
}
