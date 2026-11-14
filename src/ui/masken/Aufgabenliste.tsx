// Aufgaben in Heute (Plan 27, Plan 30): die fälligen Aufgaben aus faelligeAufgaben() als Ortskarten in Laufweg-
// Reihenfolge (heuteKarten()), darüber die Hervorhebung «Ausserhalb» ohne Umsortieren und der Hinweis «Daten
// unvollständig»; Aufgaben ohne Ort (pH-Kontrolle, Stromausfall an der Anlage) in der Liste «Aufgaben». Knöpfe
// «Morgen», «Überspringen», «Pegel ok», «Erledigt» nur, wo das Modul sie erlaubt; sie schreiben über schreiben() (11.4),
// danach lädt das Bündel neu. Bis dahin blendet die Liste die gedrückte Aufgabe aus. Umsetzen bleibt in der eigenen
// Liste aus Plan 33, das Messgerät im Kopf der Übersicht. UX2 (Plan 224): jede Aktion meldet sich in der Meldezeile mit
// «Rückgängig machen» (Storno über schreiben()); nach einem Erfolg bleiben die Tasten 400 ms gesperrt (U13), damit ein
// Doppeltipper nicht die nachgerückte Zeile trifft.
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { rueckgaengigVorgang, type Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { einstellungenAus, fehlendeTeile, naechsteAufgabe, type Aufgabe } from '../../domain/aufgaben.ts';
import { ANDERSWO, aufgabeZiel } from '../../domain/aufgaben-folge.ts';
import { ausserhalbOrte, heuteKarten } from '../../domain/rundgang/heute.ts';
import { aufschubVorgang, deckelVorgang, erledigtVorgang } from '../../domain/aufgaben-aufschub.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { useMelden } from '../meldung.tsx';
import { hashZu, type Route } from '../router.ts';
import { startzeitMerken } from '../startzeit.ts';
import '../rundgang.css';

const SPERRE_MS = 400;
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

const TASTE: Record<string, string> = {
  keimung: 'Prüfen',
  pruefen: 'Prüfen',
  messen: 'Messen',
  ansatz: 'Ansetzen',
};

/**
 * Ziel je Typ aus aufgabeZiel() (dieselbe Route wie «Nächste Aufgabe», Plan 224): Maske der Erfassung («Messen»,
 * «Prüfen», «Ansetzen»), sonst «Öffnen» für die Maske des Orts, auch bei Aufgaben mit eigener Taste in Heute
 */
function ziel(a: Aufgabe): { route: Route; text: string } | undefined {
  const z = aufgabeZiel(a);
  if (z) return { route: z, text: TASTE[z.name] ?? 'Öffnen' };
  return a.ort ? { route: { name: 'gefaess', code: a.ort.code }, text: 'Öffnen' } : undefined;
}

/** Text der Meldung: was gespeichert wurde, mit Aufgabe und Ort (Plan 224 A3) */
function meldungText(a: Aufgabe, aktion: Aktion): string {
  const ort = a.ort ? ` ${a.ort.code}` : '';
  if (aktion === 'deckel')
    return `${a.typ === 'deckel_oeffnen' ? 'Deckel geöffnet' : 'Abdeckung entfernt'}:${ort}`;
  const vorsatz =
    aktion === 'erledigt'
      ? 'Erledigt'
      : aktion === 'morgen'
        ? 'Auf morgen verschoben'
        : aktion === 'ueberspringen'
          ? 'Übersprungen'
          : 'Pegel ok gespeichert';
  return `${vorsatz}: ${a.titel}${ort}`;
}

type Aktion = 'erledigt' | 'deckel' | 'morgen' | 'ueberspringen' | 'pegel_ok';

export function Aufgabenliste({ jetzt, faellig }: { jetzt: Date; faellig: readonly Aufgabe[] }) {
  const { buendel } = useBuendel();
  const melden = useMelden();
  const [weg, setWeg] = useState<ReadonlySet<string>>(new Set());
  // «Pegel ok» bis zum neuen Bündel nur einmal je Schlüssel (Prüfer Sicherheit Runde 1, Hinweis 3)
  const [pegel, setPegel] = useState<ReadonlySet<string>>(new Set());
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);
  const teile = buendel?.teile;
  if (!teile) return null;
  const einstellungen = einstellungenAus(teile);
  // einmal je Render in Heute gerechnet (Prüfer Runde 1 Befund 10)
  const alle = faellig.filter((a) => !weg.has(a.schluessel));
  const liste = alle.filter((a) => !ANDERSWO.has(a.typ));
  const karten = heuteKarten(teile, liste);
  const ohneOrt = liste.filter((a) => !a.ort);
  // auch Aufgaben an der Anlage mit Gewicht ausserhalb (Stromausfall, Prüfer Runde 1 Befund 9)
  const ausserhalb = [
    ...ohneOrt.filter((a) => a.gewicht === 'ausserhalb').map((a) => a.titel),
    ...ausserhalbOrte(karten),
  ];
  const fehlt = fehlendeTeile(teile);
  startzeitMerken();

  /** «Pegel ok» blendet nicht aus (gilt einen Tag, keine Erledigung, A7) */
  async function senden(a: Aufgabe, aktion: Aktion, vorgang: Vorgang) {
    if (sperre.current || vorgang.length === 0) return;
    sperre.current = true;
    setSendet(true);
    let ok = false;
    try {
      const r = await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      ok = true;
      setFehler(undefined);
      const merken = aktion === 'pegel_ok' ? setPegel : setWeg;
      merken((alt) => new Set([...alt, a.schluessel]));
      melden({
        text: meldungText(a, aktion),
        rueckgaengig: rueckgaengigVorgang(vorgang),
        // nach dem Storno steht die Zeile bzw. die Taste wieder da, auch bevor das Bündel neu geladen ist
        nachRueckgaengig: () => merken((alt) => new Set([...alt].filter((s) => s !== a.schluessel))),
      });
    } finally {
      const frei = () => {
        sperre.current = false;
        setSendet(false);
      };
      // nach Erfolg noch 400 ms gesperrt: die nachgerückte Zeile liegt unter dem Finger (U13)
      if (ok) setTimeout(frei, SPERRE_MS);
      else frei();
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
    // UX1 (Plan 223): die Aktion der Aufgabe steht zuerst und ist betont; «Öffnen» ist nur dann der betonte Weg,
    // wenn die Aufgabe keine eigene Aktion hat (Kurzprüfung, pH-Kontrolle; A2)
    const maske = z && z.text !== 'Öffnen' ? z : undefined;
    const oeffnen = z && !maske ? z : undefined;
    const haupt =
      a.typ === 'deckel_oeffnen' || a.typ === 'abdeckung_entfernen' ? (
        <Button
          variant="secondary"
          disabled={sendet}
          onClick={() => void senden(a, 'deckel', deckelVorgang(a, neueClientId(), uhrJetzt()))}
        >
          {a.typ === 'deckel_oeffnen' ? 'Deckel geöffnet' : 'Abdeckung entfernt'}
        </Button>
      ) : a.erledigtKnopf ? (
        <Button
          variant="secondary"
          disabled={sendet}
          onClick={() => void senden(a, 'erledigt', erledigtVorgang(a, neueClientId(), uhrJetzt()))}
        >
          Erledigt
        </Button>
      ) : maske ? (
        <a className="hv-btn hv-btn-secondary" href={hashZu(maske.route)}>
          {maske.text}
        </a>
      ) : null;
    return (
      <li key={a.schluessel} className="hv-aufgabe hv-aufgabe-umbruch" data-gewicht={a.gewicht}>
        {/* der Ort steht im Kopf der Ortskarte, nicht in jeder Zeile */}
        <span className="hv-aufgabe-text">
          {a.titel}
          <br />
          <small>
            {a.grund}
            {hinweis ? ` · ${hinweis}` : ''}
          </small>
        </span>
        <span className="hv-aufgabe-knoepfe">
          {haupt}
          {oeffnen && !haupt ? (
            <a className="hv-btn hv-btn-secondary" href={hashZu(oeffnen.route)}>
              {oeffnen.text}
            </a>
          ) : null}
          {a.morgen.erlaubt ? (
            <Button
              variant="ghost"
              disabled={sendet}
              onClick={() =>
                void senden(a, 'morgen', aufschubVorgang(a, 'morgen', neueClientId(), uhrJetzt(), ZEITZONE))
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
                void senden(
                  a,
                  'ueberspringen',
                  aufschubVorgang(a, 'ueberspringen', neueClientId(), uhrJetzt(), ZEITZONE),
                )
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
                void senden(
                  a,
                  'pegel_ok',
                  aufschubVorgang(a, 'pegel_ok', neueClientId(), uhrJetzt(), ZEITZONE),
                )
              }
            >
              Pegel ok
            </Button>
          ) : null}
          {oeffnen && haupt ? (
            <a className="hv-btn hv-btn-ghost" href={hashZu(oeffnen.route)}>
              {oeffnen.text}
            </a>
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
