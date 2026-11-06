// Speicher «ablaeufe» (IndexedDB, 04_architektur.md 4.3; Plan 29 Risiko 3, 4): Ablaufstand der Abhakliste und des
// Nachmessens nach jedem Tipp, damit Neuladen, Hash-Wechsel und Scan beim nächsten offenen Haken weitermachen.
import { lokalOeffnen, SPEICHER_ABLAEUFE } from '../daten/lokal.ts';

/** Eintrag mit Schlüssel id, etwa «abhakliste:<platzId>» oder «nachmessen:<platzId>» (A17) */
export interface AblaufEintrag {
  id: string;
  art: string;
  platzId?: string;
  code?: string;
  letzteAktionAm?: string;
  [feld: string]: unknown;
}

async function mitSpeicher<T>(modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await lokalOeffnen();
  try {
    return await new Promise<T>((erfuellen, ablehnen) => {
      const tx = db.transaction(SPEICHER_ABLAEUFE, modus);
      const anfrage = f(tx.objectStore(SPEICHER_ABLAEUFE));
      let wert: T;
      anfrage.onsuccess = () => {
        wert = anfrage.result as T;
      };
      tx.oncomplete = () => erfuellen(wert);
      tx.onerror = () => ablehnen(tx.error ?? new Error('ablaeufe nicht lesbar'));
      tx.onabort = () => ablehnen(tx.error ?? new Error('ablaeufe abgebrochen'));
    });
  } finally {
    db.close();
  }
}

export async function ablaufLesen<T extends AblaufEintrag>(id: string): Promise<T | undefined> {
  return mitSpeicher<T | undefined>('readonly', (s) => s.get(id));
}

export async function ablaufSchreiben(eintrag: AblaufEintrag): Promise<void> {
  // structuredClone entfernt Funktionen und Proxys; der Stand ist JSON-serialisierbar
  await mitSpeicher<unknown>('readwrite', (s) => s.put(JSON.parse(JSON.stringify(eintrag)) as AblaufEintrag));
}

export async function ablaufLoeschen(id: string): Promise<void> {
  await mitSpeicher<unknown>('readwrite', (s) => s.delete(id));
}

export async function offeneAblaeufe(): Promise<AblaufEintrag[]> {
  return mitSpeicher<AblaufEintrag[]>('readonly', (s) => s.getAll());
}
