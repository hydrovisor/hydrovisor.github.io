// Heute (Kontext Regal, docs/spec/05_masken.md 3.1). Im Grundgerüst nur Kopf und Hinweise; Karten folgen mit I1b.
import { useState } from 'react';
import { useAblaufOffen } from '../../ablauf/offen.ts';
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
      {zeigen ? <NeueVersionHinweis /> : null}
    </main>
  );
}
