// Pflanzenansicht (Regal; Plan 35 Phasenteil, Plan 38 UC6 Rest): Kopf mit Topf und Platz, Phase wechseln oder
// aufschieben, Datum korrigieren, Sollbereich und Zielbereich, Teilernte und Abernten, Kulturfrage, Blüte melden,
// Ausfall, Verlauf mit Wiederherstellen. Alle Erfassungen über schreiben(); bis zum neuen Bündel rechnet die Maske mit
// teileNach() auf den gespeicherten Vorgängen (Plan 38 A1, Plan 35 A8).
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Teile } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { AUSLOESER_FRAGE, pflanzenAnsicht, wieWeiter } from '../../domain/phasen/ansicht.ts';
import {
  endeRueckgaengig,
  endeWiederherstellenVorgang,
  pflanzenVerlauf,
  teileNach,
} from '../../domain/phasen/ende.ts';
import {
  AUSFALL_URSACHEN,
  ausfallVorgang,
  ernteVorgang,
  kulturEntscheidVorgang,
  schossenVorgang,
  VERLAENGERN_TAGE,
  type AusfallUrsache,
} from '../../domain/phasen/ernte.ts';
import {
  antwortVorgang,
  korrekturGrenze,
  korrekturVorgang,
  phasenRueckgaengig,
  PHASENLOGIK_AB,
  wissenFuer,
} from '../../domain/phasen/fragen.ts';
import { PHASE_NAME, type Phase } from '../../domain/phasen/profil.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const uhrJetzt = () => new Date(Date.now());
const SPERRE_MS = 400;
const ANTWORT_TEXT = { ja: 'Ja', noch_nicht: 'Noch nicht', problem: 'Problem' } as const;
const ENDE_WORT = {
  geerntet: 'Geerntet',
  ausfall: 'Ausfall',
  keimt_nicht: 'Keimt nicht',
  ueberzaehlig: 'Überzählig',
};
const SCHOSSEN_KNOPF = {
  auskneifen: 'Auskneifen und weiter',
  ernten_beenden: 'Sofort ernten und beenden',
  bluete_nutzen: 'Blüte nutzen, weiter',
} as const;

type Art = 'phase' | 'ende';
interface Ergebnis {
  text: string;
  vorgang: Vorgang;
  teile: Teile;
  art: Art;
}

export function Pflanze({ pflanzung }: { pflanzung: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const [korrigieren, setKorrigieren] = useState(false);
  const [versatz, setVersatz] = useState(0);
  const [fehler, setFehler] = useState<string>();
  const [hinweis, setHinweis] = useState<string>();
  const [ergebnis, setErgebnis] = useState<Ergebnis>();
  const [wissenPhase, setWissenPhase] = useState<Phase>();
  // alle seit dem Öffnen gespeicherten Vorgänge; teileNach() ist je client_id idempotent (Plan 38 A1)
  const [gespeichert, setGespeichert] = useState<Vorgang>([]);
  // Phasenknöpfe bis zum neuen Bündel gesperrt, sonst baute ein zweiter Tipp auf dem alten Stand (Plan 35 Runde 2 Befund 3)
  const [phaseBei, setPhaseBei] = useState<typeof teile>();
  const [umfangAlle, setUmfangAlle] = useState(false);
  const [merkmal, setMerkmal] = useState<'ja' | 'nein'>();
  const [bluete, setBluete] = useState(false);
  const [weitere, setWeitere] = useState(false);
  const [ursache, setUrsache] = useState<AusfallUrsache>();
  const [weiter, setWeiter] = useState<ReturnType<typeof wieWeiter>>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);

  const eff = useMemo(
    () => (teile && gespeichert.length > 0 ? teileNach(teile, gespeichert, jetzt, ZEITZONE) : teile),
    [teile, gespeichert, jetzt],
  );
  const a = eff ? pflanzenAnsicht(eff, pflanzung, jetzt, ZEITZONE) : undefined;
  if (!a) {
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
  const stand = a.phase;
  const aktiv = a.status === 'aktiv';
  const gesperrt = phaseBei !== undefined && phaseBei === teile;
  const heute = kalendertag(jetzt, ZEITZONE);
  const verlauf = pflanzenVerlauf(eff, pflanzung, jetzt, ZEITZONE);
  const n = aktiv ? stand?.naechste : undefined;
  const ernte = a.ernte;
  const mehrere = a.umfang.length > 1;
  const ziel = umfangAlle && mehrere ? a.umfang : [pflanzung];
  const kulturFrage = ernte?.kulturFrageAm !== undefined && ernte.kulturFrageAm <= heute;

  async function senden(
    schluessel: string,
    bauen: () => Vorgang | { vorgang: Vorgang; hinweis?: string },
    text: string | ((v: Vorgang) => string),
    art: Art,
    danach?: (v: Vorgang) => void,
  ) {
    if (sperre.current || !eff) return;
    sperre.current = true;
    setSendet(true);
    let ok = false;
    try {
      let vorgang: Vorgang;
      let neuerHinweis: string | undefined;
      if (vorgangFuer.current?.schluessel === schluessel) vorgang = vorgangFuer.current.vorgang;
      else {
        const b = bauen();
        vorgang = 'vorgang' in b ? b.vorgang : b;
        neuerHinweis = 'vorgang' in b ? b.hinweis : undefined;
        if (vorgang.length === 0 && neuerHinweis) {
          setHinweis(neuerHinweis);
          return;
        }
      }
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
      setHinweis(neuerHinweis);
      vorgangFuer.current = undefined;
      setKorrigieren(false);
      setVersatz(0);
      setBluete(false);
      setWeitere(false);
      setUrsache(undefined);
      setWeiter(art === 'ende' ? wieWeiter(eff, vorgang, jetzt, ZEITZONE) : undefined);
      setErgebnis({ text: typeof text === 'string' ? text : text(vorgang), vorgang, teile: eff, art });
      setGespeichert((alt) => [...alt, ...vorgang]);
      if (art === 'phase') setPhaseBei(teile);
      danach?.(vorgang);
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
      `${a.satzId}|${antwort}|${stand?.phase ?? ''}|${merkmal ?? ''}`,
      () =>
        antwortVorgang(
          eff,
          [
            {
              satzId: a.satzId,
              antwort,
              // Fruchtgemüse: auslösende Pflanze nur mit «Ja» (Plan 35 A11, Plan 38)
              ...(antwort === 'ja' && merkmal === 'ja' ? { ausloesendePflanzungId: pflanzung } : {}),
            },
          ],
          neueClientId,
          uhrJetzt(),
          ZEITZONE,
          PHASENLOGIK_AB,
        ),
      antwort === 'ja' && n ? `Gespeichert: ${PHASE_NAME[n.phase]}` : `Gespeichert: ${ANTWORT_TEXT[antwort]}`,
      'phase',
      () => {
        setMerkmal(undefined);
        // Wissenskarte nach Ja (neue Phase) und nach Problem, nicht nach «Noch nicht» (Plan 35 Runde 2 Befund 10)
        setWissenPhase(antwort === 'ja' ? n?.phase : antwort === 'problem' ? stand?.phase : undefined);
      },
    );
  const grenze = gesperrt || !aktiv ? undefined : korrekturGrenze(eff, a.satzId, jetzt, ZEITZONE);
  const neuerTag = grenze ? tagPlus(grenze.tag, versatz) : (stand?.beginn ?? heute);
  const wissenFuerPhase = wissenPhase ?? (stand?.pruefen || stand?.problemAm ? stand.phase : undefined);
  const wissen = wissenFuerPhase ? wissenFuer(eff, a.sorteId, wissenFuerPhase) : undefined;

  function zuruecknehmen() {
    if (!ergebnis) return;
    const v =
      ergebnis.art === 'phase'
        ? phasenRueckgaengig(ergebnis.vorgang, ergebnis.teile, neueClientId)
        : endeRueckgaengig(ergebnis.vorgang);
    void senden(
      `rueck|${JSON.stringify(ergebnis.vorgang)}`,
      () => v,
      'Rückgängig gemacht',
      ergebnis.art,
      () => setWissenPhase(undefined),
    );
  }

  const ernten = (art: 'teil' | 'ab') =>
    void senden(
      `ernte|${art}|${ziel.join(',')}`,
      () => ernteVorgang(eff, { pflanzungIds: ziel, art }, neueClientId, uhrJetzt(), ZEITZONE),
      art === 'teil'
        ? `Gespeichert: Teilernte${ziel.length > 1 ? ` (${String(ziel.length)} Pflanzen)` : ''}`
        : `Gespeichert: Abgeerntet${ziel.length > 1 ? ` (${String(ziel.length)} Pflanzen)` : ''}`,
      'ende',
    );
  const entscheiden = (entscheid: 'beenden' | 'verlaengern') =>
    void senden(
      `kultur|${a.satzId}|${entscheid}`,
      () => kulturEntscheidVorgang(eff, a.satzId, entscheid, neueClientId, uhrJetzt(), ZEITZONE),
      (v) =>
        entscheid === 'beenden'
          ? `Beendet: ${String(v.length - 1)} ${v.length - 1 === 1 ? 'Pflanze' : 'Pflanzen'} ${a.sorte}`
          : `Verlängert um ${String(VERLAENGERN_TAGE)} Tage: ${a.sorte}`,
      'ende',
    );
  const ende = a.ende;
  const endeText = ende ? `${ENDE_WORT[ende.grund]} am ${tagKurz(ende.tag)}` : undefined;

  return (
    <main className="hv-seite hv-pflanze" data-density="regal">
      <h1 className="hv-seite-titel">Pflanze</h1>
      <p className="hv-pflanze-kopf">{a.kopf.titel}</p>
      {a.kopf.mitTopf ? (
        <p className="hv-pflanze-zeile">{`Topf ${a.kopf.ort}`}</p>
      ) : a.kopf.ort && a.kopf.ort !== a.kopf.titel.split(' · ').at(-1) ? (
        <p className="hv-pflanze-zeile">{`Ort ${a.kopf.ort}`}</p>
      ) : null}
      <p className="hv-pflanze-zeile">{`Tag ${String(a.kopf.tagSeitSaat)} seit Saat`}</p>
      {endeText ? (
        <p className="hv-pflanze-zeile">
          <StatusBadge tone="neutral">{endeText}</StatusBadge>
        </p>
      ) : null}
      {stand && aktiv ? (
        <p className="hv-pflanze-phase">{`${PHASE_NAME[stand.phase]} · ${stand.text}`}</p>
      ) : null}
      {n ? (
        <p className="hv-pflanze-zeile">
          {`${PHASE_NAME[n.phase]}${n.fruehestens ? ` frühestens ${tagKurz(n.fruehestens)}` : ''}${n.typisch ? `, typisch ${tagKurz(n.typisch)}` : ''}`}
        </p>
      ) : null}
      {aktiv && stand?.wechselmerkmal ? <p className="hv-pflanze-zeile">{stand.wechselmerkmal}</p> : null}
      {aktiv && stand?.pruefen ? (
        <p className="hv-pflanze-zeile">
          <StatusBadge tone="info">prüfen</StatusBadge>
          {' Länger als üblich'}
        </p>
      ) : null}
      {aktiv && stand?.problemAm ? (
        <p className="hv-pflanze-zeile">{`Problem gemeldet am ${tagKurz(stand.problemAm)}`}</p>
      ) : null}
      {aktiv && stand?.dauerFehlt ? (
        <p className="hv-pflanze-zeile">Dauer fehlt im Katalog: Wechsel nach Merkmal bestätigen</p>
      ) : null}
      {a.naechsterSchritt ? <p className="hv-pflanze-zeile">{a.naechsterSchritt.text}</p> : null}
      {ergebnis ? (
        <div className="hv-phasen-ergebnis" role="status">
          <span>{ergebnis.text}</span>
          {ergebnis.text !== 'Rückgängig gemacht' &&
          (ergebnis.art === 'phase' || endeRueckgaengig(ergebnis.vorgang).length > 0) ? (
            <Button variant="secondary" size="compact" disabled={sendet} onClick={zuruecknehmen}>
              Rückgängig machen
            </Button>
          ) : null}
        </div>
      ) : null}
      {weiter ? (
        <Notice
          kompakt
          tone="info"
          title="Wie weiter?"
          action={
            <span className="hv-pflanze-knoepfe">
              {weiter.links.map((l) => (
                <a key={l.href} className="hv-btn hv-btn-secondary hv-btn-compact" href={l.href}>
                  {l.text}
                </a>
              ))}
            </span>
          }
        >
          {`Gefäss ${weiter.kennung} ist leer.`}
        </Notice>
      ) : null}
      {wissen && aktiv ? (
        <Notice kompakt tone="info">
          {wissen}
        </Notice>
      ) : null}
      {hinweis ? (
        <Notice kompakt tone="warn">
          {hinweis}
        </Notice>
      ) : null}
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {n ? (
        <div className="hv-pflanze-knoepfe">
          {a.ausloeserFrage ? (
            <Choice
              label={AUSLOESER_FRAGE}
              zeile
              optionen={[
                { wert: 'ja', titel: 'Ja' },
                { wert: 'nein', titel: 'Überspringen' },
              ]}
              gewaehlt={merkmal ? [merkmal] : []}
              onWahl={(w) => setMerkmal(w === merkmal ? undefined : (w as 'ja' | 'nein'))}
            />
          ) : null}
          <Button disabled={sendet || gesperrt || !stand?.wechselMoeglich} onClick={() => antworten('ja')}>
            Phase wechseln
          </Button>
          {!stand?.wechselMoeglich && stand?.wechselAb ? (
            <p className="hv-pflanze-zeile">{`möglich ab ${tagKurz(stand.wechselAb)}`}</p>
          ) : null}
          <Button variant="secondary" disabled={sendet || gesperrt} onClick={() => antworten('noch_nicht')}>
            Noch nicht
          </Button>
          <Button variant="secondary" disabled={sendet || gesperrt} onClick={() => antworten('problem')}>
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
                  `korr|${a.satzId}|${neuerTag}`,
                  () => korrekturVorgang(eff, a.satzId, neuerTag, neueClientId, uhrJetzt(), ZEITZONE),
                  `Gespeichert: ${stand ? PHASE_NAME[stand.phase] : ''} ab ${tagKurz(neuerTag)}`,
                  'phase',
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

      <Card title="Sollbereich" meta={a.soll.verlaesslichkeit === 'belegt' ? 'belegt' : 'Prüfauftrag'}>
        <p className="hv-pflanze-zeile">{a.soll.text}</p>
        {a.ziel ? <p className="hv-pflanze-zeile">{a.ziel.text}</p> : null}
      </Card>

      {aktiv && ernte ? (
        <section className="hv-pflanze-ernte" aria-label="Ernte">
          {ernte.moeglichAb ? (
            <p className="hv-pflanze-zeile">{`Ernte möglich ab ${tagKurz(ernte.moeglichAb)}`}</p>
          ) : null}
          {ernte.schnitteMax !== undefined && ernte.teilernten > 0 ? (
            <p className="hv-pflanze-zeile">{`${String(ernte.teilernten)} von ${String(ernte.schnitteMax)} Schnitten`}</p>
          ) : null}
          {ernte.ernteart === undefined ? (
            <p className="hv-pflanze-zeile">Erntetermine fehlen im Katalog</p>
          ) : null}
          {kulturFrage ? (
            <Notice
              kompakt
              tone="warn"
              title="Kultur beenden oder verlängern?"
              action={
                <span className="hv-pflanze-knoepfe">
                  <Button variant="secondary" disabled={sendet} onClick={() => entscheiden('beenden')}>
                    Beenden
                  </Button>
                  <Button variant="secondary" disabled={sendet} onClick={() => entscheiden('verlaengern')}>
                    {`Verlängern um ${String(VERLAENGERN_TAGE)} Tage`}
                  </Button>
                </span>
              }
            />
          ) : null}
          {mehrere ? (
            <Choice
              label="Umfang"
              zeile
              optionen={[
                { wert: 'eins', titel: 'Dieser Topf' },
                { wert: 'alle', titel: `Alle ${String(a.umfang.length)} im Satz` },
              ]}
              gewaehlt={[umfangAlle ? 'alle' : 'eins']}
              onWahl={(w) => setUmfangAlle(w === 'alle')}
            />
          ) : null}
          {ernte.teilernteErlaubt ? (
            <Button disabled={sendet} onClick={() => ernten('teil')}>
              Teilernte
            </Button>
          ) : null}
          <div className={ernte.teilernteErlaubt ? 'hv-pflanze-abernten' : undefined}>
            <Button
              variant={ernte.teilernteErlaubt ? 'secondary' : 'primary'}
              disabled={sendet}
              onClick={() => ernten('ab')}
            >
              Abernten
            </Button>
          </div>
        </section>
      ) : null}

      {aktiv && ernte?.schossenHandlung ? (
        <section className="hv-pflanze-weitere" aria-label="Blüte">
          <Button variant="secondary" onClick={() => setBluete((x) => !x)}>
            Blüte melden
          </Button>
          {bluete ? (
            <Notice
              kompakt
              tone="info"
              title="Blüte: Schossen"
              action={
                <Button
                  variant="secondary"
                  disabled={sendet}
                  onClick={() =>
                    void senden(
                      `schossen|${pflanzung}`,
                      () => schossenVorgang(eff, pflanzung, neueClientId, uhrJetzt(), ZEITZONE),
                      'Gespeichert: Blüte',
                      'ende',
                    )
                  }
                >
                  {SCHOSSEN_KNOPF[ernte.schossenHandlung]}
                </Button>
              }
            >
              {a.wissenSchossen}
            </Notice>
          ) : null}
        </section>
      ) : null}

      {aktiv ? (
        <section className="hv-pflanze-weitere" aria-label="Weitere Aktionen">
          <Button variant="secondary" onClick={() => setWeitere((x) => !x)}>
            Weitere Aktionen
          </Button>
          {weitere ? (
            <div className="hv-pflanze-knoepfe">
              {a.umsetzen ? (
                <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'umsetzen', satz: a.satzId })}>
                  Umsetzen
                </a>
              ) : null}
              {a.topf ? (
                <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'verschieben', topf: a.topf })}>
                  Verschieben
                </a>
              ) : null}
              <Choice
                label="Ursache (wahlweise)"
                zeile
                optionen={AUSFALL_URSACHEN.map((u) => ({ wert: u, titel: u }))}
                gewaehlt={ursache ? [ursache] : []}
                onWahl={(w) => setUrsache(w === ursache ? undefined : (w as AusfallUrsache))}
              />
              <Button
                variant="secondary"
                disabled={sendet}
                onClick={() =>
                  void senden(
                    `ausfall|${pflanzung}|${ursache ?? ''}`,
                    () => ausfallVorgang(eff, pflanzung, ursache, neueClientId, uhrJetzt(), ZEITZONE),
                    `Gespeichert: Ausfall${ursache ? ` (${ursache})` : ''}`,
                    'ende',
                  )
                }
              >
                Ausfall speichern
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <Card title="Verlauf">
        <ul className="hv-phasen-liste">
          {verlauf.map((v, i) => (
            // Text und Tag sind nicht eindeutig: Position dazu (Plan 35 Runde 1 Befund 16)
            <li key={`${String(i)}|${v.tag}|${v.text}`}>
              {v.text}
              {v.wiederherstellen ? (
                <>
                  {' '}
                  <Button
                    variant="secondary"
                    size="compact"
                    disabled={sendet}
                    onClick={() =>
                      void senden(
                        `wieder|${pflanzung}`,
                        () => endeWiederherstellenVorgang(eff, pflanzung, neueClientId, uhrJetzt(), ZEITZONE),
                        'Gespeichert: Wiederhergestellt',
                        'ende',
                      )
                    }
                  >
                    Wiederherstellen
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        {ende?.gesperrt ? <p className="hv-pflanze-zeile">{ende.gesperrt}</p> : null}
      </Card>
    </main>
  );
}
