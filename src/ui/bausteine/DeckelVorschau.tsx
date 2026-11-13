// Baustein Deckel-Vorschau (design-system/components/Deckel.md «Vorschau»): kleines, nicht bedienbares Lochbild für
// Wahllisten. Vorne ist unten wie in der Deckelgrafik; Lochgrösse nach Topfdurchmesser (8 cm grösser als 5 cm).
// Nur Anzeige: aria-hidden, der Text daneben trägt Lochzahl, Topfgrösse und Reihen.

/** Lochdurchmesser in px je cm Topfdurchmesser */
const PX_JE_CM = 1.6;
const ABSTAND = 4;
const RAND = 6;

export function DeckelVorschau({
  reihen,
  topfdurchmesserMm,
  oval,
}: {
  /** Löcher je Reihe von vorne nach hinten */
  reihen: readonly number[];
  topfdurchmesserMm: number;
  /** ovale Wanne (Leni Flori): runde Ecken */
  oval?: boolean;
}) {
  const d = Math.round((topfdurchmesserMm / 10) * PX_JE_CM);
  const spalten = Math.max(1, ...reihen);
  const breite = RAND * 2 + spalten * d + (spalten - 1) * ABSTAND;
  const hoehe = RAND * 2 + reihen.length * d + Math.max(0, reihen.length - 1) * ABSTAND;
  const kreise = reihen.flatMap((anzahl, i) => {
    // Reihe 1 (vorne) unten; jede Reihe mittig wie in der Deckelgrafik
    const y = hoehe - RAND - d / 2 - i * (d + ABSTAND);
    const start = (breite - (anzahl * d + (anzahl - 1) * ABSTAND)) / 2 + d / 2;
    return Array.from({ length: anzahl }, (_, j) => ({
      x: start + j * (d + ABSTAND),
      y,
      schluessel: `${i}-${j}`,
    }));
  });
  return (
    <svg
      className="hv-deckel-vorschau"
      width={breite}
      height={hoehe}
      viewBox={`0 0 ${breite} ${hoehe}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="hv-deckel-vorschau-flaeche"
        x="0.5"
        y="0.5"
        width={breite - 1}
        height={hoehe - 1}
        rx={oval ? Math.min(breite, hoehe) / 2 - 0.5 : 4}
      />
      {kreise.map((k) => (
        <circle key={k.schluessel} className="hv-deckel-vorschau-loch" cx={k.x} cy={k.y} r={d / 2 - 0.75} />
      ))}
    </svg>
  );
}
