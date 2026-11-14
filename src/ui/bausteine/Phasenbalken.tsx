// Baustein Phasenbalken (design-system/components/Phasenbalken.md, UC15, Plan 232): Spur mit Phasenabschnitten über ein
// Fenster von `tage` Kalendertagen, Wochenmarken, Linie «heute» und darunter die Erntezeile mit Marken. Der Baustein
// rechnet nur Prozent aus Tagesindizes; Daten übersetzt die Maske. Phasen tragen immer ihren Buchstaben, Prognosen sind
// schraffiert (nie nur Farbe).
import type { Phase } from '../../domain/phasen/profil.ts';

export interface BalkenAbschnitt {
  phase: Phase;
  buchstabe: string;
  /** Tagesindex ab Fensterbeginn */
  start: number;
  laenge: number;
  prognose: boolean;
}

export interface BalkenMarke {
  /** Tagesindex ab Fensterbeginn */
  tag: number;
  text: string;
}

/** Schere (Lucide scissors), Zeichen für Ernte */
export function ScherenSymbol() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
    </svg>
  );
}

const prozent = (tag: number, tage: number) => (Math.max(0, Math.min(tage, tag)) / tage) * 100;
const links = (tag: number, tage: number) => `${prozent(tag, tage).toFixed(3)}%`;

/** Marke um ihren Tag zentriert, am Rand bündig, damit nichts seitlich überläuft */
function markenStil(tag: number, tage: number) {
  const p = prozent(tag + 0.5, tage);
  return {
    left: `${p.toFixed(3)}%`,
    transform: p < 12 ? 'translateX(-7px)' : p > 82 ? 'translateX(-100%)' : 'translateX(-50%)',
  };
}

export function Phasenbalken({
  tage,
  abschnitte,
  wochen,
  heute,
  marken,
  spaeter,
  offen,
}: {
  tage: number;
  abschnitte: readonly BalkenAbschnitt[];
  /** Tagesindizes der Wochenmarken */
  wochen: readonly number[];
  /** Tagesindex von heute */
  heute: number;
  marken: readonly BalkenMarke[];
  /** Hinweis rechts für einen Termin nach dem Fenster («Ernte 27.2. →») */
  spaeter?: string;
  /** Text, wenn kein Erntetermin bekannt ist */
  offen?: string;
}) {
  return (
    <>
      <span className="hv-phasenbalken" aria-hidden="true">
        {abschnitte.map((a) => (
          <span
            key={`${String(a.start)}-${a.phase}-${a.prognose ? 'p' : 'b'}`}
            className={`hv-phasenbalken-abschnitt hv-phasenfarbe${a.prognose ? ' hv-phasenbalken-prognose' : ''}`}
            data-phase={a.phase}
            data-art={a.prognose ? 'prognose' : 'bestaetigt'}
            title={a.buchstabe}
            style={{
              left: links(a.start, tage),
              width: `${(prozent(a.start + a.laenge, tage) - prozent(a.start, tage)).toFixed(3)}%`,
            }}
          >
            {a.laenge >= 2 ? a.buchstabe : <span className="hv-visually-hidden">{a.buchstabe}</span>}
          </span>
        ))}
        {wochen.map((w) => (
          <span key={w} className="hv-phasenbalken-woche" style={{ left: links(w, tage) }} />
        ))}
        {heute >= 0 && heute < tage ? (
          <span className="hv-phasenbalken-heute" style={{ left: links(heute, tage) }} />
        ) : null}
      </span>
      <span className="hv-phasenbalken-ernte">
        {offen && marken.length === 0 && !spaeter ? (
          <span className="hv-phasenbalken-offen">{offen}</span>
        ) : null}
        {marken.map((m) => (
          <span
            key={`${String(m.tag)}-${m.text}`}
            className="hv-phasenbalken-marke"
            style={markenStil(m.tag, tage)}
          >
            <ScherenSymbol />
            {m.text}
          </span>
        ))}
        {spaeter ? <span className="hv-phasenbalken-spaeter">{spaeter}</span> : null}
      </span>
    </>
  );
}

const LEGENDE: readonly { phase: Phase; text: string }[] = [
  { phase: 'keimung', text: 'K Keimung' },
  { phase: 'anzucht', text: 'A Anzucht' },
  { phase: 'wachstum', text: 'W Wachstum' },
  { phase: 'bluete', text: 'B Blüte' },
  { phase: 'fruchtbildung_reife', text: 'F Frucht' },
];

/** Legende: Buchstaben der Phasen, voll = bestätigt, schraffiert = Prognose, Schere = Ernte ab */
export function PhasenLegende() {
  return (
    <ul className="hv-phasenbalken-legende" aria-label="Legende">
      {LEGENDE.map((l) => (
        <li key={l.phase}>
          <span
            className="hv-phasenbalken-legende-box hv-phasenfarbe"
            data-phase={l.phase}
            aria-hidden="true"
          />
          {l.text}
        </li>
      ))}
      <li>
        <span
          className="hv-phasenbalken-legende-box hv-phasenfarbe"
          data-phase="wachstum"
          aria-hidden="true"
        />
        voll = bestätigt
      </li>
      <li>
        <span
          className="hv-phasenbalken-legende-box hv-phasenfarbe hv-phasenbalken-prognose"
          data-phase="wachstum"
          aria-hidden="true"
        />
        schraffiert = Prognose
      </li>
      <li>
        <ScherenSymbol />
        Ernte ab
      </li>
    </ul>
  );
}

/** Kennzeichen im Kalender: neutral und gestrichelt wie hv-badge-uncertain, mit Fragezeichen (Lucide circle-help) */
export function KalenderKennzeichen({ text }: { text: string }) {
  return (
    <span className="hv-badge hv-badge-kennzeichen">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
      {text}
    </span>
  );
}
