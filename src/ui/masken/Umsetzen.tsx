// Umsetzen (Regal, Plan 33; UC5-AK3, UC5-AK7, R6.2, TO2, TO8): Sämlinge eines Satzes «wie geplant» in ihre Zieltöpfe,
// bei belegtem Zieltopf abernten, anderes Loch oder in der Station lassen, ohne Zieltopf in drei Schritten zuweisen.
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { gefaessAm, gefaessStatus, plaetzeAus, zeilen } from '../../domain/anlage/teile.ts';
import {
  alleFreienWaehlen,
  umsetzAnsicht,
  umsetzVorgang,
  umsetzZiele,
  umsetzZusammenfassung,
  wieGeplant,
  type Saemling,
  type UmsetzEingabe,
} from '../../domain/anzucht/umsetzen.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { messbareOrte } from '../../domain/ort.ts';
import { gefaessPassung } from '../../domain/passung/kontext.ts';
import { saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import {
  deckelReihen,
  istStation,
  lochArt,
  lochGroesse,
  lochName,
  lochText,
} from '../../domain/pflanzung/topf.ts';
import { kalendertag, tagKurz, tagPlus, tageZwischen } from '../../domain/zeit.ts';
import { Stepper } from '../bausteine/Stepper.tsx';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stufe } from '../bausteine/Stufe.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../umsetzen.css';

const uhrJetzt = () => new Date(Date.now());
/** Sperre nach einem Tipp (U13) */
const SPERRE_MS = 400;

type Schritt =
  | { art: 'uebersicht' }
  | { art: 'bestaetigen'; eingabe: UmsetzEingabe }
  | { art: 'gefaess'; fuer: string[] }
  | { art: 'loecher'; fuer: string[]; platzId: string }
  | { art: 'zusammen'; fuer: string[]; platzId: string }
  | {
      art: 'ergebnis';
      eingabe: UmsetzEingabe;
      vorgang: Vorgang;
      /** Rest beim Senden aus der Eingabe gerechnet, nie aus dem nachgeladenen Bündel (Runde 1 Befund 1) */
      restIds: string[];
      rest?: string;
      stationLeer?: string;
    };

const leer = (satzId: string): UmsetzEingabe => ({
  satzId,
  zuweisung: [],
  abernten: [],
  inStationLassen: [],
  ueberzaehlig: [],
});

const saemlingeText = (n: number) => (n === 1 ? '1 Sämling' : `${String(n)} Sämlinge`);

export function Umsetzen({ satz, wie }: { satz: string; wie?: 'geplant' }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const ansicht = teile ? umsetzAnsicht(teile, satz, jetzt, ZEITZONE) : undefined;
  if (!ansicht) {
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        <h1 className="hv-seite-titel">Umsetzen</h1>
        <p>{liest ? 'Daten werden geladen' : 'Satz nicht bekannt'}</p>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }
  return <Maske key={satz} satz={satz} wie={wie} jetzt={jetzt} />;
}

function Maske({ satz, wie, jetzt }: { satz: string; wie: 'geplant' | undefined; jetzt: Date }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const a = umsetzAnsicht(teile, satz, jetzt, ZEITZONE);
  const [schritt, setSchritt] = useState<Schritt>(() =>
    wie === 'geplant' && a ? { art: 'bestaetigen', eingabe: wieGeplant(a) } : { art: 'uebersicht' },
  );
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  // derselbe Vorgang bei jeder Wiederholung derselben Eingabe (TO2): gleiche client_id
  const vorgangFuer = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);
  const sperre = useRef(false);

  if (!a) return null;
  const heute = kalendertag(jetzt, ZEITZONE);
  const ohneZiel = a.saemlinge.filter((s) => !s.zieltopf).map((s) => s.pflanzungId);
  const belegt = a.saemlinge.filter((s) => s.zieltopf && !s.zieltopf.frei);
  const geplant = wieGeplant(a);
  const planZeilen = umsetzZusammenfassung(teile, geplant, jetzt, ZEITZONE).zeilen;

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
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
    }
  }

  function senden(eingabe: UmsetzEingabe) {
    void mitSperre(() => sendenOhneSperre(eingabe));
  }

  async function sendenOhneSperre(eingabe: UmsetzEingabe): Promise<boolean> {
    const jetztSenden = uhrJetzt();
    const bewegt = new Set([
      ...eingabe.zuweisung.map((z) => z.pflanzungId),
      ...eingabe.ueberzaehlig,
      ...eingabe.inStationLassen.map((x) => x.pflanzungId),
    ]);
    const restIds = (a?.saemlinge ?? [])
      .filter((s) => !s.zieltopf && !bewegt.has(s.pflanzungId))
      .map((s) => s.pflanzungId);
    const schluessel = JSON.stringify(eingabe);
    const vorgang =
      vorgangFuer.current?.schluessel === schluessel
        ? vorgangFuer.current.vorgang
        : umsetzVorgang(teile, eingabe, neueClientId, jetztSenden, ZEITZONE);
    if (vorgang.length === 0) {
      setFehler('Eingabe nicht gültig, nicht gespeichert');
      return false;
    }
    vorgangFuer.current = { schluessel, vorgang };
    const z = umsetzZusammenfassung(teile, eingabe, jetzt, ZEITZONE);
    const r = await schreiben(vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    // auch «abweichend» ist kein Erfolg (Runde 2 Befund 10)
    if (r.status !== 'gespeichert') {
      setFehler(
        r.status === 'nicht_gespeichert' ? r.fehler.text : 'Schon anders gespeichert, nicht übernommen',
      );
      return false;
    }
    setFehler(undefined);
    setSchritt({
      art: 'ergebnis',
      eingabe,
      vorgang,
      restIds,
      ...(z.rest ? { rest: z.rest } : {}),
      ...(z.stationLeer ? { stationLeer: z.stationLeer } : {}),
    });
    return true;
  }

  function zuruecknehmen(vorgang: Vorgang) {
    void mitSperre(async () => {
      const r = await schreiben(saatRueckgaengig(vorgang), { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status !== 'gespeichert') {
        setFehler(r.status === 'nicht_gespeichert' ? r.fehler.text : 'Nicht zurückgenommen');
        return false;
      }
      vorgangFuer.current = undefined;
      setSchritt({ art: 'uebersicht' });
      return true;
    });
  }

  const fehlerBanner = fehler ? (
    <Notice kompakt tone="danger">
      {fehler}
    </Notice>
  ) : null;
  const kopf = (
    <header className="hv-umsetzen-kopf">
      <h1 className="hv-seite-titel">Umsetzen</h1>
      <p className="hv-umsetzen-satz">{a.kopf}</p>
    </header>
  );

  // Ergebnis
  if (schritt.art === 'ergebnis') {
    const n = schritt.eingabe.zuweisung.length;
    const rest = schritt.restIds;
    const gelassen = schritt.eingabe.inStationLassen;
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        {fehlerBanner}
        <p className="hv-umsetzen-ergebnis" role="status">
          {n > 0
            ? `Umgesetzt: ${saemlingeText(n)}`
            : gelassen.length > 0
              ? `In der Station gelassen bis ${tagKurz(gelassen[0]?.bis ?? '')}: ${saemlingeText(gelassen.length)}`
              : `Beendet: ${saemlingeText(schritt.eingabe.ueberzaehlig.length)}`}
        </p>
        {n > 0 && gelassen.length > 0 ? (
          <p className="hv-umsetzen-ansatz">
            {`In der Station gelassen bis ${tagKurz(gelassen[0]?.bis ?? '')}: ${saemlingeText(gelassen.length)}`}
          </p>
        ) : null}
        {schritt.rest ? (
          <Notice kompakt tone="info">
            {schritt.rest}
          </Notice>
        ) : null}
        {schritt.stationLeer ? (
          <Notice kompakt tone="info">
            {schritt.stationLeer}
          </Notice>
        ) : null}
        {schritt.rest && rest.length > 0 ? (
          <Button
            variant="secondary"
            disabled={sendet}
            onClick={() => senden({ ...leer(satz), ueberzaehlig: rest })}
          >
            Überzählige beenden
          </Button>
        ) : null}
        <Button variant="secondary" disabled={sendet} onClick={() => zuruecknehmen(schritt.vorgang)}>
          Rückgängig machen
        </Button>
        <a className="hv-btn hv-btn-primary" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }

  // Bestätigung (auch Schritt 3 von 3 der Zielwahl)
  if (schritt.art === 'bestaetigen' || schritt.art === 'zusammen') {
    const eingabe =
      schritt.art === 'bestaetigen'
        ? schritt.eingabe
        : {
            ...leer(satz),
            zuweisung: zuordnen(a.saemlinge, schritt.fuer, gewaehlt),
          };
    const z = umsetzZusammenfassung(teile, eingabe, jetzt, ZEITZONE);
    // ein Knopf je Zielgefäss mit Vorschlag (Runde 1 Befund 8)
    const wechselOrte = (z.wechselIn ?? []).flatMap((p) => {
      const o = messbareOrte(teile ?? {}).find((x) => x.platzId === p);
      return o ? [o] : [];
    });
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        {schritt.art === 'zusammen' ? <p className="hv-umsetzen-schritt">Schritt 3 von 3</p> : null}
        {fehlerBanner}
        <ul className="hv-umsetzen-zeilen" aria-label="Umsetzen">
          {z.zeilen.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {z.hinweise.map((h) => (
          <Notice key={h} kompakt tone="info">
            {h}
          </Notice>
        ))}
        {z.ansatz ? (
          // R2.2 letzte Zeile (Plan 34 A12): Lösung ab 7 Tagen am Umsetztag wechseln
          <Notice
            kompakt
            tone={z.wechselIn ? 'warn' : 'info'}
            action={
              wechselOrte.length > 0 ? (
                <>
                  {wechselOrte.map((o) => (
                    <a
                      key={o.platzId}
                      className="hv-btn hv-btn-secondary hv-btn-compact"
                      href={hashZu({ name: 'ansatz', code: o.code })}
                    >
                      {wechselOrte.length > 1 ? `Lösung wechseln in ${o.kennung}` : 'Lösung wechseln'}
                    </a>
                  ))}
                </>
              ) : undefined
            }
          >
            {z.ansatz}
          </Notice>
        ) : null}
        {schritt.art === 'bestaetigen' && eingabe.inStationLassen.length > 0 && a.inStationLassenBis ? (
          // R6.2 / A11: Datum zwischen morgen und Saat + «Umsetzen bis» wählbar (Runde 2 Befund 3)
          <Stepper
            label="In der Station lassen bis"
            wert={tageZwischen(heute, eingabe.inStationLassen[0]?.bis ?? a.inStationLassenBis)}
            min={1}
            max={tageZwischen(heute, a.inStationLassenBis)}
            anzeige={(w) => tagKurz(tagPlus(heute, w))}
            onWert={(w) =>
              setSchritt({
                art: 'bestaetigen',
                eingabe: {
                  ...eingabe,
                  inStationLassen: eingabe.inStationLassen.map((x) => ({ ...x, bis: tagPlus(heute, w) })),
                },
              })
            }
          />
        ) : null}
        <div className="hv-umsetzen-fuss">
          <Button
            variant="secondary"
            onClick={() =>
              setSchritt(
                schritt.art === 'zusammen'
                  ? { art: 'loecher', fuer: schritt.fuer, platzId: schritt.platzId }
                  : { art: 'uebersicht' },
              )
            }
          >
            Zurück
          </Button>
          <Button
            disabled={sendet || eingabe.zuweisung.length + eingabe.inStationLassen.length === 0}
            onClick={() => senden(eingabe)}
          >
            {schritt.art === 'zusammen' ? 'Umsetzen' : 'Umsetzen bestätigen'}
          </Button>
        </div>
      </main>
    );
  }

  // Ziel wählen, Schritt 1: Zielgefäss
  if (schritt.art === 'gefaess') {
    const anlageId = zeilen<{ id: string; anlage_id: string }>(teile, 'platz').find(
      (p) => p.id === a.saemlinge[0]?.ort.platzId,
    )?.anlage_id;
    const gefaesse = (anlageId ? plaetzeAus(teile, anlageId) : [])
      .filter((p) => {
        // entfernte Gefässe sind kein Ziel (Runde 1 Befund 8)
        const g = gefaessAm(teile, p.id);
        return (
          g !== undefined &&
          gefaessStatus(teile, g.id) !== 'entfernt' &&
          !istStation(teile, p.id) &&
          lochGroesse(teile, p.id) === 80
        );
      })
      .sort((x, y) => x.kennung.localeCompare(y.kennung, 'de', { numeric: true }));
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        <p className="hv-umsetzen-schritt">Schritt 1 von 3</p>
        <div className="hv-umsetzen-gefaesse">
          {gefaesse.map((p) => {
            const frei = umsetzZiele(teile, p.id, new Map()).filter((l) => !l.nichtWaehlbar).length;
            // Plan 36 (R6.2, A7): Einstufung je Gefäss, Reihenfolge nach Kennung, sperrt nichts
            const passung = gefaessPassung(teile ?? {}, a.satzId, p.id, jetzt, ZEITZONE);
            return (
              <Button
                key={p.id}
                variant="secondary"
                onClick={() => {
                  setGewaehlt([]);
                  setSchritt({ art: 'loecher', fuer: schritt.fuer, platzId: p.id });
                }}
              >
                {`${p.kennung} · ${String(frei)} frei`}
                {passung ? (
                  <>
                    {' '}
                    <Stufe einstufung={passung.einstufung} />
                    {passung.einstufung === 'empfohlen' ? '' : ` ${passung.texte.join(' · ')}`}
                  </>
                ) : null}
              </Button>
            );
          })}
        </div>
        <div className="hv-umsetzen-fuss">
          <Button variant="secondary" onClick={() => setSchritt({ art: 'uebersicht' })}>
            Zurück
          </Button>
        </div>
      </main>
    );
  }

  // Ziel wählen, Schritt 2: Löcher im Deckel
  if (schritt.art === 'loecher') {
    const marken = new Map(gewaehlt.map((t, i) => [t, i + 1]));
    const ziele = umsetzZiele(teile, schritt.platzId, marken);
    const anzahl = schritt.fuer.length;
    const umschalten = (nr: number) => {
      const l = ziele.find((x) => x.lochNr === nr);
      if (!l || l.nichtWaehlbar || !l.netztopfId) return;
      const id = l.netztopfId;
      setGewaehlt((alt) =>
        alt.includes(id) ? alt.filter((x) => x !== id) : alt.length < anzahl ? [...alt, id] : alt,
      );
    };
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        <p className="hv-umsetzen-schritt">Schritt 2 von 3</p>
        <Deckel
          reihen={deckelReihen(teile, schritt.platzId)}
          loecher={ziele.map((l) => {
            const gew = l.netztopfId !== undefined && marken.has(l.netztopfId);
            return {
              nr: l.lochNr,
              zustand: gew ? 'gewaehlt' : l.zustand,
              zustandName: gew ? `${lochName(l)} · gewählt` : lochName(l) || 'kein Topf',
              // Status nie nur über Farbe (Runde 1 Befund 4): Marke im gewählten, Kurzwort im gesperrten Loch
              ...(gew && l.netztopfId
                ? { marke: { ziffer: marken.get(l.netztopfId) ?? 0, name: l.kennung ?? '' } }
                : l.nichtWaehlbar
                  ? { text: l.zustand === 'belegt' ? 'bel.' : l.zustand === 'reserviert' ? 'res.' : '–' }
                  : lochText(l) !== undefined
                    ? { text: lochText(l) as string }
                    : {}),
              ...(lochArt(l) ? { art: lochArt(l) } : {}),
              ...(l.nichtWaehlbar ? { nichtWaehlbar: true } : {}),
            };
          })}
          onLoch={umschalten}
        />
        <p
          className="hv-umsetzen-zahl"
          aria-live="polite"
        >{`${String(gewaehlt.length)} von ${String(anzahl)} gewählt`}</p>
        <Button variant="secondary" onClick={() => setGewaehlt(alleFreienWaehlen(ziele, anzahl))}>
          Alle freien wählen
        </Button>
        <div className="hv-umsetzen-fuss">
          <Button variant="secondary" onClick={() => setSchritt({ art: 'gefaess', fuer: schritt.fuer })}>
            Zurück
          </Button>
          <Button
            disabled={gewaehlt.length === 0}
            onClick={() => setSchritt({ art: 'zusammen', fuer: schritt.fuer, platzId: schritt.platzId })}
          >
            Weiter
          </Button>
        </div>
      </main>
    );
  }

  // Übersicht
  return (
    <main className="hv-seite hv-umsetzen" data-density="regal">
      {kopf}
      {fehlerBanner}
      {a.ohneKeimpruefung > 0 ? (
        <Notice kompakt tone="info">
          {a.ohneKeimpruefung === 1
            ? '1 Schwamm noch ohne Keimprüfung'
            : `${String(a.ohneKeimpruefung)} Schwämme noch ohne Keimprüfung`}
        </Notice>
      ) : null}
      {planZeilen.length > 0 ? (
        <section aria-label="Wie geplant">
          <h2 className="hv-umsetzen-titel">Wie geplant</h2>
          <ul className="hv-umsetzen-zeilen">
            {planZeilen.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {belegt.length > 0 ? (
        <section aria-label="Zieltopf belegt">
          <h2 className="hv-umsetzen-titel">Zieltopf belegt</h2>
          {belegt.map((s) => {
            const z = s.zieltopf as NonNullable<Saemling['zieltopf']>;
            return (
              <div key={s.pflanzungId} className="hv-umsetzen-belegt">
                <p>{`${z.kennung} belegt: ${z.belegtDurch?.sorte ?? 'Pflanze'}`}</p>
                <div className="hv-umsetzen-knoepfe">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSchritt({
                        art: 'bestaetigen',
                        eingabe: {
                          ...geplant,
                          zuweisung: [
                            ...geplant.zuweisung,
                            { pflanzungId: s.pflanzungId, netztopfId: z.netztopfId },
                          ],
                          abernten: [...geplant.abernten, z.netztopfId],
                        },
                      })
                    }
                  >
                    Jetzt abernten
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setSchritt({ art: 'gefaess', fuer: [s.pflanzungId] })}
                  >
                    Anderes Loch
                  </Button>
                  {a.inStationLassenBis ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setSchritt({
                          art: 'bestaetigen',
                          eingabe: {
                            ...geplant,
                            inStationLassen: [
                              { pflanzungId: s.pflanzungId, bis: a.inStationLassenBis as string },
                            ],
                          },
                        })
                      }
                    >
                      In der Station lassen
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      {ohneZiel.length > 0 ? (
        <section aria-label="Ohne Ziel">
          <h2 className="hv-umsetzen-titel">Ohne Ziel</h2>
          <p>{`${saemlingeText(ohneZiel.length)} ohne Zieltopf`}</p>
          <div className="hv-umsetzen-knoepfe">
            <Button variant="secondary" onClick={() => setSchritt({ art: 'gefaess', fuer: ohneZiel })}>
              Ziel wählen
            </Button>
            <Button
              variant="secondary"
              disabled={sendet}
              onClick={() => senden({ ...leer(satz), ueberzaehlig: ohneZiel })}
            >
              Überzählige beenden
            </Button>
          </div>
        </section>
      ) : null}
      <div className="hv-umsetzen-fuss">
        <Button
          disabled={geplant.zuweisung.length === 0}
          onClick={() => setSchritt({ art: 'bestaetigen', eingabe: geplant })}
        >
          Wie geplant umsetzen
        </Button>
      </div>
    </main>
  );
}

/** Sämlinge in ihrer Nummernfolge auf die gewählten Töpfe in Wahlfolge (A8) */
function zuordnen(saemlinge: readonly Saemling[], fuer: readonly string[], toepfe: readonly string[]) {
  return saemlinge
    .filter((s) => fuer.includes(s.pflanzungId))
    .sort((a, b) => a.nr - b.nr)
    .slice(0, toepfe.length)
    .map((s, i) => ({ pflanzungId: s.pflanzungId, netztopfId: toepfe[i] as string }));
}
