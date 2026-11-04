// Assistent «Gefäss erfassen» (UC3 Ablauf Erfassen, R9.3, Konzept 5.3, 5.4, 5.8; Plan 21): Vorschlag, Prüfung und
// ein Vorgang für schreiben(). Rein: IDs und jetzt kommen von aussen, die Eingabe wird nicht verändert.
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import type { Betriebsart } from './anlegen.ts';
import {
  bereicheAus,
  deckeltyp,
  gefaessAm,
  gefaessmodell,
  gefaessStatus,
  kuerzelVon,
  plaetzeAus,
  toepfeAm,
  zeilen,
  type GefaessZeile,
  type PlatzZeile,
  type Teile,
} from './teile.ts';

export interface Intervalle {
  messenD: number;
  nachfuellenD: number | null;
  wechselnD: number | null;
}

/** Intervalle je Betriebsart (Konzept 5.3): DWC und Konstantpegel 2/2/14, Kratky 7 ohne Nachfüllen und Wechsel */
export const INTERVALLE: Readonly<Record<Betriebsart, Intervalle>> = {
  dwc: { messenD: 2, nachfuellenD: 2, wechselnD: 14 },
  konstantpegel: { messenD: 2, nachfuellenD: 2, wechselnD: 14 },
  kratky_belueftet: { messenD: 7, nachfuellenD: null, wechselnD: null },
  kratky: { messenD: 7, nachfuellenD: null, wechselnD: null },
};

/** Positionen je Ebene (UC3, Konzept 5.4): 1: 2, 2 und 3: 3, 4: 5; andere Bereiche 1 bis 9 (Plan 21 A3) */
export function positionen(bereichNummer: number): number[] {
  const anzahl =
    bereichNummer === 1 ? 2 : bereichNummer === 2 || bereichNummer === 3 ? 3 : bereichNummer === 4 ? 5 : 9;
  return Array.from({ length: anzahl }, (_, i) => i + 1);
}

export interface Topf {
  kennung: string;
  lochNr: number;
  groesseMm: number;
}

/** Töpfe eines Gefässes je Loch; Stationen mit fester Dosis und 80 mm tragen keine eigenen (Plan 21 A5) */
export function toepfe(
  kennung: string,
  deckel: { topfdurchmesser_mm: number; loecher_je_reihe: readonly number[] },
  festeDosis: boolean,
): Topf[] {
  if (festeDosis && deckel.topfdurchmesser_mm === 80) return [];
  const anzahl = deckel.loecher_je_reihe.reduce((a, b) => a + b, 0);
  return Array.from({ length: anzahl }, (_, i) => ({
    kennung: `${kennung}.${i + 1}`,
    lochNr: i + 1,
    groesseMm: deckel.topfdurchmesser_mm,
  }));
}

export type Rolle = 'gefaess' | 'anzuchtort' | 'messstelle';
type Luftpumpe = 'P1' | 'P2' | 'P3' | 'P4' | null;

export type ErfassenEingabe =
  | {
      rolle: 'gefaess';
      anlageId: string;
      bereichId: string;
      position: number;
      betriebsart: Betriebsart;
      festeDosis: boolean;
      luftpumpe: Luftpumpe;
      gefaessmodellId: string;
      betriebsvolumenL: number;
      deckeltypId: string;
      intervalle: Intervalle;
    }
  | {
      rolle: 'anzuchtort';
      anlageId: string;
      bereichId: string | null;
      kennung: string;
      typ: 'box_licht' | 'box_dunkel';
      position: 'vorne' | 'hinten';
      platzzahl: number;
    }
  | { rolle: 'messstelle'; anlageId: string };

export interface ErfassenVorschlag {
  kennung?: string;
  code?: string;
  position?: number | 'vorne' | 'hinten';
  betriebsart?: Betriebsart;
  intervalle?: Intervalle;
  betriebsvolumenL?: number;
  typ?: 'box_licht' | 'box_dunkel';
  platzzahl?: number;
  bereichId?: string | null;
  toepfe: Topf[];
  hinweise: string[];
}

export const HINWEIS_TASCHE = 'Tasche mit dem Etikett auf die neue Box umstecken';
const BOXEN = ['A1', 'A2', 'A3', 'A4'];
/** A1 und A2 Lichtkeimer, A3 und A4 Dunkelkeimer; A1 und A3 vorne (Konzept 5.8) */
const BOX_TYP = (k: string) =>
  (k === 'A3' || k === 'A4' ? 'box_dunkel' : 'box_licht') as 'box_licht' | 'box_dunkel';
const BOX_POSITION = (k: string) => (k === 'A2' || k === 'A4' ? 'hinten' : 'vorne') as 'vorne' | 'hinten';

/** Platz einer Kennung in der Anlage */
function platzMit(teile: Teile, anlageId: string, kennung: string): PlatzZeile | undefined {
  return plaetzeAus(teile, anlageId).find((p) => p.kennung === kennung);
}

/**
 * Kennung belegt (UC3-AK2, Plan 21 A4): Anzuchtort und Messstelle, sobald der Platz besteht; ein Gefäss, solange
 * am Platz eine offene Belegung mit einem Status ausser «entfernt» besteht.
 */
function belegt(teile: Teile, platz: PlatzZeile | undefined): boolean {
  if (!platz) return false;
  if (platz.rolle !== 'gefaess') return true;
  const g = gefaessAm(teile, platz.id);
  return g !== undefined && gefaessStatus(teile, g.id) !== 'entfernt';
}

/** Platz eines entfernten Gefässes, den ein neues Gefäss übernimmt (A4) */
function uebernommen(teile: Teile, platz: PlatzZeile | undefined): boolean {
  return platz !== undefined && platz.rolle === 'gefaess' && !belegt(teile, platz);
}

const zahl = (w: unknown) => (w === null || w === undefined ? undefined : Number(w));

export function erfassenVorschlag(
  teile: Teile,
  anlageId: string,
  teil: {
    rolle: Rolle;
    bereichId?: string;
    position?: number;
    betriebsart?: Betriebsart;
    gefaessmodellId?: string;
    deckeltypId?: string;
    festeDosis?: boolean;
  },
): ErfassenVorschlag {
  const kuerzel = kuerzelVon(teile, anlageId);
  if (teil.rolle === 'messstelle')
    return { kennung: 'W', code: `${kuerzel}-W`, bereichId: null, toepfe: [], hinweise: [] };
  if (teil.rolle === 'anzuchtort') {
    const kennung = BOXEN.find((k) => !platzMit(teile, anlageId, k));
    const bereiche = bereicheAus(teile, anlageId);
    // Bereich der bestehenden Anzuchtorte, sonst der oberste (Plan 21 A3)
    const vorhanden = plaetzeAus(teile, anlageId).find((p) => p.rolle === 'anzuchtort')?.bereich_id;
    const oberster = [...bereiche].sort((a, b) => b.nummer - a.nummer)[0]?.id ?? null;
    const bereichId = vorhanden ?? oberster;
    if (!kennung) return { bereichId, toepfe: [], hinweise: ['Alle vier Anzuchtboxen sind erfasst'] };
    return {
      kennung,
      code: `${kuerzel}-${kennung}`,
      typ: BOX_TYP(kennung),
      position: BOX_POSITION(kennung),
      platzzahl: 25,
      bereichId,
      toepfe: [],
      hinweise: [],
    };
  }
  const bereich = bereicheAus(teile, anlageId).find((b) => b.id === teil.bereichId);
  if (!bereich) return { toepfe: [], hinweise: [] };
  const standard = (bereich as { standard_betriebsart?: Betriebsart | null }).standard_betriebsart;
  const betriebsart = teil.betriebsart ?? standard ?? 'dwc';
  const frei = positionen(bereich.nummer).filter(
    (p) => !belegt(teile, platzMit(teile, anlageId, `${bereich.nummer}.${p}`)),
  );
  const position = teil.position ?? frei[0];
  const modell = teil.gefaessmodellId ? gefaessmodell(teile, teil.gefaessmodellId) : undefined;
  const deckel = teil.deckeltypId ? deckeltyp(teile, teil.deckeltypId) : undefined;
  const kennung = position === undefined ? undefined : `${bereich.nummer}.${position}`;
  const vorschlag: ErfassenVorschlag = {
    betriebsart,
    intervalle: { ...INTERVALLE[betriebsart] },
    bereichId: bereich.id,
    toepfe: kennung && deckel ? toepfe(kennung, deckel, teil.festeDosis ?? false) : [],
    hinweise: [],
  };
  const volumen = zahl(modell?.betriebsvolumen_l);
  if (volumen !== undefined) vorschlag.betriebsvolumenL = volumen;
  if (kennung && position !== undefined) {
    vorschlag.kennung = kennung;
    vorschlag.code = `${kuerzel}-${kennung}`;
    vorschlag.position = position;
    if (uebernommen(teile, platzMit(teile, anlageId, kennung))) vorschlag.hinweise.push(HINWEIS_TASCHE);
  }
  return vorschlag;
}

/** Betriebsvolumen kleiner als L × B × H, ganzzahlig in ml und mm³ (R9.3, G3) */
export function volumenPasst(
  volumenL: number,
  modell: { innen_l_mm: number; innen_b_mm: number; innen_h_mm: number },
) {
  const ml = Math.round(volumenL * 1000);
  return ml > 0 && ml * 1000 < modell.innen_l_mm * modell.innen_b_mm * modell.innen_h_mm;
}

function kennungVon(teile: Teile, e: ErfassenEingabe): string | undefined {
  if (e.rolle === 'messstelle') return 'W';
  if (e.rolle === 'anzuchtort') return e.kennung;
  const bereich = bereicheAus(teile, e.anlageId).find((b) => b.id === e.bereichId);
  return bereich ? `${bereich.nummer}.${e.position}` : undefined;
}

export function erfassenPruefen(teile: Teile, e: ErfassenEingabe): Verstoss[] {
  const f: Verstoss[] = [];
  const kennung = kennungVon(teile, e);
  if (!kennung) return [{ feld: 'kennung', grund: 'Wähle einen Bereich der Anlage.' }];
  if (e.rolle === 'gefaess') {
    const bereich = bereicheAus(teile, e.anlageId).find((b) => b.id === e.bereichId);
    if (bereich && !positionen(bereich.nummer).includes(e.position))
      f.push({ feld: 'kennung', grund: `Position ${e.position} gibt es auf Ebene ${bereich.nummer} nicht.` });
  }
  if (belegt(teile, platzMit(teile, e.anlageId, kennung)))
    f.push({ feld: 'kennung', grund: `Kennung ${kennung} ist schon belegt.` });
  if (e.rolle !== 'gefaess') return f;
  const modell = gefaessmodell(teile, e.gefaessmodellId);
  if (!modell) f.push({ feld: 'betriebsvolumen', grund: 'Wähle eine Box.' });
  else if (!volumenPasst(e.betriebsvolumenL, modell))
    f.push({
      feld: 'betriebsvolumen',
      grund: 'Betriebsvolumen muss kleiner sein als der Innenraum der Box.',
    });
  const deckel = deckeltyp(teile, e.deckeltypId);
  if (!deckel || (deckel.topfdurchmesser_mm !== 50 && deckel.topfdurchmesser_mm !== 80))
    f.push({ feld: 'topfgroesse', grund: 'Topfgrösse nur 5 oder 8 cm.' });
  if (e.festeDosis && e.betriebsart !== 'konstantpegel')
    f.push({ feld: 'feste_dosis', grund: 'Feste Dosis nur bei Konstantpegel.' });
  return f;
}

const neu = (tabelle: Schritt['tabelle'], id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle,
  felder: { client_id: id, id, ...felder },
});

/** Felder einer Belegung ohne Serverfelder und ohne id (für Kopie und neue Zeile) */
export function belegungFelder(g: GefaessZeile): Record<string, unknown> {
  const felder: Record<string, unknown> = { ...g };
  delete felder['id'];
  delete felder['client_id'];
  delete felder['storniert_am'];
  delete felder['erfasst_am'];
  delete felder['app_version'];
  delete felder['nacherfasst'];
  return felder;
}

/**
 * Töpfe am Platz an ein Lochbild angleichen (R8.3, Plan 21 A8): bestehende aktive Töpfe mit passendem Loch und
 * gleicher Grösse bleiben, die übrigen werden storniert, fehlende Löcher bekommen neue Töpfe.
 */
export function toepfeAngleichen(
  teile: Teile,
  platz: { id: string; anlage_id: string; kennung: string },
  soll: Topf[],
  ids: () => string,
): Schritt[] {
  const ist = toepfeAm(teile, platz.id);
  const schritte: Schritt[] = [];
  const bleibt = new Set<number>();
  for (const t of ist) {
    const passt = soll.some((s) => s.lochNr === t.heim_loch_nr && s.groesseMm === t.groesse_mm);
    if (passt) bleibt.add(t.heim_loch_nr);
    else
      schritte.push({
        art: 'storno',
        tabelle: 'netztopf',
        clientId: t.client_id ?? t.id,
        grund: 'korrektur',
      });
  }
  for (const s of soll)
    if (!bleibt.has(s.lochNr))
      schritte.push(
        neu('netztopf', ids(), {
          anlage_id: platz.anlage_id,
          kennung: s.kennung,
          groesse_mm: s.groesseMm,
          heim_platz_id: platz.id,
          heim_loch_nr: s.lochNr,
        }),
      );
  return schritte;
}

export function erfassenVorgang(teile: Teile, e: ErfassenEingabe, ids: () => string, jetzt: Date): Vorgang {
  const iso = jetzt.toISOString();
  const kuerzel = kuerzelVon(teile, e.anlageId);
  const kennung = kennungVon(teile, e) ?? '';
  const code = `${kuerzel}-${kennung}`;
  const schritte: Schritt[] = [];

  if (e.rolle !== 'gefaess') {
    const platzId = ids();
    schritte.push(
      neu('platz', platzId, {
        anlage_id: e.anlageId,
        bereich_id: e.rolle === 'anzuchtort' ? e.bereichId : null,
        kennung,
        rolle: e.rolle,
      }),
      neu('etikett', ids(), {
        code,
        platz_id: platzId,
        format: e.rolle === 'anzuchtort' ? '55x25' : '70x42_3',
      }),
    );
    if (e.rolle === 'anzuchtort')
      schritte.push(
        neu('anzuchtort', ids(), {
          platz_id: platzId,
          typ: e.typ,
          platzzahl: e.platzzahl,
          position: e.position,
        }),
      );
    return schritte;
  }

  // Gefäss: vorhandenen Platz eines entfernten Gefässes übernehmen (A4), sonst Platz und Etikett neu
  const vorhanden = platzMit(teile, e.anlageId, kennung);
  const uebernimmt = uebernommen(teile, vorhanden);
  const platz =
    uebernimmt && vorhanden
      ? vorhanden
      : { id: ids(), anlage_id: e.anlageId, kennung, bereich_id: e.bereichId, rolle: 'gefaess' as const };
  if (!uebernimmt) {
    schritte.push(
      neu('platz', platz.id, {
        anlage_id: e.anlageId,
        bereich_id: e.bereichId,
        kennung,
        rolle: 'gefaess',
        position: e.position,
      }),
      neu('etikett', ids(), { code, platz_id: platz.id, format: '70x42_3' }),
    );
  } else {
    const etikett = zeilen<{ platz_id: string; storniert_am: string | null }>(teile, 'etikett').some(
      (x) => x.platz_id === platz.id && x.storniert_am === null,
    );
    if (!etikett) schritte.push(neu('etikett', ids(), { code, platz_id: platz.id, format: '70x42_3' }));
    // alte Belegung: Storno und geschlossene Kopie vor der neuen (Teilindex gefaess_aktiv_je_platz, A1)
    const alt = gefaessAm(teile, platz.id);
    if (alt) {
      schritte.push({
        art: 'storno',
        tabelle: 'gefaess',
        clientId: alt.client_id ?? alt.id,
        grund: 'korrektur',
      });
      schritte.push(neu('gefaess', ids(), { ...belegungFelder(alt), gueltig_bis: iso }));
    }
  }
  schritte.push(
    neu('gefaess', ids(), {
      platz_id: platz.id,
      gefaessmodell_id: e.gefaessmodellId,
      deckeltyp_id: e.deckeltypId,
      betriebsart: e.betriebsart,
      feste_dosis: e.festeDosis,
      luftpumpe: e.luftpumpe,
      betriebsvolumen_l: e.betriebsvolumenL,
      intervall_messen_d: e.intervalle.messenD,
      intervall_nachfuellen_d: e.intervalle.nachfuellenD,
      intervall_wechseln_d: e.intervalle.wechselnD,
      gueltig_von: iso,
      gueltig_bis: null,
    }),
  );
  const deckel = deckeltyp(teile, e.deckeltypId);
  const soll = deckel ? toepfe(kennung, deckel, e.festeDosis) : [];
  schritte.push(...toepfeAngleichen(teile, platz, soll, ids));
  schritte.push(
    neu('ereignis', ids(), { typ: 'gefaess_erfasst', platz_id: platz.id, gilt_ab: iso, daten: {} }),
  );
  return schritte;
}
