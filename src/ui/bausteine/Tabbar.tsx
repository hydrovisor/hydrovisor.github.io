// Baustein Tabbar (design-system/components/Tabbar.md; Entscheid 0025): feste Leiste unten, Ziele als Links mit Symbol
// und Wort, aktives Ziel mit aria-current, Balken, Pille und fetter Schrift (nie nur Farbe); Plakette optional
import type { ReactNode } from 'react';

/** Symbole der Hauptziele, 24 × 24, Strich 2 dp in currentColor (Mockup Entscheid 0025) */
export const TABBAR_SYMBOLE = {
  heute: (
    <>
      <path d="M4 9h16M7 3v4M17 3v4" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 14l2.5 2.5L16 11" />
    </>
  ),
  anlagen: <path d="M4 20V5M20 20V5M4 9h16M4 14h16M4 19h16" />,
  saeen: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 13c0-3-2-5-6-5 0 3 2 5 6 5z" />
    </>
  ),
  saatgut: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 4v3h6V4M9 12h6M9 15h4" />
    </>
  ),
  mehr: (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
} as const satisfies Record<string, ReactNode>;

export type TabbarSymbol = keyof typeof TABBAR_SYMBOLE;

export interface TabbarZiel {
  schluessel: string;
  text: string;
  href: string;
  symbol: TabbarSymbol;
  /** Plakette: Zahl am Symbol, nur ab 1 */
  zahl?: number;
  /** Wort zur Zahl im zugänglichen Namen («3 ohne Foto») */
  zahlText?: string;
}

export function Tabbar({
  ziele,
  aktiv,
  label = 'Hauptnavigation',
}: {
  ziele: readonly TabbarZiel[];
  aktiv?: string;
  label?: string;
}) {
  return (
    <nav className="hv-tabbar" aria-label={label}>
      {ziele.map((z) => {
        const zahl = z.zahl !== undefined && z.zahl > 0 ? z.zahl : undefined;
        return (
          <a
            key={z.schluessel}
            className="hv-tabbar-ziel"
            href={z.href}
            aria-current={z.schluessel === aktiv ? 'page' : undefined}
            {...(zahl !== undefined
              ? { 'aria-label': `${z.text}, ${String(zahl)}${z.zahlText ? ` ${z.zahlText}` : ''}` }
              : {})}
          >
            <span className="hv-tabbar-symbol">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {TABBAR_SYMBOLE[z.symbol]}
              </svg>
              {zahl !== undefined ? (
                <span className="hv-tabbar-zahl" aria-hidden="true">
                  {zahl}
                </span>
              ) : null}
            </span>
            <span className="hv-tabbar-wort">{z.text}</span>
          </a>
        );
      })}
    </nav>
  );
}
