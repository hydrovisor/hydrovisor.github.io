// Baustein Drehrad (design-system/components/Drehrad.md, Plan 147): Zahl mit einem senkrechten Rad wählen
// (Wheel-Picker). Das Rad dreht durch: nach dem letzten Wert folgt der erste. Der Wert in der Mitte ist gewählt;
// Antippen und Pfeil auf/ab wählen auch. Nur für Schreibtisch-Masken: Regal-Masken haben keine Wischgesten.
// `Rad` ist auch der Kern der Zeitwahl (Stunde, Minute).
import { useId, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { indexAusScroll, kopienZahl, mittlereZeile, nachbar, werteListe, zielZeile } from './drehrad-wert.ts';

/** Browser ohne `scrollend` (vor Chrome 114) übernehmen den Wert nach einer Ruhe von 120 ms */
const HAT_SCROLLEND = typeof window !== 'undefined' && 'onscrollend' in window;
const RUHE_MS = 120;
/** Wartezeit, bis die Maske eine Wahl übernommen und neu gezeichnet hat */
const ZURUECK_MS = 100;

export function Rad({
  werte,
  wert,
  onWahl,
  anzeige = String,
  name,
  beschriftetVon,
  beschrieben,
}: {
  werte: number[];
  wert: number;
  onWahl: (neu: number) => void;
  anzeige?: (w: number) => string;
  /** zugänglicher Name (z. B. «Licht ab Stunde»), sonst `beschriftetVon` */
  name?: string;
  beschriftetVon?: string;
  beschrieben?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const erstes = useRef(true);
  const id = useId();
  const n = werte.length;
  const kopien = kopienZahl(n);
  const mitte = Math.floor(kopien / 2);
  const index = Math.max(0, werte.indexOf(wert));
  // gültiger Stand nach dem letzten Zeichnen, für das Zurückdrehen nach einer nicht übernommenen Wahl
  const stand = useRef({ index, wert, n });
  const zurueck = useRef<ReturnType<typeof setTimeout>>(undefined);
  useLayoutEffect(() => {
    stand.current = { index, wert, n };
  });
  // eine neue Berührung oder das Mausrad bricht ein ausstehendes Zurückdrehen ab (Plan 147, Prüfer Befund 1)
  const abbrechen = () => clearTimeout(zurueck.current);

  const zeilenhoehe = (el: HTMLElement) =>
    el.querySelector<HTMLElement>('.hv-drehrad-wert')?.offsetHeight ?? 0;

  // gewählten Wert in die Mitte drehen: beim ersten Zeichnen sofort in die mittlere Kopie, danach weich auf dem
  // kürzesten Weg (auch über das Ende). Die Länge der Liste zählt mit: Fällt ein Wert ausserhalb des Rasters nach der
  // Wahl heraus, bleibt der Index gleich, die Zeile aber nicht (Plan 142, Prüfer Befund 1)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = zeilenhoehe(el);
    if (h === 0) return;
    const sofort = erstes.current;
    erstes.current = false;
    const ziel = zielZeile(index, n, kopien, sofort ? undefined : el.scrollTop / h) * h;
    if (Math.abs(el.scrollTop - ziel) < 1) return;
    el.scrollTo({ top: ziel, behavior: sofort ? 'instant' : 'smooth' });
  }, [index, n, kopien]);

  // nach dem Einrasten: der Wert in der Mitte ist gewählt; das Rad springt unsichtbar in die mittlere Kopie zurück,
  // damit es in beide Richtungen weiter durchdreht
  function eingerastet() {
    const el = ref.current;
    if (!el) return;
    const h = zeilenhoehe(el);
    if (h === 0) return;
    const zeile = indexAusScroll(el.scrollTop, h, n * kopien);
    const neu = werte[zeile % n];
    const mittig = mittlereZeile(zeile, n, kopien) * h;
    if (Math.abs(el.scrollTop - mittig) >= 1) el.scrollTo({ top: mittig, behavior: 'instant' });
    if (neu === undefined || neu === wert) return;
    onWahl(neu);
    // übernimmt die Maske die Wahl nicht (z. B. Minute 30 bei Stunde 24), dreht das Rad auf den gültigen Wert zurück;
    // eine übernommene Wahl lässt das Rad in Ruhe, damit ein neuer Wurf nicht abgebrochen wird
    abbrechen();
    zurueck.current = setTimeout(() => {
      const r = ref.current;
      const jetzt = stand.current;
      if (!r || h === 0 || jetzt.wert === neu) return;
      const soll = zielZeile(jetzt.index, jetzt.n, kopienZahl(jetzt.n), r.scrollTop / h) * h;
      if (Math.abs(r.scrollTop - soll) >= 1) r.scrollTo({ top: soll, behavior: 'smooth' });
    }, ZURUECK_MS);
  }

  function taste(ev: KeyboardEvent<HTMLDivElement>) {
    const ziel =
      ev.key === 'ArrowUp'
        ? nachbar(werte, wert, -1)
        : ev.key === 'ArrowDown'
          ? nachbar(werte, wert, 1)
          : ev.key === 'Home'
            ? werte[0]
            : ev.key === 'End'
              ? werte[n - 1]
              : undefined;
    if (ziel === undefined) return;
    ev.preventDefault();
    if (ziel !== wert) onWahl(ziel);
  }

  const zeilen = Array.from({ length: n * kopien }, (_, z) => z);
  return (
    <div
      ref={ref}
      className="hv-drehrad-rad"
      role="listbox"
      aria-label={name}
      aria-labelledby={name ? undefined : beschriftetVon}
      aria-describedby={beschrieben}
      tabIndex={0}
      aria-activedescendant={`${id}-${index}`}
      onKeyDown={taste}
      onPointerDown={abbrechen}
      onWheel={abbrechen}
      {...(HAT_SCROLLEND
        ? { onScrollEnd: eingerastet }
        : {
            onScroll: () => {
              clearTimeout(timer.current);
              timer.current = setTimeout(eingerastet, RUHE_MS);
            },
          })}
    >
      {zeilen.map((z) => {
        const i = z % n;
        const w = werte[i] ?? 0;
        // nur die mittlere Kopie ist für Screenreader sichtbar; die übrigen tragen das Durchdrehen
        const echt = Math.floor(z / n) === mitte;
        return (
          <div
            key={z}
            {...(echt
              ? { id: `${id}-${i}`, role: 'option', 'aria-selected': w === wert }
              : { 'aria-hidden': true, 'data-gewaehlt': w === wert ? 'true' : undefined })}
            className="hv-drehrad-wert"
            onClick={() => {
              if (w !== wert) onWahl(w);
            }}
          >
            {anzeige(w)}
          </div>
        );
      })}
    </div>
  );
}

export function Drehrad({
  label,
  wert,
  onWert,
  min,
  max,
  schritt = 1,
  einheit,
  anzeige,
  hint,
  error,
}: {
  label: string;
  wert: number;
  onWert: (neu: number) => void;
  min: number;
  max: number;
  schritt?: number;
  /** rechts neben dem Rad, z. B. «cm» */
  einheit?: string;
  anzeige?: (w: number) => string;
  hint?: string;
  error?: string | undefined;
}) {
  const id = useId();
  const werte = werteListe(min, max, schritt, Number.isFinite(wert) ? wert : undefined);
  const gewaehlt = werte.includes(wert) ? wert : (werte[0] ?? min);
  const meldung = error ?? hint;
  return (
    <div className={['hv-drehrad', error && 'hv-drehrad-error'].filter(Boolean).join(' ')}>
      <span id={`${id}-label`} className="hv-field-label">
        {label}
      </span>
      <div className="hv-drehrad-rahmen hv-drehrad-einzeln">
        <Rad
          werte={werte}
          wert={gewaehlt}
          onWahl={onWert}
          beschriftetVon={`${id}-label`}
          beschrieben={meldung ? `${id}-msg` : undefined}
          {...(anzeige ? { anzeige } : {})}
        />
        {einheit ? <span className="hv-drehrad-einheit">{einheit}</span> : null}
      </div>
      {meldung ? (
        <p id={`${id}-msg`} className={error ? 'hv-field-msg hv-field-msg-error' : 'hv-field-msg'}>
          {meldung}
        </p>
      ) : null}
    </div>
  );
}
