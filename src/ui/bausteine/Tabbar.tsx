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
  // Weizenähre (Lucide wheat), Ziel «Ernte» (Entscheid 0026)
  ernte: (
    <>
      <path d="M2 22 16 8" />
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
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
