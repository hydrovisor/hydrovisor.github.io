// Bestätigung nach «Keimung speichern» (Plan 24 A6; Plan 227): aus Keimung.tsx herausgelöst, damit die Maske je Satz
// und die Maske je Box denselben Text zeigen.
import { zeilen, type Teile } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import {
  keimZusammenfassung,
  packungsrate,
  type KeimAnsicht,
  type KeimEingabe,
  type Schwamm,
} from '../../domain/pflanzung/keimung.ts';

const zahl2 = (x: number) => x.toFixed(2);
const HERKUNFT = { beobachtet: 'beobachtet', packung: 'Packung', art: 'Art' } as const;

/** Name eines Schwamms im Stepper: mit Zieltopf, sonst «Reserve», wenn der Satz Zieltöpfe hat */
export function schwammName(s: Schwamm, mitZiel: boolean): string {
  if (s.zieltopf) return `Schwamm ${s.nr} · Ziel ${s.zieltopf.kennung}`;
  return mitZiel ? `Schwamm ${s.nr} · Reserve` : `Schwamm ${s.nr}`;
}

export interface Fertig {
  vorgang: Vorgang;
  zeilen: string[];
  warnung?: string;
  nachsaeen: string[];
  zurueck?: boolean;
}

/** Bestätigung nach dem Speichern: Ergebnis, Keimrate der Packung, «Saatgut prüfen», Nachsäen (A6, G5) */
export function fertigText(teile: Teile, a: KeimAnsicht, eingabe: KeimEingabe, vorgang: Vorgang): Fertig {
  const z = keimZusammenfassung(teile, eingabe);
  const stationen = new Map<string, number>();
  for (const s of eingabe.station) stationen.set(s.platzId, (stationen.get(s.platzId) ?? 0) + 1);
  const kennung = (platzId: string) =>
    zeilen<{ id: string; kennung: string }>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';
  const station = [...stationen].map(([id, n]) => `${n} auf ${kennung(id)}`);
  const mitKeimung = eingabe.werte.some((w) => w.gekeimt !== 'offen');
  const zeilenText = [`Gespeichert: ${[...(mitKeimung ? [z.text] : []), ...station].join(' · ')}`];
  let warnung: string | undefined;
  if (!mitKeimung) {
    // reiner Stationsschritt: keine Keimrate
  } else if (eingabe.keimtempEingehalten !== true)
    zeilenText.push('Keimtemperatur nicht eingehalten: zählt nicht für die Keimrate');
  else if (a.datenart !== 'echt') zeilenText.push('Keimrate zählt nur in echten Anlagen');
  else {
    const rate = packungsrate(teile, a.satzId, vorgang);
    if (rate?.p !== undefined)
      zeilenText.push(
        `Keimrate der Packung ${zahl2(rate.p)} (${rate.herkunft ? HERKUNFT[rate.herkunft] : ''}, ${rate.gesaet} Samen)`,
      );
    if (rate?.saatgutPruefen) warnung = `Saatgut prüfen: ${rate.gekeimt} von ${rate.gesaet} Samen gekeimt`;
  }
  return { vorgang, zeilen: zeilenText, ...(warnung ? { warnung } : {}), nachsaeen: z.nachsaeen };
}
