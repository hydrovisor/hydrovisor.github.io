// Maske «Neue Sorte» (UC4 Ablauf 1 bis 7, Varianten; Schreibtisch, Standarddichte, Systemtastatur erlaubt; Plan 37).
// Vier Schritte: Tüte, Sorte und Art, Merkmale, Packung. Die KI liest nur die Tüte und füllt leere Felder; nach dem
// Speichern ergänzt die Recherche fehlende Werte (Erratum E8). Eingaben bleiben bei jedem Fehler stehen (UC4-AK2, TO8).
import { useId, useState, type SelectHTMLAttributes } from 'react';
import { fotoHochladen, rechercheStarten, tueteLesen } from '../../daten/ki.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { wissenSchreiben } from '../../daten/wissen.ts';
import type { RechercheErgebnis } from '../../domain/ki/recherche.ts';
import type { KiFeld } from '../../domain/ki/schema.ts';
import { hinweisVonHand } from '../../domain/ki/uebernahme.ts';
import type { Kulturform } from '../../domain/phasen/profil.ts';
import {
  WUCHSFORMEN,
  artIdVon,
  artVorschlagen,
  erfassungBauen,
  formularNachKi,
  formularPruefen,
  leeresFormular,
  vorhandeneSorte,
  keimartDerArt,
  keimartHinweis,
  kulturformenDerArt,
  type ArtZeile,
  type KiLauf,
  type Kulturtyp,
  type SorteZeile,
  type SortenFormular,
  type WissenAufruf,
} from '../../domain/sorten/erfassung.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { KULTURFORMEN_JE_TYP } from '../../domain/wissen/luecken.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { APP_VERSION } from '../../konstanten.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { PhotoField } from '../bausteine/PhotoField.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../sorten.css';
import { tuetenbildVerkleinern } from '../tuetenbild.ts';

type Schritt = 'tuete' | 'sorte' | 'merkmale' | 'packung' | 'fertig';
const SCHRITTE: { id: Exclude<Schritt, 'fertig'>; titel: string }[] = [
  { id: 'tuete', titel: 'Tüte' },
  { id: 'sorte', titel: 'Sorte und Art' },
  { id: 'merkmale', titel: 'Merkmale' },
  { id: 'packung', titel: 'Packung' },
];
const KULTURTYPEN: { wert: Kulturtyp; text: string }[] = [
  { wert: 'blatt', text: 'Blatt' },
  { wert: 'knolle', text: 'Knolle' },
  { wert: 'frucht', text: 'Frucht' },
];
const KULTURFORM_NAME: Record<string, string> = {
  keimling: 'Keimling',
  babyleaf: 'Babyleaf',
  schnitt: 'Schnitt',
  kopf: 'Kopf',
  dauerkultur_blatt: 'Dauerkultur Blatt',
  dauerkultur_frucht: 'Dauerkultur Frucht',
};
const WUCHSFORM_NAME: Record<string, string> = {
  aufrecht: 'aufrecht',
  buschig: 'buschig',
  haengend: 'hängend',
  rosette: 'Rosette',
};
const NEUE_ART = '__neu';
/** Uhr der Oberfläche (G2: Date.now() nur hier) */
const jetzt = () => new Date(Date.now());
const PACKUNG_FELDER = ['kaufdatum', 'keimfaehigkeitProzent', 'bestandKorn'];

interface Foto {
  datei: File;
  url: string;
}
interface Speicherstand {
  schluessel: string;
  wissen: WissenAufruf[];
  vorgang: Vorgang;
  wissenErledigt: number;
}

/** Auswahl mit Beschriftung und Rahmen wie TextField (TextField.md, Abschnitt «Auswahl und Wahlgruppe») */
function Auswahl({ label, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className="hv-field">
      <label className="hv-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="hv-field-box">
        <select id={id} className="hv-field-input" {...rest}>
          {children}
        </select>
      </div>
    </div>
  );
}

export function SorteNeu() {
  const { buendel } = useBuendel();
  // alle Fassungen für die Kollisionsprüfung der neuen Art (N5); Auswahl nur gültige
  const alleArten = (buendel?.teile['art'] ?? []) as ArtZeile[];
  const arten = alleArten.filter((a) => a.gueltig_bis === null);
  const sorten = (buendel?.teile['sorte'] ?? []) as SorteZeile[];
  const gruppen = (buendel?.teile['kulturgruppe'] ?? []) as {
    kulturgruppe_id: string;
    name: string;
    leitkultur_art_id: string | null;
  }[];
  const sollwerte = (buendel?.teile['v_sollwert'] ?? []) as Parameters<typeof keimartDerArt>[0];

  const [ids] = useState(() => ({ sorteId: neueClientId(), saatgutId: neueClientId() }));
  const [schritt, setSchritt] = useState<Schritt>('tuete');
  const [f, setF] = useState<SortenFormular>(leeresFormular);
  const [text, setText] = useState('');
  const [vorne, setVorne] = useState<Foto>();
  const [hinten, setHinten] = useState<Foto>();
  const [ki, setKi] = useState<KiLauf>();
  const [hinweis, setHinweis] = useState<string>();
  const [liest, setLiest] = useState(false);
  const [nurPackung, setNurPackung] = useState<string>();
  const [fehler, setFehler] = useState<{ feld: string; text: string }[]>([]);
  const [meldung, setMeldung] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const [stand, setStand] = useState<Speicherstand>();
  const [recherche, setRecherche] = useState<RechercheErgebnis | 'laeuft'>();

  const aendern = (teil: Partial<SortenFormular>) => {
    setF((alt) => ({ ...alt, ...teil }));
    setMeldung(undefined);
  };
  const tueteAendern = (feld: KiFeld, wert: string) => aendern({ tuete: { ...f.tuete, [feld]: wert } });
  const fehlerZu = (feld: string) => fehler.find((x) => x.feld === feld)?.text;

  const artId = artIdVon(f);
  const vorhandenId =
    !f.neueArt && f.artId && f.tuete.name ? vorhandeneSorte(sorten, f.tuete.name, f.artId) : undefined;
  const vorhandenName = sorten.find((s) => s.sorte_id === vorhandenId)?.name;
  const keimartAbweichung = keimartHinweis(f.tuete.keimart, keimartDerArt(sollwerte, sorten, f.artId));
  const zielSorte = nurPackung ?? ids.sorteId;

  async function lesen() {
    setLiest(true);
    setHinweis(undefined);
    let anfrage: { fotopfade: string[] } | { text: string };
    const fotopfade: string[] = [];
    const fotos = [vorne, hinten].filter((x): x is Foto => x !== undefined);
    if (fotos.length > 0) {
      for (const foto of fotos) {
        let bild: Blob;
        try {
          bild = await tuetenbildVerkleinern(foto.datei);
        } catch {
          setLiest(false);
          setHinweis('Das Foto ist nicht lesbar. Wähle ein anderes Foto oder trag die Werte von Hand ein.');
          return;
        }
        const r = await fotoHochladen(ids.sorteId, bild);
        if ('fehler' in r) {
          setLiest(false);
          setHinweis(hinweisVonHand('fehler'));
          return;
        }
        fotopfade.push(r.pfad);
      }
      anfrage = { fotopfade };
    } else if (text.trim() !== '') {
      anfrage = { text };
    } else {
      setLiest(false);
      setHinweis('Wähle ein Foto oder füge den Text der Tüte ein.');
      return;
    }
    const ergebnis = await tueteLesen(anfrage);
    setLiest(false);
    const r = formularNachKi(f, ergebnis);
    if (ergebnis.ergebnis !== 'ok') {
      setHinweis(r.hinweis);
      return;
    }
    const vorschlag = f.artId || f.neueArt ? undefined : artVorschlagen(arten, ergebnis.felder.art);
    setF(vorschlag ? { ...r.formular, artId: vorschlag } : r.formular);
    setKi({ ...ergebnis, fotopfade });
    setSchritt('sorte');
  }

  function weiter(nach: Schritt) {
    const fehlerJetzt = formularPruefen(f, alleArten, gruppen).filter((x) =>
      schritt === 'sorte'
        ? ['name', 'art'].includes(x.feld) || x.feld.startsWith('neueArt')
        : schritt === 'merkmale'
          ? [
              'kulturtyp',
              'wuchshoeheCm',
              'wuchsform',
              'fruehzeitigkeitD',
              'katalogLink',
              'shopLink',
            ].includes(x.feld)
          : false,
    );
    setFehler(fehlerJetzt);
    if (fehlerJetzt.length === 0) setSchritt(nach);
  }

  async function speichern() {
    const alle = formularPruefen(f, alleArten, gruppen);
    const f2 = nurPackung ? alle.filter((x) => PACKUNG_FELDER.includes(x.feld)) : alle;
    setFehler(f2);
    if (f2.length > 0) {
      setMeldung('Prüf die markierten Angaben, auch in den früheren Schritten.');
      return;
    }
    const schluessel = JSON.stringify({ f, nurPackung, ki: ki?.dauerMs });
    let aktuell = stand?.schluessel === schluessel ? stand : undefined;
    if (!aktuell) {
      const e = erfassungBauen(
        f,
        { sorteId: zielSorte, saatgutId: ids.saatgutId, clientIds: neueClientId },
        ki,
        {
          jetzt: jetzt(),
          zeitzone: ZEITZONE,
          appVersion: APP_VERSION,
        },
      );
      aktuell = { schluessel, wissen: nurPackung ? [] : e.wissen, vorgang: e.vorgang, wissenErledigt: 0 };
    }
    setStand(aktuell);
    setSendet(true);
    setMeldung(undefined);
    const w = await wissenSchreiben(aktuell.wissen, aktuell.wissenErledigt);
    if (w.status === 'nicht_gespeichert') {
      setStand({ ...aktuell, wissenErledigt: w.erledigt });
      setSendet(false);
      setMeldung(w.fehler.text);
      return;
    }
    const fertig = { ...aktuell, wissenErledigt: aktuell.wissen.length };
    setStand(fertig);
    const r = await schreiben(fertig.vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    if (r.status === 'nicht_gespeichert') {
      setMeldung(r.fehler.text);
      return;
    }
    if (r.status === 'abweichend') {
      setMeldung('Nicht gespeichert: Diese Packung ist schon mit anderen Angaben gespeichert.');
      return;
    }
    setSchritt('fertig');
    if (!nurPackung) {
      setRecherche('laeuft');
      setRecherche(await rechercheStarten(ids.sorteId));
    }
  }

  const name = (f.tuete.name ?? '').trim();
  // Kulturformen der Art, bei einer neuen Art die der Leitkultur (B3, N2)
  const formen = kulturformenDerArt(f, arten, gruppen) ?? [];
  const saatFormen = f.kulturtyp
    ? KULTURFORMEN_JE_TYP[f.kulturtyp].filter((k) => formen.length === 0 || formen.includes(k))
    : [];
  const saatempfehlungen = (buendel?.teile['saatempfehlung'] ?? []) as {
    ebene: string;
    art_id: string | null;
    sorte_id: string | null;
    kulturform: string;
    samen_je_schwamm: number;
    klasse_saatmenge: string;
    bestaetigt_am: string | null;
  }[];

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Neue Sorte</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'sorten' })}>
          Zu den Sorten
        </a>
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

      {schritt === 'tuete' ? (
        <section className="hv-formular" aria-label="Tüte">
          <PhotoField
            label="Vorderseite"
            vorschau={vorne?.url}
            onWahl={(datei) => setVorne({ datei, url: URL.createObjectURL(datei) })}
          />
          <PhotoField
            label="Rückseite"
            vorschau={hinten?.url}
            onWahl={(datei) => setHinten({ datei, url: URL.createObjectURL(datei) })}
          />
          <div className="hv-field">
            <label className="hv-field-label" htmlFor="tuetentext">
              Text der Tüte einfügen
            </label>
            <div className="hv-field-box">
              <textarea
                id="tuetentext"
                className="hv-field-input hv-field-textarea"
                value={text}
                onChange={(ev) => setText(ev.target.value)}
              />
            </div>
            <p className="hv-field-msg">Oder Fotos wählen; die KI liest nur, was auf der Tüte steht.</p>
          </div>
          {hinweis ? <Notice tone="warn">{hinweis}</Notice> : null}
          {liest ? <p role="status">Tüte wird gelesen</p> : null}
          <Button disabled={liest} onClick={() => void lesen()}>
            Tüte lesen
          </Button>
          <Button variant="secondary" disabled={liest} onClick={() => setSchritt('sorte')}>
            Ohne KI weiter
          </Button>
        </section>
      ) : null}

      {schritt === 'sorte' ? (
        <section className="hv-formular" aria-label="Sorte und Art">
          <TextField
            label="Name"
            value={f.tuete.name ?? ''}
            error={fehlerZu('name')}
            onChange={(ev) => tueteAendern('name', ev.target.value)}
          />
          <TextField
            label="Hersteller"
            value={f.tuete.hersteller ?? ''}
            onChange={(ev) => tueteAendern('hersteller', ev.target.value)}
          />
          <div className={fehlerZu('art') ? 'hv-field hv-field-error' : 'hv-field'}>
            <label className="hv-field-label" htmlFor="art">
              Art
            </label>
            <div className="hv-field-box">
              <select
                id="art"
                className="hv-field-input"
                value={f.neueArt ? NEUE_ART : (f.artId ?? '')}
                onChange={(ev) =>
                  ev.target.value === NEUE_ART
                    ? aendern({
                        artId: undefined,
                        neueArt: {
                          nameDe: '',
                          nameWiss: '',
                          kulturgruppeId: gruppen[0]?.kulturgruppe_id ?? '',
                        },
                      })
                    : aendern({ artId: ev.target.value || undefined, neueArt: undefined })
                }
              >
                <option value="">Art wählen</option>
                {arten.map((a) => (
                  <option key={a.art_id} value={a.art_id}>
                    {a.name_de} ({a.name_wiss})
                  </option>
                ))}
                <option value={NEUE_ART}>Neue Art anlegen</option>
              </select>
            </div>
            {fehlerZu('art') ? <p className="hv-field-msg hv-field-msg-error">{fehlerZu('art')}</p> : null}
          </div>
          {f.neueArt ? (
            <fieldset className="hv-anlage-feldgruppe">
              <legend>Neue Art</legend>
              <TextField
                label="Deutscher Name"
                value={f.neueArt.nameDe}
                error={fehlerZu('neueArt.nameDe')}
                onChange={(ev) =>
                  f.neueArt && aendern({ neueArt: { ...f.neueArt, nameDe: ev.target.value } })
                }
              />
              <TextField
                label="Wissenschaftlicher Name"
                value={f.neueArt.nameWiss}
                error={fehlerZu('neueArt.nameWiss')}
                onChange={(ev) =>
                  f.neueArt && aendern({ neueArt: { ...f.neueArt, nameWiss: ev.target.value } })
                }
              />
              <Auswahl
                label="Kulturgruppe"
                value={f.neueArt.kulturgruppeId}
                onChange={(ev) =>
                  f.neueArt && aendern({ neueArt: { ...f.neueArt, kulturgruppeId: ev.target.value } })
                }
              >
                {gruppen.map((g) => (
                  <option key={g.kulturgruppe_id} value={g.kulturgruppe_id}>
                    {g.name}
                  </option>
                ))}
              </Auswahl>
              <p className="hv-field-msg">Die Merkmale kommen von der Leitkultur und bleiben Prüfauftrag.</p>
            </fieldset>
          ) : null}
          {vorhandenId && vorhandenName ? (
            <Notice
              tone="info"
              title={`${vorhandenName} gibt es schon`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNurPackung(vorhandenId);
                    setFehler([]);
                    setSchritt('packung');
                  }}
                >
                  {`Packung zu ${vorhandenName} erfassen`}
                </Button>
              }
            >
              Erfasse nur die neue Packung.
            </Notice>
          ) : null}
          <Auswahl
            label="Keimart laut Tüte"
            value={f.tuete.keimart ?? ''}
            onChange={(ev) => tueteAendern('keimart', ev.target.value)}
          >
            <option value="">keine Angabe</option>
            <option value="licht">Lichtkeimer</option>
            <option value="dunkel">Dunkelkeimer</option>
            <option value="indifferent">ohne Angabe zum Licht</option>
          </Auswahl>
          {keimartAbweichung ? <Notice tone="info">{keimartAbweichung}</Notice> : null}
          <TextField
            label="Keimtemperatur laut Tüte"
            unit="°C"
            hint="z. B. 15-20"
            value={f.tuete.keimtemperatur ?? ''}
            onChange={(ev) => tueteAendern('keimtemperatur', ev.target.value)}
          />
          {(['keimdauer', 'kulturdauer', 'aussaatfenster'] as const).some((k) => f.tuete[k]) ? (
            <p className="hv-sorte-tuete">
              Laut Tüte: Keimdauer {f.tuete.keimdauer || '–'}, Kulturdauer {f.tuete.kulturdauer || '–'},
              Aussaatfenster {f.tuete.aussaatfenster || '–'}. Diese Angaben gelten für Erde und kommen nur ins
              Protokoll.
            </p>
          ) : null}
          <Button onClick={() => weiter('merkmale')}>Weiter</Button>
        </section>
      ) : null}

      {schritt === 'merkmale' ? (
        <section className="hv-formular" aria-label="Merkmale">
          <fieldset className="hv-anlage-feldgruppe">
            <legend>Kulturtyp</legend>
            {KULTURTYPEN.map((k) => (
              <label key={k.wert} className="hv-anlage-wahlfeld">
                <input
                  type="radio"
                  name="kulturtyp"
                  checked={f.kulturtyp === k.wert}
                  onChange={() => aendern({ kulturtyp: k.wert })}
                />
                {k.text}
              </label>
            ))}
            {fehlerZu('kulturtyp') ? (
              <p className="hv-field-msg hv-field-msg-error">{fehlerZu('kulturtyp')}</p>
            ) : null}
          </fieldset>
          <TextField
            label="Wuchshöhe"
            unit="cm"
            inputMode="decimal"
            hint="freiwillig, laut Katalog"
            value={f.wuchshoeheCm}
            error={fehlerZu('wuchshoeheCm')}
            onChange={(ev) => aendern({ wuchshoeheCm: ev.target.value })}
          />
          <Auswahl
            label="Wuchsform"
            value={f.wuchsform}
            onChange={(ev) => aendern({ wuchsform: ev.target.value })}
          >
            <option value="">keine Angabe</option>
            {WUCHSFORMEN.map((w) => (
              <option key={w} value={w}>
                {WUCHSFORM_NAME[w]}
              </option>
            ))}
          </Auswahl>
          <TextField
            label="Frühzeitigkeit"
            unit="Tage"
            inputMode="numeric"
            hint="freiwillig, relativ zur Art, z. B. -3"
            value={f.fruehzeitigkeitD}
            error={fehlerZu('fruehzeitigkeitD')}
            onChange={(ev) => aendern({ fruehzeitigkeitD: ev.target.value })}
          />
          <TextField
            label="Katalog-Link"
            inputMode="url"
            value={f.katalogLink}
            error={fehlerZu('katalogLink')}
            onChange={(ev) => aendern({ katalogLink: ev.target.value })}
          />
          <TextField
            label="Shop-Link"
            inputMode="url"
            value={f.shopLink}
            error={fehlerZu('shopLink')}
            onChange={(ev) => aendern({ shopLink: ev.target.value })}
          />
          <Button onClick={() => weiter('packung')}>Weiter</Button>
        </section>
      ) : null}

      {schritt === 'packung' ? (
        <section className="hv-formular" aria-label="Packung">
          <TextField
            label="Kaufdatum"
            type="date"
            value={f.kaufdatum}
            error={fehlerZu('kaufdatum')}
            onChange={(ev) => aendern({ kaufdatum: ev.target.value })}
          />
          <TextField
            label="Keimfähigkeit in %"
            inputMode="decimal"
            value={f.keimfaehigkeitProzent}
            error={fehlerZu('keimfaehigkeitProzent')}
            onChange={(ev) => aendern({ keimfaehigkeitProzent: ev.target.value })}
          />
          <TextField
            label="Bestand in Korn"
            inputMode="numeric"
            value={f.bestandKorn}
            error={fehlerZu('bestandKorn')}
            onChange={(ev) => aendern({ bestandKorn: ev.target.value })}
          />
          {!nurPackung && saatFormen.length > 0 ? (
            <div className="hv-sorte-saat">
              <p className="hv-field-label">Saatempfehlung</p>
              <ul>
                {saatFormen.map((k) => {
                  const se = saatempfehlungen.find(
                    (s) => s.kulturform === k && s.ebene === 'art' && s.art_id === artId,
                  );
                  return (
                    <li key={k}>
                      {KULTURFORM_NAME[k]}:{' '}
                      {se
                        ? `${se.samen_je_schwamm} Samen je Schwamm, Klasse ${se.klasse_saatmenge}, ${se.bestaetigt_am ? 'bestätigt' : 'nicht bestätigt'}`
                        : 'fehlt, die Recherche ergänzt sie'}
                    </li>
                  );
                })}
              </ul>
              <details>
                <summary>Von Hand anlegen</summary>
                <fieldset className="hv-anlage-feldgruppe">
                  <legend>Quelle</legend>
                  {(['tuete', 'standard'] as const).map((q) => (
                    <label key={q} className="hv-anlage-wahlfeld">
                      <input
                        type="radio"
                        name="saatquelle"
                        checked={f.saatVonHand?.quelle === q}
                        onChange={() =>
                          aendern({
                            saatVonHand: {
                              quelle: q,
                              kulturform: (f.saatVonHand?.kulturform ?? saatFormen[0]) as Kulturform,
                              samenJeSchwamm: f.saatVonHand?.samenJeSchwamm ?? '',
                              bestaetigen: f.saatVonHand?.bestaetigen ?? true,
                            },
                          })
                        }
                      />
                      {q === 'tuete' ? 'Angabe der Tüte übernehmen' : 'Standard übernehmen'}
                    </label>
                  ))}
                </fieldset>
                {f.saatVonHand ? (
                  <>
                    <Auswahl
                      label="Kulturform"
                      value={f.saatVonHand.kulturform}
                      onChange={(ev) =>
                        f.saatVonHand &&
                        aendern({
                          saatVonHand: { ...f.saatVonHand, kulturform: ev.target.value as Kulturform },
                        })
                      }
                    >
                      {saatFormen.map((k) => (
                        <option key={k} value={k}>
                          {KULTURFORM_NAME[k]}
                        </option>
                      ))}
                    </Auswahl>
                    <TextField
                      label="Samen je Schwamm"
                      inputMode="numeric"
                      value={f.saatVonHand.samenJeSchwamm}
                      error={fehlerZu('saatVonHand')}
                      onChange={(ev) =>
                        f.saatVonHand &&
                        aendern({ saatVonHand: { ...f.saatVonHand, samenJeSchwamm: ev.target.value } })
                      }
                    />
                    <label className="hv-anlage-wahlfeld">
                      <input
                        type="checkbox"
                        checked={f.saatVonHand.bestaetigen}
                        onChange={(ev) =>
                          f.saatVonHand &&
                          aendern({ saatVonHand: { ...f.saatVonHand, bestaetigen: ev.target.checked } })
                        }
                      />
                      Saatempfehlung bestätigen
                    </label>
                  </>
                ) : null}
              </details>
            </div>
          ) : null}
          {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
          <Button disabled={sendet} onClick={() => void speichern()}>
            {nurPackung ? 'Packung speichern' : 'Sorte speichern'}
          </Button>
        </section>
      ) : null}

      {schritt === 'fertig' ? (
        <section className="hv-formular" aria-label="Gespeichert">
          <Notice tone="ok">
            {nurPackung
              ? `Gespeichert: Packung zu ${vorhandenName ?? name}`
              : `Gespeichert: ${name} mit Packung`}
          </Notice>
          {recherche === 'laeuft' ? (
            <Notice tone="info">Recherche läuft. Du kannst die Seite verlassen.</Notice>
          ) : recherche?.ergebnis === 'ok' ? (
            <Notice tone="info">
              {`Ergänzt: ${recherche.werte} ${recherche.werte === 1 ? 'Wert' : 'Werte'} und ${recherche.saat} ${recherche.saat === 1 ? 'Saatempfehlung' : 'Saatempfehlungen'}. Offen: ${recherche.offen.length + recherche.offenSaat.length} ${recherche.offen.length + recherche.offenSaat.length === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}.`}
            </Notice>
          ) : recherche ? (
            <Notice tone="warn">{recherche.hinweis}</Notice>
          ) : null}
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'sorte', sorte: zielSorte })}>
            Sorte öffnen
          </a>
          <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'sorten' })}>
            Zu den Sorten
          </a>
        </section>
      ) : null}
    </main>
  );
}
