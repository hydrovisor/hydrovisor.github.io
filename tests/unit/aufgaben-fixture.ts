// Bündel-Teile für die Aufgaben-Rechnung (Plan 27 Testliste): Vitest (tests/unit/aufgaben-*.test.ts) und der
// Deno-Test supabase/functions/push-taeglich/aufgaben_test.ts importieren diese Datei relativ. Darum reines TypeScript
// ohne vitest-, node:- oder Deno-Abhängigkeit und ohne Import aus src/. Zeilen in der Form von PostgREST (snake_case),
// wie sie das Offline-Bündel liefert. Keine Personendaten (CLAUDE.md Regel 6).
//
// Bausteine: leer() liefert Anlage R (echt) und X (demo) mit Bereichen, Messgerät, Einstellung und Wissen (Sorten
// Lollo Rossa als Lichtkeimer und Koriander als Dunkelkeimer), alle übrigen Teile als leere Listen. Die *Dazu()-
// Funktionen hängen Zeilen an; fertig() rechnet die Sichten v_fuellzustand, v_nachfuellsumme, v_reservierung_aktiv und
// v_pflanzung_zustand wie supabase/migrations/20261103140000_datenmodell.sql nach. v_gefaess_status setzen
// gefaessDazu() und statusSetzen() direkt (die Prüfschritte sind in tests/unit/gefaess-pruefung.test.ts geprüft).
//
// Ereignisse liegen in den Bündelteilen nach Plan 27 (Datei src/daten/buendel.ts):
// - ereignis_platz: gefaess_erfasst, gefaesspruefung, ruhe, entfernt, geleert, kurzpruefung, aufgabe_erledigt,
//   gereinigt, deckel_geoeffnet (mit platz_id);
// - ereignis_pflanzung: keimung, abschluss, verschieben, umsetzen (mit pflanzung_id), abdeckung_entfernt (mit satz_id);
// - ereignis: sonde_gereinigt, als_unsicher_markiert (mit messgeraet_id, daten.datenart).
// Pflanzungen ohne Ortsereignis haben in v_pflanzung_zustand platz_id null: sie stehen am Anzuchtort ihres Satzes bzw.
// im Direktsaat-Gefäss (Kommentar der Sicht v_pflanzung_zustand).
//
// Uhr: Dienstag 12.1.2027 09:00 Zürich (JETZT). zh() rechnet Ortszeit Zürich in UTC um (MEZ bis 28.3.2027 02:00,
// danach MESZ; gilt für die Fixture-Tage November 2026 bis Oktober 2027).

export type Zeile = Record<string, unknown>;
export type Teile = Record<string, Zeile[]>;
export type Betriebsart = 'dwc' | 'konstantpegel' | 'kratky_belueftet' | 'kratky';
export type GefaessStatus = 'in_pruefung' | 'in_betrieb_volumen_offen' | 'in_betrieb' | 'ruht' | 'entfernt';
export type Datenart = 'echt' | 'demo' | 'test';

export const ZONE = 'Europe/Zurich';
export const HEUTE = '2027-01-12';
/** Di 12.1.2027 09:00 Zürich */
export const JETZT = new Date('2027-01-12T08:00:00.000Z');

const o = { storniert_am: null };
const hex = (n: number) => n.toString(16).padStart(12, '0');
function streuwert(text: string): number {
  let s = 7;
  for (const z of text) s = (s * 31 + z.charCodeAt(0)) % 0xffffffffff;
  return s;
}
/** feste UUID je Präfix (zwei Hex-Zeichen) und Text */
export const uid = (praefix: string, text: string) =>
  `${praefix}000000-0000-4000-8000-${hex(streuwert(text))}`;

export const ANLAGE = { R: uid('a0', 'R'), X: uid('a0', 'X') } as const;
export const MESSGERAET = uid('a1', 'M');
export const SORTE = { lollo: uid('a2', 'lollo'), koriander: uid('a2', 'koriander') } as const;
const ART = { lollo: 'salat', koriander: 'koriander' } as const;
const MODELL = uid('a3', 'rako');
const DECKEL = { D1: uid('a4', 'D1'), S5: uid('a4', 'S5') } as const;

/** platz_id zum Code, z. B. platzId('R-1.1') */
export const platzId = (code: string) => uid('c0', code);
/** id der ersten Belegung des Platzes (gefaessDazu); belegungAendern() legt weitere an */
export const gefaessId = (code: string, nr = 1) => uid('c1', `${code}#${nr}`);
export const netztopfId = (topfCode: string) => uid('c3', topfCode);
export const satzId = (nr: number) => uid('d0', `S${nr}`);
export const pflanzungId = (satzNr: number, i: number) => uid('d1', `S${satzNr}P${i}`);

/** ISO in UTC zu Kalendertag 'JJJJ-MM-TT' und Ortszeit 'hh:mm' in Zürich */
export function zh(tag: string, zeit = '09:00'): string {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  const [h, mi] = zeit.split(':').map(Number) as [number, number];
  const lokal = Date.UTC(j, m - 1, d, h, mi);
  const sommer = lokal >= Date.UTC(2027, 2, 28, 3, 0) && lokal < Date.UTC(2027, 9, 31, 3, 0);
  return new Date(lokal - (sommer ? 2 : 1) * 3_600_000).toISOString();
}

/** Stichtag zu Kalendertag und Ortszeit Zürich */
export const jetztAm = (tag: string, zeit = '09:00') => new Date(zh(tag, zeit));

/** Aufgabenschlüssel typ|bezug|faellig_am (R5.1) */
export const schluessel = (typ: string, bezug: string, tag: string) => `${typ}|${bezug}|${tag}`;

const anlageVon = (code: string): 'R' | 'X' => (code.startsWith('X-') ? 'X' : 'R');
const kennungVon = (code: string) => code.slice(2);
const liste = (t: Teile, name: string) => (t[name] ??= []);
const neueId = (t: Teile, praefix: string, name: string) =>
  uid(praefix, `${name}#${liste(t, name).length + 1}`);
const ms = (w: unknown) => (typeof w === 'string' ? Date.parse(w) : Number.NaN);
const offen = (z: Zeile) => (z['storniert_am'] ?? null) === null;
const datenVon = (z: Zeile) => (z['daten'] ?? {}) as Record<string, unknown>;
const groesster = (l: number[]) => (l.length > 0 ? Math.max(...l) : undefined);

/** Anlage R (echt) und X (demo), Bereiche 1 bis 4 in R, Messgerät, Einstellung, Wissen; übrige Teile leer */
export function leer(): Teile {
  const dauer = (sorte: string, min: number, typ: number, max: number) => ({
    sorte_id: sorte,
    phase: 'keimung',
    groesse: 'dauer',
    wert_min: min,
    wert_typ: typ,
    wert_max: max,
    text_wert: null,
  });
  const keimart = (sorte: string, wert: string) => ({
    sorte_id: sorte,
    phase: 'keimung',
    groesse: 'keimart',
    wert_min: null,
    wert_typ: null,
    wert_max: null,
    text_wert: wert,
  });
  return {
    anlage: [
      { id: ANLAGE.R, kuerzel: 'R', name: 'Indoor-Regal', datenart: 'echt', aktiv: true, ...o },
      { id: ANLAGE.X, kuerzel: 'X', name: 'Demo-Regal', datenart: 'demo', aktiv: true, ...o },
    ],
    bereich: [1, 2, 3, 4].map((n) => ({
      id: uid('b0', `R${n}`),
      anlage_id: ANLAGE.R,
      nummer: n,
      name: `Ebene ${n}`,
      ...o,
    })),
    gefaessmodell: [{ id: MODELL, name: 'Rako 40 × 30 × 22', betriebsvolumen_l: 9, ...o }],
    deckeltyp: [
      { id: DECKEL.D1, name: 'D1', topfdurchmesser_mm: 80, loecher_je_reihe: [2, 2], ...o },
      {
        id: DECKEL.S5,
        name: 'S5',
        topfdurchmesser_mm: 50,
        loecher_je_reihe: [1, 2, 1, 2, 1, 2, 1, 2, 1],
        ...o,
      },
    ],
    messgeraet: [{ id: MESSGERAET, modell: 'Aquamaster P160 Pro2', u_ec: 0.05, u_ph: 0.05 }],
    einstellung: [{ id: uid('a5', 'E'), vorlauf_n: 2, feste_kalibriertermine: [], zeitzone: ZONE }],
    sorte: [
      {
        id: uid('a6', 'lollo'),
        sorte_id: SORTE.lollo,
        name: 'Lollo Rossa',
        art_id: ART.lollo,
        gueltig_bis: null,
      },
      {
        id: uid('a6', 'koriander'),
        sorte_id: SORTE.koriander,
        name: 'Koriander',
        art_id: ART.koriander,
        gueltig_bis: null,
      },
    ],
    art: [
      {
        id: uid('a7', 'salat'),
        art_id: ART.lollo,
        name_de: 'Salat',
        umsetzen_ab_d: 14,
        umsetzen_bis_d: 21,
        gueltig_bis: null,
      },
      {
        id: uid('a7', 'koriander'),
        art_id: ART.koriander,
        name_de: 'Koriander',
        umsetzen_ab_d: 21,
        umsetzen_bis_d: 28,
        gueltig_bis: null,
      },
    ],
    v_sollwert: [
      dauer(SORTE.lollo, 2, 4, 7),
      keimart(SORTE.lollo, 'licht'),
      dauer(SORTE.koriander, 3, 5, 10),
      keimart(SORTE.koriander, 'dunkel'),
    ],
    platz: [],
    gefaess: [],
    anzuchtort: [],
    netztopf: [],
    v_gefaess_status: [],
    v_fuellzustand: [],
    v_nachfuellsumme: [],
    satz: [],
    pflanzung: [],
    v_pflanzung_zustand: [],
    v_reservierung_aktiv: [],
    reservierung: [],
    ereignis_pflanzung: [],
    messung: [],
    naehrloesungsansatz: [],
    kalibrierung: [],
    aufschub: [],
    ereignis: [],
    ereignis_platz: [],
  };
}

/** Namen aller Teile, die die Fixture liefert; AUFGABEN_TEILE muss eine Teilmenge davon sein */
export const FIXTURE_TEILE: readonly string[] = Object.keys(leer());

function platzDazu(t: Teile, code: string, rolle: string): string {
  const id = platzId(code);
  const kennung = kennungVon(code);
  const anlage = anlageVon(code);
  const bereich =
    anlage === 'R' && rolle !== 'messstelle'
      ? uid('b0', `R${rolle === 'anzuchtort' ? 4 : Number(kennung.split('.')[0])}`)
      : null;
  liste(t, 'platz').push({
    id,
    client_id: id,
    anlage_id: ANLAGE[anlage],
    bereich_id: bereich,
    kennung,
    rolle,
    aktiv: true,
    ...o,
  });
  return id;
}

export interface GefaessVorgabe {
  /** Code mit Kürzel, z. B. 'R-1.1' oder 'X-1.1' */
  code: string;
  betriebsart: Betriebsart;
  /** Standard 2, bei Kratky 7 */
  intervallMessenD?: number;
  /** Standard 14, bei Kratky null */
  intervallWechselnD?: number | null;
  /** Standard 9 */
  volumenL?: number;
  luftpumpe?: 'P1' | 'P2' | 'P3' | 'P4' | null;
  festeDosis?: boolean;
  naechsterWechselAm?: string | null;
  /** Standard in_betrieb */
  status?: GefaessStatus;
  /** Zeitpunkt von gefaess_erfasst und gueltig_von; Standard 1.12.2026 09:00 Zürich */
  erfasst?: string;
}

/** Platz mit Gefäss, Ereignis gefaess_erfasst und Prüfstatus */
export function gefaessDazu(t: Teile, g: GefaessVorgabe): string {
  const platz = platzDazu(t, g.code, 'gefaess');
  const kratky = g.betriebsart.startsWith('kratky');
  const erfasst = g.erfasst ?? zh('2026-12-01');
  const id = gefaessId(g.code);
  liste(t, 'gefaess').push({
    id,
    client_id: id,
    platz_id: platz,
    gefaessmodell_id: MODELL,
    deckeltyp_id: g.festeDosis ? DECKEL.S5 : DECKEL.D1,
    betriebsart: g.betriebsart,
    feste_dosis: g.festeDosis ?? false,
    luftpumpe: g.luftpumpe ?? null,
    betriebsvolumen_l: g.volumenL ?? 9,
    intervall_messen_d: g.intervallMessenD ?? (kratky ? 7 : 2),
    intervall_nachfuellen_d: kratky ? null : 2,
    intervall_wechseln_d: g.intervallWechselnD === undefined ? (kratky ? null : 14) : g.intervallWechselnD,
    naechster_wechsel_am: g.naechsterWechselAm ?? null,
    gueltig_von: erfasst,
    gueltig_bis: null,
    ...o,
  });
  platzEreignisDazu(t, g.code, 'gefaess_erfasst', erfasst);
  liste(t, 'v_gefaess_status').push({ gefaess_id: id, status: g.status ?? 'in_betrieb' });
  return platz;
}

/** neue Belegung ab `ab` (Plan 21: alte Zeile schliessen, neue mit den Änderungen anlegen; Status bleibt) */
export function belegungAendern(
  t: Teile,
  code: string,
  aenderung: { intervallWechselnD?: number; intervallMessenD?: number; naechsterWechselAm?: string | null },
  ab: string,
): string {
  const gefaesse = liste(t, 'gefaess').filter((g) => g['platz_id'] === platzId(code));
  const alt = gefaesse.find((g) => g['gueltig_bis'] === null);
  if (!alt) throw new Error(`keine aktive Belegung in ${code}`);
  alt['gueltig_bis'] = ab;
  const id = gefaessId(code, gefaesse.length + 1);
  const neu: Zeile = { ...alt, id, client_id: id, gueltig_von: ab, gueltig_bis: null };
  if (aenderung.intervallWechselnD !== undefined) neu['intervall_wechseln_d'] = aenderung.intervallWechselnD;
  if (aenderung.intervallMessenD !== undefined) neu['intervall_messen_d'] = aenderung.intervallMessenD;
  if (aenderung.naechsterWechselAm !== undefined) neu['naechster_wechsel_am'] = aenderung.naechsterWechselAm;
  liste(t, 'gefaess').push(neu);
  for (const s of liste(t, 'v_gefaess_status')) if (s['gefaess_id'] === alt['id']) s['gefaess_id'] = id;
  return id;
}

/** Prüfstatus der aktiven Belegung setzen (v_gefaess_status) */
export function statusSetzen(t: Teile, code: string, status: GefaessStatus): void {
  const g = liste(t, 'gefaess').find((z) => z['platz_id'] === platzId(code) && z['gueltig_bis'] === null);
  for (const s of liste(t, 'v_gefaess_status')) if (s['gefaess_id'] === g?.['id']) s['status'] = status;
}

export function platzInaktiv(t: Teile, code: string): void {
  for (const p of liste(t, 'platz')) if (p['id'] === platzId(code)) p['aktiv'] = false;
}

/** Anzuchtbox (Licht- oder Dunkelkeimer) */
export function boxDazu(t: Teile, code: string, typ: 'box_licht' | 'box_dunkel'): string {
  const platz = platzDazu(t, code, 'anzuchtort');
  liste(t, 'anzuchtort').push({
    id: uid('c2', code),
    platz_id: platz,
    typ,
    platzzahl: 25,
    position: 'vorne',
    ...o,
  });
  return platz;
}

export function messstelleDazu(t: Teile, code = 'R-W'): string {
  return platzDazu(t, code, 'messstelle');
}

/** Ansatz am Platz; erfasst (Zeitpunkt der Erfassung, Standard = begonnen) setzt client_zeit und erfasst_am */
export function ansatzDazu(
  t: Teile,
  code: string,
  a: {
    begonnen: string;
    typ?: 'neuansatz' | 'nachfuellen' | 'teilwechsel' | 'ph_korrektur';
    erfasst?: string;
    status?: 'laufend' | 'abgeschlossen' | 'abgebrochen';
    nachgefuelltL?: number;
  },
): string {
  const id = neueId(t, 'e2', 'naehrloesungsansatz');
  liste(t, 'naehrloesungsansatz').push({
    id,
    client_id: id,
    platz_id: platzId(code),
    typ: a.typ ?? 'neuansatz',
    status: a.status ?? 'abgeschlossen',
    begonnen_am: a.begonnen,
    volumen_l: 9,
    nachgefuellt_l: a.nachgefuelltL ?? null,
    gilt_ab: a.begonnen,
    client_zeit: a.erfasst ?? a.begonnen,
    erfasst_am: a.erfasst ?? a.begonnen,
    ...o,
  });
  return id;
}

/** Messung am Platz */
export function messungDazu(
  t: Teile,
  code: string,
  m: {
    gilt: string;
    temperatur?: number;
    fuellstand?: 'ueber_drittel' | 'unter_drittel' | null;
    ausserhalb?: boolean;
    messart?: string;
  },
): string {
  const id = neueId(t, 'e1', 'messung');
  liste(t, 'messung').push({
    id,
    client_id: id,
    platz_id: platzId(code),
    messgeraet_id: MESSGERAET,
    messart: m.messart ?? 'rundgang',
    ph: 6.0,
    ec: 1.2,
    temperatur: m.temperatur ?? 20.0,
    fuellstand: m.fuellstand ?? null,
    bewertung_ph: 'gruen',
    bewertung_ec: m.ausserhalb ? 'ausserhalb' : 'gruen',
    bewertung_temp: 'gruen',
    schnappschuss: {},
    datenart: null,
    gilt_ab: m.gilt,
    ...o,
  });
  return id;
}

/** pH-Kontrolle am Messgerät (Messung ohne Platz mit Datenart, RR14) */
export function phKontrolleDazu(t: Teile, gilt: string, datenart: Datenart = 'echt'): string {
  const id = neueId(t, 'e1', 'messung');
  liste(t, 'messung').push({
    id,
    client_id: id,
    platz_id: null,
    messgeraet_id: MESSGERAET,
    messart: 'ph_kontrolle',
    ph: 7.0,
    ec: null,
    temperatur: null,
    fuellstand: null,
    schnappschuss: {},
    datenart,
    gilt_ab: gilt,
    ...o,
  });
  return id;
}

export function kalibrierungDazu(t: Teile, gilt: string, datenart: Datenart = 'echt'): string {
  const id = neueId(t, 'e3', 'kalibrierung');
  liste(t, 'kalibrierung').push({
    id,
    client_id: id,
    messgeraet_id: MESSGERAET,
    datenart,
    gilt_ab: gilt,
    ...o,
  });
  return id;
}

/** Geräte-Ereignis (Teil ereignis), z. B. sonde_gereinigt */
export function geraetEreignisDazu(
  t: Teile,
  typ: 'sonde_gereinigt' | 'als_unsicher_markiert',
  gilt: string,
  datenart: Datenart = 'echt',
): string {
  const id = neueId(t, 'e0', 'ereignis');
  liste(t, 'ereignis').push({
    id,
    client_id: id,
    typ,
    platz_id: null,
    messgeraet_id: MESSGERAET,
    daten: { datenart },
    gilt_ab: gilt,
    ...o,
  });
  return id;
}

/** Ereignis am Platz (Teil ereignis_platz) */
export function platzEreignisDazu(
  t: Teile,
  code: string,
  typ: string,
  gilt: string,
  daten: Record<string, unknown> = {},
  extra: Zeile = {},
): string {
  const id = neueId(t, 'e5', 'ereignis_platz');
  liste(t, 'ereignis_platz').push({
    id,
    client_id: id,
    typ,
    platz_id: platzId(code),
    satz_id: null,
    pflanzung_id: null,
    daten,
    gilt_ab: gilt,
    ...extra,
    ...o,
  });
  return id;
}

/** ein Punkt der Kurzprüfung am Platz */
export function kurzpruefungDazu(
  t: Teile,
  code: string,
  gilt: string,
  punkt: 'pumpe' | 'luftzone' | 'loesung_topfboden' | 'wurzeln' | 'licht' | 'luefter' | 'wuerfel_feucht',
  ok = true,
): string {
  return platzEreignisDazu(t, code, 'kurzpruefung', gilt, { punkt, ok, ausnahmen: [] });
}

/** «Erledigt» aus einer Aufgabe am Platz (aufgabe_erledigt mit Schlüssel) */
export function erledigtDazu(t: Teile, code: string, aufgabeSchluessel: string, gilt: string): string {
  return platzEreignisDazu(
    t,
    code,
    'aufgabe_erledigt',
    gilt,
    { aufgabe_schluessel: aufgabeSchluessel },
    { aufgabe_schluessel: aufgabeSchluessel, war_faellig_am: aufgabeSchluessel.split('|')[2] ?? null },
  );
}

/** Ereignis an einer Pflanzung oder am Satz (Teil ereignis_pflanzung) */
export function pflanzEreignisDazu(
  t: Teile,
  e: { typ: string; pflanzungId?: string; satzId?: string; daten?: Record<string, unknown>; gilt: string },
): string {
  const id = neueId(t, 'e6', 'ereignis_pflanzung');
  liste(t, 'ereignis_pflanzung').push({
    id,
    client_id: id,
    typ: e.typ,
    platz_id: null,
    satz_id: e.satzId ?? null,
    pflanzung_id: e.pflanzungId ?? null,
    netztopf_id: null,
    daten: e.daten ?? {},
    gilt_ab: e.gilt,
    ...o,
  });
  return id;
}

export interface SatzVorgabe {
  nr: number;
  sorte: 'lollo' | 'koriander';
  /** Code der Anzuchtbox, z. B. 'R-A1' */
  box?: string;
  /** Code des Direktsaat-Gefässes */
  direktsaat?: string;
  /** Saatdatum 'JJJJ-MM-TT'; gilt_ab = Saattag 09:00 Zürich */
  saat: string;
  /** Erfassungszeitpunkt (client_zeit, erfasst_am); Standard = gilt_ab */
  erfasst?: string;
  /** Standard 2 */
  schwaemme?: number;
}

/** Satz mit Pflanzungen (Schwämmen); gibt die Pflanzungs-IDs zurück */
export function satzDazu(t: Teile, s: SatzVorgabe): string[] {
  const id = satzId(s.nr);
  const gilt = zh(s.saat);
  liste(t, 'satz').push({
    id,
    client_id: id,
    sorte_id: SORTE[s.sorte],
    saatgut_id: null,
    kulturform: 'kopf',
    anzuchtort_platz_id: s.direktsaat ? null : platzId(s.box ?? 'R-A1'),
    direktsaat_platz_id: s.direktsaat ? platzId(s.direktsaat) : null,
    anzahl_schwaemme: s.schwaemme ?? 2,
    samen_je_schwamm: 2,
    saatdatum: s.saat,
    gilt_ab: gilt,
    client_zeit: s.erfasst ?? gilt,
    erfasst_am: s.erfasst ?? gilt,
    ...o,
  });
  const ids = Array.from({ length: s.schwaemme ?? 2 }, (_, i) => pflanzungId(s.nr, i + 1));
  for (const p of ids) liste(t, 'pflanzung').push({ id: p, client_id: p, satz_id: id, gilt_ab: gilt, ...o });
  return ids;
}

/** Keimprüfung eines Schwamms (2 Samen gesät) */
export function keimungDazu(t: Teile, pflanzung: string, gekeimt: number, gilt: string): string {
  return pflanzEreignisDazu(t, {
    typ: 'keimung',
    pflanzungId: pflanzung,
    daten: { samen_gesaet: 2, samen_gekeimt: gekeimt, keimtemp_eingehalten: true },
    gilt,
  });
}

/** Ortswechsel einer Pflanzung ohne Netztopf (z. B. Stationseintritt aus der Box) */
export function verschiebenDazu(
  t: Teile,
  pflanzung: string,
  nachCode: string,
  gilt: string,
  loch = 1,
): string {
  return pflanzEreignisDazu(t, {
    typ: 'verschieben',
    pflanzungId: pflanzung,
    daten: { von_platz_id: null, von_loch_nr: null, nach_platz_id: platzId(nachCode), nach_loch_nr: loch },
    gilt,
  });
}

/** Netztopf mit Heimplatz: topfCode 'R-1.2.1' gehört zu 'R-1.2', Loch 1 */
export function netztopfDazu(t: Teile, topfCode: string): string {
  const id = netztopfId(topfCode);
  const teile = topfCode.split('.');
  const heim = teile.slice(0, -1).join('.');
  liste(t, 'netztopf').push({
    id,
    client_id: id,
    anlage_id: ANLAGE[anlageVon(topfCode)],
    kennung: kennungVon(topfCode),
    groesse_mm: 80,
    heim_platz_id: platzId(heim),
    heim_loch_nr: Number(teile.at(-1)),
    aktiv: true,
    ...o,
  });
  return id;
}

/** Reservierung einer Pflanzung auf einen Netztopf (Tabelle reservierung; v_reservierung_aktiv rechnet fertig()) */
export function reservierungDazu(
  t: Teile,
  pflanzung: string,
  topfCode: string,
  geplant: string,
  gilt = zh('2026-12-20'),
): string {
  const id = neueId(t, 'd2', 'reservierung');
  liste(t, 'reservierung').push({
    id,
    client_id: id,
    pflanzung_id: pflanzung,
    netztopf_id: netztopfId(topfCode),
    umsetzen_vorgabe_am: geplant,
    umsetzen_geplant_am: geplant,
    gilt_ab: gilt,
    ...o,
  });
  return id;
}

/** Umsetzen in den Netztopf (beendet die Reservierung) */
export function umsetzenDazu(t: Teile, pflanzung: string, topfCode: string, gilt: string): string {
  const heim = topfCode.split('.').slice(0, -1).join('.');
  const id = pflanzEreignisDazu(t, {
    typ: 'umsetzen',
    pflanzungId: pflanzung,
    daten: {
      von_platz_id: null,
      von_loch_nr: null,
      nach_platz_id: platzId(heim),
      nach_loch_nr: Number(topfCode.split('.').at(-1)),
    },
    gilt,
  });
  const e = liste(t, 'ereignis_pflanzung').find((z) => z['id'] === id);
  if (e) e['netztopf_id'] = netztopfId(topfCode);
  return id;
}

/** Morgen, Überspringen oder Pegel ok zu einem Aufgabenschlüssel */
export function aufschubDazu(
  t: Teile,
  a: {
    schluessel: string;
    art: 'morgen' | 'ueberspringen' | 'pegel_ok';
    gesetztAm: string;
    datenart?: Datenart;
    storniert?: boolean;
  },
): string {
  const id = neueId(t, 'e4', 'aufschub');
  liste(t, 'aufschub').push({
    id,
    client_id: id,
    aufgabe_schluessel: a.schluessel,
    art: a.art,
    datenart: a.datenart ?? 'echt',
    gesetzt_am: a.gesetztAm,
    gilt_ab: zh(a.gesetztAm, '10:00'),
    storniert_am: a.storniert ? zh(a.gesetztAm, '10:05') : null,
  });
  return id;
}

/** Sichten v_fuellzustand, v_nachfuellsumme, v_reservierung_aktiv, v_pflanzung_zustand nachrechnen; gibt t zurück */
export function fertig(t: Teile): Teile {
  const ansaetze = liste(t, 'naehrloesungsansatz').filter(offen);
  const platzEreignisse = liste(t, 'ereignis_platz').filter(offen);
  const gefaesse = liste(t, 'gefaess').filter(offen);
  const neuansatzSeit = (platz: unknown) =>
    groesster(
      ansaetze
        .filter((a) => a['platz_id'] === platz && a['typ'] === 'neuansatz' && a['status'] !== 'abgebrochen')
        .map((a) => ms(a['begonnen_am'])),
    );
  const plaetze = liste(t, 'platz').filter((p) => p['rolle'] === 'gefaess');

  t['v_fuellzustand'] = plaetze.map((p) => {
    const letzter = neuansatzSeit(p['id']);
    const am = (typ: string) =>
      platzEreignisse
        .filter((e) => e['platz_id'] === p['id'] && e['typ'] === typ)
        .map((e) => ms(e['gilt_ab']));
    const leerEv = groesster([...am('geleert'), ...am('gefaess_erfasst'), ...am('entfernt')]);
    const entferntAm = groesster(am('entfernt'));
    const belegungen = gefaesse
      .filter((g) => g['platz_id'] === p['id'])
      .map((g) => ms(g['gueltig_von']))
      .filter((v) => !Number.isNaN(v) && (entferntAm === undefined || v > entferntAm));
    const ersteBelegung = belegungen.length > 0 ? Math.min(...belegungen) : undefined;
    const leerSeit = groesster([leerEv, ersteBelegung].filter((v): v is number => v !== undefined));
    const loesung = letzter !== undefined && (leerSeit === undefined || letzter > leerSeit);
    return {
      platz_id: p['id'],
      fuellzustand: loesung ? 'loesung' : 'leer',
      letzter_ansatz: letzter === undefined ? null : new Date(letzter).toISOString(),
    };
  });

  t['v_nachfuellsumme'] = plaetze.map((p) => {
    const seit = neuansatzSeit(p['id']);
    const liter =
      seit === undefined
        ? 0
        : ansaetze
            .filter(
              (a) => a['platz_id'] === p['id'] && a['typ'] === 'nachfuellen' && ms(a['begonnen_am']) > seit,
            )
            .reduce((s, a) => s + Number(a['nachgefuellt_l'] ?? 0), 0);
    return { platz_id: p['id'], liter };
  });

  const pflanzEreignisse = liste(t, 'ereignis_pflanzung').filter(offen);
  const an = (pflanzung: unknown) => pflanzEreignisse.filter((e) => e['pflanzung_id'] === pflanzung);
  t['v_reservierung_aktiv'] = liste(t, 'reservierung')
    .filter(offen)
    .filter(
      (r) =>
        !an(r['pflanzung_id']).some(
          (e) =>
            ms(e['gilt_ab']) >= ms(r['gilt_ab']) &&
            (e['typ'] === 'umsetzen' ||
              (e['typ'] === 'abschluss' &&
                ['keimt_nicht', 'ausfall'].includes(String(datenVon(e)['grund'])))),
        ),
    )
    .map((r) => ({ ...r }));

  const juengstes = (l: Zeile[]) => [...l].sort((a, b) => ms(b['gilt_ab']) - ms(a['gilt_ab']))[0];
  t['v_pflanzung_zustand'] = liste(t, 'pflanzung')
    .filter(offen)
    .map((pf) => {
      const eigene = an(pf['id']);
      const ort = juengstes(
        eigene.filter((e) => ['verschieben', 'umsetzen', 'tausch'].includes(String(e['typ']))),
      );
      const ab = juengstes(eigene.filter((e) => e['typ'] === 'abschluss'));
      return {
        pflanzung_id: pf['id'],
        satz_id: pf['satz_id'],
        phase: 'keimung',
        phase_seit: null,
        status: ab ? String(datenVon(ab)['grund']) : 'aktiv',
        netztopf_id: ort ? (ort['netztopf_id'] ?? null) : null,
        platz_id: ort ? (datenVon(ort)['nach_platz_id'] ?? null) : null,
        loch_nr: ort ? (datenVon(ort)['nach_loch_nr'] ?? null) : null,
      };
    });
  return t;
}

/** Kopie der Teile ohne die genannten Teile (älteres Bündel, TO6) */
export function ohne(t: Teile, ...namen: string[]): Teile {
  return Object.fromEntries(Object.entries(structuredClone(t)).filter(([n]) => !namen.includes(n)));
}

/** Aufgaben eines Typs (und Bezugs) aus einer Liste; strukturell, damit die Fixture src/ nicht importiert */
export function von<T extends { typ: string; bezug: string }>(
  l: readonly T[],
  typ: string,
  bezug?: string,
): T[] {
  return l.filter((a) => a.typ === typ && (bezug === undefined || a.bezug === bezug));
}

/**
 * Grundstand für UC8-AK10 und die Push-Vorbereitung (Plan 27 Testliste), Stichtag JETZT (Di 12.1.2027 09:00):
 * Anlage R (echt):
 * - Messgerät: Kalibrierung 1.1. (fällig 31.1.), pH-Kontrolle 5.1. → pH-Kontrolle fällig 12.1.
 * - A1 Lichtkeimer: Satz 1 Lollo Rossa (Saat 22.12.2026, gekeimt) mit Reservierungen auf 1.2.1 und 1.2.2, geplant
 *   12.1. → Würfel feucht, Umsetzen 12.1. (Saat + 21 + 7 = 19.1.: Reservierung prüfen später, kein «überfällig»);
 *   Satz 2 Lollo Rossa (Saat 20.12.2026, gekeimt) seit 28.12.2026 auf der Station 4.4, ohne Reservierung.
 * - A3 Dunkelkeimer: Satz 3 Koriander (Saat 9.1., Keimdauer 3/5/10) → Würfel feucht, Deckel öffnen 12.1.
 * - 1.1 DWC (P1): Neuansatz 2.1., Messungen 3.1. und 10.1., Kurzprüfung Wurzeln 8.1. → Messen und nachfüllen 12.1.,
 *   Kurzprüfung 12.1.; Wechsel 16.1., Wurzeln 15.1.
 * - 1.2 DWC leer mit den Töpfen 1.2.1 und 1.2.2 (Reservierungen aus Satz 1) → Ansatz für Umsetzen 12.1.
 * - 2.1 Konstantpegel (P2) mit naechster_wechsel_am 12.1., Neuansatz 2.1., Messung 11.1. mit 24.5 °C, Kurzprüfung heute
 *   (Pumpe ok) → Lösung wechseln 12.1., Wurzeln prüfen 9.1. (Neuansatz + 7), Wärme prüfen 12.1.; Messen 13.1.
 * - 2.2 DWC in Prüfung seit 8.1., leer → Gefäss prüfen 8.1.
 * - 3.1 Kratky belüftet (P3): Neuansatz 28.12.2026, Messung 5.1. über ⅓, Kurzprüfung heute, Wurzeln 7.1. → Messen 12.1.
 * - 3.3 Kratky ohne Pumpe: Neuansatz 28.12.2026, Messung heute 08:00 unter ⅓, Kurzprüfung Wurzeln 10.1. →
 *   Nachfüllen Kratky 12.1., Kurzprüfung 12.1.; Messen 19.1.
 * - 4.4 Station (feste Dosis, P4): Neuansatz 2.1. (Wechsel 16.1.), Nachfüllen 8.1. 1.0 l von 2.3 l, Messung 11.1.,
 *   Kurzprüfung heute, Wurzeln 11.1., Stationseintritt Satz 2 am 28.12.2026 → Station auf 1. echte Blätter 12.1.
 * - W Messstelle: keine Aufgabe.
 * Anlage X (demo): X-1.1 DWC mit Neuansatz 2.1., Messung 9.1., Kurzprüfung Wurzeln 10.1. → Messen und nachfüllen 11.1.,
 * Kurzprüfung 12.1.
 */
export function grundstand(): Teile {
  const t = leer();
  kalibrierungDazu(t, zh('2027-01-01'));
  phKontrolleDazu(t, zh('2027-01-05'));

  boxDazu(t, 'R-A1', 'box_licht');
  boxDazu(t, 'R-A3', 'box_dunkel');
  gefaessDazu(t, { code: 'R-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  gefaessDazu(t, { code: 'R-1.2', betriebsart: 'dwc', luftpumpe: 'P1' });
  gefaessDazu(t, {
    code: 'R-2.1',
    betriebsart: 'konstantpegel',
    luftpumpe: 'P2',
    volumenL: 3,
    naechsterWechselAm: '2027-01-12',
  });
  gefaessDazu(t, {
    code: 'R-2.2',
    betriebsart: 'dwc',
    luftpumpe: 'P2',
    status: 'in_pruefung',
    erfasst: zh('2027-01-08', '11:00'),
  });
  gefaessDazu(t, { code: 'R-3.1', betriebsart: 'kratky_belueftet', luftpumpe: 'P3' });
  gefaessDazu(t, { code: 'R-3.3', betriebsart: 'kratky' });
  gefaessDazu(t, {
    code: 'R-4.4',
    betriebsart: 'konstantpegel',
    luftpumpe: 'P4',
    festeDosis: true,
    volumenL: 2.3,
  });
  messstelleDazu(t, 'R-W');

  // 1.1
  ansatzDazu(t, 'R-1.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'R-1.1', { gilt: zh('2027-01-03'), messart: 'kontrolle_folgetag' });
  messungDazu(t, 'R-1.1', { gilt: zh('2027-01-10') });
  kurzpruefungDazu(t, 'R-1.1', zh('2027-01-08'), 'wurzeln');
  // 1.2 leer mit Töpfen
  netztopfDazu(t, 'R-1.2.1');
  netztopfDazu(t, 'R-1.2.2');
  // 2.1
  ansatzDazu(t, 'R-2.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'R-2.1', { gilt: zh('2027-01-11'), temperatur: 24.5 });
  kurzpruefungDazu(t, 'R-2.1', zh('2027-01-12', '08:30'), 'pumpe');
  // 3.1
  ansatzDazu(t, 'R-3.1', { begonnen: zh('2026-12-28') });
  messungDazu(t, 'R-3.1', { gilt: zh('2027-01-05'), temperatur: 19.0, fuellstand: 'ueber_drittel' });
  kurzpruefungDazu(t, 'R-3.1', zh('2027-01-07'), 'wurzeln');
  kurzpruefungDazu(t, 'R-3.1', zh('2027-01-12', '08:30'), 'pumpe');
  // 3.3
  ansatzDazu(t, 'R-3.3', { begonnen: zh('2026-12-28') });
  messungDazu(t, 'R-3.3', { gilt: zh('2027-01-12', '08:00'), temperatur: 18.0, fuellstand: 'unter_drittel' });
  kurzpruefungDazu(t, 'R-3.3', zh('2027-01-10'), 'wurzeln');
  // 4.4 Station
  ansatzDazu(t, 'R-4.4', { begonnen: zh('2027-01-02') });
  ansatzDazu(t, 'R-4.4', { begonnen: zh('2027-01-08'), typ: 'nachfuellen', nachgefuelltL: 1.0 });
  messungDazu(t, 'R-4.4', { gilt: zh('2027-01-11'), temperatur: 21.0 });
  kurzpruefungDazu(t, 'R-4.4', zh('2027-01-11'), 'wurzeln');
  kurzpruefungDazu(t, 'R-4.4', zh('2027-01-12', '08:30'), 'pumpe');

  // Satz 1 in A1 mit Reservierungen auf 1.2
  const s1 = satzDazu(t, { nr: 1, sorte: 'lollo', box: 'R-A1', saat: '2026-12-22' });
  s1.forEach((p, i) => {
    keimungDazu(t, p, 2, zh('2026-12-26'));
    reservierungDazu(t, p, `R-1.2.${i + 1}`, '2027-01-12');
  });
  // Satz 2 aus A1 auf der Station 4.4
  const s2 = satzDazu(t, { nr: 2, sorte: 'lollo', box: 'R-A1', saat: '2026-12-20' });
  s2.forEach((p, i) => {
    keimungDazu(t, p, 2, zh('2026-12-24'));
    verschiebenDazu(t, p, 'R-4.4', zh('2026-12-28'), i + 1);
  });
  // Satz 3 Koriander in A3
  satzDazu(t, { nr: 3, sorte: 'koriander', box: 'R-A3', saat: '2027-01-09' });

  // Anlage X (demo)
  gefaessDazu(t, { code: 'X-1.1', betriebsart: 'dwc', luftpumpe: 'P1' });
  ansatzDazu(t, 'X-1.1', { begonnen: zh('2027-01-02') });
  messungDazu(t, 'X-1.1', { gilt: zh('2027-01-09') });
  kurzpruefungDazu(t, 'X-1.1', zh('2027-01-10'), 'wurzeln');
  return fertig(t);
}

const p = platzId;
/** fällige Aufgaben des Grundstands am 12.1.2027 in der Reihenfolge von faelligeAufgaben() */
export const ERWARTETE_SCHLUESSEL: readonly string[] = [
  schluessel('ph_kontrolle', MESSGERAET, '2027-01-12'),
  schluessel('wuerfel_feucht', p('R-A1'), '2027-01-12'),
  schluessel('umsetzen', satzId(1), '2027-01-12'),
  schluessel('wuerfel_feucht', p('R-A3'), '2027-01-12'),
  schluessel('deckel_oeffnen', p('R-A3'), '2027-01-12'),
  schluessel('messen_nachfuellen', p('R-1.1'), '2027-01-12'),
  schluessel('kurzpruefung', p('R-1.1'), '2027-01-12'),
  schluessel('ansatz', p('R-1.2'), '2027-01-12'),
  schluessel('loesung_wechseln', p('R-2.1'), '2027-01-12'),
  schluessel('wurzeln_pruefen', p('R-2.1'), '2027-01-09'),
  schluessel('waerme_pruefen', p('R-2.1'), '2027-01-12'),
  schluessel('gefaess_pruefen', p('R-2.2'), '2027-01-08'),
  schluessel('messen', p('R-3.1'), '2027-01-12'),
  schluessel('nachfuellen_kratky', p('R-3.3'), '2027-01-12'),
  schluessel('kurzpruefung', p('R-3.3'), '2027-01-12'),
  schluessel('station_echte_blaetter', p('R-4.4'), '2027-01-12'),
  schluessel('messen_nachfuellen', p('X-1.1'), '2027-01-11'),
  schluessel('kurzpruefung', p('X-1.1'), '2027-01-12'),
];
