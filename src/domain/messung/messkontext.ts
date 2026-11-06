// Kontext der Messmaske für einen Ort (Plan 26 «Datenfluss in der Maske»; UC9 Ablauf 1, R2.2, R10.2, R10.3;
// A11, A17). Rein: liest die Teile des Bündels in der Form von PostgREST, `jetzt` als Parameter.
import { inHundertstel, type Hundertstel } from '../bewertung/bewertung.ts';
import { istKratky, type Messart } from '../bewertung/hinweise.ts';
import { bewertungsband, type Sollband } from '../bewertung/sollband.ts';
import { istVeraltet, type AnsatzZeile } from '../bewertung/verlauf.ts';
import type { Ort } from '../ort.ts';
import type { Teile } from '../teile.ts';
import type { Zeitzone } from '../zeit.ts';
import type { Groesse } from './eingabe.ts';

export interface Vorher {
  wert: Hundertstel;
  giltAb: string;
  veraltet: boolean;
}

export interface Messkontext {
  art: Messart;
  kopfzeile: string;
  kratkyZeile?: string;
  /** Kulturgruppen der aktiven Pflanzungen, alphabetisch, mit « und »; '' ohne Pflanzungen */
  hierWaechst: string;
  sollband?: Sollband;
  vorher: Partial<Record<Groesse, Vorher>>;
  /** die jüngste gültige Messung am Platz ist veraltet (Banner, A15) */
  letzteVeraltet: boolean;
  ansaetze: AnsatzZeile[];
  uEc: Hundertstel;
  uPh: Hundertstel;
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');

/** Fenster des Bündels für «vorher» (A11) */
const FENSTER_MS = 14 * 86_400_000;

const BETRIEBSART_NAME: Readonly<Record<string, string>> = {
  dwc: 'DWC',
  kratky: 'Kratky',
  kratky_belueftet: 'Kratky belüftet',
  konstantpegel: 'Konstantpegel',
  station: 'Station',
  messstelle: 'Ausgangswasser',
};

function artVon(teile: Teile, ort: Ort): Messart {
  if (ort.rolle === 'messstelle') return 'messstelle';
  const g = teil(teile, 'gefaess').find(
    (x) =>
      x['platz_id'] === ort.platzId &&
      (x['gueltig_bis'] ?? null) === null &&
      (x['storniert_am'] ?? null) === null,
  );
  if (g?.['feste_dosis'] === true) return 'station';
  return ort.betriebsart ?? (text(g?.['betriebsart']) || 'dwc');
}

/** A17: Kulturgruppen der aktiven Pflanzungen am Platz (auch Direktsaat ohne Ortsereignis) */
export function hierWaechstAm(teile: Teile, platzId: string): string {
  const saetze = new Map(teil(teile, 'satz').map((s) => [s['id'], s]));
  const sorten = teil(teile, 'sorte');
  const arten = teil(teile, 'art').filter((a) => (a['gueltig_bis'] ?? null) === null);
  const gruppen = teil(teile, 'kulturgruppe');
  const namen = new Set<string>();
  for (const z of teil(teile, 'v_pflanzung_zustand')) {
    if (z['status'] !== 'aktiv') continue;
    const satz = saetze.get(z['satz_id']);
    const platz = z['platz_id'] ?? satz?.['direktsaat_platz_id'] ?? null;
    if (platz !== platzId || !satz) continue;
    const sorte = sorten.find((s) => (s['sorte_id'] ?? s['id']) === satz['sorte_id']);
    const art = arten.find((a) => a['art_id'] === sorte?.['art_id']);
    const gruppe = gruppen.find((k) => k['kulturgruppe_id'] === art?.['kulturgruppe_id']);
    const name = text(gruppe?.['name']);
    if (name) namen.add(name);
  }
  return [...namen].sort((a, b) => a.localeCompare(b, 'de')).join(' und ');
}

function ansatzZeilen(teile: Teile, platzId: string): AnsatzZeile[] {
  return teil(teile, 'naehrloesungsansatz')
    .filter((a) => a['platz_id'] === platzId)
    .map((a) => ({
      id: text(a['id']),
      platz_id: platzId,
      typ: a['typ'] as AnsatzZeile['typ'],
      status: text(a['status']),
      begonnen_am: text(a['begonnen_am']),
      kontrollmessung_id: (a['kontrollmessung_id'] as string | null | undefined) ?? null,
      endmessung_id: (a['endmessung_id'] as string | null | undefined) ?? null,
      storniert_am: (a['storniert_am'] as string | null | undefined) ?? null,
    }));
}

const SPALTE: Readonly<Record<Groesse, string>> = { ph: 'ph', ec: 'ec', temperatur: 'temperatur' };

export function messkontext(teile: Teile, ort: Ort, jetzt: Date, zeitzone: Zeitzone): Messkontext {
  void zeitzone;
  const art = artVon(teile, ort);
  const hierWaechst = ort.rolle === 'messstelle' ? '' : hierWaechstAm(teile, ort.platzId);
  const ansaetze = ansatzZeilen(teile, ort.platzId);
  const sollband = ort.rolle === 'messstelle' ? undefined : bewertungsband(teile, ort.platzId, jetzt);

  // gültige Messungen des Platzes im Fenster, jüngste zuerst
  const ab = jetzt.getTime() - FENSTER_MS;
  const messungen = teil(teile, 'messung')
    .filter((m) => {
      const t = Date.parse(text(m['gilt_ab']));
      return (
        m['platz_id'] === ort.platzId &&
        (m['storniert_am'] ?? null) === null &&
        t >= ab &&
        t <= jetzt.getTime()
      );
    })
    .sort((a, b) => Date.parse(text(b['gilt_ab'])) - Date.parse(text(a['gilt_ab'])));
  const veraltet = (m: Zeile) =>
    istVeraltet(
      {
        id: text(m['id']),
        platz_id: ort.platzId,
        gilt_ab: text(m['gilt_ab']),
        ansatz_id: (m['ansatz_id'] as string | null | undefined) ?? null,
      },
      ansaetze,
    );
  const vorher: Partial<Record<Groesse, Vorher>> = {};
  for (const g of ['ph', 'ec', 'temperatur'] as const) {
    const m = messungen.find((x) => x[SPALTE[g]] !== null && x[SPALTE[g]] !== undefined);
    if (m)
      vorher[g] = {
        wert: inHundertstel(m[SPALTE[g]] as number | string),
        giltAb: text(m['gilt_ab']),
        veraltet: veraltet(m),
      };
  }
  const letzte = messungen[0];

  const geraet = teil(teile, 'messgeraet')[0];
  const name = BETRIEBSART_NAME[art] ?? art;
  const kratkyZeile =
    art === 'kratky_belueftet'
      ? 'nach einem Pumpintervall messen'
      : art === 'kratky'
        ? 'zuerst umrühren'
        : undefined;
  return {
    art,
    kopfzeile: hierWaechst ? `${hierWaechst} · ${name}` : name,
    ...(kratkyZeile && istKratky(art) ? { kratkyZeile } : {}),
    hierWaechst,
    ...(sollband ? { sollband } : {}),
    vorher,
    letzteVeraltet: letzte ? veraltet(letzte) : false,
    ansaetze,
    uEc: geraet ? inHundertstel(geraet['u_ec'] as number | string) : 10,
    uPh: geraet ? inHundertstel(geraet['u_ph'] as number | string) : 10,
  };
}
