// Messgerät kalibrieren (Regal, Plan 12; Konzept 5.6, R5.2, R10.3): Gegenprobe EC über den Ziffernblock,
// ausserhalb von u_EC kein Speichern (A9). Datenart echt, aus der Route demo oder test.
import { useRef, useState } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import { gegenprobeOk, GEGENPROBE_SOLL, kalibrierungVorgang } from '../../domain/kalibrierung/erfassung.ts';
import { kalibrierStand, type Datenart } from '../../domain/kalibrierung/stand.ts';
import { eingabeStart, eingabeTippen, messwerte, type Messeingabe } from '../../domain/messung/eingabe.ts';
import { erfassungBinden, type Erfassungsbindung } from '../../domain/messung/erfassung.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { MesswertKachel } from '../bausteine/Tile.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt as jetztZeit, kalibrierdaten, messgeraet } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';

export function Kalibrieren({ datenart = 'echt' }: { datenart?: Datenart }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const [eingabe, setEingabe] = useState<Messeingabe>(() => eingabeStart(['ec']));
  const [nachReinigung, setNachReinigung] = useState(false);
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  const [fertig, setFertig] = useState<{ clientId: string; gueltigBis: string }>();
  const [rueckgaengig, setRueckgaengig] = useState(false);
  const bindung = useRef<Erfassungsbindung | undefined>(undefined);
  const [geoeffnet] = useState(() => Date.now());

  const gegenprobe = messwerte(eingabe).ec;
  const uEc = geraet?.u_ec ?? 0.1;
  const ok = gegenprobe !== null && gegenprobeOk(gegenprobe, uEc);
  const daten = kalibrierdaten(buendel);

  async function speichern() {
    if (!geraet || gegenprobe === null || !ok) return;
    const jetzt = jetztZeit();
    bindung.current = erfassungBinden(
      bindung.current,
      JSON.stringify({ gegenprobe, nachReinigung }),
      neueClientId,
      jetzt,
    );
    const vorher = kalibrierStand(daten, { messgeraetId: geraet.id, datenart }, jetzt, ZEITZONE);
    const vorgang = kalibrierungVorgang(
      {
        messgeraetId: geraet.id,
        datenart,
        gegenprobeEc: gegenprobe,
        nachReinigung,
        ...(vorher.art === 'faellig' || vorher.art === 'ueberfaellig'
          ? { warFaelligAm: vorher.faelligAm }
          : {}),
        dauerS: Math.round((jetzt.getTime() - geoeffnet) / 1000),
      },
      bindung.current,
    );
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt, zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status !== 'gespeichert') return;
    // gültig bis: Stand mit der neuen Kalibrierung, wie Heute es danach zeigt
    const neu = kalibrierStand(
      {
        ...daten,
        kalibrierungen: [
          ...daten.kalibrierungen,
          {
            id: bindung.current.clientId,
            messgeraet_id: geraet.id,
            datenart,
            gilt_ab: bindung.current.giltAb,
            storniert_am: null,
          },
        ],
      },
      { messgeraetId: geraet.id, datenart },
      jetzt,
      ZEITZONE,
    );
    setFertig({
      clientId: bindung.current.clientId,
      gueltigBis: neu.art === 'erstkalibrierung' ? '' : neu.faelligAm,
    });
  }

  async function zuruecknehmen() {
    if (!fertig) return;
    const antwort = await schreiben(
      { art: 'storno', tabelle: 'kalibrierung', clientId: fertig.clientId, grund: 'rueckgaengig' },
      { jetzt: jetztZeit(), zeitzone: ZEITZONE },
    );
    if (antwort.status === 'gespeichert') setRueckgaengig(true);
    else setErgebnis(antwort);
  }

  const fehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const min = (GEGENPROBE_SOLL - uEc).toFixed(2);
  const max = (GEGENPROBE_SOLL + uEc).toFixed(2);
  const kopf = (
    <header className="hv-messen-kopf">
      <h1 className="hv-messen-titel">Messgerät kalibrieren</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );

  if (fertig) {
    return (
      <main className="hv-seite hv-messen" data-density="regal">
        {kopf}
        <p className="hv-messen-bestaetigung hv-num">
          {rueckgaengig ? 'Rückgängig gemacht' : `Kalibriert · gültig bis ${tagKurz(fertig.gueltigBis)}`}
        </p>
        {fehler ? <Notice tone="danger">{fehler.text}</Notice> : null}
        {rueckgaengig ? null : (
          <Button variant="secondary" block onClick={() => void zuruecknehmen()}>
            Rückgängig machen
          </Button>
        )}
        <a className="hv-btn hv-btn-primary hv-btn-block" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }

  return (
    <main className="hv-seite hv-messen" data-density="regal">
      {kopf}
      <p className="hv-messen-zeile">pH 7.00 und 4.01, EC 1413 (Anzeige 1.41)</p>
      {!geraet ? <p>Kein Messgerät erfasst</p> : null}
      {fehler ? (
        <Notice
          tone="danger"
          action={
            fehler.wiederholbar ? (
              <Button variant="secondary" size="compact" disabled={sendet} onClick={() => void speichern()}>
                Erneut senden
              </Button>
            ) : undefined
          }
        >
          {fehler.text}
        </Notice>
      ) : gegenprobe !== null && !ok ? (
        <Notice tone="warn">
          {`Gegenprobe ${gegenprobe.toFixed(2)} ausserhalb ${min}–${max}: Sonde spülen und neu kalibrieren`}
        </Notice>
      ) : null}
      <div className="hv-messen-kacheln">
        <MesswertKachel bezeichnung="Gegenprobe EC" wert={eingabe.text.ec} aktiv />
      </div>
      <div className="hv-messen-wahl" role="group" aria-label="nach Reinigung">
        <span>nach Reinigung</span>
        <Button variant="secondary" aria-pressed={nachReinigung} onClick={() => setNachReinigung(true)}>
          ja
        </Button>
        <Button variant="secondary" aria-pressed={!nachReinigung} onClick={() => setNachReinigung(false)}>
          nein
        </Button>
      </div>
      <NumPad
        onTaste={(t: Taste) => {
          setEingabe((e) => eingabeTippen(e, t));
          setErgebnis(undefined);
        }}
        speichern={
          <Button block disabled={!geraet || !ok || sendet} onClick={() => void speichern()}>
            Speichern
          </Button>
        }
      />
    </main>
  );
}
