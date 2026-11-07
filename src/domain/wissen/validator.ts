// Grundregel 9.1 und Validator 9.4 für Kandidaten der Hydroponik-Recherche (Konzept 9.1, 9.3, 9.4, 11.3,
// Erratum E8; Plan 37). Rein. Grenzen wie die Checks von profilwert und der W0-Validator (02_datenmodell.sql).
// Werte in Tausendsteln verglichen (wie profilwert numeric(7,3)), damit 6.0 bis 6.1 nicht an Gleitkommafehlern hängt (G3).
import { quelleId, type QuelleKandidat, type SaatKandidat, type WertKandidat } from '../ki/recherche.ts';
import { ecInMsCm, type EcEinheit } from '../w0/umrechnung.ts';
import type { Kulturform } from '../phasen/profil.ts';
import type { Luecke } from './luecken.ts';

export type { SaatKandidat, WertKandidat };

export type VerwerfGrund =
  | 'nicht_hydroponisch'
  | 'quelle_unzulaessig'
  | 'ohne_zitat'
  | 'keine_luecke'
  | 'ph'
  | 'ec'
  | 'ec_einheit'
  | 'bandbreite'
  | 'dauer'
  | 'wassertemp'
  | 'licht'
  | 'bbch'
  | 'text'
  | 'saatmenge'
  | 'nicht_belegt';

export type Evidenz = 'B1' | 'B2' | 'C';

export interface RechercheQuelle extends QuelleKandidat {
  quelle_id: string;
}

/** Daten für wissen_app_schreiben('recherche_wert') ohne app_version */
export interface RechercheWert {
  art_id: string;
  phase: string;
  groesse: string;
  wert_min: number | null;
  wert_typ: number | null;
  wert_max: number | null;
  text_wert: string | null;
  ec_min_quelle: number | null;
  ec_max_quelle: number | null;
  ec_einheit_quelle: string | null;
  ec_basis_quelle: string | null;
  system_quelle: string;
  umgebung_quelle: string | null;
  fundstelle: string;
  kurzzitat: string;
  evidenzklasse: Evidenz;
  quelle: RechercheQuelle;
}

/** Daten für wissen_app_schreiben('recherche_saatempfehlung') ohne sorte_id und app_version */
export interface RechercheSaat {
  kulturform: string;
  samen_je_schwamm: number;
  obergrenze_samen: number;
  pflanzen_stehen_lassen: number;
  klasse_saatmenge: 'B' | 'C';
  substrat_passung: string;
  begruendung: string;
  fundstelle: string;
  kurzzitat: string;
  quelle: RechercheQuelle;
}

type Ergebnis<T> = { ok: true; zeile: T } | { ok: false; grund: VerwerfGrund };

const HYDRO = new Set(['dwc', 'kratky', 'nft', 'ebbe_flut', 'substrat_inert']);
const EC_EINHEITEN = new Set(['mS/cm', 'µS/cm', 'ppm500', 'ppm700', 'cf']);
const EC_BASEN = new Set(['gesamt', 'zuwachs', 'unbekannt']);
const KEIMARTEN = new Set(['licht', 'dunkel', 'indifferent']);
const ZITAT_MAX = 200;
const WECHSEL_MAX = 120;

export function evidenzAusQuelle(klasse: string): Evidenz | undefined {
  switch (klasse) {
    case 'peer_review':
    case 'universitaet_beratung':
      return 'B1';
    case 'hersteller':
      return 'B2';
    case 'praxis':
      return 'C';
    default:
      return undefined;
  }
}

/** in Tausendsteln wie profilwert numeric(7,3) (Prüferbefund B7) */
const h = (x: number): number => Math.round(x * 1000);

/** Gemeinsame Prüfung von System, Quelle und Zitat (9.1, 9.3) */
function grundregel(k: {
  system: string;
  quelle: QuelleKandidat;
  fundstelle: string;
  kurzzitat: string;
}): VerwerfGrund | undefined {
  if (!HYDRO.has(k.system) || !HYDRO.has(k.quelle.anbaumethode)) return 'nicht_hydroponisch';
  if (evidenzAusQuelle(k.quelle.klasse) === undefined) return 'quelle_unzulaessig';
  if (!/^https:\/\/[^\s/]+/i.test(k.quelle.link.trim())) return 'quelle_unzulaessig';
  if (k.kurzzitat.trim() === '' || k.fundstelle.trim() === '') return 'ohne_zitat';
  if (k.kurzzitat.length > ZITAT_MAX) return 'text';
  return undefined;
}

function quelleMitId(q: QuelleKandidat): RechercheQuelle {
  return {
    quelle_id: quelleId(q.link),
    titel: q.titel,
    link: q.link.trim(),
    klasse: q.klasse,
    anbaumethode: q.anbaumethode,
  };
}

/** min ≤ typ ≤ max, alle vorhandenen Werte innerhalb [unten, oben] (in Tausendsteln) */
function bereich(
  min: number | null,
  typ: number | null,
  max: number | null,
  unten: number,
  oben: number,
): boolean {
  if (min === null || max === null) return false;
  const werte = [min, typ, max].filter((x): x is number => x !== null).map(h);
  if (werte.some((x) => x < h(unten) || x > h(oben))) return false;
  return h(min) <= h(max) && (typ === null || (h(min) <= h(typ) && h(typ) <= h(max)));
}

function bandbreiteOk(min: number, max: number): boolean {
  const b = h(max) - h(min);
  return b >= 200 && b <= 1200;
}

function wertGrenzen(
  k: WertKandidat,
  ecObergrenze: number,
):
  | { grund: VerwerfGrund }
  | {
      werte: Pick<
        RechercheWert,
        | 'wert_min'
        | 'wert_typ'
        | 'wert_max'
        | 'text_wert'
        | 'ec_min_quelle'
        | 'ec_max_quelle'
        | 'ec_einheit_quelle'
        | 'ec_basis_quelle'
      >;
    } {
  const ohneEc = { ec_min_quelle: null, ec_max_quelle: null, ec_einheit_quelle: null, ec_basis_quelle: null };
  const zahlen = {
    wert_min: k.wert_min,
    wert_typ: k.wert_typ,
    wert_max: k.wert_max,
    text_wert: null,
    ...ohneEc,
  };
  switch (k.groesse) {
    case 'ph':
      if (
        k.wert_min === null ||
        k.wert_max === null ||
        !bereich(k.wert_min, k.wert_typ, k.wert_max, 5.2, 7.0)
      )
        return { grund: 'ph' };
      if (!bandbreiteOk(k.wert_min, k.wert_max)) return { grund: 'bandbreite' };
      return { werte: zahlen };
    case 'ec': {
      if (!k.ec_einheit || !EC_EINHEITEN.has(k.ec_einheit) || !k.ec_basis || !EC_BASEN.has(k.ec_basis))
        return { grund: 'ec_einheit' };
      if (k.wert_min === null || k.wert_max === null) return { grund: 'ec' };
      const e = k.ec_einheit as EcEinheit;
      const min = ecInMsCm(k.wert_min, e);
      const max = ecInMsCm(k.wert_max, e);
      const typ = k.wert_typ === null ? null : ecInMsCm(k.wert_typ, e);
      if (!bereich(min, typ, max, 0.4, ecObergrenze)) return { grund: 'ec' };
      if (!bandbreiteOk(min, max)) return { grund: 'bandbreite' };
      return {
        werte: {
          wert_min: min,
          wert_typ: typ,
          wert_max: max,
          text_wert: null,
          ec_min_quelle: k.wert_min,
          ec_max_quelle: k.wert_max,
          ec_einheit_quelle: k.ec_einheit,
          ec_basis_quelle: k.ec_basis,
        },
      };
    }
    case 'dauer':
      if (k.wert_min === null || k.wert_min <= 0 || !bereich(k.wert_min, k.wert_typ, k.wert_max, 0, 10_000))
        return { grund: 'dauer' };
      return { werte: zahlen };
    case 'wassertemp':
      if (!bereich(k.wert_min, k.wert_typ, k.wert_max, 10, 28)) return { grund: 'wassertemp' };
      return { werte: zahlen };
    case 'keimtemp':
      // Keimtemperatur in °C (A): 5 bis 35, min ≤ max
      if (!bereich(k.wert_min, k.wert_typ, k.wert_max, 5, 35)) return { grund: 'wassertemp' };
      return { werte: zahlen };
    case 'licht_h':
      if (!bereich(k.wert_min, k.wert_typ, k.wert_max, 0, 24)) return { grund: 'licht' };
      return { werte: zahlen };
    case 'bbch':
      if (
        k.wert_min === null ||
        k.wert_max === null ||
        !Number.isInteger(k.wert_min) ||
        !Number.isInteger(k.wert_max) ||
        !bereich(k.wert_min, null, k.wert_max, 0, 99)
      )
        return { grund: 'bbch' };
      return { werte: { ...zahlen, wert_typ: null } };
    case 'wechselmerkmal': {
      const t = (k.text_wert ?? '').trim();
      if (t === '' || t.length > WECHSEL_MAX) return { grund: 'text' };
      return { werte: { ...zahlen, wert_min: null, wert_typ: null, wert_max: null, text_wert: t } };
    }
    case 'keimart': {
      const t = (k.text_wert ?? '').trim();
      if (!KEIMARTEN.has(t)) return { grund: 'text' };
      return { werte: { ...zahlen, wert_min: null, wert_typ: null, wert_max: null, text_wert: t } };
    }
    default:
      return { grund: 'keine_luecke' };
  }
}

export function wertPruefen(
  k: WertKandidat,
  kontext: { luecken: readonly Luecke[]; ecObergrenze: number; artId: string },
): Ergebnis<RechercheWert> {
  const g = grundregel(k);
  if (g) return { ok: false, grund: g };
  if (!kontext.luecken.some((l) => l.phase === k.phase && l.groesse === k.groesse))
    return { ok: false, grund: 'keine_luecke' };
  const evidenz = evidenzAusQuelle(k.quelle.klasse);
  if (evidenz === undefined) return { ok: false, grund: 'quelle_unzulaessig' };
  const r = wertGrenzen(k, kontext.ecObergrenze);
  if ('grund' in r) return { ok: false, grund: r.grund };
  return {
    ok: true,
    zeile: {
      art_id: kontext.artId,
      phase: k.phase,
      groesse: k.groesse,
      ...r.werte,
      system_quelle: k.system,
      umgebung_quelle: k.umgebung,
      fundstelle: k.fundstelle.trim(),
      kurzzitat: k.kurzzitat.trim(),
      evidenzklasse: evidenz,
      quelle: quelleMitId(k.quelle),
    },
  };
}

export function saatPruefen(
  k: SaatKandidat,
  kontext: { kulturformen: readonly Kulturform[] | readonly string[] },
): Ergebnis<RechercheSaat> {
  const g = grundregel(k);
  if (g) return { ok: false, grund: g };
  if (!(kontext.kulturformen as readonly string[]).includes(k.kulturform))
    return { ok: false, grund: 'keine_luecke' };
  const { samen_je_schwamm: s, obergrenze_samen: o, pflanzen_stehen_lassen: p } = k;
  if (![s, o, p].every(Number.isInteger) || s < 1 || o < s || o > 25 || p < 1 || p > s)
    return { ok: false, grund: 'saatmenge' };
  const klasse = k.substrat_gleich ? 'B' : 'C';
  return {
    ok: true,
    zeile: {
      kulturform: k.kulturform,
      samen_je_schwamm: s,
      obergrenze_samen: o,
      pflanzen_stehen_lassen: p,
      klasse_saatmenge: klasse,
      substrat_passung: k.substrat_gleich ? 'gleich' : 'abweichend',
      begruendung: `Recherche: ${k.quelle.titel}`,
      fundstelle: k.fundstelle.trim(),
      kurzzitat: k.kurzzitat.trim(),
      quelle: quelleMitId(k.quelle),
    },
  };
}
