// Tütenfoto einer Sorte aus dem Bündel, angezeigt über signierte Links (60 s) aus dem privaten Bucket (Plan 207;
// Konzept 11.3). Ohne Zeile im Bündel «Noch kein Tütenfoto» (geht offline); mit Zeile, aber ohne Verbindung oder bei
// einem Fehler beim Signieren «Foto nur mit Verbindung» (A7). Die Links werden bei jedem Öffnen neu geholt.
import { useEffect, useState } from 'react';
import { fotoLink } from '../daten/ki.ts';
import { aktuelleTuetenfotos, type TuetenfotoZeile } from '../domain/sorten/tuetenfoto.ts';
import { Tuetenfoto } from './bausteine/Tuetenfoto.tsx';
import { useBuendel } from './buendel.tsx';

interface Links {
  /** Pfade, für die die Links gelten */
  pfade: string;
  vorne?: string | undefined;
  hinten?: string | undefined;
  fehler?: boolean;
}

export function TuetenfotoAnzeige({ sorteId, leerText }: { sorteId: string; leerText?: string }) {
  const { buendel } = useBuendel();
  const zeilen = (buendel?.teile['tuetenfoto'] ?? []) as TuetenfotoZeile[];
  const aktuell = aktuelleTuetenfotos(zeilen, sorteId);
  const pfadVorne = aktuell.vorne?.pfad;
  const pfadHinten = aktuell.hinten?.pfad;
  const pfade = `${pfadVorne ?? ''}|${pfadHinten ?? ''}`;
  const [links, setLinks] = useState<Links>();

  useEffect(() => {
    if (!pfadVorne && !pfadHinten) return;
    let aktiv = true;
    // ohne Verbindung gar nicht erst signieren: beide Links fehlen, die Anzeige zeigt «Foto nur mit Verbindung»
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const link = (pfad: string | undefined) =>
      pfad && !offline ? fotoLink(pfad) : Promise.resolve(undefined);
    void Promise.all([link(pfadVorne), link(pfadHinten)]).then(([vorne, hinten]) => {
      if (!aktiv) return;
      const fehlt = (pfadVorne && !vorne) || (pfadHinten && !hinten);
      setLinks(fehlt ? { pfade, fehler: true } : { pfade, vorne, hinten });
    });
    return () => {
      aktiv = false;
    };
  }, [pfade, pfadVorne, pfadHinten]);

  if (!pfadVorne && !pfadHinten) return <Tuetenfoto leerText={leerText} />;
  if (!links || links.pfade !== pfade) return <Tuetenfoto hinweis="laedt" />;
  if (links.fehler) return <Tuetenfoto hinweis="offline" />;
  return <Tuetenfoto bild={links.vorne} rueckseite={links.hinten} />;
}
