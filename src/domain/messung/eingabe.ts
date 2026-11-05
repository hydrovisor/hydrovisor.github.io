// Eingabe der Messmaske über den eigenen Ziffernblock (Plan 12 «Eingabe», «Leeres Feld»; UC9-AK2, U1, U2, U3, G3).
// Dezimalpunkt automatisch; Rechnung in Hundertsteln als Ganzzahl; der Text eines Felds trägt den ganzen Zustand.
export type Groesse = 'ph' | 'ec' | 'temperatur';

/** Tasten des Ziffernblocks (gleich wie in src/ui/bausteine/NumPad.tsx, Typabgleich dort) */
export type Taste =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | 'weiter'
  | 'leeren'
  | 'minus'
  | 'plus'
  | 'zurueck';

export interface Feldregel {
  vorkomma: number;
  dezimalen: number;
  /** Grenzen in Hundertsteln */
  min: number;
  max: number;
}

/** pH 1 + 1 (A12), EC 1 + 2 (Q12, unter 10), °C 2 + 1 (bis 50) */
export const FELDREGEL: Readonly<Record<Groesse, Feldregel>> = {
  ph: { vorkomma: 1, dezimalen: 1, min: 0, max: 1400 },
  ec: { vorkomma: 1, dezimalen: 2, min: 0, max: 999 },
  temperatur: { vorkomma: 2, dezimalen: 1, min: 0, max: 5000 },
};

export interface Messeingabe {
  felder: readonly Groesse[];
  aktiv: Groesse;
  text: Record<Groesse, string>;
  /** zuletzt geleertes Feld; die Rücktaste direkt danach stellt es wieder her */
  geleert?: { feld: Groesse; text: string };
}

interface Teile {
  vor: string;
  punkt: boolean;
  nach: string;
}

function zerlegen(text: string): Teile {
  const i = text.indexOf('.');
  return i < 0
    ? { vor: text, punkt: false, nach: '' }
    : { vor: text.slice(0, i), punkt: true, nach: text.slice(i + 1) };
}

function zusammen(t: Teile, regel: Feldregel): string {
  // der Punkt erscheint, sobald Nachkommastellen da sind oder er getippt wurde
  return t.nach !== '' || (t.punkt && t.vor.length < regel.vorkomma) ? `${t.vor}.${t.nach}` : t.vor;
}

/** Wert in Hundertsteln oder null */
function hundertstel(text: string): number | null {
  const t = zerlegen(text);
  if (t.vor === '' && t.nach === '') return null;
  const nach = (t.nach + '00').slice(0, 2);
  return Number(t.vor || '0') * 100 + Number(nach);
}

function ohne(e: Messeingabe): Messeingabe {
  const { geleert: _weg, ...rest } = e;
  void _weg;
  return rest;
}

function naechstes(e: Messeingabe): Groesse {
  const i = e.felder.indexOf(e.aktiv);
  return e.felder[Math.min(i + 1, e.felder.length - 1)] ?? e.aktiv;
}

export function eingabeStart(felder: readonly Groesse[]): Messeingabe {
  return { felder, aktiv: felder[0] ?? 'ph', text: { ph: '', ec: '', temperatur: '' } };
}

export function feldWaehlen(e: Messeingabe, feld: Groesse): Messeingabe {
  return e.felder.includes(feld) ? { ...ohne(e), aktiv: feld } : e;
}

function mitText(e: Messeingabe, text: string): Messeingabe {
  return { ...ohne(e), text: { ...e.text, [e.aktiv]: text } };
}

function ziffer(e: Messeingabe, z: string): Messeingabe {
  const regel = FELDREGEL[e.aktiv];
  const t = zerlegen(e.text[e.aktiv]);
  const vorkommaVoll = t.punkt || t.vor.length >= regel.vorkomma;
  let neu: Teile;
  if (!vorkommaVoll) neu = { ...t, vor: t.vor + z };
  else if (t.nach.length < regel.dezimalen) neu = { vor: t.vor || '0', punkt: true, nach: t.nach + z };
  else return e;
  const text = zusammen(neu, regel);
  const wert = hundertstel(text);
  // harte Grenze (U3): eine Ziffer, die sie überschritte, wird nicht angenommen
  if (wert === null || wert > regel.max) return e;
  const weiter = mitText(e, text);
  return neu.nach.length >= regel.dezimalen ? { ...weiter, aktiv: naechstes(e) } : weiter;
}

/** ± in 0.1-Schritten, nichts bei leerem Feld (A13), stoppt an den Grenzen */
function schritt(e: Messeingabe, richtung: 1 | -1): Messeingabe {
  const regel = FELDREGEL[e.aktiv];
  const wert = hundertstel(e.text[e.aktiv]);
  if (wert === null) return e;
  const neu = Math.min(regel.max, Math.max(regel.min, wert + richtung * 10));
  const ganz = Math.floor(neu / 100);
  const nach = String(neu % 100)
    .padStart(2, '0')
    .slice(0, regel.dezimalen);
  return mitText(e, `${ganz}.${nach}`);
}

function zurueck(e: Messeingabe): Messeingabe {
  const text = e.text[e.aktiv];
  if (text === '' && e.geleert?.feld === e.aktiv) return mitText(e, e.geleert.text);
  const regel = FELDREGEL[e.aktiv];
  const t = zerlegen(text);
  if (t.nach !== '') return mitText(e, zusammen({ ...t, nach: t.nach.slice(0, -1) }, regel));
  if (t.punkt && text.endsWith('.')) return mitText(e, t.vor);
  return mitText(e, t.vor.slice(0, -1));
}

export function eingabeTippen(e: Messeingabe, taste: Taste): Messeingabe {
  switch (taste) {
    case 'weiter':
      return { ...ohne(e), aktiv: naechstes(e) };
    case 'leeren':
      return { ...e, text: { ...e.text, [e.aktiv]: '' }, geleert: { feld: e.aktiv, text: e.text[e.aktiv] } };
    case 'zurueck':
      return zurueck(e);
    case 'plus':
      return schritt(e, 1);
    case 'minus':
      return schritt(e, -1);
    case '.': {
      const t = zerlegen(e.text[e.aktiv]);
      if (t.punkt || t.vor.length >= FELDREGEL[e.aktiv].vorkomma) return e;
      return mitText(e, `${t.vor || '0'}.`);
    }
    default:
      return ziffer(e, taste);
  }
}

export function messwerte(e: Messeingabe): {
  ph: number | null;
  ec: number | null;
  temperatur: number | null;
  ec_eingabe: string | null;
  ec_dezimalen: number | null;
} {
  const wert = (g: Groesse) => {
    if (!e.felder.includes(g)) return null;
    const h = hundertstel(e.text[g]);
    return h === null ? null : h / 100;
  };
  const ec = wert('ec');
  return {
    ph: wert('ph'),
    ec,
    temperatur: wert('temperatur'),
    ec_eingabe: ec === null ? null : ec.toFixed(2),
    ec_dezimalen: ec === null ? null : 2,
  };
}

export function speichernMoeglich(e: Messeingabe): boolean {
  const w = messwerte(e);
  return w.ph !== null || w.ec !== null || w.temperatur !== null;
}

/** Werte in ganzen Hundertsteln direkt aus dem Text, nur Felder aus `felder` mit Text (G3; Plan 26) */
export function messwerteHundertstel(e: Messeingabe): Partial<Record<Groesse, number>> {
  const r: Partial<Record<Groesse, number>> = {};
  for (const g of e.felder) {
    const h = hundertstel(e.text[g]);
    if (h !== null) r[g] = h;
  }
  return r;
}

/** alle Dezimalen nach FELDREGEL getippt (pH «6.2», EC «1.25», °C «20.5») */
export function feldVollstaendig(e: Messeingabe, feld: Groesse): boolean {
  return zerlegen(e.text[feld]).nach.length >= FELDREGEL[feld].dezimalen;
}

/**
 * Übergang zur Ergebniszone (U1; Plan 26 A21): die Taste machte das letzte Feld vollständig, oder «weiter» auf dem
 * letzten Feld bei mindestens einem Wert.
 */
export function eingabeAbgeschlossen(vorher: Messeingabe, nachher: Messeingabe, taste: Taste): boolean {
  const letztes = vorher.felder[vorher.felder.length - 1];
  if (letztes === undefined) return false;
  if (taste === 'weiter') return vorher.aktiv === letztes && speichernMoeglich(nachher);
  return !feldVollstaendig(vorher, letztes) && feldVollstaendig(nachher, letztes);
}
