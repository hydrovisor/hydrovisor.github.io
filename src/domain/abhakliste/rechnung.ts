// Eingaben des Düngerrechners für den Neuansatz aus den Bündelteilen (Konzept R4.1 bis R4.7; Plan 29 A11, A12).
// Rein. Zielbereich, Leitkultur und Stadium aus ansatzGrundlage() nach Zweck (R2.1 bis R2.3, R4.3; Plan 34, ersetzt
// Plan 29 A11); Station mit dem Kontrollband aus bewertungsband() (R4.5). k aus k_faktor, Teil-Dosis aus teilDosis()
// mit kStabil() über die Neuansätze im Bündel (A12).
import type { Teile } from '../teile.ts';
import type { Band } from '../bewertung/bewertung.ts';
import { bewertungsband } from '../bewertung/sollband.ts';
import type { Datenart } from '../kalibrierung/stand.ts';
import {
  ecWasser,
  neuansatz,
  type NeuansatzEingabe,
  type NeuansatzErgebnis,
  type Stadium,
} from '../rechner.ts';
import { ecSollIst, kStabil, teilDosis, type StabilZeile } from '../rechner-korrektur.ts';
import type { KSatz } from '../rechner-zahlen.ts';
import type { PhArt } from '../rechner-ph.ts';
import type { Zeitzone } from '../zeit.ts';
import type { Zweck } from '../zielbereich.ts';
import { ansatzGrundlage, type Leitkultur } from '../zielbereich-leitkultur.ts';

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const zahl = (x: unknown) => (x === null || x === undefined || x === '' ? undefined : Number(x));
const hundertstel = (x: unknown) => {
  const n = zahl(x);
  return n === undefined || !Number.isFinite(n) ? undefined : Math.round(n * 100);
};
const gueltig = (z: Zeile) => (z['storniert_am'] ?? null) === null && (z['gueltig_bis'] ?? null) === null;

const KOMPONENTEN = ['grow', 'micro_hard_water', 'bloom'] as const;
/** k ohne Wert: Startwert des Konzepts (R4.2), 0.300 je Komponente */
const K_START = 300;

export interface Rechnungseingaben {
  eingabe: NeuansatzEingabe;
  zweck: Zweck;
  leitkultur: Leitkultur;
  gerechnetFuer: string;
  pflanzungIds: string[];
  stadiumVorschlag: Stadium | undefined;
  phBand?: Band;
  phArt: PhArt;
  volumen: number;
  datenart: Datenart;
  kSchnappschuss: Record<string, number>;
  ecWasserQuelle: 'frischwasser' | 'w' | 'annahme';
}

function gefaessAm(teile: Teile, platzId: string): Zeile | undefined {
  return teil(teile, 'gefaess').find((g) => g['platz_id'] === platzId && gueltig(g));
}

function datenartAm(teile: Teile, platzId: string): Datenart {
  const anlageId = teil(teile, 'platz').find((p) => p['id'] === platzId)?.['anlage_id'];
  const anlage = teil(teile, 'anlage').find((a) => a['id'] === anlageId) ?? teil(teile, 'anlage')[0];
  const art = text(anlage?.['datenart']);
  return art === 'demo' || art === 'test' ? art : 'echt';
}

/** jüngster gültiger k je Komponente bis jetzt (Tausendstel) mit Quelle und Zeitpunkt */
function kAus(teile: Teile, jetzt: Date): { k: KSatz; quellen: string[]; geaendertAm: Date } {
  const k: Record<string, number> = {};
  const quellen: string[] = [];
  let geaendert = 0;
  for (const c of KOMPONENTEN) {
    const z = teil(teile, 'k_faktor')
      .filter((x) => x['produkt_id'] === c && gueltig(x) && Date.parse(text(x['gilt_ab'])) <= jetzt.getTime())
      .sort((a, b) => Date.parse(text(b['gilt_ab'])) - Date.parse(text(a['gilt_ab'])))[0];
    const wert = zahl(z?.['wert']);
    k[c] = wert === undefined ? K_START : Math.round(wert * 1000);
    quellen.push(z ? text(z['quelle']) : 'startwert');
    if (z) geaendert = Math.max(geaendert, Date.parse(text(z['gilt_ab'])));
  }
  return { k: k as unknown as KSatz, quellen, geaendertAm: new Date(geaendert) };
}

/**
 * ECSoll_ist der Teil-Dosis eines Neuansatzes (R4.7, Prüferbefund 3): erste Position je Komponente (Zeilen 5, 7, 9;
 * die Restdosis ist die zweite), k aus dem Schnappschuss des Kopfs, ECWasser des Kopfs; ohne Positionen
 * ec_erwartet_teildosis.
 */
function ecSollIstTeil(teile: Teile, a: Zeile, kJetzt: KSatz): number | undefined {
  const positionen = teil(teile, 'ansatz_position')
    .filter((p) => p['ansatz_id'] === a['id'] && (p['storniert_am'] ?? null) === null)
    .sort((x, y) => text(x['erfasst_am']).localeCompare(text(y['erfasst_am'])));
  const ist: Record<string, number> = {};
  for (const c of KOMPONENTEN) {
    const p = positionen.find((x) => x['produkt_id'] === c);
    if (!p) return hundertstel(a['ec_erwartet_teildosis']);
    ist[c] = Math.round(Number(p['ist_ml'] ?? p['soll_ml']) * 10);
  }
  const volumen = Math.round((zahl(a['volumen_l']) ?? 0) * 100);
  if (volumen <= 0) return hundertstel(a['ec_erwartet_teildosis']);
  const schnapp = (a['schnappschuss'] ?? {}) as { k?: Record<string, unknown> };
  const k = Object.fromEntries(
    KOMPONENTEN.map((c) => {
      const w = zahl(schnapp.k?.[c]);
      return [c, w === undefined ? kJetzt[c] : Math.round(w * 1000)];
    }),
  ) as unknown as KSatz;
  return ecSollIst({
    ist: ist as unknown as KSatz,
    volumen,
    k,
    ecWasser: hundertstel(a['ec_wasser']) ?? 50,
  }).gerundet;
}

/** Neuansätze im Bündel für kStabil (A12): nur abgeschlossene, Vergleich mit ECSoll_ist der Teil-Dosis */
function stabilZeilen(teile: Teile, datenart: Datenart, kJetzt: KSatz): StabilZeile[] {
  const messungen = new Map(teil(teile, 'messung').map((m) => [text(m['id']), m]));
  const unsicher = new Set(teil(teile, 'v_messung_unsicher').map((u) => text(u['messung_id'])));
  return (
    teil(teile, 'naehrloesungsansatz')
      // nur abgeschlossene: ein laufender Wechsel hat noch keine Kontrolle und zählt nicht als instabil (A12)
      .filter((a) => a['typ'] === 'neuansatz' && a['status'] === 'abgeschlossen')
      .map((a) => {
        const kontrolle = messungen.get(text(a['kontrollmessung_id']));
        return {
          begonnenAm: new Date(text(a['begonnen_am'])),
          kontrolle: hundertstel(kontrolle?.['ec']),
          ecSollIst: ecSollIstTeil(teile, a, kJetzt),
          unsicher: kontrolle ? unsicher.has(text(kontrolle['id'])) : false,
          datenart,
          istStation: false,
          storniert: (a['storniert_am'] ?? null) !== null,
          abgebrochen: a['status'] === 'abgebrochen',
        };
      })
  );
}

/** Erster Ansatz im Gefäss: Status «in Betrieb (Volumen offen)», Kannen zählen (R4.4, Plan 21 A2) */
export function erstAnsatzAm(teile: Teile, platzId: string): boolean {
  const g = gefaessAm(teile, platzId);
  if (!g) return false;
  const status = teil(teile, 'v_gefaess_status').find((v) => v['gefaess_id'] === g['id'])?.['status'];
  return status === 'in_betrieb_volumen_offen';
}

export function rechnungEingaben(
  teile: Teile,
  platzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  e: { frischwasserEc?: number; stadiumGewaehlt?: Stadium; zielEcGewaehlt?: number; volumen?: number } = {},
): Rechnungseingaben {
  const g = gefaessAm(teile, platzId);
  const istStation = g?.['feste_dosis'] === true;
  const betriebsart = text(g?.['betriebsart']) || 'dwc';
  const phArt: PhArt = istStation
    ? 'station'
    : ((['dwc', 'konstantpegel', 'kratky', 'kratky_belueftet'].includes(betriebsart)
        ? betriebsart
        : 'dwc') as PhArt);
  // gezählte Kannen beim ersten Ansatz gehen dem Betriebsvolumen vor (R4.4)
  const volumen = e.volumen ?? Math.round((zahl(g?.['betriebsvolumen_l']) ?? 0) * 100);
  // Station: Kontrollband (R4.5); sonst die Schnittmenge der zählenden nach Zweck (R2.1, R2.2)
  const band = istStation ? bewertungsband(teile, platzId, jetzt) : undefined;
  const grundlage = ansatzGrundlage(teile, platzId, jetzt, zeitzone);
  const schnitt = grundlage.schnittmenge.art === 'ok' ? grundlage.schnittmenge : undefined;
  const ecBand = band?.ec ?? schnitt?.ec;
  const phBand = band?.ph ?? schnitt?.ph;
  const datenart = datenartAm(teile, platzId);
  const { k, quellen, geaendertAm } = kAus(teile, jetzt);
  const uEc = hundertstel(teil(teile, 'messgeraet')[0]?.['u_ec']) ?? 10;
  const stabil = kStabil(stabilZeilen(teile, datenart, k), uEc, geaendertAm);
  const anlageW = teil(teile, 'v_ec_wasser')[0];
  const wasser = ecWasser({ frischwasser: e.frischwasserEc, letzteW: hundertstel(anlageW?.['ec']) });
  const stadiumVorschlag = grundlage.stadiumVorschlag;
  const eingabe: NeuansatzEingabe = {
    volumen,
    stadium: e.stadiumGewaehlt ?? stadiumVorschlag,
    zielbereich: ecBand ? { min: ecBand.min, max: ecBand.max } : undefined,
    zielEcGewaehlt: e.zielEcGewaehlt,
    ecWasser: wasser.wert,
    k,
    teilDosis: teilDosis({ kQuellen: quellen, kStabil: stabil, istStation, zielbereichKlasseD: false }),
    istStation,
    ueberHerstellerdosisBestaetigt: false,
  };
  return {
    eingabe,
    zweck: grundlage.zweck,
    leitkultur: grundlage.leitkultur,
    gerechnetFuer: grundlage.gerechnetFuer,
    pflanzungIds: grundlage.pflanzungIds,
    stadiumVorschlag,
    ...(phBand ? { phBand } : {}),
    phArt,
    volumen,
    datenart,
    kSchnappschuss: Object.fromEntries(KOMPONENTEN.map((c) => [c, k[c] / 1000])),
    ecWasserQuelle: wasser.quelle,
  };
}

/** Rechnung aus den Eingaben; undefined, solange Ziel-EC oder Stadium fehlen (RF7) */
export function rechnen(r: Rechnungseingaben): NeuansatzErgebnis | undefined {
  const x = neuansatz(r.eingabe);
  return x.art === 'ergebnis' ? x : undefined;
}
