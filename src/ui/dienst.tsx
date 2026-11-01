// Anmeldung des Service Workers im Modus «prompt»: nie automatisch umschalten, nur melden, dass eine Version wartet.
import { createContext, useContext, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PRUEFINTERVALL_MS = 60 * 60 * 1000;

interface NeueVersion {
  wartet: boolean;
  /** aktiviert die wartende Version und lädt die Seite neu */
  uebernehmen: () => Promise<void>;
}

const NeueVersionKontext = createContext<NeueVersion>({ wartet: false, uebernehmen: async () => {} });

export function DienstAnbieter({ children }: { children: ReactNode }) {
  const {
    needRefresh: [wartet],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registrierung) {
      if (!registrierung) return;
      const pruefen = () => void registrierung.update().catch(() => undefined);
      setInterval(pruefen, PRUEFINTERVALL_MS);
      document.addEventListener(
        'visibilitychange',
        () => document.visibilityState === 'visible' && pruefen(),
      );
    },
  });
  return (
    <NeueVersionKontext.Provider value={{ wartet, uebernehmen: () => updateServiceWorker(true) }}>
      {children}
    </NeueVersionKontext.Provider>
  );
}

export function useNeueVersion(): NeueVersion {
  return useContext(NeueVersionKontext);
}
