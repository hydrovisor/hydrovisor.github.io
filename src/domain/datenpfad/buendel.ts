// Format und Anzeige des Offline-Bündels (Plan 11 «Speicherort und Format»; 04_architektur.md 4.2; Konzept 11.4 TO6).
// Rein: jetzt und Zeitzone als Parameter.
import { kalendertag, tagesbeginn, uhrzeit, type Zeitzone } from '../zeit.ts';

export const BUENDEL_FORMAT = 1;

export interface Buendel {
  id: 'aktuell';
  format: 1;
  /** Beginn des Ladens, ISO in UTC; angezeigt in Zürich */
  stand: string;
  appVersion: string;
  nutzerId: string;
  /** Zeilen je Teil in der Form von PostgREST (snake_case) */
  teile: Record<string, readonly unknown[]>;
}

/** ein gespeichertes Bündel nur annehmen, wenn Format und Nutzer passen; sonst gilt «kein Bündel» */
export function buendelPruefen(wert: unknown, nutzerId: string): Buendel | undefined {
  if (!wert || typeof wert !== 'object') return undefined;
  const b = wert as Partial<Buendel>;
  if (b.id !== 'aktuell' || b.format !== BUENDEL_FORMAT || b.nutzerId !== nutzerId) return undefined;
  if (typeof b.stand !== 'string' || Number.isNaN(Date.parse(b.stand))) return undefined;
  if (!b.teile || typeof b.teile !== 'object' || Array.isArray(b.teile)) return undefined;
  if (!Object.values(b.teile).every(Array.isArray)) return undefined;
  return b as Buendel;
}

export const HINWEIS_KEIN_BUENDEL = 'Noch keine Daten auf dem Gerät';

/**
 * «Stand: hh:mm», solange in dieser Sitzung kein frisches Laden gelungen ist (D3);
 * ist der Stand nicht von heute, mit Datum «Stand: TT.MM. hh:mm» (A2).
 */
export function standAnzeige(
  lage: { buendel?: Buendel | undefined; frisch: boolean },
  jetzt: Date,
  zeitzone: Zeitzone,
): { stand?: string; hinweis?: string } {
  if (lage.frisch) return {};
  if (!lage.buendel) return { hinweis: HINWEIS_KEIN_BUENDEL };
  const stand = new Date(lage.buendel.stand);
  const tag = kalendertag(stand, zeitzone);
  const zeit = uhrzeit(stand, zeitzone);
  if (tag === kalendertag(jetzt, zeitzone)) return { stand: `Stand: ${zeit}` };
  const [, monat, t] = tag.split('-');
  return { stand: `Stand: ${t}.${monat}. ${zeit}` };
}

/** Beginn des Fensters «die letzten n Tage»: 00:00 Zürich des Kalendertags heute minus n, als ISO */
export function fensterBeginn(jetzt: Date, tage: number, zeitzone: Zeitzone): string {
  const [j, m, d] = kalendertag(jetzt, zeitzone).split('-').map(Number) as [number, number, number];
  const tag = new Date(Date.UTC(j, m - 1, d - tage)).toISOString().slice(0, 10);
  return tagesbeginn(tag, zeitzone).toISOString();
}

/**
 * Nachfüll-Ansätze nach dem letzten nicht abgebrochenen Neuansatz je Ort (Plan 27, Prüfer Runde 1 Befund 1 und 2): die
 * Aufgaben-Rechnung braucht den Tag, an dem die Nachfüllsumme das Betriebsvolumen erreicht, und das letzte Nachfüllen
 * nach einer Messung «unter ⅓» (Kratky), auch wenn danach eine pH-Korrektur folgt.
 */
export function nachfuellenSeitNeuansatz<
  T extends { platz_id: string | null; begonnen_am: string; typ?: string; status?: string },
>(zeilen: readonly T[]): T[] {
  const seit = new Map(
    letzterJeOrt(zeilen.filter((z) => z.typ === 'neuansatz' && z.status !== 'abgebrochen')).map((z) => [
      z.platz_id,
      Date.parse(z.begonnen_am),
    ]),
  );
  return zeilen.filter((z) => {
    const ab = seit.get(z.platz_id);
    return z.typ === 'nachfuellen' && ab !== undefined && Date.parse(z.begonnen_am) > ab;
  });
}

type Ansatzzeile = {
  id: string;
  platz_id: string | null;
  begonnen_am: string;
  typ?: string;
  status?: string;
};

/**
 * Kürzung nach dem Laden, gleich für das Offline-Bündel und push-taeglich (Plan 31 Lösungsweg 1; R5.1): Ansätze je Ort
 * (Pläne 20, 27, 32), Positionen dieser Ansätze, Schritte laufender Neuansätze (Plan 29), Nachfüllen seit dem letzten
 * Neuansatz (Plan 27) und v_messung_unsicher nur im Messfenster (Plan 11 Runde 1 Befund 9). Fehlende Teile bleiben
 * fehlend; die Eingabe wird nicht verändert.
 */
export function teileKuerzen(
  eingabe: Record<string, readonly unknown[]>,
): Record<string, readonly unknown[]> {
  const teile: Record<string, readonly unknown[]> = { ...eingabe };
  const ansaetze = teile['naehrloesungsansatz'] as Ansatzzeile[] | undefined;
  if (ansaetze)
    teile['naehrloesungsansatz'] = [
      ...new Set([
        // letzter Ansatz je Ort (04 4.2, A7)
        ...letzterJeOrt(ansaetze),
        // letzter nicht abgebrochener Neuansatz oder Teilwechsel je Ort für Zielbereich und Dosis (Plan 20)
        ...letzterJeOrt(
          ansaetze.filter(
            (a) => (a.typ === 'neuansatz' || a.typ === 'teilwechsel') && a.status !== 'abgebrochen',
          ),
        ),
        // letzter Neuansatz je Ort: «Lösung wechseln» rechnet ab dem letzten Neuansatz (Plan 32 Runde 2 Befund 5)
        ...letzterJeOrt(ansaetze.filter((a) => a.typ === 'neuansatz' && a.status !== 'abgebrochen')),
      ]),
    ];
  // Positionen nur der letzten Ansätze je Ort (Plan 20)
  const letzte = new Set((teile['naehrloesungsansatz'] as Ansatzzeile[] | undefined)?.map((a) => a.id));
  const positionen = teile['ansatz_position'] as { ansatz_id: string }[] | undefined;
  if (positionen) teile['ansatz_position'] = positionen.filter((p) => letzte.has(p.ansatz_id));
  // Schritte nur der laufenden Neuansätze: Fortsetzen auf einem anderen Gerät (Plan 29 A13)
  const laufend = new Set(
    (teile['naehrloesungsansatz'] as Ansatzzeile[] | undefined)
      ?.filter((a) => a.typ === 'neuansatz' && a.status === 'laufend')
      .map((a) => a.id),
  );
  const schritte = teile['ansatz_schritt'] as { ansatz_id: string }[] | undefined;
  if (schritte) teile['ansatz_schritt'] = schritte.filter((x) => laufend.has(x.ansatz_id));
  // Nachfüllen seit dem letzten Neuansatz für die Aufgaben-Rechnung (Plan 27), ohne Positionen und Schritte
  if (ansaetze)
    teile['naehrloesungsansatz'] = [
      ...new Set([
        ...((teile['naehrloesungsansatz'] as Ansatzzeile[] | undefined) ?? []),
        ...nachfuellenSeitNeuansatz(ansaetze),
      ]),
    ];
  // v_messung_unsicher hat kein gilt_ab: auf die Messungen im Fenster beschränken
  const imFenster = new Set((teile['messung'] as { id: string }[] | undefined)?.map((m) => m.id));
  const unsicher = teile['v_messung_unsicher'] as { messung_id: string }[] | undefined;
  if (unsicher) teile['v_messung_unsicher'] = unsicher.filter((u) => imFenster.has(u.messung_id));
  return teile;
}

/** je Ort (platz_id) nur der zuletzt begonnene Ansatz (04 4.2 «letzter Ansatz je Ort») */
export function letzterJeOrt<T extends { platz_id: string | null; begonnen_am: string }>(
  zeilen: readonly T[],
): T[] {
  const je = new Map<string | null, T>();
  for (const z of zeilen) {
    const bisher = je.get(z.platz_id);
    if (!bisher || Date.parse(z.begonnen_am) > Date.parse(bisher.begonnen_am)) je.set(z.platz_id, z);
  }
  return [...je.values()];
}
