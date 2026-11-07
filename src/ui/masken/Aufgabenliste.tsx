// Aufgaben in Heute (Plan 27, Plan 30): die fälligen Aufgaben aus faelligeAufgaben() als Ortskarten in Laufweg-
// Reihenfolge (heuteKarten()), darüber die Hervorhebung «Ausserhalb» ohne Umsortieren und der Hinweis «Daten
// unvollständig»; Aufgaben ohne Ort (pH-Kontrolle, Stromausfall an der Anlage) in der Liste «Aufgaben». Knöpfe
// «Morgen», «Überspringen», «Pegel ok», «Erledigt» nur, wo das Modul sie erlaubt; sie schreiben über schreiben() (11.4),
// danach lädt das Bündel neu. Bis dahin blendet die Liste die gedrückte Aufgabe aus. Umsetzen bleibt in der eigenen
// Liste aus Plan 33, das Messgerät im Kopf der Übersicht.
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import {
  einstellungenAus,
  faelligeAufgaben,
  fehlendeTeile,
  naechsteAufgabe,
  type Aufgabe,
  type AufgabenArt,
} from '../../domain/aufgaben.ts';
import { ausserhalbOrte, heuteKarten } from '../../domain/rundgang/heute.ts';
import { aufschubVorgang, deckelVorgang, erledigtVorgang } from '../../domain/aufgaben-aufschub.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu, type Route } from '../router.ts';
import { startzeitMerken } from '../startzeit.ts';
import '../rundgang.css';

/** in eigener Anzeige: Umsetzen (Plan 33, «Wie geplant umsetzen»), Kalibrieren (Kopf «Messgerät») */
const ANDERSWO: ReadonlySet<AufgabenArt> = new Set<AufgabenArt>(['umsetzen', 'kalibrieren']);
const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
const uhrJetzt = () => new Date(Date.now());

/** Aufgaben ohne Absturz der Maske: ein Fehler der Rechnung zeigt Heute ohne Liste und meldet ihn in der Konsole */
export function aufgabenSicher<T>(rechnen: () => T, sonst: T): T {
  try {
    return rechnen();
  } catch (fehler) {
    console.error('Aufgaben-Rechnung', fehler);
    return sonst;
  }
}

function wochentag(tag: string): string {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  return WOCHENTAG[new Date(Date.UTC(j, m - 1, d)).getUTCDay()] ?? '';
}

/** Hauptknopf je Typ: Maske der Erfassung, sonst die Maske des Orts */
function ziel(a: Aufgabe): { route: Route; text: string } | undefined {
  const code = a.ort?.code;
  if (a.typ === 'keimung_pruefen') return { route: { name: 'keimung', satz: a.bezug }, text: 'Prüfen' };
  if (a.typ === 'ph_kontrolle') return { route: { name: 'kalibrieren' }, text: 'Öffnen' };
  if (!code) return undefined;
  if (a.typ === 'gefaess_pruefen') return { route: { name: 'pruefen', code }, text: 'Prüfen' };
  if (['messen_nachfuellen', 'messen', 'kontrolle_folgetag', 'waerme_pruefen'].includes(a.typ))
    return { route: { name: 'messen', code }, text: 'Messen' };
  if (a.typ === 'loesung_wechseln' || a.typ === 'ansatz')
    return { route: { name: 'ansatz', code }, text: 'Ansetzen' };
  return { route: { name: 'gefaess', code }, text: 'Öffnen' };
}

export function Aufgabenliste({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const [weg, setWeg] = useState<ReadonlySet<string>>(new Set());
  // «Pegel ok» bis zum neuen Bündel nur einmal je Schlüssel (Prüfer Sicherheit Runde 1, Hinweis 3)
  const [pegel, setPegel] = useState<ReadonlySet<string>>(new Set());
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  const teile = buendel?.teile;
  if (!teile) return null;
  const einstellungen = einstellungenAus(teile);
  const alle = aufgabenSicher(() => faelligeAufgaben(teile, einstellungen, jetzt, ZEITZONE), []).filter(
    (a) => !weg.has(a.schluessel),
  );
  const liste = alle.filter((a) => !ANDERSWO.has(a.typ));
  const karten = heuteKarten(teile, liste);
  const ohneOrt = liste.filter((a) => !a.ort);
  const ausserhalb = ausserhalbOrte(karten);
  const fehlt = fehlendeTeile(teile);
  startzeitMerken();

  /** «Pegel ok» blendet nicht aus (gilt einen Tag, keine Erledigung, A7) */
  async function senden(a: Aufgabe, vorgang: Vorgang, ausblenden = true) {
    if (sperre.current || vorgang.length === 0) return;
    sperre.current = true;
    setSendet(true);
    try {
      const r = await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      setFehler(undefined);
      if (ausblenden) setWeg((alt) => new Set([...alt, a.schluessel]));
      else setPegel((alt) => new Set([...alt, a.schluessel]));
    } finally {
      sperre.current = false;
      setSendet(false);
    }
  }

  if (alle.length === 0) {
    const n = aufgabenSicher(() => naechsteAufgabe(teile, einstellungen, jetzt, ZEITZONE), undefined);
    return (
      <p className="hv-aufgaben-leer">
        {n
          ? `Heute nichts zu tun · nächste: ${wochentag(n.anzeigeAb)}, ${n.titel}${n.ort ? ` ${n.ort.kennung}` : ''}`
          : 'Heute nichts zu tun'}
      </p>
    );
  }
  const zeile = (a: Aufgabe) => {
    const z = ziel(a);
    const hinweis = a.hinweis === 'mitmarkiert' ? 'Pumpe mitmarkiert' : a.hinweis;
    return (
      <li key={a.schluessel} className="hv-aufgabe hv-aufgabe-umbruch" data-gewicht={a.gewicht}>
        <span className="hv-aufgabe-text">
          {a.titel}
          {a.ort ? ` · ${a.ort.code}` : ''}
          <br />
          <small>
            {a.grund}
            {hinweis ? ` · ${hinweis}` : ''}
          </small>
        </span>
        <span className="hv-aufgabe-knoepfe">
          {z ? (
            <a className="hv-btn hv-btn-secondary" href={hashZu(z.route)}>
              {z.text}
            </a>
          ) : null}
          {a.morgen.erlaubt ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() =>
                void senden(a, aufschubVorgang(a, 'morgen', neueClientId(), uhrJetzt(), ZEITZONE))
              }
            >
              Morgen
            </Button>
          ) : null}
          {a.ueberspringen ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() =>
                void senden(a, aufschubVorgang(a, 'ueberspringen', neueClientId(), uhrJetzt(), ZEITZONE))
              }
            >
              Überspringen
            </Button>
          ) : null}
          {a.pegelOk && !pegel.has(a.schluessel) ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() =>
                void senden(a, aufschubVorgang(a, 'pegel_ok', neueClientId(), uhrJetzt(), ZEITZONE), false)
              }
            >
              Pegel ok
            </Button>
          ) : null}
          {a.erledigtKnopf ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() => void senden(a, erledigtVorgang(a, neueClientId(), uhrJetzt()))}
            >
              Erledigt
            </Button>
          ) : null}
          {a.typ === 'deckel_oeffnen' || a.typ === 'abdeckung_entfernen' ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() => void senden(a, deckelVorgang(a, neueClientId(), uhrJetzt()))}
            >
              {a.typ === 'deckel_oeffnen' ? 'Deckel geöffnet' : 'Abdeckung entfernt'}
            </Button>
          ) : null}
        </span>
      </li>
    );
  };

  return (
    <>
      {fehlt.length > 0 ? (
        <Notice
          kompakt
          tone="warn"
          title="Daten unvollständig"
          action={
            <Button variant="secondary" size="compact" onClick={() => window.location.reload()}>
              Neu laden
            </Button>
          }
        >
          Es fehlen Teile der Daten, Heute zeigt vielleicht zu wenige Aufgaben.
        </Notice>
      ) : null}
      {fehler ? <Notice tone="warn" title={fehler} /> : null}
      {ausserhalb.length > 0 ? (
        <Notice
          tone="danger"
          title={`Ausserhalb: ${ausserhalb.join(', ')}`}
          action={<StatusBadge tone="danger" />}
        />
      ) : null}
      {ohneOrt.length > 0 ? (
        <ul className="hv-aufgaben" aria-label="Aufgaben">
          {ohneOrt.map(zeile)}
        </ul>
      ) : null}
      {karten.map((k) => {
        const aufgaben = k.aufgaben.filter((a) => !weg.has(a.schluessel));
        if (aufgaben.length === 0) return null;
        return (
          <section key={k.platzId} className="hv-ortskarte" aria-label={k.code}>
            <h2 className="hv-ortskarte-kopf">
              {k.code}
              {k.ausserhalb ? <StatusBadge tone="danger" /> : null}
            </h2>
            <ul className="hv-aufgaben">{aufgaben.map(zeile)}</ul>
          </section>
        );
      })}
    </>
  );
}
