// Stromausfall erfassen (Plan 30; UC8 Ablauf 8, Ablauf «Nach Stromausfall»; R5.2): Beginn als hh:mm über den
// Ziffernblock mit «heute» oder «gestern», Ende ist jetzt. Das Ereignis hängt an der Anlage des Rundgangs (A1); die
// Folgeaufgaben rechnet die Aufgaben-Rechnung. Regal-Maske ohne Systemtastatur.
import { useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { stromausfallVorgang } from '../../domain/aufgaben-stromausfall.ts';
import { rundgangAnlage } from '../../domain/rundgang/plan.ts';
import { kalendertag, ortszeit, tagPlus, uhrzeit, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu, oeffnen } from '../router.ts';

const uhrJetzt = () => new Date(Date.now());

/** «0200» → 02:00; ungültig ohne Ergebnis */
function zeitAus(ziffern: string): { stunde: number; minute: number } | undefined {
  if (ziffern.length !== 4) return undefined;
  const stunde = Number(ziffern.slice(0, 2));
  const minute = Number(ziffern.slice(2));
  return stunde <= 23 && minute <= 59 ? { stunde, minute } : undefined;
}

export function Stromausfall() {
  const { buendel } = useBuendel();
  const anlage = rundgangAnlage(buendel?.teile);
  const [jetzt] = useState(uhrJetzt);
  const [ziffern, setZiffern] = useState('');
  const [tag, setTag] = useState<'heute' | 'gestern'>('heute');
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  const heute = kalendertag(jetzt, ZEITZONE);
  const zeit = zeitAus(ziffern);
  const beginn = zeit
    ? ortszeit(tag === 'heute' ? heute : tagPlus(heute, -1), zeit.stunde, zeit.minute, ZEITZONE)
    : undefined;
  const vorgang =
    anlage && beginn
      ? stromausfallVorgang({ anlageId: anlage.id, beginn, ende: jetzt }, neueClientId(), jetzt)
      : [];

  function tippen(t: Taste) {
    setZiffern((alt) => {
      if (t === 'leeren') return '';
      if (t === 'zurueck') return alt.slice(0, -1);
      return /^\d$/.test(t) && alt.length < 4 ? `${alt}${t}` : alt;
    });
  }

  async function speichern() {
    if (vorgang.length === 0) return;
    setSendet(true);
    const r = await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    if (r.status === 'nicht_gespeichert') {
      setFehler(r.fehler.text);
      return;
    }
    oeffnen({ name: 'heute' });
  }

  const anzeige = `${ziffern.padEnd(4, '–').slice(0, 2)}:${ziffern.padEnd(4, '–').slice(2)}`;
  return (
    <main className="hv-seite hv-messen" data-density="regal">
      <header className="hv-messen-kopf">
        <h1 className="hv-messen-titel">Stromausfall</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      {fehler ? <Notice kompakt tone="danger" title={fehler} /> : null}
      {!anlage ? <Notice kompakt tone="warn" title="Keine Anlage erfasst" /> : null}
      <p className="hv-rundgang-kopf hv-num">{`Beginn ${anzeige} · Ende ${uhrzeit(jetzt, ZEITZONE)} jetzt`}</p>
      {zeit && vorgang.length === 0 ? <Notice kompakt tone="warn" title="Beginn liegt nach jetzt" /> : null}
      <div className="hv-rundgang-kannen" role="group" aria-label="Tag des Beginns">
        {(['heute', 'gestern'] as const).map((t) => (
          <Button key={t} variant="secondary" aria-pressed={tag === t} onClick={() => setTag(t)}>
            {t}
          </Button>
        ))}
      </div>
      <NumPad
        onTaste={tippen}
        echo={anzeige}
        ohnePlusMinus
        speichern={
          <Button block disabled={sendet || vorgang.length === 0} onClick={() => void speichern()}>
            Speichern
          </Button>
        }
      />
    </main>
  );
}
