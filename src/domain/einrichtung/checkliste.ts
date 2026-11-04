// Einrichtungs-Checkliste (UC0, K29, B-04; Plan 18): neun Punkte in fester Reihenfolge, jeder hakt sich aus den
// erfassten Daten selbst ab. Rein: liest nur Teile des Bündels in der Form von PostgREST, jetzt als Parameter.
// Nur Daten der Datenart echt zählen (Plan 18 A1).

export type Punktziel =
  | { art: 'kalibrieren' }
  | { art: 'messen'; code: string }
  | { art: 'einweichen' }
  /** Ablauf folgt mit dem genannten Paket (Plan 18 A6) */
  | { art: 'folgt'; paket: string };

export interface Punkt {
  nr: number;
  titel: string;
  /** Verb für den Knopf des aktiven Punkts */
  knopf: string;
  erledigt: boolean;
  zustand: 'offen' | 'aktiv' | 'erledigt';
  ziel: Punktziel;
  /** nur Punkt 2: absolute Endzeit des laufenden Einweich-Timers in ms */
  timerEnde?: number;
}

export interface Einrichtungsstand {
  punkte: Punkt[];
  /** alle neun Punkte erfüllt */
  vollstaendig: boolean;
}

/** Einweichen vor dem ersten Einsatz (Konzept 5, Messgerät: rund 12 Stunden) */
export const EINWEICHEN_MS = 12 * 60 * 60 * 1000;

interface AnlageZeile {
  id: string;
  kuerzel: string;
  datenart: string;
  aktiv: boolean;
  storniert_am: string | null;
}
interface PlatzZeile {
  id: string;
  anlage_id: string;
  kennung: string;
  rolle: string;
  aktiv: boolean;
  storniert_am: string | null;
}
interface GefaessZeile {
  id: string;
  platz_id: string;
  gueltig_bis: string | null;
  storniert_am: string | null;
}
interface MitStorno {
  storniert_am: string | null;
}

type Teile = Record<string, readonly unknown[]> | undefined;

const zeilen = <T>(teile: Teile, name: string) => (teile?.[name] ?? []) as readonly T[];
const aktiv = <T extends MitStorno>(liste: readonly T[]) => liste.filter((z) => z.storniert_am === null);

/**
 * Stand der Checkliste. `einweichenEnde`: Endzeit des Timers aus dem Gerätespeicher (Plan 18 A3), sonst undefined.
 */
export function einrichtungsStand(teile: Teile, jetzt: Date, einweichenEnde?: number): Einrichtungsstand {
  const anlagen = aktiv(zeilen<AnlageZeile>(teile, 'anlage')).filter((a) => a.aktiv && a.datenart === 'echt');
  const anlageIds = new Set(anlagen.map((a) => a.id));
  const kuerzel = new Map(anlagen.map((a) => [a.id, a.kuerzel]));
  const plaetze = aktiv(zeilen<PlatzZeile>(teile, 'platz')).filter(
    (p) => p.aktiv && anlageIds.has(p.anlage_id),
  );
  const platzIds = new Set(plaetze.map((p) => p.id));
  const gefaesse = aktiv(zeilen<GefaessZeile>(teile, 'gefaess')).filter(
    (g) => g.gueltig_bis === null && platzIds.has(g.platz_id),
  );
  const gefaessPlaetze = new Set(gefaesse.map((g) => g.platz_id));
  const anzuchtorte = aktiv(zeilen<{ platz_id: string } & MitStorno>(teile, 'anzuchtort')).filter((a) =>
    platzIds.has(a.platz_id),
  );
  const anzuchtPlaetze = new Set(anzuchtorte.map((a) => a.platz_id));
  const messstellen = plaetze.filter((p) => p.rolle === 'messstelle');

  // Orte: Plätze mit Gefäss, Anzuchtorte und die Messstelle W
  const orte = plaetze.filter(
    (p) => gefaessPlaetze.has(p.id) || anzuchtPlaetze.has(p.id) || p.rolle === 'messstelle',
  );

  const anlageDa = anlagen.length > 0;

  const kalibriert = aktiv(
    zeilen<{ datenart: string; gegenprobe_ec: number | string | null } & MitStorno>(teile, 'kalibrierung'),
  ).some((k) => k.datenart === 'echt' && k.gegenprobe_ec !== null);

  const timerLaeuft = einweichenEnde !== undefined && einweichenEnde > jetzt.getTime();
  const eingeweicht = kalibriert || (einweichenEnde !== undefined && !timerLaeuft);

  const wasserGemessen = zeilen<{ anlage_id: string; herkunft: string }>(teile, 'v_ec_wasser').some(
    (w) => anlageIds.has(w.anlage_id) && w.herkunft === 'messung',
  );

  const vorlagen =
    aktiv(zeilen<MitStorno>(teile, 'gefaessmodell')).length > 0 &&
    aktiv(zeilen<MitStorno>(teile, 'deckeltyp')).length > 0;

  const erfasst = gefaesse.length > 0 && anzuchtorte.length > 0 && messstellen.length > 0;

  const gedruckt = new Set(
    aktiv(zeilen<{ platz_id: string; gedruckt_am: string | null } & MitStorno>(teile, 'etikett'))
      .filter((e) => e.gedruckt_am !== null)
      .map((e) => e.platz_id),
  );
  const etiketten = orte.length > 0 && orte.every((o) => gedruckt.has(o.id));

  const status = new Map(
    zeilen<{ gefaess_id: string; status: string }>(teile, 'v_gefaess_status').map((s) => [
      s.gefaess_id,
      s.status,
    ]),
  );
  const geprueft =
    gefaesse.length > 0 && gefaesse.every((g) => (status.get(g.id) ?? 'in_pruefung') !== 'in_pruefung');

  const gesaet = aktiv(
    zeilen<{ anzuchtort_platz_id: string | null; direktsaat_platz_id: string | null } & MitStorno>(
      teile,
      'satz',
    ),
  ).some(
    (s) =>
      (s.anzuchtort_platz_id !== null && platzIds.has(s.anzuchtort_platz_id)) ||
      (s.direktsaat_platz_id !== null && platzIds.has(s.direktsaat_platz_id)),
  );

  const w = messstellen[0];
  const wCode = w ? `${kuerzel.get(w.anlage_id) ?? ''}-${w.kennung}` : undefined;

  const roh: Omit<Punkt, 'zustand'>[] = [
    {
      nr: 1,
      titel: 'Anlage anlegen',
      knopf: 'Anlage anlegen',
      erledigt: anlageDa,
      ziel: { art: 'folgt', paket: 'I1a-02' },
    },
    {
      nr: 2,
      titel: 'Messstift 12 h einweichen',
      knopf: 'Einweichen starten',
      erledigt: eingeweicht,
      ziel: { art: 'einweichen' },
      ...(timerLaeuft && !kalibriert ? { timerEnde: einweichenEnde } : {}),
    },
    {
      nr: 3,
      titel: 'Messgerät kalibrieren mit Gegenprobe',
      knopf: 'Kalibrieren',
      erledigt: kalibriert,
      ziel: { art: 'kalibrieren' },
    },
    {
      nr: 4,
      titel: 'Leitungswasser-EC messen (W)',
      knopf: 'Leitungswasser messen',
      erledigt: wasserGemessen,
      ziel: wCode ? { art: 'messen', code: wCode } : { art: 'folgt', paket: 'I1a-04' },
    },
    {
      nr: 5,
      titel: 'Vorlagen für Box, Deckel und Platte',
      knopf: 'Vorlagen erfassen',
      erledigt: vorlagen,
      ziel: { art: 'folgt', paket: 'I1a-03' },
    },
    {
      nr: 6,
      titel: 'Gefässe, Anzuchtboxen und Messstelle W erfassen',
      knopf: 'Gefässe erfassen',
      erledigt: erfasst,
      ziel: { art: 'folgt', paket: 'I1a-04' },
    },
    {
      nr: 7,
      titel: 'Etiketten drucken und anbringen',
      knopf: 'Etiketten drucken',
      erledigt: etiketten,
      ziel: { art: 'folgt', paket: 'I1a-05' },
    },
    {
      nr: 8,
      titel: 'Gefässe prüfen, Schritte 1 bis 3',
      knopf: 'Gefässe prüfen',
      erledigt: geprueft,
      ziel: { art: 'folgt', paket: 'I1a-04' },
    },
    {
      nr: 9,
      titel: 'Erste Aussaat',
      knopf: 'Aussaat erfassen',
      erledigt: gesaet,
      ziel: { art: 'folgt', paket: 'I1a-06' },
    },
  ];
  const ersterOffener = roh.find((p) => !p.erledigt)?.nr;
  const punkte = roh.map((p) => ({
    ...p,
    zustand: p.erledigt
      ? ('erledigt' as const)
      : p.nr === ersterOffener
        ? ('aktiv' as const)
        : ('offen' as const),
  }));
  return { punkte, vollstaendig: ersterOffener === undefined };
}

/** Sichtbar, solange nicht alle neun erfüllt sind und das Gerät den Abschluss nicht kennt (Plan 18 A4) */
export function checklisteZeigen(stand: Einrichtungsstand, abgeschlossenGemerkt: boolean): boolean {
  return !stand.vollstaendig && !abgeschlossenGemerkt;
}
