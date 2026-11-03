// Dezimalzahlen ohne Gleitkomma (G3): Text oder Zahl in ganze Tausendstel, halb aufwärts gerundet.

const DEZIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;

export function istDezimal(text: string): boolean {
  return DEZIMAL.test(text);
}

export function istGanzzahl(text: string): boolean {
  return /^-?\d+$/.test(text);
}

/** Bruch zaehler / nenner der Dezimalzahl (nenner = 10^Nachkommastellen) */
function bruch(wert: string | number): { zaehler: bigint; nenner: bigint } {
  const text = typeof wert === 'number' ? zahlText(wert) : wert;
  const m = DEZIMAL.exec(text);
  if (!m) throw new Error(`keine Dezimalzahl: ${text}`);
  const nachkomma = m[3] ?? '';
  return { zaehler: BigInt(`${m[1]}${m[2]}${nachkomma}`), nenner: 10n ** BigInt(nachkomma.length) };
}

function zahlText(wert: number): string {
  if (!Number.isFinite(wert)) throw new Error(`keine endliche Zahl: ${wert}`);
  const text = String(wert);
  return text.includes('e') ? wert.toFixed(20).replace(/0+$/, '').replace(/\.$/, '') : text;
}

/** wert / teiler in ganzen Tausendsteln, halb aufwärts (vom Betrag her) */
export function tausendstel(wert: string | number, teiler = 1): number {
  const { zaehler, nenner } = bruch(wert);
  const z = zaehler * 1000n;
  const n = nenner * BigInt(teiler);
  const betrag = ((z < 0n ? -z : z) * 2n + n) / (2n * n);
  return Number(z < 0n ? -betrag : betrag);
}

/** Tausendstel als Dezimaltext ohne überflüssige Nullen, z. B. 1400 → «1.4» */
export function ausTausendstel(t: number): string {
  const vorzeichen = t < 0 ? '-' : '';
  const b = Math.abs(t);
  const ganz = Math.floor(b / 1000);
  const rest = String(b % 1000)
    .padStart(3, '0')
    .replace(/0+$/, '');
  return `${vorzeichen}${ganz}${rest ? `.${rest}` : ''}`;
}
