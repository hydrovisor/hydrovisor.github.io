// Baustein Faktenliste (design-system/components/Faktenliste.md, Plan 205): Begriff und Wert mit Erklärzeile; ohne
// Wert «noch offen»
import type { ReactNode } from 'react';

export interface Fakt {
  begriff: string;
  wert?: ReactNode;
  erklaerung?: string;
  /** Text statt «noch offen», wenn der Wert fehlt */
  offen?: string;
}

export function Faktenliste({ zeilen, label }: { zeilen: readonly Fakt[]; label?: string }) {
  return (
    <dl className="hv-fakten" aria-label={label}>
      {zeilen.map((z) => (
        <div key={z.begriff} className="hv-fakten-zeile">
          <dt>{z.begriff}</dt>
          <dd>
            {z.wert !== undefined && z.wert !== '' ? (
              <>
                {z.wert}
                {z.erklaerung ? <small>{z.erklaerung}</small> : null}
              </>
            ) : (
              <span className="hv-fakten-offen">{z.offen ?? 'noch offen'}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
