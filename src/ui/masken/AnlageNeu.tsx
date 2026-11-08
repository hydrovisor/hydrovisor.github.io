// Anlage anlegen mit Bereichen (UC1 Ablauf Anlage anlegen; Kontext Schreibtisch, Systemtastatur erlaubt; Plan 20).
// Ein Vorgang über schreiben(); eine Wiederholung sendet dieselben Client-UUIDs (Konzept 11.4).
import { useState } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import {
  anlagePruefen,
  anlageVorgang,
  standardBereich,
  type AnlageEingabe,
  type Betriebsart,
  type Fehler,
} from '../../domain/anlage/anlegen.ts';
import type { Schritt } from '../../domain/datenpfad/erfassung.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Drehrad } from '../bausteine/Drehrad.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { Zeitwahl } from '../bausteine/Zeitwahl.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

const BETRIEBSARTEN: { wert: Betriebsart; text: string }[] = [
  { wert: 'dwc', text: 'DWC' },
  { wert: 'konstantpegel', text: 'Konstantpegel' },
  { wert: 'kratky_belueftet', text: 'Kratky belüftet' },
  { wert: 'kratky', text: 'Kratky' },
];

const START: AnlageEingabe = {
  name: '',
  kuerzel: '',
  standort: 'indoor',
  lichtVon: '06:00',
  lichtBis: '21:00',
  luefter: '',
  bereiche: [1, 2, 3, 4].map(standardBereich),
};

export function AnlageNeu() {
  const { buendel } = useBuendel();
  const [e, setE] = useState<AnlageEingabe>(START);
  const [fehler, setFehler] = useState<Fehler[]>([]);
  const [vorgang, setVorgang] = useState<{ eingabe: string; schritte: Schritt[] }>();
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);

  const fehlerZu = (feld: string) => fehler.find((f) => f.feld === feld)?.text;
  const aendern = (teil: Partial<AnlageEingabe>) => {
    setE((alt) => ({ ...alt, ...teil }));
    setErgebnis(undefined);
  };

  async function speichern() {
    // Karbonathärte erfasst Tim nicht (Plan 147); die Spalte bleibt leer
    const eingabe: AnlageEingabe = e;
    const schluessel = JSON.stringify(eingabe);
    // bei der Wiederholung zählt die eigene, vielleicht schon geschriebene Anlage nicht als vergeben (Runde 1, Befund 1)
    const wiederholung = vorgang && vorgang.eingabe === schluessel ? vorgang : undefined;
    const ersterSchritt = wiederholung?.schritte[0];
    const eigeneId =
      ersterSchritt?.art === 'neu' ? (ersterSchritt.felder['id'] as string | undefined) : undefined;
    const f = anlagePruefen(eingabe, buendel?.teile, eigeneId);
    setFehler(f);
    if (f.length > 0) return;
    // gleiche Eingabe behält die Client-UUIDs (Wiederholung), eine geänderte bekommt neue
    const aktuell =
      vorgang && vorgang.eingabe === schluessel
        ? vorgang
        : { eingabe: schluessel, schritte: anlageVorgang(eingabe, neueClientId) };
    setVorgang(aktuell);
    setSendet(true);
    const antwort = await schreiben(aktuell.schritte, { jetzt: new Date(Date.now()), zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status === 'gespeichert')
      window.location.hash = hashZu({ name: 'anlage', kuerzel: eingabe.kuerzel });
  }

  const schreibfehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const abweichend = ergebnis?.status === 'abweichend';
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Anlage anlegen</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'anlage' })}>
          Zur Anlage
        </a>
      </header>
      <form
        className="hv-formular"
        onSubmit={(ev) => {
          ev.preventDefault();
          void speichern();
        }}
      >
        <TextField
          label="Name"
          value={e.name}
          hint="z. B. Indoor-Regal"
          error={fehlerZu('name')}
          onChange={(ev) => aendern({ name: ev.target.value })}
        />
        <TextField
          label="Kürzel"
          value={e.kuerzel}
          maxLength={3}
          autoCapitalize="characters"
          hint="1 bis 3 Grossbuchstaben; fest nach dem ersten Etikettendruck"
          error={fehlerZu('kuerzel')}
          onChange={(ev) => aendern({ kuerzel: ev.target.value.toUpperCase() })}
        />
        <fieldset className="hv-anlage-feldgruppe">
          <legend>Standort</legend>
          {(['indoor', 'outdoor'] as const).map((s) => (
            <label key={s} className="hv-anlage-wahlfeld">
              <input
                type="radio"
                name="standort"
                checked={e.standort === s}
                onChange={() => aendern({ standort: s })}
              />
              {s === 'indoor' ? 'Indoor' : 'Outdoor'}
            </label>
          ))}
        </fieldset>
        <p className="hv-anlage-info">Datenart «echt»; Demo- und Testanlagen entstehen nur per Skript.</p>
        <div className="hv-anlage-zweispaltig">
          <Zeitwahl
            label="Licht ab"
            wert={e.lichtVon}
            error={fehlerZu('licht')}
            onWert={(neu) => aendern({ lichtVon: neu })}
          />
          <Zeitwahl
            label="Licht bis"
            max={24}
            wert={e.lichtBis}
            onWert={(neu) => aendern({ lichtBis: neu })}
          />
        </div>
        <TextField
          label="Lüfter-Einstellung"
          value={e.luefter}
          hint="Zeitplan der Lüfter, als Text"
          onChange={(ev) => aendern({ luefter: ev.target.value })}
        />
        <Drehrad
          label="Anzahl Ebenen"
          wert={e.bereiche.length}
          min={1}
          max={6}
          hint="1 bis 6; neue Ebenen mit Standardwerten"
          error={fehlerZu('bereiche')}
          onWert={(n) =>
            aendern({
              bereiche: Array.from({ length: n }, (_, i) => e.bereiche[i] ?? standardBereich(i + 1)),
            })
          }
        />
        {e.bereiche.map((b, i) => {
          const setzen = (teil: Partial<typeof b>) =>
            aendern({ bereiche: e.bereiche.map((x, j) => (j === i ? { ...x, ...teil } : x)) });
          return (
            <fieldset key={i} className="hv-anlage-feldgruppe" aria-label={`Ebene ${i + 1}`}>
              <legend>Ebene {i + 1}</legend>
              <label className="hv-field-label">
                Standard-Betriebsart
                <select
                  className="hv-field-input"
                  value={b.standardBetriebsart}
                  onChange={(ev) => setzen({ standardBetriebsart: ev.target.value as Betriebsart })}
                >
                  {BETRIEBSARTEN.map((a) => (
                    <option key={a.wert} value={a.wert}>
                      {a.text}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hv-anlage-zweispaltig">
                <Drehrad
                  label="Lichtleisten"
                  wert={b.lichtleisten}
                  min={0}
                  max={20}
                  onWert={(n) => setzen({ lichtleisten: n })}
                />
                <Drehrad
                  label="Lichtstunden"
                  einheit="h"
                  wert={b.lichtstunden}
                  min={0}
                  max={24}
                  schritt={0.5}
                  onWert={(n) => setzen({ lichtstunden: n })}
                />
              </div>
              <Drehrad
                label="Nutzbare Höhe über dem Deckel"
                einheit="cm"
                wert={b.hoeheCm}
                min={1}
                max={300}
                error={fehlerZu(`bereich-${i + 1}`)}
                onWert={(n) => setzen({ hoeheCm: n })}
              />
            </fieldset>
          );
        })}
        <Button type="submit" block disabled={sendet}>
          Anlage speichern
        </Button>
      </form>
      {abweichend ? (
        <Notice
          tone="warn"
          title="Schon gespeichert"
          action={
            <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'anlage', kuerzel: e.kuerzel })}>
              Anlage öffnen
            </a>
          }
        >
          Diese Anlage ist schon mit anderen Werten gespeichert; deine Änderung ist nicht übernommen.
        </Notice>
      ) : null}
      {schreibfehler ? (
        <Notice
          tone="danger"
          action={
            schreibfehler.wiederholbar ? (
              <Button variant="secondary" size="compact" disabled={sendet} onClick={() => void speichern()}>
                Erneut senden
              </Button>
            ) : undefined
          }
        >
          {schreibfehler.text}
        </Notice>
      ) : null}
    </main>
  );
}
