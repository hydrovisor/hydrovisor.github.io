// Einstellungen (Schreibtisch, Plan 32; UC0, UC0-AK3, UC0-AK4; R4.1, R4.4, R5.5): je Abschnitt ein Formular mit
// eigenem «Speichern». Die Telefonnummer kommt nur online aus der Datenbank, nie ins Bündel (Ü3, Annahme 12).
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  einstellungSchreiben,
  neueClientId,
  schreiben,
  type Einstellungsergebnis,
  type Einstellungstabelle,
} from '../../daten/schreiben.ts';
import type { Schreibfehler } from '../../domain/datenpfad/fehler.ts';
import {
  kannenBeispiel,
  kannePruefen,
  kAus,
  kHerkunftAus,
  kSatzPruefen,
  kVorgang,
  kWirksam,
  KOMPONENTEN,
  messgeraetPruefen,
  messmittelPruefen,
  pflegebudgetPruefen,
  pushZeitPruefen,
  ruheVorgang,
  vorlaufPruefen,
  type Komponente,
  type KPruefung,
} from '../../domain/einstellungen/einstellungen.ts';
import { messbareOrte } from '../../domain/ort.ts';
import { zustandAus } from '../../domain/teile.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { Zeitwahl } from '../bausteine/Zeitwahl.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../einstellungen.css';

/** Anleitung «Gerät neu» im Repository (Konzept 11.7) */
const GERAET_NEU =
  'https://github.com/hydrovisor/hydrovisor.github.io/blob/main/docs/anleitung/geraet-neu.md';

const KOMPONENTE_NAME: Record<Komponente, string> = {
  grow: 'Grow',
  micro_hard_water: 'Micro',
  bloom: 'Bloom',
};

const uhrJetzt = () => new Date(Date.now());

type Zeile = Record<string, unknown>;
type Rueckmeldung = { ok: true; text: string } | { ok: false; text: string } | undefined;

const text = (x: unknown, ersatz = '') => (x === null || x === undefined ? ersatz : String(x));
const zahlText = (x: unknown, stellen: number) =>
  x === null || x === undefined || x === '' ? '' : Number(x).toFixed(stellen);

function meldung(
  e: Einstellungsergebnis | { status: 'nicht_gespeichert'; fehler: Schreibfehler },
): Rueckmeldung {
  return e.status === 'gespeichert' ? { ok: true, text: 'Gespeichert' } : { ok: false, text: e.fehler.text };
}

function Abschnitt({
  titel,
  onSpeichern,
  rueckmeldung,
  sperre,
  children,
}: {
  titel: string;
  onSpeichern?: () => void;
  rueckmeldung?: Rueckmeldung;
  sperre?: boolean;
  children: ReactNode;
}) {
  return (
    <Card title={titel}>
      <form
        className="hv-formular"
        aria-label={titel}
        onSubmit={(ev: FormEvent) => {
          ev.preventDefault();
          onSpeichern?.();
        }}
      >
        {children}
        {rueckmeldung ? (
          <Notice kompakt tone={rueckmeldung.ok ? 'ok' : 'danger'}>
            {rueckmeldung.text}
          </Notice>
        ) : null}
        {onSpeichern ? (
          <Button type="submit" disabled={sperre}>
            Speichern
          </Button>
        ) : null}
      </form>
    </Card>
  );
}

function Kopf() {
  return (
    <header className="hv-seite-kopf">
      <h1 className="hv-seite-titel">Einstellungen</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );
}

export function Einstellungen() {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const e = (teile?.['einstellung']?.[0] ?? undefined) as Zeile | undefined;
  const geraet = (teile?.['messgeraet']?.[0] ?? undefined) as Zeile | undefined;

  if (!e) {
    // #126: Ohne Zeile einstellung (Produktion vor dem scharfen Seed) bleiben der Weg zurück und die Push-Seite
    // erreichbar, weil Push keine Zeile einstellung braucht.
    return (
      <main className="hv-seite">
        <Kopf />
        {liest ? (
          <p>Daten werden geladen</p>
        ) : (
          <>
            <Notice title="Keine Einstellungen gefunden">
              Die Einstellungen entstehen beim ersten Laden des Wissens (Seed).
            </Notice>
            <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
              Push einrichten und Test-Push senden
            </a>
          </>
        )}
      </main>
    );
  }
  return <Formulare key={text(e['id'])} e={e} geraet={geraet} />;
}

function Formulare({ e, geraet }: { e: Zeile; geraet: Zeile | undefined }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const id = text(e['id']);
  const [rueck, setRueck] = useState<Record<string, Rueckmeldung>>({});
  const [sendet, setSendet] = useState(false);
  const melden = (abschnitt: string, r: Rueckmeldung) => setRueck((alt) => ({ ...alt, [abschnitt]: r }));

  async function aendern(abschnitt: string, tabelle: Einstellungstabelle, zeileId: string, felder: Zeile) {
    setSendet(true);
    const r = await einstellungSchreiben.aendern(tabelle, zeileId, felder);
    setSendet(false);
    melden(abschnitt, meldung(r));
  }

  // Erinnerung (R5.5)
  const [pushZeit, setPushZeit] = useState(text(e['push_zeit']).slice(0, 5));
  const [vorlauf, setVorlauf] = useState(text(e['vorlauf_n']));
  function erinnerungSpeichern() {
    const z = pushZeitPruefen(pushZeit);
    const v = vorlaufPruefen(vorlauf);
    if (!z.ok) return melden('erinnerung', { ok: false, text: z.fehler });
    if (!v.ok) return melden('erinnerung', { ok: false, text: v.fehler });
    void aendern('erinnerung', 'einstellung', id, { push_zeit: z.wert, vorlauf_n: v.wert });
  }

  // Kanne (R4.4): Rechenbeispiel beim Ändern
  const kanneAlt = Number(e['kannengroesse_l'] ?? 10);
  const [kanne, setKanne] = useState(zahlText(e['kannengroesse_l'], 1));
  const kanneNeu = kannePruefen(kanne);
  function kanneSpeichern() {
    if (!kanneNeu.ok) return melden('kanne', { ok: false, text: kanneNeu.fehler });
    void aendern('kanne', 'einstellung', id, { kannengroesse_l: kanneNeu.wert });
  }

  // Messmittel
  const mittel = Array.isArray(e['messmittel_ml']) ? (e['messmittel_ml'] as unknown[]) : [];
  const [messmittel, setMessmittel] = useState(mittel.map((m) => String(Number(m))).join(' '));
  const [messbecher, setMessbecher] = useState(e['messbecher'] !== false);
  function messmittelSpeichern() {
    const m = messmittelPruefen(messmittel);
    if (!m.ok) return melden('messmittel', { ok: false, text: m.fehler });
    void aendern('messmittel', 'einstellung', id, { messmittel_ml: m.wert, messbecher });
  }

  // k je Komponente (R4.1)
  const kBisher = kAus(teile);
  const kHerkunft = kHerkunftAus(teile, ZEITZONE);
  const [k, setK] = useState<Record<Komponente, string>>(() => ({
    grow: kBisher.grow.toFixed(3),
    micro_hard_water: kBisher.micro_hard_water.toFixed(3),
    bloom: kBisher.bloom.toFixed(3),
  }));
  const [kFrage, setKFrage] = useState<Extract<KPruefung, { art: 'rueckfrage' }>>();
  async function kUebernehmen() {
    const neu = Object.fromEntries(KOMPONENTEN.map((c) => [c, Number(k[c].replace(',', '.'))])) as Record<
      Komponente,
      number
    >;
    const schritte = kVorgang(neu, kBisher, neueClientId, uhrJetzt());
    setKFrage(undefined);
    if (schritte.length === 0) return melden('k', { ok: true, text: 'Keine Änderung' });
    setSendet(true);
    const r = await schreiben(schritte, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    melden(
      'k',
      r.status === 'gespeichert'
        ? { ok: true, text: 'Gespeichert' }
        : r.status === 'abweichend'
          ? { ok: false, text: 'Schon gespeichert mit anderen Werten' }
          : { ok: false, text: r.fehler.text },
    );
  }
  function kSpeichern() {
    const p = kSatzPruefen(k, kBisher);
    if (p.art === 'abgelehnt') return melden('k', { ok: false, text: p.fehler });
    if (p.art === 'rueckfrage') {
      melden('k', undefined);
      return setKFrage(p);
    }
    void kUebernehmen();
  }

  // Messgerät
  const [uEc, setUEc] = useState(zahlText(geraet?.['u_ec'], 3));
  const [uPh, setUPh] = useState(zahlText(geraet?.['u_ph'], 2));
  function geraetSpeichern() {
    if (!geraet) return;
    const m = messgeraetPruefen(uEc, uPh);
    if (!m.ok) return melden('geraet', { ok: false, text: m.fehler });
    void aendern('geraet', 'messgeraet', text(geraet['id']), m.wert);
  }

  // Thema (Konzept 6.3, Standard Hell)
  const thema = text(e['thema'], 'hell');

  // Pflegebudget
  const [minuten, setMinuten] = useState(text(e['pflegebudget_min_werktag']));
  const [stunden, setStunden] = useState(text(e['pflegebudget_h_woche']));
  function budgetSpeichern() {
    const b = pflegebudgetPruefen(minuten, stunden);
    if (!b.ok) return melden('budget', { ok: false, text: b.fehler });
    void aendern('budget', 'einstellung', id, b.wert);
  }

  // Ruhe je Gefäss (Ereignis ruhe)
  const gefaesse = teile ? messbareOrte(teile).filter((o) => o.rolle === 'gefaess') : [];
  async function ruheSchalten(platzId: string, gesetzt: boolean) {
    setSendet(true);
    const r = await schreiben(ruheVorgang(platzId, gesetzt, neueClientId(), uhrJetzt()), {
      jetzt: uhrJetzt(),
      zeitzone: ZEITZONE,
    });
    setSendet(false);
    melden('ruhe', r.status === 'nicht_gespeichert' ? { ok: false, text: r.fehler.text } : undefined);
  }

  // Telefonnummer fürs Vertretungsblatt: nur online gelesen und geschrieben
  const [telefon, setTelefon] = useState('');
  const [telefonGeladen, setTelefonGeladen] = useState(false);
  useEffect(() => {
    let aktiv = true;
    void einstellungSchreiben.lesen('einstellung', id, 'id,telefon_vertretung').then((r) => {
      if (!aktiv) return;
      // nur nach erfolgreichem Lesen darf gespeichert werden, sonst überschriebe ein leeres Feld die Nummer (Befund 1)
      if (r.status === 'gelesen') {
        setTelefon(text(r.zeile['telefon_vertretung']));
        setTelefonGeladen(true);
      } else melden('telefon', { ok: false, text: `Telefonnummer: ${r.text}` });
    });
    return () => {
      aktiv = false;
    };
  }, [id]);
  function telefonSpeichern() {
    if (!telefonGeladen) return;
    const t = telefon.trim();
    if (t.length > 40) return melden('telefon', { ok: false, text: 'Höchstens 40 Zeichen' });
    void aendern('telefon', 'einstellung', id, { telefon_vertretung: t === '' ? null : t });
  }

  return (
    <main className="hv-seite">
      <Kopf />

      <Abschnitt
        titel="Erinnerung"
        onSpeichern={erinnerungSpeichern}
        rueckmeldung={rueck['erinnerung']}
        sperre={sendet}
      >
        <Zeitwahl
          label="Push-Zeit"
          hint="05:00 bis 22:00"
          min={5}
          max={22}
          wert={pushZeit}
          onWert={setPushZeit}
        />
        <TextField
          label="Vorlauf"
          unit="Tage"
          inputMode="numeric"
          value={vorlauf}
          onChange={(ev) => setVorlauf(ev.target.value)}
        />
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
          Push einrichten und Test-Push senden
        </a>
        {/* E-Mail-Rückfall (R5.5, R13; Plan 31 A14): nur ohne gültiges Push-Abo, Standard Aus */}
        <div className="hv-field">
          <span className="hv-field-label" aria-hidden="true">
            E-Mail, wenn Push fehlt
          </span>
          <Choice
            einzeln
            label="E-Mail, wenn Push fehlt"
            zeile
            optionen={[
              { wert: 'aus', titel: 'Aus' },
              { wert: 'ein', titel: 'Ein' },
            ]}
            gewaehlt={[e['email_rueckfall'] === true ? 'ein' : 'aus']}
            onWahl={(w) => void aendern('erinnerung', 'einstellung', id, { email_rueckfall: w === 'ein' })}
          />
        </div>
      </Abschnitt>

      <Abschnitt titel="Kanne" onSpeichern={kanneSpeichern} rueckmeldung={rueck['kanne']} sperre={sendet}>
        <TextField
          label="Kannengrösse"
          unit="l"
          hint="1 bis 12 l"
          inputMode="decimal"
          value={kanne}
          onChange={(ev) => setKanne(ev.target.value)}
        />
        {kanneNeu.ok && kanneNeu.wert !== kanneAlt ? (
          <Notice kompakt tone="info">
            {kannenBeispiel(kanneAlt, kanneNeu.wert)}
          </Notice>
        ) : null}
      </Abschnitt>

      <Abschnitt
        titel="Messmittel"
        onSpeichern={messmittelSpeichern}
        rueckmeldung={rueck['messmittel']}
        sperre={sendet}
      >
        <TextField
          label="Spritzen und Messbecher"
          unit="ml"
          hint="etwa 1 5 20 60"
          value={messmittel}
          onChange={(ev) => setMessmittel(ev.target.value)}
        />
        <label className="hv-anlage-wahlfeld">
          <input type="checkbox" checked={messbecher} onChange={(ev) => setMessbecher(ev.target.checked)} />
          Messbecher vorhanden
        </label>
      </Abschnitt>

      <Abschnitt titel="k je Komponente" onSpeichern={kSpeichern} rueckmeldung={rueck['k']} sperre={sendet}>
        {KOMPONENTEN.map((c) => (
          <TextField
            key={c}
            label={KOMPONENTE_NAME[c]}
            unit="mS/cm je ml/L"
            hint={kHerkunft[c]}
            inputMode="decimal"
            value={k[c]}
            onChange={(ev) => {
              setKFrage(undefined);
              setK((alt) => ({ ...alt, [c]: ev.target.value }));
            }}
          />
        ))}
        <p className="hv-num">{`k wirksam bisher ${kWirksam(kBisher).toFixed(3)}, erlaubt 0.20 bis 0.45`}</p>
        {kFrage ? (
          <Notice
            tone="warn"
            title={kFrage.text}
            action={
              <>
                <Button variant="secondary" onClick={() => setKFrage(undefined)}>
                  Abbrechen
                </Button>
                <Button onClick={() => void kUebernehmen()}>Übernehmen</Button>
              </>
            }
          />
        ) : null}
      </Abschnitt>

      {geraet ? (
        <Abschnitt
          titel="Messgerät"
          onSpeichern={geraetSpeichern}
          rueckmeldung={rueck['geraet']}
          sperre={sendet}
        >
          <TextField
            label="u_EC"
            unit="mS/cm"
            inputMode="decimal"
            value={uEc}
            onChange={(ev) => setUEc(ev.target.value)}
          />
          <TextField
            label="u_pH"
            inputMode="decimal"
            value={uPh}
            onChange={(ev) => setUPh(ev.target.value)}
          />
        </Abschnitt>
      ) : null}

      <Abschnitt titel="Thema" rueckmeldung={rueck['thema']}>
        <Choice
          einzeln
          label="Thema"
          zeile
          optionen={[
            { wert: 'hell', titel: 'Hell' },
            { wert: 'dunkel', titel: 'Dunkel' },
            { wert: 'system', titel: 'Wie System' },
          ]}
          gewaehlt={[thema]}
          onWahl={(w) => void aendern('thema', 'einstellung', id, { thema: w })}
        />
      </Abschnitt>

      <Abschnitt
        titel="Pflegebudget"
        onSpeichern={budgetSpeichern}
        rueckmeldung={rueck['budget']}
        sperre={sendet}
      >
        <TextField
          label="Je Werktag"
          unit="min"
          inputMode="numeric"
          value={minuten}
          onChange={(ev) => setMinuten(ev.target.value)}
        />
        <TextField
          label="Je Woche"
          unit="h"
          inputMode="decimal"
          value={stunden}
          onChange={(ev) => setStunden(ev.target.value)}
        />
      </Abschnitt>

      <Abschnitt titel="Ruhe je Gefäss" rueckmeldung={rueck['ruhe']}>
        <ul className="hv-einstellungen-ruhe">
          {gefaesse.map((o) => {
            const ruht = teile ? zustandAus(teile, o.platzId).status === 'ruht' : false;
            return (
              <li key={o.platzId}>
                <span className="hv-num">{o.code}</span>
                <Button
                  variant="secondary"
                  size="compact"
                  aria-pressed={ruht}
                  aria-label={`${o.code} ruht`}
                  disabled={sendet}
                  onClick={() => void ruheSchalten(o.platzId, !ruht)}
                >
                  {ruht ? 'Ruhe aufheben' : 'Ruhen lassen'}
                </Button>
              </li>
            );
          })}
        </ul>
      </Abschnitt>

      <Abschnitt
        titel="Vertretung"
        onSpeichern={telefonSpeichern}
        rueckmeldung={rueck['telefon']}
        sperre={sendet || !telefonGeladen}
      >
        <TextField
          label="Telefonnummer fürs Vertretungsblatt"
          hint="Nur in der Datenbank, nie im Gerätespeicher"
          type="tel"
          disabled={!telefonGeladen}
          autoComplete="off"
          value={telefon}
          onChange={(ev) => setTelefon(ev.target.value)}
        />
      </Abschnitt>

      <nav className="hv-einstellungen-einstiege" aria-label="Einstiege">
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'anlage' })}>
          Anlagen verwalten
        </a>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'sorten' })}>
          Saatgut verwalten
        </a>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'etiketten' })}>
          Etiketten
        </a>
        <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'notfallblatt' })}>
          Notfallblatt drucken
        </a>
        <a className="hv-btn hv-btn-secondary" href={GERAET_NEU} target="_blank" rel="noreferrer">
          Anleitung «Gerät neu»
        </a>
      </nav>
    </main>
  );
}
