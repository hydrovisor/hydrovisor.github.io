// Eingaben des Düngerrechners für den Neuansatz aus den Bündelteilen (Konzept R4.1 bis R4.7; Plan 29 A11, A12).
// Rein. Zielbereich aus bewertungsband() (Zweck «Bewertung heute», A11), Leitkultur = ältester aktiver Satz im Gefäss
// (A11, bis I2-02), k aus k_faktor, Teil-Dosis aus teilDosis() mit kStabil() über die Neuansätze im Bündel (A12).
import type { Teile } from '../teile.ts';
import type { Band } from '../bewertung/bewertung.ts';
import { bewertungsband } from '../bewertung/sollband.ts';
import type { Datenart } from '../kalibrierung/stand.ts';
import { PHASE_NAME, type Phase } from '../phasen/profil.ts';
import {
  ecWasser,
  herstellerstadium,
  neuansatz,
  type NeuansatzEingabe,
  type NeuansatzErgebnis,
  type Stadium,
} from '../rechner.ts';
import { kStabil, teilDosis, type StabilZeile } from '../rechner-korrektur.ts';
import type { KSatz } from '../rechner-zahlen.ts';
import type { PhArt } from '../rechner-ph.ts';
import type { Zeitzone } from '../zeit.ts';

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

/** Neuansätze im Bündel für kStabil (A12) */
function stabilZeilen(teile: Teile, datenart: Datenart): StabilZeile[] {
  const messungen = new Map(teil(teile, 'messung').map((m) => [text(m['id']), m]));
  const unsicher = new Set(teil(teile, 'v_messung_unsicher').map((u) => text(u['messung_id'])));
  return teil(teile, 'naehrloesungsansatz')
    .filter((a) => a['typ'] === 'neuansatz')
    .map((a) => {
      const kontrolle = messungen.get(text(a['kontrollmessung_id']));
      return {
        begonnenAm: new Date(text(a['begonnen_am'])),
        kontrolle: hundertstel(kontrolle?.['ec']),
        ecSollIst: hundertstel(a['ec_erwartet_final']),
        unsicher: kontrolle ? unsicher.has(text(kontrolle['id'])) : false,
        datenart,
        istStation: false,
        storniert: (a['storniert_am'] ?? null) !== null,
        abgebrochen: a['status'] === 'abgebrochen',
      };
    });
}

/** Leitkultur = ältester aktiver Satz im Gefäss (A11) und «Gerechnet für: 3 × Lollo Rossa Wachstum» */
function pflanzenAm(teile: Teile, platzId: string) {
  const aktiv = teil(teile, 'v_pflanzung_zustand').filter(
    (p) => p['platz_id'] === platzId && p['status'] === 'aktiv',
  );
  const saetze = new Map(teil(teile, 'satz').map((s) => [text(s['id']), s]));
  const sorten = new Map(teil(teile, 'sorte').map((s) => [text(s['sorte_id'] ?? s['id']), s]));
  const gruppen = new Map<string, { anzahl: number; name: string; phase: string }>();
  for (const p of aktiv) {
    const satz = saetze.get(text(p['satz_id']));
    const name = text(sorten.get(text(satz?.['sorte_id']))?.['name']) || 'Pflanze';
    const phase = text(p['phase']);
    const schluessel = `${name}|${phase}`;
    const g = gruppen.get(schluessel) ?? { anzahl: 0, name, phase };
    g.anzahl += 1;
    gruppen.set(schluessel, g);
  }
  const aeltester = [...new Set(aktiv.map((p) => text(p['satz_id'])))]
    .map((id) => saetze.get(id))
    .filter((s): s is Zeile => s !== undefined)
    .sort((a, b) => text(a['saatdatum']).localeCompare(text(b['saatdatum'])))[0];
  const phaseLeit = aktiv.find((p) => p['satz_id'] === aeltester?.['id'])?.['phase'] as Phase | undefined;
  const gerechnetFuer = [...gruppen.values()]
    .map((g) => `${String(g.anzahl)} × ${g.name} ${PHASE_NAME[g.phase as Phase] ?? g.phase}`)
    .join(', ');
  return {
    pflanzungIds: aktiv.map((p) => text(p['pflanzung_id'])),
    gerechnetFuer,
    aeltester,
    phaseLeit,
  };
}

export function rechnungEingaben(
  teile: Teile,
  platzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  e: { frischwasserEc?: number; stadiumGewaehlt?: Stadium; zielEcGewaehlt?: number } = {},
): Rechnungseingaben {
  const g = gefaessAm(teile, platzId);
  const istStation = g?.['feste_dosis'] === true;
  const betriebsart = text(g?.['betriebsart']) || 'dwc';
  const phArt: PhArt = istStation
    ? 'station'
    : ((['dwc', 'konstantpegel', 'kratky', 'kratky_belueftet'].includes(betriebsart)
        ? betriebsart
        : 'dwc') as PhArt);
  const volumen = Math.round((zahl(g?.['betriebsvolumen_l']) ?? 0) * 100);
  const band = bewertungsband(teile, platzId, jetzt);
  const datenart = datenartAm(teile, platzId);
  const { k, quellen, geaendertAm } = kAus(teile, jetzt);
  const uEc = hundertstel(teil(teile, 'messgeraet')[0]?.['u_ec']) ?? 10;
  const stabil = kStabil(stabilZeilen(teile, datenart), uEc, geaendertAm);
  const anlageW = teil(teile, 'v_ec_wasser')[0];
  const wasser = ecWasser({ frischwasser: e.frischwasserEc, letzteW: hundertstel(anlageW?.['ec']) });
  const pflanzen = pflanzenAm(teile, platzId);
  const vorschlag = pflanzen.phaseLeit
    ? herstellerstadium(
        {
          ort: 'zielgefaess',
          direktsaat: (pflanzen.aeltester?.['direktsaat_platz_id'] ?? null) !== null,
          phaseLeitkultur: pflanzen.phaseLeit,
        },
        jetzt,
        zeitzone,
      )
    : undefined;
  const stadiumVorschlag = vorschlag === 'anfeuchten' ? undefined : vorschlag;
  const eingabe: NeuansatzEingabe = {
    volumen,
    stadium: e.stadiumGewaehlt ?? stadiumVorschlag,
    zielbereich: band ? { min: band.ec.min, max: band.ec.max } : undefined,
    zielEcGewaehlt: e.zielEcGewaehlt,
    ecWasser: wasser.wert,
    k,
    teilDosis: teilDosis({ kQuellen: quellen, kStabil: stabil, istStation, zielbereichKlasseD: false }),
    istStation,
    ueberHerstellerdosisBestaetigt: false,
  };
  return {
    eingabe,
    gerechnetFuer: pflanzen.gerechnetFuer,
    pflanzungIds: pflanzen.pflanzungIds,
    stadiumVorschlag,
    ...(band ? { phBand: band.ph } : {}),
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
