// Dauerhafter Speicher (docs/spec/04_architektur.md Abschnitt 7, UC0): Chrome räumt IndexedDB und die Sitzung
// sonst unter Speicherdruck. Erst nachsehen, dann anfragen; die Anfrage zeigt in Chrome keinen Dialog.

export type SpeicherStand = 'erteilt' | 'nicht-erteilt' | 'nicht-verfuegbar';

type Speicherverwaltung = Pick<StorageManager, 'persisted' | 'persist'>;

export async function dauerhaftenSpeicherAnfragen(
  verwaltung: Partial<Speicherverwaltung> | undefined,
): Promise<SpeicherStand> {
  if (!verwaltung?.persisted || !verwaltung.persist) return 'nicht-verfuegbar';
  try {
    if (await verwaltung.persisted()) return 'erteilt';
    return (await verwaltung.persist()) ? 'erteilt' : 'nicht-erteilt';
  } catch {
    return 'nicht-erteilt';
  }
}
