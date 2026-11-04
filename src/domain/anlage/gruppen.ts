// Gruppierung nach Anlage in Heute (UC1-AK5, Konzept 5.1; Plan 20): erst ab zwei echten Anlagen; Demo- und
// Testanlagen lösen keine Gruppierung aus. Rein.
import { anlagenAus, type AnlageZeile, type Teile } from './teile.ts';

export function echteAnlagen(teile: Teile): AnlageZeile[] {
  return anlagenAus(teile).filter((a) => a.datenart === 'echt');
}

export function heuteGruppiert(teile: Teile): boolean {
  return echteAnlagen(teile).length > 1;
}

/** Orte je Anlage in der Reihenfolge der Anlagen (echte zuerst, dann nach Kürzel); leere Gruppen fallen weg */
export function nachAnlage<T extends { anlageId: string }>(
  teile: Teile,
  orte: readonly T[],
): { anlage: AnlageZeile; orte: T[] }[] {
  return anlagenAus(teile)
    .map((anlage) => ({ anlage, orte: orte.filter((o) => o.anlageId === anlage.id) }))
    .filter((g) => g.orte.length > 0);
}
