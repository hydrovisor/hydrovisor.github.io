// Heute (Kontext Regal, docs/spec/05_masken.md 3.1). Im Grundgerüst nur Kopf und Hinweise; Karten folgen mit I1b.
import { useState } from 'react';
import { useAblaufOffen } from '../../ablauf/offen.ts';
import { standAnzeige } from '../../domain/datenpfad/buendel.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { useNeueVersion } from '../dienst.tsx';
import { hinweisNeueVersionZeigen } from '../neueVersion.ts';
import { NeueVersionHinweis } from '../NeueVersion.tsx';
import { hashZu } from '../router.ts';

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
    </main>
  );
}
