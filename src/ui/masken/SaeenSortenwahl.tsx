// Säen, Schritt 1 (Plan 205, Entscheid 0023): erst das Gemüse auf einer Kachel, dann die Sorte, dann das Detail mit
// Tütenfoto, Kulturform und Kurzinfo. Mehrfachwahl über «Wählen» und die Zeile «Gewählt», «Wählen und weiter» führt zu Schritt 2; Passung, «Wie letztes
// Mal» und «Nicht empfohlen» wie Plan 36. Regal-Dichte, keine Systemtastatur, keine Wischgesten.
import { useEffect, useMemo } from 'react';
import type { Teile } from '../../domain/anlage/teile.ts';
import type { Einstufung } from '../../domain/passung/passung.ts';
import {
  gemueseGruppen,
  KULTURFORM_NAME,
  sorteDetail,
  type ErnteAngabe,
  type SorteDetail,
  type SorteWahl,
  type Spanne,
} from '../../domain/pflanzung/saeen.ts';
import { Button } from '../bausteine/Button.tsx';
import { Faktenliste } from '../bausteine/Faktenliste.tsx';
import { Kulturform, type KulturformHerkunft } from '../bausteine/Kulturform.tsx';
import { HakenSymbol, PfeilSymbol, Sortenzeile } from '../bausteine/Sortenzeile.tsx';
import { Stufe } from '../bausteine/Stufe.tsx';
import { GemueseKachel } from '../bausteine/Tile.tsx';
import { TuetenfotoAnzeige } from '../TuetenfotoAnzeige.tsx';

export type SortenAnsicht =
  | { typ: 'gemuese' }
  | { typ: 'art'; artId: string }
  | { typ: 'sorte'; sorteId: string; von: 'gemuese' | 'art' };

const KEIMART: Readonly<Record<string, [string, string]>> = {
  licht: ['Lichtkeimer', 'braucht Licht zum Keimen, kommt in die Box für Lichtkeimer'],
  dunkel: ['Dunkelkeimer', 'keimt ohne Licht, kommt in die Box für Dunkelkeimer'],
  indifferent: ['Keimart beliebig', 'keimt mit und ohne Licht'],
};

/** was die Kulturform heisst (Konzept R1.2, Glossar) */
const KULTURFORM_WAS: Readonly<Record<string, string>> = {
  keimling: 'Keimlinge, die Pflanze wird einmal geerntet',
  babyleaf: 'junge Blätter, die Pflanze wird einmal geerntet',
  kopf: 'die ganze Pflanze wächst aus und wird einmal geerntet',
  schnitt: 'du schneidest die äusseren Blätter, die Pflanze wächst nach',
  dauerkultur_blatt: 'die Pflanze bleibt lange stehen, du erntest laufend Blätter',
  dauerkultur_frucht: 'die Pflanze bleibt stehen, du erntest laufend Früchte',
};

const KULTURTYP: Readonly<Record<string, string>> = {
  blatt: 'Blattkultur',
  frucht: 'Fruchtkultur',
  knolle: 'Knollenkultur',
};

const kfName = (k: string) => KULTURFORM_NAME[k] ?? k;
const sortenWort = (n: number) => (n === 1 ? '1 Sorte' : `${String(n)} Sorten`);

/** Bereich mit Halbgeviertstrich (README «Zahlen»), ohne Umbruch im Bereich und vor der Einheit; nur ein Wert: dieser */
export function bereich(s: Spanne, einheit: string): string | undefined {
  const mit = (t: string) => `${t}\u00a0${einheit}`;
  if (s.min !== undefined && s.max !== undefined)
    return mit(s.min === s.max ? String(s.min) : `${String(s.min)}\u2060–\u2060${String(s.max)}`);
  const einer = s.typ ?? s.min ?? s.max;
  return einer === undefined ? undefined : mit(String(einer));
}

/** Erntezeile je Kulturform (Plan 205 A4: «ab etwa Tag n» ohne Bezug) */
export function ernteText(e: ErnteAngabe | undefined): string {
  if (!e) return 'Erntewerte noch offen, kommen mit dem Wissen';
  const teile = [e.einmalig ? 'einmal ernten' : 'mehrmals ernten'];
  if (e.abD !== undefined) teile.push(`erste Ernte ab etwa Tag ${String(e.abD)}`);
  if (e.typischD !== undefined) teile.push(`fertig nach etwa ${String(e.typischD)} Tagen`);
  if (e.abD === undefined && e.typischD === undefined) teile.push('Termine noch offen');
  return teile.join(', ');
}

const datumCh = (tag: string) => {
  const [j, m, t] = tag.split('-');
  return j && m && t ? `${String(Number(t))}.${String(Number(m))}.${j}` : tag;
};

/** gemeinsame Angaben eines Gemüses: nur wenn alle Sorten gleich sind */
function gemeinsam(sorten: readonly SorteWahl[]): string | undefined {
  const text = (s: SorteWahl) =>
    [
      s.keimart ? (KEIMART[s.keimart]?.[0] ?? s.keimart) : 'Keimart offen',
      bereich(s.keimtemp, '°C'),
      s.keimdauer.min !== undefined || s.keimdauer.typ !== undefined
        ? `keimt in ${bereich(s.keimdauer, 'Tagen') ?? ''}`
        : 'Keimdauer offen',
    ]
      .filter(Boolean)
      .join(' · ');
  const texte = new Set(sorten.map(text));
  return texte.size === 1 ? [...texte][0] : undefined;
}

export function SaeenSortenwahl({
  teile,
  sorten,
  ansicht,
  setAnsicht,
  gewaehlt,
  umschalten,
  kulturformVon,
  setKulturform,
  stufe,
  passungText,
  nichtEmpfohlen,
  nichtOffen,
  setNichtOffen,
  weiter,
}: {
  teile: Teile;
  /** Sorten in Anzeigereihenfolge (Passung oder «Wie letztes Mal» zuerst) */
  sorten: readonly SorteWahl[];
  ansicht: SortenAnsicht;
  setAnsicht: (a: SortenAnsicht) => void;
  gewaehlt: readonly string[];
  umschalten: (sorteId: string) => void;
  kulturformVon: (s: SorteWahl) => string;
  setKulturform: (sorteId: string, form: string) => void;
  stufe: (sorteId: string) => Einstufung | undefined;
  passungText: (sorteId: string) => string;
  /** Sorten mit «Nicht empfohlen» (Plan 36): eingeklappt, gewählte bleiben sichtbar (UC5-AK13) */
  nichtEmpfohlen: readonly string[];
  nichtOffen: boolean;
  setNichtOffen: (offen: boolean) => void;
  /** zu Schritt 2 */
  weiter: () => void;
}) {
  const details = useMemo(() => {
    const m = new Map<string, SorteDetail | undefined>();
    for (const s of sorten) m.set(s.sorteId, sorteDetail(teile, s.sorteId));
    return m;
  }, [teile, sorten]);
  const sichtbar = (s: SorteWahl) =>
    nichtOffen || !nichtEmpfohlen.includes(s.sorteId) || gewaehlt.includes(s.sorteId);
  const versteckt = sorten.filter((s) => !sichtbar(s));
  const gruppen = gemueseGruppen(
    sorten.filter(sichtbar),
    gewaehlt,
    sorten.flatMap((s, i) => {
      const st = stufe(s.sorteId);
      return st ? [{ sorteId: s.sorteId, rang: i, passung: { einstufung: st } }] : [];
    }),
  );

  // jede Ansicht beginnt oben (Regal: kein Suchen nach dem Anfang)
  const schluessel =
    ansicht.typ === 'gemuese' ? 'g' : ansicht.typ === 'art' ? ansicht.artId : ansicht.sorteId;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [schluessel]);

  const nichtEmpfohlenKnopf = (n: number) =>
    n > 0 ? (
      <Button variant="secondary" block onClick={() => setNichtOffen(true)}>
        {`Nicht empfohlen (${String(n)}) anzeigen`}
      </Button>
    ) : null;

  const zusatzVon = (s: SorteWahl): string => {
    if (gewaehlt.includes(s.sorteId)) return `gewählt · ${kfName(kulturformVon(s))}`;
    const d = details.get(s.sorteId);
    return [
      passungText(s.sorteId),
      s.wieLetztesMal ? `Wie letztes Mal: ${kfName(s.wieLetztesMal)}` : '',
      s.keimdauer.min !== undefined || s.keimdauer.typ !== undefined
        ? `keimt in ${bereich(s.keimdauer, 'Tagen') ?? ''}`
        : s.keimart
          ? (KEIMART[s.keimart]?.[0] ?? '')
          : '',
      d?.vollstaendig === false ? 'Wissen unvollständig' : '',
    ]
      .filter(Boolean)
      .join(' · ');
  };

  // Plan 205 A7: eine Textzeile statt Knöpfen, damit alle Kacheln ohne Scrollen sichtbar bleiben (SW1-AK6);
  // abgewählt wird im Detail der Sorte
  const leiste =
    gewaehlt.length > 0 ? (
      <p className="hv-saeen-gewaehlt" aria-label="Gewählte Sorten">
        <HakenSymbol />
        <span>
          {`Gewählt: ${gewaehlt
            .flatMap((id) => {
              const s = sorten.find((x) => x.sorteId === id);
              return s ? [`${s.name} (${kfName(kulturformVon(s))})`] : [];
            })
            .join(', ')}`}
        </span>
      </p>
    ) : null;

  function waehlen(s: SorteWahl, von: 'gemuese' | 'art') {
    if (!gewaehlt.includes(s.sorteId)) umschalten(s.sorteId);
    // A1: zurück zur Sortenliste, wenn das Gemüse weitere Sorten hat (mehrere Salate, Anzucht-AK1)
    const weitere = sorten.filter(sichtbar).filter((x) => x.artId === s.artId).length > 1;
    setAnsicht(von === 'art' && weitere ? { typ: 'art', artId: s.artId } : { typ: 'gemuese' });
  }

  if (ansicht.typ === 'sorte') {
    const s = sorten.find((x) => x.sorteId === ansicht.sorteId);
    if (!s) return null;
    const d = details.get(s.sorteId);
    const an = gewaehlt.includes(s.sorteId);
    const form = kulturformVon(s);
    const basis = s.wieLetztesMal ?? s.vorgabe;
    const herkunft: KulturformHerkunft =
      form !== basis ? 'geaendert' : s.wieLetztesMal ? 'letztes_mal' : 'vorgabe';
    const saat = d?.saat[form as keyof SorteDetail['saat']];
    const keim = s.keimart ? KEIMART[s.keimart] : undefined;
    const st = stufe(s.sorteId);
    const grund = passungText(s.sorteId);
    const zurueck = ansicht.von === 'art' ? `Zurück zu ${s.artName ?? s.artId}` : 'Zurück zu allen Gemüsen';
    return (
      <>
        <Button
          variant="ghost"
          size="compact"
          className="hv-saeen-zurueck"
          onClick={() =>
            setAnsicht(ansicht.von === 'art' ? { typ: 'art', artId: s.artId } : { typ: 'gemuese' })
          }
        >
          <PfeilSymbol richtung="links" className="hv-btn-icon" />
          {zurueck}
        </Button>
        <TuetenfotoAnzeige sorteId={s.sorteId} />
        <div className="hv-saeen-sortekopf">
          <p className="hv-saeen-sortegemuese">
            {s.artName ?? s.artId} · {KULTURTYP[s.kulturtyp] ?? s.kulturtyp}
          </p>
          <h2 className="hv-saeen-sortetitel">{s.name}</h2>
          {d?.nameWiss ? <p className="hv-saeen-sortewiss">{d.nameWiss}</p> : null}
          {st ? (
            <p className="hv-saeen-zeile">
              <Stufe einstufung={st} /> {grund}
            </p>
          ) : null}
        </div>
        <Kulturform
          form={form}
          formen={s.kulturformen}
          vorgabe={s.vorgabe}
          herkunft={herkunft}
          name={kfName}
          was={(k) => KULTURFORM_WAS[k] ?? kfName(k)}
          ernte={(k) => ernteText(d?.ernte[k as keyof SorteDetail['ernte']])}
          onWahl={(k) => setKulturform(s.sorteId, k)}
        />
        <Faktenliste
          label={`Kurzinfo ${s.name}`}
          zeilen={[
            keim ? { begriff: 'Keimung', wert: keim[0], erklaerung: keim[1] } : { begriff: 'Keimung' },
            {
              begriff: 'Keimtemperatur',
              wert: bereich(s.keimtemp, '°C'),
              ...(s.keimtemp.typ !== undefined && s.keimtemp.min !== s.keimtemp.max
                ? { erklaerung: `meist ${String(s.keimtemp.typ)} °C` }
                : {}),
            },
            {
              begriff: 'Keimdauer',
              wert: bereich(s.keimdauer, 'Tage'),
              ...(s.keimdauer.typ !== undefined && s.keimdauer.min !== s.keimdauer.max
                ? { erklaerung: `meist ${String(s.keimdauer.typ)} Tage` }
                : {}),
            },
            saat
              ? {
                  begriff: 'Saatmenge',
                  wert: `${String(saat.samenJeSchwamm)} Samen je Schwamm`,
                  erklaerung: `${saat.pflanzenStehenLassen === 1 ? '1 Pflanze' : `${String(saat.pflanzenStehenLassen)} Pflanzen`} stehen lassen, für ${kfName(form)}`,
                }
              : { begriff: 'Saatmenge', offen: 'noch offen, kommt mit dem Wissen' },
            d?.umsetzenAbD !== undefined
              ? { begriff: 'Umsetzen', wert: `ab Tag ${String(d.umsetzenAbD)} nach der Saat` }
              : { begriff: 'Umsetzen', offen: 'keine Angabe' },
            d?.packung
              ? {
                  begriff: 'Packung',
                  // Plan 215 A10: kein Bestand in Korn mehr (Tims Wunsch, Entscheid 0025)
                  wert: d.packung.kaufdatum ? `gekauft ${datumCh(d.packung.kaufdatum)}` : 'erfasst',
                }
              : { begriff: 'Packung', offen: 'keine Packung erfasst' },
            d?.bezug ? { begriff: 'Bezug', wert: d.bezug } : { begriff: 'Bezug', offen: 'keine Angabe' },
            d?.vollstaendig === undefined
              ? { begriff: 'Wissen', offen: 'nicht bekannt' }
              : {
                  begriff: 'Wissen',
                  wert: <span className="hv-badge">{d.vollstaendig ? 'vollständig' : 'unvollständig'}</span>,
                  ...(!d.vollstaendig && d.fehlend
                    ? { erklaerung: `${String(d.fehlend)} Angaben fehlen noch` }
                    : {}),
                },
          ]}
        />
        <div className="hv-saeen-fuss">
          {/* Plan 205 A6: «Wählen und weiter» spart den Tipp auf «Weiter» (UC5-AK1 höchstens 14 Berührungen) */}
          {an ? (
            <>
              <Button variant="secondary" onClick={() => umschalten(s.sorteId)}>
                Abwählen
              </Button>
              <Button onClick={weiter}>Weiter</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => waehlen(s, ansicht.von)}>
                Wählen
              </Button>
              <Button
                onClick={() => {
                  if (!gewaehlt.includes(s.sorteId)) umschalten(s.sorteId);
                  weiter();
                }}
              >
                Wählen und weiter
              </Button>
            </>
          )}
        </div>
      </>
    );
  }

  if (ansicht.typ === 'art') {
    const alle = sorten.filter((s) => s.artId === ansicht.artId);
    const liste = alle.filter(sichtbar);
    const name = alle[0]?.artName ?? ansicht.artId;
    const zusammen = gemeinsam(alle);
    return (
      <>
        {leiste}
        <Button
          variant="ghost"
          size="compact"
          className="hv-saeen-zurueck"
          onClick={() => setAnsicht({ typ: 'gemuese' })}
        >
          <PfeilSymbol richtung="links" className="hv-btn-icon" />
          Alle Gemüse
        </Button>
        <div className="hv-saeen-gemuesekopf">
          <h2>{name}</h2>
          {zusammen ? <p>{`Für alle ${sortenWort(alle.length)}: ${zusammen}`}</p> : null}
        </div>
        <div className="hv-saeen-liste" role="group" aria-label={`Sorten ${name}`}>
          {liste.map((s) => (
            <Sortenzeile
              key={s.sorteId}
              titel={s.name}
              zusatz={zusatzVon(s)}
              gewaehlt={gewaehlt.includes(s.sorteId)}
              {...(stufe(s.sorteId) ? { stufe: stufe(s.sorteId) as Einstufung } : {})}
              onClick={() => setAnsicht({ typ: 'sorte', sorteId: s.sorteId, von: 'art' })}
            />
          ))}
        </div>
        {nichtEmpfohlenKnopf(alle.length - liste.length)}
      </>
    );
  }

  return (
    <>
      {leiste}
      <div className="hv-gemuese-raster" role="group" aria-label="Gemüse" lang="de">
        {gruppen.map((g) => (
          <GemueseKachel
            key={g.artId}
            name={g.name}
            sorten={g.sorten.length}
            sortenGesamt={sorten.filter((s) => s.artId === g.artId).length}
            gewaehlt={g.gewaehlt}
            {...(g.stufe ? { stufe: g.stufe } : {})}
            onClick={() => {
              const einzige = g.sorten.length === 1 ? g.sorten[0] : undefined;
              setAnsicht(
                einzige
                  ? { typ: 'sorte', sorteId: einzige.sorteId, von: 'gemuese' }
                  : { typ: 'art', artId: g.artId },
              );
            }}
          />
        ))}
      </div>
      {nichtEmpfohlenKnopf(versteckt.length)}
    </>
  );
}
