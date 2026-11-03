// Lokale Datenbank im Browser (IndexedDB «hydrovisor»; docs/spec/04_architektur.md 4.2 und 4.3).
// Version 1: Speicher «ablaeufe». Version 2 (I0-04): Speicher «buendel» additiv. Die Warteschlange folgt mit Q14.
export const LOKAL_NAME = 'hydrovisor';
export const LOKAL_VERSION = 2;
export const SPEICHER_ABLAEUFE = 'ablaeufe';
export const SPEICHER_BUENDEL = 'buendel';
/** Ereignis an window, wenn das Upgrade blockiert ist; Heute zeigt «App neu laden» */
export const LOKAL_BLOCKIERT = 'hydrovisor-lokal-blockiert';

export function lokalOeffnen(): Promise<IDBDatabase> {
  return new Promise((erfuellen, ablehnen) => {
    const anfrage = indexedDB.open(LOKAL_NAME, LOKAL_VERSION);
    anfrage.onupgradeneeded = () => {
      const db = anfrage.result;
      if (!db.objectStoreNames.contains(SPEICHER_ABLAEUFE))
        db.createObjectStore(SPEICHER_ABLAEUFE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(SPEICHER_BUENDEL))
        db.createObjectStore(SPEICHER_BUENDEL, { keyPath: 'id' });
    };
    anfrage.onsuccess = () => {
      const db = anfrage.result;
      // eine neuere Version in einem anderen Tab soll nicht blockiert werden (Plan 11, Risiko «Upgrade blockiert»)
      db.onversionchange = () => db.close();
      erfuellen(db);
    };
    // eine ältere Ansicht hält die Datenbank offen: melden und weiter auf onsuccess warten (Runde 1, Befund 12)
    anfrage.onblocked = () => window.dispatchEvent(new Event(LOKAL_BLOCKIERT));
    anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}
