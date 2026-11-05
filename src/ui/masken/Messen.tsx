// Messen (Regal, Plan 12 und Plan 26; UC9, U1 bis U4, U13, R2.5, R10.1 bis R10.5): drei Kacheln mit Symbol, Trend
// und Spur, eigener Ziffernblock, nach dem letzten Wert die Ergebniszone, vor dem Speichern bei Sprung die Rückfrage.
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { neueClientId, schreiben, type Schreibergebnis } from '../../daten/schreiben.ts';
import type { Schritt } from '../../domain/datenpfad/erfassung.ts';
import { istUnsicher, kalibrierStand } from '../../domain/kalibrierung/stand.ts';
import { RANG, TON, alsText, type Bewertung } from '../../domain/bewertung/bewertung.ts';
import {
  eingabeAbgeschlossen,
  eingabeStart,
  eingabeTippen,
  feldVollstaendig,
  feldWaehlen,
  messwerte,
  messwerteHundertstel,
  speichernMoeglich,
  type Groesse,
  type Messeingabe,
} from '../../domain/messung/eingabe.ts';
import { messergebnis } from '../../domain/messung/ergebnis.ts';
import { messkontext } from '../../domain/messung/messkontext.ts';
import { erfassungBinden, messungVorgang, type Erfassungsbindung } from '../../domain/messung/erfassung.ts';
import { messFaelligkeit } from '../../domain/messung/faelligkeit.ts';
import { ortAufloesen, type Ort } from '../../domain/ort.ts';
import { uhrzeit, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { Ergebniszone, MesswertKachel, Rueckfrage } from '../bausteine/Tile.tsx';
import { useBuendel } from '../buendel.tsx';
import { kalibrierdaten, messgeraet, messungenIm, zustandVon } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';
import '../messen.css';

const BEZEICHNUNG: Record<Groesse, string> = { ph: 'pH', ec: 'EC mS/cm', temperatur: '°C' };
const MIT_FUELLSTAND = new Set(['kratky', 'kratky_belueftet']);

const KURZ: Record<Groesse, string> = { ph: 'pH', ec: 'EC', temperatur: '°C' };

function Kopf({
  titel,
  zeilen = [],
  badge,
  zuHeute = true,
}: {
  titel: string;
  zeilen?: string[];
  badge?: ReactNode;
  zuHeute?: boolean;
}) {
  return (
    <header className="hv-messen-kopf">
      <h1 className="hv-messen-titel">{titel}</h1>
      {zeilen.length > 0 ? (
        <span className="hv-messen-kultur">
          {zeilen.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </span>
      ) : (
        <span className="hv-messen-kultur" />
      )}
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

type Zone = 'eingabe' | 'ergebnis' | 'rueckfrage';

/** Uhr der Oberfläche (Date.now nur in der Oberfläche, CLAUDE.md) */
const uhrJetzt = () => new Date(Date.now());

/** Text einer Kachel-Trendzeile: «vorher 1.30 ↗» */
function trendText(t: { text: string; pfeil?: string } | undefined): string | undefined {
  return t ? (t.pfeil ? `${t.text} ${t.pfeil}` : t.text) : undefined;
}

/** schlechteste Bewertung der gespeicherten Werte (A24) */
function schlechteste(b: Partial<Record<Groesse, Bewertung>>): Bewertung | undefined {
  return (Object.values(b) as Bewertung[]).sort((x, y) => RANG[x] - RANG[y])[0];
}

function Messmaske({ ort }: { ort: Ort }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const felder: Groesse[] = ort.rolle === 'messstelle' ? ['ec', 'temperatur'] : ['ph', 'ec', 'temperatur'];
  const [eingabe, setEingabe] = useState<Messeingabe>(() => eingabeStart(felder));
  const aktuell = useRef(eingabe);
  const [zone, setZone] = useState<Zone>('eingabe');
  // «Ja, speichern» gilt für genau diese Eingabe; jede Änderung verlangt die Rückfrage neu (R10.3)
  const [bestaetigt, setBestaetigt] = useState(false);
  const [fuellstand, setFuellstand] = useState<'ueber_drittel' | 'unter_drittel'>();
  const [ergebnis, setErgebnis] = useState<Schreibergebnis>();
  const [sendet, setSendet] = useState(false);
  const [gespeichert, setGespeichert] = useState<{
    zeit: string;
    clientId: string;
    unsicher: boolean;
    bewertung?: Bewertung;
  }>();
  const [rueckgaengig, setRueckgaengig] = useState(false);
  const bindung = useRef<Erfassungsbindung | undefined>(undefined);
  // der Vorgang einer Eingabe bleibt bei jeder Wiederholung gleich, auch Dauer und Fälligkeit (TO2, Runde 1 Befund 1)
  const vorgangFuer = useRef<{ schluessel: string; schritt: Schritt } | undefined>(undefined);
  const ersterTipp = useRef<number | undefined>(undefined);

  const daten = kalibrierdaten(buendel);
  const [geoeffnet] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(geoeffnet), [geoeffnet]);
  const teile = buendel?.teile;
  // Kontext einmal je Öffnen (Plan 26 Datenfluss): Sollband, Vorwerte, Ansätze, Kultur
  const kontext = useMemo(
    () => (teile ? messkontext(teile, ort, jetzt, ZEITZONE) : undefined),
    [teile, ort, jetzt],
  );
  const werteH = messwerteHundertstel(eingabe);
  const auswertung = kontext ? messergebnis(werteH, kontext, jetzt, ZEITZONE) : undefined;
  const mitBewertung = kontext?.sollband !== undefined;

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
  // Messstelle W: keine Bewertung und keine Ergebniszone; der Leitungswasser-Hinweis steht im Bannerplatz (A9)
  const messstelle = ort.rolle === 'messstelle';
  const leitungswasser = messstelle
    ? auswertung?.hinweise.find((h) => h.ausloeser === 'leitungswasser')
    : undefined;

  function tippen(t: Taste) {
    ersterTipp.current ??= uhrJetzt().getTime();
    const vorher = aktuell.current;
    const nachher = eingabeTippen(vorher, t);
    aktuell.current = nachher;
    setEingabe(nachher);
    setBestaetigt(false);
    setErgebnis(undefined);
    if (!messstelle && eingabeAbgeschlossen(vorher, nachher, t)) setZone('ergebnis');
  }

  function waehlen(g: Groesse) {
    const neu = feldWaehlen(aktuell.current, g);
    aktuell.current = neu;
    setEingabe(neu);
    setZone('eingabe');
  }

  function speichernTippen() {
    // Rückfrage erst beim Speichern (A22)
    if (auswertung?.sprung && !bestaetigt) {
      setZone('rueckfrage');
      return;
    }
    void senden(bestaetigt);
  }

  async function senden(sprungBestaetigt: boolean) {
    if (!geraet || !bereit) return;
    const jetztSenden = uhrJetzt();
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
    const bewertungen = auswertung?.bewertungen ?? {};
    const vorgangSchluessel = `${schluessel}|${String(sprungBestaetigt)}`;
    const vorgang =
      vorgangFuer.current?.schluessel === vorgangSchluessel
        ? vorgangFuer.current.schritt
        : messungVorgang(
            eingabe,
            {
              platzId: ort.platzId,
              messgeraetId: geraet.id,
              messart: messstelle ? 'w' : 'aufgabe',
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
              ...(kontext?.sollband
                ? {
                    bewertung: {
                      sollband: kontext.sollband,
                      bewertungen,
                      ...(sprungBestaetigt ? { sprungBestaetigt: true } : {}),
                    },
                  }
                : {}),
            },
            bindung.current,
          );
    vorgangFuer.current = { schluessel: vorgangSchluessel, schritt: vorgang };
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetztSenden, zeitzone: ZEITZONE });
    setSendet(false);
    setErgebnis(antwort);
    if (antwort.status === 'gespeichert') {
      const schlecht = schlechteste(bewertungen);
      setGespeichert({
        zeit: uhrzeit(giltAb, ZEITZONE),
        clientId: bindung.current.clientId,
        // «unsicher» zum Zeitpunkt der Messung (gilt_ab), nicht des Öffnens (Runde 1 Befund 2)
        unsicher: geraet
          ? istUnsicher({ messgeraetId: geraet.id, datenart: ort.datenart, giltAb }, daten, ZEITZONE)
          : true,
        ...(schlecht ? { bewertung: schlecht } : {}),
      });
    } else setZone((z) => (z === 'rueckfrage' ? 'ergebnis' : z));
  }

  async function zuruecknehmen() {
    if (!gespeichert) return;
    const antwort = await schreiben(
      { art: 'storno', tabelle: 'messung', clientId: gespeichert.clientId, grund: 'rueckgaengig' },
      { jetzt: uhrJetzt(), zeitzone: ZEITZONE },
    );
    if (antwort.status === 'gespeichert') setRueckgaengig(true);
    else setErgebnis(antwort);
  }

  const fehler = ergebnis?.status === 'nicht_gespeichert' ? ergebnis.fehler : undefined;
  const w = messwerte(eingabe);
  const badgeUnsicher = unsicher ? <StatusBadge tone="uncertain" /> : undefined;
  const kopfzeilen = [kontext?.kopfzeile, kontext?.kratkyZeile].filter((z): z is string => Boolean(z));

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
        {!rueckgaengig && gespeichert.bewertung ? <StatusBadge tone={TON[gespeichert.bewertung]} /> : null}
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

  // höchstens ein Banner: Fehler, «Schon gespeichert», «unsicher», dann Leitungswasser oder «veraltet» (A15, A9)
  let banner: ReactNode = null;
  if (fehler)
    banner = (
      <Notice
        kompakt
        tone="danger"
        action={
          fehler.wiederholbar ? (
            <Button variant="secondary" size="compact" disabled={sendet} onClick={speichernTippen}>
              Erneut senden
            </Button>
          ) : undefined
        }
      >
        {fehler.text}
      </Notice>
    );
  else if (ergebnis?.status === 'abweichend')
    banner = (
      <Notice kompakt tone="warn">
        {`Schon gespeichert mit ${[
          ergebnis.vorhanden['ph'] != null ? `pH ${String(ergebnis.vorhanden['ph'])}` : '',
          ergebnis.vorhanden['ec'] != null ? `EC ${String(ergebnis.vorhanden['ec'])}` : '',
          ergebnis.vorhanden['temperatur'] != null ? `${String(ergebnis.vorhanden['temperatur'])} °C` : '',
        ]
          .filter(Boolean)
          .join(', ')}; deine Änderung ist nicht übernommen.`}
      </Notice>
    );
  else if (unsicher)
    banner = (
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
    );
  else if (leitungswasser)
    banner = (
      <Notice kompakt tone="warn">
        {`${leitungswasser.folge}: ${leitungswasser.massnahme}`}
      </Notice>
    );
  else if (kontext?.letzteVeraltet)
    banner = (
      <Notice kompakt tone="info">
        Letzte Messung veraltet, neu messen
      </Notice>
    );

  const speichernZeile = (
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
      <Button className="hv-messen-speichern-knopf" disabled={!bereit || sendet} onClick={speichernTippen}>
        Speichern
      </Button>
    </div>
  );

  const zeilen = felder.flatMap((g) => {
    const b = auswertung?.bewertungen[g];
    const wert = werteH[g];
    return b !== undefined && wert !== undefined
      ? [{ ton: TON[b], wert: `${KURZ[g]} ${alsText(g, wert)}` }]
      : [];
  });
  const sprung = auswertung?.sprung;

  return (
    <main className="hv-seite hv-messen" data-density="regal">
      {/* ein Banner verdrängt «Zu Heute»; bei einem Fehler rückt «unsicher» als Kennzeichen in den Kopf (A8) */}
      <Kopf
        titel={ort.code}
        zeilen={kopfzeilen}
        badge={fehler ? badgeUnsicher : undefined}
        zuHeute={banner === null}
      />
      {banner}
      <div
        className="hv-messen-kacheln"
        style={{ gridTemplateColumns: `repeat(${felder.length}, minmax(0, 1fr))` }}
      >
        {felder.map((g) => {
          const b = auswertung?.bewertungen[g];
          const spur = auswertung?.spur[g];
          const trend = trendText(auswertung?.trend[g]);
          return (
            <MesswertKachel
              key={g}
              {...(mitBewertung ? {} : { kompakt: true })}
              bezeichnung={BEZEICHNUNG[g]}
              wert={eingabe.text[g]}
              {...(b && feldVollstaendig(eingabe, g) ? { ton: TON[b] } : {})}
              {...(trend ? { trend } : {})}
              {...(kontext?.vorher[g]?.veraltet ? { veraltet: true } : {})}
              {...(spur ? { spur } : {})}
              aktiv={zone === 'eingabe' && eingabe.aktiv === g}
              onClick={() => waehlen(g)}
            />
          );
        })}
      </div>
      {zone === 'rueckfrage' && sprung ? (
        <Rueckfrage
          frage={sprung.text}
          nein="Wert ändern"
          ja="Ja, speichern"
          onNein={() => waehlen(sprung.groesse)}
          onJa={() => {
            setBestaetigt(true);
            void senden(true);
          }}
        />
      ) : zone === 'ergebnis' && auswertung ? (
        <div className="hv-numpad">
          <Ergebniszone
            zeilen={zeilen}
            hinweise={auswertung.hinweise}
            {...(auswertung.ohneBewertung ? { ohneBewertung: true } : {})}
          />
          <div className="hv-numpad-save">{speichernZeile}</div>
        </div>
      ) : (
        <NumPad onTaste={tippen} speichern={speichernZeile} />
      )}
    </main>
  );
}
