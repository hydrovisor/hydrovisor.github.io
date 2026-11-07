// Kurzprüfung im Rundgang (Plan 30; R5.2 Zeile Kurzprüfung, Konzept 5.7; A4): Punkte je Ort und der Sammel-Tipp als
// Ereignisse `kurzpruefung` am Bereich (Licht, Lüfter) und am Platz (Pumpe bzw. Luftzone, Wurzeln, Würfel feucht).
// Rein; jetzt als Parameter.
import type { Schritt } from '../datenpfad/erfassung.ts';
import type { Aufgabe } from '../aufgaben.ts';
import type { Punkt, RundgangEbene } from './plan.ts';

/** Text der Zeile in der Karte (Abweichung: «… nicht» bzw. «keine …» in der Abschlussliste) */
export const PUNKT_TEXT: Readonly<Record<Punkt, string>> = {
  pumpe: 'Pumpe sprudelt',
  luftzone: 'Luftzone vorhanden',
  loesung_topfboden: 'Lösung berührt Topfboden',
  wurzeln: 'Wurzeln weiss?',
  wuerfel_feucht: 'Würfel feucht',
};

/** Direktsaat bei Kratky: bis Satzalter 13 Tage «Lösung berührt Topfboden», ab 14 Tagen Luftzone (R5.2) */
export const TOPFBODEN_BIS_TAGE = 14;

/** Punkte eines Orts in der Kurzprüfung seiner Ebene */
export function kurzpruefungPunkte(
  lage: { betriebsart?: string; anzuchtort: boolean; direktsaatAlterTage?: number },
  aufgaben: readonly Aufgabe[],
): Punkt[] {
  const faellig = (typ: Aufgabe['typ']) => aufgaben.some((a) => a.typ === typ);
  if (lage.anzuchtort) return faellig('wuerfel_feucht') ? ['wuerfel_feucht'] : [];
  const kratky = (lage.betriebsart ?? '').startsWith('kratky');
  const haupt: Punkt = !kratky
    ? 'pumpe'
    : lage.direktsaatAlterTage !== undefined && lage.direktsaatAlterTage < TOPFBODEN_BIS_TAGE
      ? 'loesung_topfboden'
      : 'luftzone';
  return faellig('wurzeln_pruefen') ? [haupt, 'wurzeln'] : [haupt];
}

/**
 * Sammel-Tipp der Ebene: «Alles ok» bzw. mit den Abweichungen `platzId|punkt` (am Bereich `bereichId|licht` bzw.
 * `bereichId|luefter`). Am Bereich Licht und Lüfter mit den Codes der Abweichungen in `ausnahmen` (A4), je Zeile der
 * Karte ein Punkt mit der Aufgabe, die er erledigt.
 */
export function kurzpruefungVorgang(
  ebene: RundgangEbene,
  abweichungen: ReadonlySet<string>,
  ids: () => string,
  jetzt: Date,
): Extract<Schritt, { art: 'neu' }>[] {
  const gilt = jetzt.toISOString();
  const ausnahmen = [
    ...new Set(
      ebene.kurzpruefung.filter((z) => abweichungen.has(`${z.platzId}|${z.punkt}`)).map((z) => z.code),
    ),
  ];
  const vorgang: Extract<Schritt, { art: 'neu' }>[] = [];
  if (ebene.mitLichtLuefter && ebene.bereichId !== null)
    for (const punkt of ['licht', 'luefter'] as const) {
      const id = ids();
      vorgang.push({
        art: 'neu',
        tabelle: 'ereignis',
        felder: {
          id,
          client_id: id,
          typ: 'kurzpruefung',
          bereich_id: ebene.bereichId,
          daten: { punkt, ok: !abweichungen.has(`${ebene.bereichId}|${punkt}`), ausnahmen },
          gilt_ab: gilt,
        },
      });
    }
  for (const z of ebene.kurzpruefung) {
    const id = ids();
    vorgang.push({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        id,
        client_id: id,
        typ: 'kurzpruefung',
        platz_id: z.platzId,
        ...(ebene.bereichId !== null ? { bereich_id: ebene.bereichId } : {}),
        daten: { punkt: z.punkt, ok: !abweichungen.has(`${z.platzId}|${z.punkt}`), ausnahmen: [] },
        war_faellig_am: z.aufgabe.faelligAm,
        aufgabe_schluessel: z.aufgabe.schluessel,
        gilt_ab: gilt,
      },
    });
  }
  return vorgang;
}
