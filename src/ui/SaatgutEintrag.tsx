// Eine Sorte in der Liste «Saatgut» (Plan 211 A11): Sortenzeile als Link mit Tütenbild über einen signierten Link
// (60 s). Ohne Foto, ohne Verbindung, während der Link geholt wird oder bei einem Fehler das Kamerasymbol; lädt das
// Bild nicht, wird einmal neu signiert, danach bleibt der Platzhalter (wie Plan 207 A8).
import { useEffect, useState } from 'react';
import { fotoLink } from '../daten/ki.ts';
import type { SaatgutZeile } from '../domain/sorten/saatgut.ts';
import { Sortenzeile } from './bausteine/Sortenzeile.tsx';
import { hashZu } from './router.ts';

export function SaatgutEintrag({ zeile }: { zeile: SaatgutZeile }) {
  const pfad = zeile.fotoPfad;
  const [versuch, setVersuch] = useState(0);
  const [link, setLink] = useState<{ schluessel: string; url?: string | undefined }>();
  const schluessel = `${pfad ?? ''}#${versuch}`;

  useEffect(() => {
    if (!pfad || versuch > 1) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    let aktiv = true;
    void fotoLink(pfad).then((url) => {
      if (aktiv) setLink({ schluessel, url });
    });
    return () => {
      aktiv = false;
    };
  }, [pfad, versuch, schluessel]);

  const bild = link?.schluessel === schluessel && versuch <= 1 ? link.url : undefined;
  // Plan 215 A6: aufgebrauchte Sorten nur mit dem Wort «aufgebraucht»
  const zusatz = zeile.ohneFoto && !zeile.aufgebraucht ? `${zeile.status} · ohne Foto` : zeile.status;
  return (
    <Sortenzeile
      titel={zeile.name}
      zusatz={zusatz}
      href={hashZu({ name: 'sorte', sorte: zeile.sorteId })}
      bild={bild}
      onBildFehler={() => setVersuch((v) => v + 1)}
    />
  );
}
