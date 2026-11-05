// Baustein Deckel (design-system/components/Deckel.md): Loch 1 vorne links, spaltenweise von vorne nach hinten; Nummern,
// Reihen und Randlöcher aus lochbild() (eine Quelle mit Vorlagen und Assistent, Plan 19)
import { lochbild } from '../../domain/vorlagen/lochbild.ts';

export interface Loch {
  nr: number;
  text?: string;
  zustand: 'frei' | 'belegt' | 'reserviert' | 'gewaehlt';
  /** Malmodus (Säen): Ziffer und Name der Sorte im gewählten Loch */
  marke?: { ziffer: number; name: string };
  /** belegt oder reserviert: aria-disabled, kein Tipp */
  nichtWaehlbar?: boolean;
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
  onReihe,
  kanten,
  serviceOeffnung,
}: {
  /** Löcher je Reihe von vorne nach hinten, z. B. [2, 2, 2] */
  reihen: number[];
  loecher: Loch[];
  onLoch?: (nr: number) => void;
  /** Reihenkopf links jeder Reihe (1 = vorne) */
  onReihe?: (reihe: number) => void;
  /** Beschriftung «hinten» oben und «vorne · Gang» unten */
  kanten?: boolean;
  /** Marke «Service-Öffnung» an der Vorderkante */
  serviceOeffnung?: boolean;
}) {
  const alle = lochbild(reihen);
  return (
    <div className="hv-deckel-rahmen">
      {/* column-reverse: das erste Kind liegt unten (vorne) */}
      <div className="hv-deckel" role="group" aria-label="Deckel">
        {kanten || serviceOeffnung ? (
          <div className="hv-deckel-reihe">
            {serviceOeffnung ? <span className="hv-deckel-service">Service-Öffnung</span> : null}
            {kanten ? <p className="hv-deckel-kante">vorne · Gang</p> : null}
          </div>
        ) : null}
        {reihen.map((_, i) => (
          <div key={i} className="hv-deckel-reihe">
            {onReihe ? (
              <button
                type="button"
                className="hv-deckel-reihenkopf"
                aria-label={`Reihe ${i + 1} wählen`}
                onClick={() => onReihe(i + 1)}
              >
                R{i + 1}
              </button>
            ) : null}
            {alle
              .filter((l) => l.reihe === i + 1)
              .map((l) => {
                const loch = loecher.find((x) => x.nr === l.nr) ?? { nr: l.nr, zustand: 'frei' as const };
                const klasse = loch.zustand === 'frei' ? 'hv-loch' : `hv-loch hv-loch-${loch.zustand}`;
                const marke = 'marke' in loch ? loch.marke : undefined;
                const gesperrt = 'nichtWaehlbar' in loch && loch.nichtWaehlbar === true;
                const name = marke
                  ? `Loch ${l.nr}, ${ZUSTAND_TEXT[loch.zustand]} für ${marke.name}`
                  : `Loch ${l.nr}, ${ZUSTAND_TEXT[loch.zustand]}`;
                return (
                  <button
                    key={l.nr}
                    type="button"
                    className={marke ? `${klasse} hv-loch-marke` : klasse}
                    aria-label={name}
                    aria-disabled={gesperrt ? true : undefined}
                    data-reihe={l.reihe}
                    data-randloch={l.randloch ? 'ja' : 'nein'}
                    data-gangkante={l.gangkante ? 'ja' : 'nein'}
                    onClick={() => (gesperrt ? undefined : onLoch?.(l.nr))}
                  >
                    {marke ? marke.ziffer : (loch.text ?? l.nr)}
                  </button>
                );
              })}
          </div>
        ))}
        {kanten ? <p className="hv-deckel-kante">hinten</p> : null}
      </div>
    </div>
  );
}
