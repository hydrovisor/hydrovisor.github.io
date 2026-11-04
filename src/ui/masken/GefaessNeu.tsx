// Assistent «Gefäss erfassen» (UC3, 05_masken.md 4; Plan 21): Kontext Schreibtisch, höchstens vier Schritte
// (Platz, Box, Deckel, Zusammenfassung). Speichern ist ein Vorgang über schreiben(); eine Wiederholung sendet
// dieselben Client-UUIDs (Konzept 11.4, TO2).
import { useState } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import type { Betriebsart } from '../../domain/anlage/anlegen.ts';
import {
  erfassenPruefen,
  erfassenVorgang,
  erfassenVorschlag,
  INTERVALLE,
  positionen,
  toepfe,
  type ErfassenEingabe,
  type Intervalle,
  type Rolle,
} from '../../domain/anlage/erfassen.ts';
import {
  anlagenAus,
  bereicheAus,
  zeilen,
  type DeckeltypZeile,
  type GefaessmodellZeile,
} from '../../domain/anlage/teile.ts';
import type { Verstoss, Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
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
const ROLLEN: { wert: Rolle; text: string }[] = [
  { wert: 'gefaess', text: 'Gefäss' },
  { wert: 'anzuchtort', text: 'Anzuchtbox' },
  { wert: 'messstelle', text: 'Messstelle W' },
];
const PUMPEN = ['P1', 'P2', 'P3', 'P4'] as const;
type Pumpe = (typeof PUMPEN)[number] | null;

/** Wahlgruppe als fieldset mit legend (TextField.md «Auswahl und Wahlgruppe») */
function Wahl<T extends string | number | null>({
  titel,
  name,
  werte,
  wert,
  setzen,
  gesperrt,
}: {
  titel: string;
  name: string;
  werte: { wert: T; text: string }[];
  wert: T | undefined;
  setzen: (w: T) => void;
  gesperrt?: (w: T) => boolean;
}) {
  return (
    <fieldset className="hv-anlage-feldgruppe hv-wahl">
      <legend>{titel}</legend>
      {werte.map((w) => (
        <label key={String(w.wert)} className="hv-anlage-wahlfeld">
          <input
            type="radio"
            name={name}
            checked={wert === w.wert}
            disabled={gesperrt?.(w.wert) ?? false}
            onChange={() => setzen(w.wert)}
          />
          {w.text}
        </label>
      ))}
    </fieldset>
  );
}

const zahl = (t: string) => (t.trim() === '' ? NaN : Number(t.replace(',', '.')));
const intervallText = (n: number | null) => (n === null ? '' : String(n));
const intervallZahl = (t: string) => (t.trim() === '' ? null : Math.trunc(zahl(t)));

export function GefaessNeu({ kuerzel, rolle: startRolle }: { kuerzel?: string; rolle?: Rolle }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const anlagen = anlagenAus(teile);
  const anlage =
    anlagen.find((a) => a.kuerzel === kuerzel) ??
    (anlagen.filter((a) => a.datenart === 'echt').length === 1
      ? anlagen.find((a) => a.datenart === 'echt')
      : anlagen[0]);
  const bereiche = anlage ? bereicheAus(teile, anlage.id).sort((a, b) => a.nummer - b.nummer) : [];
  const modelle = zeilen<GefaessmodellZeile>(teile, 'gefaessmodell').filter((m) => m.storniert_am === null);
  const deckel = zeilen<DeckeltypZeile>(teile, 'deckeltyp').filter((d) => d.storniert_am === null);

  const [schritt, setSchritt] = useState(1);
  const [rolle, setRolle] = useState<Rolle>(startRolle ?? 'gefaess');
  const [bereichId, setBereichId] = useState<string>();
  const [position, setPosition] = useState<number>();
  const [betriebsart, setBetriebsart] = useState<Betriebsart>();
  const [festeDosis, setFesteDosis] = useState(false);
  const [luftpumpe, setLuftpumpe] = useState<Pumpe>(null);
  const [modellId, setModellId] = useState<string>();
  const [volumen, setVolumen] = useState<string>();
  const [deckelId, setDeckelId] = useState<string>();
  const [intervalle, setIntervalle] = useState<Intervalle>();
  const [fehler, setFehler] = useState<Verstoss[]>([]);
  const [vorgang, setVorgang] = useState<{ schluessel: string; schritte: Vorgang }>();
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);

  const vorschlag = anlage
    ? erfassenVorschlag(teile, anlage.id, {
        rolle,
        ...(bereichId ? { bereichId } : {}),
        ...(position !== undefined ? { position } : {}),
        ...(betriebsart ? { betriebsart } : {}),
        ...(modellId ? { gefaessmodellId: modellId } : {}),
        ...(deckelId ? { deckeltypId: deckelId } : {}),
        festeDosis,
      })
    : undefined;
  const art = betriebsart ?? vorschlag?.betriebsart ?? 'dwc';
  const pos = position ?? (typeof vorschlag?.position === 'number' ? vorschlag.position : undefined);
  const iv = intervalle ?? vorschlag?.intervalle ?? INTERVALLE[art];
  const volumenText =
    volumen ?? (vorschlag?.betriebsvolumenL !== undefined ? String(vorschlag.betriebsvolumenL) : '');
  const bereich = bereiche.find((b) => b.id === bereichId);
  const gewaehlterDeckel = deckel.find((d) => d.id === deckelId);

  function eingabe(): ErfassenEingabe | undefined {
    if (!anlage) return undefined;
    if (rolle === 'messstelle') return { rolle, anlageId: anlage.id };
    if (rolle === 'anzuchtort') {
      if (!vorschlag?.kennung || !vorschlag.typ) return undefined;
      return {
        rolle,
        anlageId: anlage.id,
        bereichId: vorschlag.bereichId ?? null,
        kennung: vorschlag.kennung,
        typ: vorschlag.typ,
        position: vorschlag.position === 'hinten' ? 'hinten' : 'vorne',
        platzzahl: vorschlag.platzzahl ?? 25,
      };
    }
    if (!bereichId || pos === undefined || !modellId || !deckelId) return undefined;
    return {
      rolle,
      anlageId: anlage.id,
      bereichId,
      position: pos,
      betriebsart: art,
      festeDosis: art === 'konstantpegel' && festeDosis,
      luftpumpe,
      gefaessmodellId: modellId,
      betriebsvolumenL: zahl(volumenText),
      deckeltypId: deckelId,
      intervalle: iv,
    };
  }

  const fehlerZu = (feld: string) => fehler.find((f) => f.feld === feld)?.grund;
  const weiterMoeglich =
    schritt === 1
      ? rolle !== 'gefaess' || (bereichId !== undefined && pos !== undefined)
      : schritt === 2
        ? modellId !== undefined
        : schritt === 3
          ? deckelId !== undefined
          : false;

  function weiter() {
    setFehler([]);
    // Anzuchtbox und Messstelle direkt zur Zusammenfassung
    setSchritt(rolle === 'gefaess' ? schritt + 1 : 4);
  }

  async function speichern() {
    const e = eingabe();
    if (!e || !anlage) return;
    const f = erfassenPruefen(teile, e);
    setFehler(f);
    if (f.length > 0) return;
    const schluessel = JSON.stringify(e);
    const aktuell =
      vorgang && vorgang.schluessel === schluessel
        ? vorgang
        : { schluessel, schritte: erfassenVorgang(teile, e, neueClientId, jetzt()) };
    setVorgang(aktuell);
    setSendet(true);
    const antwort = await schreiben(aktuell.schritte, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status === 'gespeichert' && vorschlag?.code)
      oeffnen(
        rolle === 'messstelle'
          ? { name: 'anlage', kuerzel: anlage.kuerzel }
          : { name: 'gefaess', code: vorschlag.code },
      );
  }

  const schreibfehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const topfListe = vorschlag?.toepfe ?? [];

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Gefäss erfassen</h1>
        <a
          className="hv-btn hv-btn-ghost hv-btn-compact"
          href={hashZu({ name: 'anlage', ...(anlage ? { kuerzel: anlage.kuerzel } : {}) })}
        >
          Zur Anlage
        </a>
      </header>
      <p className="hv-anlage-info">Schritt {schritt} von 4</p>
      {!anlage ? (
        <Notice tone="warn" title="Zuerst eine Anlage anlegen" />
      ) : schritt === 1 ? (
        <div className="hv-formular">
          <p>
            Anlage {anlage.kuerzel} · {anlage.name}
          </p>
          <Wahl
            titel="Rolle"
            name="rolle"
            werte={ROLLEN}
            wert={rolle}
            setzen={(w) => {
              setRolle(w);
              setFehler([]);
            }}
          />
          {rolle === 'gefaess' ? (
            <>
              <Wahl
                titel="Bereich"
                name="bereich"
                werte={bereiche.map((b) => ({ wert: b.id, text: b.name }))}
                wert={bereichId}
                setzen={(w) => {
                  setBereichId(w);
                  setPosition(undefined);
                  setBetriebsart(undefined);
                  setIntervalle(undefined);
                }}
              />
              {bereich ? (
                <Wahl
                  titel="Position"
                  name="position"
                  werte={positionen(bereich.nummer).map((p) => ({ wert: p, text: String(p) }))}
                  wert={pos}
                  setzen={setPosition}
                />
              ) : null}
              <Wahl
                titel="Betriebsart"
                name="betriebsart"
                werte={BETRIEBSARTEN}
                wert={art}
                setzen={(w) => {
                  setBetriebsart(w);
                  setIntervalle(undefined);
                }}
              />
              {art === 'konstantpegel' ? (
                <label className="hv-anlage-wahlfeld">
                  <input
                    type="checkbox"
                    checked={festeDosis}
                    onChange={(e) => setFesteDosis(e.target.checked)}
                  />
                  Feste Dosis (Station)
                </label>
              ) : null}
              <Wahl
                titel="Luftpumpe"
                name="luftpumpe"
                werte={[{ wert: null, text: 'keine' }, ...PUMPEN.map((p) => ({ wert: p, text: p }))]}
                wert={luftpumpe}
                setzen={setLuftpumpe}
              />
              {vorschlag?.kennung ? <p>Kennung {vorschlag.kennung}</p> : null}
            </>
          ) : vorschlag?.kennung ? (
            <p>Kennung {vorschlag.kennung}</p>
          ) : (
            <Notice tone="warn" title={vorschlag?.hinweise[0] ?? 'Keine freie Kennung'} />
          )}
        </div>
      ) : schritt === 2 ? (
        <div className="hv-formular">
          {modelle.length === 0 ? (
            <Notice tone="warn" title="Zuerst Vorlagen für Box und Deckel erfassen" />
          ) : (
            <Wahl
              titel="Box"
              name="box"
              werte={modelle.map((m) => ({
                wert: m.id,
                text: `${m.name} · ${Number(m.betriebsvolumen_l)} l`,
              }))}
              wert={modellId}
              setzen={(w) => {
                setModellId(w);
                setVolumen(undefined);
              }}
            />
          )}
          <TextField
            label="Betriebsvolumen"
            unit="l"
            inputMode="decimal"
            value={volumenText}
            error={fehlerZu('betriebsvolumen')}
            onChange={(e) => setVolumen(e.target.value)}
          />
        </div>
      ) : schritt === 3 ? (
        <div className="hv-formular">
          {deckel.length === 0 ? (
            <Notice tone="warn" title="Zuerst Vorlagen für Box und Deckel erfassen" />
          ) : (
            <Wahl
              titel="Deckel oder Platte"
              name="deckel"
              werte={deckel.map((d) => ({ wert: d.id, text: d.name }))}
              wert={deckelId}
              setzen={setDeckelId}
            />
          )}
          {gewaehlterDeckel ? (
            <>
              <p>Töpfe {gewaehlterDeckel.topfdurchmesser_mm / 10} cm, Loch 1 vorne links</p>
              <Deckel
                reihen={[...gewaehlterDeckel.loecher_je_reihe]}
                loecher={toepfe('x', gewaehlterDeckel, false).map((t) => ({
                  nr: t.lochNr,
                  zustand: 'frei' as const,
                }))}
              />
            </>
          ) : null}
        </div>
      ) : (
        <div className="hv-formular">
          <dl className="hv-angaben">
            <dt>Code</dt>
            <dd>{vorschlag?.code ?? '–'}</dd>
            {rolle === 'gefaess' ? (
              <>
                <dt>Box</dt>
                <dd>{modelle.find((m) => m.id === modellId)?.name ?? '–'}</dd>
                <dt>Deckel</dt>
                <dd>{gewaehlterDeckel?.name ?? '–'}</dd>
                <dt>Volumen</dt>
                <dd>{volumenText} l</dd>
                <dt>Töpfe</dt>
                <dd>
                  {topfListe.length === 0
                    ? 'keine eigenen'
                    : `${topfListe[0]?.kennung} bis ${topfListe[topfListe.length - 1]?.kennung}`}
                </dd>
              </>
            ) : null}
          </dl>
          {rolle === 'gefaess' ? (
            <div className="hv-anlage-zweispaltig">
              <TextField
                label="Messen alle"
                unit="Tage"
                inputMode="numeric"
                value={intervallText(iv.messenD)}
                onChange={(e) => setIntervalle({ ...iv, messenD: intervallZahl(e.target.value) ?? 0 })}
              />
              <TextField
                label="Nachfüllen alle"
                unit="Tage"
                inputMode="numeric"
                value={intervallText(iv.nachfuellenD)}
                onChange={(e) => setIntervalle({ ...iv, nachfuellenD: intervallZahl(e.target.value) })}
              />
              <TextField
                label="Wechseln alle"
                unit="Tage"
                inputMode="numeric"
                value={intervallText(iv.wechselnD)}
                onChange={(e) => setIntervalle({ ...iv, wechselnD: intervallZahl(e.target.value) })}
              />
            </div>
          ) : null}
          {vorschlag?.hinweise.map((h) => (
            <Notice key={h} title={h} />
          ))}
          {fehler.map((f) => (
            <Notice key={f.feld + f.grund} tone="danger" title={f.grund} />
          ))}
          <Button block disabled={sendet} onClick={() => void speichern()}>
            Speichern
          </Button>
        </div>
      )}
      {anlage && schritt < 4 ? (
        <div className="hv-messen-speichern">
          {schritt > 1 ? (
            <Button variant="secondary" onClick={() => setSchritt(rolle === 'gefaess' ? schritt - 1 : 1)}>
              Zurück
            </Button>
          ) : null}
          <Button className="hv-messen-speichern-knopf" disabled={!weiterMoeglich} onClick={weiter}>
            Weiter
          </Button>
        </div>
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
