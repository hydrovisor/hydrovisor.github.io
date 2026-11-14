// Meldung im App-Rahmen (Plan 224 Entscheid 2; U4, Konzept 6.3): Eine Maske meldet, was sie eben gespeichert hat; die
// Meldezeile steht fest über der Hauptaktion und nimmt es mit «Rückgängig machen» über schreiben() zurück (Storno, 8.1
// Regel 2). Es gibt nur die letzte Meldung; sie endet mit der nächsten Meldung oder beim Wechsel der Maske (A2).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { schreiben } from '../daten/schreiben.ts';
import type { Vorgang } from '../domain/datenpfad/erfassung.ts';
import { ZEITZONE } from '../domain/zeit.ts';
import { Meldezeile } from './bausteine/Meldezeile.tsx';

export interface Meldung {
  text: string;
  /** fertig gebauter Vorgang, der die Meldung zurücknimmt; bei Wiederholung derselbe (TO2) */
  rueckgaengig?: Vorgang;
  /** nach dem gelungenen Zurücknehmen, etwa um die ausgeblendete Zeile wieder zu zeigen */
  nachRueckgaengig?: () => void;
}

interface Zustand {
  nr: number;
  meldung: Meldung;
  fehler?: string;
}

const SPERRE_MS = 400;
const MeldenKontext = createContext<(m: Meldung) => void>(() => undefined);
const ZustandKontext = createContext<{
  zustand: Zustand | undefined;
  setZustand: (z: Zustand | undefined) => void;
}>({ zustand: undefined, setZustand: () => undefined });

export function MeldungAnbieter({ children }: { children: ReactNode }) {
  const [zustand, setZustand] = useState<Zustand>();
  const nr = useRef(0);
  const melden = useCallback((meldung: Meldung) => {
    nr.current += 1;
    setZustand({ nr: nr.current, meldung });
  }, []);
  useEffect(() => {
    const ende = () => setZustand(undefined);
    window.addEventListener('hashchange', ende);
    return () => window.removeEventListener('hashchange', ende);
  }, []);
  const wert = useMemo(() => ({ zustand, setZustand }), [zustand]);
  return (
    <MeldenKontext.Provider value={melden}>
      <ZustandKontext.Provider value={wert}>{children}</ZustandKontext.Provider>
    </MeldenKontext.Provider>
  );
}

/** meldet, was eben gespeichert wurde; ersetzt eine stehende Meldung */
export function useMelden(): (m: Meldung) => void {
  return useContext(MeldenKontext);
}

/** steht eine Meldung? Der Rahmen gibt der Seite dann unten Platz */
export function useMeldungSteht(): boolean {
  return useContext(ZustandKontext).zustand !== undefined;
}

/** die Meldezeile des Rahmens mit «Rückgängig machen» */
export function MeldungZeile() {
  const { zustand, setZustand } = useContext(ZustandKontext);
  // nach dem Erscheinen 400 ms gesperrt (U13): ein Doppeltipper trifft die Taste nicht
  const [freiNr, setFreiNr] = useState(0);
  const [sendet, setSendet] = useState(false);
  const laeuft = useRef(false);
  const nr = zustand?.nr;
  useEffect(() => {
    if (nr === undefined) return undefined;
    const t = setTimeout(() => setFreiNr(nr), SPERRE_MS);
    return () => clearTimeout(t);
  }, [nr]);
  if (!zustand) return null;
  const { meldung, fehler } = zustand;
  const vorgang = meldung.rueckgaengig;

  async function zuruecknehmen(v: Vorgang, z: Zustand) {
    if (laeuft.current) return;
    laeuft.current = true;
    setSendet(true);
    try {
      const r = await schreiben(v, { jetzt: new Date(Date.now()), zeitzone: ZEITZONE });
      if (r.status !== 'gespeichert') {
        setZustand({
          ...z,
          fehler: r.status === 'nicht_gespeichert' ? r.fehler.text : 'Schon anders gespeichert',
        });
        return;
      }
      setZustand({ nr: z.nr, meldung: { text: 'Rückgängig gemacht' } });
      z.meldung.nachRueckgaengig?.();
    } finally {
      laeuft.current = false;
      setSendet(false);
    }
  }

  return (
    <Meldezeile
      text={fehler ? `Nicht rückgängig gemacht: ${fehler}` : meldung.text}
      {...(vorgang && vorgang.length > 0
        ? {
            aktion: {
              text: 'Rückgängig machen',
              gesperrt: sendet || freiNr !== zustand.nr,
              onClick: () => void zuruecknehmen(vorgang, zustand),
            },
          }
        : {})}
    />
  );
}
