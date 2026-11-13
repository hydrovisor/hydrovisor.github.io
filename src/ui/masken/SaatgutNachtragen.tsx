// Ablauf «Fotos nachtragen» im Saatgut-Manager (Issue #211, Plan 211): führt durch alle Sorten ohne Tütenfoto
// («3 von 22: Genoveser»), je Sorte Vorderseite, Rückseite freiwillig, «Überspringen», «Beenden». Die Reihe ist ein
// Schnappschuss beim Start (nachtragStarten). Speichern wie die Karte «Tütenfoto» in Sorte.tsx: hochladen, Storno der
// gültigen Zeile derselben Seite plus neue Zeile über schreiben() (8.1 Regel 2, Plan 207 A12).
import { useState } from 'react';
import { neueClientId } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { nachtragPosition, nachtragWeiter, type NachtragStand } from '../../domain/sorten/saatgut.ts';
import {
  aktuelleTuetenfotos,
  tuetenfotoVorgang,
  type TuetenfotoSeite,
  type TuetenfotoZeile,
} from '../../domain/sorten/tuetenfoto.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { PhotoField } from '../bausteine/PhotoField.tsx';
import { useBuendel } from '../buendel.tsx';
import { fotoVorgangSenden, tuetenfotoHochladen } from '../saatgutSpeichern.ts';

const SEITE_LABEL: Record<TuetenfotoSeite, string> = { vorne: 'Vorderseite', hinten: 'Rückseite' };

interface Gespeichert {
  clientId: string;
  url: string;
}

export function SaatgutNachtragen({
  start,
  onSchliessen,
}: {
  start: NachtragStand;
  onSchliessen: () => void;
}) {
  const { buendel } = useBuendel();
  const [stand, setStand] = useState(start);
  const [gespeichert, setGespeichert] = useState<Partial<Record<TuetenfotoSeite, Gespeichert>>>({});
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string>();
  const [offen, setOffen] = useState<{
    vorgang: Vorgang;
    seite: TuetenfotoSeite;
    gespeichert: Gespeichert;
  }>();
  const position = nachtragPosition(stand);

  function weiter(wie: 'ergaenzt' | 'uebersprungen') {
    setStand((s) => nachtragWeiter(s, wie));
    setGespeichert({});
    setMeldung(undefined);
    setOffen(undefined);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  async function senden(o: { vorgang: Vorgang; seite: TuetenfotoSeite; gespeichert: Gespeichert }) {
    const r = await fotoVorgangSenden(o.vorgang);
    if (r === 'gespeichert') {
      setOffen(undefined);
      setGespeichert((g) => ({ ...g, [o.seite]: o.gespeichert }));
      return;
    }
    setOffen(r.wiederholbar ? o : undefined);
    setMeldung(r.meldung);
  }

  async function waehlen(sorteId: string, seite: TuetenfotoSeite, datei: File) {
    setLaeuft(true);
    setMeldung(undefined);
    setOffen(undefined);
    try {
      const hoch = await tuetenfotoHochladen(sorteId, datei);
      if ('fehler' in hoch) {
        setMeldung(
          hoch.fehler === 'lesbar'
            ? 'Foto nicht gespeichert: Das Foto ist nicht lesbar. Wähle ein anderes Foto.'
            : 'Foto nicht gespeichert. Prüf die Verbindung und wähle es erneut.',
        );
        return;
      }
      // ersetzt: die in diesem Ablauf gespeicherte Seite, sonst die gültige Zeile aus dem Bündel (8.1 Regel 2)
      const zeilen = (buendel?.teile['tuetenfoto'] ?? []) as TuetenfotoZeile[];
      const ersetzt = gespeichert[seite]?.clientId ?? aktuelleTuetenfotos(zeilen, sorteId)[seite]?.clientId;
      const clientId = neueClientId();
      await senden({
        seite,
        gespeichert: { clientId, url: URL.createObjectURL(datei) },
        vorgang: tuetenfotoVorgang({ sorteId, seite, pfad: hoch.pfad, clientId, ersetzt }),
      });
    } finally {
      setLaeuft(false);
    }
  }

  async function wiederholen() {
    if (!offen) return;
    setLaeuft(true);
    setMeldung(undefined);
    try {
      await senden(offen);
    } finally {
      setLaeuft(false);
    }
  }

  const kopf = (
    <header className="hv-seite-kopf">
      <h1 className="hv-seite-titel">Fotos nachtragen</h1>
      <Button variant="ghost" size="compact" disabled={laeuft} onClick={onSchliessen}>
        Beenden
      </Button>
    </header>
  );

  if (position.fertig)
    return (
      <main className="hv-seite">
        {kopf}
        <h2 className="hv-saatgut-ablauf-titel">Fertig</h2>
        <Notice tone="ok">{`Fertig: ${position.ergaenzt} ergänzt, ${position.uebersprungen} übersprungen`}</Notice>
        <Button block onClick={onSchliessen}>
          Zum Saatgut
        </Button>
      </main>
    );

  const { eintrag } = position;
  const einFoto = gespeichert.vorne !== undefined || gespeichert.hinten !== undefined;
  return (
    <main className="hv-seite">
      {kopf}
      <h2 className="hv-saatgut-ablauf-titel">{`${position.nummer} von ${position.gesamt}: ${eintrag.name}`}</h2>
      <p className="hv-saatgut-gemuese">{eintrag.artName}</p>
      <PhotoField
        key={`${eintrag.sorteId}-vorne`}
        label={SEITE_LABEL.vorne}
        knopf={gespeichert.vorne ? 'Foto ersetzen' : 'Foto aufnehmen'}
        vorschau={gespeichert.vorne?.url}
        deaktiviert={laeuft}
        onWahl={(datei) => void waehlen(eintrag.sorteId, 'vorne', datei)}
      />
      {gespeichert.vorne ? <Notice tone="ok">Vorderseite gespeichert</Notice> : null}
      {einFoto ? (
        <PhotoField
          key={`${eintrag.sorteId}-hinten`}
          label={SEITE_LABEL.hinten}
          knopf={gespeichert.hinten ? 'Foto ersetzen' : 'Foto aufnehmen'}
          hint="freiwillig"
          vorschau={gespeichert.hinten?.url}
          deaktiviert={laeuft}
          onWahl={(datei) => void waehlen(eintrag.sorteId, 'hinten', datei)}
        />
      ) : null}
      {gespeichert.hinten ? <Notice tone="ok">Rückseite gespeichert</Notice> : null}
      {laeuft ? <p role="status">Foto wird gespeichert</p> : null}
      {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
      {offen && !laeuft ? (
        <Button variant="secondary" block onClick={() => void wiederholen()}>
          Speichern wiederholen
        </Button>
      ) : null}
      {einFoto ? (
        <Button block disabled={laeuft} onClick={() => weiter('ergaenzt')}>
          Weiter
        </Button>
      ) : (
        <Button variant="secondary" block disabled={laeuft} onClick={() => weiter('uebersprungen')}>
          Überspringen
        </Button>
      )}
    </main>
  );
}
