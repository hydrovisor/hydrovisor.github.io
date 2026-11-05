// Säen #/saeen?box=…&ziel=…&von=gefaess (UC5, Konzept 6.1, 05 3.6; Plan 23): drei Schritte am Regal – Sorten mit
// Kulturform, Zieltöpfe im Malmodus oder «Ziel später», Anzucht und Menge mit Stationsvorschau. Ein Tipp auf «Säen
// speichern» schreibt den ganzen Vorgang über schreiben(); «Rückgängig machen» storniert ihn. Regal-Dichte, keine
// Systemtastatur. Der Scan einer Anzuchtbox (Box ohne von) zählt als Einstieg «scan» (A3).
import { useMemo, useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { anlagenAus, anzuchtortAm, plaetzeAus, type Teile } from '../../domain/anlage/teile.ts';
import { boxBelegung } from '../../domain/anzucht/kapazitaet.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import {
  boxenAus,
  KULTURFORM_NAME,
  saatEingabePruefen,
  saatRueckgaengig,
  saatVorgang,
  saatVorschlag,
  sortenAuswahl,
  zielgefaesse,
  zieltoepfe,
  type SaatEingabe,
  type SatzVorschlag,
  type Zieltopf,
} from '../../domain/pflanzung/saeen.ts';
import { lochbild } from '../../domain/vorlagen/lochbild.ts';
import { kalendertag, tagKurz, tagPlus, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Deckel, type Loch } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';

const KEIMART: Record<string, string> = {
  licht: 'Lichtkeimer',
  dunkel: 'Dunkelkeimer',
  indifferent: 'Keimart beliebig',
};
const BOXTYP: Record<string, string> = { box_licht: 'Lichtkeimer', box_dunkel: 'Dunkelkeimer' };
const SPERRE_MS = 400;

interface Menge {
  samen?: number | undefined;
  schwaemme?: number | undefined;
  pflanzen?: number | undefined;
}

const zahl2 = (x: number) => x.toFixed(2);
const spanne = (s: { min?: number; typ?: number; max?: number }, einheit: string) =>
  s.typ !== undefined
    ? `${s.min ?? s.typ} bis ${s.max ?? s.typ} ${einheit} (typisch ${s.typ})`
    : s.min !== undefined
      ? `ab ${s.min} ${einheit}`
      : undefined;

export function Saeen({ box, ziel, von }: { box?: string; ziel?: string; von?: 'gefaess' }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const [begonnen] = useState(() => jetzt());
  const [schritt, setSchritt] = useState<1 | 2 | 3>(1);
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [kulturform, setKulturform] = useState<Record<string, string>>({});
  const [zielWahl, setZielWahl] = useState<string>();
  const [aktiv, setAktiv] = useState(1);
  const [toepfe, setToepfe] = useState<Map<string, number>>(new Map());
  const [spaeter, setSpaeter] = useState(false);
  const [rueck, setRueck] = useState(0);
  const [mengen, setMengen] = useState<Record<string, Menge>>({});
  const [boxen, setBoxen] = useState<Record<string, string>>({});
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);
  // Teil des Vorgangs schon gespeichert: Eingabe fest, nur derselbe Vorgang erneut (Prüfer Runde 1, Befund 8)
  const [teilweise, setTeilweise] = useState(false);
  const [fertig, setFertig] = useState<{ vorgang: Vorgang; text: string; zurueck?: boolean }>();
  // gleicher Vorgang bei Wiederholung derselben Eingabe (TO2)
  const letzter = useRef<{ schluessel: string; vorgang: Vorgang } | undefined>(undefined);

  const orte = (teile ?? {}) as Record<string, readonly unknown[]>;
  const boxOrt = box && teile ? ortAufloesen(box, orte) : undefined;
  const scanBox = boxOrt?.rolle === 'anzuchtort' ? boxOrt : undefined;
  const zielOrt = ziel && teile ? ortAufloesen(ziel, orte) : undefined;
  const anlageId = useMemo(() => {
    const platzId = scanBox?.platzId ?? zielOrt?.platzId;
    const ausPlatz = platzId
      ? anlagenAus(teile).find((a) => plaetzeAus(teile, a.id).some((p) => p.id === platzId))
      : undefined;
    return (ausPlatz ?? anlagenAus(teile)[0])?.id;
  }, [teile, scanBox?.platzId, zielOrt?.platzId]);

  const sorten = useMemo(() => (teile ? sortenAuswahl(teile) : []), [teile]);
  const ziele = useMemo(() => (teile && anlageId ? zielgefaesse(teile, anlageId) : []), [teile, anlageId]);
  const zielPlatzId = zielWahl ?? ziele.find((z) => z.platzId === zielOrt?.platzId)?.platzId;
  const zielG = ziele.find((z) => z.platzId === zielPlatzId);
  const heute = kalendertag(jetzt(), ZEITZONE);
  const saatdatum = tagPlus(heute, -rueck);
  const einstieg: SaatEingabe['einstieg'] = von === 'gefaess' ? 'gefaess' : scanBox ? 'scan' : 'heute';

  const eingabe: SaatEingabe | undefined = anlageId
    ? {
        anlageId,
        einstieg,
        begonnenAm: begonnen,
        saatdatum,
        ...(zielPlatzId && !spaeter ? { zielPlatzId } : {}),
        saetze: gewaehlt.map((id, i) => {
          const s = sorten.find((x) => x.sorteId === id);
          const m = mengen[id] ?? {};
          const zieltopfIds =
            spaeter || !zielPlatzId ? [] : [...toepfe].filter(([, n]) => n === i + 1).map(([t]) => t);
          const boxId = boxen[id] ?? scanBox?.platzId;
          return {
            sorteId: id,
            kulturform: kulturform[id] ?? s?.wieLetztesMal ?? s?.vorgabe ?? '',
            ...(boxId ? { boxPlatzId: boxId } : {}),
            zieltopfIds,
            ...(zieltopfIds.length === 0 ? { pflanzenOhneZiel: m.pflanzen ?? 1 } : {}),
            ...(m.samen !== undefined ? { samenJeSchwamm: m.samen } : {}),
            ...(m.schwaemme !== undefined ? { schwaemme: m.schwaemme } : {}),
          };
        }),
      }
    : undefined;
  const vorschlag =
    teile && eingabe && schritt === 3 ? saatVorschlag(teile, eingabe, jetzt(), ZEITZONE) : undefined;

  const kopf = (
    <>
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Säen</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      {scanBox ? (
        <p>
          Anzuchtbox {scanBox.kennung} ·{' '}
          {anzuchtortAm(teile, scanBox.platzId)?.typ === 'box_dunkel' ? 'Dunkelkeimer' : 'Lichtkeimer'}
        </p>
      ) : null}
    </>
  );

  if (fertig) {
    return (
      <main className="hv-seite hv-saeen" data-density="regal">
        {kopf}
        <p className="hv-saeen-bestaetigung">{fertig.zurueck ? 'Rückgängig gemacht' : fertig.text}</p>
        {fehler.length > 0 ? <Notice kompakt tone="danger" title={fehler.join(' · ')} /> : null}
        {fertig.zurueck ? null : (
          <Button variant="secondary" block disabled={sendet} onClick={() => void zuruecknehmen()}>
            Rückgängig machen
          </Button>
        )}
        <a className="hv-btn hv-btn-primary hv-btn-block" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }

  if (!teile || !anlageId) {
    return (
      <main className="hv-seite hv-saeen" data-density="regal">
        {kopf}
        <p>{liest || !teile ? 'Daten werden geladen' : 'Keine Anlage erfasst'}</p>
      </main>
    );
  }

  function sorteUmschalten(id: string) {
    setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
    setToepfe(new Map());
    setAktiv(1);
  }

  /** Malmodus: freies Loch an die aktive Sorte, eigenes wieder weg, fremdes umfärben */
  function lochTippen(netztopfId: string) {
    setToepfe((alt) => {
      const neu = new Map(alt);
      if (neu.get(netztopfId) === aktiv) neu.delete(netztopfId);
      else neu.set(netztopfId, aktiv);
      return neu;
    });
  }

  /** Topf passt zum Satz: nicht belegt oder reserviert, bei Anzucht 8 cm (Konzept 5.8, A5) */
  function passt(t: Zieltopf): boolean {
    if (t.zustand === 'belegt' || t.zustand === 'reserviert') return false;
    return zielG?.direktsaat === true || t.groesseMm === 80;
  }

  /** A13: ohne «Umsetzen ab» der Art keine Zieltöpfe bei Anzucht (Prüfer Runde 1, Befund 6) */
  const aktiveSorte = sorten.find((s) => s.sorteId === gewaehlt[aktiv - 1]);
  const aktivMalbar =
    zielG?.direktsaat === true || (aktiveSorte !== undefined && umsetzenBekannt(teile, aktiveSorte.artId));

  function alleFreien() {
    if (!teile || !zielG || !aktivMalbar) return;
    const frei = zieltoepfe(teile, zielG.platzId, toepfe).filter((t) => t.zustand === 'frei' && passt(t));
    setToepfe((alt) => {
      const neu = new Map(alt);
      for (const t of frei) neu.set(t.netztopfId, aktiv);
      return neu;
    });
  }

  function reiheTippen(reihe: number) {
    if (!teile || !zielG || !aktivMalbar) return;
    const nr = new Set(
      lochbild(zielG.reihen)
        .filter((l) => l.reihe === reihe)
        .map((l) => l.nr),
    );
    const inReihe = zieltoepfe(teile, zielG.platzId, toepfe).filter((t) => nr.has(t.lochNr) && passt(t));
    const frei = inReihe.filter((t) => t.zustand === 'frei');
    setToepfe((alt) => {
      const neu = new Map(alt);
      if (frei.length > 0) for (const t of frei) neu.set(t.netztopfId, aktiv);
      else for (const t of inReihe) if (neu.get(t.netztopfId) === aktiv) neu.delete(t.netztopfId);
      return neu;
    });
  }

  async function speichern() {
    if (!teile || !eingabe || sendet) return;
    if (teilweise && letzter.current) {
      await senden(letzter.current.vorgang);
      return;
    }
    const verstoesse = saatEingabePruefen(teile, eingabe, jetzt(), ZEITZONE);
    if (verstoesse.length > 0) {
      setFehler(verstoesse.map((v) => v.grund));
      return;
    }
    const schluessel = JSON.stringify({ ...eingabe, begonnenAm: undefined });
    const vorgang =
      letzter.current?.schluessel === schluessel
        ? letzter.current.vorgang
        : saatVorgang(teile, eingabe, neueClientId, jetzt(), ZEITZONE);
    letzter.current = { schluessel, vorgang };
    await senden(vorgang);
  }

  async function senden(vorgang: Vorgang) {
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    // Sperre 400 ms gegen Doppeltipp (Aktionsknopf, NumPad.md)
    setTimeout(() => setSendet(false), SPERRE_MS);
    if (antwort.status !== 'gespeichert') {
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht gespeichert']);
      if (antwort.status === 'nicht_gespeichert' && antwort.bestaetigt > 0) setTeilweise(true);
      return;
    }
    const saetze = vorgang.filter((s) => s.tabelle === 'satz').length;
    const schwaemme = vorgang.filter((s) => s.tabelle === 'pflanzung').length;
    setFehler([]);
    setFertig({
      vorgang,
      text: `Gespeichert: ${saetze} ${saetze === 1 ? 'Satz' : 'Sätze'}, ${schwaemme} ${schwaemme === 1 ? 'Schwamm' : 'Schwämme'}`,
    });
  }

  async function zuruecknehmen() {
    if (!fertig) return;
    setSendet(true);
    const antwort = await schreiben(saatRueckgaengig(fertig.vorgang), { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    if (antwort.status === 'gespeichert') setFertig({ ...fertig, zurueck: true });
    else
      setFehler([antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : 'Nicht rückgängig gemacht']);
  }

  const schrittText = <p className="hv-saeen-schritt">Schritt {schritt} von 3</p>;

  if (schritt === 1) {
    return (
      <main className="hv-seite hv-saeen" data-density="regal">
        {kopf}
        {schrittText}
        <div className="hv-choice" role="group" aria-label="Sorten">
          {sorten.map((s) => (
            <div key={s.sorteId} className="hv-saeen-sorte">
              <Choice
                label={s.name}
                optionen={[
                  {
                    wert: s.sorteId,
                    titel: s.name,
                    zusatz: [
                      s.wieLetztesMal ? `Wie letztes Mal: ${KULTURFORM_NAME[s.wieLetztesMal]}` : '',
                      s.keimart ? KEIMART[s.keimart] : '',
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  },
                ]}
                gewaehlt={gewaehlt}
                onWahl={sorteUmschalten}
              />
              {gewaehlt.includes(s.sorteId) && s.kulturformen.length > 1 ? (
                <Choice
                  label={`Kulturform ${s.name}`}
                  zeile
                  optionen={s.kulturformen.map((k) => ({ wert: k, titel: KULTURFORM_NAME[k] ?? k }))}
                  gewaehlt={[kulturform[s.sorteId] ?? s.wieLetztesMal ?? s.vorgabe]}
                  onWahl={(k) => setKulturform((alt) => ({ ...alt, [s.sorteId]: k }))}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="hv-saeen-fuss">
          <Button block disabled={gewaehlt.length === 0} onClick={() => setSchritt(2)}>
            Weiter
          </Button>
        </div>
      </main>
    );
  }

  if (schritt === 2) {
    // Zustand als Text, nie nur über Farbe (Prüfer Runde 1, Befunde 4, 5 und 9)
    const toepfeZiel = zielG ? zieltoepfe(teile, zielG.platzId, toepfe) : [];
    const mitTopf: Loch[] = toepfeZiel.map((t): Loch => {
      const name = t.marke
        ? sorten.find((s) => s.sorteId === gewaehlt[(t.marke as number) - 1])?.name
        : undefined;
      if (t.zustand === 'belegt' || t.zustand === 'reserviert')
        return {
          nr: t.lochNr,
          zustand: t.zustand,
          text: t.zustand === 'belegt' ? 'bel.' : 'res.',
          nichtWaehlbar: true,
        };
      if (!passt(t))
        return {
          nr: t.lochNr,
          zustand: 'frei',
          text: `${t.groesseMm / 10} cm`,
          nichtWaehlbar: true,
          zustandName: `${t.groesseMm / 10} cm, passt nicht`,
        };
      return {
        nr: t.lochNr,
        zustand: t.zustand,
        ...(t.marke && name ? { marke: { ziffer: t.marke, name } } : {}),
      };
    });
    const ohneTopf: Loch[] = zielG
      ? lochbild(zielG.reihen)
          .filter((l) => !toepfeZiel.some((t) => t.lochNr === l.nr))
          .map((l) => ({
            nr: l.nr,
            zustand: 'frei',
            text: '–',
            nichtWaehlbar: true,
            zustandName: 'kein Topf',
          }))
      : [];
    const loecher = [...mitTopf, ...ohneTopf];
    const hinweisUmsetzen =
      zielG && !zielG.direktsaat
        ? gewaehlt
            .map((id) => sorten.find((s) => s.sorteId === id))
            .filter((s) => s && !umsetzenBekannt(teile, s.artId))
            .map((s) => s?.name)
        : [];
    return (
      <main className="hv-seite hv-saeen" data-density="regal">
        {kopf}
        {schrittText}
        <Choice
          label="Zielgefäss"
          zeile
          optionen={ziele.map((z) => ({
            wert: z.platzId,
            titel: z.kennung,
            zusatz: [z.direktsaat ? 'Direktsaat' : '', z.hinweis ?? ''].filter(Boolean).join(' · '),
          }))}
          gewaehlt={zielPlatzId ? [zielPlatzId] : []}
          onWahl={(id) => {
            setZielWahl(id);
            setToepfe(new Map());
          }}
        />
        {zielG ? (
          <>
            {zielG.hinweis ? <Notice kompakt tone="warn" title={zielG.hinweis} /> : null}
            {hinweisUmsetzen.length > 0 ? (
              <Notice
                kompakt
                tone="warn"
                title={`${hinweisUmsetzen.join(', ')}: Umsetzdatum fehlt in der Wissensbasis, Ziel später`}
              />
            ) : null}
            {gewaehlt.length > 1 ? (
              <Choice
                label="Sorte zum Malen"
                zeile
                optionen={gewaehlt.map((id, i) => ({
                  wert: String(i + 1),
                  titel: `S${i + 1} ${sorten.find((s) => s.sorteId === id)?.name ?? ''}`,
                }))}
                gewaehlt={[String(aktiv)]}
                onWahl={(w) => setAktiv(Number(w))}
              />
            ) : null}
            <Deckel
              reihen={zielG.reihen}
              loecher={loecher}
              onLoch={(nr) => {
                const t = toepfeZiel.find((x) => x.lochNr === nr);
                if (t && passt(t) && aktivMalbar) lochTippen(t.netztopfId);
              }}
              onReihe={reiheTippen}
              kanten
            />
            <Button variant="secondary" disabled={!aktivMalbar} onClick={alleFreien}>
              Alle freien wählen
            </Button>
          </>
        ) : null}
        <div className="hv-saeen-fuss">
          <Button variant="secondary" onClick={() => setSchritt(1)}>
            Zurück
          </Button>
          <Button
            variant="secondary"
            disabled={zielG?.direktsaat === true}
            onClick={() => {
              setSpaeter(true);
              setSchritt(3);
            }}
          >
            Ziel später
          </Button>
          <Button
            disabled={!zielG || toepfe.size === 0}
            onClick={() => {
              setSpaeter(false);
              setSchritt(3);
            }}
          >
            Weiter
          </Button>
        </div>
      </main>
    );
  }

  // Schritt 3
  const saetze = vorschlag?.saetze ?? [];
  const boxListe = boxenAus(teile, anlageId);
  const boxVoll = [...new Set(saetze.map((s) => s.box?.platzId).filter((x): x is string => !!x))]
    .map((id) => {
      const neu = saetze.filter((s) => s.box?.platzId === id).reduce((a, s) => a + s.schwaemme, 0);
      const b = boxBelegung(teile, id, neu);
      const kennung = boxListe.find((x) => x.platzId === id)?.kennung ?? '';
      return b.belegt > b.platzzahl ? `${kennung}: ${b.belegt} von ${b.platzzahl} Würfeln` : '';
    })
    .filter(Boolean);
  const menge = (id: string, m: Menge) =>
    teilweise ? undefined : setMengen((alt) => ({ ...alt, [id]: { ...alt[id], ...m } }));

  return (
    <main className="hv-seite hv-saeen" data-density="regal">
      {kopf}
      {schrittText}
      <Stepper
        label="Gesät"
        wert={-rueck}
        min={-30}
        max={0}
        onWert={(w) => (teilweise ? undefined : setRueck(-w))}
        anzeige={(w) => (w === 0 ? `Heute, ${tagKurz(heute)}` : tagKurz(tagPlus(heute, w)))}
      />
      {saetze.map((s) => (
        <SatzKarte
          key={s.sorteId}
          s={s}
          spaeter={(eingabe?.saetze.find((x) => x.sorteId === s.sorteId)?.zieltopfIds.length ?? 0) === 0}
          boxListe={boxListe}
          onBox={(id) => (teilweise ? undefined : setBoxen((alt) => ({ ...alt, [s.sorteId]: id })))}
          zielKennung={zielG?.kennung ?? ''}
          onMenge={(m) => menge(s.sorteId, m)}
        />
      ))}
      {vorschlag?.vorschau.zeilen.map((z) => (
        <p key={z.tag} className="hv-saeen-station">
          {z.text}
        </p>
      ))}
      {vorschlag?.vorschau.warnungen.map((w) => (
        <Notice key={w.text} kompakt tone="warn" title={w.text} />
      ))}
      {boxVoll.map((t) => (
        <Notice key={t} kompakt tone="warn" title={t} />
      ))}
      {vorschlag?.hinweise.map((h) => (
        <Notice key={h} kompakt tone="info" title={h} />
      ))}
      {fehler.length > 0 ? <Notice kompakt tone="danger" title={fehler.join(' · ')} /> : null}
      <div className="hv-saeen-fuss">
        <Button variant="secondary" disabled={teilweise} onClick={() => setSchritt(2)}>
          Zurück
        </Button>
        <Button disabled={sendet || saetze.length === 0} onClick={() => void speichern()}>
          Säen speichern
        </Button>
      </div>
    </main>
  );
}

function umsetzenBekannt(teile: Teile, artId: string | undefined): boolean {
  const art = ((teile?.['art'] ?? []) as { art_id: string; umsetzen_ab_d: number | null }[]).find(
    (a) => a.art_id === artId,
  );
  return art?.umsetzen_ab_d !== null && art?.umsetzen_ab_d !== undefined;
}

function SatzKarte({
  s,
  spaeter,
  zielKennung,
  boxListe,
  onBox,
  onMenge,
}: {
  s: SatzVorschlag;
  spaeter: boolean;
  zielKennung: string;
  boxListe: ReturnType<typeof boxenAus>;
  onBox: (platzId: string) => void;
  onMenge: (m: Menge) => void;
}) {
  const [boxOffen, setBoxOffen] = useState(false);
  const ziel = spaeter ? 'Ziel später' : `${s.zieltoepfe} ${s.zieltoepfe === 1 ? 'Zieltopf' : 'Zieltöpfe'}`;
  const keimrate = s.keimrate
    ? `Keimrate ${zahl2(s.keimrate.p)} (${s.keimrate.herkunft === 'beobachtet' ? 'beobachtet' : s.keimrate.herkunft === 'packung' ? 'Packung' : 'Art'})${
        s.vorschlag.schwammKeimrate !== undefined
          ? ` · Schwamm-Keimrate ${zahl2(s.vorschlag.schwammKeimrate)}`
          : ''
      }`
    : 'Keimrate unbekannt';
  const keim = [s.keimart ? KEIMART[s.keimart] : '', spanne(s.keimtemp, '°C'), spanne(s.keimdauer, 'Tage')]
    .filter(Boolean)
    .join(' · ');
  const deckel =
    s.box?.typ === 'box_dunkel' ? 'Deckel zu' : s.direktsaat && s.keimart === 'dunkel' ? 'abdecken' : '';
  return (
    <section className="hv-card hv-saeen-satz" aria-label={s.name}>
      <p className="hv-saeen-satz-titel">
        {s.name} · {KULTURFORM_NAME[s.kulturform] ?? s.kulturform} · {ziel}
      </p>
      {s.direktsaat ? (
        <p>Direktsaat in {zielKennung}</p>
      ) : (
        <div className="hv-saeen-box">
          <p>{s.box ? `Box ${s.box.kennung} · ${BOXTYP[s.box.typ]}` : 'Keine Anzuchtbox'}</p>
          {boxListe.length > 1 && !boxOffen ? (
            <Button variant="ghost" size="compact" onClick={() => setBoxOffen(true)}>
              Box wechseln
            </Button>
          ) : null}
        </div>
      )}
      {boxOffen ? (
        <Choice
          label={`Anzuchtbox ${s.name}`}
          zeile
          optionen={boxListe.map((b) => ({ wert: b.platzId, titel: `${b.kennung} · ${BOXTYP[b.typ]}` }))}
          gewaehlt={s.box ? [s.box.platzId] : []}
          onWahl={(id) => {
            onBox(id);
            setBoxOffen(false);
          }}
        />
      ) : null}
      {s.box?.hinweis ? <p className="hv-saeen-hinweis">{s.box.hinweis}</p> : null}
      <Stepper
        label="Samen je Schwamm"
        wert={s.samenJeSchwamm}
        min={1}
        max={Math.max(20, s.samenJeSchwamm)}
        onWert={(w) => onMenge({ samen: w })}
        hinweis={`Vorschlag ${s.vorschlag.samenJeSchwamm}`}
      />
      {s.direktsaat ? null : (
        <Stepper
          label="Schwämme"
          wert={s.schwaemme}
          min={Math.max(1, spaeter ? 1 : s.zieltoepfe)}
          max={Math.min(100, Math.max(25, s.schwaemme))}
          onWert={(w) => onMenge({ schwaemme: w })}
          hinweis={`Vorschlag ${s.vorschlag.schwaemme}`}
        />
      )}
      {spaeter ? (
        <Stepper
          label="Pflanzen"
          wert={s.zieltoepfe}
          min={1}
          max={25}
          onWert={(w) => onMenge({ pflanzen: w, schwaemme: undefined })}
        />
      ) : null}
      <p className="hv-saeen-zeile">{keimrate}</p>
      {s.empfehlung && s.empfehlung.pflanzenStehenLassen > 1 ? (
        <p className="hv-saeen-zeile">{s.empfehlung.pflanzenStehenLassen} Pflanzen stehen lassen</p>
      ) : null}
      {keim ? <p className="hv-saeen-zeile">{keim}</p> : null}
      {deckel ? <p className="hv-saeen-zeile">{deckel}</p> : null}
      {!s.direktsaat && s.umsetzenAm ? (
        <p className="hv-saeen-zeile">Umsetzen ab {tagKurz(s.umsetzenAm)}</p>
      ) : null}
    </section>
  );
}
