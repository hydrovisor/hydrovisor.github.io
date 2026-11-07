// Übergangsmaske #/push (Plan 13, Abweichung 4; Schreibtisch, Standarddichte 48 dp): Push einrichten, Test-Push
// senden, Hinweis zur Akku-Optimierung und die letzten 7 Versände als Nachweis für UC8-AK8. Plan 31: Zustellung der
// letzten 14 Tage aus v_push_zustellung mit EK5-Anteil (online, A11).
import { useEffect, useState } from 'react';
import { ek5Anteil, letzteTage, type ZustellungTag } from '../../domain/push/zustellung.ts';
import { kalendertag, tagKurz, uhrzeit, ZEITZONE } from '../../domain/zeit.ts';
import { aboEinrichten, testPushSenden, VAPID_OEFFENTLICH, zustellungLaden } from '../../daten/push.ts';
import { aboSchreiben, buendelNeuLaden } from '../../daten/schreiben.ts';
import { Notice } from '../bausteine/Notice.tsx';
import { usePushStand, type Versandzeile } from '../pushZustand.ts';
import { hashZu } from '../router.ts';

const MELDUNG = {
  eingerichtet: 'Push eingerichtet',
  verweigert: 'Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen von Chrome.',
  nicht_verfuegbar: 'Push in dieser Umgebung nicht verfügbar',
  nicht_gespeichert: 'Abo nicht gespeichert, erneut versuchen',
  gesendet: 'Test-Push gesendet',
  kein_abo: 'Zuerst Push einrichten',
  fehler: 'Test-Push nicht gesendet, erneut versuchen',
} as const;

function zeit(iso: string | null): string {
  if (!iso) return '–';
  const t = new Date(iso);
  return `${tagKurz(kalendertag(t, ZEITZONE))} ${uhrzeit(t, ZEITZONE)}`;
}

function Versand({ v }: { v: Versandzeile }) {
  return (
    <li>
      <span className="hv-num">{tagKurz(v.datum_lokal)}</span> {v.art === 'test' ? 'Test' : 'Sammel'}:
      gesendet {zeit(v.gesendet_am)}, angezeigt {zeit(v.angezeigt_am)}, geöffnet {zeit(v.geoeffnet_am)}
      {v.status === 'fehler' || v.status === 'abgemeldet' ? ` (${v.status})` : ''}
    </li>
  );
}

function ZustellungZeile({ t }: { t: ZustellungTag }) {
  const gesendet = t.gesendet_am
    ? `gesendet ${uhrzeit(new Date(t.gesendet_am), ZEITZONE)}${
        t.verspaetung_min !== null ? ` (${Math.round(t.verspaetung_min)} min nach Soll)` : ''
      }`
    : t.email_gesendet_am
      ? `E-Mail ${uhrzeit(new Date(t.email_gesendet_am), ZEITZONE)}`
      : 'nicht gesendet';
  return (
    <li>
      <span className="hv-num">{tagKurz(t.datum_lokal ?? '')}</span> {gesendet}, angezeigt{' '}
      {t.angezeigt_am ? uhrzeit(new Date(t.angezeigt_am), ZEITZONE) : '–'}, Aufgaben {t.aufgaben ?? 0}, davon
      am Fälligkeitstag {t.am_faelligkeitstag ?? 0}
      {t.vor_faelligkeitstag ? `, vorgezogen ${t.vor_faelligkeitstag}` : ''}
    </li>
  );
}

function Zustellung() {
  const [tage, setTage] = useState<ZustellungTag[] | undefined>(undefined);
  useEffect(() => {
    let aktiv = true;
    void zustellungLaden().then((z) => {
      if (aktiv) setTage(letzteTage(z));
    });
    return () => {
      aktiv = false;
    };
  }, []);
  if (tage === undefined) return null;
  const ek5 = ek5Anteil(tage);
  return (
    <>
      <h2>Zustellung der letzten 14 Tage</h2>
      {tage.length === 0 ? (
        <p>Noch keine Zustellung (nur online sichtbar)</p>
      ) : (
        <>
          {ek5 ? (
            <p>
              Spätestens am Fälligkeitstag zugestellt:{' '}
              <span className="hv-num">
                {Math.round(ek5.anteil * 100)} % ({ek5.zaehler} von {ek5.nenner})
              </span>
            </p>
          ) : null}
          <ul>
            {tage.map((t) => (
              <ZustellungZeile key={t.datum_lokal} t={t} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export function Push() {
  const { stand, versande, neu } = usePushStand();
  const [meldung, setMeldung] = useState<keyof typeof MELDUNG | undefined>(undefined);
  const [laeuft, setLaeuft] = useState(false);
  const verfuegbar = VAPID_OEFFENTLICH !== '' && stand !== undefined && stand.art !== 'nicht_unterstuetzt';
  const letzte = [...versande]
    .sort((a, b) => ((a.gesendet_am ?? a.datum_lokal) < (b.gesendet_am ?? b.datum_lokal) ? 1 : -1))
    .slice(0, 7);

  async function ausfuehren(aktion: () => Promise<keyof typeof MELDUNG>) {
    setLaeuft(true);
    try {
      setMeldung(await aktion());
      neu();
      buendelNeuLaden();
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      <h1 className="hv-seite-titel">Push</h1>
      {stand === undefined ? null : !verfuegbar ? (
        <Notice title={MELDUNG.nicht_verfuegbar} />
      ) : (
        <>
          {stand.art === 'eingerichtet' ? (
            <Notice tone="ok" title="Push eingerichtet">
              {stand.letzteZustellung
                ? `Letzte Erinnerung: ${stand.letzteZustellung} zugestellt`
                : 'Noch keine Erinnerung zugestellt'}
            </Notice>
          ) : (
            <Notice tone="warn" title="Push nicht eingerichtet" />
          )}
          {meldung ? <p role="status">{MELDUNG[meldung]}</p> : null}
          <div className="hv-formular">
            <button
              type="button"
              className="hv-btn hv-btn-primary"
              disabled={laeuft}
              onClick={() => void ausfuehren(() => aboEinrichten(aboSchreiben))}
            >
              Push einrichten
            </button>
            <button
              type="button"
              className="hv-btn hv-btn-secondary"
              disabled={laeuft || stand.art !== 'eingerichtet'}
              onClick={() => void ausfuehren(testPushSenden)}
            >
              Test-Push senden
            </button>
          </div>
          <p>
            Damit die Erinnerung auch bei gesperrtem Gerät kommt: Schalte die Akku-Optimierung für Chrome aus
            (Einstellungen › Apps › Chrome › Akku › Nicht eingeschränkt).
          </p>
          <h2>Letzte Versände</h2>
          {letzte.length === 0 ? (
            <p>Noch keine Versände</p>
          ) : (
            <ul>
              {letzte.map((v) => (
                <Versand key={v.id} v={v} />
              ))}
            </ul>
          )}
          <Zustellung />
        </>
      )}
    </main>
  );
}
