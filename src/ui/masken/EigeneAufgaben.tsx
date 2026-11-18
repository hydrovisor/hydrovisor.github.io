// Abschnitt «Eigene Aufgaben» der Maske Anlage (Plan 249 Oberfläche; Konzept R5.2 letzte Zeile, 8.1 Regel 2; U14):
// Kontext Schreibtisch, Standarddichte 48 dp, Systemtastatur erlaubt. Liste mit Name, Intervall und Fälligkeit, Anlegen,
// Ändern (neue Zeile mit ersetzt_id plus Storno) und Entfernen (Storno nach Rückfrage, A12). Geschrieben wird nur über
// schreiben() (11.4); danach lädt das Bündel von selbst nach.
import { useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import {
  eigeneAendernVorgang,
  eigeneAnlegenVorgang,
  eigeneAufgabenListe,
  eigeneEingabePruefen,
  eigeneEntfernenVorgang,
  type EigeneDefinition,
} from '../../domain/aufgaben-eigene.ts';
import type { Teile } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';

type Modus =
  | { art: 'liste' }
  | { art: 'formular'; alt?: EigeneDefinition }
  | { art: 'entfernen'; definition: EigeneDefinition };

/** «30» → 30; alles andere (leer, «abc», «1.5») → NaN, damit die Prüfung es meldet */
const zahl = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : Number.NaN);

export function EigeneAufgaben({
  teile,
  anlageId,
  jetzt,
}: {
  teile: Teile | undefined;
  anlageId: string;
  jetzt: Date;
}) {
  const [modus, setModus] = useState<Modus>({ art: 'liste' });
  const [name, setName] = useState('');
  const [intervall, setIntervall] = useState('');
  const [beruehrt, setBeruehrt] = useState({ name: false, intervall: false });
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();
  // Wiederholung nach einem Fehler sendet dieselben Client-UUIDs (TO2, 8.1 Regel 3; Runde 1 Befund 1)
  const [entwurf, setEntwurf] = useState<{ schluessel: string; vorgang: Vorgang }>();
  const liste = teile ? eigeneAufgabenListe(teile, anlageId, jetzt, ZEITZONE) : [];

  const eingabe = { name, intervallD: zahl(intervall) };
  const verstoesse = eigeneEingabePruefen(eingabe);
  const fehlerVon = (feld: string, gezeigt: boolean) =>
    gezeigt ? verstoesse.find((v) => v.feld === feld)?.grund : undefined;

  function formularOeffnen(alt?: EigeneDefinition) {
    setName(alt?.name ?? '');
    setIntervall(alt ? String(alt.intervallD) : '');
    setBeruehrt({ name: false, intervall: false });
    setFehler(undefined);
    setEntwurf(undefined);
    setModus(alt ? { art: 'formular', alt } : { art: 'formular' });
  }

  async function senden(vorgang: Vorgang) {
    if (vorgang.length === 0) {
      setModus({ art: 'liste' });
      return;
    }
    setSendet(true);
    try {
      const r = await schreiben(vorgang, { jetzt: new Date(Date.now()), zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      setFehler(undefined);
      setEntwurf(undefined);
      setModus({ art: 'liste' });
    } finally {
      setSendet(false);
    }
  }

  function speichern() {
    if (modus.art !== 'formular' || verstoesse.length > 0) return;
    // gleiches Ziel und gleiche Eingabe behalten die Client-UUIDs, eine geänderte Eingabe bekommt neue
    const schluessel = JSON.stringify([modus.alt?.id ?? anlageId, eingabe.name.trim(), eingabe.intervallD]);
    let vorgang = entwurf?.schluessel === schluessel ? entwurf.vorgang : undefined;
    if (!vorgang) {
      const id = neueClientId();
      vorgang = modus.alt
        ? eigeneAendernVorgang(modus.alt, eingabe, id)
        : eigeneAnlegenVorgang(anlageId, eingabe, id);
      setEntwurf({ schluessel, vorgang });
    }
    void senden(vorgang);
  }

  return (
    <section className="hv-eigene-aufgaben" aria-labelledby="eigene-aufgaben-titel">
      <h2 id="eigene-aufgaben-titel" className="hv-gefaess-h2">
        Eigene Aufgaben
      </h2>
      {liste.length === 0 ? <p className="hv-anlage-info">Noch keine eigene Aufgabe</p> : null}
      {liste.map(({ definition: d, text }) => (
        <Card
          key={d.id}
          title={d.name}
          meta={text}
          footer={
            modus.art === 'liste' ? (
              <>
                <Button variant="secondary" onClick={() => formularOeffnen(d)}>
                  Ändern
                </Button>
                <Button variant="secondary" onClick={() => setModus({ art: 'entfernen', definition: d })}>
                  Entfernen
                </Button>
              </>
            ) : undefined
          }
        >
          {modus.art === 'entfernen' && modus.definition.id === d.id ? (
            <Notice
              tone="warn"
              title="Aufgabe entfernen? Erledigungen bleiben erhalten."
              action={
                <>
                  <Button
                    variant="danger"
                    disabled={sendet}
                    onClick={() => void senden(eigeneEntfernenVorgang(d))}
                  >
                    Entfernen
                  </Button>
                  <Button variant="secondary" disabled={sendet} onClick={() => setModus({ art: 'liste' })}>
                    Abbrechen
                  </Button>
                </>
              }
            />
          ) : null}
        </Card>
      ))}
      {modus.art === 'formular' ? (
        <form
          className="hv-formular"
          aria-label={modus.alt ? 'Eigene Aufgabe ändern' : 'Eigene Aufgabe hinzufügen'}
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <TextField
            label="Name"
            value={name}
            maxLength={80}
            autoComplete="off"
            error={fehlerVon('name', beruehrt.name)}
            onChange={(e) => {
              setName(e.target.value);
              setBeruehrt((b) => ({ ...b, name: true }));
            }}
          />
          <TextField
            label="Intervall"
            unit="Tage"
            inputMode="numeric"
            value={intervall}
            autoComplete="off"
            hint="1 bis 365 Tage"
            error={fehlerVon('intervall_d', beruehrt.intervall)}
            onChange={(e) => {
              setIntervall(e.target.value);
              setBeruehrt((b) => ({ ...b, intervall: true }));
            }}
          />
          <div className="hv-anlage-zweispaltig">
            <Button type="submit" variant="primary" disabled={sendet || verstoesse.length > 0}>
              Speichern
            </Button>
            <Button variant="secondary" disabled={sendet} onClick={() => setModus({ art: 'liste' })}>
              Abbrechen
            </Button>
          </div>
        </form>
      ) : null}
      {modus.art === 'liste' ? (
        <Button variant="secondary" onClick={() => formularOeffnen()}>
          Aufgabe hinzufügen
        </Button>
      ) : null}
      {fehler ? <Notice tone="danger">{fehler}</Notice> : null}
    </section>
  );
}
