// Leiste unten (Entscheid 0025, Plan 212 A2): Eine Maske meldet, dass sie innerhalb ihrer Route einen Ablauf zeigt
// (Säen ab Schritt 2); der App-Rahmen blendet die Leiste dann aus.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const Kontext = createContext<(aus: boolean) => void>(() => undefined);

export function LeisteAnbieter({ children }: { children: (imAblauf: boolean) => ReactNode }) {
  const [imAblauf, setImAblauf] = useState(false);
  return <Kontext.Provider value={setImAblauf}>{children(imAblauf)}</Kontext.Provider>;
}

/** blendet die Leiste aus, solange `aus` gilt und die Maske steht */
export function useLeisteAus(aus: boolean): void {
  const setzen = useContext(Kontext);
  useEffect(() => {
    setzen(aus);
    return () => setzen(false);
  }, [aus, setzen]);
}
