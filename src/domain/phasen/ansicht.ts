// Pflanzenansicht nach UC6 (Plan 38; R1.3, R1.5, R1.7, A2, A10, A13, A14): Kopf mit Topf und Platz, Phasenstand,
// Sollbereich, Zielbereich des Gefässes, Erntestand, Endzustand, nächster Schritt, Umfang je Satz und «Wie weiter?».
// Rein: jetzt und Zeitzone als Parameter (G1, G2).
import { kuerzelVon, zeilen, type Teile } from '../anlage/teile.ts';
import { bewertungsband } from '../bewertung/sollband.ts';
import type { Vorgang } from '../datenpfad/erfassung.ts';
import { keimAufgaben } from '../pflanzung/keimung.ts';
import { KULTURFORM_NAME } from '../pflanzung/saeen.ts';
import { tagKurz, type Zeitzone } from '../zeit.ts';
import { endzustand, teileNach, type Endzustand } from './ende.ts';
import { ernteStand, type ErnteStand } from './ernte.ts';
import { phasenStand, type PhasenStand } from './fragen.ts';
import { dezimal, sollbereich, sollText, type Sollbereich } from './sollbereich.ts';

export type SchrittArt = 'keimung' | 'umsetzen' | 'phase' | 'kultur_entscheid' | 'ernte_moeglich';

export interface PflanzenAnsicht {
  pflanzungId: string;
  satzId: string;
  sorteId: string;
  sorte: string;
  status: string;
  kopf: { titel: string; ort: string; tagSeitSaat: number; mitTopf: boolean };
  phase?: PhasenStand;
  soll: Sollbereich & { text: string };
  ziel?: { platzId: string; text: string; pflanzen: number };
  ernte?: ErnteStand;
  ende?: Endzustand;
  naechsterSchritt?: { art: SchrittArt; am: string; text: string };
  /** aktive Pflanzungen desselben Satzes am selben Platz nach id (A2) */
  umfang: string[];
  /** bei Fruchtgemüse vor Blüte oder Fruchtbildung (R1.5, Plan 35 A11) */
  ausloeserFrage?: string;
  wissenSchossen?: string;
  /** Satz mit aktiver Reservierung in der Anzucht: Link «Umsetzen» */
  umsetzen?: true;
  /** Topf «<Kürzel>-<Kennung>» für «Verschieben» */
  topf?: string;
}

interface Zustand {
  pflanzung_id: string;
  satz_id: string;
  phase?: string | null;
  status: string;
  netztopf_id: string | null;
  platz_id: string | null;
  loch_nr: number | string | null;
}
interface Satz {
  id: string;
  sorte_id: string;
  kulturform: string;
  saatdatum: string;
  anzuchtort_platz_id: string | null;
  direktsaat_platz_id: string | null;
}
interface Platz {
  id: string;
  anlage_id: string;
  kennung: string;
  rolle?: string;
}

const SCHRITT_NAME: Readonly<Record<SchrittArt, string>> = {
  keimung: 'Keimung prüfen',
  umsetzen: 'Umsetzen',
  phase: 'Phase bestätigen',
  kultur_entscheid: 'Kultur beenden oder verlängern?',
  ernte_moeglich: 'Ernte möglich',
};
const REIHENFOLGE: readonly SchrittArt[] = [
  'keimung',
  'umsetzen',
  'phase',
  'kultur_entscheid',
  'ernte_moeglich',
];
export const AUSLOESER_FRAGE = 'Diese Pflanze zeigt das Merkmal';

const zustandVon = (teile: Teile, pflanzungId: string) =>
  zeilen<Zustand>(teile, 'v_pflanzung_zustand').find((z) => z.pflanzung_id === pflanzungId);

function wissenSchossen(teile: Teile, sorteId: string): string | undefined {
  const artId = zeilen<{ sorte_id: string; art_id: string; gueltig_bis?: string | null }>(
    teile,
    'sorte',
  ).find((s) => s.sorte_id === sorteId && (s.gueltig_bis ?? null) === null)?.art_id;
  const gruppe = zeilen<{ art_id: string; kulturgruppe_id?: string | null; gueltig_bis?: string | null }>(
    teile,
    'art',
  ).find((a) => a.art_id === artId && (a.gueltig_bis ?? null) === null)?.kulturgruppe_id;
  const karten = zeilen<{
    ebene: string;
    art_id: string | null;
    kulturgruppe_id: string | null;
    typ: string;
    text: string;
    gueltig_bis?: string | null;
  }>(teile, 'wissenseintrag').filter((w) => w.typ === 'schossen' && (w.gueltig_bis ?? null) === null);
  return (
    karten.find((w) => w.ebene === 'art' && w.art_id === artId)?.text ??
    (gruppe
      ? karten.find((w) => w.ebene === 'kulturgruppe' && w.kulturgruppe_id === gruppe)?.text
      : undefined)
  );
}

function ortText(teile: Teile, z: Zustand, satz: Satz, plaetze: readonly Platz[]): string {
  const kennungVon = (id: string | null | undefined) => plaetze.find((p) => p.id === id)?.kennung;
  if (z.netztopf_id) {
    const topf = zeilen<{ id: string; kennung: string }>(teile, 'netztopf').find(
      (n) => n.id === z.netztopf_id,
    );
    const ort = zeilen<{
      netztopf_id: string;
      platz_id: string;
      loch_nr: number | null;
      ausser_heim?: boolean;
    }>(teile, 'v_netztopf_platz').find((n) => n.netztopf_id === z.netztopf_id);
    if (topf) {
      if (ort?.ausser_heim && ort.loch_nr !== null)
        return `${topf.kennung}, steht auf ${kennungVon(ort.platz_id) ?? ''}.${String(ort.loch_nr)}`;
      return topf.kennung;
    }
  }
  return kennungVon(z.platz_id ?? satz.direktsaat_platz_id ?? satz.anzuchtort_platz_id) ?? '';
}

export function pflanzenAnsicht(
  teile: Teile,
  pflanzungId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): PflanzenAnsicht | undefined {
  const z = zustandVon(teile, pflanzungId);
  if (!z) return undefined;
  const satz = zeilen<Satz>(teile, 'satz').find((s) => s.id === z.satz_id);
  if (!satz) return undefined;
  const plaetze = zeilen<Platz>(teile, 'platz');
  const sorte =
    zeilen<{ sorte_id: string; name: string; gueltig_bis?: string | null }>(teile, 'sorte').find(
      (s) => s.sorte_id === satz.sorte_id && (s.gueltig_bis ?? null) === null,
    )?.name ?? 'Sorte';
  const platzId = z.platz_id ?? satz.direktsaat_platz_id ?? undefined;
  const platz = plaetze.find((p) => p.id === platzId);
  const aktiv = z.status === 'aktiv';
  const phase = phasenStand(teile, satz.id, jetzt, zeitzone);
  const phaseJetzt = z.phase ?? phase?.phase ?? 'keimung';
  const soll = sollbereich(teile, satz.sorte_id, phaseJetzt, platzId);
  const ernte = ernteStand(teile, pflanzungId, jetzt, zeitzone);
  const ende = endzustand(teile, pflanzungId, jetzt, zeitzone);

  let ziel: PflanzenAnsicht['ziel'];
  if (platz && platz.rolle === 'gefaess') {
    const band = bewertungsband(teile ?? {}, platz.id, jetzt);
    const zahl = Number(
      zeilen<{ platz_id: string; zaehlende_pflanzungen: number }>(teile, 'v_zielbereich').find(
        (r) => r.platz_id === platz.id,
      )?.zaehlende_pflanzungen ?? 0,
    );
    if (band)
      ziel = {
        platzId: platz.id,
        text: `Gefäss ${platz.kennung}: pH ${dezimal(band.ph.min)}–${dezimal(band.ph.max)} · EC ${dezimal(band.ec.min)}–${dezimal(band.ec.max)}${zahl > 0 ? ` · ${String(zahl)} ${zahl === 1 ? 'Pflanze' : 'Pflanzen'}` : ''}`,
        pflanzen: zahl,
      };
  }

  // nächster Schritt: frühester Termin, Gleichstand in fester Reihenfolge (A13)
  const termine: { art: SchrittArt; am: string }[] = [];
  const reservierung = zeilen<{
    pflanzung_id: string;
    umsetzen_geplant_am?: string | null;
    umsetzen_vorgabe_am: string;
  }>(teile, 'v_reservierung_aktiv').find((r) => r.pflanzung_id === pflanzungId);
  if (aktiv) {
    if (phaseJetzt === 'keimung') {
      const k = keimAufgaben(teile, jetzt, zeitzone).find((a) => a.satzId === satz.id);
      if (k) termine.push({ art: 'keimung', am: k.faelligAm });
    }
    if (reservierung && satz.anzuchtort_platz_id)
      termine.push({
        art: 'umsetzen',
        am: reservierung.umsetzen_geplant_am ?? reservierung.umsetzen_vorgabe_am,
      });
    if (phase?.frageAm) termine.push({ art: 'phase', am: phase.frageAm });
    if (ernte?.kulturFrageAm) termine.push({ art: 'kultur_entscheid', am: ernte.kulturFrageAm });
    if (ernte?.moeglichAb) termine.push({ art: 'ernte_moeglich', am: ernte.moeglichAb });
  }
  const naechster = termine.sort(
    (a, b) => a.am.localeCompare(b.am) || REIHENFOLGE.indexOf(a.art) - REIHENFOLGE.indexOf(b.art),
  )[0];

  const umfang = aktiv
    ? zeilen<Zustand>(teile, 'v_pflanzung_zustand')
        .filter(
          (x) =>
            x.satz_id === satz.id && x.status === 'aktiv' && (x.platz_id ?? null) === (z.platz_id ?? null),
        )
        .map((x) => x.pflanzung_id)
        .sort()
    : [pflanzungId];
  const naechstePhase = phase?.naechste?.phase;
  const wissen = ernte?.schossenHandlung ? wissenSchossen(teile, satz.sorte_id) : undefined;
  const topf = z.netztopf_id
    ? zeilen<{ id: string; kennung: string }>(teile, 'netztopf').find((n) => n.id === z.netztopf_id)?.kennung
    : undefined;
  const anlageId = platz?.anlage_id ?? plaetze.find((p) => p.id === satz.anzuchtort_platz_id)?.anlage_id;

  return {
    pflanzungId,
    satzId: satz.id,
    sorteId: satz.sorte_id,
    sorte,
    status: z.status,
    kopf: {
      titel: `${sorte} · ${KULTURFORM_NAME[satz.kulturform] ?? satz.kulturform}${platz ? ` · ${platz.kennung}` : ''}`,
      ort: ortText(teile, z, satz, plaetze),
      tagSeitSaat: phase?.tagSeitSaat ?? 0,
      mitTopf: z.netztopf_id !== null && z.netztopf_id !== undefined,
    },
    ...(phase ? { phase } : {}),
    soll: { ...soll, text: sollText(soll) },
    ...(ziel ? { ziel } : {}),
    ...(ernte ? { ernte } : {}),
    ...(ende ? { ende } : {}),
    ...(naechster
      ? {
          naechsterSchritt: {
            ...naechster,
            text: `Nächster Schritt: ${SCHRITT_NAME[naechster.art]} ab ${tagKurz(naechster.am)}`,
          },
        }
      : {}),
    umfang,
    ...(aktiv && (naechstePhase === 'bluete' || naechstePhase === 'fruchtbildung_reife')
      ? { ausloeserFrage: AUSLOESER_FRAGE }
      : {}),
    ...(wissen ? { wissenSchossen: wissen } : {}),
    ...(aktiv && reservierung && satz.anzuchtort_platz_id ? { umsetzen: true as const } : {}),
    ...(aktiv && topf && anlageId ? { topf: `${kuerzelVon(teile, anlageId)}-${topf}` } : {}),
  };
}

/**
 * «Wie weiter?» (UC6 Ablauf 6, A14): beendet der Vorgang die letzte aktive Pflanzung eines Platzes mit Rolle gefaess,
 * Links «Neu bepflanzen» und «Zum Gefäss»; sonst undefined.
 */
export function wieWeiter(
  teile: Teile,
  vorgang: Vorgang,
  jetzt: Date,
  zeitzone: Zeitzone,
): { kennung: string; code: string; links: { text: string; href: string }[] } | undefined {
  const nach = teileNach(teile, vorgang, jetzt, zeitzone);
  const saetze = zeilen<Satz>(teile, 'satz');
  const platzVon = (z: Zustand) =>
    z.platz_id ?? saetze.find((s) => s.id === z.satz_id)?.direktsaat_platz_id ?? null;
  const aktiveAm = (t: Teile, platzId: string) =>
    zeilen<Zustand>(t, 'v_pflanzung_zustand').filter((z) => z.status === 'aktiv' && platzVon(z) === platzId)
      .length;
  const betroffen = new Set<string>();
  for (const s of vorgang)
    if (s.art === 'neu' && typeof s.felder['pflanzung_id'] === 'string') {
      const z = zustandVon(teile, s.felder['pflanzung_id']);
      const pl = z ? platzVon(z) : null;
      if (pl) betroffen.add(pl);
    }
  for (const platzId of betroffen) {
    const platz = zeilen<Platz>(teile, 'platz').find((p) => p.id === platzId);
    if (!platz || platz.rolle !== 'gefaess') continue;
    if (aktiveAm(teile, platzId) > 0 && aktiveAm(nach, platzId) === 0) {
      const code = `${kuerzelVon(teile, platz.anlage_id)}-${platz.kennung}`;
      return {
        kennung: platz.kennung,
        code,
        links: [
          { text: 'Neu bepflanzen', href: `#/saeen?ziel=${code}` },
          { text: 'Zum Gefäss', href: `#/gefaess/${code}` },
        ],
      };
    }
  }
  return undefined;
}
