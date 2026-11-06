// Pflanzenansicht, Phasenteil (Regal, Plan 35; R1.5, UC6-AK6): Stand der Phase, Wechsel bestätigen oder aufschieben,
// Datum korrigieren, Verlauf. Antworten am Satz der Pflanzung über schreiben().
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { zeilen } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { KULTURFORM_NAME } from '../../domain/pflanzung/saeen.ts';
import {
  antwortVorgang,
  korrekturVorgang,
  phasenStand,
  phasenVerlauf,
  PHASENLOGIK_AB,
} from '../../domain/phasen/fragen.ts';
import { PHASE_NAME } from '../../domain/phasen/profil.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const uhrJetzt = () => new Date(Date.now());
const SPERRE_MS = 400;

export function Pflanze({ pflanzung }: { pflanzung: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const [korrigieren, setKorrigieren] = useState(false);
  const [versatz, setVersatz] = useState(0);
  const [fehler, setFehler] = useState<string>();
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

  async function senden(schluessel: string, bauen: () => Vorgang) {
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
    void senden(`${satz.id}|${antwort}|${stand.phase}`, () =>
      antwortVorgang(
        teile,
        [{ satzId: satz.id, antwort }],
        neueClientId,
        uhrJetzt(),
        ZEITZONE,
        PHASENLOGIK_AB,
      ),
    );
  const neuerTag = tagPlus(stand.beginn, versatz);

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
        <Notice kompakt tone="warn">
          Länger als üblich: prüfen
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
      {verlauf.some((v) => !v.korrektur) || verlauf.length > 0 ? (
        korrigieren ? (
          <div className="hv-pflanze-knoepfe">
            <Stepper
              label="Wechseldatum"
              wert={versatz}
              min={-60}
              max={tageZwischen(stand.beginn, heute)}
              anzeige={(w) => tagKurz(tagPlus(stand.beginn, w))}
              onWert={setVersatz}
            />
            <Button
              disabled={sendet}
              onClick={() =>
                void senden(`korr|${satz.id}|${neuerTag}`, () =>
                  korrekturVorgang(teile, satz.id, neuerTag, neueClientId, uhrJetzt(), ZEITZONE),
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
          {verlauf.map((v) => (
            <li key={`${v.tag}|${v.text}`}>{v.text}</li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
