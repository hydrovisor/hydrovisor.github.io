// Gefäss ändern, Box- oder Deckeltausch und Leeren (UC3 Ändern, R8.3, R9.3, Ablauf «Gefäss leeren»; Plan 21).
// Ohne Update im Schreibweg: Korrektur = Storno plus neue Zeile, neue Belegung = Storno, geschlossene Kopie und
// neue Zeile ab jetzt (Plan 21 A1). Rein: IDs und jetzt von aussen.
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import type { Betriebsart } from './anlegen.ts';
import { belegungFelder, toepfe, toepfeAngleichen, volumenPasst, type Intervalle } from './erfassen.ts';
import { deckeltyp, gefaessAm, gefaessmodell, zeilen, type PlatzZeile, type Teile } from './teile.ts';

export interface Lochbild {
  topfdurchmesser_mm: number;
  loecher_je_reihe: readonly number[];
}

/** gleich = gleiche Lochzahl und gleiche Topfgrösse; die Aufteilung in Reihen zählt nicht (Plan 21 A8) */
export function lochbildGleich(a: Lochbild, b: Lochbild): boolean {
  const zahl = (l: Lochbild) => l.loecher_je_reihe.reduce((x, y) => x + y, 0);
  return a.topfdurchmesser_mm === b.topfdurchmesser_mm && zahl(a) === zahl(b);
}

export interface PflanzeAmPlatz {
  art: 'pflanzung' | 'reservierung';
  pflanzungId: string;
  satzId: string;
}

/**
 * Aktive Pflanzungen am Platz (Ortsereignis, sonst Ort des Satzes) und aktive Reservierungen auf Töpfe mit
 * Heimplatz hier (Plan 21 «Pflanzen am Platz»).
 */
export function pflanzenAmPlatz(teile: Teile, platzId: string): PflanzeAmPlatz[] {
  const saetze = zeilen<{
    id: string;
    anzuchtort_platz_id: string | null;
    direktsaat_platz_id: string | null;
    storniert_am: string | null;
  }>(teile, 'satz').filter((s) => s.storniert_am === null);
  const satzOrt = new Map(saetze.map((s) => [s.id, s.anzuchtort_platz_id ?? s.direktsaat_platz_id]));
  const zustaende = zeilen<{
    pflanzung_id: string;
    satz_id: string;
    status: string;
    platz_id: string | null;
  }>(teile, 'v_pflanzung_zustand').filter((p) => p.status === 'aktiv');
  const ergebnis: PflanzeAmPlatz[] = zustaende
    .filter((p) => (p.platz_id ?? satzOrt.get(p.satz_id)) === platzId)
    .map((p) => ({ art: 'pflanzung', pflanzungId: p.pflanzung_id, satzId: p.satz_id }));
  const toepfeHier = new Set(
    zeilen<{ id: string; heim_platz_id: string; storniert_am: string | null }>(teile, 'netztopf')
      .filter((n) => n.storniert_am === null && n.heim_platz_id === platzId)
      .map((n) => n.id),
  );
  const satzVon = new Map(
    zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').map((p) => [p.id, p.satz_id]),
  );
  for (const z of zustaende) if (!satzVon.has(z.pflanzung_id)) satzVon.set(z.pflanzung_id, z.satz_id);
  for (const r of zeilen<{ pflanzung_id: string; netztopf_id: string; storniert_am?: string | null }>(
    teile,
    'v_reservierung_aktiv',
  ))
    if ((r.storniert_am ?? null) === null && toepfeHier.has(r.netztopf_id))
      ergebnis.push({
        art: 'reservierung',
        pflanzungId: r.pflanzung_id,
        satzId: satzVon.get(r.pflanzung_id) ?? '',
      });
  return ergebnis;
}

/** Sortennamen der Sätze, ohne Wiederholung */
export function sortenDer(teile: Teile, satzIds: readonly string[]): string[] {
  const saetze = zeilen<{ id: string; sorte_id: string }>(teile, 'satz');
  const sorten = zeilen<{ sorte_id: string; name: string }>(teile, 'sorte');
  return [
    ...new Set(
      satzIds.map((id) => {
        const satz = saetze.find((s) => s.id === id);
        return sorten.find((s) => s.sorte_id === satz?.sorte_id)?.name ?? 'Satz';
      }),
    ),
  ];
}

export function deckeltauschPruefen(teile: Teile, platzId: string, deckeltypId: string): Verstoss[] {
  const alt = gefaessAm(teile, platzId);
  const vorher = alt?.deckeltyp_id ? deckeltyp(teile, alt.deckeltyp_id) : undefined;
  const nachher = deckeltyp(teile, deckeltypId);
  if (!nachher) return [{ feld: 'deckel', grund: 'Wähle einen Deckel oder eine Platte.' }];
  if (vorher && lochbildGleich(vorher, nachher)) return [];
  const pflanzen = pflanzenAmPlatz(teile, platzId);
  if (pflanzen.length === 0) return [];
  const sorten = sortenDer(
    teile,
    pflanzen.map((p) => p.satzId),
  );
  return [
    { feld: 'deckel', grund: `Deckeltausch gesperrt: im Gefäss stehen Pflanzen (${sorten.join(', ')})` },
  ];
}

export interface Aenderung {
  intervalle?: Partial<Intervalle>;
  naechsterWechselAm?: string | null;
  betriebsvolumenL?: number;
  betriebsart?: Betriebsart;
  festeDosis?: boolean;
  luftpumpe?: 'P1' | 'P2' | 'P3' | 'P4' | null;
  gefaessmodellId?: string;
  deckeltypId?: string;
}

type Alt = NonNullable<ReturnType<typeof gefaessAm>>;

interface Belegung {
  gefaessmodell_id: string;
  deckeltyp_id: string;
  betriebsart: Betriebsart;
  feste_dosis: boolean;
  luftpumpe: string | null;
  betriebsvolumen_l: number;
  intervall_messen_d: number | null;
  intervall_nachfuellen_d: number | null;
  intervall_wechseln_d: number | null;
  naechster_wechsel_am: string | null;
}

function zusammen(alt: Alt, a: Aenderung): Belegung {
  const i = a.intervalle ?? {};
  return {
    gefaessmodell_id: a.gefaessmodellId ?? alt.gefaessmodell_id,
    deckeltyp_id: a.deckeltypId ?? alt.deckeltyp_id ?? '',
    betriebsart: a.betriebsart ?? (alt.betriebsart as Betriebsart),
    feste_dosis: a.festeDosis ?? alt.feste_dosis ?? false,
    luftpumpe: a.luftpumpe !== undefined ? a.luftpumpe : (alt.luftpumpe ?? null),
    betriebsvolumen_l: a.betriebsvolumenL ?? Number(alt.betriebsvolumen_l),
    intervall_messen_d: i.messenD !== undefined ? i.messenD : alt.intervall_messen_d,
    intervall_nachfuellen_d:
      i.nachfuellenD !== undefined ? i.nachfuellenD : (alt.intervall_nachfuellen_d ?? null),
    intervall_wechseln_d: i.wechselnD !== undefined ? i.wechselnD : alt.intervall_wechseln_d,
    naechster_wechsel_am:
      a.naechsterWechselAm !== undefined ? a.naechsterWechselAm : (alt.naechster_wechsel_am ?? null),
  };
}

export function aenderungPruefen(teile: Teile, platzId: string, a: Aenderung): Verstoss[] {
  const alt = gefaessAm(teile, platzId);
  if (!alt) return [{ feld: 'gefaess', grund: 'Kein Gefäss an diesem Platz.' }];
  const b = zusammen(alt, a);
  const f: Verstoss[] = [];
  if (a.deckeltypId !== undefined && a.deckeltypId !== alt.deckeltyp_id)
    f.push(...deckeltauschPruefen(teile, platzId, a.deckeltypId));
  const modell = gefaessmodell(teile, b.gefaessmodell_id);
  if (!modell || !volumenPasst(b.betriebsvolumen_l, modell))
    f.push({
      feld: 'betriebsvolumen',
      grund: 'Betriebsvolumen muss kleiner sein als der Innenraum der Box.',
    });
  const kratky = b.betriebsart === 'kratky' || b.betriebsart === 'kratky_belueftet';
  if (!kratky && b.intervall_wechseln_d === null)
    f.push({ feld: 'intervall_wechseln_d', grund: 'DWC und Konstantpegel brauchen ein Wechselintervall.' });
  const intervalle: [string, number | null][] = [
    ['intervall_messen_d', b.intervall_messen_d],
    ['intervall_nachfuellen_d', b.intervall_nachfuellen_d],
    ['intervall_wechseln_d', b.intervall_wechseln_d],
  ];
  for (const [feld, wert] of intervalle)
    if (wert !== null && !(Number.isInteger(wert) && wert >= 1 && wert <= 60))
      f.push({ feld, grund: 'Intervall in ganzen Tagen, 1 bis 60.' });
  if (b.feste_dosis && b.betriebsart !== 'konstantpegel')
    f.push({ feld: 'feste_dosis', grund: 'Feste Dosis nur bei Konstantpegel.' });
  return f;
}

/** neue Belegung (Konzept 8.2): Volumen, Betriebsart, Box oder Deckel; sonst Korrektur der Zeile */
function neueBelegung(alt: Alt, b: Belegung): boolean {
  return (
    b.betriebsvolumen_l !== Number(alt.betriebsvolumen_l) ||
    b.betriebsart !== alt.betriebsart ||
    b.gefaessmodell_id !== alt.gefaessmodell_id ||
    b.deckeltyp_id !== (alt.deckeltyp_id ?? '')
  );
}

const zeile = (tabelle: Schritt['tabelle'], id: string, felder: Record<string, unknown>): Schritt => ({
  art: 'neu',
  tabelle,
  felder: { client_id: id, id, ...felder },
});

export function aenderungVorgang(
  teile: Teile,
  platzId: string,
  a: Aenderung,
  ids: () => string,
  jetzt: Date,
): Vorgang {
  const alt = gefaessAm(teile, platzId);
  if (!alt) return [];
  const iso = jetzt.toISOString();
  const b = zusammen(alt, a);
  const basis = belegungFelder(alt);
  const schritte: Schritt[] = [
    { art: 'storno', tabelle: 'gefaess', clientId: alt.client_id ?? alt.id, grund: 'korrektur' },
  ];
  if (!neueBelegung(alt, b)) {
    schritte.push(
      zeile('gefaess', ids(), { ...basis, ...b, gueltig_von: alt.gueltig_von, gueltig_bis: null }),
    );
    return schritte;
  }
  schritte.push(zeile('gefaess', ids(), { ...basis, gueltig_bis: iso }));
  schritte.push(zeile('gefaess', ids(), { ...basis, ...b, gueltig_von: iso, gueltig_bis: null }));
  const deckelNeu = b.deckeltyp_id !== (alt.deckeltyp_id ?? '');
  if (deckelNeu) {
    const platz = zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === platzId);
    const deckel = deckeltyp(teile, b.deckeltyp_id);
    if (platz && deckel)
      schritte.push(...toepfeAngleichen(teile, platz, toepfe(platz.kennung, deckel, b.feste_dosis), ids));
  }
  // Box- oder Deckeltausch setzt den Prüfstatus zurück (R9.3)
  if (deckelNeu || b.gefaessmodell_id !== alt.gefaessmodell_id)
    schritte.push(
      zeile('ereignis', ids(), { typ: 'box_deckel_tausch', platz_id: platzId, gilt_ab: iso, daten: {} }),
    );
  return schritte;
}

/** Ablauf «Gefäss leeren» (R5.4): Ereignis geleert */
export function leerenVorgang(platzId: string, id: string, jetzt: Date): Vorgang {
  return [
    zeile('ereignis', id, { typ: 'geleert', platz_id: platzId, gilt_ab: jetzt.toISOString(), daten: {} }),
  ];
}
