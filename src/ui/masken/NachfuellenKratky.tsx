// Nachfüllen Kratky (R4.10; Plan 30, Plan 225 Entscheid 4): der Schritt des Rundgangs als Baustein und als eigene Maske
// (Route #/nachfuellen/<Code>) aus der Aufgabe «Nachfüllen Kratky» in Heute und Gefäss. Grundlage ist dort die Messung
// «unter ⅓», die die Aufgabe ausgelöst hat; Rechnung und Vorgang sind die des Rundgangs.
import { useRef, useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { gefaessAm } from '../../domain/anlage/teile.ts';
import { einstellungenAus } from '../../domain/aufgaben.ts';
import { verteilteAufgaben } from '../../domain/aufgaben-verteilung.ts';
import { rueckgaengigVorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import {
  kratkyErgebnis,
  kratkyNachfuellAufgabe,
  kratkySchritt,
  nachfuellVorgang,
} from '../../domain/rundgang/nachfuellen.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { useBuendel } from '../buendel.tsx';
import { useMelden } from '../meldung.tsx';
import { NachSpeichern, useHeuteVorher } from '../NachSpeichern.tsx';
import { Rahmen, ZumGefaess } from './Kurzpruefung.tsx';

/** Liter über den Ziffernblock: höchstens eine Nachkommastelle, höchstens vier Zeichen */
export function literTippen(alt: string, t: Taste): string {
  if (t === 'leeren') return '';
  if (t === 'zurueck') return alt.slice(0, -1);
  if (t === '.') return alt.includes('.') || alt === '' ? alt : `${alt}.`;
  if (/^\d$/.test(t)) return /\.\d$/.test(alt) || alt.length >= 4 ? alt : `${alt}${t}`;
  return alt;
}

/** Anzeige und Obergrenze aus kratkyNachfuellen() (R4.10) */
export function kratkyAnzeige(k: ReturnType<typeof kratkySchritt> | undefined): {
  text: string;
  hoechstens?: number;
} {
  const hoechstens = k && 'hoechstensLiter' in k ? k.hoechstensLiter / 10 : undefined;
  const text =
    k?.art === 'nur_wasser'
      ? `Nur Wasser, höchstens ${(k.hoechstensLiter / 10).toFixed(1)} l`
      : k?.art === 'halbe_konzentration'
        ? `Halbe Konzentration ${(k.dMlL / 100).toFixed(2)} ml/L, höchstens ${(k.hoechstensLiter / 10).toFixed(1)} l`
        : 'Nach Bedarf nachfüllen';
  return { text, ...(hoechstens !== undefined ? { hoechstens } : {}) };
}

/** Nachfüllen Kratky (R4.10): Anzeige aus kratkyNachfuellen(), Menge in Litern über den Ziffernblock */
export function KratkyNachfuellen({
  code,
  text,
  hoechstens,
  sendet,
  fehler,
  zuHeute = true,
  onNachgefuellt,
}: {
  code: string;
  text: string;
  hoechstens?: number;
  sendet: boolean;
  fehler: React.ReactNode;
  zuHeute?: boolean;
  onNachgefuellt: (liter: number) => void;
}) {
  const [eingabe, setEingabe] = useState('');
  const liter = Number(eingabe);
  const zuViel = hoechstens !== undefined && liter > hoechstens;
  const tippen = (t: Taste) => setEingabe((alt) => literTippen(alt, t));
  return (
    <Rahmen titel={`${code} Nachfüllen Kratky`} zuHeute={zuHeute}>
      {fehler}
      <p className="hv-rundgang-ebene">{text}</p>
      {zuViel ? (
        <Notice kompakt tone="warn" title={`Höchstens ${String(hoechstens)} l, sonst fehlt die Luftzone`} />
      ) : null}
      <NumPad
        onTaste={tippen}
        echo={eingabe === '' ? 'Liter' : `${eingabe} l`}
        ohnePlusMinus
        speichern={
          <Button block disabled={sendet || !(liter > 0) || zuViel} onClick={() => onNachgefuellt(liter)}>
            Nachgefüllt
          </Button>
        }
      />
    </Rahmen>
  );
}

/** Nachfüllen Kratky eines Orts aus der fälligen Aufgabe (Route #/nachfuellen/<Code>) */
export function NachfuellenOrt({ code, von }: { code: string; von?: 'gefaess' }) {
  const { buendel, liest } = useBuendel();
  const melden = useMelden();
  const vorher = useHeuteVorher();
  const [zeit] = useState(() => new Date(Date.now()));
  const [fertig, setFertig] = useState<number>();
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const sperre = useRef(false);
  const teile = buendel?.teile;
  const titel = `${code} Nachfüllen Kratky`;
  if (!teile)
    return (
      <Rahmen titel={titel}>
        <p>{liest ? 'Daten werden geladen' : 'Keine Daten'}</p>
      </Rahmen>
    );
  if (fertig !== undefined)
    return (
      <Rahmen titel={titel}>
        <p className="hv-rundgang-ebene" role="status">{`Nachgefüllt: ${String(fertig)} l`}</p>
        <NachSpeichern bezug={{ name: 'nachfuellen', code }} vorher={vorher} />
        <ZumGefaess code={code} {...(von ? { von } : {})} />
      </Rahmen>
    );
  const platzId = ortAufloesen(code, teile)?.platzId;
  let grundlage: ReturnType<typeof kratkyNachfuellAufgabe>;
  try {
    grundlage = platzId
      ? kratkyNachfuellAufgabe(
          teile,
          verteilteAufgaben(teile, einstellungenAus(teile), zeit, ZEITZONE),
          platzId,
        )
      : undefined;
  } catch (f) {
    console.error('Nachfüllen', f);
  }
  if (!platzId || !grundlage)
    return (
      <Rahmen titel={titel}>
        <p>{platzId ? 'Kein Nachfüllen fällig' : `Ort ${code} nicht bekannt`}</p>
        <ZumGefaess code={code} {...(von ? { von } : {})} />
      </Rahmen>
    );
  const { aufgabe, messung } = grundlage;
  const ort = platzId;
  const stand = teile;
  const anzeige = kratkyAnzeige(kratkySchritt(teile, ort, messung, ZEITZONE));
  const volumenL = Number(gefaessAm(teile, ort)?.betriebsvolumen_l ?? 0);

  async function speichern(liter: number) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
    try {
      const jetzt = new Date(Date.now());
      // halbe Konzentration: Positionen mit dem gegebenen Dünger, wie im Rundgang
      const ergebnis = kratkyErgebnis(stand, ort, messung, liter, ZEITZONE);
      const vorgang = nachfuellVorgang(
        { platzId: ort, liter, ...(ergebnis ? { ergebnis } : {}), aufgabe, volumenL },
        neueClientId,
        jetzt,
      );
      const r = await schreiben(vorgang, { jetzt, zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      setFehler(undefined);
      setFertig(liter);
      melden({
        text: `Nachgefüllt: ${String(liter)} l ${code}`,
        rueckgaengig: rueckgaengigVorgang(vorgang),
        nachRueckgaengig: () => setFertig(undefined),
      });
    } finally {
      sperre.current = false;
      setSendet(false);
    }
  }

  return (
    <KratkyNachfuellen
      code={code}
      text={anzeige.text}
      {...(anzeige.hoechstens !== undefined ? { hoechstens: anzeige.hoechstens } : {})}
      sendet={sendet}
      fehler={fehler ? <Notice kompakt tone="danger" title={fehler} /> : null}
      onNachgefuellt={(liter) => void speichern(liter)}
    />
  );
}
