// Verschieben und Tauschen eines Topfs (Regal, Plan 33; UC6-AK3, UC6-AK8, R8.3, R8.4): Zielgefäss wählen, Tipp auf
// ein wählbares Loch speichert sofort; Rückgängig storniert beide Ereignisse.
import { useMemo, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import { deckelReihen, lochName } from '../../domain/pflanzung/topf.ts';
import { verschiebAnsicht, verschiebVorgang, verschiebZiele } from '../../domain/pflanzung/verschieben.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../umsetzen.css';

const uhrJetzt = () => new Date(Date.now());

export function Verschieben({ topf }: { topf: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const a = teile ? verschiebAnsicht(teile, topf, jetzt, ZEITZONE) : undefined;
  const [ziel, setZiel] = useState<string>();
  const [ergebnis, setErgebnis] = useState<{ text: string; vorgang: Vorgang }>();
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);

  if (!a) {
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        <h1 className="hv-seite-titel">Verschieben</h1>
        <p>{liest ? 'Daten werden geladen' : `Topf ${topf} nicht bekannt`}</p>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }
  const zielPlatz = ziel ?? a.zielgefaesse[0]?.platzId ?? a.topf.platzId;
  const gewaehlt = a.zielgefaesse.find((g) => g.platzId === zielPlatz);
  const anderes = zielPlatz !== a.topf.platzId;
  const loecher = verschiebZiele(teile, a.topf.netztopfId, zielPlatz, jetzt, ZEITZONE);
  const gefaessCode = topf.replace(/\.\d+$/, '');

  async function tippen(nr: number) {
    if (!a || sendet) return;
    const jetztSenden = uhrJetzt();
    const r = verschiebVorgang(
      teile,
      { netztopfId: a.topf.netztopfId, zielPlatzId: zielPlatz, zielLochNr: nr },
      neueClientId,
      jetztSenden,
      ZEITZONE,
    );
    if (r.vorgang.length === 0) return;
    setSendet(true);
    const antwort = await schreiben(r.vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    setSendet(false);
    if (antwort.status === 'nicht_gespeichert') setFehler(antwort.fehler.text);
    else {
      setFehler(undefined);
      setErgebnis({ text: r.text, vorgang: r.vorgang });
    }
  }

  async function zuruecknehmen() {
    if (!ergebnis) return;
    const r = await schreiben(saatRueckgaengig(ergebnis.vorgang), { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    if (r.status === 'nicht_gespeichert') setFehler(r.fehler.text);
    else setErgebnis(undefined);
  }

  return (
    <main className="hv-seite hv-umsetzen" data-density="regal">
      <header className="hv-umsetzen-kopf">
        <h1 className="hv-seite-titel">Verschieben</h1>
        <p className="hv-umsetzen-satz">{a.kopf}</p>
      </header>
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {ergebnis ? (
        <>
          <p className="hv-umsetzen-ergebnis" role="status">
            {ergebnis.text}
          </p>
          <Button variant="secondary" disabled={sendet} onClick={() => void zuruecknehmen()}>
            Rückgängig machen
          </Button>
          <a className="hv-btn hv-btn-primary" href={hashZu({ name: 'gefaess', code: gefaessCode })}>
            Zum Gefäss
          </a>
        </>
      ) : (
        <>
          <div className="hv-umsetzen-gefaesse" role="group" aria-label="Zielgefäss">
            {a.zielgefaesse.map((g) => (
              <Button
                key={g.platzId}
                variant="secondary"
                aria-pressed={g.platzId === zielPlatz}
                onClick={() => setZiel(g.platzId)}
              >
                {g.erlaubt ? g.kennung : `${g.kennung} · gesperrt`}
              </Button>
            ))}
          </div>
          {gewaehlt?.hinweis ? (
            <Notice kompakt tone="warn">
              {gewaehlt.hinweis}
            </Notice>
          ) : null}
          {anderes && a.wissenskarte ? (
            <Notice kompakt tone="info" title="Topf umsetzen">
              {a.wissenskarte.text}
            </Notice>
          ) : null}
          <Deckel
            reihen={deckelReihen(teile, zielPlatz)}
            loecher={loecher.map((l) => ({
              nr: l.lochNr,
              zustand: l.zustand,
              zustandName: [l.zustandName, lochName(l)].filter(Boolean).join(' · '),
              ...(l.nichtWaehlbar ? { nichtWaehlbar: true } : {}),
            }))}
            onLoch={(nr) => void tippen(nr)}
          />
        </>
      )}
    </main>
  );
}
