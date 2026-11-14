// Kurzprüfung im Rundgang (Plan 30; R5.2 Zeile Kurzprüfung, Konzept 5.7; A4): Punkte je Ort und der Sammel-Tipp als
// Ereignisse `kurzpruefung` am Bereich (Licht, Lüfter) und am Platz (Pumpe bzw. Luftzone, Wurzeln, Würfel feucht).
// Rein; jetzt als Parameter.
import { zeilen, type EreignisZeile, type Teile } from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import type { Aufgabe } from '../aufgaben.ts';
import { kalendertag, type Zeitzone } from '../zeit.ts';
import { KURZ_ABWEICHUNG } from './abweichung.ts';
import { rundgangPlan, type Punkt, type RundgangEbene } from './plan.ts';

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

// ---------------------------------------------------------------------------------------------------------------------
// Kurzprüfung eines einzelnen Orts in Heute und in der Maske Gefäss (Plan 225; UX3-AK1, UX3-AK2; R5.2, R5.3): dieselbe
// Ebene und derselbe Vorgang wie im Rundgang, auf einen Ort beschränkt.
// ---------------------------------------------------------------------------------------------------------------------

/** Hauptpunkt eines Orts: genau einer davon steht in seiner Kurzprüfung (kurzpruefungPunkte()) */
export const HAUPTPUNKTE: readonly Punkt[] = ['pumpe', 'luftzone', 'loesung_topfboden'];

/** Prüfpunkt als Frage: «Pumpe sprudelt» wird «Pumpe sprudelt?» */
const alsFrage = (text: string) => (text.endsWith('?') ? text : `${text}?`);

/**
 * Licht und Lüfter dieser Ebene heute (Kalendertag in Zürich) schon erfasst? Zählt nicht stornierte Kurzprüfungen mit
 * Punkt `licht` am Bereich ohne Platz (A1: einmal je Ebene und Tag wie der Sammel-Tipp des Rundgangs).
 */
export function lichtLuefterHeute(
  teile: Teile,
  bereichId: string | null,
  jetzt: Date,
  zeitzone: Zeitzone,
): boolean {
  if (bereichId === null) return false;
  const heute = kalendertag(jetzt, zeitzone);
  type Zeile = EreignisZeile & { bereich_id?: string | null };
  return [...zeilen<Zeile>(teile, 'ereignis'), ...zeilen<Zeile>(teile, 'ereignis_platz')].some(
    (e) =>
      e.typ === 'kurzpruefung' &&
      (e.storniert_am ?? null) === null &&
      (e.platz_id ?? null) === null &&
      e.bereich_id === bereichId &&
      e.daten?.['punkt'] === 'licht' &&
      kalendertag(new Date(e.gilt_ab), zeitzone) === heute,
  );
}

/**
 * Ebene des Rundgang-Plans, beschränkt auf einen Ort (optional auf die genannten Punkte); undefined, wenn am Ort keine
 * Rundgang-Aufgabe fällig ist. Licht und Lüfter gehören dazu, solange sie heute an der Ebene noch nicht erfasst sind.
 */
export function ortKurzpruefung(
  teile: Teile,
  faellig: readonly Aufgabe[],
  platzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  punkte?: readonly Punkt[],
): RundgangEbene | undefined {
  const anlageId = faellig.find((a) => a.ort?.platzId === platzId)?.anlageId;
  if (anlageId === undefined) return undefined;
  const ebene = rundgangPlan(teile, faellig, anlageId, jetzt, zeitzone).ebenen.find((e) =>
    e.orte.some((o) => o.platzId === platzId),
  );
  if (!ebene) return undefined;
  const kurzpruefung = ebene.kurzpruefung.filter(
    (z) => z.platzId === platzId && (punkte === undefined || punkte.includes(z.punkt)),
  );
  return {
    ...ebene,
    kurzpruefung,
    orte: ebene.orte.filter((o) => o.platzId === platzId),
    mitLichtLuefter:
      kurzpruefung.length > 0 &&
      ebene.mitLichtLuefter &&
      !lichtLuefterHeute(teile, ebene.bereichId, jetzt, zeitzone),
  };
}

/**
 * Vorgang für «Alles ok» an der Aufgabe «Kurzprüfung» (Hauptpunkt des Orts, dazu Licht und Lüfter, solange heute offen)
 * und für «Wurzeln ok» bzw. «Auffällig» an «Wurzeln prüfen» (genau der Punkt Wurzeln). Leer für andere Typen, für
 * «Auffällig» an der Kurzprüfung (führt in die Maske) und wenn die Aufgabe nicht mehr fällig ist.
 */
export function pruefVorgang(
  teile: Teile,
  faellig: readonly Aufgabe[],
  aufgabe: Aufgabe,
  ergebnis: 'ok' | 'auffaellig',
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  const platzId = aufgabe.ort?.platzId;
  const wurzeln = aufgabe.typ === 'wurzeln_pruefen';
  if (platzId === undefined || (!wurzeln && aufgabe.typ !== 'kurzpruefung')) return [];
  if (!wurzeln && ergebnis !== 'ok') return [];
  const ebene = ortKurzpruefung(
    teile,
    faellig,
    platzId,
    jetzt,
    zeitzone,
    wurzeln ? ['wurzeln'] : HAUPTPUNKTE,
  );
  const eigene = ebene?.kurzpruefung.filter((z) => z.aufgabe.schluessel === aufgabe.schluessel) ?? [];
  if (!ebene || eigene.length === 0) return [];
  return kurzpruefungVorgang(
    { ...ebene, kurzpruefung: eigene, mitLichtLuefter: wurzeln ? false : ebene.mitLichtLuefter },
    new Set(ergebnis === 'auffaellig' ? [`${platzId}|wurzeln`] : []),
    ids,
    jetzt,
  );
}

/** Fragen, die «Alles ok» bestätigt: «Pumpe sprudelt? · Licht an? · Lüfter läuft?» (A3) */
export function pruefFragen(ebene: RundgangEbene): string {
  return [
    ...ebene.kurzpruefung.map((z) => alsFrage(z.text)),
    ...(ebene.mitLichtLuefter && ebene.bereichId !== null ? ['Licht an?', 'Lüfter läuft?'] : []),
  ].join(' · ');
}

/** Abweichungen einer gespeicherten Kurzprüfung mit Massnahme, Texte wie in der Abschlussliste des Rundgangs */
export function befundZeilen(
  ebene: RundgangEbene,
  abweichungen: ReadonlySet<string>,
): { text: string; massnahme: string }[] {
  const zeile = (wo: string, punkt: string, sonst: string) => {
    const a = KURZ_ABWEICHUNG[punkt] ?? { text: `${punkt} nicht ok`, massnahme: sonst };
    return { text: `${wo} ${a.text}`, massnahme: a.massnahme };
  };
  return [
    ...(ebene.bereichId === null
      ? []
      : (['licht', 'luefter'] as const)
          .filter((p) => abweichungen.has(`${String(ebene.bereichId)}|${p}`))
          .map((p) => zeile(ebene.name, p, 'Anlage prüfen'))),
    ...ebene.kurzpruefung
      .filter((z) => abweichungen.has(`${z.platzId}|${z.punkt}`))
      .map((z) => zeile(z.code.slice(z.code.indexOf('-') + 1), z.punkt, 'Gefäss prüfen')),
  ];
}
