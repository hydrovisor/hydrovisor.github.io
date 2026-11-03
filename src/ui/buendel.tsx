// Offline-Bündel für die Oberfläche (04_architektur.md 4.2, Plan 11): zuerst aus IndexedDB anzeigen, dann im
// Hintergrund nachladen, beim Start, nach jedem erfolgreichen Schreiben und beim Ereignis «online» (A9).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { buendelLaden, buendelLesen } from '../daten/buendel.ts';
import { beiErfolg } from '../daten/schreiben.ts';
import { supabase } from '../daten/supabase.ts';
import type { Buendel } from '../domain/datenpfad/buendel.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { useSitzung } from './sitzung.tsx';

interface Buendellage {
  buendel: Buendel | undefined;
  /** in dieser Sitzung frisch geladen */
  frisch: boolean;
  /** ist_tim() ist falsch: das Konto hat keinen Zugang */
  keinZugang: boolean;
  /** true, bis das gespeicherte Bündel gelesen ist */
  liest: boolean;
}

const LEER: Buendellage = { buendel: undefined, frisch: false, keinZugang: false, liest: true };
const ABGEMELDET: Buendellage = { ...LEER, liest: false };
const BuendelKontext = createContext<Buendellage>(LEER);

export function BuendelAnbieter({ children }: { children: ReactNode }) {
  const { zustand } = useSitzung();
  const [lage, setLage] = useState<Buendellage>(LEER);
  const laeuft = useRef(false);

  const nachladen = useCallback(async () => {
    if (laeuft.current) return;
    laeuft.current = true;
    try {
      const ergebnis = await buendelLaden({ jetzt: new Date(Date.now()), zeitzone: ZEITZONE });
      if (ergebnis.status === 'geladen')
        setLage({ buendel: ergebnis.buendel, frisch: true, keinZugang: false, liest: false });
      else if (ergebnis.status === 'kein_zugang') setLage((l) => ({ ...l, keinZugang: true, liest: false }));
      // bei einem Fehler bleibt der gespeicherte Stand stehen
    } finally {
      laeuft.current = false;
    }
  }, []);

  useEffect(() => {
    if (zustand !== 'angemeldet') return;
    let aktiv = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const nutzerId = data.session?.user.id;
      const gespeichert = nutzerId ? await buendelLesen(nutzerId) : undefined;
      if (aktiv) setLage((l) => (l.frisch ? l : { ...l, buendel: gespeichert, liest: false }));
      if (aktiv) await nachladen();
    })();
    const online = () => void nachladen();
    window.addEventListener('online', online);
    const abmelden = beiErfolg(() => void nachladen());
    return () => {
      aktiv = false;
      window.removeEventListener('online', online);
      abmelden();
    };
  }, [zustand, nachladen]);

  // ohne Sitzung kein Bündel; beim nächsten Anmelden liest der Effekt neu
  return (
    <BuendelKontext.Provider value={zustand === 'angemeldet' ? lage : ABGEMELDET}>
      {children}
    </BuendelKontext.Provider>
  );
}

export function useBuendel(): Buendellage {
  return useContext(BuendelKontext);
}
