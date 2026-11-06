/// <reference types="node" />
// Golden-Test des Düngerrechners gegen die Referenzdatei (Plan 28 Testliste «rechner-referenz.test.ts»; UC7-AK12;
// Konzept R4.12; 06_tests.md Abschnitt 3; Entscheid 0012). Die Erwartungen kommen nur aus der Datei; was ihre Spalten
// nicht tragen, steht unten in ZUSATZ je zeile_id mit Fundstelle (A20).
//
// Quelle (A18, A19):
// - Standard `tests/golden/duengerrechner_referenz.csv` relativ zum Wurzelverzeichnis (process.cwd()).
// - `RECHNER_REFERENZ=entwurf` liest lokal `docs/entwurf/duengerrechner_referenz.csv`; mit gesetztem `CI` scheitert
//   der Test («Entwurf nur lokal»), damit das Prüftor immer gegen das Orakel prüft.
// - Fehlt die Datei, scheitert der Test mit klarer Meldung (kein skip, das Prüftor verbietet es).
//
// Vertrag wie in den übrigen rechner-*.test.ts: Einheiten nach Plan 28, `bruch()` und `alsZahl()` aus
// rechner-zahlen.ts, Mengen in Zehnteln ml, EC in Hundertsteln, Liter in Zehnteln l.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { restdosis } from '../../src/domain/rechner-korrektur.ts';
import { verduennen } from '../../src/domain/rechner-nachfuellen.ts';
import { HERSTELLERDOSIS, neuansatz, zielEc } from '../../src/domain/rechner.ts';
import { alsZahl, bruch, rundeMenge } from '../../src/domain/rechner-zahlen.ts';

const GOLDEN = 'tests/golden/duengerrechner_referenz.csv';
const ENTWURF = 'docs/entwurf/duengerrechner_referenz.csv';
const KOPF = [
  'zeile_id',
  'quelle',
  'gefaess',
  'volumen_l',
  'stadium',
  'zielbereich_ec_min',
  'zielbereich_ec_max',
  'ec_wasser',
  'k',
  'teil_dosis',
  'grow_ml',
  'micro_ml',
  'bloom_ml',
  'ec_ziel',
  'skaliert',
  'hinweis',
] as const;
type Spalte = (typeof KOPF)[number];
type Zeile = Readonly<Record<Spalte, string>>;
type Stadium = keyof typeof HERSTELLERDOSIS;

const TOLERANZ_ZEHNTEL = 5; // ±0.5 ml (R4.12)

const g = (grow: number, micro: number, bloom: number) => ({ grow, micro_hard_water: micro, bloom });

/** Dezimaltext → ganze Hundertstel (EC, Volumen) bzw. Tausendstel (k) ohne Gleitkommarest */
const hundertstel = (s: string) => Math.round(Number(s) * 100);
const zehntel = (s: string) => Math.round(Number(s) * 10);
const tausendstel = (s: string) => Math.round(Number(s) * 1000);

// Zusatzeingaben, die die Spalten nicht tragen (Konzept R4.12, Entwurf duengerrechner_referenz.md Annahmen 4 bis 6)
const ZUSATZ = {
  /** Stationen mit fester Dosis (R4.5): DP17 = Düngeplan Zeile 18 als Station 4.1; RF8 = Station 4.4 */
  station: new Set(['DP17', 'RF8']),
  /** RF3 «Zielbereich 0.8 bis 1.2, ECWasser 0.95»: ECSoll für Wachstum 3.6 ml/L (R4.1) */
  zielwahlStadium: { RF3: 'wachstum' } as Record<string, Stadium>,
  /** RF9: Kontrollmessung 1.25 (R4.12), Ist und Volumen wie RF10 (A); RF10: Ist 18.0 ml auf 9 l, ECIst 1.05 */
  restdosis: {
    RF9: { ecIst: 125, ist: g(90, 60, 30), volumen: 900, stadium: 'wachstum' },
    RF10: { ecIst: 105, ist: g(90, 60, 30), volumen: 900, stadium: 'wachstum' },
  } as Record<string, { ecIst: number; ist: ReturnType<typeof g>; volumen: number; stadium: Stadium }>,
  /** Verdünnen: RF6 «6 l mit EC 1.5»; RF4 und RF5 ohne V1 in der Quelle, deshalb wie RF6 (A); RF5 EC1 = Ziel */
  verduennen: {
    RF4: { v1: 600, ec1: 150, betriebsvolumen: 800 },
    RF5: { v1: 600, ec1: 'ziel', betriebsvolumen: 800 },
    RF6: { v1: 600, ec1: 150, betriebsvolumen: 'spalte' },
  } as Record<string, { v1: number; ec1: number | 'ziel'; betriebsvolumen: number | 'spalte' }>,
  /** RF11 «7.25 ml» */
  rundung: { RF11: 72.5 } as Record<string, number>,
  /** RF7 «leeres Gefäss»: Volumen 9 l (A), weder Stadium noch Zielbereich */
  eingabe: { RF7: { volumen: 900 } } as Record<string, { volumen: number }>,
};

type Pruefart = 'neuansatz' | 'zielwahl' | 'restdosis' | 'verduennen' | 'rundung' | 'eingabe_noetig';

function pruefarten(id: string): Pruefart[] {
  const arten: Pruefart[] = [];
  if (/^DP\d+$/.test(id) || ['RF1', 'RF2', 'RF8', 'RF12'].includes(id)) arten.push('neuansatz');
  if (id in ZUSATZ.zielwahlStadium) arten.push('zielwahl');
  if (id in ZUSATZ.restdosis) arten.push('restdosis');
  if (id in ZUSATZ.verduennen) arten.push('verduennen');
  if (id in ZUSATZ.rundung) arten.push('rundung');
  if (id in ZUSATZ.eingabe) arten.push('eingabe_noetig');
  return arten;
}

function quelle(): { pfad: string; fehler?: string } {
  if (process.env['RECHNER_REFERENZ'] === 'entwurf') {
    if (process.env['CI'])
      return {
        pfad: ENTWURF,
        fehler: `Entwurf nur lokal: RECHNER_REFERENZ=entwurf ist in CI verboten, das Prüftor prüft gegen ${GOLDEN}`,
      };
    if (!existsSync(join(process.cwd(), ENTWURF)))
      return { pfad: ENTWURF, fehler: `Entwurf ${ENTWURF} fehlt` };
    return { pfad: ENTWURF };
  }
  if (!existsSync(join(process.cwd(), GOLDEN))) {
    return {
      pfad: GOLDEN,
      fehler: `Referenzdatei ${GOLDEN} fehlt: Tim kopiert sie aus docs/entwurf/ (Entscheid 0012)`,
    };
  }
  return { pfad: GOLDEN };
}

function lesen(pfad: string): { kopf: string[]; zeilen: Zeile[] } {
  const text = readFileSync(join(process.cwd(), pfad), 'utf8').replace(/^\uFEFF/, '');
  const [kopfzeile = '', ...rest] = text.split(/\r?\n/).filter((z: string) => z.trim() !== '');
  const kopf = kopfzeile.split(',');
  const zeilen = rest.map((z: string) => {
    const felder = z.split(',');
    // hinweis ist die letzte Spalte; ein Komma darin bleibt Teil des Hinweises
    const werte = [...felder.slice(0, KOPF.length - 1), felder.slice(KOPF.length - 1).join(',')];
    return Object.fromEntries(KOPF.map((s, i) => [s, (werte[i] ?? '').trim()])) as Zeile;
  });
  return { kopf, zeilen };
}

function zusatz<T>(tabelle: Readonly<Record<string, T>>, id: string): T {
  const wert = tabelle[id];
  if (wert === undefined) throw new Error(`Zeile ${id} ohne Zusatzeingabe`);
  return wert;
}

function zahlAusHinweis(z: Zeile, muster: RegExp, was: string): number {
  const m = muster.exec(z.hinweis);
  if (!m?.[1]) throw new Error(`Zeile ${z.zeile_id}: ${was} nicht im Hinweis «${z.hinweis}»`);
  return Number(m[1]);
}

function pruefeMengen(z: Zeile, ist: { grow: number; micro_hard_water: number; bloom: number }) {
  const soll = g(zehntel(z.grow_ml), zehntel(z.micro_ml), zehntel(z.bloom_ml));
  for (const c of ['grow', 'micro_hard_water', 'bloom'] as const) {
    expect(
      Math.abs(ist[c] - soll[c]),
      `${z.zeile_id} ${c}: ${ist[c] / 10} ml statt ${soll[c] / 10} ml`,
    ).toBeLessThanOrEqual(TOLERANZ_ZEHNTEL);
  }
}

function pruefeNeuansatz(z: Zeile) {
  const k = tausendstel(z.k);
  const r = neuansatz({
    volumen: hundertstel(z.volumen_l),
    stadium: z.stadium as Stadium,
    zielbereich: { min: hundertstel(z.zielbereich_ec_min), max: hundertstel(z.zielbereich_ec_max) },
    ecWasser: hundertstel(z.ec_wasser),
    k: g(k, k, k),
    teilDosis: Math.round(Number(z.teil_dosis) * 100) as 75 | 85 | 100,
    istStation: ZUSATZ.station.has(z.zeile_id),
    ueberHerstellerdosisBestaetigt: false,
  });
  expect(r.art, `${z.zeile_id}: Neuansatz ohne Ergebnis`).toBe('ergebnis');
  if (r.art !== 'ergebnis') return;
  pruefeMengen(z, r.mengenTeil);
  expect(r.ecZiel, `${z.zeile_id} ec_ziel`).toBe(hundertstel(z.ec_ziel));
  expect(r.skaliert, `${z.zeile_id} skaliert`).toBe(z.skaliert === 'true');
}

function pruefeZielwahl(z: Zeile) {
  const stadium = zusatz(ZUSATZ.zielwahlStadium, z.zeile_id);
  const wasser = hundertstel(z.ec_wasser);
  const k = tausendstel(z.k);
  const d = HERSTELLERDOSIS[stadium];
  const summe = d.grow + d.micro_hard_water + d.bloom; // Hundertstel ml/L
  // ECSoll = ECWasser + k · D in Hundertsteln: k (Tausendstel) · D (Hundertstel) / 1000
  const ecSoll = bruch(wasser * 1000 + k * summe, 1000);
  const r = zielEc({
    zielbereich: { min: hundertstel(z.zielbereich_ec_min), max: hundertstel(z.zielbereich_ec_max) },
    ecSoll,
    ecWasser: wasser,
  });
  expect(Math.round(alsZahl(r.ecZiel)), `${z.zeile_id} ec_ziel`).toBe(hundertstel(z.ec_ziel));
}

function pruefeRestdosis(z: Zeile) {
  const zu = zusatz(ZUSATZ.restdosis, z.zeile_id);
  const k = tausendstel(z.k);
  const stadium = (z.stadium || zu.stadium) as Stadium;
  const r = restdosis({
    ecZiel: bruch(hundertstel(z.ec_ziel)),
    ecIst: zu.ecIst,
    ecWasser: hundertstel(z.ec_wasser),
    ist: zu.ist,
    volumen: z.volumen_l ? hundertstel(z.volumen_l) : zu.volumen,
    k: g(k, k, k),
    dosis: HERSTELLERDOSIS[stadium],
  });
  pruefeMengen(z, r.mengen);
}

function pruefeVerduennen(z: Zeile) {
  const zu = zusatz(ZUSATZ.verduennen, z.zeile_id);
  const ecZiel = hundertstel(z.ec_ziel);
  const r = verduennen({
    v1: zu.v1,
    ec1: zu.ec1 === 'ziel' ? ecZiel : zu.ec1,
    ecZiel,
    ecWasser: hundertstel(z.ec_wasser),
    betriebsvolumen: zu.betriebsvolumen === 'spalte' ? hundertstel(z.volumen_l) : zu.betriebsvolumen,
  });
  if (/nicht erreichbar/.test(z.hinweis)) {
    expect(r, z.zeile_id).toEqual({ art: 'nicht_erreichbar' });
  } else if (/kein Verdünnen nötig/.test(z.hinweis)) {
    expect(r, z.zeile_id).toEqual({ art: 'kein_verduennen_noetig', liter: 0 });
  } else {
    const noetig = zahlAusHinweis(z, /nötig (\d+(?:\.\d+)?) l/, 'nötige Liter');
    const frei = zahlAusHinweis(z, /freie Volumen (\d+(?:\.\d+)?) l/, 'freies Volumen');
    const erwartet = zahlAusHinweis(z, /erwartete EC (\d+\.\d+)/, 'erwartete EC');
    expect(r, z.zeile_id).toEqual({
      art: 'wasser',
      noetig: Math.round(noetig * 10),
      liter: Math.round(frei * 10),
      gekappt: Math.round(frei * 10) < Math.round(noetig * 10),
      ecErwartet: Math.round(erwartet * 100),
    });
  }
}

function pruefeRundung(z: Zeile) {
  const roh = zusatz(ZUSATZ.rundung, z.zeile_id);
  const soll = zahlAusHinweis(z, /ergibt (\d+(?:\.\d+)?) ml/, 'gerundete Menge');
  expect(rundeMenge(bruch(roh * 2, 2)), z.zeile_id).toBe(Math.round(soll * 10));
}

function pruefeEingabe(z: Zeile) {
  const zu = zusatz(ZUSATZ.eingabe, z.zeile_id);
  const k = tausendstel(z.k);
  const r = neuansatz({
    volumen: zu.volumen,
    ecWasser: hundertstel(z.ec_wasser),
    k: g(k, k, k),
    teilDosis: 100,
    istStation: false,
    ueberHerstellerdosisBestaetigt: false,
  } as Parameters<typeof neuansatz>[0]);
  expect(r.art, z.zeile_id).toBe('eingabe_noetig');
  if (r.art !== 'eingabe_noetig') return;
  const vorschlag = /Vorschlag (\w+)/.exec(z.hinweis)?.[1];
  expect(r.vorschlagStadium, z.zeile_id).toBe(vorschlag);
  expect([...r.felder].sort(), z.zeile_id).toEqual(['stadium', 'ziel_ec']);
}

const PRUEFUNG: Readonly<Record<Pruefart, (z: Zeile) => void>> = {
  neuansatz: pruefeNeuansatz,
  zielwahl: pruefeZielwahl,
  restdosis: pruefeRestdosis,
  verduennen: pruefeVerduennen,
  rundung: pruefeRundung,
  eingabe_noetig: pruefeEingabe,
};

const q = quelle();

if (q.fehler) {
  it(`UC7-AK12 Referenzdatei: jede Zeile auf ±0.5 ml, EC-Ziel auf Hundertstel (${q.pfad})`, () => {
    throw new Error(q.fehler);
  });
} else {
  const { kopf, zeilen } = lesen(q.pfad);

  it(`UC7-AK12 Referenzdatei: jede Zeile auf ±0.5 ml, EC-Ziel auf Hundertstel (${q.pfad}): Kopf und Prüfarten`, () => {
    expect(kopf).toEqual([...KOPF]);
    expect(zeilen.length).toBeGreaterThan(0);
    const ids = zeilen.map((z) => z.zeile_id);
    expect(new Set(ids).size, 'zeile_id doppelt').toBe(ids.length);
    for (const id of ids) {
      const arten = pruefarten(id);
      if (arten.length !== 1)
        throw new Error(`Zeile ${id} ohne Prüfung (Prüfarten: ${arten.join(', ') || 'keine'})`);
    }
  });

  for (const z of zeilen) {
    const art = pruefarten(z.zeile_id)[0];
    it(`UC7-AK12 Referenzdatei ${z.zeile_id} (${art ?? 'ohne Prüfung'}, ${q.pfad})`, () => {
      if (!art) throw new Error(`Zeile ${z.zeile_id} ohne Prüfung`);
      PRUEFUNG[art](z);
    });
  }
}
