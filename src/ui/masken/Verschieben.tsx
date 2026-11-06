// Verschieben und Tauschen eines Topfs (Regal, Plan 33; UC6-AK3, UC6-AK8, R8.3, R8.4): Zielgefäss wählen, Tipp auf
// ein wählbares Loch speichert sofort; Rückgängig storniert beide Ereignisse.
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import { deckelReihen, lochArt, lochName, lochText } from '../../domain/pflanzung/topf.ts';
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
  const sperre = useRef(false);
  const vorgangFuer = useRef<{ schluessel: string; r: ReturnType<typeof verschiebVorgang> } | undefined>(
    undefined,
  );

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

  /** Sperre wie in Keimung (U13; Runde 2 Befund 2): nach Erfolg noch 400 ms, nach einem Fehler sofort frei */
  async function mitSperre(f: () => Promise<boolean>) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
    let ok = false;
    try {
      ok = await f();
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
      };
      if (ok) setTimeout(frei, 400);
      else frei();
    }
  }

  function tippen(nr: number) {
    void mitSperre(() => tippenOhneSperre(nr));
  }

  async function tippenOhneSperre(nr: number): Promise<boolean> {
    if (!a) return false;
    const jetztSenden = uhrJetzt();
    const eingabe = { netztopfId: a.topf.netztopfId, zielPlatzId: zielPlatz, zielLochNr: nr };
    const schluessel = JSON.stringify(eingabe);
    // dieselbe Eingabe wiederholt denselben Vorgang mit denselben client_id (TO2)
    const r =
      vorgangFuer.current?.schluessel === schluessel
        ? vorgangFuer.current.r
        : verschiebVorgang(teile, eingabe, neueClientId, jetztSenden, ZEITZONE);
    if (r.vorgang.length === 0) return false;
    vorgangFuer.current = { schluessel, r };
    const antwort = await schreiben(r.vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    if (antwort.status !== 'gespeichert') {
      setFehler(antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Schon anders gespeichert');
      return false;
    }
    setFehler(undefined);
    vorgangFuer.current = undefined;
    setErgebnis({ text: r.text, vorgang: r.vorgang });
    return true;
  }

  function zuruecknehmen() {
    void mitSperre(async () => {
      if (!ergebnis) return false;
      const r = await schreiben(saatRueckgaengig(ergebnis.vorgang), {
        jetzt: uhrJetzt(),
        zeitzone: ZEITZONE,
      });
      if (r.status !== 'gespeichert') {
        setFehler(r.status === 'nicht_gespeichert' ? r.fehler.text : 'Nicht zurückgenommen');
        return false;
      }
      setErgebnis(undefined);
      return true;
    });
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
          <Button variant="secondary" disabled={sendet} onClick={() => zuruecknehmen()}>
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
              ...(lochText(l) !== undefined ? { text: lochText(l) as string } : {}),
              ...(l.zustandName === 'dieser Topf'
                ? { art: 'markiert' as const }
                : lochArt(l)
                  ? { art: lochArt(l) }
                  : {}),
              ...(l.nichtWaehlbar ? { nichtWaehlbar: true } : {}),
            }))}
            onLoch={(nr) => tippen(nr)}
          />
        </>
      )}
    </main>
  );
}
