// Endzustand einer Pflanzung, Wiederherstellen, Überlagerung nach dem Speichern und Verlauf (Plan 38; R1.7, R2.2,
// Konzept 6.3, UC6-AK5, A1, A11, A15, A16). Rein: jetzt und Zeitzone als Parameter (G1, G2). Ereignisse kommen aus den
// Bündelteilen ereignis_pflanzung und ereignis_satz; die Domäne filtert Typ und Storno selbst.
//
// zielbereichZeile() ist ein Spiegel der Sicht v_zielbereich (Zweck «Bewertung»), damit der Zielbereich nach dem
// Speichern ohne neues Bündel stimmt (A1); wird in `zielbereich` überführt (I2-02, I2-04).
import { wiederherstellbar } from '../anlage/entfernen.ts';
import { kuerzelVon, ms, zeilen, type Teile } from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import { kulturEntscheide } from '../pflanzung/belegung.ts';
import { reservierungVergeben, wiederherstellenVorgang } from '../pflanzung/keimung.ts';
import { kalendertag, tagKurz, type Zeitzone } from '../zeit.ts';
import { phasenVerlauf } from './fragen.ts';

type Zeile = Record<string, unknown>;

export type EndGrund = 'geerntet' | 'ausfall' | 'keimt_nicht' | 'ueberzaehlig';

export interface Endzustand {
  grund: EndGrund;
  ereignisId: string;
  tag: string;
  wiederherstellbar: boolean;
  /** Sperrtext, wenn eine andere aktive Pflanzung im Loch steht (A11) */
  gesperrt?: string;
  /** Ursache bei Ausfall (abschluss.text) */
  text?: string;
}

export interface ZielbereichZeile {
  platz_id: string;
  ph_min: number | null;
  ph_max: number | null;
  ec_min: number | null;
  ec_max: number | null;
  temp_min: number | null;
  temp_max: number | null;
  zaehlende_pflanzungen: number;
}

interface Ereignis {
  id: string;
  client_id?: string | null;
  typ: string;
  pflanzung_id: string | null;
  satz_id?: string | null;
  netztopf_id?: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  client_zeit?: string | null;
  erfasst_am?: string | null;
  storniert_am?: string | null;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  phase?: string | null;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
  loch_nr: number | string | null;
}
interface Reservierung {
  id: string;
  client_id?: string | null;
  pflanzung_id: string;
  netztopf_id: string;
  gilt_ab: string;
  storniert_am?: string | null;
}

const offen = (z: { storniert_am?: string | null }) => (z.storniert_am ?? null) === null;
const datenVon = (e: { daten?: Record<string, unknown> | null }) => e.daten ?? {};
const istEnde = (e: Ereignis) => e.typ === 'abschluss' || (e.typ === 'ernte' && datenVon(e)['art'] === 'ab');
/** Reihenfolge bei gleichem gilt_ab: erfasst_am bzw. client_zeit, dann id (A16) */
const spaeter = (a: Ereignis, b: Ereignis) =>
  ms(a.gilt_ab) - ms(b.gilt_ab) ||
  ms(a.erfasst_am ?? a.client_zeit) - ms(b.erfasst_am ?? b.client_zeit) ||
  a.id.localeCompare(b.id);

/** gültige Ereignisse einer Pflanzung, älteste zuerst */
function ereignisseVon(teile: Teile, pflanzungId: string): Ereignis[] {
  return zeilen<Ereignis>(teile, 'ereignis_pflanzung')
    .filter((e) => offen(e) && e.pflanzung_id === pflanzungId)
    .sort(spaeter);
}

const zustandVon = (teile: Teile, pflanzungId: string) =>
  zeilen<Zustand>(teile, 'v_pflanzung_zustand').find((z) => z.pflanzung_id === pflanzungId);

/** jüngstes Ende (abschluss oder ernte ab) ohne wiederherstellen, wie v_pflanzung_zustand */
function juengstesEnde(ereignisse: readonly Ereignis[]): Ereignis | undefined {
  const wieder = new Set(
    ereignisse.filter((e) => e.typ === 'wiederherstellen').map((e) => String(datenVon(e)['ereignis_id'])),
  );
  return ereignisse.filter((e) => istEnde(e) && !wieder.has(e.id)).at(-1);
}

const grundVon = (e: Ereignis): EndGrund =>
  e.typ === 'ernte' ? 'geerntet' : (String(datenVon(e)['grund']) as EndGrund);

/** Endzustand einer beendeten Pflanzung; undefined, solange sie aktiv ist (R1.7, Konzept 6.3) */
export function endzustand(
  teile: Teile,
  pflanzungId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Endzustand | undefined {
  const z = zustandVon(teile, pflanzungId);
  if (!z || z.status === 'aktiv') return undefined;
  const e = juengstesEnde(ereignisseVon(teile, pflanzungId));
  if (!e) return undefined;
  const grund = grundVon(e);
  const text = grund === 'ausfall' ? datenVon(e)['text'] : undefined;
  const gesperrt = lochSperre(teile, z);
  return {
    grund,
    ereignisId: e.id,
    tag: kalendertag(new Date(e.gilt_ab), zeitzone),
    wiederherstellbar: wiederherstellbar(e.gilt_ab, jetzt, zeitzone),
    ...(gesperrt ? { gesperrt } : {}),
    ...(typeof text === 'string' && text !== '' ? { text } : {}),
  };
}

/** Sperrtext, wenn inzwischen eine andere aktive Pflanzung am selben Platz und Loch steht (A11) */
function lochSperre(teile: Teile, z: Zustand): string | undefined {
  if (!z.platz_id || z.loch_nr === null || z.loch_nr === undefined) return undefined;
  const loch = Number(z.loch_nr);
  const belegt = zeilen<Zustand>(teile, 'v_pflanzung_zustand').some(
    (x) =>
      x.pflanzung_id !== z.pflanzung_id &&
      x.status === 'aktiv' &&
      x.platz_id === z.platz_id &&
      Number(x.loch_nr) === loch,
  );
  if (!belegt) return undefined;
  const kennung = zeilen<{ id: string; kennung: string }>(teile, 'platz').find(
    (p) => p.id === z.platz_id,
  )?.kennung;
  return `Loch ${kennung ?? ''}.${String(loch)} inzwischen belegt, zuerst verschieben`;
}

const neu = (id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle: 'ereignis',
  felder: { client_id: id, id, ...felder },
});

/**
 * Wiederherstellen eines Endzustands bis und mit 7. Kalendertag (R1.7, Konzept 6.3): wiederherstellen {ereignis_id}.
 * «keimt nicht» geht unverändert über wiederherstellenVorgang() (keimung.ts). Bei Ausfall mit früherer Reservierung,
 * deren Zieltopf inzwischen vergeben ist, storniert derselbe Vorgang die Reservierung (korrektur). Belegtes Loch → leer
 * mit Sperrtext (A11); nach der Frist → leer.
 */
export function endeWiederherstellenVorgang(
  teile: Teile,
  pflanzungId: string,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { vorgang: Vorgang; hinweis?: string } {
  const e = endzustand(teile, pflanzungId, jetzt, zeitzone);
  if (!e || !e.wiederherstellbar) return { vorgang: [] };
  if (e.gesperrt) return { vorgang: [], hinweis: e.gesperrt };
  if (e.grund === 'keimt_nicht') return wiederherstellenVorgang(teile, pflanzungId, ids, jetzt, zeitzone);
  const schritte: Schritt[] = [];
  let hinweis: string | undefined;
  if (e.grund === 'ausfall') {
    const res = zeilen<Reservierung>(teile, teile?.['reservierung'] ? 'reservierung' : 'v_reservierung_aktiv')
      .filter((r) => offen(r) && r.pflanzung_id === pflanzungId)
      .sort((a, b) => ms(a.gilt_ab) - ms(b.gilt_ab))
      .at(-1);
    if (res && reservierungVergeben(teile, pflanzungId, res.netztopf_id)) {
      schritte.push({
        art: 'storno',
        tabelle: 'reservierung',
        clientId: res.client_id ?? res.id,
        grund: 'korrektur',
      });
      const kennung = zeilen<{ id: string; kennung: string }>(teile, 'netztopf').find(
        (n) => n.id === res.netztopf_id,
      )?.kennung;
      hinweis = `Zieltopf ${kennung ?? ''} inzwischen vergeben: Pflanze ohne Zieltopf`;
    }
  }
  schritte.push(
    neu(ids(), {
      typ: 'wiederherstellen',
      pflanzung_id: pflanzungId,
      gilt_ab: jetzt.toISOString(),
      daten: { ereignis_id: e.ereignisId },
    }),
  );
  return { vorgang: schritte, ...(hinweis ? { hinweis } : {}) };
}

/**
 * Rückgängig (U4): Storno der neuen Zeilen in umgekehrter Reihenfolge, Grund rueckgaengig. Enthält der Vorgang einen
 * Storno (Reservierung beim Wiederherstellen), gibt es kein Rückgängig (A15).
 */
export function endeRueckgaengig(vorgang: Vorgang): Vorgang {
  if (vorgang.some((s) => s.art !== 'neu')) return [];
  return [...vorgang]
    .reverse()
    .flatMap((s): Schritt[] =>
      s.art === 'neu'
        ? [{ art: 'storno', tabelle: s.tabelle, clientId: s.felder.client_id, grund: 'rueckgaengig' }]
        : [],
    );
}

const ORTSEREIGNIS = new Set(['verschieben', 'umsetzen', 'tausch']);

/**
 * Bündelteile nach einem eben geschriebenen Vorgang (UC6-AK5, A1): neue Ereignisse in ereignis_pflanzung bzw.
 * ereignis_satz (Upsert je client_id), Storno entfernt die Zeile (das Bündel lädt ohne Storno). Für die betroffenen
 * Pflanzungen Status in v_pflanzung_zustand und v_reservierung_aktiv neu, für die betroffenen Plätze v_zielbereich
 * über zielbereichZeile(). Die Eingabe bleibt unverändert.
 */
export function teileNach(
  teile: Teile,
  vorgang: Vorgang,
  jetzt: Date,
  zeitzone: Zeitzone,
): NonNullable<Teile> {
  void zeitzone;
  const t: Record<string, unknown[]> = { ...(teile ?? {}) } as Record<string, unknown[]>;
  const liste = (name: string) => [...((t[name] ?? []) as Zeile[])];
  let pflanzungTeil = liste('ereignis_pflanzung');
  let satzTeil = liste('ereignis_satz');
  let reservierungen = liste('reservierung');
  let aktiv = liste('v_reservierung_aktiv');
  const betroffen = new Set<string>();
  const phasenSaetze = new Set<string>();
  const schluessel = (z: Zeile) => String(z['client_id'] ?? z['id']);
  const iso = jetzt.toISOString();

  for (const s of vorgang) {
    if (s.art === 'neu' && s.tabelle === 'ereignis') {
      const zeile: Zeile = {
        client_zeit: iso,
        erfasst_am: iso,
        satz_id: null,
        pflanzung_id: null,
        daten: {},
        storniert_am: null,
        ...s.felder,
      };
      const id = schluessel(zeile);
      if (zeile['typ'] === 'phase_antwort') {
        satzTeil = [...satzTeil.filter((z) => schluessel(z) !== id), zeile];
        if (zeile['satz_id']) phasenSaetze.add(String(zeile['satz_id']));
      } else pflanzungTeil = [...pflanzungTeil.filter((z) => schluessel(z) !== id), zeile];
      if (zeile['pflanzung_id']) betroffen.add(String(zeile['pflanzung_id']));
    } else if (s.art === 'storno' && s.tabelle === 'ereignis') {
      const alt = [...pflanzungTeil, ...satzTeil].find((z) => schluessel(z) === s.clientId);
      if (alt?.['pflanzung_id']) betroffen.add(String(alt['pflanzung_id']));
      if (alt?.['typ'] === 'phase_antwort' && alt['satz_id']) phasenSaetze.add(String(alt['satz_id']));
      pflanzungTeil = pflanzungTeil.filter((z) => schluessel(z) !== s.clientId);
      satzTeil = satzTeil.filter((z) => schluessel(z) !== s.clientId);
    } else if (s.art === 'storno' && s.tabelle === 'reservierung') {
      const alt = [...reservierungen, ...aktiv].find((z) => schluessel(z) === s.clientId);
      if (alt?.['pflanzung_id']) betroffen.add(String(alt['pflanzung_id']));
      reservierungen = reservierungen.filter((z) => schluessel(z) !== s.clientId);
      aktiv = aktiv.filter((z) => schluessel(z) !== s.clientId);
    }
  }
  t['ereignis_pflanzung'] = pflanzungTeil;
  t['ereignis_satz'] = satzTeil;
  if (teile?.['reservierung']) t['reservierung'] = reservierungen;

  // Status der betroffenen Pflanzungen wie v_pflanzung_zustand (ohne Ende wieder aktiv)
  const plaetze = new Set<string>();
  const saetze = new Map(zeilen<Zeile>(teile, 'satz').map((x) => [x['id'], x]));
  const platzVon = (z: Zeile) =>
    (z['platz_id'] as string | null) ??
    (saetze.get(z['satz_id'])?.['direktsaat_platz_id'] as string | null | undefined) ??
    undefined;
  // Phase aus der jüngsten phase_antwort {ja} am Satz, nur für Sätze mit neuen oder stornierten Antworten
  const phaseVon = new Map<string, { phase: unknown; seit: unknown }>();
  for (const satzId of phasenSaetze) {
    const ja = (satzTeil as unknown as Ereignis[])
      .filter((e) => e.satz_id === satzId && datenVon(e)['antwort'] === 'ja')
      .sort(spaeter)
      .at(-1);
    phaseVon.set(
      satzId,
      ja ? { phase: datenVon(ja)['phase'], seit: ja.gilt_ab } : { phase: 'keimung', seit: null },
    );
  }
  t['v_pflanzung_zustand'] = liste('v_pflanzung_zustand').map((z0) => {
    const p = String(z0['pflanzung_id']);
    const ph = phaseVon.get(String(z0['satz_id']));
    const z = ph ? { ...z0, phase: ph.phase, phase_seit: ph.seit } : z0;
    if (ph) {
      const pl = platzVon(z);
      if (pl) plaetze.add(pl);
    }
    if (!betroffen.has(p)) return z;
    const eigene = (pflanzungTeil as unknown as Ereignis[]).filter((e) => e.pflanzung_id === p).sort(spaeter);
    const ende = juengstesEnde(eigene);
    const ort = eigene.filter((e) => ORTSEREIGNIS.has(e.typ)).at(-1);
    const neuerZustand: Zeile = {
      ...z,
      status: ende ? grundVon(ende) : 'aktiv',
      ...(ort
        ? {
            netztopf_id: ort.netztopf_id ?? null,
            platz_id: datenVon(ort)['nach_platz_id'] ?? null,
            loch_nr: datenVon(ort)['nach_loch_nr'] ?? null,
          }
        : {}),
    };
    for (const x of [z, neuerZustand]) {
      const pl = platzVon(x);
      if (pl) plaetze.add(pl);
    }
    return neuerZustand;
  });

  // aktive Reservierungen der betroffenen Pflanzungen wie v_reservierung_aktiv
  if (teile?.['reservierung']) {
    const neueAktive: Zeile[] = [];
    for (const p of betroffen) {
      const eigene = (pflanzungTeil as unknown as Ereignis[]).filter((e) => e.pflanzung_id === p);
      const wieder = new Set(
        eigene.filter((e) => e.typ === 'wiederherstellen').map((e) => String(datenVon(e)['ereignis_id'])),
      );
      for (const r of reservierungen.filter((x) => x['pflanzung_id'] === p && offen(x))) {
        const beendet = eigene.some(
          (e) =>
            ms(e.gilt_ab) >= ms(r['gilt_ab'] as string) &&
            (e.typ === 'umsetzen' ||
              (e.typ === 'abschluss' && ['keimt_nicht', 'ausfall'].includes(String(datenVon(e)['grund'])))) &&
            !wieder.has(e.id),
        );
        if (!beendet) neueAktive.push({ ...r });
      }
    }
    aktiv = [...aktiv.filter((r) => !betroffen.has(String(r['pflanzung_id']))), ...neueAktive];
  }
  t['v_reservierung_aktiv'] = aktiv;

  // Zielbereich der betroffenen Plätze neu
  if (plaetze.size > 0) {
    const zb = liste('v_zielbereich').filter((z) => !plaetze.has(String(z['platz_id'])));
    for (const pl of plaetze) {
      const zeile = zielbereichZeile(t as Teile, pl);
      if (zeile) zb.push(zeile as unknown as Zeile);
    }
    t['v_zielbereich'] = zb;
  }
  return t as NonNullable<Teile>;
}

const zahlOderNull = (w: unknown) => (w === null || w === undefined || w === '' ? null : Number(w));
const hoechstes = (l: (number | null)[]) => {
  const w = l.filter((x): x is number => x !== null);
  return w.length > 0 ? Math.max(...w) : null;
};
const tiefstes = (l: (number | null)[]) => {
  const w = l.filter((x): x is number => x !== null);
  return w.length > 0 ? Math.min(...w) : null;
};

/**
 * Spiegel von v_zielbereich für einen Platz (R2.2 Zweck «Bewertung», A1): aktive Pflanzungen mit aktuellem Platz
 * (sonst Direktsaat-Platz) in einem Platz mit Rolle gefaess; je Grösse das Maximum der Minima und das Minimum der
 * Maxima aus v_sollwert der Phase; EC mit ec_gesamt (Basis zuwachs plus ECWasser der Anlage, sonst Standard 0.5).
 * Einheiten wie die Sicht (pH 6.0, EC 1.2, °C). Ohne aktive Pflanzung undefined.
 */
export function zielbereichZeile(teile: Teile, platzId: string): ZielbereichZeile | undefined {
  const platz = zeilen<{ id: string; anlage_id: string; rolle?: string }>(teile, 'platz').find(
    (p) => p.id === platzId,
  );
  if (!platz || platz.rolle !== 'gefaess') return undefined;
  const saetze = new Map(
    zeilen<{ id: string; sorte_id: string; direktsaat_platz_id: string | null }>(teile, 'satz').map((s) => [
      s.id,
      s,
    ]),
  );
  const pflanzen = zeilen<Zustand>(teile, 'v_pflanzung_zustand').flatMap((z) => {
    const satz = saetze.get(z.satz_id);
    if (z.status !== 'aktiv' || !satz) return [];
    return (z.platz_id ?? satz.direktsaat_platz_id) === platzId ? [{ ...z, sorteId: satz.sorte_id }] : [];
  });
  if (pflanzen.length === 0) return undefined;
  const messung = zeilen<{ anlage_id: string; ec: number | string | null }>(teile, 'v_ec_wasser').find(
    (w) => w.anlage_id === platz.anlage_id,
  );
  const anlage = zeilen<{ id: string; ec_wasser_annahme?: number | string | null }>(teile, 'anlage').find(
    (a) => a.id === platz.anlage_id,
  );
  const ecWasser = zahlOderNull(messung?.ec) ?? zahlOderNull(anlage?.ec_wasser_annahme) ?? 0.5;
  const sollwerte = zeilen<Zeile>(teile, 'v_sollwert');
  const werte = (groesse: string, feld: 'wert_min' | 'wert_max') =>
    pflanzen.map((z) => {
      const s = sollwerte.find(
        (x) =>
          x['sorte_id'] === z.sorteId && x['phase'] === (z.phase ?? 'keimung') && x['groesse'] === groesse,
      );
      const w = zahlOderNull(s?.[feld]);
      return w !== null && groesse === 'ec' && s?.['ec_basis_quelle'] === 'zuwachs' ? w + ecWasser : w;
    });
  return {
    platz_id: platzId,
    ph_min: hoechstes(werte('ph', 'wert_min')),
    ph_max: tiefstes(werte('ph', 'wert_max')),
    ec_min: hoechstes(werte('ec', 'wert_min')),
    ec_max: tiefstes(werte('ec', 'wert_max')),
    temp_min: hoechstes(werte('wassertemp', 'wert_min')),
    temp_max: tiefstes(werte('wassertemp', 'wert_max')),
    zaehlende_pflanzungen: pflanzen.length,
  };
}

const AUSFALL = 'Ausfall';
const ENDE_TEXT: Readonly<Record<EndGrund, string>> = {
  geerntet: 'Abgeerntet',
  ausfall: AUSFALL,
  keimt_nicht: 'Keimt nicht',
  ueberzaehlig: 'Überzählig',
};
const SCHOSSEN_TEXT: Readonly<Record<string, string>> = {
  auskneifen: 'Blüte: ausgekniffen',
  ernten_beenden: 'Blüte: sofort geerntet',
  bluete_nutzen: 'Blüte: genutzt',
};

/**
 * Verlauf der Pflanzung, neueste zuerst (R1.7): Phasenzeilen des Satzes, Ernten, Kulturentscheide, Schossen, Ende,
 * Wiederherstellen, Umsetzen und Verschieben. Die Zeile des wiederherstellbaren Endzustands trägt wiederherstellen.
 */
export function pflanzenVerlauf(
  teile: Teile,
  pflanzungId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { tag: string; text: string; wiederherstellen?: true }[] {
  const z = zustandVon(teile, pflanzungId);
  const satzId =
    z?.satz_id ??
    zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').find((p) => p.id === pflanzungId)?.satz_id;
  const ende = endzustand(teile, pflanzungId, jetzt, zeitzone);
  const zeilenListe: { tag: string; text: string; zeit: number; ordnung: number; wiederherstellen?: true }[] =
    [];
  const tagVon = (e: { gilt_ab: string }) => kalendertag(new Date(e.gilt_ab), zeitzone);
  let n = 0;
  // Satzzeilen zuerst: bei gleicher Zeit steht das Ereignis der Pflanzung oben
  if (satzId) {
    for (const v of phasenVerlauf(teile, satzId, zeitzone)) {
      n += 1;
      zeilenListe.push({ tag: v.tag, text: v.text, zeit: Number.NEGATIVE_INFINITY, ordnung: n });
    }
    for (const e of kulturEntscheide(teile, satzId)) {
      n += 1;
      const tag = tagVon(e);
      const d = datenVon(e);
      zeilenListe.push({
        tag,
        text:
          d['entscheid'] === 'verlaengern'
            ? `${tagKurz(tag)} Kultur verlängert um ${String(d['tage'])} Tage`
            : `${tagKurz(tag)} Kultur beendet`,
        zeit: ms(e.gilt_ab),
        ordnung: n,
      });
    }
  }
  for (const e of ereignisseVon(teile, pflanzungId)) {
    n += 1;
    const d = datenVon(e);
    const tag = tagVon(e);
    let text: string | undefined;
    if (e.typ === 'ernte') text = d['art'] === 'ab' ? ENDE_TEXT.geerntet : 'Teilernte';
    else if (e.typ === 'abschluss') {
      const grund = String(d['grund']) as EndGrund;
      text =
        grund === 'ausfall' && typeof d['text'] === 'string' && d['text'] !== ''
          ? `${AUSFALL}: ${d['text']}`
          : (ENDE_TEXT[grund] ?? grund);
    } else if (e.typ === 'wiederherstellen') text = 'Wiederhergestellt';
    else if (e.typ === 'schossen_handlung') text = SCHOSSEN_TEXT[String(d['handlung'])] ?? 'Blüte gemeldet';
    else if (e.typ === 'umsetzen') text = 'Umgesetzt';
    else if (e.typ === 'verschieben') text = 'Verschoben';
    else if (e.typ === 'tausch') text = 'Getauscht';
    if (!text) continue;
    zeilenListe.push({
      tag,
      text: `${tagKurz(tag)} ${text}`,
      zeit: ms(e.gilt_ab),
      ordnung: n,
      ...(ende && ende.wiederherstellbar && !ende.gesperrt && ende.ereignisId === e.id
        ? { wiederherstellen: true as const }
        : {}),
    });
  }
  return zeilenListe
    .sort((a, b) => b.tag.localeCompare(a.tag) || b.zeit - a.zeit || b.ordnung - a.ordnung)
    .map(({ tag, text, wiederherstellen }) => ({
      tag,
      text,
      ...(wiederherstellen ? { wiederherstellen } : {}),
    }));
}

/** Beendete Pflanzungen der letzten 7 Kalendertage an einem Platz, jüngste zuerst (Maske «Gefäss», A10) */
export function kuerzlichBeendet(
  teile: Teile,
  platzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { pflanzungId: string; sorte: string; text: string }[] {
  const saetze = new Map(
    zeilen<{ id: string; sorte_id: string; direktsaat_platz_id: string | null }>(teile, 'satz').map((s) => [
      s.id,
      s,
    ]),
  );
  const sorten = zeilen<{ sorte_id: string; name: string; gueltig_bis?: string | null }>(teile, 'sorte');
  const liste: { pflanzungId: string; sorte: string; text: string; tag: string }[] = [];
  for (const z of zeilen<Zustand>(teile, 'v_pflanzung_zustand')) {
    const satz = saetze.get(z.satz_id);
    if (z.status === 'aktiv' || !satz || (z.platz_id ?? satz.direktsaat_platz_id) !== platzId) continue;
    const e = endzustand(teile, z.pflanzung_id, jetzt, zeitzone);
    if (!e?.wiederherstellbar) continue;
    const sorte =
      sorten.find((s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null)?.name ?? 'Sorte';
    const ort = z.loch_nr !== null && z.loch_nr !== undefined ? ` · Loch ${String(z.loch_nr)}` : '';
    liste.push({
      pflanzungId: z.pflanzung_id,
      sorte,
      text: `${sorte}${ort} · ${ENDE_TEXT[e.grund]} am ${tagKurz(e.tag)}`,
      tag: e.tag,
    });
  }
  return liste
    .sort((a, b) => b.tag.localeCompare(a.tag) || a.pflanzungId.localeCompare(b.pflanzungId))
    .map(({ tag, ...rest }) => {
      void tag;
      return rest;
    });
}

/** Code «<Kürzel>-<Kennung>» eines Platzes */
export function platzCode(teile: Teile, platzId: string): string | undefined {
  const p = zeilen<{ id: string; anlage_id: string; kennung: string }>(teile, 'platz').find(
    (x) => x.id === platzId,
  );
  return p ? `${kuerzelVon(teile, p.anlage_id)}-${p.kennung}` : undefined;
}
