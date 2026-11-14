// Karte «Ernte und Kulturende» in Heute (Plan 38 A3 Fall a, Übergang bis zur Aufgaben-Rechnung I1b-02): «Ernte möglich»
// mit Link zur Pflanzenansicht, «Kultur beenden oder verlängern?» mit [Beenden] und [Verlängern um 14 Tage] in einer
// Berührung (R1.7, R5.2). Bis zum neuen Bündel rechnet die Karte mit teileNach() (Plan 38 A1). Seit UX4 (Plan 226):
// «Alle n abernten» direkt in der Zeile «Ernte möglich»; alle Meldungen mit «Rückgängig machen» über die Meldezeile.
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { rueckgaengigVorgang, type Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { teileNach } from '../../domain/phasen/ende.ts';
import {
  alleAberntenVorgang,
  ernteAufgaben,
  ernteStand,
  ernteUmfang,
  kulturEntscheidVorgang,
  VERLAENGERN_TAGE,
} from '../../domain/phasen/ernte.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { useMelden } from '../meldung.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const SPERRE_MS = 400;

/** «Alle n abernten» der Zeile «Ernte möglich»; bei Mehrfachernte nachrangig, weil dort meist die Teilernte gemeint ist */
function AberntenTaste(p: { n: number; mehrfach: boolean; gesperrt: boolean; onTipp: () => void }) {
  if (p.n === 0) return null;
  return (
    <Button variant={p.mehrfach ? 'ghost' : 'secondary'} disabled={p.gesperrt} onClick={p.onTipp}>
      {p.n > 1 ? `Alle ${String(p.n)} abernten` : 'Abernten'}
    </Button>
  );
}
const uhrJetzt = () => new Date(Date.now());

export function Erntekarten({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const melden = useMelden();
  const teile = buendel?.teile;
  const [gespeichert, setGespeichert] = useState<Vorgang>([]);
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const [starr, setStarr] = useState<typeof teile>();
  const sperre = useRef(false);
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);
  const eff = useMemo(
    () => (teile && gespeichert.length > 0 ? teileNach(teile, gespeichert, jetzt, ZEITZONE) : teile),
    [teile, gespeichert, jetzt],
  );
  if (!eff) return null;
  // während des Sendens und 400 ms danach bleibt die Karte stehen, sonst läge beim Doppeltipper schon die nachgerückte
  // Zeile oder Karte unter dem Finger (U13)
  const sicht = starr ?? eff;
  const aufgaben = ernteAufgaben(sicht, jetzt, ZEITZONE);
  if (aufgaben.length === 0 && !fehler) return null;

  async function senden(schluessel: string, bauen: () => Vorgang, text: (v: Vorgang) => string) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
    setStarr(eff);
    let ok = false;
    try {
      const vorgang = vorgangFuer.current?.schluessel === schluessel ? vorgangFuer.current.vorgang : bauen();
      if (vorgang.length === 0) {
        setFehler('Eingabe nicht gültig, nicht gespeichert');
        return;
      }
      vorgangFuer.current = { schluessel, vorgang };
      const r = await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status !== 'gespeichert') {
        setFehler(r.status === 'nicht_gespeichert' ? r.fehler.text : 'Schon anders gespeichert');
        return;
      }
      ok = true;
      vorgangFuer.current = undefined;
      setFehler(undefined);
      setGespeichert((alt) => [...alt, ...vorgang]);
      // die Meldung steht fest unten im Bild (Plan 224); nach dem Rückgängig entfernt teileNach() die stornierten
      // Zeilen, die Aufgabe steht ohne neues Bündel wieder da (Plan 226 Risiko 4)
      const zurueck = rueckgaengigVorgang(vorgang);
      melden({
        text: text(vorgang),
        rueckgaengig: zurueck,
        nachRueckgaengig: () => setGespeichert((alt) => [...alt, ...zurueck]),
      });
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
        setStarr(undefined);
      };
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
    }
  }

  const entscheiden = (satzId: string, sorte: string, entscheid: 'beenden' | 'verlaengern') =>
    void senden(
      `kultur|${satzId}|${entscheid}`,
      () => kulturEntscheidVorgang(eff, satzId, entscheid, neueClientId, uhrJetzt(), ZEITZONE),
      (v) =>
        entscheid === 'beenden'
          ? `Beendet: ${String(v.length - 1)} ${v.length - 1 === 1 ? 'Pflanze' : 'Pflanzen'} ${sorte}`
          : `Verlängert um ${String(VERLAENGERN_TAGE)} Tage: ${sorte}`,
    );
  const abernten = (pflanzungId: string, sorte: string) =>
    void senden(
      `abernten|${pflanzungId}`,
      () => alleAberntenVorgang(eff, pflanzungId, neueClientId, uhrJetzt(), ZEITZONE),
      (v) => `Abgeerntet: ${String(v.length)} ${v.length === 1 ? 'Pflanze' : 'Pflanzen'} ${sorte}`,
    );

  return (
    <Card title="Ernte und Kulturende">
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {aufgaben.length > 0 ? (
        <ul className="hv-aufgaben" aria-label="Ernte und Kulturende">
          {aufgaben.map((a) => {
            const sorte = a.text.split(' · ').slice(1).join(' · ');
            return a.typ === 'ernte_moeglich' ? (
              <li key={a.schluessel} className="hv-aufgabe hv-aufgabe-umbruch">
                <a
                  className="hv-btn hv-btn-secondary hv-btn-block hv-ernte-link"
                  href={hashZu({ name: 'pflanze', pflanzung: a.pflanzungId })}
                >
                  {a.text}
                </a>
                <span className="hv-ernte-zeile">
                  <span className="hv-aufgabe-text">{a.ort}</span>
                  <AberntenTaste
                    n={ernteUmfang(sicht, a.pflanzungId).length}
                    mehrfach={ernteStand(sicht, a.pflanzungId, jetzt, ZEITZONE)?.teilernteErlaubt === true}
                    gesperrt={sendet}
                    onTipp={() => abernten(a.pflanzungId, sorte)}
                  />
                </span>
              </li>
            ) : (
              <li key={a.schluessel} className="hv-aufgabe hv-aufgabe-umbruch">
                <span className="hv-aufgabe-text">{`${a.text} · ${a.ort}`}</span>
                <span className="hv-ernte-zeile">
                  <Button
                    variant="secondary"
                    disabled={sendet}
                    onClick={() => entscheiden(a.satzId, sorte, 'beenden')}
                  >
                    Beenden
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={sendet}
                    onClick={() => entscheiden(a.satzId, sorte, 'verlaengern')}
                  >
                    {`Verlängern um ${String(VERLAENGERN_TAGE)} Tage`}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}
