// Aufruf eines Etiketts #/e/<code> (R9.2, UC14-AK2, 04_architektur.md 3; Plan 22): Kontext Regal. Löst den Code aus
// dem Bündel auf (ohne Netz, TO1), schreibt je Aufruf eine Zeile etikett_aufruf im Hintergrund (A3) und ersetzt die
// Adresse durch das Ziel; bei «entfernt» und «unbekannt» bleibt die Maske mit Hinweis stehen.
import { useEffect, useRef, useState } from 'react';
import { offeneAblaeufe } from '../../ablauf/speicher.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { laufendeAnsaetze } from '../../domain/abhakliste/folgen.ts';
import type { AnsatzZeile } from '../../domain/bewertung/verlauf.ts';
import type { Teile } from '../../domain/teile.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { aufrufVorgang, etikettAufloesen, type Aufloesung } from '../../domain/etikett/aufloesen.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Notice } from '../bausteine/Notice.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { fortsetzenZiel, hashZu, type Route } from '../router.ts';

/** so lange wartet die Auflösung auf das frische Bündel, dann gilt das gespeicherte */
const GEDULD_MS = 3000;

function zielRoute(a: Extract<Aufloesung, { ergebnis: 'gefunden' }>): Route {
  const { art, code } = a.ziel;
  if (art === 'saeen') return { name: 'saeen', box: code };
  if (art === 'messen') return { name: 'messen', code };
  if (art === 'pruefen') return { name: 'pruefen', code, scan: true };
  return { name: 'gefaess', code };
}

/** Plätze mit laufendem Wechsel im Bündel (Gerätewechsel, Plan 29 A13) */
function laufendeWechselPlaetze(teile: Teile): string[] {
  const ansaetze = (teile['naehrloesungsansatz'] ?? []) as AnsatzZeile[];
  const schritte = (teile['ansatz_schritt'] ?? []) as Parameters<typeof laufendeAnsaetze>[1];
  return laufendeAnsaetze(ansaetze, schritte).map((l) => l.platzId);
}

/** Adresse ersetzen: «Zurück» führt nicht wieder auf den Scan (ausserhalb der Komponente, React-Compiler) */
function ersetzen(route: Route): void {
  window.location.replace(hashZu(route));
}

export function EtikettAufloesen({ code }: { code: string }) {
  const { buendel, liest, frisch } = useBuendel();
  // Beim Kaltstart kommt zuerst das gespeicherte Bündel: aufgelöst wird mit dem frischen, ohne Netz oder nach
  // GEDULD_MS mit dem gespeicherten (TO1; Prüfer Runde 1, Befund 2)
  const [geduldVorbei, setGeduldVorbei] = useState(false);
  useEffect(() => {
    const uhr = setTimeout(() => setGeduldVorbei(true), GEDULD_MS);
    return () => clearTimeout(uhr);
  }, []);
  // offene Wechsel aus dem Speicher «ablaeufe»: ein offener Wechsel geht der offenen Prüfung vor (Plan 29 A18)
  const [lokalePlaetze, setLokalePlaetze] = useState<string[]>();
  useEffect(() => {
    let aktiv = true;
    offeneAblaeufe().then(
      (e) =>
        aktiv &&
        setLokalePlaetze(
          e.filter((x) => x.art === 'abhakliste' && x.platzId).map((x) => x.platzId as string),
        ),
      () => aktiv && setLokalePlaetze([]),
    );
    return () => {
      aktiv = false;
    };
  }, []);
  const bereit = (frisch || geduldVorbei || !navigator.onLine) && lokalePlaetze !== undefined;
  const aufloesung = buendel && bereit ? etikettAufloesen(code, buendel.teile, ZEITZONE) : undefined;
  // je Aufruf genau eine Zeile, auch wenn der Effekt mehrfach läuft (StrictMode, neues Bündel; A3)
  const protokolliert = useRef<string>(undefined);
  useEffect(() => {
    if (!aufloesung) return;
    if (protokolliert.current !== code) {
      protokolliert.current = code;
      // Fehler ohne Netz bleiben unsichtbar, die Weiterleitung wartet nicht (A3)
      void schreiben(aufrufVorgang(code, aufloesung.ergebnis, neueClientId(), jetzt()), {
        jetzt: jetzt(),
        zeitzone: ZEITZONE,
      }).catch(() => undefined);
    }
    // Weiterleitung bei jedem Stand «gefunden», auch wenn ein älteres Bündel zuerst anders auflöste
    if (aufloesung.ergebnis !== 'gefunden') return;
    const plaetze = [...(lokalePlaetze ?? []), ...(buendel ? laufendeWechselPlaetze(buendel.teile) : [])];
    const platzId = buendel ? ortAufloesen(code, buendel.teile)?.platzId : undefined;
    const weiter = fortsetzenZiel(
      { name: 'etikett', code },
      platzId && plaetze.includes(platzId) ? [code] : [],
    );
    ersetzen(weiter.name === 'ansatz' ? weiter : zielRoute(aufloesung));
  }, [aufloesung, code, lokalePlaetze, buendel]);

  return (
    <main className="hv-seite hv-etikett" data-density="regal">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Etikett {code}</h1>
      </header>
      {!aufloesung || aufloesung.ergebnis === 'gefunden' ? (
        <p>{liest || !buendel ? 'Daten werden geladen' : 'Ort wird geöffnet'}</p>
      ) : (
        <>
          <Notice tone="warn" title={aufloesung.text} />
          {aufloesung.ergebnis === 'entfernt' ? (
            <a
              className="hv-btn hv-btn-primary"
              href={hashZu({ name: 'anlage', kuerzel: aufloesung.kuerzel })}
            >
              Zur Anlage
            </a>
          ) : (
            <a className="hv-btn hv-btn-primary" href={hashZu({ name: 'heute' })}>
              Zu Heute
            </a>
          )}
        </>
      )}
    </main>
  );
}
