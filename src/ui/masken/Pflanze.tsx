// Pflanzenansicht, Phasenteil (Regal, Plan 35; R1.5, UC6-AK6): Stand der Phase, Wechsel bestätigen oder aufschieben,
// Datum korrigieren, Verlauf. Antworten am Satz der Pflanzung über schreiben().
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { zeilen } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { KULTURFORM_NAME } from '../../domain/pflanzung/saeen.ts';
import {
  antwortVorgang,
  korrekturGrenze,
  korrekturVorgang,
  phasenRueckgaengig,
  phasenStand,
  phasenVerlauf,
  PHASENLOGIK_AB,
  wissenFuer,
} from '../../domain/phasen/fragen.ts';
import { PHASE_NAME, type Phase } from '../../domain/phasen/profil.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const uhrJetzt = () => new Date(Date.now());
const SPERRE_MS = 400;
const ANTWORT_TEXT = { ja: 'Ja', noch_nicht: 'Noch nicht', problem: 'Problem' } as const;

export function Pflanze({ pflanzung }: { pflanzung: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const [korrigieren, setKorrigieren] = useState(false);
  const [versatz, setVersatz] = useState(0);
  const [fehler, setFehler] = useState<string>();
  // Ergebnis mit Stand vor dem Speichern für Rückgängig (Runde 1 Befund 4)
  const [ergebnis, setErgebnis] = useState<{ text: string; vorgang: Vorgang; teile: typeof teile }>();
  const [wissenPhase, setWissenPhase] = useState<Phase>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);

  const p = zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').find((x) => x.id === pflanzung);
  const satz = zeilen<{ id: string; sorte_id: string; kulturform: string; saatdatum: string }>(
    teile,
    'satz',
  ).find((s) => s.id === p?.satz_id);
  const stand = p ? phasenStand(teile, p.satz_id, jetzt, ZEITZONE) : undefined;
  if (!p || !satz || !stand) {
    return (
      <main className="hv-seite hv-pflanze" data-density="regal">
        <h1 className="hv-seite-titel">Pflanze</h1>
        <p>{liest ? 'Daten werden geladen' : 'Pflanze nicht bekannt'}</p>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }
  const sorte =
    zeilen<{ sorte_id: string; name: string }>(teile, 'sorte').find((s) => s.sorte_id === satz.sorte_id)
      ?.name ?? 'Sorte';
  const platzId = zeilen<{ pflanzung_id: string; platz_id: string | null }>(
    teile,
    'v_pflanzung_zustand',
  ).find((z) => z.pflanzung_id === pflanzung)?.platz_id;
  const ort = zeilen<{ id: string; kennung: string }>(teile, 'platz').find((x) => x.id === platzId)?.kennung;
  const heute = kalendertag(jetzt, ZEITZONE);
  const verlauf = phasenVerlauf(teile, satz.id, ZEITZONE);
  const n = stand.naechste;

  async function senden(schluessel: string, bauen: () => Vorgang, text: string, danach?: () => void) {
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
      setKorrigieren(false);
      setVersatz(0);
      setErgebnis({ text, vorgang, teile });
      danach?.();
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
      };
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
    }
  }

  const antworten = (antwort: 'ja' | 'noch_nicht' | 'problem') =>
    void senden(
      `${satz.id}|${antwort}|${stand.phase}`,
      () =>
        antwortVorgang(
          teile,
          // die angesehene Pflanze löst Blüte und Fruchtbildung aus (Runde 1 Befund 6; die Domäne nimmt sie nur dort)
          [{ satzId: satz.id, antwort, ausloesendePflanzungId: pflanzung }],
          neueClientId,
          uhrJetzt(),
          ZEITZONE,
          PHASENLOGIK_AB,
        ),
      antwort === 'ja' && n ? `Gespeichert: ${PHASE_NAME[n.phase]}` : `Gespeichert: ${ANTWORT_TEXT[antwort]}`,
      () => setWissenPhase(antwort === 'ja' ? n?.phase : stand.phase),
    );
  const grenze = korrekturGrenze(teile, satz.id, jetzt, ZEITZONE);
  const neuerTag = grenze ? tagPlus(grenze.tag, versatz) : stand.beginn;
  const wissenFuerPhase = wissenPhase ?? (stand.pruefen || stand.problemAm ? stand.phase : undefined);
  const wissen = wissenFuerPhase ? wissenFuer(teile, satz.sorte_id, wissenFuerPhase) : undefined;

  function zuruecknehmen() {
    if (!ergebnis) return;
    const v = phasenRueckgaengig(ergebnis.vorgang, ergebnis.teile, neueClientId);
    void senden(
      `rueck|${JSON.stringify(ergebnis.vorgang)}`,
      () => v,
      'Rückgängig gemacht',
      () => setWissenPhase(undefined),
    );
  }

  return (
    <main className="hv-seite hv-pflanze" data-density="regal">
      <h1 className="hv-seite-titel">Pflanze</h1>
      <p className="hv-pflanze-kopf">{`${sorte} · ${KULTURFORM_NAME[satz.kulturform] ?? satz.kulturform}${ort ? ` · ${ort}` : ''}`}</p>
      <p className="hv-pflanze-zeile">{`Tag ${String(stand.tagSeitSaat)} seit Saat`}</p>
      <p className="hv-pflanze-phase">{`${PHASE_NAME[stand.phase]} · ${stand.text}`}</p>
      {n ? (
        <p className="hv-pflanze-zeile">
          {`${PHASE_NAME[n.phase]}${n.fruehestens ? ` frühestens ${tagKurz(n.fruehestens)}` : ''}${n.typisch ? `, typisch ${tagKurz(n.typisch)}` : ''}`}
        </p>
      ) : null}
      {stand.wechselmerkmal ? <p className="hv-pflanze-zeile">{stand.wechselmerkmal}</p> : null}
      {stand.pruefen ? (
        <p className="hv-pflanze-zeile">
          <StatusBadge tone="info">prüfen</StatusBadge>
          {' Länger als üblich'}
        </p>
      ) : null}
      {stand.problemAm ? (
        <p className="hv-pflanze-zeile">{`Problem gemeldet am ${tagKurz(stand.problemAm)}`}</p>
      ) : null}
      {stand.dauerFehlt ? (
        <p className="hv-pflanze-zeile">Dauer fehlt im Katalog: Wechsel nach Merkmal bestätigen</p>
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
      {wissen ? (
        <Notice kompakt tone="info">
          {wissen}
        </Notice>
      ) : null}
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {n ? (
        <div className="hv-pflanze-knoepfe">
          <Button disabled={sendet || !stand.wechselMoeglich} onClick={() => antworten('ja')}>
            Phase wechseln
          </Button>
          {!stand.wechselMoeglich && stand.wechselAb ? (
            <p className="hv-pflanze-zeile">{`möglich ab ${tagKurz(stand.wechselAb)}`}</p>
          ) : null}
          <Button variant="secondary" disabled={sendet} onClick={() => antworten('noch_nicht')}>
            Noch nicht
          </Button>
          <Button variant="secondary" disabled={sendet} onClick={() => antworten('problem')}>
            Problem
          </Button>
        </div>
      ) : null}
      {grenze ? (
        korrigieren ? (
          <div className="hv-pflanze-knoepfe">
            <Stepper
              label="Wechseldatum"
              wert={versatz}
              min={-tageZwischen(grenze.von, grenze.tag)}
              max={tageZwischen(grenze.tag, heute)}
              anzeige={(w) => tagKurz(tagPlus(grenze.tag, w))}
              onWert={setVersatz}
            />
            <Button
              disabled={sendet}
              onClick={() =>
                void senden(
                  `korr|${satz.id}|${neuerTag}`,
                  () => korrekturVorgang(teile, satz.id, neuerTag, neueClientId, uhrJetzt(), ZEITZONE),
                  `Gespeichert: ${PHASE_NAME[stand.phase]} ab ${tagKurz(neuerTag)}`,
                )
              }
            >
              Korrektur speichern
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setKorrigieren(true)}>
            Datum korrigieren
          </Button>
        )
      ) : null}
      <Card title="Verlauf">
        <ul className="hv-phasen-liste">
          {verlauf.map((v, i) => (
            // Text und Tag sind nicht eindeutig (zwei gleiche Antworten am selben Tag): Position dazu (Runde 1 Befund 16)
            <li key={`${String(i)}|${v.tag}|${v.text}`}>{v.text}</li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
