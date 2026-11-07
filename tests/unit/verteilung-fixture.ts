// Gemeinsame Fixture «vier Wechsel am Do 14.1.» für Push und Heute nach R5.6 (Plan 118 Testliste «Fixture»; R5.1,
// R5.6, UC8-AK10, G5). Vitest (tests/unit/push-verteilung.test.ts) und Deno
// (supabase/functions/push-taeglich/verteilung_test.ts) importieren diese Datei relativ; darum reines TypeScript ohne
// vitest-, node:- oder Deno-Abhängigkeit und nur Importe aus tests/unit/aufgaben-fixture.ts (dort keine Änderung).
// Gleicher Stand wie vierAmDonnerstag() in tests/unit/aufgaben-verteilung.test.ts (Plan 118 A6: dort nicht
// importierbar, weil die Datei describe() ausführt). Keine Personendaten.
//
// Stand: Anlage R (echt) mit vier DWC-Gefässen R-1.1, R-1.2, R-2.1, R-2.2, Neuansatz je 31.12.2026 09:00 Zürich
// (Intervall wechseln 14) → «Lösung wechseln» an allen am Do 14.1.2027. Mit `demo` zusätzlich Anlage X (demo) mit
// X-1.1, X-1.2, X-2.1, X-2.2 und demselben Neuansatz (G5: verschiebt die echte Liste nicht).
// Nachgerechnet im Plan 118: Mi 13.1. 07:00 ergibt 18 echte Aufgaben, davon ein Wechsel mit Hinweis «vorgezogen»
// (faelligeAufgaben(): 17); Do 14.1. 07:00 ergibt 21, davon drei Wechsel ohne Hinweis und einer mit «4 Ansätze heute».
import { ansatzDazu, fertig, gefaessDazu, jetztAm, leer, zh, type Teile } from './aufgaben-fixture.ts';

export const VIER_ECHT: readonly string[] = ['R-1.1', 'R-1.2', 'R-2.1', 'R-2.2'];
export const VIER_DEMO: readonly string[] = ['X-1.1', 'X-1.2', 'X-2.1', 'X-2.2'];

/** Tag des Neuansatzes an allen Gefässen */
export const NEUANSATZ = '2026-12-31';
export const MI = '2027-01-13';
export const DO = '2027-01-14';

/** Mi 13.1.2027 07:00 Zürich (Push-Zeit, Vortag der vier Wechsel) */
export const MI_SIEBEN = jetztAm(MI, '07:00');
/** Do 14.1.2027 07:00 Zürich (Push-Zeit, Fälligkeitstag der vier Wechsel) */
export const DO_SIEBEN = jetztAm(DO, '07:00');
/** Mi 13.1.2027 20:00 Zürich (Kurzprüfung offen) */
export const MI_ZWANZIG = jetztAm(MI, '20:00');

/** vier DWC-Gefässe mit Neuansatz am 31.12.2026; mit `demo` dazu vier Demo-Gefässe mit gleichem Neuansatz */
export function vierWechsel(o: { demo?: boolean } = {}): Teile {
  const t = leer();
  const codes = o.demo ? [...VIER_ECHT, ...VIER_DEMO] : VIER_ECHT;
  for (const code of codes) {
    gefaessDazu(t, { code, betriebsart: 'dwc' });
    ansatzDazu(t, code, { begonnen: zh(NEUANSATZ) });
  }
  return fertig(t);
}
