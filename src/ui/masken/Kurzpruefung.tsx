// Kurzprüfung (Plan 30, Plan 225): der Sammel-Tipp des Rundgangs als Baustein (Rahmen, Punkte mit Wort und Symbol) und
// die Maske «Kurzprüfung eines Orts» aus Heute und Gefäss («Etwas stimmt nicht», «Belüftung prüfen»): dieselben Punkte
// und derselbe Vorgang wie im Rundgang, auf einen Ort beschränkt (UX3, R5.2).
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { einstellungenAus } from '../../domain/aufgaben.ts';
import { verteilteAufgaben } from '../../domain/aufgaben-verteilung.ts';
import { rueckgaengigVorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { befundZeilen, kurzpruefungVorgang, ortKurzpruefung } from '../../domain/rundgang/kurzpruefung.ts';
import type { RundgangEbene } from '../../domain/rundgang/plan.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusIcon } from '../bausteine/StatusIcon.tsx';
import { useBuendel } from '../buendel.tsx';
import { useMelden } from '../meldung.tsx';
import { NachSpeichern, useHeuteVorher } from '../NachSpeichern.tsx';
import { hashZu } from '../router.ts';
import '../rundgang.css';

const kennung = (code: string) => code.slice(code.indexOf('-') + 1);

export function Rahmen({
  titel,
  children,
  beenden,
  zuHeute = true,
}: {
  titel: string;
  children: React.ReactNode;
  beenden?: () => void;
  /** «Zu Heute» im Kopf: navigiert nur, der Rundgang lässt sich fortsetzen (Plan 224 A10) */
  zuHeute?: boolean;
}) {
  return (
    <main className="hv-seite hv-rundgang" data-density="regal">
      <header className="hv-messen-kopf">
        <h1 className="hv-messen-titel">{titel}</h1>
        {beenden ? (
          <Button variant="ghost" size="compact" onClick={beenden}>
            Rundgang beenden
          </Button>
        ) : null}
        {zuHeute ? (
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
            Zu Heute
          </a>
        ) : null}
      </header>
      {children}
    </main>
  );
}

/** Prüfpunkt als Frage (U-04, B8): «Pumpe sprudelt» wird «Pumpe sprudelt?» */
const frage = (text: string) => (text.endsWith('?') ? text : `${text}?`);

/** Zustand der Kurzprüfung als Wort mit Symbol 32 dp, nie nur über Farbe (U-04, B8): ja, nach Tipp nein */
function Urteil({ abweichung }: { abweichung: boolean }) {
  return (
    <span className="hv-rundgang-urteil">
      <StatusIcon ton={abweichung ? 'danger' : 'ok'} />
      {abweichung ? 'nein' : 'ja'}
    </span>
  );
}

/** Sammel-Tipp der Ebene: «Alles ok» oder Ausnahmen einzeln (Wort und Symbol, nicht nur Farbe) */
export function Kurzpruefung({
  ebene,
  titel,
  sendet,
  fehler,
  beenden,
  onSpeichern,
}: {
  ebene: RundgangEbene;
  titel: string;
  sendet: boolean;
  fehler: React.ReactNode;
  beenden?: () => void;
  onSpeichern: (abweichungen: ReadonlySet<string>) => void;
}) {
  const [abw, setAbw] = useState<ReadonlySet<string>>(new Set());
  const umschalten = (key: string) =>
    setAbw((alt) => {
      const neu = new Set(alt);
      if (neu.has(key)) neu.delete(key);
      else neu.add(key);
      return neu;
    });
  return (
    <Rahmen titel={titel} {...(beenden ? { beenden } : {})}>
      {fehler}
      <h2 className="hv-rundgang-ebene">{`${ebene.name} · Pumpen laufen, Licht an, Lüfter läuft`}</h2>
      {ebene.mitLichtLuefter && ebene.bereichId !== null ? (
        <div className="hv-rundgang-kannen" role="group" aria-label="Licht und Lüfter">
          {(
            [
              ['licht', 'Licht an?'],
              ['luefter', 'Lüfter läuft?'],
            ] as const
          ).map(([punkt, text]) => {
            const key = `${String(ebene.bereichId)}|${punkt}`;
            const ab = abw.has(key);
            return (
              <Button
                key={key}
                variant="secondary"
                className="hv-rundgang-punkt"
                aria-pressed={ab}
                onClick={() => umschalten(key)}
              >
                <span>{text}</span>
                <Urteil abweichung={ab} />
              </Button>
            );
          })}
        </div>
      ) : null}
      <ul className="hv-rundgang-liste" aria-label="Kurzprüfung">
        {ebene.kurzpruefung.map((z) => {
          const key = `${z.platzId}|${z.punkt}`;
          const ab = abw.has(key);
          return (
            <li key={key}>
              <Button
                variant="secondary"
                block
                className="hv-rundgang-punkt"
                aria-pressed={ab}
                onClick={() => umschalten(key)}
              >
                <span>{`${kennung(z.code)} ${frage(z.text)}`}</span>
                <Urteil abweichung={ab} />
                {z.vermerk ? (
                  <span className="hv-rundgang-vermerk">
                    {z.vermerk === 'mitmarkiert' ? 'Pumpe mitmarkiert' : 'Belüftung prüfen'}
                  </span>
                ) : null}
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="hv-rundgang-fuss">
        <Button block disabled={sendet} onClick={() => onSpeichern(abw)}>
          {abw.size === 0
            ? 'Alles ok'
            : `Speichern mit ${String(abw.size)} Abweichung${abw.size === 1 ? '' : 'en'}`}
        </Button>
      </div>
    </Rahmen>
  );
}

/** «Zum Gefäss <Code>» nach dem Speichern, wenn die Maske aus der Maske Gefäss geöffnet wurde (Plan 225 A5) */
export function ZumGefaess({ code, von }: { code: string; von?: 'gefaess' }) {
  return von === 'gefaess' ? (
    <a className="hv-btn hv-btn-ghost hv-btn-block" href={hashZu({ name: 'gefaess', code })}>
      {`Zum Gefäss ${code}`}
    </a>
  ) : null;
}

/** Kurzprüfung eines Orts (Route #/kurzpruefung/<Code>): alle heute fälligen Punkte des Orts, auch Wurzeln */
export function KurzpruefungOrt({ code, von }: { code: string; von?: 'gefaess' }) {
  const { buendel, liest } = useBuendel();
  const melden = useMelden();
  const vorher = useHeuteVorher();
  const [zeit] = useState(() => new Date(Date.now()));
  const [fertig, setFertig] = useState<{ text: string; massnahme: string }[]>();
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const sperre = useRef(false);
  const teile = buendel?.teile;
  const titel = `Kurzprüfung ${code}`;
  if (!teile)
    return (
      <Rahmen titel={titel}>
        <p>{liest ? 'Daten werden geladen' : 'Keine Daten'}</p>
      </Rahmen>
    );
  const weiter = (
    <>
      <NachSpeichern bezug={{ name: 'kurzpruefung', code }} vorher={vorher} />
      <ZumGefaess code={code} {...(von ? { von } : {})} />
    </>
  );
  if (fertig)
    return (
      <Rahmen titel={titel}>
        <p className="hv-rundgang-ebene" role="status">
          {fertig.length === 0
            ? 'Gespeichert: alles ok'
            : `Gespeichert mit ${String(fertig.length)} Abweichung${fertig.length === 1 ? '' : 'en'}`}
        </p>
        {fertig.map((z) => (
          <Notice key={z.text} kompakt tone="warn" title={z.text}>
            {z.massnahme}
          </Notice>
        ))}
        {weiter}
      </Rahmen>
    );
  const platzId = ortAufloesen(code, teile)?.platzId;
  let ebene: RundgangEbene | undefined;
  try {
    ebene = platzId
      ? ortKurzpruefung(
          teile,
          verteilteAufgaben(teile, einstellungenAus(teile), zeit, ZEITZONE),
          platzId,
          zeit,
          ZEITZONE,
        )
      : undefined;
  } catch (f) {
    console.error('Kurzprüfung', f);
  }
  if (!ebene || ebene.kurzpruefung.length === 0)
    return (
      <Rahmen titel={titel}>
        <p>{platzId ? `Kurzprüfung ${code} heute schon erfasst` : `Ort ${code} nicht bekannt`}</p>
        <ZumGefaess code={code} {...(von ? { von } : {})} />
      </Rahmen>
    );
  const offen = ebene;

  async function speichern(abweichungen: ReadonlySet<string>) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
    try {
      const jetzt = new Date(Date.now());
      const vorgang = kurzpruefungVorgang(offen, abweichungen, neueClientId, jetzt);
      const r = await schreiben(vorgang, { jetzt, zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      setFehler(undefined);
      const n = abweichungen.size;
      setFertig(befundZeilen(offen, abweichungen));
      melden({
        text: `Kurzprüfung gespeichert: ${code}${n > 0 ? ` mit ${String(n)} Abweichung${n === 1 ? '' : 'en'}` : ''}`,
        rueckgaengig: rueckgaengigVorgang(vorgang),
        nachRueckgaengig: () => setFertig(undefined),
      });
    } finally {
      sperre.current = false;
      setSendet(false);
    }
  }

  return (
    <Kurzpruefung
      ebene={offen}
      titel={titel}
      sendet={sendet}
      fehler={fehler ? <Notice kompakt tone="danger" title={fehler} /> : null}
      onSpeichern={(abw) => void speichern(abw)}
    />
  );
}
