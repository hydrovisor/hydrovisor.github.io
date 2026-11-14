// Vorrat einer Sorte: «Kein Saatgut mehr» und «Wieder vorrätig» (Issue #215, Plan 215; Konzept 8.1 Regeln 2 und 3,
// 11.4). Rein (G1): jetzt als Parameter, keine Browser-API. Der Stand ist kein Zustandsfeld, sondern wird aus den
// Ereignissen in vorrat_ereignis und den Packungen (saatgut) gerechnet: es gilt das jüngste nicht stornierte Ereignis
// bis jetzt; eine danach erfasste Packung macht eine aufgebrauchte Sorte wieder vorrätig (A5). Die App löscht nie.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Teile } from '../teile.ts';

export type VorratTyp = 'aufgebraucht' | 'vorraetig';

export interface VorratEreignisZeile {
  id: string;
  client_id: string;
  sorte_id: string;
  saatgut_id: string | null;
  typ: VorratTyp | string;
  gilt_ab: string;
  erfasst_am: string;
  storniert_am: string | null;
}

/** Ausschnitt einer Zeile saatgut (Packung) */
export interface PackungZeit {
  sorte_id: string;
  erfasst_am: string;
  storniert_am: string | null;
}

/** seit: gilt_ab des massgebenden «aufgebraucht», nur bei vorraetig: false */
export interface VorratStand {
  vorraetig: boolean;
  seit?: string;
}

/** Mikrosekunden innerhalb der Millisekunde («.123456» → 456); Date.parse schneidet sie ab (wie tuetenfoto.ts) */
function mikro(zeitpunkt: string): number {
  const bruch = /\.(\d+)/.exec(zeitpunkt)?.[1] ?? '';
  return Number(bruch.padEnd(6, '0').slice(3, 6));
}

/** Vergleich zweier Zeitpunkte auf die Mikrosekunde: < 0, wenn a früher ist */
function zeitVergleich(a: string, b: string): number {
  const d = Date.parse(a) - Date.parse(b);
  return d !== 0 ? d : mikro(a) - mikro(b);
}

/** Zeitpunkt bis jetzt (Grenze ≤; jetzt hat Millisekunden, Mikrosekunden darüber liegen nach jetzt) */
function bisJetzt(zeitpunkt: string, jetzt: Date): boolean {
  const d = Date.parse(zeitpunkt) - jetzt.getTime();
  return d < 0 || (d === 0 && mikro(zeitpunkt) === 0);
}

/** Ordnung der Ereignisse: nach gilt_ab, dann erfasst_am, dann id; > 0, wenn b jünger ist als a */
function juenger(b: VorratEreignisZeile, a: VorratEreignisZeile): number {
  return (
    zeitVergleich(b.gilt_ab, a.gilt_ab) ||
    zeitVergleich(b.erfasst_am, a.erfasst_am) ||
    (b.id > a.id ? 1 : b.id < a.id ? -1 : 0)
  );
}

const istTyp = (t: string): t is VorratTyp => t === 'aufgebraucht' || t === 'vorraetig';

/** nicht stornierte Ereignisse der Sorte bis jetzt, das jüngste zuerst */
function gueltige(
  ereignisse: readonly VorratEreignisZeile[],
  sorteId: string,
  jetzt: Date,
): VorratEreignisZeile[] {
  return ereignisse
    .filter(
      (e) => e.sorte_id === sorteId && e.storniert_am === null && istTyp(e.typ) && bisJetzt(e.gilt_ab, jetzt),
    )
    .sort((a, b) => juenger(b, a));
}

export function vorratStand(
  ereignisse: readonly VorratEreignisZeile[],
  packungen: readonly PackungZeit[],
  sorteId: string,
  jetzt: Date,
): VorratStand {
  const letztes = gueltige(ereignisse, sorteId, jetzt)[0];
  if (!letztes || letztes.typ === 'vorraetig') return { vorraetig: true };
  // A5: Serverzeiten vergleichen (erfasst_am gegen erfasst_am), Packung strikt danach und bis jetzt
  const neuePackung = packungen.some(
    (p) =>
      p.sorte_id === sorteId &&
      p.storniert_am === null &&
      zeitVergleich(p.erfasst_am, letztes.erfasst_am) > 0 &&
      bisJetzt(p.erfasst_am, jetzt),
  );
  return neuePackung ? { vorraetig: true } : { vorraetig: false, seit: letztes.gilt_ab };
}

/** Stand aus dem Bündel; fehlende Teile gelten als leer */
export function vorratAus(t: Teile, sorteId: string, jetzt: Date): VorratStand {
  const ereignisse = (t['vorrat_ereignis'] ?? []) as VorratEreignisZeile[];
  const packungen = (t['saatgut'] ?? []) as PackungZeit[];
  return vorratStand(ereignisse, packungen, sorteId, jetzt);
}

/** Eintrag im Verlauf: ein Ereignis oder die neue Packung, die eine aufgebrauchte Sorte wieder vorrätig macht */
export interface VorratVerlaufEintrag {
  typ: VorratTyp | 'neue_packung';
  giltAb: string;
}

/**
 * Verlauf der Sorte, das jüngste zuerst. Mit Packungen steht direkt über jedem «aufgebraucht» die erste danach
 * erfasste, nicht stornierte Packung derselben Sorte bis jetzt als «neue_packung» (wieder vorrätig, A5 wie
 * vorratStand), sofern sie vor dem nächstjüngeren gültigen Ereignis erfasst wurde (#219, Plan 219 A7, A8).
 */
export function vorratVerlauf(
  ereignisse: readonly VorratEreignisZeile[],
  sorteId: string,
  jetzt: Date,
  packungen: readonly PackungZeit[] = [],
): VorratVerlaufEintrag[] {
  const liste = gueltige(ereignisse, sorteId, jetzt);
  const eigene = packungen
    .filter((p) => p.sorte_id === sorteId && p.storniert_am === null && bisJetzt(p.erfasst_am, jetzt))
    .sort((a, b) => zeitVergleich(a.erfasst_am, b.erfasst_am));
  // jede Packung höchstens einmal (A7), auch wenn erfasst_am nicht der Ordnung nach gilt_ab folgt (Prüfer B4)
  const benutzt = new Set<PackungZeit>();
  const verlauf: VorratVerlaufEintrag[] = [];
  liste.forEach((e, i) => {
    if (e.typ === 'aufgebraucht') {
      const naechstes = i > 0 ? liste[i - 1] : undefined;
      const neue = eigene.find((p) => !benutzt.has(p) && zeitVergleich(p.erfasst_am, e.erfasst_am) > 0);
      if (neue && (!naechstes || zeitVergleich(neue.erfasst_am, naechstes.erfasst_am) < 0)) {
        benutzt.add(neue);
        verlauf.push({ typ: 'neue_packung', giltAb: neue.erfasst_am });
      }
    }
    verlauf.push({ typ: e.typ as VorratTyp, giltAb: e.gilt_ab });
  });
  return verlauf;
}

/**
 * «Kein Saatgut mehr» (aufgebraucht) bzw. «Wieder vorrätig» (vorraetig): genau eine neue Zeile. gilt_ab steht im
 * Vorgang, damit ein wiederholtes Senden dieselbe Zeile ergibt und nicht «abweichend» meldet (TO2).
 */
export function vorratVorgang(e: {
  sorteId: string;
  typ: VorratTyp;
  clientId: string;
  jetzt: Date;
}): Schritt[] {
  return [
    {
      art: 'neu',
      tabelle: 'vorrat_ereignis',
      felder: {
        client_id: e.clientId,
        sorte_id: e.sorteId,
        saatgut_id: null,
        typ: e.typ,
        gilt_ab: e.jetzt.toISOString(),
      },
    },
  ];
}
