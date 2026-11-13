// Maske «Saatgut» (Saatgut-Manager, Issue #211, Plan 211; bisher «Sorten», UC4; Schreibtisch, Standarddichte): Liste
// nach Gemüse mit Tütenbild und Status als Wort, Filter «Vorrätig» und «Ohne Foto»; die Abläufe «Tüte erfassen» und
// «Fotos nachtragen» sind Ansichten dieser Maske ohne eigene Route (Plan 211 A1).
import { useState } from 'react';
import {
  nachtragStarten,
  saatgutGruppen,
  saatgutListe,
  saatgutZahlen,
  type NachtragStand,
  type SaatgutFilter,
} from '../../domain/sorten/saatgut.ts';
import { Button } from '../bausteine/Button.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import { SaatgutEintrag } from '../SaatgutEintrag.tsx';
import '../sorten.css';
import { SaatgutErfassen } from './SaatgutErfassen.tsx';
import { SaatgutNachtragen } from './SaatgutNachtragen.tsx';

type Ansicht = { art: 'liste' } | { art: 'erfassen' } | { art: 'nachtragen'; start: NachtragStand };

export function Sorten() {
  const { buendel, liest } = useBuendel();
  const [ansicht, setAnsicht] = useState<Ansicht>({ art: 'liste' });
  const [filter, setFilter] = useState<SaatgutFilter>('vorraetig');
  const liste = buendel ? saatgutListe(buendel.teile) : [];
  const zurListe = () => {
    setAnsicht({ art: 'liste' });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  if (ansicht.art === 'erfassen') return <SaatgutErfassen onSchliessen={zurListe} />;
  if (ansicht.art === 'nachtragen')
    return <SaatgutNachtragen start={ansicht.start} onSchliessen={zurListe} />;

  const zahlen = saatgutZahlen(liste);
  const gruppen = saatgutGruppen(liste, filter);
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Saatgut</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'einstellungen' })}>
          Zu den Einstellungen
        </a>
      </header>
      <Button block onClick={() => setAnsicht({ art: 'erfassen' })}>
        Tüte erfassen
      </Button>
      {zahlen.ohneFoto > 0 ? (
        <Button
          variant="secondary"
          block
          onClick={() => setAnsicht({ art: 'nachtragen', start: nachtragStarten(liste) })}
        >
          {`Fotos nachtragen · ${zahlen.ohneFoto} ohne Foto`}
        </Button>
      ) : null}
      <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'sorte-neu' })}>
        Von Hand erfassen
      </a>
      {liest && !buendel ? <p>Saatgut wird geladen.</p> : null}
      {buendel && liste.length === 0 ? <p>Noch keine Sorte erfasst.</p> : null}
      {liste.length > 0 ? (
        <Choice
          label="Filter"
          zeile
          einzeln
          optionen={[
            { wert: 'vorraetig', titel: `Vorrätig · ${zahlen.vorraetig}` },
            { wert: 'ohne_foto', titel: `Ohne Foto · ${zahlen.ohneFoto}` },
          ]}
          gewaehlt={[filter]}
          onWahl={(w) => setFilter(w === 'ohne_foto' ? 'ohne_foto' : 'vorraetig')}
        />
      ) : null}
      {liste.length > 0 && gruppen.length === 0 ? <p>Keine Sorte in diesem Filter.</p> : null}
      {gruppen.map((g, i) => (
        <section key={g.gemuese} className="hv-saatgut-gruppe" aria-labelledby={`saatgut-gruppe-${i}`}>
          <h2 id={`saatgut-gruppe-${i}`} className="hv-saatgut-gruppe-titel">
            {g.gemuese}
          </h2>
          <ul className="hv-sorten-liste">
            {g.sorten.map((s) => (
              <li key={s.sorteId}>
                <SaatgutEintrag key={s.fotoPfad ?? 'ohne'} zeile={s} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
