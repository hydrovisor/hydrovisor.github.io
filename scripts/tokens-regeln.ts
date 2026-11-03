// Erzeugt design-system/tokens.css aus tokens.json (Entscheid R11: tokens.json ist die Quelle; Plan 17).
// Reine Funktion ohne Node-Abhängigkeit, damit der Unit-Test denselben Text erzeugt wie `npm run tokens`.

type Wert = string | number;
type Themenwert = Wert | { light: Wert; dark: Wert };

interface Token {
  name: string;
  value: Themenwert;
  usage?: string;
}

interface Gruppe {
  note: string;
  tokens: Token[];
}

interface Schriftstil {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

interface Dichte {
  note: string;
  modes: { id: string; selector: string; tokens: { name: string; value: string }[] }[];
}

export interface Tokens {
  color: { tokens: Token[] };
  type: {
    fonts: { family: string; file: string; weight: string; style: string }[];
    families: Record<string, string>;
    groups: { styles: Schriftstil[] }[];
  };
  spacing: Gruppe;
  radius: Gruppe;
  size: Gruppe;
  shadow: Gruppe;
  print: Gruppe;
  density: Dichte;
}

/** Überschrift je Gruppe im CSS; Reihenfolge = Reihenfolge in tokens.css */
const GRUPPEN = [
  ['spacing', 'spacing'],
  ['radius', 'radius'],
  ['size', 'size'],
  ['print', 'Druck'],
  ['shadow', 'Schatten'],
] as const;

/** «{brand}» → «var(--brand)», sonst unverändert */
function css(wert: Wert): string {
  const text = String(wert);
  const verweis = /^\{([a-z0-9-]+)\}$/.exec(text);
  return verweis ? `var(--${verweis[1]})` : text;
}

function hell(wert: Themenwert): Wert {
  return typeof wert === 'object' ? wert.light : wert;
}

function dunkelAbweichend(wert: Themenwert): Wert | undefined {
  return typeof wert === 'object' && wert.dark !== wert.light ? wert.dark : undefined;
}

function zeile(name: string, wert: Wert, kommentar?: string): string {
  return `  --${name}: ${css(wert)};${kommentar ? ` /* ${kommentar} */` : ''}`;
}

export function tokensCss(t: Tokens): string {
  const aus: string[] = [
    '/* Hydrovisor Design System – Tokens.',
    '   Generiert aus tokens.json mit `npm run tokens` (scripts/tokens.ts).',
    '   Nicht von Hand ändern: Ergänzungen in tokens.json, dann neu erzeugen (Konzept Kapitel 10, Entscheid R11). */',
    '',
  ];
  for (const f of t.type.fonts) {
    aus.push(
      '@font-face {',
      `  font-family: "${f.family}";`,
      `  src: url("${f.file}") format("woff2");`,
      `  font-weight: ${f.weight};`,
      `  font-style: ${f.style};`,
      '  font-display: swap;',
      '}',
      '',
    );
  }

  aus.push(':root {', '  color-scheme: light;', '  /* Farben (helles Thema und themenunabhängige Werte) */');
  for (const tok of t.color.tokens) aus.push(zeile(tok.name, hell(tok.value), tok.usage));

  aus.push('', '  /* Schrift */');
  for (const [name, wert] of Object.entries(t.type.families)) aus.push(zeile(`font-${name}`, wert));
  for (const gruppe of t.type.groups) {
    for (const s of gruppe.styles) {
      aus.push(zeile(`text-${s.name}-size`, s.fontSize), zeile(`text-${s.name}-line`, s.lineHeight));
      aus.push(zeile(`text-${s.name}-weight`, s.fontWeight));
      if (s.letterSpacing) aus.push(zeile(`text-${s.name}-tracking`, s.letterSpacing));
    }
  }

  for (const [schluessel, titel] of GRUPPEN) {
    const gruppe = t[schluessel];
    aus.push('', `  /* ${titel} – ${gruppe.note} */`);
    for (const tok of gruppe.tokens) aus.push(zeile(tok.name, hell(tok.value), tok.usage));
  }
  aus.push('}', '');

  aus.push('[data-theme="dark"] {', '  color-scheme: dark;');
  for (const tok of [...t.color.tokens, ...t.shadow.tokens]) {
    const dunkel = dunkelAbweichend(tok.value);
    if (dunkel !== undefined) aus.push(zeile(tok.name, dunkel));
  }
  aus.push('}', '');

  for (const modus of t.density.modes) {
    aus.push(`/* Dichte «${modus.id}» – ${t.density.note} */`, `${modus.selector} {`);
    for (const tok of modus.tokens) aus.push(zeile(tok.name, tok.value));
    aus.push('}', '');
  }
  return aus.join('\n');
}
