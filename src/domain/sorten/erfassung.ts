// Sortenformular der Maske «Neue Sorte» (UC4 Ablauf und Varianten, UC4-AK2; R1.2, R1.3, R12.3; Konzept 8.1 Regel 6,
// 8.2, 11.3, 11.4; Plan 37). Rein. Wissenszeilen gehen über wissen_app_schreiben(), Packung und Feldprotokoll als
// ein Vorgang über schreiben() (idempotent über client_id).
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import type { Kulturform } from '../phasen/profil.ts';
import { KI_FELDER, feldTexte, type KiFeld } from '../ki/schema.ts';
import { feldStatus, kiUebernehmen, type KiErgebnis } from '../ki/uebernahme.ts';
import { KULTURFORMEN_JE_TYP, type Kulturtyp } from '../wissen/luecken.ts';

export type { Kulturtyp };

export interface SortenFormular {
  tuete: Partial<Record<KiFeld, string>>;
  artId?: string | undefined;
  neueArt?: { nameDe: string; nameWiss: string; kulturgruppeId: string } | undefined;
  kulturtyp?: Kulturtyp | undefined;
  wuchshoeheCm: string;
  wuchsform: string;
  fruehzeitigkeitD: string;
  katalogLink: string;
  shopLink: string;
  kaufdatum: string;
  keimfaehigkeitProzent: string;
  bestandKorn: string;
  saatVonHand?: {
    quelle: 'tuete' | 'standard';
    kulturform: Kulturform;
    samenJeSchwamm: string;
    bestaetigen: boolean;
  };
}

export type KiLauf = Extract<KiErgebnis, { ergebnis: 'ok' }> & { fotopfade: readonly string[] };

export interface ArtZeile {
  art_id: string;
  name_de: string;
  name_wiss: string;
  kulturgruppe_id: string;
  kulturformen_erlaubt: readonly string[];
  gueltig_bis: string | null;
}
export interface SorteZeile {
  sorte_id: string;
  name: string;
  art_id: string;
  gueltig_bis: string | null;
}

export type WissenAufruf = { aktion: string; daten: Record<string, unknown> };

export const WUCHSFORMEN = ['aufrecht', 'buschig', 'haengend', 'rosette'] as const;

export function leeresFormular(): SortenFormular {
  return {
    tuete: {},
    wuchshoeheCm: '',
    wuchsform: '',
    fruehzeitigkeitD: '',
    katalogLink: '',
    shopLink: '',
    kaufdatum: '',
    keimfaehigkeitProzent: '',
    bestandKorn: '',
  };
}

const leer = (w: string | undefined): boolean => w === undefined || w.trim() === '';
const norm = (w: string): string => w.trim().replace(/\s+/g, ' ').toLowerCase();

/** KI-Werte nur in leere Felder; bei «von Hand» bleibt alles stehen (UC4-AK2) */
export function formularNachKi(
  f: SortenFormular,
  ergebnis: KiErgebnis,
): { formular: SortenFormular; vorschlag: Partial<Record<KiFeld, string>>; hinweis?: string } {
  const r = kiUebernehmen(f.tuete, ergebnis);
  const formular: SortenFormular = { ...f, tuete: { ...r.eingaben, ...r.vorschlag } };
  return r.hinweis === undefined
    ? { formular, vorschlag: r.vorschlag }
    : { formular, vorschlag: r.vorschlag, hinweis: r.hinweis };
}

/** Art aus dem KI-Feld: wissenschaftlicher Name ohne Autorkürzel oder deutscher Name */
export function artVorschlagen(
  arten: readonly ArtZeile[],
  kiArt: string | null | undefined,
): string | undefined {
  if (!kiArt || kiArt.trim() === '') return undefined;
  const woerter = norm(kiArt)
    .replace(/[.,;()]/g, ' ')
    .split(' ')
    .filter(Boolean);
  const gueltig = arten.filter((a) => a.gueltig_bis === null);
  const wiss = woerter.slice(0, 2).join(' ');
  const treffer =
    gueltig.find((a) => norm(a.name_wiss) === wiss) ??
    gueltig.find((a) => norm(a.name_de) === norm(kiArt)) ??
    gueltig.find((a) => norm(a.name_wiss) === norm(kiArt));
  return treffer?.art_id;
}

export function vorhandeneSorte(
  sorten: readonly SorteZeile[],
  name: string,
  artId: string,
): string | undefined {
  const n = norm(name);
  return sorten.find((s) => s.gueltig_bis === null && s.art_id === artId && norm(s.name) === n)?.sorte_id;
}

/** art_id einer neuen Art aus dem wissenschaftlichen Namen (A18) */
export function neueArtId(nameWiss: string): string {
  return norm(nameWiss)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function ganzzahl(w: string): number | undefined {
  const t = w.trim();
  return /^-?\d+$/.test(t) ? Number(t) : undefined;
}
function dezimal(w: string): number | undefined {
  const t = w.trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
}

function kulturformenDerArt(f: SortenFormular, arten: readonly ArtZeile[]): readonly string[] | undefined {
  if (f.artId) return arten.find((a) => a.art_id === f.artId && a.gueltig_bis === null)?.kulturformen_erlaubt;
  return undefined;
}

export function formularPruefen(
  f: SortenFormular,
  arten: readonly ArtZeile[],
): { feld: string; text: string }[] {
  const fehler: { feld: string; text: string }[] = [];
  if (leer(f.tuete.name)) fehler.push({ feld: 'name', text: 'Gib den Namen der Sorte ein' });
  if (!f.artId && !f.neueArt) fehler.push({ feld: 'art', text: 'Wähle die Art' });
  if (f.neueArt) {
    if (leer(f.neueArt.nameDe)) fehler.push({ feld: 'neueArt.nameDe', text: 'Gib den deutschen Namen ein' });
    if (leer(f.neueArt.nameWiss))
      fehler.push({ feld: 'neueArt.nameWiss', text: 'Gib den wissenschaftlichen Namen ein' });
    if (leer(f.neueArt.kulturgruppeId))
      fehler.push({ feld: 'neueArt.kulturgruppeId', text: 'Wähle die Kulturgruppe' });
  }
  if (!f.kulturtyp) fehler.push({ feld: 'kulturtyp', text: 'Wähle den Kulturtyp' });
  else {
    const formen = kulturformenDerArt(f, arten);
    if (formen && !KULTURFORMEN_JE_TYP[f.kulturtyp].some((k) => formen.includes(k)))
      fehler.push({ feld: 'kulturtyp', text: 'Kulturtyp passt nicht zur Art' });
  }
  if (!leer(f.wuchshoeheCm)) {
    const w = dezimal(f.wuchshoeheCm);
    if (w === undefined || w <= 0 || w > 500)
      fehler.push({ feld: 'wuchshoeheCm', text: 'Wuchshöhe in cm, 1 bis 500' });
  }
  if (!leer(f.wuchsform) && !(WUCHSFORMEN as readonly string[]).includes(f.wuchsform))
    fehler.push({ feld: 'wuchsform', text: 'Wähle eine Wuchsform' });
  if (!leer(f.fruehzeitigkeitD) && ganzzahl(f.fruehzeitigkeitD) === undefined)
    fehler.push({ feld: 'fruehzeitigkeitD', text: 'Frühzeitigkeit in ganzen Tagen' });
  for (const [feld, link] of [
    ['katalogLink', f.katalogLink],
    ['shopLink', f.shopLink],
  ] as const) {
    if (!leer(link) && !/^https?:\/\/\S+$/i.test(link.trim()))
      fehler.push({ feld, text: 'Gib eine Adresse mit https:// ein' });
  }
  if (!leer(f.kaufdatum) && !/^\d{4}-\d{2}-\d{2}$/.test(f.kaufdatum.trim()))
    fehler.push({ feld: 'kaufdatum', text: 'Datum als JJJJ-MM-TT' });
  if (!leer(f.keimfaehigkeitProzent)) {
    const k = dezimal(f.keimfaehigkeitProzent);
    if (k === undefined || k < 0 || k > 100)
      fehler.push({ feld: 'keimfaehigkeitProzent', text: 'Keimfähigkeit in %, 0 bis 100' });
  }
  if (!leer(f.bestandKorn)) {
    const b = ganzzahl(f.bestandKorn);
    if (b === undefined || b < 0) fehler.push({ feld: 'bestandKorn', text: 'Bestand in ganzen Korn, ab 0' });
  }
  if (f.saatVonHand) {
    const s = ganzzahl(f.saatVonHand.samenJeSchwamm);
    if (s === undefined || s < 1 || s > 25)
      fehler.push({ feld: 'saatVonHand', text: 'Samen je Schwamm, 1 bis 25' });
  }
  return fehler;
}

/** «15-20» oder «15» → min, max */
function spanne(w: string | undefined): { min: number; max: number } | undefined {
  if (w === undefined || leer(w)) return undefined;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*(\d+(?:[.,]\d+)?))?\s*$/.exec(w);
  if (!m || m[1] === undefined) return undefined;
  const min = Number(m[1].replace(',', '.'));
  const max = m[2] === undefined ? min : Number(m[2].replace(',', '.'));
  return min <= max ? { min, max } : undefined;
}

export function artIdVon(f: SortenFormular): string | undefined {
  return f.neueArt ? neueArtId(f.neueArt.nameWiss) : f.artId;
}

export function erfassungBauen(
  f: SortenFormular,
  ids: { sorteId: string; saatgutId: string; clientIds: () => string },
  ki: KiLauf | undefined,
  kontext: { jetzt: Date; zeitzone: string; appVersion: string },
): { wissen: WissenAufruf[]; vorgang: Vorgang } {
  const appVersion = kontext.appVersion;
  const artId = artIdVon(f) ?? '';
  const wissen: WissenAufruf[] = [];
  if (f.neueArt) {
    wissen.push({
      aktion: 'art_neu',
      daten: {
        art_id: artId,
        name_de: f.neueArt.nameDe.trim(),
        name_wiss: f.neueArt.nameWiss.trim(),
        kulturgruppe_id: f.neueArt.kulturgruppeId,
        app_version: appVersion,
      },
    });
  }
  const hoehe = dezimal(f.wuchshoeheCm);
  const frueh = ganzzahl(f.fruehzeitigkeitD);
  const sorte: Record<string, unknown> = {
    sorte_id: ids.sorteId,
    name: (f.tuete.name ?? '').trim(),
    art_id: artId,
    kulturtyp: f.kulturtyp,
    app_version: appVersion,
  };
  if (hoehe !== undefined) sorte['wuchshoehe_max_mm'] = Math.round(hoehe * 10);
  if (!leer(f.wuchsform)) sorte['wuchsform'] = f.wuchsform;
  if (frueh !== undefined) sorte['fruehzeitigkeit_relativ_d'] = frueh;
  if (!leer(f.katalogLink)) sorte['katalog_link'] = f.katalogLink.trim();
  if (!leer(f.shopLink)) sorte['shop_link'] = f.shopLink.trim();
  wissen.push({ aktion: 'sorte_neu', daten: sorte });

  const keimart = f.tuete.keimart?.trim();
  if (keimart && ['licht', 'dunkel', 'indifferent'].includes(keimart)) {
    wissen.push({
      aktion: 'tuetenwert',
      daten: { sorte_id: ids.sorteId, groesse: 'keimart', text_wert: keimart, app_version: appVersion },
    });
  }
  const temp = spanne(f.tuete.keimtemperatur);
  if (temp) {
    wissen.push({
      aktion: 'tuetenwert',
      daten: {
        sorte_id: ids.sorteId,
        groesse: 'keimtemp',
        wert_min: temp.min,
        wert_typ: null,
        wert_max: temp.max,
        app_version: appVersion,
      },
    });
  }
  if (f.saatVonHand) {
    const samen = ganzzahl(f.saatVonHand.samenJeSchwamm) ?? 1;
    wissen.push({
      aktion: 'saatempfehlung_neu',
      daten: {
        ebene: 'sorte',
        sorte_id: ids.sorteId,
        art_id: artId,
        kulturform: f.saatVonHand.kulturform,
        samen_je_schwamm: samen,
        obergrenze_samen: samen,
        pflanzen_stehen_lassen: 1,
        klasse_saatmenge: f.saatVonHand.quelle === 'tuete' ? 'C' : 'D',
        bestaetigt: f.saatVonHand.bestaetigen,
        app_version: appVersion,
      },
    });
  }

  const vorgang: Schritt[] = [];
  const keim = dezimal(f.keimfaehigkeitProzent);
  const bestand = ganzzahl(f.bestandKorn);
  vorgang.push({
    art: 'neu',
    tabelle: 'saatgut',
    felder: {
      client_id: ids.clientIds(),
      id: ids.saatgutId,
      sorte_id: ids.sorteId,
      kaufdatum: leer(f.kaufdatum) ? null : f.kaufdatum.trim(),
      bestand_korn: bestand ?? null,
      keimfaehigkeit_packung: keim === undefined ? null : Math.round(keim) / 100,
    },
  });
  if (ki)
    vorgang.push(
      ...feldprotokoll(ki, f.tuete, { sorteId: ids.sorteId, saatgutId: ids.saatgutId }, ids.clientIds),
    );
  return { wissen, vorgang };
}

/** je KI-Feld eine Zeile ki_feldprotokoll (8.2); bewertung_eval bleibt leer (A17) */
export function feldprotokoll(
  ki: KiLauf,
  final: Partial<Record<KiFeld, string>>,
  bezug: { sorteId: string; saatgutId: string },
  clientIds: () => string,
): Schritt[] {
  const texte = feldTexte(ki.felder);
  return KI_FELDER.map((feld) => {
    const wertKi = texte[feld];
    const f = final[feld];
    const wertFinal = f === undefined || leer(f) ? null : f.trim();
    return {
      art: 'neu' as const,
      tabelle: 'ki_feldprotokoll' as const,
      felder: {
        client_id: clientIds(),
        sorte_id: bezug.sorteId,
        saatgut_id: bezug.saatgutId,
        feld,
        wert_ki: wertKi,
        wert_final: wertFinal,
        status: feldStatus(wertKi, wertFinal),
        modell: ki.modell,
        dauer_ms: ki.dauerMs,
        fotopfad: ki.fotopfade[0] ?? null,
      },
    };
  });
}
