// Notfall- und Vertretungsblatt (Plan 32; Konzept 11.7; design-system/components/Notfallblatt.md): Stand je Gefäss
// einer Anlage aus dem Bündel, rein. Die Telefonnummer kommt nur zur Laufzeit dazu (Annahme 12).
import { betriebsartName, gefaessAnsicht } from '../anlage/gefaess.ts';
import { messbareOrte } from '../ort.ts';
import type { Teile } from '../teile.ts';
import { kalendertag, tagKurz, tagPlus, uhrzeit, type Zeitzone } from '../zeit.ts';
import { aufHalbe } from './einstellungen.ts';

export interface Blattzeile {
  kennung: string;
  betriebsart: string;
  zielbereich: string;
  dosisJeKanne: string;
  letzteMessung: string;
  naechsterWechsel: string;
}

export interface Notfallblatt {
  anlage: string;
  stand: string;
  kanne: number;
  zeilen: Blattzeile[];
}

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];

/** Reihenfolge der Komponenten auf dem Blatt (Notfallblatt.md: Micro, Grow, Bloom) */
const REIHE = ['Micro', 'Grow', 'Bloom'];

/** Vertretungsblatt (Konzept 11.7): feste Regeln; die letzte Zeile nennt die Nummer nur zur Laufzeit */
export const VERTRETUNG_REGELN = [
  'Nur Leitungswasser bis zur Marke nachfüllen.',
  'Pumpen und Licht prüfen.',
  'Keinen Dünger geben.',
] as const;

export function vertretungKontakt(telefon: string | null | undefined): string {
  const t = (telefon ?? '').trim();
  return t ? `Bei Fragen: ${t}` : 'Telefonnummer in den Einstellungen eintragen.';
}

function naechsterWechsel(teile: Teile, platzId: string, zeitzone: Zeitzone): string {
  const g = teil(teile, 'gefaess').find(
    (x) =>
      x['platz_id'] === platzId &&
      (x['gueltig_bis'] ?? null) === null &&
      (x['storniert_am'] ?? null) === null,
  );
  if (!g) return '–';
  const fest = g['naechster_wechsel_am'];
  if (typeof fest === 'string' && fest) return tagKurz(fest.slice(0, 10));
  const intervall = g['intervall_wechseln_d'];
  if (intervall === null || intervall === undefined) return '–';
  // letzter gültiger Neuansatz (Lösungswechsel) + Wechselintervall in Kalendertagen (G2)
  const letzter = teil(teile, 'naehrloesungsansatz')
    .filter(
      (a) =>
        a['platz_id'] === platzId &&
        a['typ'] === 'neuansatz' &&
        a['status'] !== 'abgebrochen' &&
        (a['storniert_am'] ?? null) === null,
    )
    .sort((a, b) => Date.parse(String(b['begonnen_am'])) - Date.parse(String(a['begonnen_am'])))[0];
  if (!letzter) return '–';
  const tag = kalendertag(new Date(String(letzter['begonnen_am'])), zeitzone);
  return tagKurz(tagPlus(tag, Number(intervall)));
}

export function notfallblatt(teile: Teile, kuerzel: string, jetzt: Date, zeitzone: Zeitzone): Notfallblatt {
  const kanne = Number(teil(teile, 'einstellung')[0]?.['kannengroesse_l'] ?? 10);
  const zeilen: Blattzeile[] = [];
  for (const ort of messbareOrte(teile)) {
    if (ort.rolle !== 'gefaess' || !ort.code.startsWith(`${kuerzel}-`)) continue;
    const a = gefaessAnsicht(teile, ort.code, jetzt, zeitzone);
    if (!a || a.entfernt) continue;
    const dosis = [...a.dosis]
      .sort((x, y) => REIHE.indexOf(x.komponente) - REIHE.indexOf(y.komponente))
      // keine Komponente auf 0 gerundet (CLAUDE.md «Zahlen»)
      .map((d) => `${d.komponente} ${Math.max(0.5, aufHalbe(Number(d.mlProL) * kanne)).toFixed(1)} ml`);
    zeilen.push({
      kennung: ort.kennung,
      betriebsart: betriebsartName(ort.betriebsart ?? ''),
      zielbereich: a.zielbereich ? `pH ${a.zielbereich.ph} · EC ${a.zielbereich.ec}` : '–',
      dosisJeKanne: dosis.length > 0 ? dosis.join(' · ') : '–',
      letzteMessung: a.letzteMessung ? `${a.letzteMessung.wann} · ${a.letzteMessung.werte}` : '–',
      naechsterWechsel: naechsterWechsel(teile, ort.platzId, zeitzone),
    });
  }
  const tag = kalendertag(jetzt, zeitzone);
  const [j] = tag.split('-');
  return {
    anlage: kuerzel,
    stand: `Stand ${tagKurz(tag)}${j ?? ''}, ${uhrzeit(jetzt, zeitzone)}`,
    kanne,
    zeilen,
  };
}
