// Saatgut-Manager (Issue #211, Plan 211): Liste nach Gemüse mit Status als Wort und «ohne Foto», Filter und die Reihe
// für «Fotos nachtragen». Rein (G1), ohne Zeit. «Ohne Foto» heisst: keine gültige Zeile tuetenfoto der Sorte, gleich
// welche Seite (Plan 207: es gilt je Sorte und Seite die jüngste nicht stornierte Zeile).
import type { Teile } from '../teile.ts';
import { sortenListe } from './liste.ts';
import { aktuelleTuetenfotos, type TuetenfotoZeile } from './tuetenfoto.ts';

export type SaatgutStatus = 'vollständig' | 'Recherche offen';

export interface SaatgutZeile {
  sorteId: string;
  name: string;
  artId: string;
  /** Gemüse: art.name_de, sonst art_id */
  artName: string;
  vollstaendig: boolean;
  status: SaatgutStatus;
  ohneFoto: boolean;
  /** Pfad der Vorderseite, sonst der Rückseite (Tütenbild in der Liste) */
  fotoPfad?: string;
}

/** «Vorrätig» = alle gültigen Sorten, bis N3 «aufgebraucht» bringt (Plan 211 A5) */
export type SaatgutFilter = 'vorraetig' | 'ohne_foto';

const vergleich = (a: string, b: string) => a.localeCompare(b, 'de-CH');

/** Listenreihenfolge: nach Gemüse, dann nach Name (de-CH) */
function ordnen(a: SaatgutZeile, b: SaatgutZeile): number {
  return vergleich(a.artName, b.artName) || vergleich(a.name, b.name);
}

export function saatgutListe(t: Teile): SaatgutZeile[] {
  const fotos = (t['tuetenfoto'] ?? []) as TuetenfotoZeile[];
  const artVon = new Map(
    ((t['sorte'] ?? []) as Record<string, unknown>[])
      .filter((s) => s['gueltig_bis'] === null || s['gueltig_bis'] === undefined)
      .map((s) => [String(s['sorte_id']), typeof s['art_id'] === 'string' ? s['art_id'] : '']),
  );
  return sortenListe(t)
    .map((s): SaatgutZeile => {
      const aktuell = aktuelleTuetenfotos(fotos, s.sorteId);
      const fotoPfad = aktuell.vorne?.pfad ?? aktuell.hinten?.pfad;
      return {
        sorteId: s.sorteId,
        name: s.name,
        artId: artVon.get(s.sorteId) ?? '',
        artName: s.artName,
        vollstaendig: s.vollstaendig,
        status: s.vollstaendig ? 'vollständig' : 'Recherche offen',
        ohneFoto: fotoPfad === undefined,
        ...(fotoPfad !== undefined ? { fotoPfad } : {}),
      };
    })
    .sort(ordnen);
}

function passt(z: SaatgutZeile, filter: SaatgutFilter): boolean {
  return filter === 'ohne_foto' ? z.ohneFoto : true;
}

export function saatgutGruppen(
  liste: readonly SaatgutZeile[],
  filter: SaatgutFilter,
): { gemuese: string; sorten: SaatgutZeile[] }[] {
  const gruppen = new Map<string, SaatgutZeile[]>();
  for (const z of [...liste].sort(ordnen)) {
    if (!passt(z, filter)) continue;
    const g = gruppen.get(z.artName);
    if (g) g.push(z);
    else gruppen.set(z.artName, [z]);
  }
  return [...gruppen.entries()]
    .map(([gemuese, sorten]) => ({ gemuese, sorten }))
    .sort((a, b) => vergleich(a.gemuese, b.gemuese));
}

export function saatgutZahlen(liste: readonly SaatgutZeile[]): { vorraetig: number; ohneFoto: number } {
  return {
    vorraetig: liste.filter((z) => passt(z, 'vorraetig')).length,
    ohneFoto: liste.filter((z) => passt(z, 'ohne_foto')).length,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Fotos nachtragen

export interface NachtragEintrag {
  sorteId: string;
  name: string;
  artName: string;
}

export interface NachtragStand {
  reihe: readonly NachtragEintrag[];
  index: number;
  ergaenzt: number;
  uebersprungen: number;
}

export type NachtragPosition =
  | { fertig: false; nummer: number; gesamt: number; eintrag: NachtragEintrag }
  | { fertig: true; ergaenzt: number; uebersprungen: number };

/** Sorten ohne Foto in der Reihenfolge der Liste */
export function nachtragReihe(liste: readonly SaatgutZeile[]): NachtragEintrag[] {
  return [...liste]
    .sort(ordnen)
    .filter((z) => z.ohneFoto)
    .map((z) => ({ sorteId: z.sorteId, name: z.name, artName: z.artName }));
}

/** Schnappschuss beim Start: spätere Bündel ändern Reihe, Position und Gesamtzahl nicht */
export function nachtragStarten(liste: readonly SaatgutZeile[]): NachtragStand {
  return { reihe: nachtragReihe(liste), index: 0, ergaenzt: 0, uebersprungen: 0 };
}

export function nachtragWeiter(stand: NachtragStand, wie: 'ergaenzt' | 'uebersprungen'): NachtragStand {
  if (stand.index >= stand.reihe.length) return stand;
  return {
    ...stand,
    index: stand.index + 1,
    ergaenzt: stand.ergaenzt + (wie === 'ergaenzt' ? 1 : 0),
    uebersprungen: stand.uebersprungen + (wie === 'uebersprungen' ? 1 : 0),
  };
}

export function nachtragPosition(stand: NachtragStand): NachtragPosition {
  const eintrag = stand.reihe[stand.index];
  if (!eintrag) return { fertig: true, ergaenzt: stand.ergaenzt, uebersprungen: stand.uebersprungen };
  return { fertig: false, nummer: stand.index + 1, gesamt: stand.reihe.length, eintrag };
}
