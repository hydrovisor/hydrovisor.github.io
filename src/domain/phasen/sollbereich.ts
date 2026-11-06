// Sollbereich einer Sorte in einer Phase (R1.3; Plan 38): pH, EC mit ec_gesamt und Wassertemperatur aus v_sollwert, mit
// Herkunft und Verlässlichkeit. Werte in Hundertsteln wie die Bewertung (pH 6.0 = 600, EC 1.2 = 120, 18 °C = 1800).
import { inHundertstel, type Band } from '../bewertung/bewertung.ts';
import { zeilen, type Teile } from '../anlage/teile.ts';

export interface Herkunft {
  ebene: string;
  klasse: string;
  vermerk?: string;
}

export interface Sollbereich {
  ph?: Band;
  ec?: Band;
  temp?: Band;
  herkunft: { ph: Herkunft | undefined; ec: Herkunft | undefined; temp: Herkunft | undefined };
  verlaesslichkeit: 'belegt' | 'pruefauftrag';
  ecBasisUnklar: boolean;
}

interface SollwertZeile {
  sorte_id: string;
  phase: string;
  groesse: string;
  wert_min: number | string | null;
  wert_max: number | string | null;
  ec_basis_quelle?: string | null;
  herkunft_ebene?: string | null;
  evidenzklasse?: string | null;
  vermerk?: string | null;
}

const gesetzt = (x: unknown): x is number | string =>
  x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x));

/** ECWasser der Anlage des Platzes in Hundertsteln (v_ec_wasser, sonst Standard 0.5; G6) */
function ecWasser(teile: Teile, platzId: string | undefined): number {
  const anlageId = zeilen<{ id: string; anlage_id: string }>(teile, 'platz').find(
    (p) => p.id === platzId,
  )?.anlage_id;
  const w = zeilen<{ anlage_id: string; ec: number | string | null }>(teile, 'v_ec_wasser').find(
    (x) => x.anlage_id === anlageId,
  );
  return w && gesetzt(w.ec) ? inHundertstel(w.ec) : 50;
}

function herkunftVon(z: SollwertZeile | undefined): Herkunft | undefined {
  if (!z) return undefined;
  const vermerk = z.vermerk && z.vermerk !== 'keine' ? z.vermerk : undefined;
  return {
    ebene: z.herkunft_ebene ?? 'standard',
    klasse: z.evidenzklasse ?? '',
    ...(vermerk ? { vermerk } : {}),
  };
}

/** belegt: Klasse A bis C auf Sorte oder Art ohne Vermerk leitkultur (R1.3) */
const belegt = (h: Herkunft) =>
  /^[ABC]/.test(h.klasse) && (h.ebene === 'sorte' || h.ebene === 'art') && h.vermerk !== 'leitkultur';

export function sollbereich(teile: Teile, sorteId: string, phase: string, platzId?: string): Sollbereich {
  const zeile = (groesse: string) =>
    zeilen<SollwertZeile>(teile, 'v_sollwert').find(
      (s) => s.sorte_id === sorteId && s.phase === phase && s.groesse === groesse,
    );
  const band = (z: SollwertZeile | undefined, plus = 0): Band | undefined =>
    z && gesetzt(z.wert_min) && gesetzt(z.wert_max)
      ? { min: inHundertstel(z.wert_min) + plus, max: inHundertstel(z.wert_max) + plus }
      : undefined;
  const ph = zeile('ph');
  const ec = zeile('ec');
  const temp = zeile('wassertemp');
  const phBand = band(ph);
  const ecBand = band(ec, ec?.ec_basis_quelle === 'zuwachs' ? ecWasser(teile, platzId) : 0);
  const tempBand = band(temp);
  const herkunft = {
    ph: phBand ? herkunftVon(ph) : undefined,
    ec: ecBand ? herkunftVon(ec) : undefined,
    temp: tempBand ? herkunftVon(temp) : undefined,
  };
  const vorhanden = [herkunft.ph, herkunft.ec, herkunft.temp].filter((h): h is Herkunft => h !== undefined);
  return {
    ...(phBand ? { ph: phBand } : {}),
    ...(ecBand ? { ec: ecBand } : {}),
    ...(tempBand ? { temp: tempBand } : {}),
    herkunft,
    verlaesslichkeit: vorhanden.length > 0 && vorhanden.every(belegt) ? 'belegt' : 'pruefauftrag',
    ecBasisUnklar: ecBand !== undefined && (ec?.ec_basis_quelle ?? 'unbekannt') === 'unbekannt',
  };
}

/** Zahl mit mindestens einer, höchstens zwei Nachkommastellen (6.0, 1.25) */
export function dezimal(hundertstel: number): string {
  const t = (hundertstel / 100).toFixed(2);
  return t.endsWith('0') ? t.slice(0, -1) : t;
}

/** «pH 6.0–6.5 · EC 1.2–1.6 · 18–22 °C»; fehlende Werte als «… Sollwert nicht belegt» */
export function sollText(s: Pick<Sollbereich, 'ph' | 'ec' | 'temp' | 'ecBasisUnklar'>): string {
  const teile: string[] = [];
  const fehlt: string[] = [];
  if (s.ph) teile.push(`pH ${dezimal(s.ph.min)}–${dezimal(s.ph.max)}`);
  else fehlt.push('pH');
  if (s.ec) teile.push(`EC ${dezimal(s.ec.min)}–${dezimal(s.ec.max)}`);
  else fehlt.push('EC');
  if (s.temp)
    teile.push(`${String(Math.round(s.temp.min / 100))}–${String(Math.round(s.temp.max / 100))} °C`);
  else fehlt.push('°C');
  if (fehlt.length === 3) return 'Sollwert nicht belegt';
  if (fehlt.length > 0) teile.push(`${fehlt.join(', ')} Sollwert nicht belegt`);
  if (s.ecBasisUnklar) teile.push('EC-Basis unklar');
  return teile.join(' · ');
}
