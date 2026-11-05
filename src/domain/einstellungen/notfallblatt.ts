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

/** Reihenfolge der Komponenten auf dem Blatt (Notfallblatt.md: Micro, Grow, Bloom), nach produkt_id (Befund 5) */
const REIHE = ['micro_hard_water', 'grow', 'bloom'];

/**
 * Dosis je Kanne aus den Positionen des letzten gültigen Neuansatzes oder Teilwechsels, ungerundet gerechnet und
 * erst am Schluss auf 0.5 ml; eine dosierte Komponente nie unter 0.5 ml, eine nicht dosierte entfällt (Befund 6).
 */
function dosisJeKanne(teile: Teile, platzId: string, kanne: number): string {
  const basis = teil(teile, 'naehrloesungsansatz')
    .filter(
      (a) =>
        a['platz_id'] === platzId &&
        (a['typ'] === 'neuansatz' || a['typ'] === 'teilwechsel') &&
        a['status'] !== 'abgebrochen' &&
        (a['storniert_am'] ?? null) === null,
    )
    .sort((a, b) => Date.parse(String(b['begonnen_am'])) - Date.parse(String(a['begonnen_am'])))[0];
  if (!basis) return '–';
  const namen = new Map(
    teil(teile, 'produkt').map((p) => [p['produkt_id'], String(p['name'] ?? p['produkt_id'])]),
  );
  const teile_ = teil(teile, 'ansatz_position')
    .filter(
      (p) =>
        p['ansatz_id'] === basis['id'] &&
        (p['storniert_am'] ?? null) === null &&
        REIHE.includes(String(p['produkt_id'])),
    )
    .map((p) => ({
      id: String(p['produkt_id']),
      ml: (Number(p['ist_ml'] ?? p['soll_ml']) / Number(p['bezugsvolumen_l'])) * kanne,
    }))
    .filter((p) => Number.isFinite(p.ml) && p.ml > 0)
    .sort((a, b) => REIHE.indexOf(a.id) - REIHE.indexOf(b.id))
    .map((p) => `${namen.get(p.id) ?? p.id} ${Math.max(0.5, aufHalbe(p.ml)).toFixed(1)} ml`);
  return teile_.length > 0 ? teile_.join(' · ') : '–';
}

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
  // Laufweg-Reihenfolge der Anlage (Notfallblatt.md, Befund 7), übrige Gefässe danach nach Code (A)
  const laufweg = (teil(teile, 'anlage').find((x) => x['kuerzel'] === kuerzel)?.['laufweg'] ??
    []) as unknown[];
  const rang = (kennung: string) => {
    const i = laufweg.indexOf(kennung);
    return i < 0 ? laufweg.length : i;
  };
  const orte = [...messbareOrte(teile)].sort((a, b) => rang(a.kennung) - rang(b.kennung));
  for (const ort of orte) {
    if (ort.rolle !== 'gefaess' || !ort.code.startsWith(`${kuerzel}-`)) continue;
    const a = gefaessAnsicht(teile, ort.code, jetzt, zeitzone);
    if (!a || a.entfernt) continue;
    zeilen.push({
      kennung: ort.kennung,
      betriebsart: betriebsartName(ort.betriebsart ?? ''),
      zielbereich: a.zielbereich ? `pH ${a.zielbereich.ph} · EC ${a.zielbereich.ec}` : '–',
      dosisJeKanne: dosisJeKanne(teile, ort.platzId, kanne),
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
