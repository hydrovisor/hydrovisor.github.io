// Teile des Bündels für den Rundgang am Regal (Plan 30 Testliste; Rundgang-AK1a bis AK1c, R4.9, R4.10, UC8):
// Regal R aus tests/fixtures/ansatz.ts (Kalibrierung 11.1., k aus dem Becherversuch, W-Messung 0.50, Lollo Rossa in
// Wachstum mit v_sollwert pH 6.0–6.5, EC 1.0–1.4) mit genau drei Testorten, je allein auf seiner Ebene (Plan 30 A7):
// - 1.1 DWC (P1): Neuansatz 3.1., Messung 10.1. (6.2 / 1.20 / 20.0) → «Messen und nachfüllen» fällig 12.1.
// - 2.1 DWC (P2), Betriebsvolumen 30 l: Neuansatz 5.1., Messung 10.1. → «Messen und nachfüllen» fällig 12.1.
// - 3.1 Kratky belüftet (P3): Neuansatz 28.12.2026, Messung 5.1. (6.5 / 1.00 / 19.0, über ⅓) → «Messen» fällig.
// 1.1 und 2.1 mit je 2 Pflanzungen Lollo Rossa (Wachstum) und v_zielbereich pH 6.0–6.5, EC 1.0–1.4, 18–22 °C; 3.1 wie
// messTeile() (EC 0.8–1.2). Kurzprüfung Wurzeln am 11.1. in allen drei (Wurzeln prüfen erst 18.1.). Übrige Gefässe
// ohne Lösung (2.2 und 2.3 am 11.1. geleert), 1.2 ruht, 3.3 in Prüfung. Kannengrösse 10 l. Laufweg 1.1, 2.1, 3.1:
// Rundgang Ebene 1, 2, 3. Mit `orte` nur ein Teil der Testorte (die übrigen geleert bzw. ohne Ansatz).
// Feste Uhr Di 12.1.2027 09:00 Zürich. Gemeinsam für tests/e2e/rundgang.spec.ts und tests/unit/rundgang-nachfuellen.
// Ohne Personendaten.
import { ansatzTeile } from './ansatz.ts';
import { messungZeile, pflanzungenHinzu, SORTE, zielbereichZeile } from './messen.ts';
import { platzId, uid, type Teile } from './regal.ts';
import { sichtenNachrechnen } from './sichten.ts';

type Zeile = Record<string, unknown>;
const o = { storniert_am: null };

/** Di 12.1.2027 09:00 Zürich */
export const JETZT = new Date('2027-01-12T08:00:00.000Z');
export const KANNE_L = 10;
export const VOLUMEN_21_L = 30;
export type Testort = '1.1' | '2.1' | '3.1';
export const TESTORTE: readonly Testort[] = ['1.1', '2.1', '3.1'];

/** id der Messung vom 10.1. in 1.1 bzw. 2.1 */
export const MESSUNG_ALT = { '1.1': uid('51', 1), '2.1': uid('51', 2) } as const;

function ereignis(n: number, typ: string, kennung: string, gilt: string, daten: Zeile = {}): Zeile {
  const id = uid('52', n);
  return { id, client_id: id, typ, platz_id: platzId(kennung), daten, gilt_ab: gilt, ...o };
}

export function rundgangTeile(e: { orte?: readonly Testort[]; laufweg?: readonly string[] } = {}): Teile {
  const t = ansatzTeile();
  const orte = new Set(e.orte ?? TESTORTE);
  const anlage = (t['anlage'] ?? [])[0] as Zeile;
  anlage['laufweg'] = [...(e.laufweg ?? TESTORTE)];
  for (const z of t['einstellung'] ?? []) z['kannengroesse_l'] = KANNE_L;
  for (const g of t['gefaess'] ?? [])
    if (g['platz_id'] === platzId('2.1')) g['betriebsvolumen_l'] = VOLUMEN_21_L;

  const ereignisse = (t['ereignis'] ??= []);
  let n = 0;
  // ohne Lösung: 2.2, 2.3 und die nicht gewählten Testorte mit Ansatz (1.1, 2.1)
  for (const kennung of ['1.1', '2.1', '2.2', '2.3'])
    if (!orte.has(kennung as Testort))
      ereignisse.push(ereignis((n += 1), 'geleert', kennung, '2027-01-11T09:00:00.000Z'));

  // 3.1 Kratky belüftet mit Lösung seit 28.12.2026 (vor dem Becherversuch, zählt nicht für kStabil)
  if (orte.has('3.1')) {
    const id = uid('53', 1);
    (t['naehrloesungsansatz'] ??= []).push({
      id,
      client_id: id,
      platz_id: platzId('3.1'),
      typ: 'neuansatz',
      status: 'abgeschlossen',
      begonnen_am: '2026-12-28T08:00:00.000Z',
      stadium_gewaehlt: 'wachstum',
      volumen_l: 9,
      nachgefuellt_l: null,
      schnappschuss: {
        zielbereich: { ph_min: 6.0, ph_max: 6.5, ec_min: 0.8, ec_max: 1.2, temp_min: 18, temp_max: 22 },
        betriebsart: 'kratky_belueftet',
      },
      kontrollmessung_id: null,
      endmessung_id: null,
      gilt_ab: '2026-12-28T08:00:00.000Z',
      ...o,
    });
  }

  // Pflanzungen und Zielbereich in 1.1 und 2.1
  pflanzungenHinzu(t, { satzNr: 4, sorteId: SORTE.lollo, anzahl: 2, kennung: '1.1' });
  pflanzungenHinzu(t, { satzNr: 5, sorteId: SORTE.lollo, anzahl: 2, kennung: '2.1' });
  for (const kennung of ['1.1', '2.1'])
    (t['v_zielbereich'] ??= []).push(
      zielbereichZeile(kennung, { ph: [6.0, 6.5], ec: [1.0, 1.4], temp: [18, 22], anzahl: 2 }),
    );

  // Messungen vom 10.1. (Messen und nachfüllen fällig 12.1., Kontrolle am Folgetag erledigt)
  for (const kennung of ['1.1', '2.1'] as const)
    (t['messung'] ??= []).push({
      ...messungZeile({
        id: MESSUNG_ALT[kennung],
        kennung,
        giltAb: '2027-01-10T08:00:00.000Z',
        ph: 6.2,
        ec: 1.2,
        temperatur: 20.0,
      }),
      messart: 'rundgang',
    });

  // Kurzprüfung Wurzeln am 11.1.: Wurzeln prüfen erst am 18.1.
  for (const kennung of TESTORTE)
    ereignisse.push(
      ereignis((n += 1), 'kurzpruefung', kennung, '2027-01-11T09:00:00.000Z', {
        punkt: 'wurzeln',
        ok: true,
        ausnahmen: [],
      }),
    );
  return sichtenNachrechnen(t);
}

/** Messung des Rundgangs (heute) an einen Testort anhängen; gibt die Zeile zurück */
export function rundgangMessungDazu(
  t: Teile,
  e: {
    kennung: Testort;
    ph?: number;
    ec: number;
    temperatur?: number;
    fuellstand?: 'ueber_drittel' | 'unter_drittel';
    giltAb?: string;
    nr?: number;
  },
): Zeile {
  const zeile: Zeile = {
    ...messungZeile({
      id: uid('54', e.nr ?? (t['messung'] ?? []).length + 1),
      kennung: e.kennung,
      giltAb: e.giltAb ?? JETZT.toISOString(),
      ph: e.ph ?? 6.2,
      ec: e.ec,
      temperatur: e.temperatur ?? 20.0,
      fuellstand: e.fuellstand ?? null,
      betriebsart: e.kennung === '3.1' ? 'kratky_belueftet' : 'dwc',
    }),
    messart: 'rundgang',
  };
  (t['messung'] ??= []).push(zeile);
  return zeile;
}
