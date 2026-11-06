// Karte «Ernte und Kulturende» in Heute (Plan 38 A3 Fall a, Übergang bis zur Aufgaben-Rechnung I1b-02): «Ernte möglich»
// mit Link zur Pflanzenansicht, «Kultur beenden oder verlängern?» mit [Beenden] und [Verlängern um 14 Tage] in einer
// Berührung (R1.7, R5.2). Bis zum neuen Bündel rechnet die Karte mit teileNach() (Plan 38 A1).
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { endeRueckgaengig, teileNach } from '../../domain/phasen/ende.ts';
import { ernteAufgaben, kulturEntscheidVorgang, VERLAENGERN_TAGE } from '../../domain/phasen/ernte.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const SPERRE_MS = 400;
const uhrJetzt = () => new Date(Date.now());

export function Erntekarten({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const [gespeichert, setGespeichert] = useState<Vorgang>([]);
  const [ergebnis, setErgebnis] = useState<{ text: string; vorgang: Vorgang }>();
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);
  const eff = useMemo(
    () => (teile && gespeichert.length > 0 ? teileNach(teile, gespeichert, jetzt, ZEITZONE) : teile),
    [teile, gespeichert, jetzt],
  );
  if (!eff) return null;
  const aufgaben = ernteAufgaben(eff, jetzt, ZEITZONE);
  if (aufgaben.length === 0 && !ergebnis) return null;

  async function senden(schluessel: string, bauen: () => Vorgang, text: (v: Vorgang) => string) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
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
      setErgebnis({ text: text(vorgang), vorgang });
      setGespeichert((alt) => [...alt, ...vorgang]);
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
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
  const rueckgaengig = ergebnis ? endeRueckgaengig(ergebnis.vorgang) : [];

  return (
    <Card title="Ernte und Kulturende">
      {ergebnis ? (
        <div className="hv-phasen-ergebnis" role="status">
          <span>{ergebnis.text}</span>
          {ergebnis.text !== 'Rückgängig gemacht' && rueckgaengig.length > 0 ? (
            <Button
              variant="secondary"
              size="compact"
              disabled={sendet}
              onClick={() =>
                void senden(
                  `rueck|${JSON.stringify(ergebnis.vorgang)}`,
                  () => rueckgaengig,
                  () => 'Rückgängig gemacht',
                )
              }
            >
              Rückgängig machen
            </Button>
          ) : null}
        </div>
      ) : null}
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
                <span className="hv-aufgabe-text">{a.ort}</span>
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
