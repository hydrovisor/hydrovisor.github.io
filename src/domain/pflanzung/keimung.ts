// Keimung prüfen (UC6, R1.7, R6.1, R8.1, R8.2, R12.2; Plan 24): Ansicht eines Satzes mit seinen Schwämmen,
// Eingabeprüfung, Zusammenfassung, Vorgang (keimung, abschluss keimt_nicht, Stationseintritt), Wiederherstellen und
// Keimaufgaben für Heute. Rein: jetzt und Zeitzone als Parameter (G1, G2). Ereignisse liest die Domäne aus dem
// Bündelteil ereignis_pflanzung und filtert selbst nach typ und Storno; frühere Reservierungen (auch beendete) aus dem
// Bündelteil reservierung, aktive aus v_reservierung_aktiv.
import { wiederherstellbar } from '../anlage/entfernen.ts';
import { kuerzelVon, ms, nachKennung, zeilen, type Teile } from '../anlage/teile.ts';
import {
  stationenAus,
  stationsGroesse,
  stationsHoechstzahl,
  stationsVorbelegung,
  type Groesse,
} from '../anzucht/kapazitaet.ts';
import { keimPruefTermin } from '../anzucht/termine.ts';
import { keimbilanz, keimrateGeglaettet } from '../saatmenge/saatmenge.ts';
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import { kalendertag, tagPlus, tageZwischen, type Zeitzone } from '../zeit.ts';

export interface Schwamm {
  /** 1 bis m, nur in der Maske: zuerst mit Zieltopf nach Topfkennung, dann nach id (A1) */
  nr: number;
  pflanzungId: string;
  samen: number;
  zieltopf?: { netztopfId: string; kennung: string };
  zustand: 'offen' | 'erledigt' | 'keimt_nicht';
  gekeimt?: number;
  station?: { platzId: string; kennung: string; lochNr: number };
  abschluss?: { ereignisId: string; tag: string; wiederherstellbar: boolean };
}

export interface KeimAnsicht {
  satzId: string;
  sorte: string;
  kulturform: string;
  ort: { platzId: string; kennung: string; code: string; direktsaat: boolean };
  saatdatum: string;
  tagSeitSaat: number;
  keimdauer: { min?: number; typ?: number; max?: number };
  keimtemp?: string;
  datenart: 'echt' | 'demo' | 'test';
  schwaemme: Schwamm[];
  hinweise: string[];
}

export interface KeimEingabe {
  satzId: string;
  keimtempEingehalten: boolean | undefined;
  werte: { pflanzungId: string; gekeimt: number | 'offen' }[];
  station: { pflanzungId: string; platzId: string; lochNr: number }[];
}

export const HINWEIS_NICHT_ECHT = 'Keimrate zählt nur in echten Anlagen';
export const HINWEIS_UEBER_MAX = 'Keimdauer überschritten: offene Schwämme eintragen';

interface SatzZeile {
  id: string;
  sorte_id: string;
  saatgut_id: string | null;
  kulturform: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  samen_je_schwamm: number;
  saatdatum: string;
  gilt_ab: string;
  client_zeit?: string | null;
  erfasst_am?: string | null;
  storniert_am: string | null;
}
interface PflanzungZeile {
  id: string;
  satz_id: string;
  storniert_am?: string | null;
}
interface ZustandZeile {
  pflanzung_id: string;
  satz_id: string;
  phase?: string | null;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
  loch_nr: number | null;
}
interface ReservierungZeile {
  id: string;
  client_id?: string | null;
  pflanzung_id: string;
  netztopf_id: string;
  gilt_ab: string;
  storniert_am?: string | null;
}
interface EreignisZeile {
  id: string;
  typ: string;
  pflanzung_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am?: string | null;
}
interface PlatzZeile {
  id: string;
  anlage_id: string;
  kennung: string;
}
interface SollwertZeile {
  sorte_id: string;
  phase: string;
  groesse: string;
  wert_min: number | string | null;
  wert_typ: number | string | null;
  wert_max: number | string | null;
}

const offen = (z: { storniert_am?: string | null }) => (z.storniert_am ?? null) === null;
const zahl = (w: number | string | null | undefined) =>
  w === null || w === undefined ? undefined : Number(w);
const datenVon = (e: EreignisZeile) => e.daten ?? {};
const juengste = <T extends { gilt_ab: string }>(l: readonly T[]) =>
  l.reduce<T | undefined>((a, e) => (!a || ms(e.gilt_ab) >= ms(a.gilt_ab) ? e : a), undefined);

/** Alles, was die Funktionen dieses Moduls über einen Satz wissen müssen */
interface Lage {
  satz: SatzZeile;
  sorte: string;
  artId: string;
  ort: KeimAnsicht['ort'];
  anlageId: string;
  datenart: KeimAnsicht['datenart'];
  keimdauer: KeimAnsicht['keimdauer'];
  keimtemp?: string;
  schwaemme: Schwamm[];
  /** Kalendertag der letzten Keimprüfung des Satzes */
  letztePruefung?: string;
  /** Zeitpunkt der letzten Keimprüfung des Satzes */
  letztePruefungAm?: string;
  /** aktive Reservierungen des Satzes vor dieser Prüfung (Z, A7) */
  reservierungen: number;
  groesse: Groesse;
  /** schon auf einer Station stehende aktive Schwämme */
  aufStation: number;
  /** jüngste nicht stornierte Reservierung je Pflanzung aus der Tabelle (auch beendete) */
  reservierungVon: Map<string, ReservierungZeile>;
}

function spanne(z: SollwertZeile | undefined): KeimAnsicht['keimdauer'] {
  const s: KeimAnsicht['keimdauer'] = {};
  const min = zahl(z?.wert_min);
  const typ = zahl(z?.wert_typ);
  const max = zahl(z?.wert_max);
  if (min !== undefined) s.min = min;
  if (typ !== undefined) s.typ = typ;
  if (max !== undefined) s.max = max;
  return s;
}

function lageVon(teile: Teile, satzId: string, jetzt: Date, zeitzone: Zeitzone): Lage | undefined {
  const satz = zeilen<SatzZeile>(teile, 'satz').find((s) => s.id === satzId && offen(s));
  if (!satz) return undefined;
  const ortId = satz.anzuchtort_platz_id ?? satz.direktsaat_platz_id;
  const platz = zeilen<PlatzZeile & { storniert_am?: string | null }>(teile, 'platz').find(
    (p) => p.id === ortId,
  );
  if (!platz) return undefined;
  const anlage = zeilen<{ id: string; datenart: KeimAnsicht['datenart'] }>(teile, 'anlage').find(
    (a) => a.id === platz.anlage_id,
  );
  const sorteZeile = zeilen<{ sorte_id: string; name: string; art_id: string; gueltig_bis?: string | null }>(
    teile,
    'sorte',
  ).find((s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null);
  const sollwert = (groesse: string) =>
    zeilen<SollwertZeile>(teile, 'v_sollwert').find(
      (s) => s.sorte_id === satz.sorte_id && s.phase === 'keimung' && s.groesse === groesse,
    );
  const keimdauer = spanne(sollwert('dauer'));
  const temp = spanne(sollwert('keimtemp'));
  const keimtemp =
    temp.min !== undefined && temp.max !== undefined
      ? `${temp.min}–${temp.max} °C`
      : temp.typ !== undefined
        ? `${temp.typ} °C`
        : undefined;

  const pflanzungen = zeilen<PflanzungZeile>(teile, 'pflanzung')
    .filter((p) => p.satz_id === satzId && offen(p))
    .map((p) => p.id);
  const imSatz = new Set(pflanzungen);
  const zustand = new Map(
    zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand')
      .filter((z) => imSatz.has(z.pflanzung_id))
      .map((z) => [z.pflanzung_id, z]),
  );
  const ereignisse = zeilen<EreignisZeile>(teile, 'ereignis_pflanzung').filter(
    (e) => offen(e) && e.pflanzung_id !== null && imSatz.has(e.pflanzung_id),
  );
  const wieder = new Set(
    ereignisse.filter((e) => e.typ === 'wiederherstellen').map((e) => String(datenVon(e)['ereignis_id'])),
  );
  const aktiveRes = new Map(
    zeilen<ReservierungZeile>(teile, 'v_reservierung_aktiv')
      .filter((r) => imSatz.has(r.pflanzung_id))
      .map((r) => [r.pflanzung_id, r]),
  );
  const tabelle = teile?.['reservierung']
    ? zeilen<ReservierungZeile>(teile, 'reservierung').filter((r) => offen(r) && imSatz.has(r.pflanzung_id))
    : [...aktiveRes.values()];
  const reservierungVon = new Map<string, ReservierungZeile>();
  for (const p of pflanzungen) {
    const r = juengste(tabelle.filter((x) => x.pflanzung_id === p));
    if (r) reservierungVon.set(p, r);
  }
  const toepfe = new Map(
    zeilen<{ id: string; kennung: string }>(teile, 'netztopf').map((n) => [n.id, n.kennung]),
  );
  const topf = (r: ReservierungZeile | undefined) =>
    r ? { netztopfId: r.netztopf_id, kennung: toepfe.get(r.netztopf_id) ?? '' } : undefined;
  const stationen = stationenAus(teile, platz.anlage_id);
  const kennungen = new Map(zeilen<PlatzZeile>(teile, 'platz').map((p) => [p.id, p.kennung]));

  const roh = pflanzungen.map((id) => {
    const z = zustand.get(id);
    const status = z?.status ?? 'aktiv';
    const eigene = ereignisse.filter((e) => e.pflanzung_id === id);
    const keimung = juengste(eigene.filter((e) => e.typ === 'keimung'));
    const gekeimt = keimung ? Number(datenVon(keimung)['samen_gekeimt']) : undefined;
    const station =
      z?.platz_id && stationen.has(z.platz_id)
        ? { platzId: z.platz_id, kennung: kennungen.get(z.platz_id) ?? '', lochNr: Number(z.loch_nr) }
        : undefined;
    const aktiv = topf(aktiveRes.get(id));
    const frueher = topf(reservierungVon.get(id));
    const s: Omit<Schwamm, 'nr'> & { ordnung?: string } = {
      pflanzungId: id,
      samen: Number(satz.samen_je_schwamm),
      zustand: 'erledigt',
      ...(aktiv || frueher ? { ordnung: (aktiv ?? frueher)?.kennung ?? '' } : {}),
    };
    if (status === 'keimt_nicht') {
      s.zustand = 'keimt_nicht';
      s.gekeimt = gekeimt ?? 0;
      if (frueher) s.zieltopf = frueher;
      const ab = juengste(
        eigene.filter(
          (e) => e.typ === 'abschluss' && datenVon(e)['grund'] === 'keimt_nicht' && !wieder.has(e.id),
        ),
      );
      if (ab)
        s.abschluss = {
          ereignisId: ab.id,
          tag: kalendertag(new Date(ab.gilt_ab), zeitzone),
          wiederherstellbar: wiederherstellbar(ab.gilt_ab, jetzt, zeitzone),
        };
    } else {
      if (aktiv) s.zieltopf = aktiv;
      const inKeimung = (z?.phase ?? 'keimung') === 'keimung';
      if (status === 'aktiv' && inKeimung && (gekeimt === undefined || gekeimt === 0)) s.zustand = 'offen';
      else if (gekeimt !== undefined) s.gekeimt = gekeimt;
      // nur aktive Schwämme stehen auf einem Stationsplatz (wie freieStationsloecher(), Runde 1 Befund 5)
      if (station && status === 'aktiv') s.station = station;
    }
    return s;
  });
  const mit = roh
    .filter((s) => s.ordnung !== undefined)
    .sort(
      (a, b) =>
        nachKennung({ kennung: a.ordnung ?? '' }, { kennung: b.ordnung ?? '' }) ||
        a.pflanzungId.localeCompare(b.pflanzungId),
    );
  const ohne = roh
    .filter((s) => s.ordnung === undefined)
    .sort((a, b) => a.pflanzungId.localeCompare(b.pflanzungId));
  const schwaemme: Schwamm[] = [...mit, ...ohne].map((s, i) => {
    const { ordnung, ...rest } = s;
    void ordnung;
    return { nr: i + 1, ...rest };
  });

  const letzte = juengste(ereignisse.filter((e) => e.typ === 'keimung'));
  const artId = sorteZeile?.art_id ?? '';
  return {
    satz,
    sorte: sorteZeile?.name ?? 'Sorte',
    artId,
    ort: {
      platzId: platz.id,
      kennung: platz.kennung,
      code: `${kuerzelVon(teile, platz.anlage_id)}-${platz.kennung}`,
      direktsaat: satz.anzuchtort_platz_id === null,
    },
    anlageId: platz.anlage_id,
    datenart: anlage?.datenart ?? 'echt',
    keimdauer,
    ...(keimtemp ? { keimtemp } : {}),
    schwaemme,
    ...(letzte
      ? { letztePruefung: kalendertag(new Date(letzte.gilt_ab), zeitzone), letztePruefungAm: letzte.gilt_ab }
      : {}),
    reservierungen: aktiveRes.size,
    groesse: stationsGroesse(artId),
    aufStation: schwaemme.filter((s) => s.zustand !== 'keimt_nicht' && s.station).length,
    reservierungVon,
  };
}

function terminVon(lage: Lage, zeitzone: Zeitzone) {
  const erfasst = lage.satz.client_zeit ?? lage.satz.erfasst_am ?? lage.satz.gilt_ab;
  return keimPruefTermin(
    {
      satzId: lage.satz.id,
      saatdatum: lage.satz.saatdatum,
      keimdauer: lage.keimdauer,
      erfasstAm: new Date(erfasst),
      ...(lage.letztePruefung ? { letztePruefung: lage.letztePruefung } : {}),
      offen: lage.schwaemme.filter((s) => s.zustand === 'offen').length,
    },
    zeitzone,
  );
}

/** Ansicht eines Satzes für «Keimung prüfen»; unbekannter Satz → undefined */
export function keimAnsicht(
  teile: Teile,
  satzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): KeimAnsicht | undefined {
  const lage = lageVon(teile, satzId, jetzt, zeitzone);
  if (!lage) return undefined;
  const hinweise: string[] = [];
  if (lage.datenart !== 'echt') hinweise.push(HINWEIS_NICHT_ECHT);
  if (terminVon(lage, zeitzone).grund === 'ueber_max') hinweise.push(HINWEIS_UEBER_MAX);
  // A9: nach dem Wiederherstellen steht die Keimung mit 0, bis Tim neu einträgt
  for (const s of lage.schwaemme)
    if (s.zustand === 'offen' && wiederhergestellt(teile, s.pflanzungId))
      hinweise.push(`Trag die gekeimten Samen für Schwamm ${s.nr} neu ein`);
  return {
    satzId: lage.satz.id,
    sorte: lage.sorte,
    kulturform: lage.satz.kulturform,
    ort: lage.ort,
    saatdatum: lage.satz.saatdatum,
    tagSeitSaat: tageZwischen(lage.satz.saatdatum, kalendertag(jetzt, zeitzone)),
    keimdauer: lage.keimdauer,
    ...(lage.keimtemp ? { keimtemp: lage.keimtemp } : {}),
    datenart: lage.datenart,
    schwaemme: lage.schwaemme,
    hinweise,
  };
}

/** Pflanzung mit einem Wiederherstellen (offen wegen der Keimung mit 0, A9) */
function wiederhergestellt(teile: Teile, pflanzungId: string): boolean {
  return zeilen<EreignisZeile>(teile, 'ereignis_pflanzung').some(
    (e) => offen(e) && e.pflanzung_id === pflanzungId && e.typ === 'wiederherstellen',
  );
}

/** gekeimte Schwämme ohne Stationsplatz nach dieser Eingabe, in Schwammfolge */
function gekeimtOhneStation(lage: Lage, eingabe: KeimEingabe) {
  const werte = new Map(eingabe.werte.map((w) => [w.pflanzungId, w.gekeimt]));
  return lage.schwaemme.filter((s) => {
    const w = werte.get(s.pflanzungId);
    if (s.zustand === 'offen') return typeof w === 'number' && w > 0;
    return s.zustand === 'erledigt' && !s.station && (s.gekeimt ?? 0) > 0;
  });
}

/** Verstösse der Eingabe; leer = gültig. station [] ist gültig (die gekeimten Schwämme bleiben in der Box) */
export function keimEingabePruefen(
  teile: Teile,
  eingabe: KeimEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): Verstoss[] {
  const lage = lageVon(teile, eingabe.satzId, jetzt, zeitzone);
  if (!lage) return [{ feld: 'satz', grund: 'Satz nicht bekannt' }];
  const v: Verstoss[] = [];
  const mitWert = eingabe.werte.filter((w) => w.gekeimt !== 'offen');
  // ein reiner Stationsschritt (gekeimte Schwämme später stellen) braucht weder Wert noch Keimtemperatur (Runde 1 Befund 1)
  if (mitWert.length > 0 && eingabe.keimtempEingehalten === undefined)
    v.push({ feld: 'keimtemp_eingehalten', grund: 'Keimtemperatur eingehalten: Ja oder Nein wählen' });
  if (mitWert.length === 0 && eingabe.station.length === 0)
    v.push({ feld: 'samen_gekeimt', grund: 'Mindestens einen Schwamm eintragen' });
  const gesehen = new Set<string>();
  for (const w of eingabe.werte) {
    const s = lage.schwaemme.find((x) => x.pflanzungId === w.pflanzungId);
    if (gesehen.has(w.pflanzungId)) v.push({ feld: 'samen_gekeimt', grund: 'Schwamm doppelt eingetragen' });
    gesehen.add(w.pflanzungId);
    if (!s) {
      v.push({ feld: 'pflanzung_id', grund: 'Schwamm gehört nicht zu diesem Satz' });
      continue;
    }
    if (w.gekeimt === 'offen') continue;
    if (s.zustand !== 'offen')
      v.push({ feld: 'samen_gekeimt', grund: `Schwamm ${s.nr} ist schon eingetragen` });
    if (!Number.isInteger(w.gekeimt) || w.gekeimt < 0 || w.gekeimt > s.samen)
      v.push({ feld: 'samen_gekeimt', grund: `Schwamm ${s.nr}: 0 bis ${s.samen} Samen` });
  }

  if (eingabe.station.length === 0) return v;
  if (lage.ort.direktsaat) {
    v.push({ feld: 'station', grund: 'Direktsaat hat keinen Stationsschritt' });
    return v;
  }
  const stationen = stationenAus(teile, lage.anlageId);
  const kandidaten = new Set(gekeimtOhneStation(lage, eingabe).map((s) => s.pflanzungId));
  const belegt = new Set(
    zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand')
      .filter((z) => z.status === 'aktiv' && z.platz_id !== null)
      .map((z) => `${z.platz_id}|${Number(z.loch_nr)}`),
  );
  const loecher = new Set<string>();
  const pflanzen = new Set<string>();
  for (const st of eingabe.station) {
    const s = lage.schwaemme.find((x) => x.pflanzungId === st.pflanzungId);
    const wo = s ? `Schwamm ${s.nr}` : 'Schwamm';
    const station = stationen.get(st.platzId);
    const schluessel = `${st.platzId}|${st.lochNr}`;
    if (!kandidaten.has(st.pflanzungId))
      v.push({ feld: 'station', grund: `${wo}: nur gekeimte Schwämme ohne Stationsplatz` });
    if (pflanzen.has(st.pflanzungId)) v.push({ feld: 'station', grund: `${wo}: zweimal gestellt` });
    pflanzen.add(st.pflanzungId);
    if (!station) v.push({ feld: 'station', grund: `${wo}: kein Stationsplatz` });
    else if (station.groesse !== lage.groesse)
      v.push({ feld: 'station', grund: `${wo}: Station mit ${station.groesse / 10} cm passt nicht` });
    else if (!Number.isInteger(st.lochNr) || st.lochNr < 1 || st.lochNr > station.loecher)
      v.push({ feld: 'station', grund: `${wo}: Loch ${st.lochNr} gibt es nicht` });
    else if (belegt.has(schluessel))
      v.push({ feld: 'station', grund: `${wo}: Loch ${st.lochNr} ist belegt` });
    if (loecher.has(schluessel)) v.push({ feld: 'station', grund: `Loch ${st.lochNr} doppelt vergeben` });
    loecher.add(schluessel);
  }
  const hoechst = stationsHoechstzahl(lage.groesse, lage.reservierungen);
  if (lage.aufStation + pflanzen.size > hoechst)
    v.push({ feld: 'station', grund: `Höchstens ${hoechst} Schwämme auf die Station` });
  return v;
}

/** Vorbelegung der Stationsplätze für die gekeimten Schwämme dieser Eingabe; Direktsaat → undefined */
export function keimStationsvorschlag(
  teile: Teile,
  eingabe: KeimEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): (ReturnType<typeof stationsVorbelegung> & { groesse: Groesse }) | undefined {
  const lage = lageVon(teile, eingabe.satzId, jetzt, zeitzone);
  if (!lage || lage.ort.direktsaat) return undefined;
  const gekeimt = gekeimtOhneStation(lage, eingabe).map((s) => ({
    pflanzungId: s.pflanzungId,
    mitZieltopf: !!s.zieltopf,
  }));
  return {
    ...stationsVorbelegung(
      teile,
      {
        anlageId: lage.anlageId,
        artId: lage.artId,
        zieltoepfe: lage.reservierungen,
        schonAufStation: lage.aufStation,
        gekeimt,
      },
      kalendertag(jetzt, zeitzone),
    ),
    groesse: lage.groesse,
  };
}

const mehrzahl = (n: number, eins: string, mehr: string) => `${n} ${n === 1 ? eins : mehr}`;

/** Zusammenfassung der Eingabe («9 von 12 Samen (75 %) · 1 Schwamm keimt nicht · Zieltopf 2.3.5 wird frei») */
export function keimZusammenfassung(
  teile: Teile,
  eingabe: KeimEingabe,
): {
  gesaet: number;
  gekeimt: number;
  anteil: number | undefined;
  keimtNicht: number;
  freieZieltoepfe: string[];
  offen: number;
  nachsaeen: string[];
  text: string;
} {
  // die Ansicht hängt hier nicht von der Uhr ab (Wiederherstellfrist bleibt ungenutzt)
  const lage = lageVon(teile, eingabe.satzId, new Date(0), 'UTC');
  const schwaemme = lage?.schwaemme ?? [];
  const werte = new Map(eingabe.werte.map((w) => [w.pflanzungId, w.gekeimt]));
  const eingetragen = schwaemme.filter(
    (s) => s.zustand === 'offen' && typeof werte.get(s.pflanzungId) === 'number',
  );
  const gesaet = eingetragen.reduce((a, s) => a + s.samen, 0);
  const gekeimt = eingetragen.reduce((a, s) => a + Number(werte.get(s.pflanzungId)), 0);
  const null0 = eingetragen.filter((s) => werte.get(s.pflanzungId) === 0);
  const freieZieltoepfe = null0.filter((s) => s.zieltopf).map((s) => s.zieltopf?.kennung ?? '');
  const offenBleiben = schwaemme.filter(
    (s) => s.zustand === 'offen' && typeof werte.get(s.pflanzungId) !== 'number',
  ).length;
  const nachsaeen: string[] = [];
  if (lage?.ort.direktsaat) {
    const lochVon = new Map(
      zeilen<{ netztopf_id: string; loch_nr: number | null }>(teile, 'v_netztopf_platz').map((n) => [
        n.netztopf_id,
        n.loch_nr,
      ]),
    );
    const loecher = null0
      .map((s) => (s.zieltopf ? lochVon.get(s.zieltopf.netztopfId) : undefined))
      .filter((l): l is number => l !== undefined && l !== null)
      .map(Number)
      .sort((a, b) => a - b);
    if (loecher.length > 0)
      nachsaeen.push(
        `Nachsäen in ${lage.ort.kennung}: ${loecher.length === 1 ? 'Loch' : 'Löcher'} ${loecher.join(', ')}`,
      );
  }
  const anteil = gesaet > 0 ? gekeimt / gesaet : undefined;
  const teileText = [
    `${gekeimt} von ${gesaet} Samen${anteil === undefined ? '' : ` (${Math.round(anteil * 100)} %)`}`,
    null0.length > 0
      ? null0.length === 1
        ? '1 Schwamm keimt nicht'
        : `${null0.length} Schwämme keimen nicht`
      : '',
    freieZieltoepfe.length > 0
      ? freieZieltoepfe.length === 1
        ? `Zieltopf ${freieZieltoepfe[0]} wird frei`
        : `Zieltöpfe ${freieZieltoepfe.join(', ')} werden frei`
      : '',
    offenBleiben > 0 ? `${mehrzahl(offenBleiben, 'Schwamm', 'Schwämme')} offen` : '',
  ].filter(Boolean);
  return {
    gesaet,
    gekeimt,
    anteil,
    keimtNicht: null0.length,
    freieZieltoepfe,
    offen: offenBleiben,
    nachsaeen,
    text: teileText.join(' · '),
  };
}

const neu = (id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle: 'ereignis',
  felder: { client_id: id, id, ...felder },
});

/**
 * Ein Vorgang (04 4.1): je eingetragenem Schwamm in Schwammfolge keimung, bei 0 gleich danach abschluss keimt_nicht;
 * danach je Stationsplatz verschieben (Stationseintritt aus der Box, ohne Netztopf, A8). id = client_id aus ids(),
 * gilt_ab = jetzt. Bei Verstössen leer.
 */
export function keimVorgang(
  teile: Teile,
  eingabe: KeimEingabe,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  if (keimEingabePruefen(teile, eingabe, jetzt, zeitzone).length > 0) return [];
  const lage = lageVon(teile, eingabe.satzId, jetzt, zeitzone);
  if (!lage) return [];
  const giltAb = jetzt.toISOString();
  const werte = new Map(eingabe.werte.map((w) => [w.pflanzungId, w.gekeimt]));
  // R12.2: Kalendertag der letzten Keimprüfung des Satzes vor dieser (A5)
  const vorher =
    lage.letztePruefungAm && ms(lage.letztePruefungAm) <= jetzt.getTime() ? lage.letztePruefung : undefined;
  const schritte: Schritt[] = [];
  for (const s of lage.schwaemme) {
    const w = werte.get(s.pflanzungId);
    if (typeof w !== 'number') continue;
    schritte.push(
      neu(ids(), {
        typ: 'keimung',
        pflanzung_id: s.pflanzungId,
        gilt_ab: giltAb,
        daten: {
          samen_gesaet: s.samen,
          samen_gekeimt: w,
          keimtemp_eingehalten: eingabe.keimtempEingehalten === true,
          ...(vorher ? { vorherige_pruefung_am: vorher } : {}),
        },
      }),
    );
    if (w === 0)
      schritte.push(
        neu(ids(), {
          typ: 'abschluss',
          pflanzung_id: s.pflanzungId,
          gilt_ab: giltAb,
          daten: { grund: 'keimt_nicht' },
        }),
      );
  }
  for (const st of eingabe.station) {
    // Konzept 8.1 Regel 10: Tomate, Chili und Basilikum (8 cm) gehen mit ihrem Zieltopf auf die Station, dessen
    // Heimplatz im Zielgefäss bleibt (Runde 1 Befund 2)
    const topf =
      lage.groesse === 80
        ? lage.schwaemme.find((x) => x.pflanzungId === st.pflanzungId)?.zieltopf
        : undefined;
    schritte.push(
      neu(ids(), {
        typ: 'verschieben',
        pflanzung_id: st.pflanzungId,
        ...(topf ? { netztopf_id: topf.netztopfId } : {}),
        gilt_ab: giltAb,
        daten: { von_platz_id: lage.ort.platzId, nach_platz_id: st.platzId, nach_loch_nr: st.lochNr },
      }),
    );
  }
  return schritte;
}

/**
 * Ist der Topf inzwischen an eine andere Pflanzung vergeben (aktive Reservierung oder aktive Pflanzung im Topf)? Dann
 * darf die alte Reservierung beim Wiederherstellen nicht wieder aufleben (R8.2; Plan 38 aus wiederherstellenVorgang()
 * herausgelöst).
 */
export function reservierungVergeben(teile: Teile, pflanzungId: string, netztopfId: string): boolean {
  return (
    zeilen<ReservierungZeile>(teile, 'v_reservierung_aktiv').some(
      (r) => r.netztopf_id === netztopfId && r.pflanzung_id !== pflanzungId,
    ) ||
    zeilen<ZustandZeile>(teile, 'v_pflanzung_zustand').some(
      (z) => z.status === 'aktiv' && z.netztopf_id === netztopfId && z.pflanzung_id !== pflanzungId,
    )
  );
}

/**
 * Wiederherstellen eines Schwamms mit «keimt nicht» bis und mit 7. Kalendertag (Konzept 6.3, R1.7): wiederherstellen
 * {ereignis_id: Abschluss}. Ist der frühere Zieltopf inzwischen vergeben, storniert derselbe Vorgang die alte
 * Reservierung (korrektur), damit nie zwei aktive Reservierungen auf einem Topf stehen (R8.2). Nicht erlaubt → leer.
 */
export function wiederherstellenVorgang(
  teile: Teile,
  pflanzungId: string,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { vorgang: Vorgang; hinweis?: string } {
  const satzId = zeilen<PflanzungZeile>(teile, 'pflanzung').find((p) => p.id === pflanzungId)?.satz_id;
  const lage = satzId ? lageVon(teile, satzId, jetzt, zeitzone) : undefined;
  const s = lage?.schwaemme.find((x) => x.pflanzungId === pflanzungId);
  if (!lage || !s || s.zustand !== 'keimt_nicht' || !s.abschluss?.wiederherstellbar) return { vorgang: [] };
  const schritte: Schritt[] = [];
  let hinweis: string | undefined;
  const res = lage.reservierungVon.get(pflanzungId);
  if (res) {
    if (reservierungVergeben(teile, pflanzungId, res.netztopf_id)) {
      schritte.push({
        art: 'storno',
        tabelle: 'reservierung',
        clientId: res.client_id ?? res.id,
        grund: 'korrektur',
      });
      hinweis = `Zieltopf ${s.zieltopf?.kennung ?? ''} inzwischen vergeben: Schwamm ${s.nr} ohne Zieltopf`;
    }
  }
  schritte.push(
    neu(ids(), {
      typ: 'wiederherstellen',
      pflanzung_id: pflanzungId,
      gilt_ab: jetzt.toISOString(),
      daten: { ereignis_id: s.abschluss.ereignisId },
    }),
  );
  return { vorgang: schritte, ...(hinweis ? { hinweis } : {}) };
}

/** Keimaufgaben für Heute: fällig bis heute, alle Anlagen mit Kürzel (A13); nach Fälligkeit, dann Ort */
export function keimAufgaben(
  teile: Teile,
  jetzt: Date,
  zeitzone: Zeitzone,
): { satzId: string; text: string; ort: string; faelligAm: string }[] {
  const heute = kalendertag(jetzt, zeitzone);
  const aufgaben: { satzId: string; text: string; ort: string; faelligAm: string }[] = [];
  for (const satz of zeilen<SatzZeile>(teile, 'satz').filter(offen)) {
    const lage = lageVon(teile, satz.id, jetzt, zeitzone);
    if (!lage) continue;
    const termin = terminVon(lage, zeitzone);
    if (termin.faelligAm === undefined || termin.faelligAm > heute) continue;
    aufgaben.push({
      satzId: satz.id,
      text: `Keimung prüfen · ${lage.sorte}`,
      ort: lage.ort.code,
      faelligAm: termin.faelligAm,
    });
  }
  return aufgaben.sort((a, b) => a.faelligAm.localeCompare(b.faelligAm) || a.ort.localeCompare(b.ort));
}

/** Termine eines Satzes für die Aufgaben-Rechnung (Plan 27): auch künftige, mit Grenze für «Morgen» */
export interface KeimTermin {
  satzId: string;
  sorte: string;
  artId: string;
  /** Anzuchtort oder Direktsaat-Gefäss */
  ortPlatzId: string;
  direktsaat: boolean;
  anlageId: string;
  datenart: KeimAnsicht['datenart'];
  saatdatum: string;
  /** Zeitpunkt der Erfassung (client_zeit, erfasst_am, gilt_ab) */
  erfasstAm: string;
  keimdauer: KeimAnsicht['keimdauer'];
  /** v_sollwert keimart ('licht', 'dunkel') */
  keimart?: string;
  /** mindestens eine Keimprüfung erfasst */
  geprueft: boolean;
  /** Keimung prüfen fällig am (keimPruefTermin); ohne offene Schwämme oder nach max undefined */
  faelligAm?: string;
  /** Saat + Keimdauer max: letzter Tag für «Morgen» bei Keimung prüfen */
  maxBis?: string;
}

/** alle nicht stornierten Sätze mit ihren Keimterminen (ohne Filter auf heute) */
export function keimTermine(teile: Teile, jetzt: Date, zeitzone: Zeitzone): KeimTermin[] {
  const termine: KeimTermin[] = [];
  for (const satz of zeilen<SatzZeile>(teile, 'satz').filter(offen)) {
    const lage = lageVon(teile, satz.id, jetzt, zeitzone);
    if (!lage) continue;
    const termin = terminVon(lage, zeitzone);
    const keimart = zeilen<SollwertZeile & { text_wert?: string | null }>(teile, 'v_sollwert').find(
      (s) => s.sorte_id === satz.sorte_id && s.phase === 'keimung' && s.groesse === 'keimart',
    )?.text_wert;
    termine.push({
      satzId: satz.id,
      sorte: lage.sorte,
      artId: lage.artId,
      ortPlatzId: lage.ort.platzId,
      direktsaat: lage.ort.direktsaat,
      anlageId: lage.anlageId,
      datenart: lage.datenart,
      saatdatum: satz.saatdatum,
      erfasstAm: satz.client_zeit ?? satz.erfasst_am ?? satz.gilt_ab,
      keimdauer: lage.keimdauer,
      ...(keimart ? { keimart } : {}),
      geprueft: lage.letztePruefung !== undefined,
      ...(termin.faelligAm !== undefined ? { faelligAm: termin.faelligAm } : {}),
      ...(lage.keimdauer.max !== undefined ? { maxBis: tagPlus(satz.saatdatum, lage.keimdauer.max) } : {}),
    });
  }
  return termine;
}

/** Knopf «Keimung prüfen»: offene Schwämme, oder in einer Box gekeimte ohne Stationsplatz, solange Platz erlaubt ist */
export function keimungOffen(teile: Teile, satzId: string, jetzt: Date, zeitzone: Zeitzone): boolean {
  const lage = lageVon(teile, satzId, jetzt, zeitzone);
  if (!lage) return false;
  if (lage.schwaemme.some((s) => s.zustand === 'offen')) return true;
  if (lage.ort.direktsaat) return false;
  const ungestellt = lage.schwaemme.filter(
    (s) => s.zustand === 'erledigt' && !s.station && (s.gekeimt ?? 0) > 0,
  );
  return ungestellt.length > 0 && lage.aufStation < stationsHoechstzahl(lage.groesse, lage.reservierungen);
}

/**
 * Keimrate der Packung des Satzes nach der Prüfung (R12.2, A6): Bilanz wie v_keimrate mit den neuen Schritten,
 * geglättet mit der Packungsangabe, sonst dem Standard der Art. Ohne Packung oder ausserhalb echter Anlagen undefined.
 */
export function packungsrate(
  teile: Teile,
  satzId: string,
  neu?: Vorgang,
): (ReturnType<typeof keimrateGeglaettet> & { gesaet: number; gekeimt: number }) | undefined {
  const satz = zeilen<SatzZeile>(teile, 'satz').find((s) => s.id === satzId && offen(s));
  if (!satz?.saatgut_id) return undefined;
  const packung = zeilen<{ id: string; sorte_id: string; keimfaehigkeit_packung: number | string | null }>(
    teile,
    'saatgut',
  ).find((p) => p.id === satz.saatgut_id);
  if (!packung) return undefined;
  const artId = zeilen<{ sorte_id: string; art_id: string; gueltig_bis?: string | null }>(
    teile,
    'sorte',
  ).find((s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null)?.art_id;
  const art = zeilen<{
    art_id: string;
    standard_keimfaehigkeit?: number | string | null;
    gueltig_bis?: string | null;
  }>(teile, 'art').find((a) => a.art_id === artId && (a.gueltig_bis ?? null) === null);
  const bilanz = keimbilanz(teile, satz.saatgut_id, neu);
  return {
    ...keimrateGeglaettet({
      ...bilanz,
      pPackung: zahl(packung.keimfaehigkeit_packung) ?? null,
      pArt: zahl(art?.standard_keimfaehigkeit) ?? null,
    }),
    ...bilanz,
  };
}
