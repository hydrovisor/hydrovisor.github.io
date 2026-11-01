// Lokale Datenbank im Browser (IndexedDB «hydrovisor»). Version 1: Speicher «ablaeufe» (docs/spec/04_architektur.md 4.3).
// Weitere Speicher (buendel, warteschlange) folgen mit ihren Paketen über eine höhere Version.
export const LOKAL_NAME = 'hydrovisor';
export const LOKAL_VERSION = 1;
export const SPEICHER_ABLAEUFE = 'ablaeufe';

export function lokalOeffnen(): Promise<IDBDatabase> {
  return new Promise((erfuellen, ablehnen) => {
    const anfrage = indexedDB.open(LOKAL_NAME, LOKAL_VERSION);
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result;
      if (!db.objectStoreNames.contains(SPEICHER_ABLAEUFE))
        db.createObjectStore(SPEICHER_ABLAEUFE, { keyPath: 'id' });
    };
    anfrage.onsuccess = () => erfuellen(anfrage.result);
    anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}
