// Block-Leiste in der Maske Ansatz (R5.6, Plan 139): Ist das Gefäss Glied eines Wechselblocks und liegt der nächste
// Schritt in einem anderen Gefäss, führt «Weiter im Block: 2.1 · Zeile 0» dorthin. Nur ein Vorschlag, keine Sperre (A1).
// Läuft in einem anderen Glied ein Timer ab, während die Maske offen ist, gibt die Leiste einmal das Signal (A6).
import { useEffect, useMemo, useRef, useState } from 'react';
import { timerSignal } from '../../ablauf/wachhalten.ts';
import { offeneAblaeufe, type AblaufEintrag } from '../../ablauf/speicher.ts';
import { wechselblock } from '../../domain/abhakliste/block.ts';
import type { AblaufStand } from '../../domain/abhakliste/stand.ts';
import { einstellungenAus, type Aufgabe } from '../../domain/aufgaben.ts';
import { verteilteAufgaben } from '../../domain/aufgaben-verteilung.ts';
import type { Teile } from '../../domain/teile.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { hashZu } from '../router.ts';

export function BlockLeiste({
  teile,
  platzId,
  stand,
  jetzt,
}: {
  teile: Teile;
  platzId: string;
  stand: AblaufStand;
  jetzt: Date;
}) {
  const [lokal, setLokal] = useState<AblaufEintrag[]>([]);
  const signalFuer = useRef(new Set<string>());

  // übrige Abläufe beim Öffnen, beim Sichtbarwerden und nach jedem eigenen Haken neu lesen
  const eigeneAktion = stand.letzteAktionAm;
  useEffect(() => {
    let aktiv = true;
    const lesen = () =>
      offeneAblaeufe().then(
        (e) => {
          if (aktiv) setLokal(e);
        },
        () => undefined,
      );
    void lesen();
    const beiSichtbar = () => document.visibilityState === 'visible' && void lesen();
    document.addEventListener('visibilitychange', beiSichtbar);
    return () => {
      aktiv = false;
      document.removeEventListener('visibilitychange', beiSichtbar);
    };
  }, [eigeneAktion]);

  // Aufgaben je Minute rechnen, nicht je Sekunde
  const minute = Math.floor(jetzt.getTime() / 60_000);
  const aufgaben = useMemo<readonly Aufgabe[]>(() => {
    try {
      return verteilteAufgaben(teile, einstellungenAus(teile), new Date(minute * 60_000), ZEITZONE);
    } catch {
      return [];
    }
  }, [teile, minute]);

  const staende = [
    ...lokal.filter((e) => e.art === 'abhakliste' && e.platzId && e.platzId !== platzId),
  ] as unknown as AblaufStand[];
  const block = wechselblock({ teile, aufgaben, lokal: [...staende, stand] }, jetzt, ZEITZONE).find((b) =>
    b.glieder.some((g) => g.platzId === platzId),
  );

  // Signal, wenn der Timer eines anderen Glieds abläuft
  useEffect(() => {
    if (!block) return;
    for (const g of block.glieder) {
      if (g.platzId === platzId || g.timerEnde === undefined) continue;
      const ende = Date.parse(g.timerEnde);
      const schluessel = `${g.platzId}|${g.timerEnde}`;
      if (jetzt.getTime() >= ende && !signalFuer.current.has(schluessel)) {
        signalFuer.current.add(schluessel);
        if (jetzt.getTime() - ende < 5_000) timerSignal();
      }
    }
  }, [block, jetzt, platzId]);

  const n = block?.naechster;
  if (n?.art !== 'schritt' || n.platzId === platzId) return null;
  return (
    <a className="hv-btn hv-btn-primary hv-block-leiste" href={hashZu({ name: 'ansatz', code: n.code })}>
      {`Weiter im Block: ${n.kennung} · Zeile ${String(n.zeile)}${n.zeilenText ? ` ${n.zeilenText}` : ''}`}
    </a>
  );
}
