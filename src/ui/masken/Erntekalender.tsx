// Erntekalender (UC15, Plan 232; Konzept v1.8 6.1, Entscheid 0026): Hauptseite «Ernte» der Leiste, Regal-Maske, nur
// lesen. Je aktivem Satz eine Zeile mit Phasenbalken über acht Wochen ab Montag der laufenden Woche; ein Tipp wählt den
// Satz (Adresse #/ernte/<satz>, ohne Eintrag im Verlauf) und zeigt unten das Feld mit allen Terminen. «Pflanze öffnen»
// führt in die Pflanze, deren «Zurück» hierher mit derselben Auswahl zurückführt (A15).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  erntekalender,
  FENSTER_TAGE,
  type KalenderFenster,
  type KalenderZeile,
} from '../../domain/phasen/kalender.ts';
import { PHASE_NAME } from '../../domain/phasen/profil.ts';
import { tageZwischen, tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { KalenderKennzeichen, PhasenLegende, Phasenbalken } from '../bausteine/Phasenbalken.tsx';
import { jetzt as uhrJetzt } from '../bundeldaten.ts';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

/** «Do 18.3.» aus 'JJJJ-MM-TT' */
function tagMitWochentag(tag: string): string {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  return `${WOCHENTAG[new Date(Date.UTC(j, m - 1, d)).getUTCDay()] ?? ''} ${tagKurz(tag)}`;
}

/** Jahr dazu, wenn der Tag nicht im Jahr von heute liegt («27.2.2027») */
function tagLang(tag: string, heute: string): string {
  const mitWt = tagMitWochentag(tag);
  return tag.slice(0, 4) === heute.slice(0, 4) ? mitWt : `${mitWt}${tag.slice(0, 4)}`;
}

/** «Art Sorte», ohne Doppel, wenn die Sorte schon mit der Art beginnt («Schnittlauch») */
const titelVon = (z: KalenderZeile) =>
  z.art && !z.sorte.toLowerCase().startsWith(z.art.toLowerCase()) ? `${z.art} ${z.sorte}` : z.sorte;

function phaseZeile(z: KalenderZeile): string {
  return `${PHASE_NAME[z.phase]} · ${z.phasenText}${z.letztePhase ? ' · letzte Phase' : ''}`;
}

function naechstesText(z: KalenderZeile, heute: string): { text: string; zusatz?: string } {
  const w = z.naechsterWechsel;
  if (!w?.typisch) return { text: z.letztePhase ? 'Kein Phasenwechsel mehr' : 'Termine noch offen' };
  const name = PHASE_NAME[w.phase];
  const unbestaetigt = z.kennzeichen.includes('Phase unbestätigt');
  const text = unbestaetigt
    ? `${name} fällig seit ${tagLang(w.typisch, heute)}`
    : w.typisch === heute
      ? `${name} voraussichtlich ab heute`
      : `${name} voraussichtlich ab ${tagLang(w.typisch, heute)}`;
  const teile = [
    w.fruehestens ? `möglich ${w.fruehestens <= heute ? 'seit' : 'ab'} ${tagLang(w.fruehestens, heute)}` : '',
    w.spaetestens ? `spätestens ${tagLang(w.spaetestens, heute)}` : '',
    unbestaetigt ? 'bestätigen in der Pflanze' : '',
  ].filter(Boolean);
  return teile.length > 0 ? { text, zusatz: teile.join(', ') } : { text };
}

function ernteText(z: KalenderZeile, heute: string): string {
  const e = z.ernte;
  const teile: string[] = [];
  if (e.ernteAb)
    teile.push(
      e.ernteAb < heute
        ? `möglich seit ${tagLang(e.ernteAb, heute)}`
        : `ab ${tagLang(e.ernteAb, heute)} (Prognose)`,
    );
  if (e.ernteart === 'mehrfach') {
    if (e.teilernten > 0)
      teile.push(
        e.naechsterSchnitt
          ? `nächster Schnitt ${e.naechsterSchnitt < heute ? 'möglich seit' : 'ab'} ${tagLang(e.naechsterSchnitt, heute)}`
          : 'nächster Schnitt: Termine noch offen',
      );
    else if (!e.ernteAb) teile.push('Termine noch offen');
    teile.push(e.endeAm ? `Ende ${tagLang(e.endeAm, heute)}` : 'Ende: Termine noch offen');
    teile.push('Mehrfachernte');
  } else if (e.ernteart === 'einmalig') {
    if (!e.ernteAb) teile.push('Termine noch offen');
    teile.push('einmalig, danach frei');
  } else if (!e.ernteAb) teile.push('Termine noch offen');
  return teile.join(' · ');
}

/**
 * Erntezeile ohne Marke im Fenster (Runde 1, Befund 1): Liegt ein Termin vor dem Fenster, steht links «← Ernte seit
 * 4.3.»; «Ernte: Termine noch offen» nur, wenn das Erntefenster gar keinen Termin hat (Konzept 6.1 UC15, AK3).
 */
function randHinweis(z: KalenderZeile, fenster: KalenderFenster): { frueher?: string; offen?: string } {
  const e = z.ernte;
  const ernte = e.naechsterSchnitt ?? e.ernteAb;
  const ende = e.ernteart === 'einmalig' ? undefined : e.endeAm;
  if (ernte !== undefined && ernte < fenster.von) return { frueher: `← Ernte seit ${tagKurz(ernte)}` };
  if (ende !== undefined && ende < fenster.von) return { frueher: `← Ende ${tagKurz(ende)}` };
  return ernte === undefined && ende === undefined ? { offen: 'Ernte: Termine noch offen' } : {};
}

function Zeile({
  z,
  fenster,
  gewaehlt,
  onWahl,
}: {
  z: KalenderZeile;
  fenster: KalenderFenster;
  gewaehlt: boolean;
  onWahl: () => void;
}) {
  const index = (tag: string) => tageZwischen(fenster.von, tag);
  const titel = titelVon(z);
  const vorlesen = [titel, z.ort, `${PHASE_NAME[z.phase]} ${z.phasenText}`, z.kurz, ...z.kennzeichen]
    .filter(Boolean)
    .join(', ');
  return (
    <button
      type="button"
      className="hv-kalender-zeile"
      data-satz={z.satzId}
      aria-pressed={gewaehlt}
      aria-label={vorlesen}
      onClick={onWahl}
    >
      <span className="hv-kalender-zeile-kopf">
        <span className="hv-kalender-sorte">{titel}</span>
        <span className="hv-kalender-ort">{z.ort}</span>
      </span>
      <Phasenbalken
        tage={FENSTER_TAGE}
        abschnitte={z.abschnitte.map((a) => ({
          phase: a.phase,
          buchstabe: a.buchstabe,
          start: index(a.von),
          laenge: index(a.bis) - index(a.von) + 1,
          prognose: a.art === 'prognose',
        }))}
        wochen={fenster.wochen.map(index)}
        heute={index(fenster.heute)}
        marken={z.marken.map((m) => ({
          tag: index(m.tag),
          text: m.art === 'ende' ? `Ende ${tagKurz(m.tag)}` : tagKurz(m.tag),
        }))}
        {...(z.spaeter
          ? { spaeter: `${z.spaeter.art === 'ende' ? 'Ende' : 'Ernte'} ${tagKurz(z.spaeter.tag)} →` }
          : {})}
        {...(z.marken.length === 0 && !z.spaeter ? randHinweis(z, fenster) : {})}
      />
      <span className="hv-kalender-kurz">{z.kurz}</span>
      {z.kennzeichen.map((k) => (
        <KalenderKennzeichen key={k} text={k} />
      ))}
    </button>
  );
}

function Feld({ z, heute, onSchliessen }: { z: KalenderZeile; heute: string; onSchliessen: () => void }) {
  const n = naechstesText(z, heute);
  return (
    <>
      <h2 className="hv-kalender-feld-titel">{titelVon(z)}</h2>
      <dl className="hv-kalender-angaben">
        <dt>Kulturform</dt>
        <dd>{z.kulturformName}</dd>
        <dt>Ort</dt>
        <dd>{z.ort || 'ohne Ort'}</dd>
        <dt>Saat</dt>
        <dd>{`${tagLang(z.saatdatum, heute)} · Tag ${String(z.tagSeitSaat)} seit Saat`}</dd>
        <dt>Phase</dt>
        <dd>
          <strong>{phaseZeile(z)}</strong>
        </dd>
        <dt>Nächstes</dt>
        <dd>
          {n.text}
          {n.zusatz ? (
            <>
              <br />
              <span className="hv-kalender-zusatz">{n.zusatz}</span>
            </>
          ) : null}
        </dd>
        <dt>Ernte</dt>
        <dd>{ernteText(z, heute)}</dd>
      </dl>
      <div className="hv-kalender-knoepfe">
        <button type="button" className="hv-btn hv-btn-secondary" onClick={onSchliessen}>
          Feld schliessen
        </button>
        <a
          className="hv-btn hv-btn-primary"
          href={hashZu({ name: 'pflanze', pflanzung: z.pflanzungId, von: 'ernte' })}
        >
          Pflanze öffnen
        </a>
      </div>
    </>
  );
}

/** Auswahl in die Adresse, ohne Eintrag im Verlauf (A15) */
function auswahlSetzen(satz: string | undefined) {
  window.location.replace(hashZu(satz ? { name: 'ernte', satz } : { name: 'ernte' }));
}

export function Erntekalender({ satz }: { satz?: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => uhrJetzt());
  // ohne Auswahl oben beginnen (Wechsel aus einer gescrollten Seite); mit Auswahl rückt der Effekt unten die Zeile
  // über das Feld (Plan 232, A)
  const auswahlBeimOeffnen = useRef(satz);
  useLayoutEffect(() => {
    if (!auswahlBeimOeffnen.current) window.scrollTo(0, 0);
  }, []);
  const kalender = useMemo(
    () => (teile ? erntekalender(teile, geoeffnet, ZEITZONE) : undefined),
    [teile, geoeffnet],
  );
  const gewaehlt = kalender?.zeilen.find((z) => z.satzId === satz);
  const gewaehltId = gewaehlt?.satzId;
  const feldRef = useRef<HTMLElement>(null);
  const [feldHoehe, setFeldHoehe] = useState(0);

  // Platz unter der Liste in Höhe des Felds, damit die letzte Zeile erreichbar bleibt
  useLayoutEffect(() => {
    const feld = feldRef.current;
    if (!feld) {
      setFeldHoehe(0);
      return;
    }
    const messen = () => setFeldHoehe(feld.getBoundingClientRect().height);
    messen();
    if (typeof ResizeObserver === 'undefined') return;
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(feld);
    return () => beobachter.disconnect();
  }, [gewaehltId]);

  // gewählte Zeile über dem Feld sichtbar halten (auch nach «Zurück» aus der Pflanze)
  useEffect(() => {
    if (!gewaehltId || !feldRef.current) return;
    const zeile = document.querySelector<HTMLElement>(`[data-satz="${gewaehltId}"]`);
    if (!zeile) return;
    const r = zeile.getBoundingClientRect();
    const oben = feldRef.current.getBoundingClientRect().top - 8;
    if (r.bottom > oben) window.scrollBy(0, Math.min(r.bottom - oben, r.top - 8));
    else if (r.top < 0) window.scrollBy(0, r.top - 8);
  }, [gewaehltId, feldHoehe]);

  if (!kalender) {
    return (
      <main className="hv-seite hv-kalender" data-density="regal">
        {/* Überschrift erst mit Daten, damit «Erntekalender» sichtbar heisst: Zeilen stehen (A) */}
        <p>{liest ? 'Erntekalender wird geladen' : 'Keine Daten'}</p>
      </main>
    );
  }
  const { fenster, zeilen } = kalender;
  const index = (tag: string) => tageZwischen(fenster.von, tag);
  const anzahl = zeilen.length;
  return (
    <main className="hv-seite hv-kalender" data-density="regal">
      <header className="hv-kalender-kopf">
        <h1 className="hv-seite-titel">Erntekalender</h1>
        <span className="hv-kalender-stand">
          {`${tagMitWochentag(fenster.heute)} · ${String(anzahl)} ${anzahl === 1 ? 'Satz' : 'Sätze'}`}
        </span>
      </header>
      {anzahl === 0 ? (
        <>
          <p>Kein Satz aktiv. Säen findest du unter Saatgut.</p>
          <a className="hv-btn hv-btn-secondary hv-btn-block" href={hashZu({ name: 'sorten' })}>
            Saatgut öffnen
          </a>
        </>
      ) : (
        <>
          <PhasenLegende />
          <span className="hv-kalender-achse" aria-hidden="true">
            <span
              className="hv-kalender-heute"
              style={{ left: `${((index(fenster.heute) / FENSTER_TAGE) * 100).toFixed(3)}%` }}
            >
              heute
            </span>
            {fenster.wochen.map((w) => (
              <span
                key={w}
                className="hv-kalender-tick"
                style={{ left: `${((index(w) / FENSTER_TAGE) * 100).toFixed(3)}%` }}
              >
                {tagKurz(w)}
              </span>
            ))}
          </span>
          <ul className="hv-kalender-liste">
            {zeilen.map((z) => (
              <li key={z.satzId}>
                <Zeile
                  z={z}
                  fenster={fenster}
                  gewaehlt={z.satzId === gewaehlt?.satzId}
                  onWahl={() => auswahlSetzen(z.satzId === gewaehlt?.satzId ? undefined : z.satzId)}
                />
              </li>
            ))}
          </ul>
          {gewaehlt ? (
            <div aria-hidden="true" style={{ height: `${String(Math.ceil(feldHoehe))}px` }} />
          ) : null}
        </>
      )}
      {gewaehlt ? (
        <section ref={feldRef} className="hv-kalender-feld" aria-label="Termine des Satzes">
          <Feld z={gewaehlt} heute={fenster.heute} onSchliessen={() => auswahlSetzen(undefined)} />
        </section>
      ) : null}
    </main>
  );
}
