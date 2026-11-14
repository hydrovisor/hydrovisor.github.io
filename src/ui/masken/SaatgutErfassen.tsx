// Ablauf «Tüte erfassen» im Saatgut-Manager (Issue #211, Plan 211; verkürzter Weg durch UC4, Plan 37): kamera-zuerst
// in drei Schritten (Vorderseite, Rückseite oder «Ohne Rückseite lesen», Ergebnis der KI). Erkennt die Erfassung eine
// vorhandene Sorte, fügt «Packung zu … hinzufügen» nur Packung, Fotos und Feldprotokoll an; sonst entsteht eine neue
// Sorte und die Recherche startet nach dem Speichern von selbst (E8). Fotos gehen in tuetenfoto (Plan 207). Neue Art,
// Merkmale, Kaufdatum, Keimfähigkeit und Saatempfehlung bleiben im Weg «Von Hand erfassen» (Plan 211 A6, A18).
import { useRef, useState } from 'react';
import { rechercheStarten, tueteLesen } from '../../daten/ki.ts';
import { neueClientId } from '../../daten/schreiben.ts';
import type { RechercheErgebnis } from '../../domain/ki/recherche.ts';
import {
  artVorschlagen,
  erfassungBauen,
  formularNachKi,
  formularPruefen,
  kulturtypVorschlagen,
  leeresFormular,
  sorteErkennen,
  vorhandeneSorte,
  type ArtZeile,
  type KiLauf,
  type Kulturtyp,
  type SorteZeile,
  type SortenFormular,
} from '../../domain/sorten/erfassung.ts';
import type { TuetenfotoSeite } from '../../domain/sorten/tuetenfoto.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { APP_VERSION } from '../../konstanten.ts';
import { Button } from '../bausteine/Button.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Kamera } from '../bausteine/Kamera.tsx';
import { PhotoField } from '../bausteine/PhotoField.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { RechercheHinweis } from '../RechercheHinweis.tsx';
import { hashZu } from '../router.ts';
import { erfassungSenden, tuetenfotoHochladen, type Speicherstand } from '../saatgutSpeichern.ts';

type Schritt = 'vorne' | 'hinten' | 'ergebnis' | 'fertig';
const SCHRITTE: { id: Exclude<Schritt, 'fertig'>; titel: string }[] = [
  { id: 'vorne', titel: 'Vorderseite' },
  { id: 'hinten', titel: 'Rückseite' },
  { id: 'ergebnis', titel: 'Ergebnis' },
];
const KULTURTYPEN: { wert: Kulturtyp; titel: string }[] = [
  { wert: 'blatt', titel: 'Blatt' },
  { wert: 'knolle', titel: 'Knolle' },
  { wert: 'frucht', titel: 'Frucht' },
];

/** Uhr der Oberfläche (G2: Date.now() nur hier) */
const jetzt = () => new Date(Date.now());

interface Foto {
  datei: File;
  url: string;
}
interface Hochgeladen {
  datei: File;
  pfad: string;
}

function neueIds() {
  return { sorteId: neueClientId(), saatgutId: neueClientId() };
}

export function SaatgutErfassen({ onSchliessen }: { onSchliessen: () => void }) {
  const { buendel } = useBuendel();
  const alleArten = (buendel?.teile['art'] ?? []) as ArtZeile[];
  const arten = alleArten.filter((a) => a.gueltig_bis === null);
  const sorten = (buendel?.teile['sorte'] ?? []) as SorteZeile[];
  const gruppen = (buendel?.teile['kulturgruppe'] ?? []) as {
    kulturgruppe_id: string;
    leitkultur_art_id: string | null;
  }[];

  const [ids, setIds] = useState(neueIds);
  const [schritt, setSchritt] = useState<Schritt>('vorne');
  const [fotos, setFotos] = useState<Partial<Record<TuetenfotoSeite, Foto>>>({});
  const [hochgeladen, setHochgeladen] = useState<Partial<Record<TuetenfotoSeite, Hochgeladen>>>({});
  const [liest, setLiest] = useState(false);
  const [ladefehler, setLadefehler] = useState<'lesbar' | 'hochladen'>();
  const [ki, setKi] = useState<KiLauf>();
  const [kiHinweis, setKiHinweis] = useState<string>();
  const [f, setF] = useState<SortenFormular>(leeresFormular);
  /** Tim hat die Art selbst gewählt; sonst gilt der Vorschlag aus dem KI-Feld, auch wenn das Bündel später lädt */
  const [artVonHand, setArtVonHand] = useState(false);
  const [aendern, setAendern] = useState(false);
  const [fehler, setFehler] = useState<{ feld: string; text: string }[]>([]);
  const [sendet, setSendet] = useState(false);
  const [meldung, setMeldung] = useState<string>();
  const [stand, setStand] = useState<Speicherstand>();
  const [ergebnis, setErgebnis] = useState<{ sorteId: string; text: string }>();
  const [recherche, setRecherche] = useState<RechercheErgebnis | 'laeuft'>();
  /** Kamera in der App offen (Plan kamera); vorne: schon aufgenommene Vorderseite */
  const [kamera, setKamera] = useState<{ vorne?: Foto }>();
  /** aktuelle sorte_id; ein spätes Ergebnis der Recherche einer früheren Tüte überschreibt nichts */
  const aktiveSorte = useRef(ids.sorteId);

  // beim Rendern abgeleitet (Plan 211, Plan 207 A19): Art, Kulturtyp und Erkennung
  const kiArt = ki?.felder.art ?? undefined;
  const artId = artVonHand ? f.artId : (f.artId ?? artVorschlagen(arten, kiArt));
  const kulturtyp = f.kulturtyp ?? kulturtypVorschlagen(sorten, artId);
  const name = (f.tuete.name ?? '').trim();
  // die eigene, eben angelegte Sorte ist keine «vorhandene» (Prüferbefund 1, Runde 1): sonst verdrängt «Packung zu …»
  // nach einem Teilerfolg das Fortsetzen von «Sorte speichern»
  const andere = sorten.filter((s) => s.sorte_id !== ids.sorteId);
  const erkanntId = artVonHand
    ? artId && name
      ? vorhandeneSorte(andere, name, artId)
      : undefined
    : sorteErkennen(andere, arten, { name, art: kiArt })?.sorteId;
  const erkannt = andere.find((s) => s.sorte_id === erkanntId && s.gueltig_bis === null);
  const erkanntGemuese = arten.find((a) => a.art_id === erkannt?.art_id)?.name_de;
  const formular: SortenFormular = { ...f, artId, kulturtyp };
  const fehlerZu = (feld: string) => fehler.find((x) => x.feld === feld)?.text;

  function zuruecksetzen() {
    const neu = neueIds();
    aktiveSorte.current = neu.sorteId;
    setIds(neu);
    setSchritt('vorne');
    setFotos({});
    setHochgeladen({});
    setLadefehler(undefined);
    setKi(undefined);
    setKiHinweis(undefined);
    setF(leeresFormular());
    setArtVonHand(false);
    setAendern(false);
    setFehler([]);
    setMeldung(undefined);
    setStand(undefined);
    setErgebnis(undefined);
    setRecherche(undefined);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  function fotoWaehlen(seite: TuetenfotoSeite, datei: File) {
    setFotos((alt) => ({ ...alt, [seite]: { datei, url: URL.createObjectURL(datei) } }));
    if (seite === 'vorne' && schritt === 'vorne') setSchritt('hinten');
  }

  /** lädt jedes gewählte, noch nicht hochgeladene Foto in den Ordner der neuen sorte_id (Plan 37 A16) */
  async function hochladen(
    quelle: Partial<Record<TuetenfotoSeite, Foto>> = fotos,
  ): Promise<{ seite: TuetenfotoSeite; pfad: string }[] | { fehler: 'lesbar' | 'hochladen' }> {
    const liste: { seite: TuetenfotoSeite; pfad: string }[] = [];
    const neu = { ...hochgeladen };
    for (const seite of ['vorne', 'hinten'] as const) {
      const foto = quelle[seite];
      if (!foto) continue;
      const schon = neu[seite];
      if (schon && schon.datei === foto.datei) {
        liste.push({ seite, pfad: schon.pfad });
        continue;
      }
      const r = await tuetenfotoHochladen(ids.sorteId, foto.datei);
      if ('fehler' in r) {
        setHochgeladen(neu);
        return { fehler: r.fehler };
      }
      neu[seite] = { datei: foto.datei, pfad: r.pfad };
      liste.push({ seite, pfad: r.pfad });
    }
    setHochgeladen(neu);
    return liste;
  }

  /** quelle: Fotos aus der Kamera, die noch nicht im Zustand stehen (Plan kamera) */
  async function lesen(quelle?: Partial<Record<TuetenfotoSeite, Foto>>) {
    setSchritt('ergebnis');
    setLiest(true);
    setLadefehler(undefined);
    setKiHinweis(undefined);
    const hoch = await hochladen(quelle);
    if ('fehler' in hoch) {
      setLiest(false);
      setLadefehler(hoch.fehler);
      return;
    }
    const fotopfade = hoch.map((x) => x.pfad);
    const r = await tueteLesen({ fotopfade });
    setLiest(false);
    if (r.ergebnis !== 'ok') {
      setKi(undefined);
      setKiHinweis(r.hinweis);
      return;
    }
    setF((alt) => formularNachKi(alt, r).formular);
    setKi({ ...r, fotopfade });
  }

  async function speichern(modus: 'neu' | 'packung') {
    const ziel = modus === 'packung' ? erkannt : undefined;
    if (modus === 'neu') {
      const f2 = formularPruefen(formular, alleArten, gruppen).filter((x) =>
        ['name', 'art', 'kulturtyp'].includes(x.feld),
      );
      setFehler(f2);
      if (f2.length > 0) return;
    } else if (!ziel) return;
    setSendet(true);
    setMeldung(undefined);
    const hoch = await hochladen();
    if ('fehler' in hoch) {
      setSendet(false);
      setMeldung(
        hoch.fehler === 'lesbar'
          ? 'Nicht gespeichert: Das Foto ist nicht lesbar. Nimm es neu auf.'
          : 'Nicht gespeichert: Das Foto ist nicht hochgeladen. Prüf die Verbindung und speichere erneut.',
      );
      return;
    }
    const sorteId = ziel?.sorte_id ?? ids.sorteId;
    const schluessel = JSON.stringify({ modus, sorteId, formular, ki: ki?.dauerMs, hoch });
    let aktuell = stand?.schluessel === schluessel ? stand : undefined;
    if (!aktuell) {
      const e = erfassungBauen(
        formular,
        { sorteId, saatgutId: ids.saatgutId, clientIds: neueClientId, fotos: hoch },
        ki,
        { jetzt: jetzt(), zeitzone: ZEITZONE, appVersion: APP_VERSION },
      );
      aktuell = {
        schluessel,
        wissen: modus === 'packung' ? [] : e.wissen,
        vorgang: e.vorgang,
        wissenErledigt: 0,
      };
    }
    const r = await erfassungSenden(aktuell);
    setStand(r.stand);
    setSendet(false);
    if (r.status === 'nicht_gespeichert') {
      setMeldung(r.meldung);
      return;
    }
    setErgebnis({
      sorteId,
      text: ziel ? `Gespeichert: Packung zu ${ziel.name}` : `Gespeichert: ${name} mit Packung`,
    });
    setSchritt('fertig');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    if (!ziel) {
      setRecherche('laeuft');
      const r2 = await rechercheStarten(sorteId);
      if (aktiveSorte.current === sorteId) setRecherche(r2);
    }
  }

  /** Kamera fertig: Fotos übernehmen und die Tüte ohne weiteren Tipp lesen */
  function kameraFertig(vorne: Foto, hinten?: Foto) {
    setKamera(undefined);
    const quelle = hinten ? { vorne, hinten } : { vorne };
    setFotos(quelle);
    void lesen(quelle);
  }

  const felderZeigen = !liest && !ladefehler && (!erkannt || aendern);
  const kameraVorne = kamera?.vorne;
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Tüte erfassen</h1>
        <Button variant="ghost" size="compact" disabled={sendet || liest} onClick={onSchliessen}>
          {schritt === 'fertig' ? 'Schliessen' : 'Abbrechen'}
        </Button>
      </header>
      {schritt !== 'fertig' ? (
        <ol className="hv-sorte-schritte" aria-label="Schritte">
          {SCHRITTE.map((s, i) => (
            <li key={s.id} aria-current={s.id === schritt ? 'step' : undefined}>
              {i + 1} {s.titel}
            </li>
          ))}
        </ol>
      ) : null}

      {kamera ? (
        <Kamera
          titel="Tüte erfassen"
          schritt={kameraVorne ? 'Rückseite' : 'Vorderseite'}
          hinweis={
            kameraVorne
              ? 'Dreh die Tüte um. Auf der Rückseite stehen meist Keimart und Keimtemperatur.'
              : 'Halte die Vorderseite der Tüte formatfüllend in den Rahmen.'
          }
          vorschau={kameraVorne?.url}
          vorschauText={kameraVorne ? 'Vorderseite aufgenommen' : undefined}
          aktionen={
            kameraVorne
              ? [{ text: 'Ohne Rückseite lesen', onClick: () => kameraFertig(kameraVorne) }]
              : undefined
          }
          onFoto={(datei) => {
            const foto = { datei, url: URL.createObjectURL(datei) };
            if (!kameraVorne) setKamera({ vorne: foto });
            else kameraFertig(kameraVorne, foto);
          }}
          onSchliessen={() => {
            if (kameraVorne) URL.revokeObjectURL(kameraVorne.url);
            setKamera(undefined);
          }}
        />
      ) : null}

      {schritt === 'vorne' ? (
        <section className="hv-formular" aria-label="Vorderseite">
          <Button block onClick={() => setKamera({})}>
            Vorder- und Rückseite aufnehmen
          </Button>
          <PhotoField
            label="Vorderseite"
            knopf="Foto aufnehmen"
            hint="Halte die Vorderseite der Tüte formatfüllend ins Bild."
            onWahl={(datei) => fotoWaehlen('vorne', datei)}
          />
        </section>
      ) : null}

      {schritt === 'hinten' ? (
        <section className="hv-formular" aria-label="Rückseite">
          <PhotoField
            label="Vorderseite"
            vorschau={fotos.vorne?.url}
            onWahl={(datei) => fotoWaehlen('vorne', datei)}
          />
          <PhotoField
            label="Rückseite"
            knopf={fotos.hinten ? 'Foto ersetzen' : 'Foto aufnehmen'}
            vorschau={fotos.hinten?.url}
            hint="Auf der Rückseite stehen meist Keimart und Keimtemperatur."
            onWahl={(datei) => fotoWaehlen('hinten', datei)}
          />
          {fotos.hinten ? (
            <Button block onClick={() => void lesen()}>
              Tüte lesen
            </Button>
          ) : (
            <Button variant="secondary" block onClick={() => void lesen()}>
              Ohne Rückseite lesen
            </Button>
          )}
        </section>
      ) : null}

      {schritt === 'ergebnis' ? (
        <section className="hv-formular" aria-label="Ergebnis">
          {liest ? <p role="status">Tüte wird gelesen</p> : null}
          {ladefehler === 'hochladen' ? (
            <Notice
              tone="danger"
              action={
                <Button variant="secondary" onClick={() => void lesen()}>
                  Erneut versuchen
                </Button>
              }
            >
              Fotos nicht hochgeladen. Prüf die Verbindung und versuche es erneut.
            </Notice>
          ) : null}
          {ladefehler === 'lesbar' ? (
            <Notice
              tone="danger"
              action={
                <Button variant="secondary" onClick={zuruecksetzen}>
                  Fotos neu aufnehmen
                </Button>
              }
            >
              Das Foto ist nicht lesbar. Nimm es neu auf.
            </Notice>
          ) : null}
          {kiHinweis && !liest ? <Notice tone="warn">{kiHinweis}</Notice> : null}
          {!liest && !ladefehler && erkannt ? (
            <Notice tone="info" title={`${erkannt.name} gibt es schon`}>
              {`Gemüse: ${erkanntGemuese ?? erkannt.art_id}`}
            </Notice>
          ) : null}
          {!liest && !ladefehler && erkannt ? (
            <>
              <Button block disabled={sendet} onClick={() => void speichern('packung')}>
                {`Packung zu ${erkannt.name} hinzufügen`}
              </Button>
              {!aendern ? (
                <Button variant="secondary" block onClick={() => setAendern(true)}>
                  Name oder Art ändern
                </Button>
              ) : null}
            </>
          ) : null}
          {felderZeigen ? (
            <>
              <TextField
                label="Name"
                value={f.tuete.name ?? ''}
                error={fehlerZu('name')}
                onChange={(ev) => {
                  setF((alt) => ({ ...alt, tuete: { ...alt.tuete, name: ev.target.value } }));
                  setMeldung(undefined);
                }}
              />
              <div className={fehlerZu('art') ? 'hv-field hv-field-error' : 'hv-field'}>
                <label className="hv-field-label" htmlFor="saatgut-art">
                  Art
                </label>
                <div className="hv-field-box">
                  <select
                    id="saatgut-art"
                    className="hv-field-input"
                    value={artId ?? ''}
                    onChange={(ev) => {
                      setArtVonHand(true);
                      setF((alt) => ({ ...alt, artId: ev.target.value || undefined }));
                      setMeldung(undefined);
                    }}
                  >
                    <option value="">Art wählen</option>
                    {arten.map((a) => (
                      <option key={a.art_id} value={a.art_id}>
                        {a.name_de} ({a.name_wiss})
                      </option>
                    ))}
                  </select>
                </div>
                {fehlerZu('art') ? (
                  <p className="hv-field-msg hv-field-msg-error">{fehlerZu('art')}</p>
                ) : null}
                <p className="hv-field-msg">
                  <span>
                    Fehlt die Art in der Liste, erfasse die Tüte unter{' '}
                    <a href={hashZu({ name: 'sorte-neu' })}>Von Hand erfassen</a>.
                  </span>
                </p>
              </div>
              <p className="hv-field-label" aria-hidden="true">
                Kulturtyp
              </p>
              <Choice
                label="Kulturtyp"
                zeile
                einzeln
                optionen={KULTURTYPEN}
                gewaehlt={kulturtyp ? [kulturtyp] : []}
                onWahl={(w) => setF((alt) => ({ ...alt, kulturtyp: w as Kulturtyp }))}
              />
              {fehlerZu('kulturtyp') ? (
                <p className="hv-field-msg hv-field-msg-error">{fehlerZu('kulturtyp')}</p>
              ) : null}
              {!erkannt ? (
                <Button block disabled={sendet} onClick={() => void speichern('neu')}>
                  Sorte speichern
                </Button>
              ) : null}
            </>
          ) : null}
          {sendet ? <p role="status">Wird gespeichert</p> : null}
          {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
        </section>
      ) : null}

      {schritt === 'fertig' && ergebnis ? (
        <section className="hv-formular" aria-label="Gespeichert">
          <Notice tone="ok">{ergebnis.text}</Notice>
          <RechercheHinweis recherche={recherche} />
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'sorte', sorte: ergebnis.sorteId })}>
            Sorte öffnen
          </a>
          <Button block onClick={zuruecksetzen}>
            Nächste Tüte erfassen
          </Button>
          <Button variant="secondary" block onClick={onSchliessen}>
            Zum Saatgut
          </Button>
        </section>
      ) : null}
    </main>
  );
}
