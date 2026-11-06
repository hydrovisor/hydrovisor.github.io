// Ergebnis der Messmaske in einem Aufruf (Plan 26 «Datenfluss in der Maske»): Bewertung, Trend, Spur, Hinweise und
// Sprung-Rückfrage für die eingegebenen Werte. Rein: `jetzt` und `zeitzone` als Parameter.
import { bewerten, type Bewertung, type Hundertstel } from '../bewertung/bewertung.ts';
import { hinweise, type Hinweis } from '../bewertung/hinweise.ts';
import { spurLage, sprungPruefen, trendZeile } from '../bewertung/verlauf.ts';
import type { Zeitzone } from '../zeit.ts';
import type { Groesse } from './eingabe.ts';
import type { Messkontext } from './messkontext.ts';

export interface Messergebnis {
  bewertungen: Partial<Record<Groesse, Bewertung>>;
  trend: Partial<Record<Groesse, NonNullable<ReturnType<typeof trendZeile>>>>;
  spur: Partial<Record<Groesse, ReturnType<typeof spurLage>>>;
  hinweise: Hinweis[];
  /** Ton warn oder danger unter den Hinweisen; liest der Rundgang (I1b-05) für die Abschlussliste */
  alarm: boolean;
  sprung?: NonNullable<ReturnType<typeof sprungPruefen>>;
  ohneBewertung: boolean;
}

const GROESSEN: readonly Groesse[] = ['ph', 'ec', 'temperatur'];

export function messergebnis(
  werte: Partial<Record<Groesse, Hundertstel>>,
  k: Messkontext,
  jetzt: Date,
  zeitzone: Zeitzone,
): Messergebnis {
  const bewertungen = k.sollband ? bewerten(werte, k.sollband, { uEc: k.uEc, uPh: k.uPh }) : {};
  const trend: Messergebnis['trend'] = {};
  const spur: Messergebnis['spur'] = {};
  for (const g of GROESSEN) {
    const v = k.vorher[g];
    const t = trendZeile(g, v?.wert, werte[g], v?.veraltet ?? false);
    if (t) trend[g] = t;
    if (k.sollband) spur[g] = spurLage(werte[g], v?.wert, k.sollband[g]);
  }
  const h = hinweise(
    {
      betriebsart: k.art,
      werte,
      bewertungen,
      ...(k.sollband ? { sollband: k.sollband } : {}),
      vorher: k.vorher,
      ansaetze: k.ansaetze,
      uPh: k.uPh,
      uEc: k.uEc,
    },
    jetzt,
    zeitzone,
  );
  const sprung = sprungPruefen(
    { werte, vorher: k.vorher, ansaetze: k.ansaetze, hierWaechst: k.hierWaechst },
    jetzt,
  );
  return {
    bewertungen,
    trend,
    spur,
    hinweise: h.hinweise,
    alarm: h.alarm,
    ...(sprung ? { sprung } : {}),
    ohneBewertung: k.sollband === undefined,
  };
}
