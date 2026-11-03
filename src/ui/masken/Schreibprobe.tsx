// Schreibweg prüfen (Kontext Schreibtisch, Plan 11 D2, F1): pH-Kontrolle mit Datenart test über schreiben().
// Prüfstand für TO2 und TO8, bis I0-07 die einfache Messung bringt. Die client_id hängt am Eingabe-Schnappschuss (Ü1).
import { useState } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

/** client_id und die Eingabe, für die sie gilt */
interface Erfassung {
  clientId: string;
  eingabe: string;
}

function phLesen(text: string): number | undefined {
  const wert = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(wert) && wert >= 0 && wert <= 14 ? wert : undefined;
}

function alsText(felder: Record<string, unknown>): string {
  return Object.entries(felder)
    .map(([feld, wert]) => `${feld}: ${String(wert)}`)
    .join('\n');
}

export function Schreibprobe() {
  const { buendel } = useBuendel();
  const geraet = (buendel?.teile['messgeraet'] as { id: string }[] | undefined)?.[0];
  const [eingabe, setEingabe] = useState('');
  const [erfassung, setErfassung] = useState<Erfassung>();
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  const [ungueltig, setUngueltig] = useState(false);
  const ph = phLesen(eingabe);

  const felder = (clientId: string) => ({
    client_id: clientId,
    messart: 'ph_kontrolle',
    platz_id: null,
    datenart: 'test',
    messgeraet_id: geraet?.id,
    ph,
  });

  async function senden() {
    if (!geraet) return;
    if (ph === undefined) return setUngueltig(true);
    // gleiche Eingabe behält die client_id (Wiederholung, TO2); eine geänderte bekommt eine neue (Ü1)
    const aktuell =
      erfassung && erfassung.eingabe === eingabe ? erfassung : { clientId: neueClientId(), eingabe };
    setErfassung(aktuell);
    setSendet(true);
    const antwort = await schreiben(
      { art: 'neu', tabelle: 'messung', felder: felder(aktuell.clientId) },
      { jetzt: new Date(Date.now()), zeitzone: ZEITZONE },
    );
    setSendet(false);
    setErgebnis(antwort);
    // nach dem Erfolg beginnt eine neue Erfassung
    if (antwort.status === 'gespeichert') setErfassung(undefined);
  }

  const fehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Schreibweg prüfen</h1>
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'info' })}>
          Info öffnen
        </a>
      </header>
      <Card title="pH-Kontrolle">
        <p>Speichert eine Messung mit Datenart «test». Sie zählt in keiner Auswertung.</p>
        {geraet ? null : <p>Kein Messgerät erfasst</p>}
        <TextField
          label="pH"
          inputMode="decimal"
          value={eingabe}
          hint="Wert zwischen 0 und 14"
          error={ungueltig ? 'Bitte einen Wert zwischen 0 und 14 eingeben.' : undefined}
          onChange={(e) => {
            setEingabe(e.target.value);
            setErgebnis(undefined);
            setUngueltig(false);
          }}
        />
        <Button block disabled={!geraet || sendet} onClick={() => void senden()}>
          Speichern
        </Button>
        {erfassung ? (
          <span className="hv-num" data-client-id={erfassung.clientId} hidden>
            {erfassung.clientId}
          </span>
        ) : null}
      </Card>
      {ergebnis?.status === 'gespeichert' ? <Notice tone="ok" title="Gespeichert" /> : null}
      {ergebnis?.status === 'abweichend' ? (
        <Notice tone="warn" title="Schon gespeichert">
          Schon gespeichert mit pH {String(ergebnis.vorhanden['ph'])}; deine Änderung ist nicht übernommen.
        </Notice>
      ) : null}
      {fehler ? (
        <Notice
          tone="danger"
          action={
            fehler.wiederholbar ? (
              <Button variant="secondary" size="compact" disabled={sendet} onClick={() => void senden()}>
                Erneut senden
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="compact"
                onClick={() =>
                  void navigator.clipboard
                    ?.writeText(alsText({ tabelle: 'messung', ...felder(erfassung?.clientId ?? '') }))
                    .catch(() => undefined)
                }
              >
                Als Text kopieren
              </Button>
            )
          }
        >
          {fehler.text}
        </Notice>
      ) : null}
    </main>
  );
}
