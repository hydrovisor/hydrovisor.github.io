// Vorgänge der Abhakliste und der pH-Korrektur für schreiben() (Konzept 11.4, 8.1 Regel 2; Plan 29 «Schreibweg»,
// A4, A5, A10, A24). Rein. Für alle Zeilen gilt id = client_id. Die App schreibt nie status, abgeschlossen_am,
// timer_ende (ausser beim Insert der pH-Korrektur), dauer_s, kontrollmessung_id oder endmessung_id.
// Einheiten der Datenbank: ml, l, pH und EC als Dezimalzahl; im Stand Zehntel ml, Hundertstel l, Hundertstel pH.
import type { Komponente } from '../einstellungen/einstellungen.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import type { NeuansatzErgebnis, Stadium } from '../rechner.ts';
import { NACHMESSEN_MIN } from '../rechner-ph.ts';
import type { Zeitzone } from '../zeit.ts';
import type { AblaufStand, ZeilenStand } from './stand.ts';
import { ZUGABEN } from './zeilen.ts';

const ml = (zehntel: number | undefined) => (zehntel === undefined ? null : zehntel / 10);
const liter = (hundertstel: number) => hundertstel / 100;
const dosisSumme = (d: Readonly<Record<Komponente, number>>) =>
  Object.values(d).reduce((s, x) => s + x, 0) / 100;

function neu(
  tabelle: Extract<Schritt, { art: 'neu' }>['tabelle'],
  id: string,
  felder: Record<string, unknown>,
): Schritt {
  return { art: 'neu', tabelle, felder: { id, client_id: id, ...felder } };
}

export interface KopfAngaben {
  volumen: number;
  stadiumVorschlag?: Stadium;
  stadiumGewaehlt?: Stadium;
  pflanzungIds: readonly string[];
  /** Leitkultur aus ansatzGrundlage() (R2.3, R2.5; Plan 34); ohne Leitkultur null */
  leitkulturArtId?: string;
  schnappschuss: Record<string, unknown>;
  ecWasser?: number;
  zielEcVorschlag?: number;
  rechnung: NeuansatzErgebnis;
  /** Messgerät und Unsicherheiten für die Frischwassermessung */
  messgeraetId?: string;
}

/** Positionen der Dosierzeilen 5, 7, 9 bzw. der Teilschritte von 15 und pH-Minus in Zeile 12 */
function positionen(
  stand: AblaufStand,
  z: ZeilenStand,
  ids: () => string,
): { schritte: Schritt[]; ids: string[] } {
  const bezug = liter(volumenVon(stand));
  const pos = (produkt: string, soll: number | undefined, ist: number | undefined) => {
    const id = ids();
    return {
      id,
      schritt: neu('ansatz_position', id, {
        ansatz_id: stand.ansatzId,
        produkt_id: produkt,
        soll_ml: ml(soll) ?? 0,
        ist_ml: ml(ist ?? soll),
        bezugsvolumen_l: bezug,
      }),
    };
  };
  const liste: { id: string; schritt: Schritt }[] = [];
  const zugabe = ZUGABEN.find((x) => x.nr === z.nr);
  if (zugabe) liste.push(pos(zugabe.komponente, z.sollMl, z.istMl));
  if (z.nr === 12 && (z.istMl ?? 0) > 0) liste.push(pos('ph_minus', 0, z.istMl));
  if (z.nr === 15) for (const t of z.teilschritte ?? []) liste.push(pos(t.komponente, t.sollMl, t.sollMl));
  return { schritte: liste.map((x) => x.schritt), ids: liste.map((x) => x.id) };
}

/** Bezugsvolumen in Hundertsteln l: aus der Rechnung im Stand, sonst 0 */
function volumenVon(stand: AblaufStand): number {
  return stand.volumen ?? 0;
}

function schrittZeile(stand: AblaufStand, z: ZeilenStand, id: string): Schritt {
  return neu('ansatz_schritt', id, {
    ansatz_id: stand.ansatzId,
    nr: z.nr,
    schritt: z.schritt,
    erledigt_am: z.erledigtAm ?? null,
    soll_ml: z.nr === 12 ? null : ml(z.sollMl),
    ist_ml: z.nr === 12 ? null : ml(z.istMl),
    ph_minus_ml: z.nr === 12 ? (ml(z.istMl) ?? 0) : null,
  });
}

function mitIds(stand: AblaufStand, nr: number, schrittId: string, positionIds: string[]): AblaufStand {
  return {
    ...stand,
    zeilen: stand.zeilen.map((z) =>
      z.nr === nr ? { ...z, schrittClientId: schrittId, positionClientIds: positionIds } : z,
    ),
  };
}

/**
 * Kopf beim Haken von Zeile 4 (A4): naehrloesungsansatz, danach die Frischwassermessung mit ansatz_id, danach die
 * Schritte 0 bis 4 mit ihrem erledigt_am (Reihenfolge der Fremdschlüssel).
 */
export function kopfVorgang(
  stand: AblaufStand,
  k: KopfAngaben,
  ids: () => string,
): { vorgang: Vorgang; stand: AblaufStand } {
  const r = k.rechnung;
  const begonnen = stand.begonnenAm ?? stand.zeilen.find((z) => z.erledigtAm)?.erledigtAm;
  const vorgang: Schritt[] = [
    neu('naehrloesungsansatz', stand.ansatzId, {
      platz_id: stand.platzId,
      typ: 'neuansatz',
      begonnen_am: begonnen,
      gilt_ab: begonnen,
      volumen_l: liter(k.volumen),
      stadium_vorschlag: k.stadiumVorschlag ?? r.stadium,
      stadium_gewaehlt: k.stadiumGewaehlt ?? r.stadium,
      gerechnet_fuer: [...k.pflanzungIds],
      leitkultur_art_id: k.leitkulturArtId ?? null,
      schnappschuss: k.schnappschuss,
      ec_wasser: k.ecWasser === undefined ? null : k.ecWasser / 100,
      ziel_ec_vorschlag: (k.zielEcVorschlag ?? r.ecZiel) / 100,
      ziel_ec_gewaehlt: r.ecZiel / 100,
      dosis_hersteller_ml_l: dosisSumme(r.dosisHersteller),
      dosis_verwendet_ml_l: dosisSumme(r.dosisVerwendet),
      skaliert: r.skaliert,
      teil_dosis: r.teilDosis / 100,
      ec_erwartet_teildosis: r.ecErwartetTeil / 100,
      ist_ersteinstellung: false,
    }),
  ];
  let s: AblaufStand = { ...stand, kopfGeschrieben: true, volumen: k.volumen };
  const fw = stand.frischwasser;
  if (fw && k.messgeraetId)
    vorgang.push(
      neu('messung', fw.id, {
        platz_id: stand.platzId,
        messgeraet_id: k.messgeraetId,
        messart: 'frischwasser',
        ansatz_id: stand.ansatzId,
        gilt_ab: fw.giltAb ?? begonnen,
        ec: fw.ec === undefined ? null : fw.ec / 100,
        ec_eingabe: fw.ec === undefined ? null : (fw.ec / 100).toFixed(2),
        ec_dezimalen: fw.ec === undefined ? null : 2,
        temperatur: fw.temperatur === undefined ? null : fw.temperatur / 100,
        ph: null,
      }),
    );
  for (const z of s.zeilen.filter((x) => x.nr <= 4 && x.erledigtAm)) {
    const id = ids();
    vorgang.push(schrittZeile(s, z, id));
    s = mitIds(s, z.nr, id, []);
  }
  return { vorgang, stand: s };
}

/** Haken einer Zeile nach dem Kopf: ansatz_schritt, bei 5, 7, 9, 12 und 15 mit Positionen (A10) */
export function schrittVorgang(
  stand: AblaufStand,
  nr: number,
  ids: () => string,
): { vorgang: Vorgang; stand: AblaufStand } {
  const z = stand.zeilen.find((x) => x.nr === nr);
  if (!z?.erledigtAm || !stand.kopfGeschrieben) return { vorgang: [], stand };
  const p = positionen(stand, z, ids);
  const id = ids();
  return { vorgang: [...p.schritte, schrittZeile(stand, z, id)], stand: mitIds(stand, nr, id, p.ids) };
}

/**
 * Abwahl (Korrektur = Storno plus neue Zeile): Storno des Schritts und seiner Positionen. Die Abwahl von Zeile 4
 * storniert Kopf, Frischwassermessung und die Schritte 0 bis 4 (A4).
 */
export function abwahlVorgang(vorher: AblaufStand, nr: number): Vorgang {
  const storno = (tabelle: Extract<Schritt, { art: 'storno' }>['tabelle'], clientId: string): Schritt => ({
    art: 'storno',
    tabelle,
    clientId,
    grund: 'korrektur',
  });
  if (!vorher.kopfGeschrieben) return [];
  const z = vorher.zeilen.find((x) => x.nr === nr);
  if (nr === 4) {
    const schritte = vorher.zeilen
      .filter((x) => x.nr <= 4 && x.schrittClientId)
      .map((x) => storno('ansatz_schritt', x.schrittClientId as string));
    return [
      ...schritte,
      ...(vorher.frischwasser ? [storno('messung', vorher.frischwasser.id)] : []),
      storno('naehrloesungsansatz', vorher.ansatzId),
    ];
  }
  if (!z?.schrittClientId) return [];
  return [
    storno('ansatz_schritt', z.schrittClientId),
    ...(z.positionClientIds ?? []).map((id) => storno('ansatz_position', id)),
  ];
}

/** Tims Wahl der Leitkultur im Gleichstand (R2.3 Stufe 4, Plan 34): Ereignis leitkultur_gewaehlt am Platz */
export function leitkulturGewaehltVorgang(
  platzId: string,
  artId: string,
  ids: () => string,
  jetzt: Date,
): Vorgang {
  const id = ids();
  return [
    neu('ereignis', id, {
      typ: 'leitkultur_gewaehlt',
      platz_id: platzId,
      daten: { art_id: artId },
      gilt_ab: jetzt.toISOString(),
    }),
  ];
}

/** «Wechsel abbrechen» nach dem Kopf: Zeile abbruch mit der nächsten offenen nr (Plan 29 Migration 1) */
export function abbruchVorgang(stand: AblaufStand, ids: () => string, jetzt: Date): Vorgang {
  if (!stand.kopfGeschrieben) return [];
  const offen = stand.zeilen.find((z) => z.erledigtAm === undefined);
  if (!offen) return [];
  const id = ids();
  return [
    neu('ansatz_schritt', id, {
      ansatz_id: stand.ansatzId,
      nr: offen.nr,
      schritt: 'abbruch',
      erledigt_am: jetzt.toISOString(),
      soll_ml: null,
      ist_ml: null,
      ph_minus_ml: null,
    }),
  ];
}

/** Abschluss (Zeile 17): zuerst setzen ec_erwartet_final und k_vorschlag (nur solange leer), dann Schritt 17 */
export function abschlussVorgang(
  stand: AblaufStand,
  e: { ecErwartetFinal?: number; kVorschlag?: number; echt: boolean },
  ids: () => string,
): { vorgang: Vorgang; stand: AblaufStand } {
  const felder: { ec_erwartet_final?: number; k_vorschlag?: number } = {};
  if (e.ecErwartetFinal !== undefined) felder.ec_erwartet_final = e.ecErwartetFinal / 100;
  // k-Vorschlag nur mit Datenart echt (G5)
  if (e.kVorschlag !== undefined && e.echt) felder.k_vorschlag = e.kVorschlag / 1000;
  const setzen: Schritt[] =
    Object.keys(felder).length > 0
      ? [{ art: 'setzen', tabelle: 'naehrloesungsansatz', clientId: stand.ansatzId, felder }]
      : [];
  const s = schrittVorgang(stand, 17, ids);
  return { vorgang: [...setzen, ...s.vorgang], stand: s.stand };
}

/**
 * «pH-Minus gegeben» (R4.14, UC9 Ablauf 6): naehrloesungsansatz ph_korrektur mit timer_ende = jetzt + 15 min beim
 * Insert, danach die Position pH-Minus. Die Messung schreibt die Messmaske davor.
 */
export function phKorrekturVorgang(
  e: {
    platzId: string;
    phVorher: number;
    volumenL: number;
    sollMl: number;
    istMl: number;
    ids: () => string;
  },
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  void zeitzone;
  const id = e.ids();
  const pos = e.ids();
  const beginn = jetzt.toISOString();
  return [
    neu('naehrloesungsansatz', id, {
      platz_id: e.platzId,
      typ: 'ph_korrektur',
      begonnen_am: beginn,
      gilt_ab: beginn,
      timer_ende: new Date(jetzt.getTime() + NACHMESSEN_MIN * 60_000).toISOString(),
      ph_vorher: e.phVorher / 100,
      volumen_l: e.volumenL,
      ist_ersteinstellung: false,
    }),
    neu('ansatz_position', pos, {
      ansatz_id: id,
      produkt_id: 'ph_minus',
      soll_ml: e.sollMl / 10,
      ist_ml: e.istMl / 10,
      bezugsvolumen_l: e.volumenL,
    }),
  ];
}
