// Lokale Datenbank im Browser (IndexedDB «hydrovisor»; docs/spec/04_architektur.md 4.2 und 4.3).
// Version 1: Speicher «ablaeufe». Version 2 (I0-04): Speicher «buendel» additiv. Die Warteschlange folgt mit Q14.
export const LOKAL_NAME = 'hydrovisor';
export const LOKAL_VERSION = 2;
export const SPEICHER_ABLAEUFE = 'ablaeufe';
export const SPEICHER_BUENDEL = 'buendel';
/** Ereignis an window, wenn das Upgrade blockiert ist; Heute zeigt «App neu laden» */
export const LOKAL_BLOCKIERT = 'hydrovisor-lokal-blockiert';
/** Ereignis an window, wenn das Öffnen nach einer Blockade doch gelingt */
export const LOKAL_FREI = 'hydrovisor-lokal-frei';

let blockiert = false;
/** für Hörer, die sich erst nach einem onblocked anmelden (Runde 2, Befund N4) */
export function lokalBlockiert(): boolean {
  return blockiert;
}

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
      if (blockiert) {
        blockiert = false;
        window.dispatchEvent(new Event(LOKAL_FREI));
      }
      erfuellen(db);
    };
    // eine ältere Ansicht hält die Datenbank offen: melden und weiter auf onsuccess warten (Runde 1, Befund 12)
    anfrage.onblocked = () => {
      blockiert = true;
      window.dispatchEvent(new Event(LOKAL_BLOCKIERT));
    };
    anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('IndexedDB nicht verfügbar'));
  });
}
