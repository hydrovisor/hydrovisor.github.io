// Läuft ein Ablauf (Rundgang, Abhakliste, Gefässprüfung, Timer)? Ein Eintrag in «ablaeufe» bedeutet: offen.
import { useEffect, useState } from 'react';
import { lokalOeffnen, SPEICHER_ABLAEUFE } from '../daten/lokal.ts';

export async function istAblaufOffen(): Promise<boolean> {
  const db = await lokalOeffnen();
  try {
    return await new Promise<boolean>((erfuellen, ablehnen) => {
      const anfrage = db.transaction(SPEICHER_ABLAEUFE, 'readonly').objectStore(SPEICHER_ABLAEUFE).count();
      anfrage.onsuccess = () => erfuellen(anfrage.result > 0);
      anfrage.onerror = () => ablehnen(anfrage.error ?? new Error('ablaeufe nicht lesbar'));
    });
  } finally {
    db.close();
  }
}

/** undefined, bis die Abfrage beantwortet ist; neu geprüft, wenn die App wieder sichtbar wird */
export function useAblaufOffen(): boolean | undefined {
  const [offen, setOffen] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let aktiv = true;
    const pruefen = () => {
      istAblaufOffen().then(
        (wert) => aktiv && setOffen(wert),
        // Ohne lesbaren Speicher gilt ein Ablauf als offen: lieber kein Hinweis als ein Umschalten mitten im Ablauf
        () => aktiv && setOffen(true),
      );
    };
    const beiSichtbar = () => document.visibilityState === 'visible' && pruefen();
    pruefen();
    document.addEventListener('visibilitychange', beiSichtbar);
    return () => {
      aktiv = false;
      document.removeEventListener('visibilitychange', beiSichtbar);
    };
  }, []);
  return offen;
}
