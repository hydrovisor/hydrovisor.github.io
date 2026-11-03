// Messen (Regal, Plan 12; UC9-AK2, UC9-AK6, U1, U2, U4, R10.3): drei Kacheln, eigener Ziffernblock, ohne Scrollen.
// Bewertung und Ergebniszone folgen mit I1b; hier nur Erfassung, Kennzeichen «unsicher» und Rückgängig.
import { useRef, useState, type ReactNode } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import type { Schritt } from '../../domain/datenpfad/erfassung.ts';
import { istUnsicher, kalibrierStand } from '../../domain/kalibrierung/stand.ts';
import {
  eingabeStart,
  eingabeTippen,
  feldWaehlen,
  messwerte,
  speichernMoeglich,
  type Groesse,
  type Messeingabe,
} from '../../domain/messung/eingabe.ts';
import { erfassungBinden, messungVorgang, type Erfassungsbindung } from '../../domain/messung/erfassung.ts';
import { messFaelligkeit } from '../../domain/messung/faelligkeit.ts';
import { ortAufloesen, type Ort } from '../../domain/ort.ts';
import { uhrzeit, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { MesswertKachel } from '../bausteine/Tile.tsx';
import { useBuendel } from '../buendel.tsx';
import { kalibrierdaten, messgeraet, messungenIm, zustandVon } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';

const BEZEICHNUNG: Record<Groesse, string> = { ph: 'pH', ec: 'EC mS/cm', temperatur: '°C' };
const MIT_FUELLSTAND = new Set(['kratky', 'kratky_belueftet']);

function Kopf({ titel, badge, zuHeute = true }: { titel: string; badge?: ReactNode; zuHeute?: boolean }) {
  return (
    <header className="hv-messen-kopf">
      <h1 className="hv-messen-titel">{titel}</h1>
      {badge}
      {zuHeute ? (
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      ) : null}
    </header>
  );
}

export function Messen({ code }: { code: string }) {
  const { buendel, liest } = useBuendel();
  const ort = buendel ? ortAufloesen(code, buendel.teile) : undefined;
  if (!ort) {
    return (
      <main className="hv-seite hv-messen" data-density="regal">
        <Kopf titel="Messen" />
        <p>{liest ? 'Daten werden geladen' : `Ort ${code} nicht bekannt`}</p>
      </main>
    );
  }
  if (ort.rolle !== 'gefaess' && ort.rolle !== 'messstelle') {
    return (
      <main className="hv-seite hv-messen" data-density="regal">
        <Kopf titel={ort.code} />
        <p>An diesem Ort wird nicht gemessen</p>
      </main>
    );
  }
  return <Messmaske key={ort.platzId} ort={ort} />;
}

function Messmaske({ ort }: { ort: Ort }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const felder: Groesse[] = ort.rolle === 'messstelle' ? ['ec', 'temperatur'] : ['ph', 'ec', 'temperatur'];
  const [eingabe, setEingabe] = useState<Messeingabe>(() => eingabeStart(felder));
  const [fuellstand, setFuellstand] = useState<'ueber_drittel' | 'unter_drittel'>();
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  const [gespeichert, setGespeichert] = useState<{ zeit: string; clientId: string; unsicher: boolean }>();
  const [rueckgaengig, setRueckgaengig] = useState(false);
  const bindung = useRef<Erfassungsbindung | undefined>(undefined);
  // der Vorgang einer Eingabe bleibt bei jeder Wiederholung gleich, auch Dauer und Fälligkeit (TO2, Runde 1 Befund 1)
  const vorgangFuer = useRef<{ schluessel: string; schritt: Schritt } | undefined>(undefined);
  const ersterTipp = useRef<number | undefined>(undefined);

  const daten = kalibrierdaten(buendel);
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = new Date(geoeffnet);
  const unsicher = geraet
    ? istUnsicher({ messgeraetId: geraet.id, datenart: ort.datenart, giltAb: jetzt }, daten, ZEITZONE)
    : true;
  const nieKalibriert =
    geraet !== undefined &&
    kalibrierStand(daten, { messgeraetId: geraet.id, datenart: ort.datenart }, jetzt, ZEITZONE).art ===
      'erstkalibrierung';
  const kalibrierLink = hashZu(
    ort.datenart === 'echt' ? { name: 'kalibrieren' } : { name: 'kalibrieren', datenart: ort.datenart },
  );
  const kratky = ort.betriebsart !== undefined && MIT_FUELLSTAND.has(ort.betriebsart);
  const bereit = geraet !== undefined && speichernMoeglich(eingabe) && (!kratky || fuellstand !== undefined);

  function tippen(t: Taste) {
    ersterTipp.current ??= Date.now();
    setEingabe((e) => eingabeTippen(e, t));
    setErgebnis(undefined);
  }

  async function senden() {
    if (!geraet || !bereit) return;
    const jetztSenden = new Date(Date.now());
    const schluessel = JSON.stringify({ w: messwerte(eingabe), fuellstand });
    bindung.current = erfassungBinden(bindung.current, schluessel, neueClientId, jetztSenden);
    const giltAb = new Date(bindung.current.giltAb);
    const faelligkeit = messFaelligkeit(
      {
        platzId: ort.platzId,
        intervallMessenD: ort.intervallMessenD ?? null,
        ...zustandVon(buendel, ort.platzId),
      },
      messungenIm(buendel),
      giltAb,
      ZEITZONE,
    );
    const vorgang =
      vorgangFuer.current?.schluessel === schluessel
        ? vorgangFuer.current.schritt
        : messungVorgang(
            eingabe,
            {
              platzId: ort.platzId,
              messgeraetId: geraet.id,
              messart: ort.rolle === 'messstelle' ? 'w' : 'aufgabe',
              ...(ort.betriebsart ? { betriebsart: ort.betriebsart } : {}),
              ...(fuellstand ? { fuellstand } : {}),
              uEc: geraet.u_ec,
              uPh: geraet.u_ph,
              ...(faelligkeit.art === 'offen' && faelligkeit.faellig
                ? { warFaelligAm: faelligkeit.faelligAm }
                : {}),
              ...(ersterTipp.current !== undefined
                ? { erfassungsdauerS: Math.round((jetztSenden.getTime() - ersterTipp.current) / 1000) }
                : {}),
            },
            bindung.current,
          );
    vorgangFuer.current = { schluessel, schritt: vorgang };
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status === 'gespeichert')
      setGespeichert({
        zeit: uhrzeit(giltAb, ZEITZONE),
        clientId: bindung.current.clientId,
        // «unsicher» zum Zeitpunkt der Messung (gilt_ab), nicht des Öffnens (Runde 1 Befund 2)
        unsicher: geraet
          ? istUnsicher({ messgeraetId: geraet.id, datenart: ort.datenart, giltAb }, daten, ZEITZONE)
          : true,
      });
  }

  async function zuruecknehmen() {
    if (!gespeichert) return;
    const antwort = await schreiben(
      { art: 'storno', tabelle: 'messung', clientId: gespeichert.clientId, grund: 'rueckgaengig' },
      { jetzt: new Date(Date.now()), zeitzone: ZEITZONE },
    );
    if (antwort.status === 'gespeichert') setRueckgaengig(true);
    else setErgebnis(antwort);
  }

  const fehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const w = messwerte(eingabe);
  const badgeUnsicher = unsicher ? <StatusBadge tone="uncertain" /> : undefined;

  if (gespeichert) {
    const werte = [
      w.ph !== null ? `pH ${w.ph.toFixed(1)}` : undefined,
      w.ec_eingabe !== null ? `EC ${w.ec_eingabe}` : undefined,
      w.temperatur !== null ? `${w.temperatur.toFixed(1)} °C` : undefined,
    ].filter(Boolean);
    return (
      <main className="hv-seite hv-messen" data-density="regal">
        <Kopf titel={ort.code} badge={gespeichert.unsicher ? badgeUnsicher : undefined} zuHeute={false} />
        <p className="hv-messen-bestaetigung hv-num">
          {rueckgaengig ? 'Rückgängig gemacht' : `Gespeichert ${gespeichert.zeit} · ${werte.join(' · ')}`}
        </p>
        {fehler ? (
          <Notice kompakt tone="danger">
            {fehler.text}
          </Notice>
        ) : null}
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
      {/* ein Fehler hat Vorrang vor dem Banner «unsicher», das dann als Kennzeichen in den Kopf rückt (A8) */}
      <Kopf
        titel={ort.code}
        badge={fehler ? badgeUnsicher : undefined}
        zuHeute={!fehler && ergebnis?.status !== 'abweichend' && !unsicher}
      />
      {fehler ? (
        <Notice
          kompakt
          tone="danger"
          action={
            fehler.wiederholbar ? (
              <Button variant="secondary" size="compact" disabled={sendet} onClick={() => void senden()}>
                Erneut senden
              </Button>
            ) : undefined
          }
        >
          {fehler.text}
        </Notice>
      ) : ergebnis?.status === 'abweichend' ? (
        <Notice kompakt tone="warn">
          {`Schon gespeichert mit ${[
            ergebnis.vorhanden['ph'] != null ? `pH ${String(ergebnis.vorhanden['ph'])}` : '',
            ergebnis.vorhanden['ec'] != null ? `EC ${String(ergebnis.vorhanden['ec'])}` : '',
            ergebnis.vorhanden['temperatur'] != null ? `${String(ergebnis.vorhanden['temperatur'])} °C` : '',
          ]
            .filter(Boolean)
            .join(', ')}; deine Änderung ist nicht übernommen.`}
        </Notice>
      ) : unsicher ? (
        <Notice
          kompakt
          tone="warn"
          action={
            <a className="hv-btn hv-btn-secondary hv-btn-compact" href={kalibrierLink}>
              Kalibrieren
            </a>
          }
        >
          {nieKalibriert || !geraet
            ? 'Noch nie kalibriert: Werte unsicher'
            : 'Kalibrierung überfällig: Werte unsicher'}
        </Notice>
      ) : null}
      <div
        className="hv-messen-kacheln"
        style={{ gridTemplateColumns: `repeat(${felder.length}, minmax(0, 1fr))` }}
      >
        {felder.map((g) => (
          <MesswertKachel
            kompakt
            key={g}
            bezeichnung={BEZEICHNUNG[g]}
            wert={eingabe.text[g]}
            aktiv={eingabe.aktiv === g}
            onClick={() => setEingabe((e) => feldWaehlen(e, g))}
          />
        ))}
      </div>
      <NumPad
        onTaste={tippen}
        speichern={
          <div className="hv-messen-speichern">
            {kratky ? (
              <>
                <Button
                  variant="secondary"
                  aria-pressed={fuellstand === 'ueber_drittel'}
                  onClick={() => setFuellstand('ueber_drittel')}
                >
                  über ⅓
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={fuellstand === 'unter_drittel'}
                  onClick={() => setFuellstand('unter_drittel')}
                >
                  unter ⅓
                </Button>
              </>
            ) : null}
            <Button
              className="hv-messen-speichern-knopf"
              disabled={!bereit || sendet}
              onClick={() => void senden()}
            >
              Speichern
            </Button>
          </div>
        }
      />
    </main>
  );
}
