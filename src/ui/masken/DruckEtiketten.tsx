// Druckansicht #/druck/etiketten?… (UC14-AK3, R9.1, LabelSheet.md; Plan 22): Steuerleiste nur am Bildschirm,
// darunter je Seite ein Bogen A4 3 × 7. «Als gedruckt bestätigen» setzt gedruckt_am (Schritt setzen, A2), nicht beim
// Testbogen.
import { useState } from 'react';
import { schreiben } from '../../daten/schreiben.ts';
import { anlagenAus } from '../../domain/anlage/teile.ts';
import { bogenSeiten } from '../../domain/etikett/bogen.ts';
import { etikettInhalt, etikettListe, gedrucktVorgang } from '../../domain/etikett/etikett.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { LabelSheet } from '../bausteine/Label.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu, type Route } from '../router.ts';

type Druckroute = Extract<Route, { name: 'druck-etiketten' }>;

/** Druckdialog erst nach dem Laden der Schrift, sonst misst die Kennung falsch (Plan 22 Risiken) */
function drucken(): void {
  void (document.fonts?.ready ?? Promise.resolve()).then(() => window.print());
}

export function DruckEtiketten({ route }: { route: Druckroute }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const anlage = anlagenAus(teile).find((a) => a.kuerzel === route.kuerzel);
  const gewaehlt = new Set(route.codes);
  const liste = anlage ? etikettListe(teile, anlage.id, ZEITZONE).filter((z) => gewaehlt.has(z.code)) : [];
  const seiten = bogenSeiten(
    liste.map((z) => etikettInhalt(teile, z.etikett, ZEITZONE)),
    route.start,
  );
  const [sendet, setSendet] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string }>();

  async function bestaetigen() {
    // ohne Client-UUID lässt sich der Stand nicht setzen: nicht als Erfolg melden (Prüfer Runde 1, Befund 4)
    const ohneId = liste.filter((z) => !z.gedruckt && !z.etikett.client_id).map((z) => z.code);
    if (ohneId.length > 0) {
      setMeldung({
        ok: false,
        text: `Nicht bestätigt: ${ohneId.join(', ')} kann die App nicht als gedruckt speichern`,
      });
      return;
    }
    const vorgang = gedrucktVorgang(
      liste.map((z) => z.etikett),
      jetzt(),
    );
    if (vorgang.length === 0) {
      setMeldung({ ok: true, text: 'Schon als gedruckt bestätigt' });
      return;
    }
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    setMeldung(
      antwort.status === 'gespeichert'
        ? { ok: true, text: 'Als gedruckt bestätigt' }
        : {
            ok: false,
            text: antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht gespeichert',
          },
    );
  }

  return (
    <main className="hv-druck">
      <div className="hv-druck-steuerung">
        <Button onClick={drucken} disabled={liste.length === 0}>
          Drucken
        </Button>
        {route.test ? null : (
          <Button
            variant="secondary"
            disabled={sendet || liste.length === 0}
            onClick={() => void bestaetigen()}
          >
            Als gedruckt bestätigen
          </Button>
        )}
        <a
          className="hv-btn hv-btn-ghost"
          href={hashZu({ name: 'etiketten', kuerzel: route.kuerzel, codes: route.codes })}
        >
          Zurück zu den Etiketten
        </a>
        {route.test ? (
          <Notice
            tone="info"
            title="Testbogen: auf Normalpapier drucken und auf den Etikettenbogen legen"
            kompakt
          />
        ) : null}
        {meldung ? <Notice tone={meldung.ok ? 'ok' : 'danger'} title={meldung.text} kompakt /> : null}
        {liste.length === 0 ? <p>{liest ? 'Daten werden geladen' : 'Keine Etiketten gewählt'}</p> : null}
      </div>
      <div className="hv-druck-vorschau">
        {liste.length > 0
          ? seiten.map((felder, i) => (
              <LabelSheet
                key={i}
                felder={felder}
                versatz={{ x: route.versatzX, y: route.versatzY }}
                test={route.test}
              />
            ))
          : null}
      </div>
    </main>
  );
}
