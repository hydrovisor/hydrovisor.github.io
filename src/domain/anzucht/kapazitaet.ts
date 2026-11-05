// Kapazität der Stationen und Anzuchtboxen (R6.1, UC5-AK15, Konzept 5.8 und 14.1; Plan 23). Rein: Kalendertage als
// Text 'JJJJ-MM-TT', keine Uhr. Belegung gilt nur am Keimtag (A2); Verweildauer nach A10.
import { gefaessAm, plaetzeAus, zeilen, type Teile } from '../anlage/teile.ts';
import { tagKurz, tagPlus, tageZwischen } from '../zeit.ts';

export type Groesse = 50 | 80;
type ProGroesse = { 50: number; 80: number };

/** Arten, deren Stationsplatz 80 mm hat (R6.1 letzter Satz; A9: art hat kein Feld dafür) */
export const ARTEN_80MM: ReadonlySet<string> = new Set([
  'solanum_lycopersicum',
  'capsicum_annuum',
  'ocimum_basilicum',
]);

export const stationsGroesse = (artId: string): Groesse => (ARTEN_80MM.has(artId) ? 80 : 50);

/** Ein Satz des laufenden Vorgangs, so wie er geplant ist */
export interface GeplanterSatz {
  /** Sortenname für die Texte */
  sorte: string;
  artId: string;
  saatdatum: string;
  keimdauerTyp: number | undefined;
  umsetzenAm: string | undefined;
  schwaemme: number;
  zieltoepfe: number;
  direktsaat: boolean;
}

export interface KapazitaetsWarnung {
  art: 'zu_wenig_platz' | 'stationsgrenze' | 'box_voll';
  text: string;
  sorte?: string;
  tag?: string;
}

/** R6.1: 5 cm höchstens Zieltöpfe + 1 Schwämme, 8 cm genau die Zieltöpfe; ohne Zieltöpfe alle Schwämme (A7) */
export function stationsBedarf(e: {
  groesseMm: Groesse;
  schwaemme: number;
  zieltoepfe: number;
  direktsaat: boolean;
}): number {
  if (e.direktsaat) return 0;
  if (e.zieltoepfe <= 0) return e.schwaemme;
  return e.groesseMm === 80 ? e.zieltoepfe : Math.min(e.schwaemme, e.zieltoepfe + 1);
}

interface DeckeltypZeile {
  id: string;
  topfdurchmesser_mm: number;
  loecher_je_reihe: number[];
}
interface SorteZeile {
  sorte_id: string;
  art_id: string;
}
interface ArtZeile {
  art_id: string;
  umsetzen_ab_d: number | null;
}
interface SatzZeile {
  id: string;
  sorte_id: string;
  anzuchtort_platz_id: string | null;
  saatdatum: string;
  storniert_am: string | null;
}
interface ZustandZeile {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
}
interface ReservierungZeile {
  pflanzung_id: string;
  umsetzen_geplant_am: string | null;
  umsetzen_vorgabe_am: string;
}
interface SollwertZeile {
  sorte_id: string;
  phase: string;
  groesse: string;
  wert_typ: number | string | null;
}
interface AnzuchtortZeile {
  platz_id: string;
  platzzahl: number;
  storniert_am: string | null;
}

/** Stationsplätze: Gefässe mit fester Dosis, je Topfgrösse ihres Deckels → Anzahl Löcher */
function stationen(teile: Teile, anlageId: string): Map<string, { groesse: Groesse; loecher: number }> {
  const deckel = zeilen<DeckeltypZeile>(teile, 'deckeltyp');
  const ergebnis = new Map<string, { groesse: Groesse; loecher: number }>();
  for (const p of plaetzeAus(teile, anlageId)) {
    if (p.rolle !== 'gefaess') continue;
    const g = gefaessAm(teile, p.id);
    if (!g?.feste_dosis) continue;
    const d = deckel.find((x) => x.id === g.deckeltyp_id);
    if (!d) continue;
    const groesse: Groesse = Number(d.topfdurchmesser_mm) >= 80 ? 80 : 50;
    ergebnis.set(p.id, { groesse, loecher: d.loecher_je_reihe.reduce((a, b) => a + b, 0) });
  }
  return ergebnis;
}

export function stationsPlaetze(teile: Teile, anlageId: string): ProGroesse {
  const summe: ProGroesse = { 50: 0, 80: 0 };
  for (const s of stationen(teile, anlageId).values()) summe[s.groesse] += s.loecher;
  return summe;
}

const artVonSorte = (teile: Teile, sorteId: string) =>
  zeilen<SorteZeile>(teile, 'sorte').find((s) => s.sorte_id === sorteId)?.art_id;

const umsetzenAbTage = (teile: Teile, artId: string | undefined) => {
  const d = zeilen<ArtZeile>(teile, 'art').find((a) => a.art_id === artId)?.umsetzen_ab_d;
  return d === null || d === undefined ? undefined : Number(d);
};

/** typische Keimdauer der Sorte aus v_sollwert (Phase keimung, Grösse dauer) */
export function keimdauerTyp(teile: Teile, sorteId: string): number | undefined {
  const z = zeilen<SollwertZeile>(teile, 'v_sollwert').find(
    (s) => s.sorte_id === sorteId && s.phase === 'keimung' && s.groesse === 'dauer',
  );
  return z?.wert_typ === null || z?.wert_typ === undefined ? undefined : Number(z.wert_typ);
}

/** Ende der Belegung (erster freier Tag): geplantes Umsetzdatum der Reservierung, sonst Saat + umsetzen_ab_d (A10) */
function belegtBis(
  teile: Teile,
  satz: SatzZeile,
  reservierungen: readonly ReservierungZeile[],
): string | undefined {
  const geplant = reservierungen
    .map((r) => r.umsetzen_geplant_am ?? r.umsetzen_vorgabe_am)
    .sort()
    .at(0);
  if (geplant) return geplant;
  const ab = umsetzenAbTage(teile, artVonSorte(teile, satz.sorte_id));
  return ab === undefined ? undefined : tagPlus(satz.saatdatum, ab);
}

const imFenster = (tag: string, von: string, bis: string | undefined) =>
  tag >= von && (bis === undefined || tag < bis);

/**
 * Belegte Stationsplätze an einem Kalendertag: (a) aktive Pflanzungen auf einer Station bis vor ihr Umsetzdatum;
 * (b) Sätze in einer Box der Anlage mit ihrem Stationsbedarf ab Keimtag bis vor ihr Umsetzdatum; (c) die geplanten
 * Sätze genauso.
 */
export function stationsBelegung(
  teile: Teile,
  anlageId: string,
  tag: string,
  geplant: readonly GeplanterSatz[],
): ProGroesse {
  const belegt: ProGroesse = { 50: 0, 80: 0 };
  const plaetze = stationen(teile, anlageId);
  const boxen = new Set(
    plaetzeAus(teile, anlageId)
      .filter((p) => p.rolle === 'anzuchtort')
      .map((p) => p.id),
  );
  const saetze = zeilen<SatzZeile>(teile, 'satz').filter((s) => s.storniert_am === null);
  const zustand = zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').filter((z) => z.status === 'aktiv');
  const reservierungen = zeilen<ReservierungZeile>(teile, 'v_reservierung_aktiv');
  const resVon = (ids: readonly string[]) => reservierungen.filter((r) => ids.includes(r.pflanzung_id));

  // (a) auf der Station
  for (const z of zustand) {
    const station = z.platz_id ? plaetze.get(z.platz_id) : undefined;
    const satz = saetze.find((s) => s.id === z.satz_id);
    if (!station || !satz) continue;
    if (imFenster(tag, '0000-01-01', belegtBis(teile, satz, resVon([z.pflanzung_id]))))
      belegt[station.groesse] += 1;
  }
  // (b) in der Box, noch ohne Platz
  for (const satz of saetze) {
    if (!satz.anzuchtort_platz_id || !boxen.has(satz.anzuchtort_platz_id)) continue;
    const inBox = zustand
      .filter((z) => z.satz_id === satz.id && z.platz_id === null)
      .map((z) => z.pflanzung_id);
    if (inBox.length === 0) continue;
    const keim = keimdauerTyp(teile, satz.sorte_id);
    if (keim === undefined) continue;
    const artId = artVonSorte(teile, satz.sorte_id) ?? '';
    const groesse = stationsGroesse(artId);
    const res = resVon(inBox);
    const bedarf = stationsBedarf({
      groesseMm: groesse,
      schwaemme: inBox.length,
      zieltoepfe: res.length,
      direktsaat: false,
    });
    if (imFenster(tag, tagPlus(satz.saatdatum, keim), belegtBis(teile, satz, res))) belegt[groesse] += bedarf;
  }
  // (c) geplant
  for (const g of geplant) {
    if (g.direktsaat || g.keimdauerTyp === undefined) continue;
    const groesse = stationsGroesse(g.artId);
    if (imFenster(tag, tagPlus(g.saatdatum, g.keimdauerTyp), g.umsetzenAm)) belegt[groesse] += bedarfVon(g);
  }
  return belegt;
}

const bedarfVon = (g: GeplanterSatz) =>
  stationsBedarf({
    groesseMm: stationsGroesse(g.artId),
    schwaemme: g.schwaemme,
    zieltoepfe: g.zieltoepfe,
    direktsaat: g.direktsaat,
  });

/** Platz für den Satz am Keimtag, gegen alle übrigen Belegungen */
function passt(
  teile: Teile,
  anlageId: string,
  satz: GeplanterSatz,
  andere: readonly GeplanterSatz[],
): boolean {
  if (satz.direktsaat || satz.keimdauerTyp === undefined) return true;
  const groesse = stationsGroesse(satz.artId);
  const keimtag = tagPlus(satz.saatdatum, satz.keimdauerTyp);
  const frei =
    stationsPlaetze(teile, anlageId)[groesse] - stationsBelegung(teile, anlageId, keimtag, andere)[groesse];
  return bedarfVon(satz) <= frei;
}

/** frühestes Saatdatum ab dem gewählten mit genug Platz am Keimtag, geprüft bis `bisTage` später (A11) */
export function fruehestesSaatdatum(
  teile: Teile,
  anlageId: string,
  satz: GeplanterSatz,
  andere: readonly GeplanterSatz[],
  bisTage = 42,
): string | undefined {
  const dauer = satz.umsetzenAm ? tageZwischen(satz.saatdatum, satz.umsetzenAm) : undefined;
  for (let d = 0; d <= bisTage; d += 1) {
    const saatdatum = tagPlus(satz.saatdatum, d);
    const verschoben = {
      ...satz,
      saatdatum,
      umsetzenAm: dauer === undefined ? undefined : tagPlus(saatdatum, dauer),
    };
    if (passt(teile, anlageId, verschoben, andere)) return saatdatum;
  }
  return undefined;
}

const cm = (g: Groesse) => (g === 80 ? '8 cm' : '5 cm');

/**
 * Stationsvorschau je Keimtag der geplanten Sätze mit Warnungen ohne Sperre: zu wenig Platz am Keimtag (mit
 * frühestem Saatdatum) und Stationsgrenze ab `stationsgrenzeAb` (je Satz höchstens die Hälfte der Plätze).
 */
export function stationsVorschau(
  teile: Teile,
  anlageId: string,
  geplant: readonly GeplanterSatz[],
  einstellung: { stationsgrenzeAb: string },
): {
  zeilen: {
    tag: string;
    frei50: number;
    plaetze50: number;
    frei80: number;
    plaetze80: number;
    text: string;
  }[];
  warnungen: KapazitaetsWarnung[];
} {
  const plaetze = stationsPlaetze(teile, anlageId);
  const tage = [
    ...new Set(
      geplant
        .filter((g) => !g.direktsaat && g.keimdauerTyp !== undefined)
        .map((g) => tagPlus(g.saatdatum, g.keimdauerTyp as number)),
    ),
  ].sort();
  const vorschau = tage.map((tag) => {
    const b = stationsBelegung(teile, anlageId, tag, geplant);
    const frei50 = Math.max(0, plaetze[50] - b[50]);
    const frei80 = Math.max(0, plaetze[80] - b[80]);
    return {
      tag,
      frei50,
      plaetze50: plaetze[50],
      frei80,
      plaetze80: plaetze[80],
      text: `Station am ${tagKurz(tag)}: frei ${frei50} von ${plaetze[50]} (5 cm), ${frei80} von ${plaetze[80]} (8 cm)`,
    };
  });

  const warnungen: KapazitaetsWarnung[] = [];
  geplant.forEach((g, i) => {
    if (g.direktsaat) return;
    const groesse = stationsGroesse(g.artId);
    const bedarf = bedarfVon(g);
    const andere = geplant.filter((_, j) => j !== i);
    if (g.keimdauerTyp !== undefined && !passt(teile, anlageId, g, andere)) {
      const keimtag = tagPlus(g.saatdatum, g.keimdauerTyp);
      const frei = Math.max(
        0,
        plaetze[groesse] - stationsBelegung(teile, anlageId, keimtag, andere)[groesse],
      );
      const frueh = fruehestesSaatdatum(teile, anlageId, g, andere);
      const rat =
        frueh === undefined
          ? 'In den nächsten 6 Wochen kein Saatdatum mit genug Platz'
          : `Genug Platz bei Saat am ${tagKurz(frueh)}`;
      warnungen.push({
        art: 'zu_wenig_platz',
        sorte: g.sorte,
        tag: keimtag,
        text: `Zu wenig Platz auf der Station am ${tagKurz(keimtag)}: ${g.sorte} braucht ${bedarf}, frei ${frei} (${cm(groesse)}). ${rat}`,
      });
    }
    const haelfte = Math.floor(plaetze[groesse] / 2);
    if (g.saatdatum >= einstellung.stationsgrenzeAb && bedarf > haelfte) {
      warnungen.push({
        art: 'stationsgrenze',
        sorte: g.sorte,
        text: `Satz ${g.sorte} belegt ${bedarf} von höchstens ${haelfte} Plätzen (${cm(groesse)})`,
      });
    }
  });
  return { zeilen: vorschau, warnungen };
}

/** Würfel einer Box: aktive Pflanzungen ihrer Sätze ohne Stationsplatz plus neue Schwämme (A12) */
export function boxBelegung(
  teile: Teile,
  boxPlatzId: string,
  neu: number,
): { belegt: number; platzzahl: number } {
  const box = zeilen<AnzuchtortZeile>(teile, 'anzuchtort').find(
    (a) => a.platz_id === boxPlatzId && a.storniert_am === null,
  );
  const saetze = new Set(
    zeilen<SatzZeile>(teile, 'satz')
      .filter((s) => s.storniert_am === null && s.anzuchtort_platz_id === boxPlatzId)
      .map((s) => s.id),
  );
  const inBox = zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').filter(
    (z) => z.status === 'aktiv' && z.platz_id === null && saetze.has(z.satz_id),
  ).length;
  return { belegt: inBox + neu, platzzahl: Number(box?.platzzahl ?? 25) };
}
