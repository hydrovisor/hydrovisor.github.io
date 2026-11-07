// Inhalt der Pushes (R5.5 Titel nach Gewicht, R5.1 gleiche Liste wie Heute, R5.4, R5.6, G5; Pläne 31 und 118).
// Grundlage ist immer nurEcht(verteilteAufgaben(…)); diese Funktionen erhalten die schon gefilterte Liste und rechnen
// nur den Text.
import { titelNachGewicht, type Aufgabe, type Gewicht } from '../aufgaben.ts';

/** Länge der ersten Zeile (A3); Android zeigt im gesperrten Zustand ungefähr so viel */
export const ERSTE_ZEILE_MAX = 120;

const REIHENFOLGE: readonly Gewicht[] = ['ausserhalb', 'wechsel', 'routine'];
const GRUPPE: Record<Gewicht, string> = { ausserhalb: 'Ausserhalb', wechsel: 'Wechsel', routine: 'Routine' };

/** Hinweis wie in Heute (Aufgabenliste): «mitmarkiert» → «Pumpe mitmarkiert», sonst wörtlich (Plan 118 A1) */
export function hinweisText(a: Aufgabe): string | undefined {
  if (!a.hinweis) return undefined;
  return a.hinweis === 'mitmarkiert' ? 'Pumpe mitmarkiert' : a.hinweis;
}

/** Zeile ab der zweiten: «Titel Code · Hinweis» («vorgezogen», «4 Ansätze heute», R5.6) */
const zeile = (a: Aufgabe) => {
  const text = a.ort ? `${a.titel} ${a.ort.code}` : a.titel;
  const hinweis = hinweisText(a);
  return hinweis ? `${text} · ${hinweis}` : text;
};

interface Gruppe {
  titel: string;
  /** Codes in der Reihenfolge des ersten Auftretens, je mit der Zahl der Aufgaben */
  codes: { code: string; anzahl: number }[];
  /** Aufgaben ohne Ort (z. B. am Messgerät) */
  ohneOrt: number;
}

/** Gruppen der ersten Zeile: nach Gewicht, innerhalb in der gegebenen Reihenfolge, gleicher Titel zusammengefasst */
function gruppen(aufgaben: readonly Aufgabe[]): Gruppe[] {
  const liste: Gruppe[] = [];
  for (const gewicht of REIHENFOLGE) {
    const je = new Map<string, Gruppe>();
    for (const a of aufgaben) {
      if (a.gewicht !== gewicht) continue;
      let g = je.get(a.titel);
      if (!g) {
        g = { titel: a.titel, codes: [], ohneOrt: 0 };
        je.set(a.titel, g);
        liste.push(g);
      }
      if (!a.ort) g.ohneOrt += 1;
      else {
        const c = g.codes.find((x) => x.code === a.ort?.code);
        if (c) c.anzahl += 1;
        else g.codes.push({ code: a.ort.code, anzahl: 1 });
      }
    }
  }
  return liste;
}

/**
 * Erste Zeile «Messen R-2.3, R-3.1 · Kurzprüfung R-2.3». Ist sie länger als ERSTE_ZEILE_MAX, kommen Bausteine (Titel
 * mit erstem Code, jeder weitere Code) nur, solange die Zeile mit «+ n weitere» passt; n zählt die übrigen Aufgaben (A3).
 */
function ersteZeile(aufgaben: readonly Aufgabe[]): string {
  // Bausteine: [Trenner + Text, Aufgaben]
  const bausteine: [string, number][] = [];
  for (const g of gruppen(aufgaben)) {
    const trenner = bausteine.length > 0 ? ' · ' : '';
    const [erster, ...weitere] = g.codes;
    bausteine.push([
      `${trenner}${g.titel}${erster ? ` ${erster.code}` : ''}`,
      g.ohneOrt + (erster?.anzahl ?? 0),
    ]);
    for (const c of weitere) bausteine.push([`, ${c.code}`, c.anzahl]);
  }
  const ganz = bausteine.map(([t]) => t).join('');
  if (ganz.length <= ERSTE_ZEILE_MAX) return ganz;
  let zeile = '';
  let rest = aufgaben.length;
  for (const [t, anzahl] of bausteine) {
    if (`${zeile}${t} + ${rest - anzahl} weitere`.length > ERSTE_ZEILE_MAX) break;
    zeile += t;
    rest -= anzahl;
  }
  return zeile === '' ? `+ ${rest} weitere` : `${zeile} + ${rest} weitere`;
}

/** Sammel-Push des Tages (R5.5): Titel nach Gewicht, Gruppen mit 0 entfallen (A1), 0 Aufgaben «nichts fällig» (A2) */
export function sammelInhalt(aufgaben: readonly Aufgabe[]): {
  titel: string;
  text: string;
  anzahl: number;
  gewicht: { ausserhalb: number; wechsel: number; routine: number };
} {
  const gewicht = titelNachGewicht(aufgaben);
  const anzahl = aufgaben.length;
  if (anzahl === 0)
    return {
      titel: 'Hydrovisor heute: nichts fällig',
      text: 'Heute stehen keine Aufgaben an.',
      anzahl,
      gewicht,
    };
  const gruppen = REIHENFOLGE.filter((g) => gewicht[g] > 0).map((g) => `${gewicht[g]} ${GRUPPE[g]}`);
  return {
    titel: `Hydrovisor heute: ${gruppen.join(' · ')}`,
    text: [ersteZeile(aufgaben), ...aufgaben.map(zeile)].join('\n'),
    anzahl,
    gewicht,
  };
}

/** offene Kurzprüfungen des Tages (R5.5 «Kurzprüfung offen»; leere Gefässe haben keine, R5.4) */
export function kurzpruefungOffen(aufgaben: readonly Aufgabe[], heute: string): Aufgabe[] {
  return aufgaben.filter((a) => a.typ === 'kurzpruefung' && a.faelligAm === heute);
}

export function kurzpruefungInhalt(offen: readonly Aufgabe[]): {
  titel: 'Hydrovisor: Kurzprüfung offen';
  text: string;
} {
  const orte = [...new Set(offen.map((a) => a.ort?.code ?? a.titel))];
  return { titel: 'Hydrovisor: Kurzprüfung offen', text: `Noch offen: ${orte.join(', ')}` };
}

/** Timer-Push (R5.5 Ausnahme, A10): Neuansatz öffnet die Abhakliste, pH-Korrektur Heute */
export function timerInhalt(t: { typ: string; code: string }): { titel: string; text: string; url: string } {
  const neuansatz = t.typ === 'neuansatz';
  return {
    titel: `Timer abgelaufen · ${t.code}`,
    text: neuansatz ? 'Weiter mit der Abhakliste' : 'Jetzt nachmessen',
    url: neuansatz ? `#/ansatz/${t.code}` : '#/heute',
  };
}

export interface TageslisteZeile {
  tag: string;
  aufgabe_schluessel: string;
  typ: string;
  platz_id: string | null;
  faellig_am: string;
}

/** Zeilen für aufgabe_tagesliste (EK5, Termintreue); platz_id nur bei bezugArt platz */
export function tageslisteZeilen(aufgaben: readonly Aufgabe[], tag: string): TageslisteZeile[] {
  return aufgaben.map((a) => ({
    tag,
    aufgabe_schluessel: a.schluessel,
    typ: a.typ,
    platz_id: a.bezugArt === 'platz' ? a.bezug : null,
    faellig_am: a.faelligAm,
  }));
}
