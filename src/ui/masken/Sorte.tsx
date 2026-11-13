// Detail einer Sorte (UC4; Konzept 11.3 «Tim sieht jeden ergänzten Wert mit Herkunft», R1.3, R12.3; Plan 37).
// Werte je anwendbarer Phase mit Herkunft und Verlässlichkeit, Saatempfehlungen, Packungen; «Recherche starten»,
// solange die Sorte unvollständig ist.
import { useState } from 'react';
import { fotoHochladen, rechercheStarten } from '../../daten/ki.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
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
import { ZEITZONE } from '../../domain/zeit.ts';
import { APP_VERSION } from '../../konstanten.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { PhotoField } from '../bausteine/PhotoField.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import { tuetenbildVerkleinern } from '../tuetenbild.ts';
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

/** Uhr der Oberfläche (G2: Date.now() nur hier) */
const jetzt = () => new Date(Date.now());

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
function TuetenfotoKarte({ sorteId }: { sorteId: string }) {
  const { buendel } = useBuendel();
  const zeilen = (buendel?.teile['tuetenfoto'] ?? []) as TuetenfotoZeile[];
  const aktuell = aktuelleTuetenfotos(zeilen, sorteId);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string>();
  const [offen, setOffen] = useState<Offen>();
  const [erwartet, setErwartet] = useState<{ seite: TuetenfotoSeite; clientId: string }>();
  const wartetAufBuendel = erwartet !== undefined && aktuell[erwartet.seite]?.clientId !== erwartet.clientId;
  const gesperrt = laeuft || wartetAufBuendel;

  async function senden(o: Offen) {
    const r = await schreiben(o.vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    if (r.status === 'gespeichert') {
      setOffen(undefined);
      setErwartet({ seite: o.seite, clientId: o.clientId });
      return;
    }
    if (r.status === 'abweichend') {
      // dasselbe Senden ergäbe wieder «abweichend»: kein Wiederholen anbieten
      setOffen(undefined);
      setMeldung(
        'Foto nicht gespeichert: Es ist schon mit anderen Angaben gespeichert. Wähle das Foto erneut.',
      );
      return;
    }
    setOffen(o);
    setMeldung(r.fehler.text);
  }

  async function waehlen(seite: TuetenfotoSeite, datei: File) {
    setLaeuft(true);
    setMeldung(undefined);
    setOffen(undefined);
    try {
      let bild: Blob;
      try {
        bild = await tuetenbildVerkleinern(datei);
      } catch {
        setMeldung('Foto nicht gespeichert: Das Foto ist nicht lesbar. Wähle ein anderes Foto.');
        return;
      }
      const hoch = await fotoHochladen(sorteId, bild);
      if ('fehler' in hoch) {
        setMeldung('Foto nicht gespeichert. Prüf die Verbindung und wähle es erneut.');
        return;
      }
      const clientId = neueClientId();
      await senden({
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

  return (
    <Card title="Tütenfoto">
      <TuetenfotoAnzeige sorteId={sorteId} leerText="Wähle unten ein Foto der Vorder- oder Rückseite." />
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
          Zu den Sorten
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
          <TuetenfotoKarte sorteId={sorte} />
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
          {recherche === 'laeuft' ? (
            <Notice tone="info">Recherche läuft. Du kannst die Seite verlassen.</Notice>
          ) : recherche?.ergebnis === 'ok' ? (
            <Notice tone="info">
              {`Ergänzt: ${recherche.werte} ${recherche.werte === 1 ? 'Wert' : 'Werte'} und ${recherche.saat} ${recherche.saat === 1 ? 'Saatempfehlung' : 'Saatempfehlungen'}. Offen: ${recherche.offen.length + recherche.offenSaat.length} ${recherche.offen.length + recherche.offenSaat.length === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}.`}
            </Notice>
          ) : recherche ? (
            <Notice tone="warn">{recherche.hinweis}</Notice>
          ) : null}
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
                  {p.kaufdatum ? `Gekauft ${datum(p.kaufdatum)}` : 'Kaufdatum offen'} · Bestand{' '}
                  {p.bestandKorn ?? '–'} Korn
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
