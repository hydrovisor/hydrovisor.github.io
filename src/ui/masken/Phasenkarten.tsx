// Phasenfragen und «Phasen nachführen» in Heute (Plan 35; UC6-AK6, R1.5, R1.6): eine Karte je Ort, Art und Saatdatum
// mit Ja (vorgewählt), Noch nicht, Problem je Satz und [Alle Ja]; Karte «Phasen nachführen» mit [Alle übernehmen].
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import {
  antwortVorgang,
  nachfuehrVorgang,
  phasenKarten,
  phasenRueckgaengig,
  PHASENLOGIK_AB,
  type Fragekarte,
} from '../../domain/phasen/fragen.ts';
import { PHASE_NAME } from '../../domain/phasen/profil.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import '../phasen.css';

type Antwort = 'ja' | 'noch_nicht' | 'problem';
const ANTWORTEN: { wert: Antwort; text: string }[] = [
  { wert: 'ja', text: 'Ja' },
  { wert: 'noch_nicht', text: 'Noch nicht' },
  { wert: 'problem', text: 'Problem' },
];
const SPERRE_MS = 400;
const uhrJetzt = () => new Date(Date.now());

export function Phasenkarten({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const [wahl, setWahl] = useState<Record<string, Antwort>>({});
  const [ergebnis, setErgebnis] = useState<{ text: string; vorgang: Vorgang }>();
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  // derselbe Vorgang bei Wiederholung derselben Eingabe (TO2)
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);
  if (!teile) return null;
  const k = phasenKarten(teile, jetzt, ZEITZONE, PHASENLOGIK_AB);

  async function senden(schluessel: string, bauen: () => Vorgang, text: string) {
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
      setFehler(undefined);
      vorgangFuer.current = undefined;
      setErgebnis({ text, vorgang });
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
      };
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
    }
  }

  function zuruecknehmen() {
    if (!ergebnis) return;
    const v = phasenRueckgaengig(ergebnis.vorgang, teile);
    void senden(`rueck|${JSON.stringify(v)}`, () => v, 'Rückgängig gemacht');
  }

  function alleJa(karte: Fragekarte) {
    const antworten = karte.zeilen.map((z) => ({
      satzId: z.satzId,
      antwort: wahl[z.satzId] ?? ('ja' as Antwort),
    }));
    void senden(
      `ja|${JSON.stringify(antworten)}`,
      () => antwortVorgang(teile, antworten, neueClientId, uhrJetzt(), ZEITZONE, PHASENLOGIK_AB),
      `Gespeichert: ${karte.titel}`,
    );
  }

  function alleUebernehmen() {
    const zeilen = (k.nachfuehren?.zeilen ?? []).map((z) => ({
      satzId: z.satzId,
      wechsel: z.wechsel.map((w) => ({ phase: w.phase, am: w.am })),
    }));
    void senden(
      `nach|${JSON.stringify(zeilen)}`,
      () => nachfuehrVorgang(teile, zeilen, neueClientId, uhrJetzt(), ZEITZONE, PHASENLOGIK_AB),
      `Gespeichert: ${String(zeilen.length)} Sätze nachgeführt`,
    );
  }

  if (!k.nachfuehren && k.fragen.length === 0 && !ergebnis && !fehler) return null;
  return (
    <div className="hv-phasen">
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {ergebnis ? (
        <div className="hv-phasen-ergebnis" role="status">
          <span>{ergebnis.text}</span>
          {ergebnis.text !== 'Rückgängig gemacht' ? (
            <Button variant="secondary" size="compact" disabled={sendet} onClick={zuruecknehmen}>
              Rückgängig machen
            </Button>
          ) : null}
        </div>
      ) : null}
      {k.nachfuehren ? (
        <Card
          title={k.nachfuehren.titel}
          footer={
            <Button disabled={sendet} onClick={alleUebernehmen}>
              Alle übernehmen
            </Button>
          }
        >
          <Button variant="secondary" size="compact" disabled={sendet} onClick={alleUebernehmen}>
            Alle übernehmen
          </Button>
          <ul className="hv-phasen-liste">
            {k.nachfuehren.zeilen.map((z) => (
              <li key={z.satzId}>
                {`${z.sorte} · ${z.ort} · heute ${PHASE_NAME[z.phaseHeute]}: `}
                {z.wechsel.map((w) => `${PHASE_NAME[w.phase]} ab ${tagKurz(w.am)}`).join(', ')}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {k.fragen.map((karte) => (
        <Card
          key={karte.titel}
          title={karte.titel}
          footer={
            <Button disabled={sendet} onClick={() => alleJa(karte)}>
              Alle Ja
            </Button>
          }
        >
          {karte.frage ? <p className="hv-phasen-frage">{`${karte.frage}?`.replace(/\?\?$/, '?')}</p> : null}
          {karte.zeilen.map((z) => (
            <div
              key={z.satzId}
              className="hv-phasen-zeile"
              role="group"
              aria-label={`${z.sorte} · ${z.uebergang}`}
            >
              <span>
                {`${z.sorte} · ${z.uebergang} · ${z.text}`}
                {z.pruefen ? ' · prüfen' : ''}
                {karte.frage ? '' : ` · ${z.frage}`}
              </span>
              <div className="hv-phasen-knoepfe">
                {ANTWORTEN.map((a) => (
                  <Button
                    key={a.wert}
                    variant="secondary"
                    size="compact"
                    aria-pressed={(wahl[z.satzId] ?? 'ja') === a.wert}
                    onClick={() => setWahl((alt) => ({ ...alt, [z.satzId]: a.wert }))}
                  >
                    {a.text}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
