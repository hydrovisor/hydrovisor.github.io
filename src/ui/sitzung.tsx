// Sitzung, dauerhafter Speicher und Installation für die ganze App (Use Cases F4 UC0, Plan 8).
// Der Anfangszustand kommt synchron aus dem localStorage, damit Heute ohne Netz sofort erscheint (UC0-AK7).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  SITZUNG_SCHLUESSEL,
  sitzungGespeichert,
  zustandNachEreignis,
  type Sitzungszustand,
} from '../anmeldung/sitzung.ts';
import { dauerhaftenSpeicherAnfragen, type SpeicherStand } from '../anmeldung/speicher.ts';
import { buendelLeeren } from '../daten/buendel.ts';
import { supabase } from '../daten/supabase.ts';

/** Ereignis `beforeinstallprompt` von Chrome (nicht in lib.dom) */
interface InstallAngebot extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Sitzung {
  zustand: Sitzungszustand;
  speicher: SpeicherStand | undefined;
  installiert: boolean;
  /** vorhanden, solange Chrome die Installation anbietet */
  installieren: (() => Promise<void>) | undefined;
}

const SitzungKontext = createContext<Sitzung>({
  zustand: 'abgemeldet',
  speicher: undefined,
  installiert: false,
  installieren: undefined,
});

function gespeichert(): boolean {
  try {
    return sitzungGespeichert(window.localStorage.getItem(SITZUNG_SCHLUESSEL));
  } catch {
    return false;
  }
}

const alsApp = () => window.matchMedia('(display-mode: standalone)').matches;

export function SitzungAnbieter({ children }: { children: ReactNode }) {
  const [zustand, setZustand] = useState<Sitzungszustand>(() =>
    gespeichert() ? 'angemeldet' : 'abgemeldet',
  );
  const [speicher, setSpeicher] = useState<SpeicherStand>();
  const [installiert, setInstalliert] = useState(alsApp);
  const [angebot, setAngebot] = useState<InstallAngebot>();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ereignis, sitzung) => {
      setZustand(zustandNachEreignis(ereignis, sitzung !== null, gespeichert()));
      // nach der Abmeldung gehört das Bündel niemandem mehr (Plan 11 A6)
      if (ereignis === 'SIGNED_OUT') void buendelLeeren().catch(() => undefined);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (zustand !== 'angemeldet') return;
    let aktiv = true;
    void dauerhaftenSpeicherAnfragen(navigator.storage).then((stand) => aktiv && setSpeicher(stand));
    return () => {
      aktiv = false;
    };
  }, [zustand]);

  useEffect(() => {
    const anbieten = (e: Event) => {
      e.preventDefault();
      setAngebot(e as InstallAngebot);
    };
    const fertig = () => {
      setAngebot(undefined);
      setInstalliert(true);
    };
    window.addEventListener('beforeinstallprompt', anbieten);
    window.addEventListener('appinstalled', fertig);
    return () => {
      window.removeEventListener('beforeinstallprompt', anbieten);
      window.removeEventListener('appinstalled', fertig);
    };
  }, []);

  const installieren = angebot
    ? async () => {
        // Chrome lässt prompt() je Ereignis nur einmal zu; ein späteres Angebot kommt als neues Ereignis
        setAngebot(undefined);
        await angebot.prompt().catch(() => undefined);
      }
    : undefined;

  return (
    <SitzungKontext.Provider value={{ zustand, speicher, installiert, installieren }}>
      {children}
    </SitzungKontext.Provider>
  );
}

export function useSitzung(): Sitzung {
  return useContext(SitzungKontext);
}
