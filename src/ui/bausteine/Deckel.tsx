// Baustein Deckel (design-system/components/Deckel.md): Loch 1 vorne links, zeilenweise nach hinten
export interface Loch {
  nr: number;
  text?: string;
  zustand: 'frei' | 'belegt' | 'reserviert' | 'gewaehlt';
}

const ZUSTAND_TEXT = {
  frei: 'frei',
  belegt: 'belegt',
  reserviert: 'reserviert',
  gewaehlt: 'gewählt',
} as const;

export function Deckel({
  reihen,
  loecher,
  onLoch,
}: {
  /** Löcher je Reihe von vorne nach hinten, z. B. [2, 2, 2] */
  reihen: number[];
  loecher: Loch[];
  onLoch?: (nr: number) => void;
}) {
  // erste Lochnummer je Reihe: Summe der Löcher in den Reihen davor
  const start = reihen.map((_, i) => reihen.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className="hv-deckel" role="group" aria-label="Deckel">
      {reihen.map((anzahl, i) => (
        <div key={i} className="hv-deckel-reihe">
          {Array.from({ length: anzahl }, (_, j) => {
            const nr = (start[i] ?? 0) + j + 1;
            const loch = loecher.find((l) => l.nr === nr) ?? { nr, zustand: 'frei' as const };
            const klasse = loch.zustand === 'frei' ? 'hv-loch' : `hv-loch hv-loch-${loch.zustand}`;
            return (
              <button
                key={nr}
                type="button"
                className={klasse}
                aria-label={`Loch ${nr}, ${ZUSTAND_TEXT[loch.zustand]}`}
                onClick={() => onLoch?.(nr)}
              >
                {loch.text ?? nr}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
