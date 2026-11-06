// Aufgaben-Rechnung, Teil Regeln (Plan 27 «Tabelle R5.2 nach Stufen»; R5.2, R5.4, G2, G5, 8.1 Regel 7): je Zeile der
// Stufe 1 eine reine Funktion über die Bündelteile. Fälligkeiten als Kalendertag Zürich (G2), künftige werden
// mitgeliefert. Bestehende Teil-Fälligkeiten werden aufgerufen, nicht nachgerechnet: messFaelligkeit(), kalibrierStand(),
// saatTermine(), keimTermine() (keimPruefTermin()). Füllzustand und Prüfstatus (R5.4) wirken in ortAufgaben() an einer
// Stelle, nicht in jeder Regel.
import {
  anlagenAus,
  anzuchtortAm,
  ereignisseAm,
  gefaessAm,
  gefaessStatus,
  ms,
  plaetzeAus,
  toepfeAm,
  zeilen,
  type AnlageZeile,
  type AnzuchtortZeile,
  type EreignisZeile,
  type GefaessZeile,
  type PlatzZeile,
  type Teile,
} from './anlage/teile.ts';
import { saatTermine } from './anzucht/termine.ts';
import { kalibrierStand, type GeraeteEreignis, type KalibrierZeile } from './kalibrierung/stand.ts';
import { messFaelligkeit } from './messung/faelligkeit.ts';
import { keimTermine, type KeimTermin } from './pflanzung/keimung.ts';
import { aufgabenSchluessel, erfassungOderUebersprungen, type AufschubZeile } from './aufgaben-aufschub.ts';
import { kalendertag, tagPlus, tageZwischen, type Zeitzone } from './zeit.ts';
import type {
  AufgabenEinstellungen,
  AufgabenOrt,
  AufgabenTyp,
  BezugArt,
  Gewicht,
  Rohaufgabe,
} from './aufgaben.ts';

interface MessungZeile {
  platz_id: string | null;
  messgeraet_id?: string | null;
  messart?: string;
  temperatur?: number | string | null;
  fuellstand?: string | null;
  bewertung_ph?: string | null;
  bewertung_ec?: string | null;
  bewertung_temp?: string | null;
  datenart?: string | null;
  gilt_ab: string;
  storniert_am?: string | null;
}
interface AnsatzZeile {
  platz_id: string;
  typ: string;
  status: string;
  begonnen_am: string;
  nachgefuellt_l?: number | string | null;
  gilt_ab: string;
  client_zeit?: string | null;
  erfasst_am?: string | null;
  storniert_am?: string | null;
}
interface SatzZeile {
  id: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  storniert_am?: string | null;
}
interface ZustandZeile {
  pflanzung_id: string;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
}
interface ReservierungZeile {
  pflanzung_id: string;
  netztopf_id: string;
  umsetzen_geplant_am: string;
  storniert_am?: string | null;
}
interface PflanzEreignis {
  typ: string;
  pflanzung_id: string | null;
  satz_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}

/** Pflanzung mit ihrem Platz: ohne Ortsereignis steht sie am Anzuchtort bzw. im Direktsaat-Gefäss ihres Satzes */
interface PflanzOrt {
  pflanzungId: string;
  satzId: string;
  aktiv: boolean;
  platzId: string | null;
  netztopfId: string | null;
}

/** Abweichung Pumpe oder Luftzone aus der Kurzprüfung, noch nicht mit «ok» abgelöst */
interface Abweichung {
  platzId: string;
  anlageId: string;
  luftpumpe: string | null;
  tag: string;
}

export interface Regelkontext {
  teile: Teile;
  einstellungen: AufgabenEinstellungen;
  stichtag: Date;
  zeitzone: Zeitzone;
  heute: string;
  /** nicht storniert */
  aufschuebe: readonly AufschubZeile[];
  keim: readonly KeimTermin[];
  pflanzen: readonly PflanzOrt[];
  reservierungen: readonly ReservierungZeile[];
  abweichungen: readonly Abweichung[];
}

/** einmal je Platz gerechnet, von allen Ortsregeln geteilt */
export interface OrtLage {
  platz: PlatzZeile;
  anlage: AnlageZeile;
  ort: AufgabenOrt;
  gefaess?: GefaessZeile;
  anzuchtort?: AnzuchtortZeile;
  fuellzustand: 'leer' | 'loesung';
  status?: string;
  /** Messungen am Platz, älteste zuerst */
  messungen: readonly MessungZeile[];
  letzteMessung?: MessungZeile;
  ansaetze: readonly AnsatzZeile[];
  letzterNeuansatz?: AnsatzZeile;
  nachfuellsummeL: number;
  ereignisse: readonly EreignisZeile[];
}

export type Regel = (k: Regelkontext, lage: OrtLage) => Rohaufgabe[];

const offen = (z: { storniert_am?: string | null }) => (z.storniert_am ?? null) === null;
const nachZeit = <T extends { gilt_ab: string }>(l: readonly T[]) =>
  [...l].sort((a, b) => ms(a.gilt_ab) - ms(b.gilt_ab));
const kleinster = (l: readonly string[]) => [...l].sort()[0];
const datenVon = (e: { daten?: Record<string, unknown> | null }) => e.daten ?? {};

function tag(k: Pick<Regelkontext, 'zeitzone'>, iso: string): string {
  return kalendertag(new Date(iso), k.zeitzone);
}

function neu(
  typ: AufgabenTyp,
  bezug: string,
  bezugArt: BezugArt,
  faelligAm: string,
  wo: { anlageId: string; datenart: Rohaufgabe['datenart']; ort?: AufgabenOrt },
  titel: string,
  extra: Partial<Pick<Rohaufgabe, 'gewicht' | 'hinweis' | 'morgenBis' | 'ohneUeberspringen'>> = {},
): Rohaufgabe {
  const gewicht: Gewicht = extra.gewicht ?? 'routine';
  return {
    schluessel: aufgabenSchluessel(typ, bezug, faelligAm),
    typ,
    bezug,
    bezugArt,
    faelligAm,
    anlageId: wo.anlageId,
    datenart: wo.datenart,
    ...(wo.ort ? { ort: wo.ort } : {}),
    titel,
    ...extra,
    gewicht,
  };
}

const amOrt = (lage: OrtLage) => ({
  anlageId: lage.anlage.id,
  datenart: lage.anlage.datenart,
  ort: lage.ort,
});

function amPlatz(
  lage: OrtLage,
  typ: AufgabenTyp,
  faelligAm: string,
  titel: string,
  extra?: Parameters<typeof neu>[6],
): Rohaufgabe[] {
  return [neu(typ, lage.platz.id, 'platz', faelligAm, amOrt(lage), titel, extra)];
}

const kratky = (g: GefaessZeile) => g.betriebsart.startsWith('kratky');
const ausserhalb = (m: MessungZeile | undefined) =>
  m !== undefined && [m.bewertung_ph, m.bewertung_ec, m.bewertung_temp].includes('ausserhalb');

// ---------------------------------------------------------------- Ortsregeln (Reihenfolge = Tabelle R5.2)

/** Gefäss prüfen: in Prüfung seit dem Anker gefaess_erfasst (sonst Beginn der Belegung) */
export const gefaessPruefen: Regel = (k, lage) => {
  if (!lage.gefaess || lage.status !== 'in_pruefung') return [];
  const erfasst = nachZeit(lage.ereignisse.filter((e) => e.typ === 'gefaess_erfasst')).at(-1)?.gilt_ab;
  const anker = erfasst ?? lage.gefaess.gueltig_von ?? k.stichtag.toISOString();
  return amPlatz(lage, 'gefaess_pruefen', tag(k, anker), 'Gefäss prüfen');
};

/** Messen und nachfüllen (DWC, Konstantpegel, Station) bzw. Messen (Kratky); Neuansatz zählt als Grundlage (A2) */
export const messen: Regel = (k, lage) => {
  const g = lage.gefaess;
  if (!g || g.intervall_messen_d === null) return [];
  const typ: AufgabenTyp = kratky(g) ? 'messen' : 'messen_nachfuellen';
  const grundlage = [
    ...lage.messungen,
    ...(lage.letzterNeuansatz ? [{ gilt_ab: lage.letzterNeuansatz.begonnen_am }] : []),
  ];
  const mf = messFaelligkeit(
    { platzId: lage.platz.id, intervallMessenD: g.intervall_messen_d },
    grundlage.map((m) => ({ platz_id: lage.platz.id, gilt_ab: m.gilt_ab, storniert_am: null })),
    k.stichtag,
    k.zeitzone,
  );
  if (mf.art !== 'offen') return [];
  const basis = erfassungOderUebersprungen(
    typ,
    lage.platz.id,
    mf.letzte === undefined ? undefined : tag(k, mf.letzte),
    k.aufschuebe,
  );
  const faelligAm = basis === undefined ? mf.faelligAm : tagPlus(basis, g.intervall_messen_d);
  const ohnePumpe = g.betriebsart === 'kratky';
  return amPlatz(lage, typ, faelligAm, typ === 'messen' ? 'Messen' : 'Messen und nachfüllen', {
    gewicht: ausserhalb(lage.letzteMessung) ? 'ausserhalb' : 'routine',
    ...(ohnePumpe ? { hinweis: 'zuerst umrühren', ohneUeberspringen: true } : {}),
  });
};

/** Nachfüllen Kratky: letzte Messung «unter ⅓», danach kein Nachfüllen und kein Neuansatz (A) */
export const nachfuellenKratky: Regel = (k, lage) => {
  const m = lage.letzteMessung;
  if (!lage.gefaess || !kratky(lage.gefaess) || m?.fuellstand !== 'unter_drittel') return [];
  const aufgefuellt = lage.ansaetze.some(
    (a) => (a.typ === 'nachfuellen' || a.typ === 'neuansatz') && ms(a.begonnen_am) > ms(m.gilt_ab),
  );
  return aufgefuellt ? [] : amPlatz(lage, 'nachfuellen_kratky', tag(k, m.gilt_ab), 'Nachfüllen Kratky');
};

/**
 * Lösung wechseln (DWC, Konstantpegel, Station): Neuansatz + Intervall der Belegung (UC3-AK7), einmalig
 * naechster_wechsel_am (A3); zusätzlich ab dem Tag, an dem die Nachfüllsumme seit dem Neuansatz das Betriebsvolumen
 * erreicht (Konzept R5.2, Prüfer Runde 1 Befund 1). Ob sie es erreicht, sagt v_nachfuellsumme; den Tag liefern die
 * Nachfüll-Ansätze im Bündel, ohne sie (älteres Bündel) der letzte Nachfüll-Ansatz, sonst heute.
 */
export const loesungWechseln: Regel = (k, lage) => {
  const g = lage.gefaess;
  const n = lage.letzterNeuansatz;
  if (!g || kratky(g) || g.intervall_wechseln_d === null || !n) return [];
  const seit = tag(k, n.begonnen_am);
  const vorgabe = g.naechster_wechsel_am ?? undefined;
  const regulaer = vorgabe !== undefined && vorgabe > seit ? vorgabe : tagPlus(seit, g.intervall_wechseln_d);
  // Liter in Hundertsteln als Ganzzahl (G3, numeric(5,2)), damit 4.5 + 4.5 sicher 9 ergibt
  const volumen = Math.round(Number(g.betriebsvolumen_l) * 100);
  let faelligAm = regulaer;
  if (Math.round(lage.nachfuellsummeL * 100) >= volumen) {
    const nachfuellen = lage.ansaetze
      .filter((a) => a.typ === 'nachfuellen' && ms(a.begonnen_am) > ms(n.begonnen_am))
      .sort((a, b) => ms(a.begonnen_am) - ms(b.begonnen_am));
    let summe = 0;
    const erreicht =
      nachfuellen.find((a) => (summe += Math.round(Number(a.nachgefuellt_l ?? 0) * 100)) >= volumen) ??
      nachfuellen.at(-1);
    const voll = erreicht === undefined ? k.heute : tag(k, erreicht.begonnen_am);
    if (voll < regulaer) faelligAm = voll;
  }
  return amPlatz(lage, 'loesung_wechseln', faelligAm, 'Lösung wechseln', { gewicht: 'wechsel' });
};

/** Ansatz für Umsetzen (Reservierungen auf Töpfe dieses Platzes) oder Direktsaat (Saattag), nur bei leer */
export const ansatz: Regel = (k, lage) => {
  if (!lage.gefaess || lage.fuellzustand !== 'leer') return [];
  const toepfe = new Set(toepfeAm(k.teile, lage.platz.id).map((t) => t.id));
  const umsetzen = kleinster(
    k.reservierungen.filter((r) => toepfe.has(r.netztopf_id)).map((r) => r.umsetzen_geplant_am),
  );
  const saetze = new Set(
    k.pflanzen.filter((p) => p.aktiv && p.platzId === lage.platz.id).map((p) => p.satzId),
  );
  const direktsaat = kleinster(
    k.keim
      .filter((s) => s.direktsaat && s.ortPlatzId === lage.platz.id && saetze.has(s.satzId))
      .map((s) => s.saatdatum),
  );
  if (umsetzen === undefined && direktsaat === undefined) return [];
  const fuerDirektsaat = umsetzen === undefined || (direktsaat !== undefined && direktsaat < umsetzen);
  return amPlatz(
    lage,
    'ansatz',
    (fuerDirektsaat ? direktsaat : umsetzen) as string,
    fuerDirektsaat ? 'Ansatz für Direktsaat' : 'Ansatz für Umsetzen',
    { gewicht: 'wechsel' },
  );
};

/** Kontrollmessung am Folgetag, nur wenn der Neuansatz spätestens am Folgetag erfasst ist (TZ9, A4) */
export const kontrolleFolgetag: Regel = (k, lage) => {
  const n = lage.letzterNeuansatz;
  if (!n) return [];
  const folge = tagPlus(tag(k, n.begonnen_am), 1);
  const erfasst = tag(k, n.erfasst_am ?? n.client_zeit ?? n.gilt_ab);
  if (erfasst > folge || lage.messungen.some((m) => tag(k, m.gilt_ab) >= folge)) return [];
  return amPlatz(lage, 'kontrolle_folgetag', folge, 'Kontrollmessung am Folgetag');
};

/** Kurzprüfung: täglich, solange am Platz heute keine erfasst ist */
export const kurzpruefung: Regel = (k, lage) => {
  if (!lage.gefaess) return [];
  const heute = lage.ereignisse.some((e) => e.typ === 'kurzpruefung' && tag(k, e.gilt_ab) === k.heute);
  return heute ? [] : amPlatz(lage, 'kurzpruefung', k.heute, 'Kurzprüfung');
};

/** Belüftung prüfen: Abweichung am Platz, bei der Pumpe auch alle Gefässe derselben Luftpumpe (E6) */
export const belueftungPruefen: Regel = (k, lage) => {
  const pumpe = lage.gefaess?.luftpumpe ?? null;
  if (!lage.gefaess) return [];
  const eigene = k.abweichungen.filter((a) => a.platzId === lage.platz.id).map((a) => a.tag);
  const mit = k.abweichungen
    .filter((a) => a.anlageId === lage.anlage.id && a.luftpumpe !== null && a.luftpumpe === pumpe)
    .map((a) => a.tag);
  const faelligAm = kleinster(eigene.length > 0 ? eigene : mit);
  if (faelligAm === undefined) return [];
  return amPlatz(lage, 'belueftung_pruefen', faelligAm, 'Belüftung prüfen', {
    gewicht: 'ausserhalb',
    ...(eigene.length > 0 ? {} : { hinweis: 'mitmarkiert' }),
  });
};

/** Wurzeln prüfen: letzte Kurzprüfung Wurzeln + 7, ohne solche Neuansatz + 7 (A5) */
export const wurzelnPruefen: Regel = (k, lage) => {
  const geprueft = nachZeit(
    lage.ereignisse.filter((e) => e.typ === 'kurzpruefung' && datenVon(e)['punkt'] === 'wurzeln'),
  ).at(-1)?.gilt_ab;
  const letzte = geprueft ?? lage.letzterNeuansatz?.begonnen_am;
  const basis = erfassungOderUebersprungen(
    'wurzeln_pruefen',
    lage.platz.id,
    letzte === undefined ? undefined : tag(k, letzte),
    k.aufschuebe,
  );
  if (!lage.gefaess || basis === undefined) return [];
  return amPlatz(lage, 'wurzeln_pruefen', tagPlus(basis, 7), 'Wurzeln prüfen');
};

/** Wärme prüfen: letzte Messung über 24.0 °C (Hundertstel, G3) → Folgetag; erledigt durch die nächste Messung */
export const waermePruefen: Regel = (k, lage) => {
  const m = lage.letzteMessung;
  if (!m || Math.round(Number(m.temperatur ?? 0) * 100) <= 2400) return [];
  return amPlatz(lage, 'waerme_pruefen', tagPlus(tag(k, m.gilt_ab), 1), 'Wärme prüfen', {
    gewicht: 'ausserhalb',
  });
};

/** Würfel feucht: Anzuchtbox mit aktiver Pflanzung; erledigt durch Erledigt oder Kurzprüfung wuerfel_feucht heute */
export const wuerfelFeucht: Regel = (k, lage) => {
  if (!lage.anzuchtort || !k.pflanzen.some((p) => p.aktiv && p.platzId === lage.platz.id)) return [];
  const schluessel = aufgabenSchluessel('wuerfel_feucht', lage.platz.id, k.heute);
  const erledigt = lage.ereignisse.some(
    (e) =>
      (e.typ === 'aufgabe_erledigt' && schluesselVon(e) === schluessel) ||
      (e.typ === 'kurzpruefung' &&
        datenVon(e)['punkt'] === 'wuerfel_feucht' &&
        tag(k, e.gilt_ab) === k.heute),
  );
  return erledigt ? [] : amPlatz(lage, 'wuerfel_feucht', k.heute, 'Würfel feucht');
};

/** Deckel öffnen: Dunkelkeimer-Box, frühester Satz ohne Keimprüfung und ohne deckel_geoeffnet seit seiner Saat (A9) */
export const deckelOeffnen: Regel = (k, lage) => {
  if (lage.anzuchtort?.typ !== 'box_dunkel') return [];
  const geoeffnet = lage.ereignisse.filter((e) => e.typ === 'deckel_geoeffnet').map((e) => tag(k, e.gilt_ab));
  const termine = k.keim
    .filter((s) => !s.direktsaat && s.ortPlatzId === lage.platz.id && !s.geprueft)
    .filter((s) => !geoeffnet.some((t) => t >= s.saatdatum))
    .flatMap((s) => termineVon(k, s, 'deckel_oeffnen'));
  const faelligAm = kleinster(termine);
  return faelligAm === undefined ? [] : amPlatz(lage, 'deckel_oeffnen', faelligAm, 'Deckel öffnen');
};

/** Station auf 1. echte Blätter: frühester Eintritt aktiver Pflanzungen + 15; erledigt durch Neuansatz ab Fälligkeit */
export const stationEchteBlaetter: Regel = (k, lage) => {
  if (lage.gefaess?.feste_dosis !== true) return [];
  const hier = new Set(
    k.pflanzen.filter((p) => p.aktiv && p.platzId === lage.platz.id).map((p) => p.pflanzungId),
  );
  const eintritt = kleinster(
    zeilen<PflanzEreignis>(k.teile, 'ereignis_pflanzung')
      .filter(
        (e) =>
          offen(e) &&
          e.typ === 'verschieben' &&
          hier.has(e.pflanzung_id ?? '') &&
          datenVon(e)['nach_platz_id'] === lage.platz.id,
      )
      .map((e) => tag(k, e.gilt_ab)),
  );
  if (eintritt === undefined) return [];
  const faelligAm = tagPlus(eintritt, 15);
  const n = lage.letzterNeuansatz;
  if (n && tag(k, n.begonnen_am) >= faelligAm) return [];
  return amPlatz(lage, 'station_echte_blaetter', faelligAm, 'Station auf 1. echte Blätter');
};

/** Reinigen, freie Löcher abdecken: nach geleert, bis gereinigt oder Erledigt mit dem Schlüssel (A6) */
export const reinigen: Regel = (k, lage) => {
  const geleert = nachZeit(lage.ereignisse.filter((e) => e.typ === 'geleert')).at(-1);
  if (!lage.gefaess || !geleert) return [];
  const faelligAm = tag(k, geleert.gilt_ab);
  const schluessel = aufgabenSchluessel('reinigen', lage.platz.id, faelligAm);
  const erledigt = lage.ereignisse.some(
    (e) =>
      (e.typ === 'gereinigt' && ms(e.gilt_ab) > ms(geleert.gilt_ab)) ||
      (e.typ === 'aufgabe_erledigt' && schluesselVon(e) === schluessel),
  );
  return erledigt ? [] : amPlatz(lage, 'reinigen', faelligAm, 'Reinigen, freie Löcher abdecken');
};

const schluesselVon = (e: EreignisZeile & { aufgabe_schluessel?: string | null }) =>
  e.aufgabe_schluessel ?? datenVon(e)['aufgabe_schluessel'];

/** Reihenfolge = Tabelle R5.2 */
export const ORTSREGELN: readonly Regel[] = [
  gefaessPruefen,
  messen,
  nachfuellenKratky,
  loesungWechseln,
  ansatz,
  kontrolleFolgetag,
  kurzpruefung,
  belueftungPruefen,
  wurzelnPruefen,
  waermePruefen,
  wuerfelFeucht,
  deckelOeffnen,
  stationEchteBlaetter,
  reinigen,
];

/**
 * bei Füllzustand leer entfallen (R5.4, UC8-AK13); Wärme prüfen braucht eine Messung der Lösung, Belüftung prüfen eine
 * Kurzprüfung, die es bei leer nicht gibt (A, Prüfer Runde 1 Befund 6)
 */
const ENTFAELLT_BEI_LEER: ReadonlySet<AufgabenTyp> = new Set<AufgabenTyp>([
  'messen_nachfuellen',
  'messen',
  'nachfuellen_kratky',
  'loesung_wechseln',
  'kontrolle_folgetag',
  'kurzpruefung',
  'belueftung_pruefen',
  'wurzeln_pruefen',
  'waerme_pruefen',
  'station_echte_blaetter',
]);
/** bei Prüfstatus ruht bleiben nur Aufgaben, die keine Pflege sind (R5.4) */
const BLEIBT_BEI_RUHT: ReadonlySet<AufgabenTyp> = new Set<AufgabenTyp>(['gefaess_pruefen', 'reinigen']);

/** alle Ortsaufgaben eines Platzes nach R5.4; Station mit dem Wechsel zusammengelegt (A11) */
export function ortAufgaben(k: Regelkontext, lage: OrtLage): Rohaufgabe[] {
  if (lage.status === 'entfernt') return [];
  const liste = ORTSREGELN.flatMap((r) => r(k, lage)).filter(
    (a) =>
      !(lage.fuellzustand === 'leer' && ENTFAELLT_BEI_LEER.has(a.typ)) &&
      !(lage.status === 'ruht' && !BLEIBT_BEI_RUHT.has(a.typ)),
  );
  const station = liste.find((a) => a.typ === 'station_echte_blaetter');
  const wechsel = liste.find((a) => a.typ === 'loesung_wechseln');
  if (!station || !wechsel) return liste;
  const abstand = tageZwischen(station.faelligAm, wechsel.faelligAm);
  if (abstand < 0 || abstand > 3) return liste;
  return liste
    .filter((a) => a !== station)
    .map((a) => (a === wechsel ? { ...a, hinweis: 'mit 1. echte Blätter' } : a));
}

// ---------------------------------------------------------------- Satz- und Geräteregeln

function termineVon(k: Regelkontext, s: KeimTermin, typ: 'deckel_oeffnen' | 'abdeckung_entfernen'): string[] {
  return saatTermine(
    {
      satzId: s.satzId,
      saatdatum: s.saatdatum,
      boxTyp: 'box_dunkel',
      direktsaat: s.direktsaat,
      ...(s.keimart ? { keimart: s.keimart } : {}),
    },
    s.keimdauer,
    undefined,
    new Date(s.erfasstAm),
    k.zeitzone,
  )
    .termine.filter((t) => t.typ === typ)
    .map((t) => t.faelligAm);
}

/** Keimung prüfen, Abdeckung entfernen, Umsetzen, Reservierung prüfen (Bezug Satz, Ort des Satzes) */
export function satzregeln(k: Regelkontext, orte: ReadonlyMap<string, OrtLage>): Rohaufgabe[] {
  const aufgaben: Rohaufgabe[] = [];
  const ereignisse = zeilen<PflanzEreignis>(k.teile, 'ereignis_pflanzung').filter(offen);
  for (const s of k.keim) {
    const lage = orte.get(s.ortPlatzId);
    if (!lage) continue;
    const wo = amOrt(lage);
    const satz = (typ: AufgabenTyp, faelligAm: string, titel: string, extra?: Parameters<typeof neu>[6]) =>
      aufgaben.push(neu(typ, s.satzId, 'satz', faelligAm, wo, `${titel} · ${s.sorte}`, extra));
    if (s.faelligAm !== undefined)
      satz('keimung_pruefen', s.faelligAm, 'Keimung prüfen', s.maxBis ? { morgenBis: s.maxBis } : {});
    const entfernt = ereignisse.some((e) => e.typ === 'abdeckung_entfernt' && e.satz_id === s.satzId);
    const abdeckung = kleinster(s.geprueft || entfernt ? [] : termineVon(k, s, 'abdeckung_entfernen'));
    if (abdeckung !== undefined) satz('abdeckung_entfernen', abdeckung, 'Abdeckung entfernen');
    if (s.direktsaat) continue;

    const pflanzen = new Map(
      k.pflanzen.filter((p) => p.satzId === s.satzId && p.aktiv).map((p) => [p.pflanzungId, p]),
    );
    const offeneRes = k.reservierungen.filter((r) => {
      const p = pflanzen.get(r.pflanzung_id);
      return p !== undefined && p.netztopfId !== r.netztopf_id;
    });
    const geplant = kleinster(offeneRes.map((r) => r.umsetzen_geplant_am));
    if (geplant === undefined) continue;
    const bis = zeilen<{ art_id: string; umsetzen_bis_d?: number | null; gueltig_bis?: string | null }>(
      k.teile,
      'art',
    ).find((a) => a.art_id === s.artId && (a.gueltig_bis ?? null) === null)?.umsetzen_bis_d;
    const grenze = bis === undefined || bis === null ? undefined : tagPlus(s.saatdatum, Number(bis) + 7);
    satz('umsetzen', geplant, 'Umsetzen', {
      ...(grenze ? { morgenBis: grenze } : {}),
      ...(grenze !== undefined && k.heute >= grenze ? { hinweis: 'Umsetzen überfällig' } : {}),
    });
    if (grenze !== undefined) satz('reservierung_pruefen', grenze, 'Reservierung prüfen');
  }
  return aufgaben;
}

/** Messgerät kalibrieren und pH-Kontrolle: nur für die Datenart echt (8.1 Regel 7, RR14) */
export function geraeteregeln(k: Regelkontext): Rohaufgabe[] {
  const anlage = anlagenAus(k.teile).find((a) => a.datenart === 'echt');
  if (!anlage) return [];
  const wo = { anlageId: anlage.id, datenart: 'echt' as const };
  const kalibrierungen = zeilen<KalibrierZeile>(k.teile, 'kalibrierung')
    .filter(offen)
    .map((z) => ({ ...z, storniert_am: null }));
  const ereignisse = zeilen<GeraeteEreignis>(k.teile, 'ereignis')
    .filter((e) => offen(e) && typeof e.daten === 'object' && e.daten !== null)
    .map((e) => ({ ...e, storniert_am: null }));
  const daten = { kalibrierungen, ereignisse, festeTermine: k.einstellungen.festeKalibriertermine };
  const aufgaben: Rohaufgabe[] = [];
  for (const g of zeilen<{ id: string; storniert_am?: string | null }>(k.teile, 'messgeraet').filter(offen)) {
    const stand = kalibrierStand(daten, { messgeraetId: g.id, datenart: 'echt' }, k.stichtag, k.zeitzone);
    aufgaben.push(
      stand.art === 'erstkalibrierung'
        ? neu('kalibrieren', g.id, 'messgeraet', k.heute, wo, 'Erstkalibrierung')
        : neu('kalibrieren', g.id, 'messgeraet', stand.faelligAm, wo, 'Messgerät kalibrieren'),
    );
    const kontrollen = zeilen<MessungZeile>(k.teile, 'messung')
      .filter(
        (m) => offen(m) && m.messart === 'ph_kontrolle' && m.datenart === 'echt' && m.messgeraet_id === g.id,
      )
      .map((m) => m.gilt_ab);
    const kalibriert = kalibrierungen
      .filter((z) => z.messgeraet_id === g.id && z.datenart === 'echt')
      .map((z) => z.gilt_ab);
    const letzte = [...kontrollen, ...kalibriert]
      .map((iso) => tag(k, iso))
      .sort()
      .at(-1);
    if (letzte === undefined) continue;
    const basis = erfassungOderUebersprungen('ph_kontrolle', g.id, letzte, k.aufschuebe) as string;
    aufgaben.push(neu('ph_kontrolle', g.id, 'messgeraet', tagPlus(basis, 7), wo, 'pH-Kontrolle'));
  }
  return aufgaben;
}

// ---------------------------------------------------------------- Lage und Kontext

/** Lage eines Platzes; undefined für Plätze ohne Aufgaben (Messstelle, Lager, inaktiv, inaktive Anlage) */
export function ortLage(teile: Teile, platzId: string): OrtLage | undefined {
  for (const anlage of anlagenAus(teile)) {
    const platz = plaetzeAus(teile, anlage.id).find((p) => p.id === platzId);
    if (!platz || (platz.rolle !== 'gefaess' && platz.rolle !== 'anzuchtort')) continue;
    const gefaess = platz.rolle === 'gefaess' ? gefaessAm(teile, platz.id) : undefined;
    const anzuchtort = platz.rolle === 'anzuchtort' ? anzuchtortAm(teile, platz.id) : undefined;
    const messungen = nachZeit(
      zeilen<MessungZeile>(teile, 'messung').filter((m) => offen(m) && m.platz_id === platz.id),
    );
    const ansaetze = zeilen<AnsatzZeile>(teile, 'naehrloesungsansatz').filter(
      (a) => offen(a) && a.platz_id === platz.id,
    );
    const neuansaetze = ansaetze
      .filter((a) => a.typ === 'neuansatz' && a.status !== 'abgebrochen')
      .sort((a, b) => ms(a.begonnen_am) - ms(b.begonnen_am));
    const zeile = <T>(name: string) =>
      zeilen<T & { platz_id: string }>(teile, name).find((z) => z.platz_id === platz.id);
    const status = gefaess ? gefaessStatus(teile, gefaess.id) : undefined;
    const letzteMessung = messungen.at(-1);
    const letzterNeuansatz = neuansaetze.at(-1);
    return {
      platz,
      anlage,
      ort: {
        platzId: platz.id,
        code: `${anlage.kuerzel}-${platz.kennung}`,
        kennung: platz.kennung,
        rolle: platz.rolle,
        bereichId: platz.bereich_id ?? null,
      },
      ...(gefaess ? { gefaess } : {}),
      ...(anzuchtort ? { anzuchtort } : {}),
      // ohne Zeile in v_fuellzustand gilt leer: keine Pflegeaufgabe aus Versehen (A16)
      fuellzustand:
        zeile<{ fuellzustand: string }>('v_fuellzustand')?.fuellzustand === 'loesung' ? 'loesung' : 'leer',
      ...(status !== undefined ? { status } : {}),
      messungen,
      ...(letzteMessung ? { letzteMessung } : {}),
      ansaetze,
      ...(letzterNeuansatz ? { letzterNeuansatz } : {}),
      nachfuellsummeL: Number(zeile<{ liter: number | string }>('v_nachfuellsumme')?.liter ?? 0),
      ereignisse: ereignisseAm(teile, platz.id),
    };
  }
  return undefined;
}

/** Pflanzungen mit Platz und Status (v_pflanzung_zustand, sonst Ort des Satzes) */
function pflanzenAus(teile: Teile): PflanzOrt[] {
  const saetze = new Map(
    zeilen<SatzZeile>(teile, 'satz')
      .filter(offen)
      .map((s) => [s.id, s]),
  );
  const zustand = new Map(zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').map((z) => [z.pflanzung_id, z]));
  return zeilen<{ id: string; satz_id: string; storniert_am?: string | null }>(teile, 'pflanzung')
    .filter((p) => offen(p) && saetze.has(p.satz_id))
    .map((p) => {
      const s = saetze.get(p.satz_id) as SatzZeile;
      const z = zustand.get(p.id);
      return {
        pflanzungId: p.id,
        satzId: p.satz_id,
        aktiv: (z?.status ?? 'aktiv') === 'aktiv',
        platzId: z?.platz_id ?? s.anzuchtort_platz_id ?? s.direktsaat_platz_id,
        netztopfId: z?.netztopf_id ?? null,
      };
    });
}

/** offene Abweichungen Pumpe und Luftzone je Platz: letzte Prüfung des Punkts nicht ok, Tag der ersten seit «ok» */
function abweichungenAus(k: Pick<Regelkontext, 'zeitzone'>, lagen: readonly OrtLage[]): Abweichung[] {
  const ergebnis: Abweichung[] = [];
  for (const lage of lagen) {
    if (!lage.gefaess || lage.status === 'entfernt') continue;
    for (const punkt of ['pumpe', 'luftzone']) {
      const folge = nachZeit(
        lage.ereignisse.filter((e) => e.typ === 'kurzpruefung' && datenVon(e)['punkt'] === punkt),
      );
      const ok = folge.findLastIndex((e) => datenVon(e)['ok'] !== false);
      const erste = folge[ok + 1];
      if (!erste) continue;
      ergebnis.push({
        platzId: lage.platz.id,
        anlageId: lage.anlage.id,
        luftpumpe: punkt === 'pumpe' ? (lage.gefaess.luftpumpe ?? null) : null,
        tag: tag(k, erste.gilt_ab),
      });
    }
  }
  return ergebnis;
}

/** alle Rohaufgaben in beliebiger Reihenfolge (aufgaben.ts sortiert und ergänzt den Aufschub) */
export function rohaufgaben(
  teile: Teile,
  einstellungen: AufgabenEinstellungen,
  stichtag: Date,
  zeitzone: Zeitzone,
  aufschuebe: readonly AufschubZeile[],
): Rohaufgabe[] {
  const orte = new Map<string, OrtLage>();
  for (const a of anlagenAus(teile))
    for (const p of plaetzeAus(teile, a.id)) {
      const lage = ortLage(teile, p.id);
      if (lage) orte.set(p.id, lage);
    }
  const lagen = [...orte.values()];
  const k: Regelkontext = {
    teile,
    einstellungen,
    stichtag,
    zeitzone,
    heute: kalendertag(stichtag, zeitzone),
    aufschuebe,
    keim: keimTermine(teile, stichtag, zeitzone),
    pflanzen: pflanzenAus(teile),
    reservierungen: zeilen<ReservierungZeile>(teile, 'v_reservierung_aktiv').filter(offen),
    abweichungen: abweichungenAus({ zeitzone }, lagen),
  };
  return [...geraeteregeln(k), ...satzregeln(k, orte), ...lagen.flatMap((l) => ortAufgaben(k, l))];
}
