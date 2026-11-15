// Keimung prüfen je Anzuchtbox #/keimung/box/<code> (Plan 227, UX5-AK3, UX5-AK4): alle fälligen Sätze der Box
// untereinander, je Satz «Alle gekeimt» vorgewählt, Abweichung je Schwamm wie in der Maske je Satz; die Keimtemperatur
// einmal je Box. Die Stationsplätze stehen als Text (ohne eigenen Schritt, Plan 227 A4). Ein Tipp auf «Keimung
// speichern» schreibt alle Sätze in einem Vorgang über schreiben(); «Rückgängig machen» storniert ihn. Regal-Dichte,
// keine Systemtastatur.
import { useLayoutEffect, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { zeilen, type Teile } from '../../domain/anlage/teile.ts';
import { verteilteAufgaben } from '../../domain/aufgaben-verteilung.ts';
import { einstellungenAus } from '../../domain/aufgaben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import {
  keimBoxSaetze,
  keimBoxVorgang,
  type KeimBoxErgebnis,
  type KeimBoxWahl,
} from '../../domain/pflanzung/keimbox.ts';
import {
  HINWEIS_NICHT_ECHT,
  keimAnsicht,
  keimZusammenfassung,
  type KeimAnsicht,
  type KeimEingabe,
  type Schwamm,
} from '../../domain/pflanzung/keimung.ts';
import { KULTURFORM_NAME, saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';
import { NachSpeichern, useHeuteVorher } from '../NachSpeichern.tsx';
import { fertigText, schwammName } from './keimungErgebnis.ts';

const SPERRE_MS = 400;
const saetzeText = (n: number) => `${n} ${n === 1 ? 'Satz' : 'Sätze'}`;
const schwaemmeText = (n: number) => `${n} ${n === 1 ? 'Schwamm' : 'Schwämme'}`;

type Abweichung = Record<string, Record<string, number | 'offen'>>;

interface Bestaetigung {
  vorgang: Vorgang;
  kopf: string;
  zeilen: string[];
  warnungen: string[];
  nachsaeen: string[];
  zurueck?: boolean;
}

function vorschauIds(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `vorschau-${n}`;
  };
}

/** fällige Sätze der Box beim Öffnen; ein Fehler der Rechnung zeigt die Maske ohne Sätze */
function faelligeSaetze(teile: NonNullable<Teile>, platzId: string): string[] {
  try {
    const t = jetzt();
    return keimBoxSaetze(verteilteAufgaben(teile, einstellungenAus(teile), t, ZEITZONE), platzId);
  } catch (fehler) {
    console.error('Aufgaben-Rechnung', fehler);
    return [];
  }
}

/** «1–6», «7, 9–12»: Löcher als Bereiche */
function lochText(loecher: readonly number[]): string {
  const sortiert = [...loecher].sort((a, b) => a - b);
  const teile: string[] = [];
  let von: number | undefined;
  let bis: number | undefined;
  const schliessen = () => {
    if (von !== undefined && bis !== undefined) teile.push(von === bis ? `${von}` : `${von}–${bis}`);
  };
  for (const n of sortiert) {
    if (bis !== undefined && n === bis + 1) bis = n;
    else {
      schliessen();
      von = n;
      bis = n;
    }
  }
  schliessen();
  return teile.join(', ');
}

/** Zeilen zur Station eines Satzes aus der Vorschau («Station 4.4: Loch 1–6») */
function stationsZeilen(teile: Teile, vorschlag: KeimBoxErgebnis['je'][number]['vorschlag']): string[] {
  if (!vorschlag) return [];
  const kennung = (platzId: string) =>
    zeilen<{ id: string; kennung: string }>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';
  const jeStation = new Map<string, number[]>();
  for (const z of vorschlag.zuweisung)
    jeStation.set(z.platzId, [...(jeStation.get(z.platzId) ?? []), z.lochNr]);
  const text = [...jeStation].map(([id, loecher]) => `Station ${kennung(id)}: Loch ${lochText(loecher)}`);
  if (vorschlag.inBoxBis && vorschlag.ohnePlatz.length > 0)
    text.push(
      `Station voll: ${vorschlag.ohnePlatz.length} ${vorschlag.ohnePlatz.length === 1 ? 'Schwamm bleibt' : 'Schwämme bleiben'} bis ${tagKurz(vorschlag.inBoxBis)} in der Box`,
    );
  if (vorschlag.reserveBis && vorschlag.reserve.length > 0)
    text.push(
      `${schwaemmeText(vorschlag.reserve.length)} Reserve in der Box bis ${tagKurz(vorschlag.reserveBis)}`,
    );
  return text;
}

/** Namen der Sätze: die Sorte, bei mehreren Sätzen derselben Sorte mit laufender Nummer */
function satzNamen(ansichten: readonly KeimAnsicht[]): Map<string, string> {
  const anzahl = new Map<string, number>();
  for (const a of ansichten) anzahl.set(a.sorte, (anzahl.get(a.sorte) ?? 0) + 1);
  const lauf = new Map<string, number>();
  const namen = new Map<string, string>();
  for (const a of ansichten) {
    const i = (lauf.get(a.sorte) ?? 0) + 1;
    lauf.set(a.sorte, i);
    namen.set(a.satzId, (anzahl.get(a.sorte) ?? 0) > 1 ? `${a.sorte} ${i}` : a.sorte);
  }
  return namen;
}

function summe(teile: Teile, eingaben: readonly KeimEingabe[]): { gesaet: number; gekeimt: number } {
  let gesaet = 0;
  let gekeimt = 0;
  for (const e of eingaben) {
    const z = keimZusammenfassung(teile, e);
    gesaet += z.gesaet;
    gekeimt += z.gekeimt;
  }
  return { gesaet, gekeimt };
}

/** Bestätigung der Box: Gesamtzeile, je Satz das Ergebnis mit Station, Hinweise und Keimraten je einmal (A10, A11) */
function bestaetigung(
  teile: Teile,
  ansichten: ReadonlyMap<string, KeimAnsicht>,
  namen: ReadonlyMap<string, string>,
  ergebnis: KeimBoxErgebnis,
): Bestaetigung {
  const { gesaet, gekeimt } = summe(
    teile,
    ergebnis.je.map((j) => j.eingabe),
  );
  const je: string[] = [];
  const dazu = new Set<string>();
  const warnungen = new Set<string>();
  const nachsaeen = new Set<string>();
  for (const j of ergebnis.je) {
    const a = ansichten.get(j.satzId);
    if (!a) continue;
    const f = fertigText(teile, a, j.eingabe, ergebnis.vorgang);
    const [erste = '', ...rest] = f.zeilen;
    const name = namen.get(j.satzId) ?? a.sorte;
    je.push(`${name}: ${erste.replace(/^Gespeichert: /, '')}`);
    // Keimrate und Warnung gelten je Packung: mit dem Namen des Satzes, damit zwei Sätze einer Sorte unterscheidbar sind
    for (const z of rest) dazu.add(z.startsWith('Keimrate der Packung') ? `${name}: ${z}` : z);
    if (f.warnung) warnungen.add(`${name}: ${f.warnung}`);
    for (const n of f.nachsaeen) nachsaeen.add(n);
  }
  if (ergebnis.uebersprungen.length > 0)
    je.push(`${saetzeText(ergebnis.uebersprungen.length)} offen gelassen`);
  return {
    vorgang: ergebnis.vorgang,
    kopf: `Gespeichert: ${saetzeText(ergebnis.je.length)} · ${gekeimt} von ${gesaet} Samen`,
    zeilen: [...je, ...dazu],
    warnungen: [...warnungen],
    nachsaeen: [...nachsaeen],
  };
}

export function KeimungBox({ code }: { code: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [saetze, setSaetze] = useState<readonly string[]>();
  const [abweichung, setAbweichung] = useState<Abweichung>({});
  const [keimtemp, setKeimtemp] = useState<boolean>();
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);
  // Teil des Vorgangs schon gespeichert: Eingabe fest, nur derselbe Vorgang erneut (wie die Maske je Satz)
  const [teilweise, setTeilweise] = useState(false);
  const [fertig, setFertig] = useState<Bestaetigung>();
  const vorher = useHeuteVorher();
  // gleicher Vorgang bei Wiederholung derselben Wahl (TO2)
  const letzter = useRef<{ schluessel: string; ergebnis: KeimBoxErgebnis } | undefined>(undefined);
  const sperre = useRef(false);
  // die Maske beginnt oben: aus einer gescrollten Liste von Heute stünde sonst die Keimtemperatur über dem Bild
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const ort = teile ? ortAufloesen(code, teile) : undefined;
  const box = ort?.rolle === 'anzuchtort' ? ort : undefined;
  // die Sätze der Box einmal beim Öffnen: die Liste bleibt fest, auch wenn das Bündel nach dem Speichern neu lädt
  if (saetze === undefined && teile && box) setSaetze(faelligeSaetze(teile, box.platzId));

  const kopf = (
    <header className="hv-seite-kopf">
      <h1 className="hv-seite-titel">Keimung prüfen</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );

  if (!teile) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal" aria-busy="true">
        <header className="hv-seite-kopf">
          <p className="hv-seite-titel">Keimung prüfen</p>
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
            Zu Heute
          </a>
        </header>
        <p>{liest ? 'Daten werden geladen' : 'Keine Daten'}</p>
      </main>
    );
  }

  if (!box) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        <p>Box nicht bekannt</p>
      </main>
    );
  }

  const liste = saetze ?? [];
  const unterkopf = <p className="hv-keimung-satz">{`${box.code} · ${saetzeText(liste.length)}`}</p>;

  if (fertig) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        {unterkopf}
        {fertig.zurueck ? (
          <p className="hv-keimung-bestaetigung">Rückgängig gemacht</p>
        ) : (
          <>
            <p className="hv-keimung-bestaetigung">{fertig.kopf}</p>
            <ul className="hv-keimung-liste">
              {fertig.zeilen.map((z) => (
                <li key={z}>{z}</li>
              ))}
            </ul>
            {fertig.warnungen.map((w) => (
              <Notice key={w} kompakt tone="warn" title={w} />
            ))}
            {fertig.nachsaeen.map((n) => (
              <Notice
                key={n}
                kompakt
                tone="info"
                title={n}
                action={
                  <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'saeen', ziel: box.code })}>
                    Säen öffnen
                  </a>
                }
              />
            ))}
          </>
        )}
        {fehler.length > 0 ? <Notice kompakt tone="danger" title={fehler.join(' · ')} /> : null}
        <div className="hv-keimung-fuss hv-keimung-fuss-spalte">
          {fertig.zurueck ? null : (
            <Button variant="secondary" disabled={sendet} onClick={() => void zuruecknehmen()}>
              Rückgängig machen
            </Button>
          )}
          {liste.length > 0 ? (
            <NachSpeichern
              bezug={{ name: 'keimung', satz: liste[liste.length - 1] ?? '' }}
              vorher={vorher}
              nurHeute={fertig.zurueck === true}
              erledigteBox={{ code: box.code, saetze: liste }}
            />
          ) : null}
        </div>
      </main>
    );
  }

  const uhr = jetzt();
  const ansichten = new Map<string, KeimAnsicht>();
  for (const s of liste) {
    const a = keimAnsicht(teile, s, uhr, ZEITZONE);
    if (a) ansichten.set(s, a);
  }
  const gezeigt = liste.flatMap((s) => {
    const a = ansichten.get(s);
    return a ? [a] : [];
  });

  if (gezeigt.length === 0) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        <p>{`Keine fällige Keimung in ${box.code}`}</p>
      </main>
    );
  }

  const namen = satzNamen(gezeigt);
  // Vorschau der Stationsplätze: gerechnet wie beim Speichern, mit eigenen Zählern statt client_id; schreibt nichts
  const vorschau = keimBoxVorgang(
    teile,
    liste,
    { keimtempEingehalten: keimtemp ?? true, abweichung },
    vorschauIds(),
    uhr,
    ZEITZONE,
  );
  const jeSatz = new Map(vorschau.je.map((j) => [j.satzId, j]));
  const gesamt = summe(
    teile,
    vorschau.je.map((j) => j.eingabe),
  );
  const anteil = gesamt.gesaet > 0 ? ` (${Math.round((gesamt.gekeimt / gesamt.gesaet) * 100)} %)` : '';
  const bereiche = new Set(gezeigt.map((a) => a.keimtemp ?? ''));
  const gemeinsam = bereiche.size === 1 ? [...bereiche][0] : undefined;
  const frage = `Keimtemperatur ${gemeinsam ? `${gemeinsam} ` : ''}eingehalten?`;
  const nichtEcht = gezeigt.some((a) => a.datenart !== 'echt');
  const bereit = keimtemp !== undefined && vorschau.je.length > 0;

  async function speichern() {
    if (!teile || sendet || sperre.current) return;
    if (teilweise && letzter.current) {
      await senden(letzter.current.ergebnis);
      return;
    }
    const wahl: KeimBoxWahl = { keimtempEingehalten: keimtemp, abweichung };
    const schluessel = JSON.stringify([liste, wahl]);
    const ergebnis =
      letzter.current?.schluessel === schluessel
        ? letzter.current.ergebnis
        : keimBoxVorgang(teile, liste, wahl, neueClientId, jetzt(), ZEITZONE);
    if (ergebnis.verstoesse.length > 0 || ergebnis.vorgang.length === 0) {
      setFehler(
        ergebnis.verstoesse.length > 0
          ? ergebnis.verstoesse.map((v) => `${namen.get(v.satzId) ?? 'Satz'}: ${v.grund}`)
          : ['Nichts zu speichern'],
      );
      return;
    }
    letzter.current = { schluessel, ergebnis };
    await senden(ergebnis);
  }

  async function senden(ergebnis: KeimBoxErgebnis) {
    if (!teile) return;
    sperre.current = true;
    setSendet(true);
    const antwort = await schreiben(ergebnis.vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    // Sperre 400 ms gegen Doppeltipp (U13)
    setTimeout(() => {
      sperre.current = false;
      setSendet(false);
    }, SPERRE_MS);
    if (antwort.status !== 'gespeichert') {
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht gespeichert']);
      if (antwort.status === 'nicht_gespeichert' && antwort.bestaetigt > 0) setTeilweise(true);
      return;
    }
    setFehler([]);
    setFertig(bestaetigung(teile, ansichten, namen, ergebnis));
  }

  async function zuruecknehmen() {
    if (!fertig || sperre.current) return;
    sperre.current = true;
    setSendet(true);
    const antwort = await schreiben(saatRueckgaengig(fertig.vorgang), { jetzt: jetzt(), zeitzone: ZEITZONE });
    sperre.current = false;
    setSendet(false);
    if (antwort.status === 'gespeichert') {
      setFehler([]);
      setFertig({ ...fertig, zurueck: true });
    } else
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht rückgängig gemacht']);
  }

  function satzAbschnitt(a: KeimAnsicht) {
    const name = namen.get(a.satzId) ?? a.sorte;
    const offene = a.schwaemme.filter((s) => s.zustand === 'offen');
    const mitZiel = a.schwaemme.some((s) => s.zieltopf);
    const eigene = abweichung[a.satzId];
    const wert = (s: Schwamm) => eigene?.[s.pflanzungId] ?? s.samen;
    const setzen = (s: Schwamm, x: number | 'offen') =>
      setAbweichung((alt) => ({ ...alt, [a.satzId]: { ...(alt[a.satzId] ?? {}), [s.pflanzungId]: x } }));
    const eingabe: KeimEingabe = {
      satzId: a.satzId,
      keimtempEingehalten: keimtemp,
      werte: offene.map((s) => ({ pflanzungId: s.pflanzungId, gekeimt: wert(s) })),
      station: [],
    };
    return (
      <section key={a.satzId} className="hv-keimbox-satz" aria-label={name}>
        <p className="hv-keimung-satz">
          {`${a.sorte} · ${KULTURFORM_NAME[a.kulturform] ?? a.kulturform} · gesät ${tagKurz(a.saatdatum)} · Tag ${a.tagSeitSaat} · ${schwaemmeText(offene.length)}`}
        </p>
        {gemeinsam === undefined && a.keimtemp ? (
          <p className="hv-keimung-zeile">Keimtemperatur {a.keimtemp}</p>
        ) : null}
        {/* «Keimrate zählt nur in echten Anlagen» steht einmal im Kopf der Maske */}
        {a.hinweise
          .filter((h) => h !== HINWEIS_NICHT_ECHT)
          .map((h) => (
            <p key={h} className="hv-keimung-zeile">
              {h}
            </p>
          ))}
        <Choice
          einzeln
          zeile
          segmente
          label={name}
          optionen={[
            { wert: 'alle', titel: 'Alle gekeimt' },
            { wert: 'abweichung', titel: 'Abweichung' },
          ]}
          gewaehlt={[eigene ? 'abweichung' : 'alle']}
          onWahl={(x) => {
            if (teilweise) return;
            // zurück auf «Alle gekeimt» verwirft die Abweichung dieses Satzes (A9)
            setAbweichung((alt) => {
              const { [a.satzId]: bisher, ...rest } = alt;
              return x === 'abweichung' ? { ...rest, [a.satzId]: bisher ?? {} } : rest;
            });
          }}
        />
        {eigene ? (
          <>
            {offene.map((s) => {
              const w = wert(s);
              return (
                <div key={s.pflanzungId} className="hv-keimung-schwamm">
                  <Stepper
                    label={schwammName(s, mitZiel)}
                    wert={w === 'offen' ? s.samen : w}
                    min={0}
                    max={s.samen}
                    gesperrt={teilweise || w === 'offen'}
                    anzeige={(x) => (w === 'offen' ? 'offen' : `${x} von ${s.samen}`)}
                    onWert={(x) => setzen(s, x)}
                  />
                  <button
                    type="button"
                    className="hv-btn hv-btn-ghost hv-btn-compact hv-keimung-offen"
                    aria-pressed={w === 'offen'}
                    aria-label={`${name}: Schwamm ${s.nr} offen lassen`}
                    disabled={teilweise}
                    onClick={() => setzen(s, w === 'offen' ? s.samen : 'offen')}
                  >
                    {w === 'offen' ? 'Offen gelassen' : 'Offen lassen'}
                  </button>
                </div>
              );
            })}
            <p className="hv-keimung-zusammenfassung">{keimZusammenfassung(teile, eingabe).text}</p>
            {offene
              .filter((s) => wert(s) === 0 && s.zieltopf)
              .map((s) => (
                <Notice
                  key={s.pflanzungId}
                  kompakt
                  tone="warn"
                  title={`Schwamm ${s.nr} keimt nicht: Zieltopf ${s.zieltopf?.kennung ?? ''} wird frei`}
                />
              ))}
          </>
        ) : null}
        {stationsZeilen(teile, jeSatz.get(a.satzId)?.vorschlag).map((z) => (
          <p key={z} className="hv-keimbox-station">
            {z}
          </p>
        ))}
      </section>
    );
  }

  return (
    <main className="hv-seite hv-keimung hv-keimbox" data-density="regal">
      {kopf}
      {unterkopf}
      {nichtEcht ? <p className="hv-keimung-zeile">{HINWEIS_NICHT_ECHT}</p> : null}
      <p className="hv-keimung-frage">{frage}</p>
      <Choice
        einzeln
        label={frage}
        zeile
        optionen={[
          { wert: 'ja', titel: 'Ja' },
          { wert: 'nein', titel: 'Nein' },
        ]}
        gewaehlt={keimtemp === undefined ? [] : [keimtemp ? 'ja' : 'nein']}
        onWahl={(x) => (teilweise ? undefined : setKeimtemp(x === 'ja'))}
      />
      {gezeigt.map(satzAbschnitt)}
      {fehler.length > 0 ? <Notice kompakt tone="danger" title={fehler.join(' · ')} /> : null}
      {teilweise ? (
        <Notice
          kompakt
          tone="warn"
          title="Teil gespeichert: Eingaben bleiben fest, «Keimung speichern» sendet den Rest"
        />
      ) : null}
      <div className="hv-keimbox-fuss">
        <p className="hv-keimbox-summe" aria-live="polite">
          {`${saetzeText(vorschau.je.length)} · ${gesamt.gekeimt} von ${gesamt.gesaet} Samen${anteil}`}
        </p>
        <Button disabled={sendet || !bereit} onClick={() => void speichern()}>
          Keimung speichern
        </Button>
      </div>
    </main>
  );
}
