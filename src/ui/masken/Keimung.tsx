// Keimung prüfen #/keimung/<satz> (UC6, Konzept 6.3, 05 3.7; Plan 24): je offener Schwamm die gekeimten Samen
// (vorbelegt, überspringbar) und «Keimtemperatur eingehalten» Ja oder Nein; in einer Box danach die vorbelegten
// Stationsplätze bestätigen (Streichung (1): nur bestätigen). Ein Tipp auf «Keimung speichern» schreibt den ganzen
// Vorgang über schreiben(); «Rückgängig machen» storniert ihn. «Keimt nicht» lässt sich 7 Tage lang wiederherstellen.
// Regal-Dichte, keine Systemtastatur.
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { gefaessAm, zeilen, type Teile } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import {
  keimAnsicht,
  keimEingabePruefen,
  keimStationsvorschlag,
  keimVorgang,
  keimZusammenfassung,
  packungsrate,
  wiederherstellenVorgang,
  type KeimAnsicht,
  type KeimEingabe,
  type Schwamm,
} from '../../domain/pflanzung/keimung.ts';
import { KULTURFORM_NAME, saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Deckel, type Loch } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';

const SPERRE_MS = 400;
const zahl2 = (x: number) => x.toFixed(2);
const HERKUNFT = { beobachtet: 'beobachtet', packung: 'Packung', art: 'Art' } as const;

interface Fertig {
  vorgang: Vorgang;
  zeilen: string[];
  warnung?: string;
  nachsaeen: string[];
  zurueck?: boolean;
}

function schwammName(s: Schwamm, mitZiel: boolean): string {
  if (s.zieltopf) return `Schwamm ${s.nr} · Ziel ${s.zieltopf.kennung}`;
  return mitZiel ? `Schwamm ${s.nr} · Reserve` : `Schwamm ${s.nr}`;
}

export function Keimung({ satz }: { satz: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [schritt, setSchritt] = useState<1 | 2>(1);
  const [werte, setWerte] = useState<Record<string, number | 'offen'>>({});
  const [keimtemp, setKeimtemp] = useState<boolean>();
  const [stationWahl, setStationWahl] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);
  // Teil des Vorgangs schon gespeichert: Eingabe fest, nur derselbe Vorgang erneut (wie Säen, Plan 23 Befund 8)
  const [teilweise, setTeilweise] = useState(false);
  const [fertig, setFertig] = useState<Fertig>();
  const [wieder, setWieder] = useState<{ vorgang: Vorgang; text: string; zurueck?: boolean }>();
  // gleicher Vorgang bei Wiederholung derselben Eingabe (TO2)
  const letzter = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);

  const ansicht = teile ? keimAnsicht(teile, satz, jetzt(), ZEITZONE) : undefined;

  const kopf = (
    <header className="hv-seite-kopf">
      <h1 className="hv-seite-titel">Keimung prüfen</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );

  if (!teile) {
    // Überschrift erst mit dem Bündel: so sieht, wer auf sie wartet, den geladenen Stand (Plan 24 A17)
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

  if (!ansicht) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        <p>Satz nicht bekannt</p>
      </main>
    );
  }

  const unterkopf = (
    <>
      <p className="hv-keimung-satz">
        {`${ansicht.sorte} · ${KULTURFORM_NAME[ansicht.kulturform] ?? ansicht.kulturform} · ${ansicht.ort.kennung} · gesät ${tagKurz(ansicht.saatdatum)} · Tag ${ansicht.tagSeitSaat}`}
      </p>
      {ansicht.keimdauer.min !== undefined && ansicht.keimdauer.max !== undefined ? (
        <p className="hv-keimung-zeile">
          Keimdauer {ansicht.keimdauer.min}–{ansicht.keimdauer.max} Tage
        </p>
      ) : null}
    </>
  );

  if (fertig) {
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        {unterkopf}
        {fertig.zurueck ? (
          <p className="hv-keimung-bestaetigung">Rückgängig gemacht</p>
        ) : (
          <>
            {fertig.zeilen.map((z, i) => (
              <p key={z} className={i === 0 ? 'hv-keimung-bestaetigung' : 'hv-keimung-zeile'}>
                {z}
              </p>
            ))}
            {fertig.warnung ? <Notice kompakt tone="warn" title={fertig.warnung} /> : null}
            {fertig.nachsaeen.map((n) => (
              <Notice
                key={n}
                kompakt
                tone="info"
                title={n}
                action={
                  <a
                    className="hv-btn hv-btn-secondary"
                    href={hashZu({ name: 'saeen', ziel: ansicht.ort.code })}
                  >
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
          <a className="hv-btn hv-btn-primary" href={hashZu({ name: 'heute' })}>
            Zu Heute
          </a>
        </div>
      </main>
    );
  }

  const a: KeimAnsicht = ansicht;
  const offene = a.schwaemme.filter((s) => s.zustand === 'offen');
  const erledigt = a.schwaemme.filter((s) => s.zustand === 'erledigt');
  const keimtNicht = a.schwaemme.filter((s) => s.zustand === 'keimt_nicht');
  const mitZiel = a.schwaemme.some((s) => s.zieltopf);
  const wert = (s: Schwamm) => werte[s.pflanzungId] ?? s.samen;
  const ohneStation: KeimEingabe = {
    satzId: a.satzId,
    keimtempEingehalten: keimtemp,
    werte: offene.map((s) => ({ pflanzungId: s.pflanzungId, gekeimt: wert(s) })),
    station: [],
  };
  const vorschlag = keimStationsvorschlag(teile, ohneStation, jetzt(), ZEITZONE);
  const mitStationsschritt =
    !!vorschlag &&
    (vorschlag.zuweisung.length > 0 || vorschlag.ohnePlatz.length > 0 || vorschlag.reserve.length > 0);
  const eingabe: KeimEingabe =
    schritt === 2 && vorschlag
      ? {
          ...ohneStation,
          station: vorschlag.zuweisung.map((z) => ({
            pflanzungId: z.pflanzungId,
            platzId: z.platzId,
            lochNr: z.lochNr,
          })),
        }
      : ohneStation;
  const zusammenfassung = keimZusammenfassung(teile, ohneStation);
  const frage = `Keimtemperatur ${a.keimtemp ? `${a.keimtemp} ` : ''}eingehalten?`;
  // ohne offene Schwämme bleibt ein reiner Stationsschritt für gekeimte Schwämme in der Box (Runde 1 Befund 1)
  const nurStation = offene.length === 0 && (vorschlag?.zuweisung.length ?? 0) > 0;
  const bereit =
    nurStation || (keimtemp !== undefined && ohneStation.werte.some((w) => w.gekeimt !== 'offen'));

  async function speichern() {
    if (!teile || sendet) return;
    if (teilweise && letzter.current) {
      await senden(letzter.current.vorgang);
      return;
    }
    const verstoesse = keimEingabePruefen(teile, eingabe, jetzt(), ZEITZONE);
    if (verstoesse.length > 0) {
      setFehler(verstoesse.map((v) => v.grund));
      return;
    }
    const schluessel = JSON.stringify(eingabe);
    const vorgang =
      letzter.current?.schluessel === schluessel
        ? letzter.current.vorgang
        : keimVorgang(teile, eingabe, neueClientId, jetzt(), ZEITZONE);
    letzter.current = { schluessel, vorgang };
    await senden(vorgang);
  }

  async function senden(vorgang: Vorgang) {
    if (!teile) return;
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    // Sperre 400 ms gegen Doppeltipp (Aktionsknopf, NumPad.md)
    setTimeout(() => setSendet(false), SPERRE_MS);
    if (antwort.status !== 'gespeichert') {
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht gespeichert']);
      if (antwort.status === 'nicht_gespeichert' && antwort.bestaetigt > 0) setTeilweise(true);
      return;
    }
    setFehler([]);
    setFertig(fertigText(teile, a, eingabe, vorgang));
  }

  async function zuruecknehmen() {
    if (!fertig) return;
    setSendet(true);
    const antwort = await schreiben(saatRueckgaengig(fertig.vorgang), { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    if (antwort.status === 'gespeichert') setFertig({ ...fertig, zurueck: true });
    else
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht rückgängig gemacht']);
  }

  async function wiederherstellen(s: Schwamm) {
    if (!teile || sendet) return;
    const { vorgang, hinweis } = wiederherstellenVorgang(
      teile,
      s.pflanzungId,
      neueClientId,
      jetzt(),
      ZEITZONE,
    );
    if (vorgang.length === 0) {
      setFehler(['Wiederherstellen nicht mehr möglich']);
      return;
    }
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setTimeout(() => setSendet(false), SPERRE_MS);
    if (antwort.status !== 'gespeichert') {
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht gespeichert']);
      return;
    }
    setFehler([]);
    setWieder({
      vorgang,
      text:
        hinweis ??
        `Schwamm ${s.nr} wiederhergestellt${s.zieltopf ? ` · Zieltopf ${s.zieltopf.kennung} wieder reserviert` : ''}`,
    });
  }

  async function wiederZurueck() {
    if (!wieder) return;
    setSendet(true);
    const antwort = await schreiben(saatRueckgaengig(wieder.vorgang), { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    if (antwort.status === 'gespeichert') setWieder({ ...wieder, zurueck: true, text: 'Rückgängig gemacht' });
    else
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht rückgängig gemacht']);
  }

  const fehlerZeile = fehler.length > 0 ? <Notice kompakt tone="danger" title={fehler.join(' · ')} /> : null;
  const teilweiseZeile = teilweise ? (
    <Notice
      kompakt
      tone="warn"
      title="Teil gespeichert: Eingaben bleiben fest, «Keimung speichern» sendet den Rest"
    />
  ) : null;
  const speichernKnopf = (
    <Button disabled={sendet || !bereit} onClick={() => void speichern()}>
      Keimung speichern
    </Button>
  );

  if (schritt === 2 && vorschlag) {
    const stationen = [...new Set(vorschlag.zuweisung.map((z) => z.platzId))];
    const gezeigt = stationWahl && stationen.includes(stationWahl) ? stationWahl : stationen[0];
    const kennung = (platzId: string) =>
      zeilen<{ id: string; kennung: string }>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';
    const nrVon = (pflanzungId: string) => a.schwaemme.find((s) => s.pflanzungId === pflanzungId)?.nr ?? 0;
    return (
      <main className="hv-seite hv-keimung" data-density="regal">
        {kopf}
        {unterkopf}
        <p className="hv-keimung-schritt">Station bestätigen</p>
        {stationen.length > 0 ? (
          <Choice
            label="Station"
            zeile
            optionen={stationen.map((id) => {
              const n = vorschlag.zuweisung.filter((z) => z.platzId === id).length;
              return { wert: id, titel: kennung(id), zusatz: `${n} ${n === 1 ? 'Schwamm' : 'Schwämme'}` };
            })}
            gewaehlt={gezeigt ? [gezeigt] : []}
            onWahl={setStationWahl}
          />
        ) : (
          <p>Kein Stationsplatz frei</p>
        )}
        {gezeigt ? (
          <Deckel
            reihen={reihenVon(teile, gezeigt)}
            loecher={stationsLoecher(teile, gezeigt, vorschlag.zuweisung, nrVon)}
            kanten
          />
        ) : null}
        {vorschlag.inBoxBis ? (
          <Notice
            kompakt
            tone="warn"
            title={`Station voll: ${vorschlag.ohnePlatz.length} ${vorschlag.ohnePlatz.length === 1 ? 'Schwamm bleibt' : 'Schwämme bleiben'} bis ${tagKurz(vorschlag.inBoxBis)} in der Box`}
          />
        ) : null}
        {vorschlag.reserveBis ? (
          <Notice
            kompakt
            tone="info"
            title={`${vorschlag.reserve.map((p) => `Schwamm ${nrVon(p)}`).join(', ')}: Reserve in der Box bis ${tagKurz(vorschlag.reserveBis)}`}
          />
        ) : null}
        {fehlerZeile}
        {teilweiseZeile}
        <div className="hv-keimung-fuss">
          <Button variant="secondary" disabled={teilweise} onClick={() => setSchritt(1)}>
            Zurück
          </Button>
          <span className="hv-keimung-haupt">{speichernKnopf}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="hv-seite hv-keimung" data-density="regal">
      {kopf}
      {unterkopf}
      {a.hinweise.map((h) => (
        <Notice key={h} kompakt tone="info" title={h} />
      ))}
      {wieder ? (
        <Notice
          kompakt
          tone="info"
          title={wieder.text}
          {...(wieder.zurueck
            ? {}
            : {
                action: (
                  <Button variant="secondary" disabled={sendet} onClick={() => void wiederZurueck()}>
                    Rückgängig machen
                  </Button>
                ),
              })}
        />
      ) : null}
      {offene.length > 0 ? (
        <>
          <p className="hv-keimung-schritt">Gekeimte Samen</p>
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
                  onWert={(x) => setWerte((alt) => ({ ...alt, [s.pflanzungId]: x }))}
                />
                <button
                  type="button"
                  className="hv-btn hv-btn-ghost hv-btn-compact hv-keimung-offen"
                  aria-pressed={w === 'offen'}
                  aria-label={`Schwamm ${s.nr} offen lassen`}
                  disabled={teilweise}
                  onClick={() =>
                    setWerte((alt) => ({ ...alt, [s.pflanzungId]: w === 'offen' ? s.samen : 'offen' }))
                  }
                >
                  {w === 'offen' ? 'Offen gelassen' : 'Offen lassen'}
                </button>
              </div>
            );
          })}
          <p className="hv-keimung-frage">{frage}</p>
          <Choice
            label={frage}
            zeile
            optionen={[
              { wert: 'ja', titel: 'Ja' },
              { wert: 'nein', titel: 'Nein' },
            ]}
            gewaehlt={keimtemp === undefined ? [] : [keimtemp ? 'ja' : 'nein']}
            onWahl={(x) => (teilweise ? undefined : setKeimtemp(x === 'ja'))}
          />
          <p className="hv-keimung-zusammenfassung" aria-live="polite">
            {zusammenfassung.text}
          </p>
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
      ) : (
        <p>{nurStation ? 'Gekeimte Schwämme warten in der Box auf die Station' : 'Keine offenen Schwämme'}</p>
      )}
      {erledigt.length > 0 ? (
        <section aria-label="Eingetragen">
          <p className="hv-keimung-schritt">Eingetragen</p>
          <ul className="hv-keimung-liste">
            {erledigt.map((s) => (
              <li key={s.pflanzungId}>
                Schwamm {s.nr} · {s.gekeimt ?? '–'} von {s.samen}
                {s.station ? ` · auf ${s.station.kennung}, Loch ${s.station.lochNr}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {keimtNicht.length > 0 ? (
        <section aria-label="Keimt nicht">
          <p className="hv-keimung-schritt">Keimt nicht</p>
          {keimtNicht.map((s) => (
            <div key={s.pflanzungId} className="hv-keimung-beendet">
              <span>
                Schwamm {s.nr} · keimt nicht seit {s.abschluss ? tagKurz(s.abschluss.tag) : '–'}
              </span>
              {s.abschluss?.wiederherstellbar ? (
                <Button variant="secondary" disabled={sendet} onClick={() => void wiederherstellen(s)}>
                  Wiederherstellen
                </Button>
              ) : (
                <span className="hv-keimung-zeile">Wiederherstellen nicht mehr möglich</span>
              )}
            </div>
          ))}
        </section>
      ) : null}
      {fehlerZeile}
      {teilweiseZeile}
      {offene.length > 0 || nurStation ? (
        <div className="hv-keimung-fuss">
          {mitStationsschritt ? (
            <Button disabled={!bereit} onClick={() => setSchritt(2)}>
              Weiter
            </Button>
          ) : (
            speichernKnopf
          )}
        </div>
      ) : null}
    </main>
  );
}

function reihenVon(teile: Teile, platzId: string): number[] {
  const g = gefaessAm(teile, platzId);
  const d = zeilen<{ id: string; loecher_je_reihe: number[] }>(teile, 'deckeltyp').find(
    (x) => x.id === g?.deckeltyp_id,
  );
  return [...(d?.loecher_je_reihe ?? [])];
}

/** Löcher der Station: vorbelegt mit Marke «S1» …, belegt «bel.», sonst frei; nichts ist tippbar (Streichung (1)) */
function stationsLoecher(
  teile: Teile,
  platzId: string,
  zuweisung: { pflanzungId: string; platzId: string; lochNr: number }[],
  nrVon: (pflanzungId: string) => number,
): Loch[] {
  const belegt = new Set(
    zeilen<{ status: string; platz_id: string | null; loch_nr: number | null }>(teile, 'v_pflanzung_zustand')
      .filter((z) => z.status === 'aktiv' && z.platz_id === platzId)
      .map((z) => Number(z.loch_nr)),
  );
  const n = reihenVon(teile, platzId).reduce((x, y) => x + y, 0);
  return Array.from({ length: n }, (_, i) => i + 1).map((nr): Loch => {
    const z = zuweisung.find((x) => x.platzId === platzId && x.lochNr === nr);
    if (z) {
      const schwamm = nrVon(z.pflanzungId);
      return {
        nr,
        zustand: 'gewaehlt',
        marke: { ziffer: schwamm, name: `Schwamm ${schwamm}` },
        nichtWaehlbar: true,
        zustandName: 'vorbelegt',
      };
    }
    if (belegt.has(nr)) return { nr, zustand: 'belegt', text: 'bel.', nichtWaehlbar: true };
    return { nr, zustand: 'frei', nichtWaehlbar: true };
  });
}

/** Bestätigung nach dem Speichern: Ergebnis, Keimrate der Packung, «Saatgut prüfen», Nachsäen (A6, G5) */
function fertigText(teile: Teile, a: KeimAnsicht, eingabe: KeimEingabe, vorgang: Vorgang): Fertig {
  const z = keimZusammenfassung(teile, eingabe);
  const stationen = new Map<string, number>();
  for (const s of eingabe.station) stationen.set(s.platzId, (stationen.get(s.platzId) ?? 0) + 1);
  const kennung = (platzId: string) =>
    zeilen<{ id: string; kennung: string }>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';
  const station = [...stationen].map(([id, n]) => `${n} auf ${kennung(id)}`);
  const mitKeimung = eingabe.werte.some((w) => w.gekeimt !== 'offen');
  const zeilenText = [`Gespeichert: ${[...(mitKeimung ? [z.text] : []), ...station].join(' · ')}`];
  let warnung: string | undefined;
  if (!mitKeimung) {
    // reiner Stationsschritt: keine Keimrate
  } else if (eingabe.keimtempEingehalten !== true)
    zeilenText.push('Keimtemperatur nicht eingehalten: zählt nicht für die Keimrate');
  else if (a.datenart !== 'echt') zeilenText.push('Keimrate zählt nur in echten Anlagen');
  else {
    const rate = packungsrate(teile, a.satzId, vorgang);
    if (rate?.p !== undefined)
      zeilenText.push(
        `Keimrate der Packung ${zahl2(rate.p)} (${rate.herkunft ? HERKUNFT[rate.herkunft] : ''}, ${rate.gesaet} Samen)`,
      );
    if (rate?.saatgutPruefen) warnung = `Saatgut prüfen: ${rate.gekeimt} von ${rate.gesaet} Samen gekeimt`;
  }
  return { vorgang, zeilen: zeilenText, ...(warnung ? { warnung } : {}), nachsaeen: z.nachsaeen };
}
