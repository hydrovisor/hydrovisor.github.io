// Offline-Bündel für die Oberfläche (04_architektur.md 4.2, Plan 11): zuerst aus IndexedDB anzeigen, dann im
// Hintergrund nachladen, beim Start, nach jedem erfolgreichen Schreiben und beim Ereignis «online» (A9).
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { buendelLaden, buendelLesen } from '../daten/buendel.ts';
import { LOKAL_BLOCKIERT } from '../daten/lokal.ts';
import { beiErfolg } from '../daten/schreiben.ts';
import { supabase } from '../daten/supabase.ts';
import type { Buendel } from '../domain/datenpfad/buendel.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { useSitzung } from './sitzung.tsx';

interface Buendellage {
  buendel: Buendel | undefined;
  /** in dieser Sitzung frisch geladen und seither kein Ladefehler wegen fehlendem Netz */
  frisch: boolean;
  /** ist_tim() ist falsch: das Konto hat keinen Zugang */
  keinZugang: boolean;
  /** true, bis das gespeicherte Bündel gelesen ist */
  liest: boolean;
  /** eine ältere Ansicht blockiert das Upgrade der lokalen Datenbank */
  blockiert: boolean;
}

const LEER: Buendellage = {
  buendel: undefined,
  frisch: false,
  keinZugang: false,
  liest: true,
  blockiert: false,
};
const ABGEMELDET: Buendellage = { ...LEER, liest: false };
const BuendelKontext = createContext<Buendellage>(LEER);

export function BuendelAnbieter({ children }: { children: ReactNode }) {
  const { zustand } = useSitzung();
  // die Lage gilt nur für die Sitzung, in der sie entstanden ist (Runde 1, Befunde S2 und 14)
  const [lage, setLage] = useState<{ fuer: number; wert: Buendellage }>({ fuer: 0, wert: LEER });
  const generation = useRef(0);
  const laeuft = useRef(false);
  const nochmal = useRef(false);

  const setzen = useCallback((fuer: number, neu: (l: Buendellage) => Buendellage) => {
    setLage((l) => (fuer === generation.current ? { fuer, wert: neu(l.fuer === fuer ? l.wert : LEER) } : l));
  }, []);

  const nachladen = useCallback(
    async (fuer: number) => {
      // ein Anstoss während eines laufenden Ladens wird danach nachgeholt (Runde 1, Befund 7)
      if (laeuft.current) {
        nochmal.current = true;
        return;
      }
      laeuft.current = true;
      try {
        do {
          nochmal.current = false;
          const ergebnis = await buendelLaden({ jetzt: new Date(Date.now()), zeitzone: ZEITZONE });
          if (ergebnis.status === 'geladen')
            setzen(fuer, (l) => ({
              ...l,
              buendel: ergebnis.buendel,
              frisch: true,
              keinZugang: false,
              liest: false,
            }));
          else if (ergebnis.status === 'kein_zugang')
            setzen(fuer, (l) => ({
              ...l,
              buendel: undefined,
              frisch: false,
              keinZugang: true,
              liest: false,
            }));
          // ohne Netz bleibt der gespeicherte Stand stehen, und Heute zeigt wieder «Stand» (Runde 1, Befund 8)
          else if (ergebnis.fehler.art === 'kein_netz' || ergebnis.fehler.art === 'unklar')
            setzen(fuer, (l) => ({ ...l, frisch: false }));
        } while (nochmal.current && fuer === generation.current);
      } finally {
        laeuft.current = false;
      }
    },
    [setzen],
  );

  useEffect(() => {
    const fuer = ++generation.current;
    if (zustand !== 'angemeldet') return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const nutzerId = data.session?.user.id;
      const gespeichert = nutzerId ? await buendelLesen(nutzerId) : undefined;
      setzen(fuer, (l) => (l.frisch ? l : { ...l, buendel: gespeichert, liest: false }));
      await nachladen(fuer);
    })();
    const online = () => void nachladen(fuer);
    const offline = () => setzen(fuer, (l) => ({ ...l, frisch: false }));
    const blockiert = () => setzen(fuer, (l) => ({ ...l, blockiert: true }));
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener(LOKAL_BLOCKIERT, blockiert);
    const abmelden = beiErfolg(() => void nachladen(fuer));
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener(LOKAL_BLOCKIERT, blockiert);
      abmelden();
    };
  }, [zustand, nachladen, setzen]);

  // ohne Sitzung kein Bündel; die erste Meldung einer neuen Sitzung beginnt bei LEER (setzen)
  const wert = zustand !== 'angemeldet' ? ABGEMELDET : lage.wert;
  return <BuendelKontext.Provider value={wert}>{children}</BuendelKontext.Provider>;
}

export function useBuendel(): Buendellage {
  return useContext(BuendelKontext);
}
