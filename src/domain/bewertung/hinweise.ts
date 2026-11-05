// Warnhinweise der Ergebniszone mit Folge und Massnahme je Betriebsart (Plan 26; R10.4 Kratky, R10.5 Tabelle in
// Konzept 7.5; 05_masken.md 5; A4 bis A10). Rein: `jetzt` und `zeitzone` als Parameter, Hundertstel (G3).
import type { Betriebsart } from '../ort.ts';
import type { Groesse } from '../messung/eingabe.ts';
import { kalendertag, tageZwischen, type Zeitzone } from '../zeit.ts';
import { alsText, RANG, type Bewertung, type Hundertstel } from './bewertung.ts';
import type { Sollband } from './sollband.ts';
import type { AnsatzZeile } from './verlauf.ts';

export interface Hinweis {
  ausloeser:
    | 'ph_hoch'
    | 'ph_tief'
    | 'ph_trend'
    | 'ph_fall'
    | 'ec_hoch'
    | 'ec_tief'
    | 'temp_hoch'
    | 'temp_tief'
    | 'eisen'
    | 'ph_anstieg'
    | 'leitungswasser';
  text: string;
  /** nur der Sollwert («Sollwert deiner Anlage 6.0–6.5.») für die Ergebniszone, die den Messwert schon zeigt */
  sollwert?: string;
  folge: string;
  massnahme: string;
  ton: 'info' | 'warn' | 'danger';
}

export type Messart = Betriebsart | 'station' | 'messstelle';

/** R10.4 Beobachtungsband Kratky pH 5.50 bis 6.80: steuert nur Hinweis und Massnahme */
const KRATKY_PH_MIN = 550;
const KRATKY_PH_MAX = 680;
/** R10.4 Anstieg je Woche über 0.20 */
const ANSTIEG_JE_WOCHE = 20;

export const istKratky = (art: Messart) => art === 'kratky' || art === 'kratky_belueftet';

function massnahmeEc(art: Messart, richtung: 'hoch' | 'tief'): string {
  if (art === 'station') return 'Lösung mit fester Dosis wechseln';
  if (istKratky(art))
    return richtung === 'hoch'
      ? 'beim nächsten Nachfüllen nur Wasser'
      : 'beim nächsten Nachfüllen halbe Konzentration';
  return richtung === 'hoch' ? 'Teilwechsel; Verdünnen mit Leitungswasser hebt den pH' : 'Restdosis geben';
}

interface Kandidat {
  hinweis: Hinweis;
  /** Stufe 0 bis 2 für Bandhinweise nach Bewertung, 3 für Temperatur- und Verlaufshinweise */
  stufe: number;
  /** pH vor EC vor °C */
  reihe: number;
}

const REIHE: Readonly<Record<Groesse, number>> = { ph: 0, ec: 1, temperatur: 2 };

/** gültige Ansätze nach `seit` bis `jetzt` */
function ansatzSeit(ansaetze: readonly AnsatzZeile[], seit: string, jetzt: Date): boolean {
  const von = Date.parse(seit);
  return ansaetze.some(
    (a) =>
      a.storniert_am === null &&
      Date.parse(a.begonnen_am) > von &&
      Date.parse(a.begonnen_am) <= jetzt.getTime(),
  );
}

export function hinweise(
  e: {
    betriebsart: Messart;
    werte: Partial<Record<Groesse, Hundertstel>>;
    bewertungen: Partial<Record<Groesse, Bewertung>>;
    sollband?: Sollband;
    vorher: Partial<Record<Groesse, { wert: Hundertstel; giltAb: string }>>;
    ansaetze: readonly AnsatzZeile[];
    /** u_pH in Hundertsteln; ein Anstieg innerhalb der Messunsicherheit gibt keinen Hinweis (A, Runde 1 Befund 8) */
    uPh?: Hundertstel;
  },
  jetzt: Date,
  zeitzone: Zeitzone,
): { hinweise: Hinweis[]; alarm: boolean } {
  const kratky = istKratky(e.betriebsart);
  const ton = (b: Bewertung | undefined): Hinweis['ton'] =>
    kratky ? 'info' : b === 'ausserhalb' ? 'danger' : 'warn';
  const kandidaten: Kandidat[] = [];
  const sb = e.sollband;

  const bandText = (g: Groesse, wert: Hundertstel) =>
    sb
      ? `Gemessen ${alsText(g, wert)}, Sollwert deiner Anlage ${alsText(g, sb[g].min)}–${alsText(g, sb[g].max)}.`
      : `Gemessen ${alsText(g, wert)}.`;

  const band = (g: Groesse, ausloeser: Hinweis['ausloeser'], folge: string, massnahme: string): void => {
    const wert = e.werte[g];
    const b = e.bewertungen[g];
    if (wert === undefined || b === undefined) return;
    kandidaten.push({
      hinweis: {
        ausloeser,
        text: bandText(g, wert),
        ...(sb
          ? { sollwert: `Sollwert deiner Anlage ${alsText(g, sb[g].min)}–${alsText(g, sb[g].max)}.` }
          : {}),
        folge,
        massnahme,
        ton: ton(b),
      },
      stufe: RANG[b],
      reihe: REIHE[g],
    });
  };

  // pH gegen das Band (R10.5); bei Kratky über dem Band nur der Eisenhinweis über 6.80 (R10.4)
  const ph = e.werte.ph;
  if (ph !== undefined && sb && e.bewertungen.ph && e.bewertungen.ph !== 'gruen') {
    if (ph > sb.ph.max && !kratky)
      band(
        'ph',
        'ph_hoch',
        'Eisen wird schlechter aufgenommen, junge Blätter können gelb werden',
        'pH schrittweise senken, nach 15 min nachmessen',
      );
    // bei Kratky erst unter dem Beobachtungsband 5.50 (R10.4, Runde 1 Befund 4)
    if (ph < sb.ph.min && (!kratky || ph < KRATKY_PH_MIN))
      band('ph', 'ph_tief', 'Mangel an Magnesium und Kalzium möglich', 'pH vorsichtig anheben');
    // R10.4: im Beobachtungsband ausserhalb des Sollbands der Trend als Massnahme (Runde 1 Befund 1)
    const v = e.vorher.ph;
    if (kratky && v && ph >= KRATKY_PH_MIN && ph <= KRATKY_PH_MAX)
      band(
        'ph',
        'ph_trend',
        'Im Beobachtungsband für Kratky 5.5–6.8',
        `Trend beobachten: vorher ${alsText('ph', v.wert)}, jetzt ${alsText('ph', ph)}`,
      );
  }
  if (ph !== undefined && kratky && ph > KRATKY_PH_MAX)
    kandidaten.push({
      hinweis: {
        ausloeser: 'eisen',
        text: bandText('ph', ph),
        folge: 'Eisen- und Mangansperre',
        massnahme: 'pH schrittweise senken, nach 15 min nachmessen',
        ton: 'info',
      },
      stufe: RANG[e.bewertungen.ph ?? 'ausserhalb'],
      reihe: REIHE.ph,
    });

  // EC gegen das Band (R10.5, R4.5, R4.10; A7)
  const ec = e.werte.ec;
  if (ec !== undefined && sb && e.bewertungen.ec && e.bewertungen.ec !== 'gruen') {
    if (ec > sb.ec.max) band('ec', 'ec_hoch', 'Gefahr von Salzstress', massnahmeEc(e.betriebsart, 'hoch'));
    if (ec < sb.ec.min) band('ec', 'ec_tief', 'Nährstoffmangel', massnahmeEc(e.betriebsart, 'tief'));
  }

  const nachher = (h: Hinweis, g: Groesse) => kandidaten.push({ hinweis: h, stufe: 3, reihe: REIHE[g] });

  // Wassertemperatur (R10.5; A8), nicht an der Messstelle W
  const t = e.werte.temperatur;
  if (t !== undefined && e.betriebsart !== 'messstelle') {
    if (t > 2400)
      nachher(
        {
          ausloeser: 'temp_hoch',
          text: `Gemessen ${alsText('temperatur', t)} °C.`,
          folge: 'Pythium-Risiko; Wärme von Leisten und Raum',
          massnahme: 'Belüftung prüfen, Wurzeln ansehen, Wärmesperre; Aufgabe Wärme prüfen folgt',
          ton: ton(e.bewertungen.temperatur),
        },
        'temperatur',
      );
    if (t < 1600)
      nachher(
        {
          ausloeser: 'temp_tief',
          text: `Gemessen ${alsText('temperatur', t)} °C.`,
          folge: 'zu kalt für Tomate und Chili',
          massnahme: 'Raum heizen, Nachfüllwasser temperieren',
          ton: ton(e.bewertungen.temperatur),
        },
        'temperatur',
      );
  }

  // Verlauf pH gegen die vorherige Messung ohne Ansatz dazwischen (R10.4 Anstieg, R10.5 Fall; A5, A6)
  const phVorher = e.vorher.ph;
  if (ph !== undefined && phVorher && !ansatzSeit(e.ansaetze, phVorher.giltAb, jetzt)) {
    const delta = ph - phVorher.wert;
    if (kratky) {
      const tage = Math.max(
        1,
        tageZwischen(kalendertag(new Date(phVorher.giltAb), zeitzone), kalendertag(jetzt, zeitzone)),
      );
      if (delta > (e.uPh ?? 10) && delta * 7 > ANSTIEG_JE_WOCHE * tage)
        nachher(
          {
            ausloeser: 'ph_anstieg',
            text: `pH vorher ${alsText('ph', phVorher.wert)}, jetzt ${alsText('ph', ph)}.`,
            folge: 'pH steigt schneller als 0.2 je Woche',
            massnahme: 'Wurzeln und Lösung prüfen',
            ton: 'info',
          },
          'ph',
        );
    }
    if (e.betriebsart !== 'messstelle' && delta <= -30)
      nachher(
        {
          ausloeser: 'ph_fall',
          text: `pH vorher ${alsText('ph', phVorher.wert)}, jetzt ${alsText('ph', ph)}.`,
          folge: 'Frühsignal für Wurzelfäule',
          massnahme: 'Wurzeln und Geruch prüfen',
          ton: kratky ? 'info' : 'warn',
        },
        'ph',
      );
  }

  // Leitungswasser an der Messstelle W ab EC 1.00 (R10.5; A9)
  if (e.betriebsart === 'messstelle' && ec !== undefined && ec >= 100)
    nachher(
      {
        ausloeser: 'leitungswasser',
        text: `Leitungswasser EC ${alsText('ec', ec)}.`,
        folge: 'Risiko von Nährstoffblockaden',
        massnahme: 'Ausgangswasser prüfen',
        ton: 'warn',
      },
      'ec',
    );

  const auswahl = kandidaten
    .map((k, i) => ({ ...k, i }))
    .sort((a, b) => a.stufe - b.stufe || a.reihe - b.reihe || a.i - b.i)
    .slice(0, 2)
    .map((k) => k.hinweis);
  return { hinweise: auswahl, alarm: auswahl.some((h) => h.ton === 'warn' || h.ton === 'danger') };
}
