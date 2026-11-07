// Vorlagen für Box, Deckel und Platte (UC2; Kontext Schreibtisch, Systemtastatur erlaubt; Plan 19).
// Erfassen, Korrigieren (Storno plus neue Zeile) und Löschen (Storno) über schreiben(); genutzte Vorlagen sind
// nicht löschbar. Die Deckelgrafik erscheint sofort beim Tippen von «Löcher je Reihe».
import { useRef, useState, type ReactNode } from 'react';
import { buendelNeuLaden, neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import type { Verstoss, Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { erfassungBinden, type Erfassungsbindung } from '../../domain/messung/erfassung.ts';
import {
  korrekturVorgang,
  loeschVorgang,
  nutzendePlaetze,
  vorlagenAusTeilen,
  type DeckeltypZeile,
  type GefaessmodellZeile,
  type Vorlagenart,
} from '../../domain/vorlagen/bestand.ts';
import {
  deckelVorschlagEingabe,
  deckelVorschlagText,
  offeneDeckelVorschlaege,
  type DeckelVorschlag,
} from '../../domain/vorlagen/deckel-vorschlaege.ts';
import {
  deckeltypPruefen,
  deckeltypSchritt,
  type DeckeltypEingabe,
} from '../../domain/vorlagen/deckeltyp.ts';
import {
  betriebsvolumenVorschlag,
  gefaessmodellPruefen,
  gefaessmodellSchritt,
  mmLesen,
  type Form,
  type GefaessmodellEingabe,
} from '../../domain/vorlagen/gefaessmodell.ts';
import { lochbildText, lochzahl, loecherJeReiheLesen } from '../../domain/vorlagen/lochbild.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt as jetztZeit } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';
import '../vorlagen.css';

type Offen =
  | { art: 'deckel'; ersetzt?: DeckeltypZeile; vorschlag?: DeckelVorschlag }
  | { art: 'box'; ersetzt?: GefaessmodellZeile }
  | undefined;

const liter = (l: number) => `${String(l)} l`;

function fehlerZu(verstoesse: readonly Verstoss[], feld: string): string | undefined {
  const texte = verstoesse.filter((v) => v.feld === feld).map((v) => v.grund);
  return texte.length > 0 ? texte.join('; ') : undefined;
}

function Fehlertext({ text }: { text: string | undefined }) {
  return text ? <p className="hv-field-msg hv-field-msg-error">{text}</p> : null;
}

/**
 * Senden mit gebundener Client-UUID: dieselbe Eingabe sendet bei der Wiederholung dieselbe UUID (TO2), jede
 * Änderung bekommt eine neue
 */
function useSenden() {
  const bindung = useRef<Erfassungsbindung | undefined>(undefined);
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  return {
    ergebnis,
    sendet,
    /** client_id der letzten Sendung derselben Eingabe (zählt bei der Wiederholung nicht als doppelter Name) */
    eigene: (schluessel: string) =>
      bindung.current?.schluessel === schluessel ? bindung.current.clientId : undefined,
    async senden(schluessel: string, bauen: (clientId: string) => Vorgang): Promise<boolean> {
      const jetzt = jetztZeit();
      bindung.current = erfassungBinden(bindung.current, schluessel, neueClientId, jetzt);
      setSendet(true);
      const antwort = await schreiben(bauen(bindung.current.clientId), { jetzt, zeitzone: ZEITZONE });
      setSendet(false);
      setErgebnis(antwort);
      // ein Teil des Vorgangs (z. B. das Storno einer Korrektur) ist schon geschrieben: Liste neu laden (Prüferbefund 1)
      if (antwort.status === 'nicht_gespeichert' && antwort.bestaetigt > 0) buendelNeuLaden();
      return antwort.status === 'gespeichert';
    },
  };
}

function Schreibmeldung({ ergebnis }: { ergebnis: Schreibergebnis | undefined }) {
  if (ergebnis?.status === 'nicht_gespeichert')
    return (
      <Notice kompakt tone="danger">
        {ergebnis.fehler.text}
      </Notice>
    );
  if (ergebnis?.status === 'abweichend')
    return (
      <Notice kompakt tone="warn">
        Schon mit anderen Werten gespeichert; lade die Seite neu und prüfe die Liste
      </Notice>
    );
  return null;
}

function Wahl<T extends string | number>({
  legende,
  name,
  werte,
  wert,
  setzen,
  fehler,
}: {
  legende: string;
  name: string;
  werte: readonly { wert: T; text: string }[];
  wert: T | null;
  setzen: (w: T) => void;
  fehler?: string | undefined;
}) {
  return (
    <fieldset className="hv-vorlagen-gruppe">
      <legend>{legende}</legend>
      <div className="hv-vorlagen-wahl">
        {werte.map((w) => (
          <label key={String(w.wert)} className="hv-vorlagen-wahlfeld">
            <input type="radio" name={name} checked={wert === w.wert} onChange={() => setzen(w.wert)} />
            {w.text}
          </label>
        ))}
      </div>
      <Fehlertext text={fehler} />
    </fieldset>
  );
}

function Formularknoepfe({ sendet, abbrechen }: { sendet: boolean; abbrechen: () => void }) {
  return (
    <div className="hv-vorlagen-aktionen">
      <Button type="submit" disabled={sendet}>
        Speichern
      </Button>
      <Button variant="ghost" onClick={abbrechen}>
        Abbrechen
      </Button>
    </div>
  );
}

function DeckelFormular({
  bestand,
  ersetzt,
  vorschlag,
  fertig,
  abbrechen,
}: {
  bestand: readonly DeckeltypZeile[];
  ersetzt?: DeckeltypZeile | undefined;
  /** Vorschlag aus dem Konzept 5.4 (#125): füllt das Formular, gespeichert wird erst mit «Speichern» */
  vorschlag?: DeckelVorschlag | undefined;
  fertig: (text: string) => void;
  abbrechen: () => void;
}) {
  const [e, setE] = useState<DeckeltypEingabe>(() =>
    ersetzt
      ? {
          name: ersetzt.name,
          topfdurchmesserCm: ersetzt.topfdurchmesser_mm === 80 ? 8 : 5,
          loecherJeReihe: lochbildText(ersetzt.loecher_je_reihe),
          serviceOeffnung: ersetzt.service_oeffnung,
        }
      : vorschlag
        ? deckelVorschlagEingabe(vorschlag)
        : { name: '', topfdurchmesserCm: null, loecherJeReihe: '', serviceOeffnung: true },
  );
  const [verstoesse, setVerstoesse] = useState<Verstoss[]>([]);
  const { ergebnis, sendet, senden, eigene } = useSenden();
  const aendern = (teil: Partial<DeckeltypEingabe>) => setE((alt) => ({ ...alt, ...teil }));
  const gelesen = loecherJeReiheLesen(e.loecherJeReihe);

  async function speichern() {
    const schluessel = JSON.stringify(e);
    const frei = bestand.filter(
      (d) => d.client_id !== eigene(schluessel) && d.client_id !== (ersetzt?.client_id ?? null),
    );
    const v = deckeltypPruefen(e, frei);
    setVerstoesse(v);
    if (v.length > 0) return;
    const ok = await senden(schluessel, (clientId) => {
      const schritt = deckeltypSchritt(e, clientId);
      return ersetzt?.client_id ? korrekturVorgang('deckeltyp', ersetzt.client_id, schritt) : [schritt];
    });
    if (ok) fertig(`Deckel «${e.name.trim()}» gespeichert`);
  }

  return (
    <form
      className="hv-formular"
      aria-label={ersetzt ? 'Deckel korrigieren' : 'Deckel erfassen'}
      onSubmit={(ev) => {
        ev.preventDefault();
        void speichern();
      }}
    >
      {vorschlag ? (
        <Notice kompakt tone={vorschlag.reihenAngenommen ? 'warn' : 'info'}>
          {vorschlag.reihenAngenommen
            ? `Vorschlag ${vorschlag.name} für ${vorschlag.fuer.join(', ')}: Das Konzept nennt nur ${String(
                lochzahl(vorschlag.reihen),
              )} Löcher. Vergleiche die Reihen mit deinem Deckel, dann speichern.`
            : `Vorschlag ${vorschlag.name} für ${vorschlag.fuer.join(', ')} aus dem Konzept. Vergleiche mit deinem Deckel, dann speichern.`}
        </Notice>
      ) : null}
      <TextField
        label="Name"
        value={e.name}
        hint="Name aus dem 3D-Modell, z. B. D1 für 1.1 und 1.2"
        error={fehlerZu(verstoesse, 'name')}
        onChange={(ev) => aendern({ name: ev.target.value })}
      />
      <Wahl
        legende="Topfgrösse"
        name="topf"
        werte={[
          { wert: 5, text: '5 cm' },
          { wert: 8, text: '8 cm' },
        ]}
        wert={e.topfdurchmesserCm}
        setzen={(w) => aendern({ topfdurchmesserCm: w })}
        fehler={fehlerZu(verstoesse, 'topfdurchmesser_mm')}
      />
      <TextField
        label="Löcher je Reihe"
        value={e.loecherJeReihe}
        hint="von vorne nach hinten, z. B. 2, 2, 2"
        autoComplete="off"
        error={fehlerZu(verstoesse, 'loecher_je_reihe')}
        onChange={(ev) => aendern({ loecherJeReihe: ev.target.value })}
      />
      {gelesen.ok ? (
        <div className="hv-vorlagen-grafik">
          <Deckel reihen={gelesen.reihen} loecher={[]} kanten serviceOeffnung={e.serviceOeffnung} />
          <p className="hv-vorlagen-angabe hv-num">
            {lochzahl(gelesen.reihen)} Löcher in {gelesen.reihen.length}{' '}
            {gelesen.reihen.length === 1 ? 'Reihe' : 'Reihen'}, Loch 1 vorne links
          </p>
        </div>
      ) : null}
      <Wahl
        legende="Service-Öffnung"
        name="service"
        werte={[
          { wert: 'ja', text: 'ja' },
          { wert: 'nein', text: 'nein' },
        ]}
        wert={e.serviceOeffnung ? 'ja' : 'nein'}
        setzen={(w) => aendern({ serviceOeffnung: w === 'ja' })}
      />
      <Schreibmeldung ergebnis={ergebnis} />
      <Formularknoepfe sendet={sendet} abbrechen={abbrechen} />
    </form>
  );
}

const LEERE_BOX: GefaessmodellEingabe = {
  name: '',
  form: 'rechteckig',
  laengeMm: '',
  breiteMm: '',
  hoeheMm: '',
  nennvolumenL: '',
  betriebsvolumenL: '',
  fuellhoeheMm: '',
};

function Vorschlag({ e, uebernehmen }: { e: GefaessmodellEingabe; uebernehmen: (l: number) => void }) {
  if (e.form === 'oval')
    return (
      <p className="hv-vorlagen-angabe">
        Ovale Wanne: ohne Vorschlag, trag das Betriebsvolumen selbst ein (z. B. rund 2.3 l bei 7 cm Füllhöhe)
      </p>
    );
  const l = mmLesen(e.laengeMm);
  const b = mmLesen(e.breiteMm);
  const h = mmLesen(e.hoeheMm);
  if (l === null || b === null || h === null) return null;
  const v = betriebsvolumenVorschlag(e.form, l, b, mmLesen(e.fuellhoeheMm), h);
  // sehr kleine Masse ergeben 0.0 l: kein Vorschlag (Prüferbefund 4)
  if ('liter' in v && v.liter > 0)
    return (
      <div className="hv-vorlagen-vorschlag">
        <p className="hv-vorlagen-angabe hv-num">
          Vorschlag aus Länge × Breite × Füllhöhe: {v.liter.toFixed(1)} l
        </p>
        <Button variant="secondary" size="compact" onClick={() => uebernehmen(v.liter)}>
          Vorschlag übernehmen
        </Button>
      </div>
    );
  if ('grund' in v && v.grund === 'fuellhoehe_zu_gross')
    return <p className="hv-vorlagen-angabe">Die Füllhöhe muss unter der Höhe liegen</p>;
  return null;
}

function BoxFormular({
  bestand,
  ersetzt,
  fertig,
  abbrechen,
}: {
  bestand: readonly GefaessmodellZeile[];
  ersetzt?: GefaessmodellZeile | undefined;
  fertig: (text: string) => void;
  abbrechen: () => void;
}) {
  const [e, setE] = useState<GefaessmodellEingabe>(() =>
    ersetzt
      ? {
          ...LEERE_BOX,
          name: ersetzt.name,
          form: ersetzt.form,
          laengeMm: String(ersetzt.innen_l_mm),
          breiteMm: String(ersetzt.innen_b_mm),
          hoeheMm: String(ersetzt.innen_h_mm),
          nennvolumenL: ersetzt.nennvolumen_l === null ? '' : String(ersetzt.nennvolumen_l),
          betriebsvolumenL: String(ersetzt.betriebsvolumen_l),
        }
      : LEERE_BOX,
  );
  const [verstoesse, setVerstoesse] = useState<Verstoss[]>([]);
  const { ergebnis, sendet, senden, eigene } = useSenden();
  const aendern = (teil: Partial<GefaessmodellEingabe>) => setE((alt) => ({ ...alt, ...teil }));

  async function speichern() {
    // die Füllhöhe wird nicht gespeichert und gehört nicht zum Schlüssel der Client-UUID
    const schluessel = JSON.stringify({ ...e, fuellhoeheMm: '' });
    const frei = bestand.filter(
      (m) => m.client_id !== eigene(schluessel) && m.client_id !== (ersetzt?.client_id ?? null),
    );
    const v = gefaessmodellPruefen(e, frei);
    setVerstoesse(v);
    if (v.length > 0) return;
    const ok = await senden(schluessel, (clientId) => {
      const schritt = gefaessmodellSchritt(e, clientId);
      return ersetzt?.client_id ? korrekturVorgang('gefaessmodell', ersetzt.client_id, schritt) : [schritt];
    });
    if (ok) fertig(`Box «${e.name.trim()}» gespeichert`);
  }

  const zahlfeld = (
    label: string,
    schluessel: 'laengeMm' | 'breiteMm' | 'hoeheMm' | 'fuellhoeheMm',
    feld: string,
  ) => (
    <TextField
      label={label}
      inputMode="numeric"
      value={e[schluessel]}
      error={fehlerZu(verstoesse, feld)}
      onChange={(ev) => aendern({ [schluessel]: ev.target.value })}
    />
  );

  return (
    <form
      className="hv-formular"
      aria-label={ersetzt ? 'Box korrigieren' : 'Box erfassen'}
      onSubmit={(ev) => {
        ev.preventDefault();
        void speichern();
      }}
    >
      <TextField
        label="Name"
        value={e.name}
        hint="z. B. Rako 40 × 30 × 17 oder Leni Flori 36"
        error={fehlerZu(verstoesse, 'name')}
        onChange={(ev) => aendern({ name: ev.target.value })}
      />
      <Wahl<Form>
        legende="Form"
        name="form"
        werte={[
          { wert: 'rechteckig', text: 'rechteckig' },
          { wert: 'oval', text: 'oval' },
        ]}
        wert={e.form}
        setzen={(w) => aendern({ form: w })}
        fehler={fehlerZu(verstoesse, 'form')}
      />
      <p className="hv-vorlagen-angabe">Innenmasse in mm</p>
      <div className="hv-vorlagen-dreispaltig">
        {zahlfeld('Länge', 'laengeMm', 'innen_l_mm')}
        {zahlfeld('Breite', 'breiteMm', 'innen_b_mm')}
        {zahlfeld('Höhe', 'hoeheMm', 'innen_h_mm')}
      </div>
      {e.form === 'rechteckig' ? (
        <TextField
          label="Füllhöhe"
          unit="mm"
          inputMode="numeric"
          hint="nur für den Vorschlag, wird nicht gespeichert"
          value={e.fuellhoeheMm}
          onChange={(ev) => aendern({ fuellhoeheMm: ev.target.value })}
        />
      ) : null}
      <Vorschlag e={e} uebernehmen={(l) => aendern({ betriebsvolumenL: l.toFixed(1) })} />
      <TextField
        label="Betriebsvolumen"
        unit="l"
        inputMode="decimal"
        hint="Lösung im Betrieb"
        value={e.betriebsvolumenL}
        error={fehlerZu(verstoesse, 'betriebsvolumen_l')}
        onChange={(ev) => aendern({ betriebsvolumenL: ev.target.value })}
      />
      <TextField
        label="Nennvolumen"
        unit="l"
        inputMode="decimal"
        hint="optional, laut Hersteller"
        value={e.nennvolumenL}
        error={fehlerZu(verstoesse, 'nennvolumen_l')}
        onChange={(ev) => aendern({ nennvolumenL: ev.target.value })}
      />
      <Schreibmeldung ergebnis={ergebnis} />
      <Formularknoepfe sendet={sendet} abbrechen={abbrechen} />
    </form>
  );
}

function Eintrag({
  name,
  angabe,
  genutzt,
  korrigierbar,
  korrigieren,
  loeschen,
}: {
  name: string;
  angabe: ReactNode;
  genutzt: string[];
  /** ohne client_id ist weder Storno noch Korrektur möglich */
  korrigierbar: boolean;
  korrigieren: () => void;
  loeschen: () => Promise<boolean>;
}) {
  const [fragt, setFragt] = useState(false);
  return (
    <li className="hv-vorlagen-eintrag">
      <p className="hv-vorlagen-name">{name}</p>
      <p className="hv-vorlagen-angabe hv-num">{angabe}</p>
      {genutzt.length > 0 ? (
        <p className="hv-vorlagen-genutzt">Wird genutzt von {genutzt.join(', ')}, nicht löschbar</p>
      ) : korrigierbar ? (
        <div className="hv-vorlagen-aktionen">
          {fragt ? (
            <>
              <Button
                variant="danger"
                size="compact"
                onClick={() => void loeschen().then((ok) => !ok && setFragt(false))}
              >
                Löschen bestätigen
              </Button>
              <Button variant="ghost" size="compact" onClick={() => setFragt(false)}>
                Abbrechen
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="compact" onClick={korrigieren}>
                Korrigieren
              </Button>
              <Button variant="ghost" size="compact" onClick={() => setFragt(true)}>
                Löschen
              </Button>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function Vorlagen() {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const { modelle, deckel } = vorlagenAusTeilen(teile);
  const vorschlaege = offeneDeckelVorschlaege(deckel);
  const [offen, setOffen] = useState<Offen>();
  const [meldung, setMeldung] = useState<string>();
  const [loeschfehler, setLoeschfehler] = useState<Schreibergebnis>();

  const fertig = (text: string) => {
    setOffen(undefined);
    setMeldung(text);
  };
  const oeffnen = (neu: Offen) => {
    setOffen(neu);
    setMeldung(undefined);
    setLoeschfehler(undefined);
  };

  async function loeschen(art: Vorlagenart, clientId: string, name: string): Promise<boolean> {
    const antwort = await schreiben(loeschVorgang(art, clientId), {
      jetzt: jetztZeit(),
      zeitzone: ZEITZONE,
    });
    if (antwort.status === 'gespeichert') {
      setLoeschfehler(undefined);
      setMeldung(`${art === 'deckeltyp' ? 'Deckel' : 'Box'} «${name}» gelöscht`);
      return true;
    }
    setLoeschfehler(antwort);
    return false;
  }

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Vorlagen</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      <p>Boxen, Deckel und Platten, aus denen die Gefässe bestehen. Gefässe wählen sie im Assistenten aus.</p>
      {meldung ? (
        <Notice kompakt tone="ok">
          {meldung}
        </Notice>
      ) : null}
      <Schreibmeldung ergebnis={loeschfehler} />

      <Card title="Deckel und Platten" meta={`${deckel.length}`}>
        {deckel.length === 0 ? <p className="hv-vorlagen-leer">Noch kein Deckel erfasst</p> : null}
        {deckel.length > 0 ? (
          <ul className="hv-vorlagen-liste">
            {deckel.map((d) => (
              <Eintrag
                key={d.id}
                name={d.name}
                angabe={`${lochbildText(d.loecher_je_reihe)} · ${lochzahl(d.loecher_je_reihe)} Löcher · ${
                  d.topfdurchmesser_mm / 10
                } cm${d.service_oeffnung ? ' · Service-Öffnung' : ''}`}
                genutzt={nutzendePlaetze(teile, 'deckeltyp', d.id)}
                korrigierbar={d.client_id !== null}
                korrigieren={() => oeffnen({ art: 'deckel', ersetzt: d })}
                loeschen={() => loeschen('deckeltyp', d.client_id ?? '', d.name)}
              />
            ))}
          </ul>
        ) : null}
        {offen?.art === 'deckel' ? (
          <DeckelFormular
            key={offen.ersetzt?.id ?? offen.vorschlag?.name ?? 'neu'}
            bestand={deckel}
            ersetzt={offen.ersetzt}
            vorschlag={offen.vorschlag}
            fertig={fertig}
            abbrechen={() => setOffen(undefined)}
          />
        ) : offen === undefined ? (
          <>
            {vorschlaege.length > 0 ? (
              <section className="hv-vorlagen-vorschlaege" aria-label="Vorschläge aus dem Konzept">
                <h3 className="hv-vorlagen-untertitel">Vorschläge aus dem Konzept (3D-Modell V12.10)</h3>
                <ul className="hv-vorlagen-liste">
                  {vorschlaege.map((v) => (
                    <li key={v.name} className="hv-vorlagen-eintrag">
                      <p className="hv-vorlagen-name">{v.name}</p>
                      <p className="hv-vorlagen-angabe hv-num">{deckelVorschlagText(v)}</p>
                      <div className="hv-vorlagen-aktionen">
                        <Button
                          variant="secondary"
                          size="compact"
                          aria-label={`${v.name} übernehmen`}
                          onClick={() => oeffnen({ art: 'deckel', vorschlag: v })}
                        >
                          Übernehmen
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <Button variant="secondary" block onClick={() => oeffnen({ art: 'deckel' })}>
              Deckel erfassen
            </Button>
          </>
        ) : null}
      </Card>

      <Card title="Boxen" meta={`${modelle.length}`}>
        {modelle.length === 0 ? <p className="hv-vorlagen-leer">Noch keine Box erfasst</p> : null}
        {modelle.length > 0 ? (
          <ul className="hv-vorlagen-liste">
            {modelle.map((m) => (
              <Eintrag
                key={m.id}
                name={m.name}
                angabe={`${m.form} · ${m.innen_l_mm} × ${m.innen_b_mm} × ${m.innen_h_mm} mm · ${liter(
                  m.betriebsvolumen_l,
                )}`}
                genutzt={nutzendePlaetze(teile, 'gefaessmodell', m.id)}
                korrigierbar={m.client_id !== null}
                korrigieren={() => oeffnen({ art: 'box', ersetzt: m })}
                loeschen={() => loeschen('gefaessmodell', m.client_id ?? '', m.name)}
              />
            ))}
          </ul>
        ) : null}
        {offen?.art === 'box' ? (
          <BoxFormular
            key={offen.ersetzt?.id ?? 'neu'}
            bestand={modelle}
            ersetzt={offen.ersetzt}
            fertig={fertig}
            abbrechen={() => setOffen(undefined)}
          />
        ) : offen === undefined ? (
          <Button variant="secondary" block onClick={() => oeffnen({ art: 'box' })}>
            Box erfassen
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
