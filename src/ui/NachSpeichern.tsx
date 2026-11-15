// Weiterführung nach dem Speichern (Plan 224 Entscheid 7; UX2-AK4, AK5; design-system/components/Button.md): Haupttaste
// «Nächste Aufgabe: <Titel> <Ort>» in der Reihenfolge von Heute, daneben «Zu Heute»; ohne weitere Aufgabe nur «Zu Heute».
import { useEffect, useState, type MouseEvent } from 'react';
import { folgeAufgabe, heuteFolge, type AufgabenZiel } from '../domain/aufgaben-folge.ts';
import { verteilteAufgaben } from '../domain/aufgaben-verteilung.ts';
import { einstellungenAus } from '../domain/aufgaben.ts';
import { folgeAnzeige } from '../domain/pflanzung/keimbox.ts';
import type { Teile } from '../domain/anlage/teile.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { useBuendel } from './buendel.tsx';
import { hashZu } from './router.ts';

const SPERRE_MS = 400;

function sicher<T>(rechnen: () => T, sonst: T): T {
  try {
    return rechnen();
  } catch (fehler) {
    console.error('Folgeaufgabe', fehler);
    return sonst;
  }
}

function folgeJetzt(teile: Teile): string[] {
  const jetzt = new Date(Date.now());
  return heuteFolge(
    teile,
    verteilteAufgaben(teile, einstellungenAus(teile), jetzt, ZEITZONE),
    jetzt,
    ZEITZONE,
  ).map((e) => e.schluessel);
}

/**
 * Schlüsselfolge von Heute beim Öffnen der Maske (einmal, sobald das Bündel da ist): damit behält eine Aufgabe ihren
 * Platz in der Reihenfolge, auch wenn sie nach dem Speichern aus dem Bündel verschwindet.
 */
export function useHeuteVorher(): readonly string[] {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const [vorher, setVorher] = useState<readonly string[]>();
  if (vorher === undefined && teile) setVorher(sicher(() => folgeJetzt(teile), []));
  return vorher ?? [];
}

interface NachSpeichernProps {
  /** die Maske, in der eben gespeichert wurde; ohne Bezug (Säen) die erste Aufgabe von Heute */
  bezug?: AufgabenZiel;
  vorher?: readonly string[];
  /** nach «Rückgängig machen»: die Aufgabe ist wieder offen, nur «Zu Heute» (A8) */
  nurHeute?: boolean;
  /**
   * eben gespeicherte Box (Plan 227): bis das Bündel neu geladen ist, gelten ihre Sätze noch als fällig; eine Folge
   * in dieselbe Box oder zu einem ihrer Sätze wird nicht angeboten
   */
  erledigteBox?: { code: string; saetze: readonly string[] };
}

export function NachSpeichern({ bezug, vorher = [], nurHeute = false, erledigteBox }: NachSpeichernProps) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const [jetzt] = useState(() => Date.now());
  // beide Tasten erscheinen dort, wo eben «Speichern» getippt wurde: 400 ms ohne Wirkung (U13, A5)
  const [frei, setFrei] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFrei(true), SPERRE_MS);
    return () => clearTimeout(t);
  }, []);
  // «Keimung prüfen» eines Satzes in einer Box mit Boxzeile führt in die Maske je Box (Plan 227)
  const folge =
    teile && !nurHeute
      ? sicher(() => {
          const f = folgeAufgabe(
            teile,
            new Date(jetzt),
            ZEITZONE,
            bezug ? { ziel: bezug, vorher } : undefined,
          );
          if (!f) return undefined;
          const a = folgeAnzeige(
            f,
            verteilteAufgaben(teile, einstellungenAus(teile), new Date(jetzt), ZEITZONE),
          );
          const dieselbe =
            erledigteBox !== undefined &&
            ((a.ziel.name === 'keimung-box' && a.ziel.code === erledigteBox.code) ||
              (a.ziel.name === 'keimung' && erledigteBox.saetze.includes(a.ziel.satz)));
          return dieselbe ? undefined : a;
        }, undefined)
      : undefined;
  const sperre = frei
    ? {}
    : { 'aria-disabled': true, onClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault() };
  return (
    <div className="hv-weiter">
      {folge ? (
        <a className="hv-btn hv-btn-primary" href={hashZu(folge.ziel)} {...sperre}>
          <small>Nächste Aufgabe: </small>
          {`${folge.titel}${folge.ort ? ` ${folge.ort}` : ''}`}
        </a>
      ) : null}
      <a
        className={`hv-btn ${folge ? 'hv-btn-secondary' : 'hv-btn-primary'}`}
        href={hashZu({ name: 'heute' })}
        {...sperre}
      >
        Zu Heute
      </a>
    </div>
  );
}
