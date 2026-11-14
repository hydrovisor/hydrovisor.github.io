// Aufgabenzeile für Heute und die Maske Gefäss (Plan 225 Entscheid 6; design-system/components/Aufgabenzeile.md): Titel,
// Grund bzw. Fragen der Kurzprüfung und die Tasten aus aufgabenTasten(). Der Hook hält den Zustand der Liste: gedrückte
// Zeilen bis zum neuen Bündel ausgeblendet, Sperre während des Sendens und 400 ms danach (U13), Meldung mit «Rückgängig
// machen» über die Meldezeile (Plan 224). Geschrieben wird nur über schreiben() (11.4).
import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { neueClientId, schreiben } from '../daten/schreiben.ts';
import { aufschubVorgang, deckelVorgang, erledigtVorgang } from '../domain/aufgaben-aufschub.ts';
import { aufgabenTasten, type Aktion } from '../domain/aufgaben-tasten.ts';
import type { Aufgabe } from '../domain/aufgaben.ts';
import { rueckgaengigVorgang, type Vorgang } from '../domain/datenpfad/erfassung.ts';
import { KURZ_ABWEICHUNG } from '../domain/rundgang/abweichung.ts';
import { HAUPTPUNKTE, ortKurzpruefung, pruefFragen, pruefVorgang } from '../domain/rundgang/kurzpruefung.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { Button } from './bausteine/Button.tsx';
import { useBuendel } from './buendel.tsx';
import { useMelden } from './meldung.tsx';
import { hashZu } from './router.ts';

const SPERRE_MS = 400;
const uhrJetzt = () => new Date(Date.now());

/** Text der Meldung: was gespeichert wurde, mit Aufgabe und Ort (Plan 224 A3, Plan 225 Entscheid 8) */
function meldungText(a: Aufgabe, aktion: Aktion): string {
  const ort = a.ort ? ` ${a.ort.code}` : '';
  if (aktion === 'deckel')
    return `${a.typ === 'deckel_oeffnen' ? 'Deckel geöffnet' : 'Abdeckung entfernt'}:${ort}`;
  if (aktion === 'pruefung_ok') return `${a.typ === 'wurzeln_pruefen' ? 'Wurzeln' : 'Kurzprüfung'} ok:${ort}`;
  if (aktion === 'pruefung_auffaellig')
    return `Wurzeln auffällig:${ort} · ${KURZ_ABWEICHUNG['wurzeln']?.massnahme ?? 'Wurzeln prüfen'}`;
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

export interface AufgabenAktionen {
  /** bis zum neuen Bündel ausgeblendete Aufgaben (Schlüssel) */
  weg: ReadonlySet<string>;
  /** «Pegel ok» bis zum neuen Bündel nur einmal je Schlüssel */
  pegel: ReadonlySet<string>;
  fehler: string | undefined;
  sendet: boolean;
  /** Fragen der Kurzprüfung je Schlüssel: was «Alles ok» bestätigt (A3) */
  fragen: ReadonlyMap<string, string>;
  ausfuehren: (a: Aufgabe, aktion: Aktion) => void;
}

/**
 * Zustand und Schreibweg der Aufgabenzeilen. `faellig` ist die ganze Liste von Heute (auch in der Maske Gefäss): die
 * Kurzprüfung eines Orts rechnet daraus die Ebene wie der Rundgang.
 */
export function useAufgabenAktionen(faellig: readonly Aufgabe[], jetzt: Date): AufgabenAktionen {
  const { buendel } = useBuendel();
  const melden = useMelden();
  const teile = buendel?.teile;
  const [weg, setWeg] = useState<ReadonlySet<string>>(new Set());
  const [pegel, setPegel] = useState<ReadonlySet<string>>(new Set());
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const sperre = useRef(false);

  const fragen = useMemo(() => {
    const m = new Map<string, string>();
    if (!teile) return m;
    for (const a of faellig) {
      if (a.typ !== 'kurzpruefung' || !a.ort) continue;
      try {
        const ebene = ortKurzpruefung(teile, faellig, a.ort.platzId, jetzt, ZEITZONE, HAUPTPUNKTE);
        if (ebene && ebene.kurzpruefung.length > 0) m.set(a.schluessel, pruefFragen(ebene));
      } catch (f) {
        console.error('Kurzprüfung', f);
      }
    }
    return m;
  }, [teile, faellig, jetzt]);

  function vorgangFuer(a: Aufgabe, aktion: Aktion): Vorgang {
    const t = uhrJetzt();
    if (aktion === 'erledigt') return erledigtVorgang(a, neueClientId(), t);
    if (aktion === 'deckel') return deckelVorgang(a, neueClientId(), t);
    if (aktion === 'pruefung_ok' || aktion === 'pruefung_auffaellig')
      return teile
        ? pruefVorgang(
            teile,
            faellig,
            a,
            aktion === 'pruefung_ok' ? 'ok' : 'auffaellig',
            neueClientId,
            t,
            ZEITZONE,
          )
        : [];
    return aufschubVorgang(a, aktion, neueClientId(), t, ZEITZONE);
  }

  /** «Pegel ok» blendet nicht aus (gilt einen Tag, keine Erledigung, A7) */
  async function senden(a: Aufgabe, aktion: Aktion) {
    if (sperre.current) return;
    const vorgang = vorgangFuer(a, aktion);
    if (vorgang.length === 0) {
      // die Aufgabe ist inzwischen erledigt oder bietet die Aktion nicht mehr an: sagen statt schweigen
      setFehler('Nicht mehr fällig, Heute neu laden');
      return;
    }
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

  return { weg, pegel, fehler, sendet, fragen, ausfuehren: (a, aktion) => void senden(a, aktion) };
}

export function Aufgabenzeile({
  a,
  wo,
  aktionen,
}: {
  a: Aufgabe;
  wo: 'heute' | 'gefaess';
  aktionen: AufgabenAktionen;
}) {
  const { sendet } = aktionen;
  const hinweis = a.hinweis === 'mitmarkiert' ? 'Pumpe mitmarkiert' : a.hinweis;
  // solange gesendet wird und 400 ms danach sind auch die Links ohne Wirkung: ein Doppeltipper auf die nachgerückte
  // Zeile wechselt sonst die Maske und beendet die Meldung samt «Rückgängig machen» (U13)
  const linkSperre = sendet
    ? { 'aria-disabled': true, onClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault() }
    : {};
  const unter = aktionen.fragen.get(a.schluessel) ?? `${a.grund}${hinweis ? ` · ${hinweis}` : ''}`;
  return (
    <li className="hv-aufgabe hv-aufgabe-umbruch" data-gewicht={a.gewicht}>
      {/* in Heute steht der Ort im Kopf der Ortskarte, in der Maske Gefäss im Kopf der Maske */}
      <span className="hv-aufgabe-text">
        {a.titel}
        <br />
        <small>{unter}</small>
      </span>
      <span className="hv-aufgabe-knoepfe">
        {aufgabenTasten(a, wo, aktionen.pegel.has(a.schluessel)).map((t) =>
          t.art === 'schreiben' ? (
            <Button
              key={t.text}
              variant={t.betont ? 'secondary' : 'ghost'}
              disabled={sendet}
              onClick={() => aktionen.ausfuehren(a, t.aktion)}
            >
              {t.text}
            </Button>
          ) : (
            <a
              key={t.text}
              className={`hv-btn ${t.betont ? 'hv-btn-secondary' : 'hv-btn-ghost'}`}
              href={hashZu(t.ziel)}
              {...linkSperre}
            >
              {t.text}
            </a>
          ),
        )}
      </span>
    </li>
  );
}
