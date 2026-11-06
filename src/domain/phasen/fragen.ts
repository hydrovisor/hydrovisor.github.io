// Phasenstand, Phasenfragen und «Phasen nachführen» (Plan 35; R1.5, R1.6, UC6-AK1, UC6-AK7, TZ5 bis TZ8, A1 bis A18).
// Rein: `jetzt` und Zeitzone als Parameter, Kalendertage in Zürich (G2). Antworten sind Ereignisse phase_antwort am
// Satz (8.1 Regel 2); die Domäne filtert Typ und Storno selbst.
import { zeilen, type Teile } from '../anlage/teile.ts';
import type { Schritt, Vorgang } from '../datenpfad/erfassung.ts';
import { kalendertag, mittag, tagKurz, tagPlus, tageZwischen, type Zeitzone } from '../zeit.ts';
import { PHASE_NAME, phasenfolge, type Phase, type PhasenSchritt } from './profil.ts';
import { fragetag, phasenTermine, phasenText } from './termine.ts';

/** Stichtag der Phasenlogik (A3): Tag des Merges, vor dem Testbetrieb */
export const PHASENLOGIK_AB = '2026-11-06';

const FRAGE_OHNE_MERKMAL = 'Phase gewechselt?';

interface Satz {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
  gilt_ab?: string;
  client_zeit?: string | null;
  erfasst_am?: string | null;
  storniert_am: string | null;
}
interface Antwort {
  id: string;
  client_id?: string | null;
  typ: string;
  satz_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  client_zeit?: string | null;
  erfasst_am?: string | null;
  ersetzt_id?: string | null;
  storniert_am: string | null;
  war_faellig_am?: string | null;
  aufgabe_schluessel?: string | null;
}
interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  status: string;
  platz_id: string | null;
}

const satzVon = (teile: Teile, satzId: string) =>
  zeilen<Satz>(teile, 'satz').find((s) => s.id === satzId && s.storniert_am === null);

/** gültige Phasenantworten des Satzes, älteste zuerst; `neu` (noch nicht gespeichert) eingerechnet */
function antwortenVon(teile: Teile, satzId: string, neu?: Vorgang): Antwort[] {
  const storniert = new Set(
    (neu ?? []).filter((s) => s.art === 'storno').map((s) => (s.art === 'storno' ? s.clientId : '')),
  );
  const gesehen = new Set<string>();
  const alle = [
    ...zeilen<Antwort>(teile, 'ereignis_satz'),
    ...(neu ?? []).flatMap((s) => (s.art === 'neu' ? [s.felder as unknown as Antwort] : [])),
  ].filter((e) => {
    if (gesehen.has(e.id)) return false;
    gesehen.add(e.id);
    return (
      e.typ === 'phase_antwort' &&
      e.satz_id === satzId &&
      (e.storniert_am ?? null) === null &&
      !storniert.has(e.client_id ?? e.id)
    );
  });
  // Gleichstand im gilt_ab: erfasst_am, dann id (A8; Runde 2 Befund 2)
  return alle.sort(
    (a, b) =>
      Date.parse(a.gilt_ab) - Date.parse(b.gilt_ab) ||
      Date.parse(a.client_zeit ?? a.erfasst_am ?? a.gilt_ab) -
        Date.parse(b.client_zeit ?? b.erfasst_am ?? b.gilt_ab) ||
      a.id.localeCompare(b.id),
  );
}

const datenVon = (e: Antwort) => e.daten ?? {};

export interface PhasenStand {
  satzId: string;
  phase: Phase;
  beginn: string;
  tagSeitSaat: number;
  tagInPhase: number;
  text: string;
  naechste?: { phase: Phase; fruehestens?: string; typisch?: string; spaetestens?: string };
  wechselAb?: string;
  wechselMoeglich: boolean;
  frageAm?: string;
  pruefen: boolean;
  wechselmerkmal?: string;
  problemAm?: string;
  dauerFehlt: boolean;
}

export function phasenStand(
  teile: Teile,
  satzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
  neu?: Vorgang,
): PhasenStand | undefined {
  const satz = satzVon(teile, satzId);
  if (!satz) return undefined;
  const folge = phasenfolge(teile, satz.sorte_id, satz.kulturform);
  const heute = kalendertag(jetzt, zeitzone);
  const antworten = antwortenVon(teile, satzId, neu);
  const ja = antworten.filter((e) => datenVon(e)['antwort'] === 'ja');
  const letztesJa = ja[ja.length - 1];
  const phase = (letztesJa ? String(datenVon(letztesJa)['phase']) : 'keimung') as Phase;
  const beginn = letztesJa ? kalendertag(new Date(letztesJa.gilt_ab), zeitzone) : satz.saatdatum;
  const i = folge.findIndex((p) => p.phase === phase);
  const schritt: PhasenSchritt = folge[i] ?? { phase, dauer: {} };
  const naechsterSchritt = i >= 0 ? folge[i + 1] : undefined;
  const tagInPhase = tageZwischen(beginn, heute);
  const termine = phasenTermine(beginn, schritt.dauer);
  // Aufschiebung («Noch nicht», «Problem») für den laufenden Übergang nach dem Beginn
  const aufschub = naechsterSchritt
    ? antworten
        .filter(
          (e) =>
            datenVon(e)['phase'] === naechsterSchritt.phase &&
            datenVon(e)['antwort'] !== 'ja' &&
            kalendertag(new Date(e.gilt_ab), zeitzone) >= beginn,
        )
        .at(-1)
    : undefined;
  const aufschubTag = aufschub ? kalendertag(new Date(aufschub.gilt_ab), zeitzone) : undefined;
  const problem = naechsterSchritt
    ? antworten
        .filter(
          (e) => datenVon(e)['phase'] === naechsterSchritt.phase && datenVon(e)['antwort'] === 'problem',
        )
        .at(-1)
    : undefined;
  const frageAm = naechsterSchritt
    ? fragetag({
        ...(termine.typisch ? { typisch: termine.typisch } : {}),
        ...(aufschubTag ? { letzteAufschiebung: aufschubTag } : {}),
      })
    : undefined;
  return {
    satzId,
    phase,
    beginn,
    tagSeitSaat: tageZwischen(satz.saatdatum, heute),
    tagInPhase,
    text: phasenText(tagInPhase, schritt.dauer),
    ...(naechsterSchritt
      ? {
          naechste: {
            phase: naechsterSchritt.phase,
            ...(termine.fruehestens ? { fruehestens: termine.fruehestens } : {}),
            ...(termine.typisch ? { typisch: termine.typisch } : {}),
            ...(termine.spaetestens ? { spaetestens: termine.spaetestens } : {}),
          },
        }
      : {}),
    ...(naechsterSchritt && termine.fruehestens ? { wechselAb: termine.fruehestens } : {}),
    wechselMoeglich: naechsterSchritt !== undefined && (!termine.fruehestens || heute >= termine.fruehestens),
    ...(frageAm ? { frageAm } : {}),
    pruefen: naechsterSchritt !== undefined && termine.pruefenAb !== undefined && heute >= termine.pruefenAb,
    ...(schritt.wechselmerkmal ? { wechselmerkmal: schritt.wechselmerkmal } : {}),
    ...(problem ? { problemAm: kalendertag(new Date(problem.gilt_ab), zeitzone) } : {}),
    dauerFehlt: naechsterSchritt !== undefined && schritt.dauer.typ === undefined,
  };
}

/** erste aktive Pflanzung des Satzes nach id (Link zur Pflanzenansicht) */
export function pflanzungVonSatz(teile: Teile, satzId: string): string | undefined {
  return zeilen<Zustand>(teile, 'v_pflanzung_zustand')
    .filter((z) => z.satz_id === satzId && z.status === 'aktiv')
    .map((z) => z.pflanzung_id)
    .sort()[0];
}

export interface NachfuehrZeile {
  satzId: string;
  sorte: string;
  ort: string;
  phaseHeute: Phase;
  wechsel: { phase: Phase; am: string; erwartetAm: string; grenze: { von: string; bis: string } }[];
}
export interface Fragezeile {
  satzId: string;
  sorte: string;
  kulturform: string;
  von: Phase;
  nach: Phase;
  uebergang: string;
  text: string;
  pruefen: boolean;
  frage: string;
  faelligAm: string;
}
export interface Fragekarte {
  titel: string;
  art: string;
  ort: string;
  saatdatum: string;
  faelligAm: string;
  frage?: string;
  zeilen: Fragezeile[];
}

/** Kürzel der Anlage eines Platzes; der Titel nennt es nur, wenn es mehrere Anlagen gibt (A) */
const anlageKuerzel = (teile: Teile, platzId: string) => {
  const anlage = zeilen<{ id: string; anlage_id: string }>(teile, 'platz').find(
    (p) => p.id === platzId,
  )?.anlage_id;
  return zeilen<{ id: string; kuerzel: string }>(teile, 'anlage').find((a) => a.id === anlage)?.kuerzel;
};

const kennung = (teile: Teile, platzId: string | null | undefined) =>
  zeilen<{ id: string; kennung: string }>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';

function sorteUndArt(teile: Teile, sorteId: string): { sorte: string; art: string } {
  const s = zeilen<{ sorte_id: string; name: string; art_id: string; gueltig_bis?: string | null }>(
    teile,
    'sorte',
  ).find((x) => x.sorte_id === sorteId && (x.gueltig_bis ?? null) === null);
  const a = zeilen<{ art_id: string; name_de: string; gueltig_bis?: string | null }>(teile, 'art').find(
    (x) => x.art_id === s?.art_id && (x.gueltig_bis ?? null) === null,
  );
  return { sorte: s?.name ?? 'Sorte', art: a?.name_de ?? 'Art' };
}

/** Wechsel aus Saat bzw. Phasenbeginn und typischen Dauern, solange sie vor heute liegen (R1.6) */
function erwarteteWechsel(
  folge: readonly PhasenSchritt[],
  phase: Phase,
  beginn: string,
  heute: string,
): { phase: Phase; am: string; von: string }[] {
  const ergebnis: { phase: Phase; am: string; von: string }[] = [];
  let i = folge.findIndex((p) => p.phase === phase);
  let von = beginn;
  while (i >= 0 && i + 1 < folge.length) {
    const typ = folge[i]?.dauer.typ;
    if (typ === undefined) break;
    const am = tagPlus(von, typ);
    if (am >= heute) break;
    ergebnis.push({ phase: (folge[i + 1] as PhasenSchritt).phase, am, von });
    von = am;
    i += 1;
  }
  return ergebnis;
}

/** Erfassungstag des Satzes (rückdatierte Saat, TZ8) */
const erfasstAm = (satz: Satz, zeitzone: Zeitzone) =>
  kalendertag(
    new Date(satz.client_zeit ?? satz.erfasst_am ?? satz.gilt_ab ?? `${satz.saatdatum}T12:00:00Z`),
    zeitzone,
  );

export function phasenKarten(
  teile: Teile,
  jetzt: Date,
  zeitzone: Zeitzone,
  phasenlogikAb: string,
): { nachfuehren?: { titel: string; zeilen: NachfuehrZeile[] }; fragen: Fragekarte[] } {
  const heute = kalendertag(jetzt, zeitzone);
  const nachfuehren: NachfuehrZeile[] = [];
  const mehrereAnlagen =
    zeilen<{ aktiv?: boolean; storniert_am?: string | null }>(teile, 'anlage').filter(
      (x) => x.aktiv !== false && (x.storniert_am ?? null) === null,
    ).length > 1;
  const karten = new Map<string, Fragekarte>();
  for (const satz of zeilen<Satz>(teile, 'satz').filter((s) => s.storniert_am === null)) {
    const pflanzung = pflanzungVonSatz(teile, satz.id);
    if (!pflanzung) continue;
    const stand = phasenStand(teile, satz.id, jetzt, zeitzone);
    if (!stand) continue;
    const folge = phasenfolge(teile, satz.sorte_id, satz.kulturform);
    const { sorte, art } = sorteUndArt(teile, satz.sorte_id);
    // Ort = Platz mit den meisten aktiven Pflanzungen des Satzes, bei Gleichstand nach Kennung (A12; Befund 10)
    const zaehler = new Map<string, number>();
    for (const z of zeilen<Zustand>(teile, 'v_pflanzung_zustand'))
      if (z.satz_id === satz.id && z.status === 'aktiv') {
        const p = z.platz_id ?? satz.direktsaat_platz_id ?? satz.anzuchtort_platz_id ?? '';
        zaehler.set(p, (zaehler.get(p) ?? 0) + 1);
      }
    const ortId =
      [...zaehler.entries()].sort(
        (a, b) =>
          b[1] - a[1] || kennung(teile, a[0]).localeCompare(kennung(teile, b[0]), 'de', { numeric: true }),
      )[0]?.[0] ?? '';
    const ort = kennung(teile, ortId);
    const kuerzel = anlageKuerzel(teile, ortId);
    // vor dem Stichtag oder vor dem Erfassungstag erwartete Wechsel: Karte «Phasen nachführen» (R1.6, A3)
    const grenze = [phasenlogikAb, erfasstAm(satz, zeitzone)].sort().at(-1) as string;
    const wechsel = erwarteteWechsel(folge, stand.phase, stand.beginn, heute);
    if (wechsel.length > 0 && (wechsel[0] as { am: string }).am < grenze) {
      nachfuehren.push({
        satzId: satz.id,
        sorte,
        ort,
        phaseHeute: (wechsel.at(-1) as { phase: Phase }).phase,
        // grenze.von = voriger vorbelegter Wechsel (Testvertrag); die Kette prüft die Maske streng (Runde 2 Befund 1)
        wechsel: wechsel.map((w) => ({
          phase: w.phase,
          am: w.am,
          erwartetAm: w.am,
          grenze: { von: w.von, bis: heute },
        })),
      });
      continue;
    }
    if (!stand.naechste || !stand.frageAm || stand.frageAm > heute) continue;
    const zeile: Fragezeile = {
      satzId: satz.id,
      sorte,
      kulturform: satz.kulturform,
      von: stand.phase,
      nach: stand.naechste.phase,
      uebergang: `${PHASE_NAME[stand.phase]} → ${PHASE_NAME[stand.naechste.phase]}`,
      text: stand.text,
      pruefen: stand.pruefen,
      frage: stand.wechselmerkmal ?? FRAGE_OHNE_MERKMAL,
      faelligAm: stand.frageAm,
    };
    const schluessel = `${art}|${ortId}|${satz.saatdatum}`;
    const karte = karten.get(schluessel) ?? {
      titel: `${art} · ${kuerzel && mehrereAnlagen ? `${kuerzel}-` : ''}${ort} · gesät ${tagKurz(satz.saatdatum)}`,
      art,
      ort,
      saatdatum: satz.saatdatum,
      faelligAm: zeile.faelligAm,
      zeilen: [],
    };
    karte.zeilen.push(zeile);
    if (zeile.faelligAm < karte.faelligAm) karte.faelligAm = zeile.faelligAm;
    karten.set(schluessel, karte);
  }
  const fragen = [...karten.values()]
    .map((k) => {
      // gemeinsames Wechselmerkmal einmal im Kartenkopf (A13)
      const merkmale = new Set(k.zeilen.map((z) => z.frage));
      const [eins] = [...merkmale];
      return merkmale.size === 1 && eins && eins !== FRAGE_OHNE_MERKMAL ? { ...k, frage: eins } : k;
    })
    .sort(
      (a, b) =>
        a.faelligAm.localeCompare(b.faelligAm) ||
        a.ort.localeCompare(b.ort, 'de', { numeric: true }) ||
        a.titel.localeCompare(b.titel),
    );
  return {
    ...(nachfuehren.length > 0
      ? {
          nachfuehren: {
            titel: `Phasen nachführen (${String(nachfuehren.length)} ${nachfuehren.length === 1 ? 'Satz' : 'Sätze'})`,
            zeilen: nachfuehren,
          },
        }
      : {}),
    fragen,
  };
}

const zeile = (ids: () => string, felder: Record<string, unknown>): Schritt => {
  const id = ids();
  return { art: 'neu', tabelle: 'ereignis', felder: { client_id: id, id, typ: 'phase_antwort', ...felder } };
};

const FRUCHT = new Set<Phase>(['bluete', 'fruchtbildung_reife']);

export function antwortVorgang(
  teile: Teile,
  antworten: { satzId: string; antwort: 'ja' | 'noch_nicht' | 'problem'; ausloesendePflanzungId?: string }[],
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
  phasenlogikAb: string,
): Vorgang {
  void phasenlogikAb;
  const v: Schritt[] = [];
  for (const a of antworten) {
    const stand = phasenStand(teile, a.satzId, jetzt, zeitzone);
    // kein Rückfall: unbekannter Satz oder letzte Phase des Profils
    if (!stand?.naechste) return [];
    const nach = stand.naechste.phase;
    v.push(
      zeile(ids, {
        satz_id: a.satzId,
        gilt_ab: jetzt.toISOString(),
        // nur bei fälliger Frage (A10; Runde 1 Befund 3)
        ...(stand.frageAm && stand.frageAm <= kalendertag(jetzt, zeitzone)
          ? {
              war_faellig_am: stand.frageAm,
              aufgabe_schluessel: `phase_bestaetigen|${a.satzId}|${stand.frageAm}`,
            }
          : {}),
        daten: {
          phase: nach,
          antwort: a.antwort,
          erwartet_am: stand.naechste.typisch ?? null,
          nachgefuehrt: false,
          ...(a.ausloesendePflanzungId && FRUCHT.has(nach)
            ? { ausloesende_pflanzung_id: a.ausloesendePflanzungId }
            : {}),
        },
      }),
    );
  }
  return v;
}

export function nachfuehrVorgang(
  teile: Teile,
  eintraege: { satzId: string; wechsel: { phase: Phase; am: string }[] }[],
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
  phasenlogikAb: string,
): Vorgang {
  void phasenlogikAb;
  const heute = kalendertag(jetzt, zeitzone);
  const v: Schritt[] = [];
  for (const e of eintraege) {
    const satz = satzVon(teile, e.satzId);
    const stand = phasenStand(teile, e.satzId, jetzt, zeitzone);
    if (!satz || !stand) return [];
    const folge = phasenfolge(teile, satz.sorte_id, satz.kulturform);
    // erwartete Tage aus den typischen Dauern ab dem heutigen Stand (erwartet_am)
    const erwartet = erwarteteWechsel(folge, stand.phase, stand.beginn, tagPlus(heute, 3650));
    let i = folge.findIndex((p) => p.phase === stand.phase);
    let vorher = stand.beginn;
    // nach einem Ja oder einem vorigen Wechsel nur später, sonst gälte die alte Phase weiter (Runde 2 Befund 2)
    let streng = stand.phase !== 'keimung';
    for (const [k, w] of e.wechsel.entries()) {
      if (folge[i + 1]?.phase !== w.phase || w.am < vorher || (streng && w.am === vorher) || w.am > heute)
        return [];
      streng = true;
      v.push(
        zeile(ids, {
          satz_id: e.satzId,
          gilt_ab: mittag(w.am, zeitzone).toISOString(),
          daten: { phase: w.phase, antwort: 'ja', erwartet_am: erwartet[k]?.am ?? w.am, nachgefuehrt: true },
        }),
      );
      vorher = w.am;
      i += 1;
    }
  }
  return v;
}

/** Korrektur des letzten Wechseldatums: Storno korrektur, dann neue Zeile mit ersetzt_id (R1.5) */
/** Erlaubtes Fenster der Datumskorrektur: vom Beginn der Phase davor (sonst Saatdatum) bis heute; ohne Ja keine (Befund 12) */
export function korrekturGrenze(
  teile: Teile,
  satzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { von: string; bis: string; tag: string } | undefined {
  const satz = satzVon(teile, satzId);
  const ja = antwortenVon(teile, satzId).filter((e) => datenVon(e)['antwort'] === 'ja');
  const alt = ja.at(-1);
  if (!satz || !alt) return undefined;
  const davor = ja.at(-2);
  return {
    von: davor ? kalendertag(new Date(davor.gilt_ab), zeitzone) : satz.saatdatum,
    bis: kalendertag(jetzt, zeitzone),
    tag: kalendertag(new Date(alt.gilt_ab), zeitzone),
  };
}

/** Wissenskarte für Art und Phase (R7.2, A15): zuerst Ebene Art, sonst Kulturgruppe; nur gültige Einträge */
export function wissenFuer(teile: Teile, sorteId: string, phase: Phase): string | undefined {
  const sorte = zeilen<{ sorte_id: string; art_id: string }>(teile, 'sorte').find(
    (s) => s.sorte_id === sorteId,
  );
  if (!sorte) return undefined;
  const gruppe = zeilen<{ art_id: string; kulturgruppe_id: string }>(teile, 'art').find(
    (a) => a.art_id === sorte.art_id,
  )?.kulturgruppe_id;
  const eintraege = zeilen<{
    art_id: string | null;
    kulturgruppe_id: string | null;
    phase: string | null;
    text: string;
    gueltig_bis?: string | null;
  }>(teile, 'wissenseintrag').filter((w) => w.phase === phase && !w.gueltig_bis);
  return (
    eintraege.find((w) => w.art_id === sorte.art_id)?.text ??
    (gruppe ? eintraege.find((w) => w.kulturgruppe_id === gruppe)?.text : undefined)
  );
}

export function korrekturVorgang(
  teile: Teile,
  satzId: string,
  neuerTag: string,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): Vorgang {
  const satz = satzVon(teile, satzId);
  const ja = antwortenVon(teile, satzId).filter((e) => datenVon(e)['antwort'] === 'ja');
  const alt = ja.at(-1);
  if (!satz || !alt) return [];
  const grenze = korrekturGrenze(teile, satzId, jetzt, zeitzone);
  if (!grenze || neuerTag < grenze.von || neuerTag > grenze.bis) return [];
  // am Tag des vorigen Ja mindestens 1 s danach, sonst gälte die Phase davor wieder (Rückfall, Runde 2 Befund 2)
  const davor = ja.at(-2);
  const mitte = mittag(neuerTag, zeitzone).getTime();
  const giltAb = new Date(davor ? Math.max(mitte, Date.parse(davor.gilt_ab) + 1000) : mitte);
  return [
    { art: 'storno', tabelle: 'ereignis', clientId: alt.client_id ?? alt.id, grund: 'korrektur' },
    zeile(ids, {
      satz_id: satzId,
      gilt_ab: giltAb.toISOString(),
      ersetzt_id: alt.id,
      // fachliche Felder bleiben, damit die Aufgabe erledigt bleibt (8.1 Regel 2; Runde 2 Befund 4)
      ...(alt.war_faellig_am ? { war_faellig_am: alt.war_faellig_am } : {}),
      ...(alt.aufgabe_schluessel ? { aufgabe_schluessel: alt.aufgabe_schluessel } : {}),
      daten: { ...datenVon(alt) },
    }),
  ];
}

/** Rückgängig: Stornos in umgekehrter Reihenfolge; eine korrigierte Zeile kommt mit Daten und gilt_ab zurück (U4) */
export function phasenRueckgaengig(
  vorgang: Vorgang,
  teile: Teile,
  ids: () => string = () => globalThis.crypto.randomUUID(),
): Vorgang {
  const alle = [...zeilen<Antwort>(teile, 'ereignis'), ...zeilen<Antwort>(teile, 'ereignis_satz')];
  const r: Schritt[] = [];
  for (const s of [...vorgang].reverse()) {
    if (s.art === 'neu') {
      r.push({ art: 'storno', tabelle: s.tabelle, clientId: s.felder.client_id, grund: 'rueckgaengig' });
      continue;
    }
    if (s.art !== 'storno') continue;
    const alt = alle.find((e) => (e.client_id ?? e.id) === s.clientId);
    // ohne die alte Zeile kein halbes Rückgängig (Runde 1 Befund 5): die Maske gibt den Stand vor dem Speichern mit
    if (!alt) return [];
    const id = ids();
    r.push({
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: id,
        id,
        typ: 'phase_antwort',
        satz_id: alt.satz_id,
        gilt_ab: alt.gilt_ab,
        ...(alt.ersetzt_id ? { ersetzt_id: alt.ersetzt_id } : {}),
        ...(alt.war_faellig_am ? { war_faellig_am: alt.war_faellig_am } : {}),
        ...(alt.aufgabe_schluessel ? { aufgabe_schluessel: alt.aufgabe_schluessel } : {}),
        daten: { ...datenVon(alt) },
      },
    });
  }
  return r;
}

const ANTWORT: Readonly<Record<string, string>> = { ja: 'Ja', noch_nicht: 'Noch nicht', problem: 'Problem' };

/** Verlauf der Phasenantworten, neueste zuerst (R1.5) */
export function phasenVerlauf(
  teile: Teile,
  satzId: string,
  zeitzone: Zeitzone,
  neu?: Vorgang,
): { tag: string; text: string; korrektur: boolean; nachgefuehrt: boolean }[] {
  return antwortenVon(teile, satzId, neu)
    .map((e) => {
      const d = datenVon(e);
      const phase = PHASE_NAME[String(d['phase']) as Phase] ?? String(d['phase']);
      const giltTag = kalendertag(new Date(e.gilt_ab), zeitzone);
      const nachgefuehrt = d['nachgefuehrt'] === true;
      if (e.ersetzt_id) {
        const tag = kalendertag(new Date(e.client_zeit ?? e.erfasst_am ?? e.gilt_ab), zeitzone);
        return {
          tag,
          text: `Korrektur am ${tagKurz(tag)}: ${phase} ab ${tagKurz(giltTag)}`,
          korrektur: true,
          nachgefuehrt,
        };
      }
      return {
        tag: giltTag,
        text: `${tagKurz(giltTag)} ${phase}: ${ANTWORT[String(d['antwort'])] ?? String(d['antwort'])}${nachgefuehrt ? ' (nachgeführt)' : ''}`,
        korrektur: false,
        nachgefuehrt,
      };
    })
    .sort((a, b) => b.tag.localeCompare(a.tag));
}
