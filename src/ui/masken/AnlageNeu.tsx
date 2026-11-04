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
import { TextField } from '../bausteine/TextField.tsx';
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

const zahl = (text: string) => (text.trim() === '' ? NaN : Number(text.replace(',', '.')));

export function AnlageNeu() {
  const { buendel } = useBuendel();
  const [e, setE] = useState<AnlageEingabe>(START);
  const [kh, setKh] = useState('');
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
    const eingabe: AnlageEingabe = { ...e, ...(kh.trim() === '' ? {} : { karbonathaerte: zahl(kh) }) };
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
          <TextField
            label="Licht ab"
            value={e.lichtVon}
            inputMode="numeric"
            error={fehlerZu('licht')}
            onChange={(ev) => aendern({ lichtVon: ev.target.value })}
          />
          <TextField
            label="Licht bis"
            value={e.lichtBis}
            inputMode="numeric"
            onChange={(ev) => aendern({ lichtBis: ev.target.value })}
          />
        </div>
        <TextField
          label="Lüfter-Einstellung"
          value={e.luefter}
          hint="Zeitplan der Lüfter, als Text"
          onChange={(ev) => aendern({ luefter: ev.target.value })}
        />
        <TextField
          label="Karbonathärte"
          unit="°dH"
          value={kh}
          inputMode="decimal"
          hint="optional"
          error={fehlerZu('karbonathaerte')}
          onChange={(ev) => setKh(ev.target.value)}
        />
        <TextField
          label="Anzahl Ebenen"
          value={String(e.bereiche.length)}
          inputMode="numeric"
          hint="1 bis 6; neue Ebenen mit Standardwerten"
          error={fehlerZu('bereiche')}
          onChange={(ev) => {
            const n = Math.max(0, Math.min(6, Math.trunc(zahl(ev.target.value)) || 0));
            aendern({
              bereiche: Array.from({ length: n }, (_, i) => e.bereiche[i] ?? standardBereich(i + 1)),
            });
          }}
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
                <TextField
                  label="Lichtleisten"
                  value={String(b.lichtleisten)}
                  inputMode="numeric"
                  onChange={(ev) => setzen({ lichtleisten: zahl(ev.target.value) })}
                />
                <TextField
                  label="Lichtstunden"
                  unit="h"
                  value={String(b.lichtstunden)}
                  inputMode="decimal"
                  onChange={(ev) => setzen({ lichtstunden: zahl(ev.target.value) })}
                />
              </div>
              <TextField
                label="Nutzbare Höhe über dem Deckel"
                unit="cm"
                value={String(b.hoeheCm)}
                inputMode="numeric"
                error={fehlerZu(`bereich-${i + 1}`)}
                onChange={(ev) => setzen({ hoeheCm: zahl(ev.target.value) })}
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
