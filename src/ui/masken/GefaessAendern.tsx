// Gefäss ändern und entfernen (UC3 Ändern und Entfernen, 05_masken.md 4; Plan 21): Kontext Schreibtisch.
// Gesendet werden nur geänderte Werte: Intervalle als Korrektur, Volumen, Betriebsart, Box oder Deckel als neue
// Belegung (A1). Das Feld «Wechseln» markiert beim Antippen seinen Inhalt (UC3-AK8: höchstens 5 Berührungen).
import { useState, type MouseEvent } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import { aenderungPruefen, aenderungVorgang, type Aenderung } from '../../domain/anlage/aendern.ts';
import type { Betriebsart } from '../../domain/anlage/anlegen.ts';
import { entfernenPruefen, entfernenVorgang } from '../../domain/anlage/entfernen.ts';
import { INTERVALLE } from '../../domain/anlage/erfassen.ts';
import {
  gefaessAm,
  zeilen,
  type DeckeltypZeile,
  type GefaessmodellZeile,
} from '../../domain/anlage/teile.ts';
import type { Verstoss, Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { DeckelWahl } from './DeckelWahl.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu, oeffnen } from '../router.ts';

const BETRIEBSARTEN: { wert: Betriebsart; text: string }[] = [
  { wert: 'dwc', text: 'DWC' },
  { wert: 'konstantpegel', text: 'Konstantpegel' },
  { wert: 'kratky_belueftet', text: 'Kratky belüftet' },
  { wert: 'kratky', text: 'Kratky' },
];

const markieren = (e: MouseEvent<HTMLInputElement>) => e.currentTarget.select();
const tageZahl = (t: string) => (t.trim() === '' ? null : Math.trunc(Number(t)));
const text = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

export function GefaessAendern({ code, teil }: { code: string; teil?: 'deckel' }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const ort = teile ? ortAufloesen(code, teile) : undefined;
  const g = ort ? gefaessAm(teile, ort.platzId) : undefined;
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [fehler, setFehler] = useState<Verstoss[]>([]);
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  const [entfernenFragen, setEntfernenFragen] = useState(false);
  const [vorgang, setVorgang] = useState<{ schluessel: string; schritte: Vorgang }>();
  const [letzter, setLetzter] = useState<Vorgang>();

  const kopf = (
    <header className="hv-seite-kopf">
      <h1 className="hv-seite-titel">{ort ? `${ort.kennung} ändern` : 'Gefäss ändern'}</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'gefaess', code })}>
        Zum Gefäss
      </a>
    </header>
  );
  if (!ort || !g)
    return (
      <main className="hv-seite">
        {kopf}
        <p>{liest ? 'Daten werden geladen' : `Gefäss ${code} nicht bekannt`}</p>
      </main>
    );
  const platzId = ort.platzId;
  const alt = g;
  const modelle = zeilen<GefaessmodellZeile>(teile, 'gefaessmodell').filter((m) => m.storniert_am === null);
  const deckel = zeilen<DeckeltypZeile>(teile, 'deckeltyp').filter((d) => d.storniert_am === null);
  const wert = (feld: string, vorher: string) => werte[feld] ?? vorher;
  const setzen = (feld: string, w: string) => {
    setWerte((x) => ({ ...x, [feld]: w }));
    setErgebnis(undefined);
  };

  /** nur geänderte Werte */
  function aenderung(): Aenderung {
    const a: Aenderung = {};
    const geaendert = (feld: string, vorher: number | null) =>
      werte[feld] !== undefined && tageZahl(werte[feld] ?? '') !== vorher;
    const intervalle: NonNullable<Aenderung['intervalle']> = {
      ...(geaendert('messen', alt.intervall_messen_d)
        ? { messenD: tageZahl(werte['messen'] ?? '') ?? 0 }
        : {}),
      ...(geaendert('nachfuellen', alt.intervall_nachfuellen_d ?? null)
        ? { nachfuellenD: tageZahl(werte['nachfuellen'] ?? '') }
        : {}),
      ...(geaendert('wechseln', alt.intervall_wechseln_d)
        ? { wechselnD: tageZahl(werte['wechseln'] ?? '') }
        : {}),
    };
    if (Object.keys(intervalle).length > 0) a.intervalle = intervalle;
    // Volumen auf Hundertstel wie die Spalte numeric(5,2) (Prüfer Runde 1, Befund 5)
    const volumen = Math.round(Number(String(werte['volumen'] ?? '').replace(',', '.')) * 100) / 100;
    if (werte['volumen'] !== undefined && volumen !== Number(alt.betriebsvolumen_l))
      a.betriebsvolumenL = volumen;
    if (werte['betriebsart'] !== undefined && werte['betriebsart'] !== alt.betriebsart) {
      a.betriebsart = werte['betriebsart'] as Betriebsart;
      // feste Dosis gibt es nur bei Konstantpegel (Befund 4)
      if (a.betriebsart !== 'konstantpegel' && alt.feste_dosis) a.festeDosis = false;
    }
    const pumpe = werte['luftpumpe'];
    if (pumpe !== undefined && (pumpe === '' ? null : pumpe) !== (alt.luftpumpe ?? null))
      a.luftpumpe = pumpe === '' ? null : (pumpe as 'P1' | 'P2' | 'P3' | 'P4');
    if (werte['modell'] !== undefined && werte['modell'] !== alt.gefaessmodell_id)
      a.gefaessmodellId = werte['modell'];
    if (werte['deckel'] !== undefined && werte['deckel'] !== alt.deckeltyp_id)
      a.deckeltypId = werte['deckel'];
    return a;
  }

  /** derselbe Vorgang je Eingabe: eine Wiederholung sendet dieselben Client-UUIDs (Konzept 11.4; Befund 3) */
  function gebunden(schluessel: string, bauen: () => Vorgang): Vorgang {
    if (vorgang && vorgang.schluessel === schluessel) return vorgang.schritte;
    const schritte = bauen();
    setVorgang({ schluessel, schritte });
    return schritte;
  }

  async function senden(vorgang: Vorgang) {
    setLetzter(vorgang);
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status === 'gespeichert') oeffnen({ name: 'gefaess', code });
  }

  function speichern() {
    const a = aenderung();
    if (Object.keys(a).length === 0) {
      oeffnen({ name: 'gefaess', code });
      return;
    }
    const f = aenderungPruefen(teile, platzId, a);
    setFehler(f);
    if (f.length > 0) return;
    void senden(
      gebunden(JSON.stringify(a), () => aenderungVorgang(teile, platzId, a, neueClientId, jetzt())),
    );
  }

  const hindernisse = entfernenPruefen(teile, platzId);
  const schreibfehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const fehlerZu = (feld: string) => fehler.find((f) => f.feld === feld)?.grund;
  const art = wert('betriebsart', alt.betriebsart);

  return (
    <main className="hv-seite">
      {kopf}
      <form
        className="hv-formular"
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <div className="hv-anlage-zweispaltig">
          <TextField
            label="Messen alle"
            unit="Tage"
            inputMode="numeric"
            value={wert('messen', text(alt.intervall_messen_d))}
            onClick={markieren}
            error={fehlerZu('intervall_messen_d')}
            onChange={(e) => setzen('messen', e.target.value)}
          />
          <TextField
            label="Nachfüllen alle"
            unit="Tage"
            inputMode="numeric"
            value={wert('nachfuellen', text(alt.intervall_nachfuellen_d))}
            onClick={markieren}
            error={fehlerZu('intervall_nachfuellen_d')}
            onChange={(e) => setzen('nachfuellen', e.target.value)}
          />
          <TextField
            label="Wechseln alle"
            unit="Tage"
            inputMode="numeric"
            value={wert('wechseln', text(alt.intervall_wechseln_d))}
            onClick={markieren}
            onFocus={(e) => e.currentTarget.select()}
            error={fehlerZu('intervall_wechseln_d')}
            onChange={(e) => setzen('wechseln', e.target.value)}
          />
          <TextField
            label="Betriebsvolumen"
            unit="l"
            inputMode="decimal"
            value={wert('volumen', text(Number(alt.betriebsvolumen_l)))}
            onClick={markieren}
            error={fehlerZu('betriebsvolumen')}
            onChange={(e) => setzen('volumen', e.target.value)}
          />
        </div>
        <Button type="submit" block disabled={sendet}>
          Speichern
        </Button>
        <fieldset className="hv-anlage-feldgruppe">
          <legend>Betriebsart</legend>
          {BETRIEBSARTEN.map((b) => (
            <label key={b.wert} className="hv-anlage-wahlfeld">
              <input
                type="radio"
                name="betriebsart"
                checked={art === b.wert}
                onChange={() => {
                  // Intervalle der neuen Betriebsart vorschlagen (Plan 21 «Ändern», Befund 1)
                  const iv = INTERVALLE[b.wert];
                  setWerte((x) => {
                    // zurück zur bisherigen Betriebsart: die eigenen Intervalle der Zeile (Prüfer Runde 2, Befund 1)
                    if (b.wert === alt.betriebsart) {
                      const rest = Object.fromEntries(
                        Object.entries(x).filter(([k]) => !['messen', 'nachfuellen', 'wechseln'].includes(k)),
                      );
                      return { ...rest, betriebsart: b.wert };
                    }
                    return {
                      ...x,
                      betriebsart: b.wert,
                      messen: String(iv.messenD),
                      nachfuellen: iv.nachfuellenD === null ? '' : String(iv.nachfuellenD),
                      wechseln: iv.wechselnD === null ? '' : String(iv.wechselnD),
                    };
                  });
                  setErgebnis(undefined);
                }}
              />
              {b.text}
            </label>
          ))}
        </fieldset>
        <fieldset className="hv-anlage-feldgruppe">
          <legend>Luftpumpe</legend>
          {['', 'P1', 'P2', 'P3', 'P4'].map((p) => (
            <label key={p || 'keine'} className="hv-anlage-wahlfeld">
              <input
                type="radio"
                name="luftpumpe"
                checked={wert('luftpumpe', alt.luftpumpe ?? '') === p}
                onChange={() => setzen('luftpumpe', p)}
              />
              {p || 'keine'}
            </label>
          ))}
        </fieldset>
        <fieldset className="hv-anlage-feldgruppe">
          <legend>Box</legend>
          {modelle.map((m) => (
            <label key={m.id} className="hv-anlage-wahlfeld">
              <input
                type="radio"
                name="box"
                checked={wert('modell', alt.gefaessmodell_id) === m.id}
                onChange={() => setzen('modell', m.id)}
              />
              {m.name}
            </label>
          ))}
        </fieldset>
        <DeckelWahl
          deckel={deckel}
          box={modelle.find((m) => m.id === wert('modell', alt.gefaessmodell_id))}
          kennung={ort.kennung}
          wert={wert('deckel', alt.deckeltyp_id ?? '')}
          setzen={(id) => setzen('deckel', id)}
          kopf={{
            id: 'deckel',
            ref: (el) => {
              if (el && teil === 'deckel') el.scrollIntoView();
            },
          }}
          nachher={fehlerZu('deckel') ? <Notice tone="danger" title={fehlerZu('deckel') ?? ''} /> : null}
        />
      </form>
      {schreibfehler ? (
        <Notice
          tone="danger"
          action={
            schreibfehler.wiederholbar && letzter ? (
              <Button
                variant="secondary"
                size="compact"
                disabled={sendet}
                onClick={() => void senden(letzter)}
              >
                Erneut senden
              </Button>
            ) : undefined
          }
        >
          {schreibfehler.text}
        </Notice>
      ) : ergebnis?.status === 'abweichend' ? (
        <Notice tone="warn" title="Schon gespeichert mit anderen Werten" />
      ) : null}
      <section className="hv-formular" aria-label="Entfernen">
        {hindernisse.length > 0 ? (
          <Notice tone="warn" title="Entfernen gesperrt: zuerst umsetzen oder beenden">
            {hindernisse
              .map((h) => `${h.sorte} (${h.art === 'reservierung' ? 'reserviert' : 'im Gefäss'})`)
              .join(', ')}
          </Notice>
        ) : entfernenFragen ? (
          <div className="hv-messen-speichern">
            <Button variant="secondary" onClick={() => setEntfernenFragen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="danger"
              disabled={sendet}
              onClick={() =>
                void senden(gebunden('entfernen', () => entfernenVorgang(platzId, neueClientId(), jetzt())))
              }
            >
              Entfernen bestätigen
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setEntfernenFragen(true)}>
            Gefäss entfernen
          </Button>
        )}
      </section>
    </main>
  );
}
