// Phasenfragen und «Phasen nachführen» in Heute (Plan 35; UC6-AK6, R1.5, R1.6): eine Karte je Ort, Art und Saatdatum
// mit Ja (vorgewählt), Noch nicht, Problem und [Alle Ja]; Karte «Phasen nachführen» mit Stepper je Wechsel,
// «Ohne letzten Wechsel» und [Alle übernehmen]. Seit UX4 (Plan 226): gleiche Sätze einer Karte als eine Zeile
// «Sorte × n» mit den drei Antworten als Segmente; «Einzeln beantworten» klappt die Sätze auf. Jede Wahl ist nur
// vorgemerkt, geschrieben wird mit [Alle Ja] (ein Vorgang je Karte, Antworten am Satz).
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import {
  antwortVorgang,
  nachfuehrVorgang,
  phasenKarten,
  phasenRueckgaengig,
  PHASENLOGIK_AB,
  pflanzungVonSatz,
  type Fragekarte,
} from '../../domain/phasen/fragen.ts';
import {
  gruppenAntworten,
  phasenGruppen,
  type Antwort,
  type Fragegruppe,
  type GruppenWahl,
} from '../../domain/phasen/gruppen.ts';
import { KULTURFORM_NAME } from '../../domain/pflanzung/saeen.ts';
import { PHASE_NAME } from '../../domain/phasen/profil.ts';
import { tagKurz, tagPlus, tageZwischen, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { useMelden } from '../meldung.tsx';
import { hashZu } from '../router.ts';
import '../phasen.css';

const ANTWORTEN = [
  { wert: 'ja', titel: 'Ja' },
  { wert: 'noch_nicht', titel: 'Noch nicht' },
  { wert: 'problem', titel: 'Problem' },
];
const SPERRE_MS = 400;
const uhrJetzt = () => new Date(Date.now());
const KEINE_WAHL: GruppenWahl = { gruppe: {}, satz: {} };

export function Phasenkarten({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const melden = useMelden();
  const teile = buendel?.teile;
  // vorgemerkte Antworten und «Einzeln beantworten» je Karte (Titel)
  const [wahl, setWahl] = useState<Record<string, GruppenWahl>>({});
  const [offen, setOffen] = useState<Record<string, boolean>>({});
  // Nachführen: Versatz je Wechsel in Tagen gegen den vorbelegten Tag, «Ohne letzten Wechsel» je Satz
  const [versatz, setVersatz] = useState<Record<string, number[]>>({});
  const [ohneLetzten, setOhneLetzten] = useState<Record<string, boolean>>({});
  // gespeicherte Sätze bis zum neuen Bündel ausblenden, damit kein zweiter Vorgang entsteht (Runde 1 Befund 9)
  // an das Bündel des Speicherns gebunden: mit dem neuen Bündel erscheinen Folgefragen wieder (R1.6; Runde 2 Befund 6)
  const [erledigtBei, setErledigtBei] = useState<{ teile: typeof teile; saetze: string[] }>();
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  // derselbe Vorgang bei Wiederholung derselben Eingabe (TO2)
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);
  if (!teile) return null;
  const erledigt = erledigtBei?.teile === teile ? erledigtBei.saetze : [];
  const roh = phasenKarten(teile, jetzt, ZEITZONE, PHASENLOGIK_AB);
  const nachZeilen = (roh.nachfuehren?.zeilen ?? []).filter((z) => !erledigt.includes(z.satzId));
  const fragen = roh.fragen
    .map((k) => ({ ...k, zeilen: k.zeilen.filter((z) => !erledigt.includes(z.satzId)) }))
    .filter((k) => k.zeilen.length > 0);

  async function senden(
    schluessel: string,
    bauen: () => Vorgang,
    text: string,
    saetze: string[],
  ): Promise<boolean> {
    if (sperre.current) return false;
    sperre.current = true;
    setSendet(true);
    let ok = false;
    try {
      const vorgang = vorgangFuer.current?.schluessel === schluessel ? vorgangFuer.current.vorgang : bauen();
      if (vorgang.length === 0) {
        setFehler('Eingabe nicht gültig, nicht gespeichert');
        return false;
      }
      vorgangFuer.current = { schluessel, vorgang };
      const r = await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status !== 'gespeichert') {
        setFehler(r.status === 'nicht_gespeichert' ? r.fehler.text : 'Schon anders gespeichert');
        return false;
      }
      ok = true;
      setFehler(undefined);
      vorgangFuer.current = undefined;
      setErledigtBei((alt) => ({
        teile,
        saetze: [...(alt && alt.teile === teile ? alt.saetze : []), ...saetze],
      }));
      // UX2 (Plan 224): die Meldung steht fest unten im Bild; Rückgängig mit dem Stand vor dem Speichern (Runde 1
      // Befund 5), danach erscheinen die Karten wieder (Runde 2 Befund 6)
      melden({
        text,
        rueckgaengig: phasenRueckgaengig(vorgang, teile, neueClientId),
        nachRueckgaengig: () => setErledigtBei(undefined),
      });
      return true;
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
      };
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
    }
  }

  function alleJa(karte: Fragekarte, gruppen: readonly Fragegruppe[]) {
    const antworten = gruppenAntworten(gruppen, wahl[karte.titel] ?? KEINE_WAHL);
    void senden(
      `ja|${JSON.stringify(antworten)}`,
      () => antwortVorgang(teile, antworten, neueClientId, uhrJetzt(), ZEITZONE, PHASENLOGIK_AB),
      `Gespeichert: ${karte.titel}`,
      karte.zeilen.map((z) => z.satzId),
    );
  }

  /** Platz für die späteren Wechsel lassen: je einen Tag vor heute (Runde 2 Befund 1) */
  const obergrenzeVon = (z: (typeof nachZeilen)[number], i: number) =>
    tagPlus((z.wechsel[i] as { grenze: { bis: string } }).grenze.bis, -(z.wechsel.length - 1 - i));

  /** wirksame Tage je Wechsel: nie vor oder am vorigen Wechsel, spätere ziehen mit (Runde 2 Befund 1) */
  function tageVon(z: (typeof nachZeilen)[number]): string[] {
    const tage: string[] = [];
    for (const [i, w] of z.wechsel.entries()) {
      const gewuenscht = tagPlus(w.am, versatz[z.satzId]?.[i] ?? 0);
      const vorher = tage[i - 1];
      const untergrenze = vorher ? tagPlus(vorher, 1) : w.grenze.von;
      const obergrenze = obergrenzeVon(z, i);
      tage.push(gewuenscht < untergrenze ? untergrenze : gewuenscht > obergrenze ? obergrenze : gewuenscht);
    }
    return tage;
  }

  function alleUebernehmen() {
    const eintraege = nachZeilen.map((z) => {
      const tage = tageVon(z);
      const wechsel = z.wechsel.map((w, i) => ({ phase: w.phase, am: tage[i] ?? w.am }));
      return { satzId: z.satzId, wechsel: ohneLetzten[z.satzId] ? wechsel.slice(0, -1) : wechsel };
    });
    const mitWechsel = eintraege.filter((e) => e.wechsel.length > 0);
    void senden(
      `nach|${JSON.stringify(eintraege)}`,
      () => nachfuehrVorgang(teile, mitWechsel, neueClientId, uhrJetzt(), ZEITZONE, PHASENLOGIK_AB),
      `Gespeichert: ${String(mitWechsel.length)} ${mitWechsel.length === 1 ? 'Satz' : 'Sätze'} nachgeführt`,
      eintraege.map((e) => e.satzId),
    );
  }

  const sorteLink = (satzId: string, sorte: string) => {
    const p = pflanzungVonSatz(teile, satzId);
    return p ? <a href={hashZu({ name: 'pflanze', pflanzung: p })}>{sorte}</a> : sorte;
  };

  if (nachZeilen.length === 0 && fragen.length === 0 && !fehler) return null;
  return (
    <div className="hv-phasen">
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {nachZeilen.length > 0 ? (
        <Card
          title={`Phasen nachführen (${String(nachZeilen.length)} ${nachZeilen.length === 1 ? 'Satz' : 'Sätze'})`}
          footer={
            <Button disabled={sendet} onClick={alleUebernehmen}>
              Alle übernehmen
            </Button>
          }
        >
          {nachZeilen.map((z) => {
            const tage = tageVon(z);
            const ohne = ohneLetzten[z.satzId] === true;
            const bisPhase = ohne ? z.wechsel.at(-2)?.phase : z.phaseHeute;
            return (
              <div key={z.satzId} className="hv-phasen-zeile">
                <span>
                  {sorteLink(z.satzId, z.sorte)}
                  {` · ${z.ort} · ${bisPhase ? `heute ${PHASE_NAME[bisPhase]}` : 'ohne Wechsel'}`}
                </span>
                {z.wechsel.map((w, i) => {
                  if (ohne && i === z.wechsel.length - 1) return null;
                  const vorher = tage[i - 1];
                  const von = vorher ? tagPlus(vorher, 1) : w.grenze.von;
                  return (
                    <Stepper
                      key={w.phase}
                      label={`${z.sorte} ${PHASE_NAME[w.phase]} ab`}
                      wert={tageZwischen(w.am, tage[i] ?? w.am)}
                      min={tageZwischen(w.am, von)}
                      max={tageZwischen(w.am, obergrenzeVon(z, i))}
                      anzeige={(v) => tagKurz(tagPlus(w.am, v))}
                      onWert={(v) =>
                        setVersatz((alt) => {
                          const liste = z.wechsel.map((x, k) => tageZwischen(x.am, tage[k] ?? x.am));
                          liste[i] = v;
                          return { ...alt, [z.satzId]: liste };
                        })
                      }
                    />
                  );
                })}
                {z.wechsel.length > 0 ? (
                  <Choice
                    label={`${z.sorte} letzter Wechsel`}
                    zeile
                    optionen={[{ wert: 'ohne', titel: 'Ohne letzten Wechsel' }]}
                    gewaehlt={ohne ? ['ohne'] : []}
                    onWahl={() => setOhneLetzten((alt) => ({ ...alt, [z.satzId]: !alt[z.satzId] }))}
                  />
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : null}
      {fragen.map((karte) => {
        const gruppen = phasenGruppen(teile, karte);
        const w = wahl[karte.titel] ?? KEINE_WAHL;
        const istOffen = offen[karte.titel] === true;
        const mehrfach = gruppen.some((g) => g.zeilen.length > 1);
        // gemeinsamer Übergang einmal im Kartenkopf, damit die Gruppenzeile kurz bleibt: mit Wechselmerkmal als
        // «Anzucht: Keimblätter offen?» (Zielphase und Frage in einer Zeile), sonst «Keimung → Anzucht» (A)
        const uebergaenge = new Set(gruppen.map((g) => g.uebergang));
        const [gemeinsam] = uebergaenge.size === 1 ? [...uebergaenge] : [];
        const frage = karte.frage ? `${karte.frage}?`.replace(/\?\?$/, '?') : undefined;
        const ziel = gemeinsam && gruppen[0] ? PHASE_NAME[gruppen[0].nach] : undefined;
        const kopf = frage ? (ziel ? `${ziel}: ${frage}` : frage) : gemeinsam;
        const setzen = (neu: GruppenWahl) => setWahl((alt) => ({ ...alt, [karte.titel]: neu }));
        return (
          <Card
            key={karte.titel}
            title={karte.titel}
            footer={
              <span className="hv-phasen-fuss">
                {mehrfach ? (
                  <Button
                    variant="secondary"
                    aria-expanded={istOffen}
                    onClick={() => setOffen((alt) => ({ ...alt, [karte.titel]: !istOffen }))}
                  >
                    Einzeln beantworten
                  </Button>
                ) : null}
                <Button disabled={sendet} onClick={() => alleJa(karte, gruppen)}>
                  Alle Ja
                </Button>
              </span>
            }
          >
            <div className="hv-phasen-gruppen">
              {kopf ? <p className="hv-phasen-frage">{kopf}</p> : null}
              {gruppen.map((g) => {
                const antworten = g.zeilen.map((z) => w.satz[z.satzId] ?? w.gruppe[g.schluessel] ?? 'ja');
                const haeufig = w.gruppe[g.schluessel] ?? 'ja';
                const abweichend = antworten.filter((x) => x !== haeufig).length;
                // gleiche Sorte mit gleichem Übergang zweimal in der Karte: die Kulturform unterscheidet
                const doppelt = gruppen.some(
                  (x) => x !== g && x.sorte === g.sorte && x.uebergang === g.uebergang,
                );
                const form = KULTURFORM_NAME[g.kulturform] ?? g.kulturform;
                const name = `${g.sorte} · ${g.uebergang}${doppelt ? ` · ${form}` : ''}`;
                return (
                  <div key={g.schluessel} className="hv-phasen-gruppe">
                    <span className="hv-phasen-kopfzeile">
                      <span>
                        {sorteLink(g.zeilen[0]?.satzId ?? '', g.sorte)}
                        {g.pflanzungen > 1 ? ` × ${String(g.pflanzungen)}` : ''}
                        {doppelt ? ` · ${form}` : ''}
                      </span>
                      <span className="hv-phasen-neben">
                        {[
                          gemeinsam ? undefined : g.uebergang,
                          g.text,
                          karte.frage ? undefined : g.frage,
                          abweichend > 0 ? `${String(abweichend)} abweichend` : undefined,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {g.pruefen ? <StatusBadge tone="info">prüfen</StatusBadge> : null}
                    </span>
                    <Choice
                      einzeln
                      segmente
                      label={name}
                      optionen={ANTWORTEN}
                      gewaehlt={abweichend > 0 ? [] : [haeufig]}
                      onWahl={(x) => {
                        // die Gruppenwahl gilt für alle Sätze der Gruppe: Einzelwahlen der Gruppe entfallen
                        const eigene = new Set(g.zeilen.map((z) => z.satzId));
                        const satz = Object.fromEntries(
                          Object.entries(w.satz).filter(([id]) => !eigene.has(id)),
                        );
                        setzen({ gruppe: { ...w.gruppe, [g.schluessel]: x as Antwort }, satz });
                      }}
                    />
                    {istOffen && g.zeilen.length > 1
                      ? g.zeilen.map((z, i) => (
                          <div key={z.satzId} className="hv-phasen-einzeln">
                            <span className="hv-phasen-kopfzeile">
                              <span>{sorteLink(z.satzId, `${z.sorte} ${String(i + 1)}`)}</span>
                              <span className="hv-phasen-neben">{z.text}</span>
                            </span>
                            <Choice
                              einzeln
                              segmente
                              label={`${z.sorte} ${String(i + 1)} · ${z.uebergang}`}
                              optionen={ANTWORTEN}
                              gewaehlt={[antworten[i] ?? 'ja']}
                              onWahl={(x) => setzen({ ...w, satz: { ...w.satz, [z.satzId]: x as Antwort } })}
                            />
                          </div>
                        ))
                      : null}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
