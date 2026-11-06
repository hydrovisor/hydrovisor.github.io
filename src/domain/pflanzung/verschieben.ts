// Verschieben und Tauschen von Töpfen (Plan 33; UC6-AK3, UC6-AK4, UC6-AK8, R8.3, R8.4). Rein: `jetzt` und Zeitzone als
// Parameter, Kalendertage in Zürich (G2). Ein Vorgang aus Ereignissen verschieben oder tausch über schreiben().
import {
  gefaessAm,
  gefaessStatus,
  plaetzeAus,
  zeilen,
  type NetztopfZeile,
  type PlatzZeile,
  type Teile,
} from '../anlage/teile.ts';
import type { Schritt, Verstoss, Vorgang } from '../datenpfad/erfassung.ts';
import { kalendertag, tagKurz, tageZwischen, type Zeitzone } from '../zeit.ts';
import {
  deckelBelegung,
  istStation,
  lochGroesse,
  pflanzungenImTopf,
  sorteDesSatzes,
  topfOrt,
  type DeckelLoch,
} from './topf.ts';

export const HINWEIS_WURZELN = 'Wurzeln vermutlich verwachsen, nur innerhalb des Gefässes tauschen';
const HINWEIS_GESPERRT = 'Abweichung in der Kurzprüfung: erst prüfen, dann in ein anderes Gefäss';
const HINWEIS_STATION = 'Station: Sämlinge verlassen die Station nur über Umsetzen';
/** R8.4: bis 10 Tage nach dem Umsetzen in ein anderes Gefäss */
const WURZEL_TAGE = 10;

interface Ereignis {
  id: string;
  typ: string;
  pflanzung_id: string | null;
  platz_id: string | null;
  daten?: Record<string, unknown> | null;
  gilt_ab: string;
  storniert_am: string | null;
}

const ereignisse = (teile: Teile, teil: string) =>
  zeilen<Ereignis>(teile, teil).filter((e) => e.storniert_am === null);

const kennungVon = (teile: Teile, platzId: string) =>
  zeilen<PlatzZeile>(teile, 'platz').find((p) => p.id === platzId)?.kennung ?? '';

/** Kalendertag des letzten umsetzen; ohne umsetzen der Saattag bei Direktsaat (A17); sonst undefined */
export function umgesetztAm(teile: Teile, pflanzungId: string, zeitzone: Zeitzone): string | undefined {
  const umsetzen = ereignisse(teile, 'ereignis_pflanzung')
    .filter((e) => e.typ === 'umsetzen' && e.pflanzung_id === pflanzungId)
    .sort((a, b) => Date.parse(b.gilt_ab) - Date.parse(a.gilt_ab))[0];
  if (umsetzen) return kalendertag(new Date(umsetzen.gilt_ab), zeitzone);
  const satzId = zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').find(
    (p) => p.id === pflanzungId,
  )?.satz_id;
  const satz = zeilen<{ id: string; saatdatum: string; direktsaat_platz_id: string | null }>(
    teile,
    'satz',
  ).find((s) => s.id === satzId);
  return satz?.direktsaat_platz_id ? satz.saatdatum : undefined;
}

/** offene Abweichung der Kurzprüfung am Platz: je Punkt zählt die jüngste Prüfung (R8.4) */
function gesperrt(teile: Teile, platzId: string): boolean {
  const juengste = new Map<string, Ereignis>();
  for (const e of [...ereignisse(teile, 'ereignis_platz'), ...ereignisse(teile, 'ereignis')]) {
    if (e.typ !== 'kurzpruefung' || e.platz_id !== platzId) continue;
    const punkt = String(e.daten?.['punkt'] ?? '');
    const bisher = juengste.get(punkt);
    if (!bisher || Date.parse(e.gilt_ab) >= Date.parse(bisher.gilt_ab)) juengste.set(punkt, e);
  }
  return [...juengste.values()].some((e) => e.daten?.['ok'] === false);
}

/** Tage seit dem Umsetzen (Kalendertage Zürich), ohne Bezug undefined */
function tagSeitUmsetzen(
  teile: Teile,
  pflanzungId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): number | undefined {
  const am = umgesetztAm(teile, pflanzungId, zeitzone);
  return am ? tageZwischen(am, kalendertag(jetzt, zeitzone)) : undefined;
}

export interface VerschiebEingabe {
  netztopfId: string;
  zielPlatzId: string;
  zielLochNr: number;
}

/** Topf, der im Zielloch steht (aus der Deckelbelegung, ohne abwesenden Heimtopf) */
function topfImLoch(teile: Teile, platzId: string, lochNr: number): DeckelLoch | undefined {
  return deckelBelegung(teile, platzId).find((l) => l.lochNr === lochNr);
}

export function verschiebenPruefen(
  teile: Teile,
  e: VerschiebEingabe,
  jetzt: Date,
  zeitzone: Zeitzone,
): Verstoss[] {
  const v: Verstoss[] = [];
  const ort = topfOrt(teile, e.netztopfId);
  if (!ort) return [{ feld: 'topf', grund: 'Topf nicht bekannt' }];
  const loch = topfImLoch(teile, e.zielPlatzId, e.zielLochNr);
  if (!loch) return [{ feld: 'loch', grund: 'Loch nicht bekannt' }];
  if (ort.platzId === e.zielPlatzId && ort.lochNr === e.zielLochNr)
    return [{ feld: 'gleich', grund: 'Topf steht schon hier' }];
  // R8.3: Station verlassen nur über Umsetzen, nicht auf eine Station verschieben
  if (istStation(teile, ort.platzId) || istStation(teile, e.zielPlatzId))
    v.push({ feld: 'station', grund: HINWEIS_STATION });
  // R8.3: gleiche Topfgrösse, auch für den Partner beim Tausch
  const zielGroesse = lochGroesse(teile, e.zielPlatzId);
  const partner = loch.kennung !== undefined ? loch.netztopfId : undefined;
  const partnerOrt = partner ? topfOrt(teile, partner) : undefined;
  if (
    zielGroesse !== ort.groesseMm ||
    (partnerOrt && lochGroesse(teile, ort.platzId) !== partnerOrt.groesseMm)
  )
    v.push({ feld: 'groesse', grund: `Nur Töpfe gleicher Grösse (${String(ort.groesseMm)} mm)` });
  if (loch.kennung === undefined && loch.abwesend)
    v.push({ feld: 'abwesend', grund: `Topf dieses Lochs steht anderswo (${loch.abwesend})` });
  else if (loch.kennung === undefined) v.push({ feld: 'abwesend', grund: 'In diesem Loch steht kein Topf' });
  const partnerPflanzen = partner ? pflanzungenImTopf(teile, partner) : [];
  if (partner && partnerPflanzen.length === 0 && loch.zustand === 'reserviert')
    v.push({ feld: 'reserviert', grund: 'Topf ist für einen Satz reserviert' });
  // R8.4: über Gefässe hinweg höchstens 10 Tage nach dem Umsetzen und ohne offene Abweichung am Herkunftsort
  if (ort.platzId !== e.zielPlatzId) {
    const bewegt: { pflanzungen: string[]; herkunft: string }[] = [
      { pflanzungen: pflanzungenImTopf(teile, e.netztopfId), herkunft: ort.platzId },
      ...(partner ? [{ pflanzungen: partnerPflanzen, herkunft: e.zielPlatzId }] : []),
    ];
    const zuAlt = bewegt.some((b) =>
      b.pflanzungen.some((p) => (tagSeitUmsetzen(teile, p, jetzt, zeitzone) ?? 0) > WURZEL_TAGE),
    );
    if (zuAlt) v.push({ feld: 'wurzeln', grund: HINWEIS_WURZELN });
    if (bewegt.some((b) => b.pflanzungen.length > 0 && gesperrt(teile, b.herkunft)))
      v.push({ feld: 'gesperrt', grund: HINWEIS_GESPERRT });
  }
  return v;
}

/** Deckel des Zielgefässes mit nicht wählbaren Löchern (Plan 33) */
export function verschiebZiele(
  teile: Teile,
  netztopfId: string,
  zielPlatzId: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): (DeckelLoch & { nichtWaehlbar?: true; zustandName: string })[] {
  return deckelBelegung(teile, zielPlatzId).map((l) => {
    const v = verschiebenPruefen(teile, { netztopfId, zielPlatzId, zielLochNr: l.lochNr }, jetzt, zeitzone);
    const zustandName = v.some((x) => x.feld === 'gleich')
      ? 'dieser Topf'
      : l.abwesend && l.kennung === undefined
        ? 'Topf anderswo'
        : l.zustand === 'belegt'
          ? `belegt${l.sorte ? ` · ${l.sorte}` : ''}`
          : l.zustand;
    // Wurzeln und Sperre gelten fürs ganze Gefäss (Hinweis über dem Deckel); ein Tipp schreibt dann nichts (R8.4)
    const lochGrund = v.some((x) => x.feld !== 'wurzeln' && x.feld !== 'gesperrt');
    return { ...l, ...(lochGrund ? { nichtWaehlbar: true as const } : {}), zustandName };
  });
}

export interface VerschiebAnsicht {
  topf: { netztopfId: string; kennung: string; platzId: string; lochNr: number };
  pflanzung?: { pflanzungId: string; sorte: string; umgesetztAm: string; tag: number };
  kopf: string;
  zielgefaesse: { platzId: string; kennung: string; erlaubt: boolean; hinweis?: string }[];
  wissenskarte?: { text: string };
}

/** Topf aus dem Code «R-2.3.1» (Kürzel der Anlage und Topfkennung) */
function topfAusCode(teile: Teile, code: string): NetztopfZeile | undefined {
  const m = /^([A-Z]{1,3})-(.+)$/.exec(code);
  if (!m) return undefined;
  const anlage = zeilen<{ id: string; kuerzel: string }>(teile, 'anlage').find((a) => a.kuerzel === m[1]);
  return zeilen<NetztopfZeile>(teile, 'netztopf').find(
    (n) => n.anlage_id === anlage?.id && n.kennung === m[2] && n.storniert_am === null && n.aktiv !== false,
  );
}

export function verschiebAnsicht(
  teile: Teile,
  code: string,
  jetzt: Date,
  zeitzone: Zeitzone,
): VerschiebAnsicht | undefined {
  const n = topfAusCode(teile, code);
  const ort = n ? topfOrt(teile, n.id) : undefined;
  if (!n || !ort) return undefined;
  const pflanzungId = pflanzungenImTopf(teile, n.id)[0];
  const satzId = pflanzungId
    ? zeilen<{ id: string; satz_id: string }>(teile, 'pflanzung').find((p) => p.id === pflanzungId)?.satz_id
    : undefined;
  const sorte = satzId ? (sorteDesSatzes(teile, satzId) ?? 'Sorte') : undefined;
  const am = pflanzungId ? umgesetztAm(teile, pflanzungId, zeitzone) : undefined;
  const heute = kalendertag(jetzt, zeitzone);
  const pflanzung =
    pflanzungId && sorte && am
      ? { pflanzungId, sorte, umgesetztAm: am, tag: tageZwischen(am, heute) }
      : undefined;

  // Zielgefässe: eigenes zuerst, dann übrige ohne feste Dosis mit gleicher Topfgrösse (keine Station)
  const anlageId = n.anlage_id;
  const andere = plaetzeAus(teile, anlageId)
    .filter((p) => {
      // entfernte Gefässe sind kein Ziel (Runde 1 Befund 8)
      const g = gefaessAm(teile, p.id);
      return (
        p.id !== ort.platzId &&
        g !== undefined &&
        gefaessStatus(teile, g.id) !== 'entfernt' &&
        !istStation(teile, p.id)
      );
    })
    .filter((p) => lochGroesse(teile, p.id) === ort.groesseMm)
    .sort((a, b) => a.kennung.localeCompare(b.kennung, 'de', { numeric: true }));
  const pflanzen = pflanzungenImTopf(teile, n.id);
  const zuAlt = pflanzen.some((p) => (tagSeitUmsetzen(teile, p, jetzt, zeitzone) ?? 0) > WURZEL_TAGE);
  const sperre = pflanzen.length > 0 && gesperrt(teile, ort.platzId);
  const zielgefaesse: VerschiebAnsicht['zielgefaesse'] = [];
  if (!istStation(teile, ort.platzId))
    zielgefaesse.push({ platzId: ort.platzId, kennung: kennungVon(teile, ort.platzId), erlaubt: true });
  for (const p of andere) {
    const hinweis = zuAlt ? HINWEIS_WURZELN : sperre ? HINWEIS_GESPERRT : undefined;
    zielgefaesse.push({
      platzId: p.id,
      kennung: p.kennung,
      erlaubt: hinweis === undefined,
      ...(hinweis ? { hinweis } : {}),
    });
  }
  const karte = zeilen<{ typ: string; text: string; gueltig_bis?: string | null }>(
    teile,
    'wissenseintrag',
  ).find((w) => w.typ === 'topf_umsetzen' && (w.gueltig_bis ?? null) === null);
  const umgesetzt = pflanzungId
    ? ereignisse(teile, 'ereignis_pflanzung').some(
        (e) => e.typ === 'umsetzen' && e.pflanzung_id === pflanzungId,
      )
    : false;
  const kopf = pflanzung
    ? `Topf ${n.kennung} · ${pflanzung.sorte} · ${umgesetzt ? 'umgesetzt' : 'gesät'} am ${tagKurz(pflanzung.umgesetztAm)}`
    : sorte
      ? `Topf ${n.kennung} · ${sorte}`
      : `Topf ${n.kennung} · leer`;
  return {
    topf: { netztopfId: n.id, kennung: n.kennung, platzId: ort.platzId, lochNr: ort.lochNr },
    ...(pflanzung ? { pflanzung } : {}),
    kopf,
    zielgefaesse,
    ...(karte ? { wissenskarte: { text: karte.text } } : {}),
  };
}

export function verschiebVorgang(
  teile: Teile,
  e: VerschiebEingabe,
  ids: () => string,
  jetzt: Date,
  zeitzone: Zeitzone,
): { vorgang: Vorgang; art: 'verschieben' | 'tausch'; text: string } {
  const ort = topfOrt(teile, e.netztopfId);
  const loch = topfImLoch(teile, e.zielPlatzId, e.zielLochNr);
  if (!ort || !loch || verschiebenPruefen(teile, e, jetzt, zeitzone).length > 0)
    return { vorgang: [], art: 'verschieben', text: '' };
  const iso = jetzt.toISOString();
  const partner = loch.netztopfId as string;
  const partnerKennung = loch.kennung ?? '';
  const eigene = pflanzungenImTopf(teile, e.netztopfId)[0];
  const fremde = pflanzungenImTopf(teile, partner)[0];
  const hin = {
    von_platz_id: ort.platzId,
    von_loch_nr: ort.lochNr,
    nach_platz_id: e.zielPlatzId,
    nach_loch_nr: e.zielLochNr,
  };
  const her = {
    von_platz_id: e.zielPlatzId,
    von_loch_nr: e.zielLochNr,
    nach_platz_id: ort.platzId,
    nach_loch_nr: ort.lochNr,
  };
  const schritt = (
    typ: string,
    netztopfId: string,
    pflanzungId: string | undefined,
    daten: Record<string, unknown>,
  ): Schritt => {
    const id = ids();
    return {
      art: 'neu',
      tabelle: 'ereignis',
      felder: {
        client_id: id,
        id,
        typ,
        netztopf_id: netztopfId,
        ...(pflanzungId ? { pflanzung_id: pflanzungId } : {}),
        gilt_ab: iso,
        daten,
      },
    };
  };
  if (fremde) {
    const vorgangId = ids();
    return {
      art: 'tausch',
      text: `Getauscht: ${topfOrt(teile, e.netztopfId)?.kennung ?? ''} ↔ ${partnerKennung}`,
      vorgang: [
        schritt('tausch', e.netztopfId, eigene, { ...hin, vorgang_id: vorgangId }),
        schritt('tausch', partner, fremde, { ...her, vorgang_id: vorgangId }),
      ],
    };
  }
  const kennung = topfOrt(teile, e.netztopfId)?.kennung ?? '';
  return {
    art: 'verschieben',
    text: `Verschoben: ${kennung} auf ${kennungVon(teile, e.zielPlatzId)}.${String(e.zielLochNr)} · leeren Topf ${partnerKennung} in ${kennungVon(teile, ort.platzId)} Loch ${String(ort.lochNr)} stecken`,
    vorgang: [
      schritt('verschieben', e.netztopfId, eigene, hin),
      schritt('verschieben', partner, undefined, her),
    ],
  };
}
