// Detail einer Sorte (UC4; Konzept 11.3 «Tim sieht jeden ergänzten Wert mit Herkunft», R1.3, R12.3; Plan 37).
// Werte je anwendbarer Phase mit Herkunft und Verlässlichkeit, Saatempfehlungen, Packungen; «Recherche starten»,
// solange die Sorte unvollständig ist. Karte «Vorrat» mit «Kein Saatgut mehr» und «Wieder vorrätig» (Issue #215,
// Plan 215 A11).
import { useState } from 'react';
import { rechercheStarten } from '../../daten/ki.ts';
import { neueClientId } from '../../daten/schreiben.ts';
import { wissenSchreiben } from '../../daten/wissen.ts';
import type { RechercheErgebnis } from '../../domain/ki/recherche.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { sortenDetail } from '../../domain/sorten/liste.ts';
import {
  aktuelleTuetenfotos,
  tuetenfotoVorgang,
  type TuetenfotoSeite,
  type TuetenfotoZeile,
} from '../../domain/sorten/tuetenfoto.ts';
import {
  vorratAus,
  vorratVerlauf,
  vorratVorgang,
  type VorratEreignisZeile,
  type VorratTyp,
} from '../../domain/sorten/vorrat.ts';
import { kalendertag, ZEITZONE } from '../../domain/zeit.ts';
import { APP_VERSION } from '../../konstanten.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Kamera } from '../bausteine/Kamera.tsx';
import { PhotoField } from '../bausteine/PhotoField.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { RechercheHinweis } from '../RechercheHinweis.tsx';
import { hashZu } from '../router.ts';
import { fotoVorgangSenden, tuetenfotoHochladen, vorratSenden } from '../saatgutSpeichern.ts';
import { TuetenfotoAnzeige } from '../TuetenfotoAnzeige.tsx';
import '../sorten.css';

const KEIMART: Record<string, string> = {
  licht: 'Lichtkeimer',
  dunkel: 'Dunkelkeimer',
  indifferent: 'ohne Angabe zum Licht',
};
/** «2027-01-10» → «10.1.2027» (Anzeige) */
const datum = (iso: string | null) => {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${Number(m[3])}.${Number(m[2])}.${m[1]}` : (iso ?? '');
};

const KULTURFORM_NAME: Record<string, string> = {
  keimling: 'Keimling',
  babyleaf: 'Babyleaf',
  schnitt: 'Schnitt',
  kopf: 'Kopf',
  dauerkultur_blatt: 'Dauerkultur Blatt',
  dauerkultur_frucht: 'Dauerkultur Frucht',
};

const SEITE_LABEL: Record<TuetenfotoSeite, string> = { vorne: 'Vorderseite', hinten: 'Rückseite' };

/** offener Vorgang für «Speichern wiederholen» und die client_id, die das Bündel danach zeigen muss */
interface Offen {
  vorgang: Vorgang;
  seite: TuetenfotoSeite;
  clientId: string;
}

/**
 * Card «Tütenfoto» am Schreibtisch (Plan 207): Anzeige über signierte Links, je Seite «Tütenfoto ergänzen» oder «Foto
 * ersetzen». Wahl → verkleinern → hochladen → Storno der alten Zeile plus neue Zeile über schreiben(); scheitert das
 * Schreiben, sendet «Speichern wiederholen» denselben Vorgang (A12). Die Fotofelder bleiben gesperrt, bis das Bündel die
 * neue Zeile zeigt, damit kein zweites Ersetzen die alte Zeile übersieht (A11).
 */
function TuetenfotoKarte({ sorteId, titel }: { sorteId: string; titel: string }) {
  const { buendel } = useBuendel();
  const zeilen = (buendel?.teile['tuetenfoto'] ?? []) as TuetenfotoZeile[];
  const aktuell = aktuelleTuetenfotos(zeilen, sorteId);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string>();
  const [offen, setOffen] = useState<Offen>();
  const [erwartet, setErwartet] = useState<{ seite: TuetenfotoSeite; clientId: string }>();
  const wartetAufBuendel = erwartet !== undefined && aktuell[erwartet.seite]?.clientId !== erwartet.clientId;
  const gesperrt = laeuft || wartetAufBuendel;

  /** Kamera in der App (Plan kamera): offen mit dem schon aufgenommenen Foto der Vorderseite */
  const [kamera, setKamera] = useState<{ vorne?: { datei: File; url: string } }>();

  async function senden(o: Offen): Promise<boolean> {
    const r = await fotoVorgangSenden(o.vorgang);
    if (r === 'gespeichert') {
      setOffen(undefined);
      setErwartet({ seite: o.seite, clientId: o.clientId });
      return true;
    }
    // «abweichend»: dasselbe Senden ergäbe wieder «abweichend», kein Wiederholen anbieten
    setOffen(r.wiederholbar ? o : undefined);
    setMeldung(r.meldung);
    return false;
  }

  async function waehlen(seite: TuetenfotoSeite, datei: File): Promise<boolean> {
    setLaeuft(true);
    setMeldung(undefined);
    setOffen(undefined);
    try {
      const hoch = await tuetenfotoHochladen(sorteId, datei);
      if ('fehler' in hoch) {
        setMeldung(
          hoch.fehler === 'lesbar'
            ? 'Foto nicht gespeichert: Das Foto ist nicht lesbar. Wähle ein anderes Foto.'
            : 'Foto nicht gespeichert. Prüf die Verbindung und wähle es erneut.',
        );
        return false;
      }
      const clientId = neueClientId();
      return await senden({
        seite,
        clientId,
        vorgang: tuetenfotoVorgang({
          sorteId,
          seite,
          pfad: hoch.pfad,
          clientId,
          ersetzt: aktuell[seite]?.clientId,
        }),
      });
    } finally {
      setLaeuft(false);
    }
  }

  async function wiederholen() {
    if (!offen) return;
    setLaeuft(true);
    setMeldung(undefined);
    await senden(offen);
    setLaeuft(false);
  }

  /** Kamera geschlossen: Vorderseite, dann Rückseite speichern; scheitert die Vorderseite, bleibt ihre Meldung stehen */
  async function reiheSpeichern(vorne: File, hinten?: File) {
    kameraSchliessen();
    if ((await waehlen('vorne', vorne)) && hinten) await waehlen('hinten', hinten);
  }

  /** Kamera zu, Vorschau der Vorderseite freigeben */
  function kameraSchliessen() {
    if (kamera?.vorne) URL.revokeObjectURL(kamera.vorne.url);
    setKamera(undefined);
  }

  function kameraFoto(datei: File) {
    if (!kamera?.vorne) setKamera({ vorne: { datei, url: URL.createObjectURL(datei) } });
    else void reiheSpeichern(kamera.vorne.datei, datei);
  }

  const vorneAufgenommen = kamera?.vorne;
  return (
    <Card title="Tütenfoto">
      <TuetenfotoAnzeige sorteId={sorteId} leerText="Nimm unten die Vorder- und die Rückseite auf." />
      <Button block disabled={gesperrt} onClick={() => setKamera({})}>
        Vorder- und Rückseite aufnehmen
      </Button>
      {kamera ? (
        <Kamera
          titel={titel}
          schritt={vorneAufgenommen ? 'Rückseite' : 'Vorderseite'}
          hinweis={
            vorneAufgenommen
              ? 'Dreh die Tüte um und nimm die Rückseite auf.'
              : 'Halte die Vorderseite der Tüte formatfüllend in den Rahmen.'
          }
          vorschau={vorneAufgenommen?.url}
          vorschauText={vorneAufgenommen ? 'Vorderseite aufgenommen' : undefined}
          aktionen={
            vorneAufgenommen
              ? [
                  {
                    text: 'Ohne Rückseite speichern',
                    onClick: () => void reiheSpeichern(vorneAufgenommen.datei),
                  },
                ]
              : undefined
          }
          onFoto={kameraFoto}
          onSchliessen={kameraSchliessen}
        />
      ) : null}
      {(['vorne', 'hinten'] as const).map((seite) => (
        <PhotoField
          key={seite}
          label={SEITE_LABEL[seite]}
          knopf={aktuell[seite] ? 'Foto ersetzen' : 'Tütenfoto ergänzen'}
          deaktiviert={gesperrt}
          onWahl={(datei) => void waehlen(seite, datei)}
        />
      ))}
      {gesperrt ? <p role="status">Foto wird gespeichert</p> : null}
      {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
      {offen && !laeuft ? (
        <Button variant="secondary" onClick={() => void wiederholen()}>
          Speichern wiederholen
        </Button>
      ) : null}
    </Card>
  );
}

/** Uhr der Oberfläche (G2: Date.now() nur hier) */
const jetzt = () => new Date(Date.now());

/** Kalendertag in Zürich als «TT.MM.JJJJ» (G2) */
function tagAnzeige(zeitpunkt: string): string {
  const [j, m, t] = kalendertag(new Date(zeitpunkt), ZEITZONE).split('-');
  return `${t ?? ''}.${m ?? ''}.${j ?? ''}`;
}

const VORRAT_TEXT: Record<VorratTyp, string> = {
  aufgebraucht: 'Kein Saatgut mehr',
  vorraetig: 'Wieder vorrätig',
};

/**
 * Card «Vorrat» (Plan 215): Status als Wort, «Kein Saatgut mehr» bzw. «Wieder vorrätig» schreibt sofort ein Ereignis
 * über schreiben() (umkehrbar, ohne Rückfrage). Der Knopf bleibt gesperrt, bis das Bündel die neue Zeile zeigt, damit
 * kein doppeltes Ereignis entsteht; scheitert das Schreiben, sendet «Speichern wiederholen» denselben Vorgang (TO2).
 */
function VorratKarte({ sorteId }: { sorteId: string }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile ?? {};
  const ereignisse = (teile['vorrat_ereignis'] ?? []) as VorratEreignisZeile[];
  const nun = jetzt();
  const stand = vorratAus(teile, sorteId, nun);
  const verlauf = vorratVerlauf(ereignisse, sorteId, nun);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string>();
  const [offen, setOffen] = useState<Vorgang>();
  const [erwartet, setErwartet] = useState<string>();
  const wartetAufBuendel = erwartet !== undefined && !ereignisse.some((e) => e.client_id === erwartet);
  const gesperrt = laeuft || wartetAufBuendel;

  async function senden(vorgang: Vorgang, clientId: string) {
    setLaeuft(true);
    setMeldung(undefined);
    try {
      const r = await vorratSenden(vorgang);
      if (r === 'gespeichert') {
        setOffen(undefined);
        setErwartet(clientId);
        return;
      }
      setOffen(r.wiederholbar ? vorgang : undefined);
      setMeldung(r.meldung);
    } finally {
      setLaeuft(false);
    }
  }

  function erfassen(typ: VorratTyp) {
    const clientId = neueClientId();
    void senden(vorratVorgang({ sorteId, typ, clientId, jetzt: jetzt() }), clientId);
  }

  function wiederholen() {
    const schritt = offen?.[0];
    if (!offen || schritt?.art !== 'neu') return;
    void senden(offen, schritt.felder.client_id);
  }

  return (
    <Card title="Vorrat">
      <p>
        <StatusBadge tone={stand.vorraetig ? 'info' : 'neutral'}>
          {stand.vorraetig ? 'Vorrätig' : 'Aufgebraucht'}
        </StatusBadge>
      </p>
      {!stand.vorraetig ? (
        <p>Säen zeigt diese Sorte nicht. Eine neue Packung macht sie wieder vorrätig.</p>
      ) : null}
      <Button
        variant="secondary"
        block
        disabled={gesperrt}
        onClick={() => erfassen(stand.vorraetig ? 'aufgebraucht' : 'vorraetig')}
      >
        {stand.vorraetig ? 'Kein Saatgut mehr' : 'Wieder vorrätig'}
      </Button>
      {gesperrt ? <p role="status">Wird gespeichert</p> : null}
      {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
      {offen && !laeuft ? (
        <Button variant="secondary" onClick={wiederholen}>
          Speichern wiederholen
        </Button>
      ) : null}
      {verlauf.length > 0 ? (
        <ul className="hv-sorte-werte" aria-label="Verlauf">
          {verlauf.map((v, i) => (
            <li key={`${v.giltAb}-${String(i)}`}>{`${tagAnzeige(v.giltAb)} · ${VORRAT_TEXT[v.typ]}`}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export function Sorte({ sorte }: { sorte: string }) {
  const { buendel } = useBuendel();
  const [recherche, setRecherche] = useState<RechercheErgebnis | 'laeuft'>();
  const [meldung, setMeldung] = useState<string>();
  const d = buendel ? sortenDetail(buendel.teile, sorte) : undefined;

  async function bestaetigen(id: string) {
    setMeldung(undefined);
    const r = await wissenSchreiben([
      { aktion: 'saatempfehlung_bestaetigen', daten: { saatempfehlung_id: id, app_version: APP_VERSION } },
    ]);
    if (r.status === 'nicht_gespeichert') setMeldung(r.fehler.text);
  }

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">{d ? d.zeile.name : 'Sorte'}</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'sorten' })}>
          Zum Saatgut
        </a>
      </header>
      {!d ? (
        <p>{buendel ? 'Diese Sorte ist nicht bekannt.' : 'Sorte wird geladen.'}</p>
      ) : (
        <>
          <p className="hv-sorten-info">
            {d.zeile.artName}{' '}
            <StatusBadge tone={d.zeile.vollstaendig ? 'info' : 'neutral'}>
              {d.zeile.vollstaendig ? 'vollständig' : 'unvollständig'}
            </StatusBadge>{' '}
            {d.zeile.pruefauftraege} {d.zeile.pruefauftraege === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}
          </p>
          <VorratKarte sorteId={sorte} />
          <TuetenfotoKarte sorteId={sorte} titel={`${d.zeile.artName} ${d.zeile.name}`} />
          {!d.zeile.vollstaendig ? (
            <Button
              variant="secondary"
              disabled={recherche === 'laeuft'}
              onClick={() => {
                setRecherche('laeuft');
                void rechercheStarten(sorte).then(setRecherche);
              }}
            >
              Recherche starten
            </Button>
          ) : null}
          <RechercheHinweis recherche={recherche} />
          {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
          {d.phasen.map((p) => (
            <Card key={p.phase} title={p.name}>
              <ul className="hv-sorte-werte">
                {p.werte.map((w) => (
                  <li key={w.groesse}>
                    <span className="hv-sorte-wert">
                      {w.groesse}: {w.groesse === 'Keimart' ? (KEIMART[w.wert] ?? w.wert) : w.wert}
                    </span>
                    <span className="hv-sorte-herkunft">
                      {w.herkunft} · {w.verlaesslichkeit}
                      {w.quelle ? (
                        <>
                          {' · '}
                          {w.quelle.link ? (
                            <a href={w.quelle.link} target="_blank" rel="noreferrer">
                              {w.quelle.titel}
                            </a>
                          ) : (
                            w.quelle.titel
                          )}
                        </>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Card title="Saatempfehlungen">
            {d.saat.length === 0 ? <p>Noch keine Saatempfehlung.</p> : null}
            <ul className="hv-sorte-werte">
              {d.saat.map((s) => (
                <li key={s.id}>
                  <span className="hv-sorte-wert">
                    {KULTURFORM_NAME[s.kulturform] ?? s.kulturform}: {s.samen} Samen je Schwamm, Klasse{' '}
                    {s.klasse}
                  </span>
                  {s.bestaetigtAm ? (
                    <span className="hv-sorte-herkunft">bestätigt am {datum(s.bestaetigtAm)}</span>
                  ) : (
                    <Button variant="secondary" size="compact" onClick={() => void bestaetigen(s.id)}>
                      Saatempfehlung bestätigen
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Packungen">
            {d.packungen.length === 0 ? <p>Noch keine Packung.</p> : null}
            <ul className="hv-sorte-werte">
              {d.packungen.map((p) => (
                <li key={p.id}>
                  {p.kaufdatum ? `Gekauft ${datum(p.kaufdatum)}` : 'Kaufdatum offen'}
                  {p.keimfaehigkeit !== null
                    ? ` · Keimfähigkeit ${Math.round(p.keimfaehigkeit * 100)} %`
                    : ''}
                </li>
              ))}
            </ul>
            <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'sorte-neu' })}>
              Packung erfassen
            </a>
          </Card>
        </>
      )}
    </main>
  );
}
