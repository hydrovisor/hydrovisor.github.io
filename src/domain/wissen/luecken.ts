// Offene Werte einer Sorte für die Hydroponik-Recherche (Konzept 11.3, Erratum E8; R1.2, R1.3, R1.4, R12.3;
// 03_import_w0.md Abschnitt 9; Plan 37). Rein.
import type { Kulturform, Phase } from '../phasen/profil.ts';

export type LueckenGroesse = 'dauer' | 'bbch' | 'wechselmerkmal' | 'ph' | 'ec' | 'keimart' | 'keimtemp';
export type Luecke = { id: string; phase: Phase; groesse: LueckenGroesse };
export type Kulturtyp = 'blatt' | 'knolle' | 'frucht';

export interface SollwertZeile {
  phase: string;
  groesse: string;
  text_wert: string | null;
  herkunft_ebene: string;
  evidenzklasse: string | null;
  vermerk: string | null;
}
export interface PflichtZeile {
  phase: string;
  groesse: string;
}
export interface SaatempfehlungZeile {
  ebene: string;
  art_id: string | null;
  sorte_id: string | null;
  kulturform: string;
  klasse_saatmenge?: string | null;
  bestaetigt_am: string | null;
}

const PHASEN: readonly Phase[] = ['keimung', 'anzucht', 'wachstum', 'bluete', 'fruchtbildung_reife'];
const BELEGT = new Set(['A', 'B1', 'B2', 'C']);

/** R1.2: zulässige Kulturformen je Kulturtyp */
export const KULTURFORMEN_JE_TYP: Readonly<Record<Kulturtyp, readonly Kulturform[]>> = {
  blatt: ['keimling', 'babyleaf', 'schnitt', 'kopf', 'dauerkultur_blatt'],
  knolle: ['babyleaf', 'kopf'],
  frucht: ['dauerkultur_frucht'],
};

/** belegt nach 9.1: Klasse A bis C auf Ebene Sorte oder Art, nicht Leitkultur (Prüfauftrag, R1.3) */
export function istBelegt(z: Pick<SollwertZeile, 'herkunft_ebene' | 'evidenzklasse' | 'vermerk'>): boolean {
  return (
    (z.herkunft_ebene === 'sorte' || z.herkunft_ebene === 'art') &&
    z.evidenzklasse !== null &&
    BELEGT.has(z.evidenzklasse) &&
    z.vermerk !== 'leitkultur'
  );
}

export function rechercheLuecken(e: {
  sorteId: string;
  artId: string;
  kulturtyp: Kulturtyp;
  kulturformenErlaubt: readonly string[];
  sollwerte: readonly SollwertZeile[];
  pflicht: readonly PflichtZeile[];
  saatempfehlungen: readonly SaatempfehlungZeile[];
}): { werte: Luecke[]; saat: Kulturform[] } {
  const anwendbar = PHASEN.filter((p) =>
    e.sollwerte.some((s) => s.phase === p && s.groesse === 'anwendbar' && s.text_wert === 'ja'),
  );
  const letzte = anwendbar[anwendbar.length - 1];
  const werte: Luecke[] = [];
  for (const phase of anwendbar) {
    for (const p of e.pflicht) {
      if (p.phase !== phase || p.groesse === 'anwendbar') continue;
      if (p.groesse === 'wechselmerkmal' && phase === letzte) continue;
      const belegt = e.sollwerte.some((s) => s.phase === phase && s.groesse === p.groesse && istBelegt(s));
      const id = `${phase}.${p.groesse}`;
      if (!belegt && !werte.some((w) => w.id === id))
        werte.push({ id, phase, groesse: p.groesse as LueckenGroesse });
    }
  }
  const zulaessig = KULTURFORMEN_JE_TYP[e.kulturtyp];
  const saat = zulaessig.filter(
    (k) =>
      e.kulturformenErlaubt.includes(k) &&
      !e.saatempfehlungen.some(
        (s) =>
          s.kulturform === k &&
          s.bestaetigt_am !== null &&
          ((s.ebene === 'sorte' && s.sorte_id === e.sorteId) || (s.ebene === 'art' && s.art_id === e.artId)),
      ),
  );
  return { werte, saat: [...saat] };
}
