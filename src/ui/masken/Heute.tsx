// Heute (Kontext Regal, docs/spec/05_masken.md 3.1). Im Grundgerüst nur Kopf und Hinweise; Karten folgen mit I1b.
import { useState } from 'react';
import { useAblaufOffen } from '../../ablauf/offen.ts';
import { standAnzeige } from '../../domain/datenpfad/buendel.ts';
import { kalibrierStand, kalibrierText } from '../../domain/kalibrierung/stand.ts';
import { messFaelligkeit, type Messfaelligkeit } from '../../domain/messung/faelligkeit.ts';
import { messbareOrte } from '../../domain/ort.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { OrtKachel } from '../bausteine/Tile.tsx';
import { kalibrierdaten, messgeraet, messungenIm, zustandVon } from '../bundeldaten.ts';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { useNeueVersion } from '../dienst.tsx';
import { hinweisNeueVersionZeigen } from '../neueVersion.ts';
import { NeueVersionHinweis } from '../NeueVersion.tsx';
import { usePushStand } from '../pushZustand.ts';
import { hashZu } from '../router.ts';

/** Text der Messfälligkeit in der Ortskachel (Übergang bis zu den Karten in I1b) */
function faelligText(f: Messfaelligkeit, rolle: string): string {
  // die Messstelle W hat bis I1b-02 keine eigene Fälligkeit (Runde 1 Befund 9)
  if (rolle === 'messstelle') return 'Messstelle';
  if (f.art === 'keine')
    return f.grund === 'leer' ? 'leer · bereit' : f.grund === 'ruht' ? 'ruht' : 'kein Gefäss';
  if (!f.faellig) return `nächste Messung ${tagKurz(f.faelligAm)}`;
  if (f.tageUeberfaellig === 0) return 'Messen fällig';
  return `seit ${f.tageUeberfaellig} ${f.tageUeberfaellig === 1 ? 'Tag' : 'Tagen'} fällig`;
}

const DATUM = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Zurich',
});

export function Heute() {
  const [jetzt] = useState(() => Date.now());
  const ablaufOffen = useAblaufOffen();
  const { wartet } = useNeueVersion();
  const { buendel, frisch, keinZugang, liest, blockiert } = useBuendel();
  // «Stand: hh:mm» nur, solange in dieser Sitzung kein frisches Laden gelungen ist (Plan 11 D3, TO6)
  const anzeige = liest ? {} : standAnzeige({ buendel, frisch }, new Date(jetzt), ZEITZONE);
  const zeigen = hinweisNeueVersionZeigen({
    route: { name: 'heute' },
    neueVersionWartet: wartet,
    ablaufOffen,
  });
  const ablauf = ablaufOffen === undefined ? 'unbekannt' : ablaufOffen ? 'offen' : 'keiner';
  return (
    <main className="hv-seite" data-density="regal" data-ablauf={ablauf}>
      <header className="hv-seite-kopf">
        <Logo height={32} />
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'info' })}>
          Info öffnen
        </a>
      </header>
      <h1 className="hv-seite-titel">Heute</h1>
      <p>{DATUM.format(jetzt)}</p>
      {buendel ? (
        <p className="hv-num" data-buendel-stand={buendel.stand} hidden={!anzeige.stand}>
          {anzeige.stand}
        </p>
      ) : null}
      {blockiert ? (
        <Notice tone="warn" title="App neu laden">
          Eine ältere Ansicht hält die lokale Datenbank offen. Schliesse sie und lade die App neu.
        </Notice>
      ) : null}
      {keinZugang ? <Notice tone="warn" title="Kein Zugang für dieses Konto" /> : null}
      {!keinZugang && anzeige.hinweis ? <Notice title={anzeige.hinweis} /> : null}
      {zeigen ? <NeueVersionHinweis /> : null}
      {buendel && !keinZugang ? <PushHinweis /> : null}
      {buendel ? <Uebersicht jetzt={new Date(jetzt)} /> : null}
    </main>
  );
}

/** Push-Stand (Plan 13, R5.5, UC0-AK5): Hinweis «Push nicht eingerichtet» oder «Letzte Erinnerung …» */
function PushHinweis() {
  const { stand } = usePushStand();
  if (!stand || stand.art === 'nicht_unterstuetzt') return null;
  const einrichten = (
    <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
      Push einrichten
    </a>
  );
  if (stand.art === 'nicht_eingerichtet')
    return <Notice tone="warn" title="Push nicht eingerichtet" action={einrichten} kompakt />;
  if (stand.warnung48h)
    return (
      <Notice
        tone="warn"
        title="Seit 48 Stunden keine Erinnerung zugestellt"
        action={
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
            Push prüfen
          </a>
        }
      >
        Akku-Optimierung für Chrome prüfen.
      </Notice>
    );
  return stand.letzteZustellung ? <p>Letzte Erinnerung: {stand.letzteZustellung} zugestellt</p> : null;
}

/** Übergangsliste bis I1b: Kalibrierstand des Messgeräts (nur echt, G5, RR14) und Orte mit Messfälligkeit */
function Uebersicht({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const orte = buendel ? messbareOrte(buendel.teile) : [];
  const messungen = messungenIm(buendel);
  return (
    <>
      {geraet ? (
        <section className="hv-messen-kopf" aria-label="Messgerät">
          <span className="hv-messen-titel">
            {kalibrierText(
              kalibrierStand(
                kalibrierdaten(buendel),
                { messgeraetId: geraet.id, datenart: 'echt' },
                jetzt,
                ZEITZONE,
              ),
            )}
          </span>
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'kalibrieren' })}>
            Kalibrieren
          </a>
        </section>
      ) : null}
      {orte.length === 0 ? (
        <p>Noch keine Orte erfasst</p>
      ) : (
        <div className="hv-orte" aria-label="Orte">
          {orte.map((o) => (
            <OrtKachel
              key={o.platzId}
              kennung={o.code}
              zeilen={[
                faelligText(
                  messFaelligkeit(
                    {
                      platzId: o.platzId,
                      intervallMessenD: o.intervallMessenD ?? null,
                      ...zustandVon(buendel, o.platzId),
                    },
                    messungen,
                    jetzt,
                    ZEITZONE,
                  ),
                  o.rolle,
                ),
              ]}
              onClick={() => {
                window.location.hash = hashZu({ name: 'messen', code: o.code });
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
