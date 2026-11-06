// Sortenliste und Sortendetail aus dem Bündel (UC4; Konzept 9.1, 11.3 «Tim sieht jeden ergänzten Wert mit Herkunft»;
// R1.3; Plan 37). Rein.
import type { Teile } from '../teile.ts';
import { PHASEN, PHASE_NAME, type Phase } from '../phasen/profil.ts';
import { istBelegt } from '../wissen/luecken.ts';

type Zeile = Record<string, unknown>;
const zeilen = (t: Teile, n: string): Zeile[] => (t[n] ?? []) as Zeile[];
const text = (x: unknown): string => (typeof x === 'string' ? x : '');
const zahl = (x: unknown): number | null =>
  x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? null : Number(x);
const gueltig = (z: Zeile): boolean => z['gueltig_bis'] === null || z['gueltig_bis'] === undefined;

export interface SortenZeile {
  sorteId: string;
  name: string;
  artName: string;
  vollstaendig: boolean;
  fehlend: number;
  pruefauftraege: number;
  bestandKorn: number;
}

export function sortenListe(t: Teile): SortenZeile[] {
  const arten = new Map(
    zeilen(t, 'art')
      .filter(gueltig)
      .map((a) => [text(a['art_id']), a]),
  );
  const voll = new Map(zeilen(t, 'v_vollstaendigkeit').map((v) => [text(v['sorte_id']), v]));
  return zeilen(t, 'sorte')
    .filter(gueltig)
    .map((s) => {
      const id = text(s['sorte_id']);
      const v = voll.get(id);
      const bestand = zeilen(t, 'saatgut')
        .filter((p) => p['sorte_id'] === id && !p['storniert_am'])
        .reduce((n, p) => n + (zahl(p['bestand_korn']) ?? 0), 0);
      return {
        sorteId: id,
        name: text(s['name']),
        artName: text(arten.get(text(s['art_id']))?.['name_de']) || text(s['art_id']),
        vollstaendig: v?.['vollstaendig'] === true,
        fehlend: zahl(v?.['fehlende_groessen']) ?? 0,
        pruefauftraege: zahl(v?.['pruefauftraege']) ?? 0,
        bestandKorn: bestand,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));
}

const EBENE: Record<string, string> = {
  sorte: 'Sorte',
  art: 'Art',
  kulturgruppe: 'Kulturgruppe',
  standard: 'Standard',
};
const VERMERK: Record<string, string> = {
  recherche: 'Recherche',
  tuete: 'Tüte',
  katalog: 'Katalog',
  leitkultur: 'Leitkultur',
  testbetrieb: 'Testbetrieb',
};
const GROESSE: Record<string, string> = {
  dauer: 'Dauer',
  bbch: 'BBCH',
  wechselmerkmal: 'Wechselmerkmal',
  ph: 'pH',
  ec: 'EC',
  keimart: 'Keimart',
  keimtemp: 'Keimtemperatur',
};
const EINHEIT: Record<string, string> = { dauer: ' Tage', ec: ' mS/cm', keimtemp: ' °C' };

export interface WertAnzeige {
  groesse: string;
  wert: string;
  herkunft: string;
  verlaesslichkeit: 'belegt' | 'Prüfauftrag';
  quelle?: { titel: string; link: string | null };
}

export interface SortenDetail {
  zeile: SortenZeile;
  phasen: { phase: Phase; name: string; werte: WertAnzeige[] }[];
  saat: { id: string; kulturform: string; samen: number; klasse: string; bestaetigtAm: string | null }[];
  packungen: {
    id: string;
    kaufdatum: string | null;
    bestandKorn: number | null;
    keimfaehigkeit: number | null;
  }[];
}

function wertText(z: Zeile): string {
  const g = text(z['groesse']);
  const min = zahl(z['wert_min']);
  const max = zahl(z['wert_max']);
  if (min === null) return text(z['text_wert']) || 'fehlt';
  return `${max === null || min === max ? min : `${min}–${max}`}${EINHEIT[g] ?? ''}`;
}

export function sortenDetail(t: Teile, sorteId: string): SortenDetail | undefined {
  const zeile = sortenListe(t).find((s) => s.sorteId === sorteId);
  if (!zeile) return undefined;
  const sorte = zeilen(t, 'sorte').find((s) => gueltig(s) && s['sorte_id'] === sorteId);
  const artId = text(sorte?.['art_id']);
  const quellen = new Map(zeilen(t, 'quelle').map((q) => [text(q['quelle_id']), q]));
  const soll = zeilen(t, 'v_sollwert').filter((s) => s['sorte_id'] === sorteId);
  const phasen = PHASEN.filter((p) =>
    soll.some((s) => s['phase'] === p && s['groesse'] === 'anwendbar' && s['text_wert'] === 'ja'),
  ).map((phase) => ({
    phase,
    name: PHASE_NAME[phase],
    werte: soll
      .filter((s) => s['phase'] === phase && GROESSE[text(s['groesse'])] !== undefined)
      .map((s): WertAnzeige => {
        const klasse = text(s['evidenzklasse']) || 'D';
        const q = quellen.get(text(s['quelle_id']));
        const ebene = text(s['herkunft_ebene']);
        return {
          groesse: GROESSE[text(s['groesse'])] ?? text(s['groesse']),
          wert: wertText(s),
          herkunft: [EBENE[ebene] ?? ebene, `Klasse ${klasse}`, VERMERK[text(s['vermerk'])]]
            .filter(Boolean)
            .join(' · '),
          verlaesslichkeit: istBelegt({
            herkunft_ebene: ebene,
            evidenzklasse: klasse,
            vermerk: text(s['vermerk']) || null,
          })
            ? 'belegt'
            : 'Prüfauftrag',
          ...(q ? { quelle: { titel: text(q['titel']), link: text(q['link']) || null } } : {}),
        };
      }),
  }));
  const saat = zeilen(t, 'saatempfehlung')
    .filter(
      (s) =>
        gueltig(s) &&
        ((s['ebene'] === 'sorte' && s['sorte_id'] === sorteId) ||
          (s['ebene'] === 'art' && s['art_id'] === artId)),
    )
    .map((s) => ({
      id: text(s['id']),
      kulturform: text(s['kulturform']),
      samen: zahl(s['samen_je_schwamm']) ?? 0,
      klasse: text(s['klasse_saatmenge']),
      bestaetigtAm: text(s['bestaetigt_am']) || null,
    }));
  const packungen = zeilen(t, 'saatgut')
    .filter((p) => p['sorte_id'] === sorteId && !p['storniert_am'])
    .map((p) => ({
      id: text(p['id']),
      kaufdatum: text(p['kaufdatum']) || null,
      bestandKorn: zahl(p['bestand_korn']),
      keimfaehigkeit: zahl(p['keimfaehigkeit_packung']),
    }));
  return { zeile, phasen, saat, packungen };
}
