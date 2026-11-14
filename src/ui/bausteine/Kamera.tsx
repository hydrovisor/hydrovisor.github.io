// Baustein Kamera (design-system/components/Kamera.md): Sucher in der App über getUserMedia (Rückkamera), Auslöser,
// Schritt als Text, Vorschau des letzten Fotos. Die Maske führt die Reihe (Vorderseite, Rückseite, nächste Sorte); der
// Baustein bleibt dabei offen, damit die Kamera nicht für jedes Foto neu startet (Plan kamera A2).
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.tsx';

export type KameraFehler = 'verweigert' | 'fehlt' | 'unbekannt';

/** Fehler von getUserMedia → Art der Meldung (Plan kamera A4) */
export function kameraFehler(e: unknown): KameraFehler {
  const name = e !== null && typeof e === 'object' && 'name' in e ? String(e.name) : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'verweigert';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'fehlt';
  return 'unbekannt';
}

export const KAMERA_FEHLER_TEXT: Record<KameraFehler, string> = {
  verweigert:
    'Die Kamera ist für Hydrovisor nicht freigegeben. Erlaube sie in Chrome bei den Website-Einstellungen oder tipp auf «Beenden» und nimm die Fotos einzeln auf.',
  fehlt: 'Keine Kamera gefunden. Tipp auf «Beenden» und wähle die Fotos aus der Galerie.',
  unbekannt: 'Die Kamera startet nicht. Tipp auf «Beenden» und nimm die Fotos einzeln auf.',
};

/** Auflösung des Suchers; die Maske verkleinert jedes Foto danach auf BILD_KANTE_MAX (Plan kamera A3) */
const VIDEO: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

/** Standbild des Suchers als JPEG in voller Auflösung des Videos */
async function standbild(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0) throw new Error('Kein Bild im Sucher');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('JPEG nicht erzeugt'))), 'image/jpeg', 0.92),
  );
}

export interface KameraAktion {
  text: string;
  onClick: () => void;
}

interface KameraProps {
  /** z. B. «3 von 22: Genoveser» oder «Tüte erfassen» */
  titel: string;
  /** Zusatz unter dem Titel, z. B. das Gemüse */
  untertitel?: string | undefined;
  /** aktueller Schritt als Wort: «Vorderseite» oder «Rückseite» */
  schritt: string;
  hinweis?: string | undefined;
  /** Objekt-URL des zuletzt aufgenommenen Fotos */
  vorschau?: string | undefined;
  /** Alternativtext und sichtbarer Text der Vorschau, z. B. «Vorderseite aufgenommen» */
  vorschauText?: string | undefined;
  /** gesetzt, solange die Maske speichert; sperrt Auslöser und Aktionen */
  status?: string | undefined;
  /** Zusatzaktionen des Schritts, z. B. «Ohne Rückseite weiter», «Sorte überspringen» */
  aktionen?: KameraAktion[] | undefined;
  onFoto: (datei: File) => void;
  onSchliessen: () => void;
}

export function Kamera({
  titel,
  untertitel,
  schritt,
  hinweis,
  vorschau,
  vorschauText,
  status,
  aktionen = [],
  onFoto,
  onSchliessen,
}: KameraProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [bereit, setBereit] = useState(false);
  const [nimmt, setNimmt] = useState(false);
  const [fehler, setFehler] = useState<KameraFehler>();
  /** Standbild gescheitert: Meldung, Auslöser bleibt frei für den nächsten Versuch */
  const [aufnahmeFehler, setAufnahmeFehler] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let aus = false;
    void (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setFehler('fehlt');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: VIDEO });
        // Baustein schon weg (Beenden während der Freigabe, StrictMode): Spuren sofort stoppen
        if (aus) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        const v = video.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play().catch(() => undefined);
        if (!aus) setBereit(true);
      } catch (e) {
        if (!aus) setFehler(kameraFehler(e));
      }
    })();
    return () => {
      aus = true;
      for (const t of stream?.getTracks() ?? []) t.stop();
    };
  }, []);

  // Seite unter dem Sucher nicht scrollen
  useEffect(() => {
    const alt = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = alt;
    };
  }, []);

  async function aufnehmen() {
    const v = video.current;
    if (!v) return;
    setNimmt(true);
    setAufnahmeFehler(false);
    try {
      const bild = await standbild(v);
      onFoto(new File([bild], `tuete-${String(Date.now())}.jpg`, { type: 'image/jpeg' }));
    } catch {
      setAufnahmeFehler(true);
    } finally {
      setNimmt(false);
    }
  }

  const gesperrt = status !== undefined;
  return (
    <div className="hv-kamera" role="dialog" aria-modal="true" aria-label={`Kamera: ${titel}`}>
      <header className="hv-kamera-kopf">
        <div className="hv-kamera-titelblock">
          <p className="hv-kamera-titel">{titel}</p>
          {untertitel ? <p className="hv-kamera-untertitel">{untertitel}</p> : null}
        </div>
        <Button variant="secondary" size="compact" onClick={onSchliessen}>
          Beenden
        </Button>
      </header>
      <div className="hv-kamera-sucher">
        <video ref={video} className="hv-kamera-video" playsInline muted autoPlay aria-hidden="true" />
        {bereit && !fehler ? <div className="hv-kamera-rahmen" aria-hidden="true" /> : null}
        {!bereit && !fehler ? <p className="hv-kamera-startet">Kamera startet</p> : null}
        {fehler ? (
          <p className="hv-kamera-fehler" role="alert">
            {KAMERA_FEHLER_TEXT[fehler]}
          </p>
        ) : null}
      </div>
      <div className="hv-kamera-anleitung">
        <p className="hv-kamera-schritt" aria-live="polite">
          {schritt}
        </p>
        {aufnahmeFehler ? (
          <p className="hv-kamera-hinweis" role="alert">
            Foto nicht aufgenommen. Versuch es noch einmal.
          </p>
        ) : null}
        {status ? (
          <p className="hv-kamera-hinweis" role="status">
            {status}
          </p>
        ) : hinweis ? (
          <p className="hv-kamera-hinweis">{hinweis}</p>
        ) : null}
      </div>
      {aktionen.length > 0 ? (
        <div className="hv-kamera-aktionen">
          {aktionen.map((a) => (
            <Button key={a.text} variant="secondary" size="compact" disabled={gesperrt} onClick={a.onClick}>
              {a.text}
            </Button>
          ))}
        </div>
      ) : null}
      <footer className="hv-kamera-fuss">
        <div className="hv-kamera-vorschau">
          {vorschau ? (
            <>
              <img src={vorschau} alt={vorschauText ?? 'Letztes Foto'} />
              {vorschauText ? <span>{vorschauText}</span> : null}
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="hv-kamera-ausloeser"
          disabled={!bereit || !!fehler || nimmt || gesperrt}
          onClick={() => void aufnehmen()}
        >
          <span className="hv-kamera-ausloeser-kreis" aria-hidden="true" />
          <span className="hv-kamera-ausloeser-text">Foto aufnehmen</span>
        </button>
        <span aria-hidden="true" />
      </footer>
    </div>
  );
}
