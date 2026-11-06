// Umsetzen (Regal, Plan 33; UC5-AK3, UC5-AK7, R6.2, TO2, TO8): Sämlinge eines Satzes «wie geplant» in ihre Zieltöpfe,
// bei belegtem Zieltopf abernten, anderes Loch oder in der Station lassen, ohne Zieltopf in drei Schritten zuweisen.
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { gefaessAm, plaetzeAus, zeilen } from '../../domain/anlage/teile.ts';
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
import { saatRueckgaengig } from '../../domain/pflanzung/saeen.ts';
import { deckelReihen, istStation, lochGroesse, lochName } from '../../domain/pflanzung/topf.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../umsetzen.css';

const uhrJetzt = () => new Date(Date.now());

type Schritt =
  | { art: 'uebersicht' }
  | { art: 'bestaetigen'; eingabe: UmsetzEingabe }
  | { art: 'gefaess'; fuer: string[] }
  | { art: 'loecher'; fuer: string[]; platzId: string }
  | { art: 'zusammen'; fuer: string[]; platzId: string }
  | { art: 'ergebnis'; eingabe: UmsetzEingabe; vorgang: Vorgang; rest?: string; stationLeer?: string };

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

  if (!a) return null;
  const ohneZiel = a.saemlinge.filter((s) => !s.zieltopf).map((s) => s.pflanzungId);
  const belegt = a.saemlinge.filter((s) => s.zieltopf && !s.zieltopf.frei);
  const geplant = wieGeplant(a);
  const planZeilen = umsetzZusammenfassung(teile, geplant, jetzt, ZEITZONE).zeilen;

  async function senden(eingabe: UmsetzEingabe) {
    const jetztSenden = uhrJetzt();
    const schluessel = JSON.stringify(eingabe);
    const vorgang =
      vorgangFuer.current?.schluessel === schluessel
        ? vorgangFuer.current.vorgang
        : umsetzVorgang(teile, eingabe, neueClientId, jetztSenden, ZEITZONE);
    if (vorgang.length === 0) {
      setFehler('Eingabe nicht gültig, nicht gespeichert');
      return;
    }
    vorgangFuer.current = { schluessel, vorgang };
    const z = umsetzZusammenfassung(teile, eingabe, jetzt, ZEITZONE);
    setSendet(true);
    const r = await schreiben(vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    setSendet(false);
    if (r.status === 'nicht_gespeichert') {
      setFehler(r.fehler.text);
      return;
    }
    setFehler(undefined);
    setSchritt({
      art: 'ergebnis',
      eingabe,
      vorgang,
      ...(z.rest ? { rest: z.rest } : {}),
      ...(z.stationLeer ? { stationLeer: z.stationLeer } : {}),
    });
  }

  async function zuruecknehmen(vorgang: Vorgang) {
    const r = await schreiben(saatRueckgaengig(vorgang), { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    if (r.status === 'nicht_gespeichert') setFehler(r.fehler.text);
    else {
      vorgangFuer.current = undefined;
      setSchritt({ art: 'uebersicht' });
    }
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
    const rest = a.saemlinge.filter((s) => !s.zieltopf).map((s) => s.pflanzungId);
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        {fehlerBanner}
        <p className="hv-umsetzen-ergebnis" role="status">
          {n > 0
            ? `Umgesetzt: ${saemlingeText(n)}`
            : `Beendet: ${saemlingeText(schritt.eingabe.ueberzaehlig.length)}`}
        </p>
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
            onClick={() => void senden({ ...leer(satz), ueberzaehlig: rest })}
          >
            Überzählige beenden
          </Button>
        ) : null}
        <Button variant="secondary" disabled={sendet} onClick={() => void zuruecknehmen(schritt.vorgang)}>
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
        {z.ansatz ? <p className="hv-umsetzen-ansatz">{z.ansatz}</p> : null}
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
            onClick={() => void senden(eingabe)}
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
      .filter((p) => gefaessAm(teile, p.id) && !istStation(teile, p.id) && lochGroesse(teile, p.id) === 80)
      .sort((x, y) => x.kennung.localeCompare(y.kennung, 'de', { numeric: true }));
    return (
      <main className="hv-seite hv-umsetzen" data-density="regal">
        {kopf}
        <p className="hv-umsetzen-schritt">Schritt 1 von 3</p>
        <div className="hv-umsetzen-gefaesse">
          {gefaesse.map((p) => {
            const frei = umsetzZiele(teile, p.id, new Map()).filter((l) => !l.nichtWaehlbar).length;
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
          {`${String(a.ohneKeimpruefung)} Schwämme noch ohne Keimprüfung`}
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
              onClick={() => void senden({ ...leer(satz), ueberzaehlig: ohneZiel })}
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
