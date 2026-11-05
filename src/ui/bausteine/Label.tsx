// Bausteine Label und LabelSheet (design-system/components/Label.md, LabelSheet.md; Plan 22): Etikett mit QR als
// SVG, Kennung mit Schriftgrösse aus der gemessenen Breite, Bogen 3 × 7 mit Startfeld (leere Zellen) und Versatz.
import { useEffect, useRef, type CSSProperties } from 'react';
import type { Etiketteninhalt } from '../../domain/etikett/etikett.ts';
import { qrMatrix, qrSvgPfad } from '../../domain/etikett/qr.ts';

const PX_JE_MM = 96 / 25.4;
/** Messgrösse: bei 10 mm messen und auf 1 mm umrechnen (kein Mindestwert der Schrift im Weg) */
const MESS_MM = 10;

/**
 * Kennung: --hv-label-id-size = min(Höchstwert, Spaltenbreite / Breite bei 1 mm), gemessen nach dem Laden der
 * Schrift (Label.md).
 */
function KennungText({
  kennung,
  hoechstMm,
  spalteMm,
}: {
  kennung: string;
  hoechstMm: number;
  spalteMm: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let aktiv = true;
    const messen = () => {
      if (!aktiv) return;
      el.style.setProperty('--hv-label-id-size', `${MESS_MM}mm`);
      // Breite des Textes selbst, nicht der Spalte (Prüfer Runde 1, Befund 1)
      const bereich = document.createRange();
      bereich.selectNodeContents(el);
      const breiteMm = bereich.getBoundingClientRect().width / PX_JE_MM / MESS_MM;
      const groesse = breiteMm > 0 ? Math.min(hoechstMm, spalteMm / breiteMm) : hoechstMm;
      // leicht abgerundet, damit Rundungen der Darstellung nicht über die Spalte führen
      el.style.setProperty('--hv-label-id-size', `${Math.floor(groesse * 100) / 100}mm`);
    };
    messen();
    void document.fonts?.ready.then(messen);
    return () => {
      aktiv = false;
    };
  }, [kennung, hoechstMm, spalteMm]);
  return (
    <span ref={ref} className="hv-label-id">
      {kennung}
    </span>
  );
}

export function Label({ inhalt }: { inhalt: Etiketteninhalt }) {
  const { pfad, module } = qrSvgPfad(qrMatrix(inhalt.link));
  return (
    <div className={inhalt.klein ? 'hv-label hv-label-small' : 'hv-label'}>
      <div className="hv-label-qr-col">
        <div className="hv-label-qr">
          <svg
            viewBox={`0 0 ${module} ${module}`}
            role="img"
            aria-label={`QR-Code ${inhalt.code}`}
            shapeRendering="crispEdges"
          >
            <rect width={module} height={module} fill="#fff" />
            <path d={pfad} fill="#000" />
          </svg>
        </div>
        <span className="hv-label-code">{inhalt.code}</span>
      </div>
      <div className="hv-label-text">
        {/* Spalte 32 mm, Anzuchtbox 55 − 19 − 2 × 4 = 28 mm; Höchstwert 20 mm bzw. 12 mm (Label.md) */}
        <KennungText
          kennung={inhalt.kennung}
          hoechstMm={inhalt.klein ? 12 : 20}
          spalteMm={inhalt.klein ? 28 : 32}
        />
        {inhalt.zeilen.map((z) => (
          <span key={z} className="hv-label-line">
            {z}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LabelSheet({
  felder,
  versatz,
  test,
}: {
  /** genau 21 Felder; null = leeres Feld (Startfeld, Rest) */
  felder: readonly (Etiketteninhalt | null)[];
  versatz: { x: number; y: number };
  test: boolean;
}) {
  const stil = {
    '--hv-versatz-x': `${versatz.x}mm`,
    '--hv-versatz-y': `${versatz.y}mm`,
  } as CSSProperties;
  return (
    <div className={test ? 'hv-sheet hv-sheet-test' : 'hv-sheet'} style={stil}>
      {felder.map((f, i) => (
        <div key={f ? f.code : `leer-${i}`} className="hv-sheet-cell">
          {f ? <Label inhalt={f} /> : null}
        </div>
      ))}
    </div>
  );
}
