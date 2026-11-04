// Gefäss prüfen, Schritte 1 bis 3 (R9.3, 05_masken.md 3.8; Plan 21): Kontext Regal (68 dp), ohne Systemtastatur.
// Jeder Tipp ist ein eigener Vorgang mit einem Ereignis gefaesspruefung; der Stand kommt nach dem Neuladen aus den
// Ereignissen (A11).
import { useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { deckeltyp, gefaessAm } from '../../domain/anlage/teile.ts';
import { toepfe } from '../../domain/anlage/erfassen.ts';
import { kennungPruefen, pruefschrittVorgang, pruefStand } from '../../domain/etikett/pruefung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
import { hashZu } from '../router.ts';

export function GefaessPruefen({ code }: { code: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const ort = teile ? ortAufloesen(code, teile) : undefined;
  const [eingabe, setEingabe] = useState('');
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string }>();
  const [lokal, setLokal] = useState<number>();
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();

  const kopf = (
    <header className="hv-messen-kopf">
      <h1 className="hv-messen-titel">{ort ? `${ort.kennung} prüfen` : 'Gefäss prüfen'}</h1>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );
  const g = ort ? gefaessAm(teile, ort.platzId) : undefined;
  if (!ort || !g)
    return (
      <main className="hv-seite hv-messen" data-density="regal">
        {kopf}
        <p>{liest ? 'Daten werden geladen' : `Gefäss ${code} nicht bekannt`}</p>
      </main>
    );
  const stand = pruefStand(teile, ort.platzId);
  // lokal weiter, bis das neu geladene Bündel den Schritt kennt
  const schritt = Math.max(stand.naechsterSchritt ?? 5, lokal ?? 0);
  const deckel = g.deckeltyp_id ? deckeltyp(teile, g.deckeltyp_id) : undefined;

  async function melden(s: 1 | 2 | 3, ok: boolean) {
    if (!ort) return;
    setSendet(true);
    const antwort = await schreiben(pruefschrittVorgang(ort.platzId, s, ok, neueClientId(), jetzt()), {
      jetzt: jetzt(),
      zeitzone: ZEITZONE,
    });
    setSendet(false);
    if (antwort.status !== 'gespeichert') {
      setFehler('Kein Netz, nicht gespeichert, erneut senden');
      return;
    }
    setFehler(undefined);
    if (ok) setLokal(s + 1);
  }

  function tippen(t: Taste) {
    if (t === 'weiter') {
      if (!ort) return;
      const p = kennungPruefen(eingabe, ort.kennung);
      setMeldung(p);
      void melden(1, p.ok);
      if (!p.ok) setEingabe('');
      return;
    }
    if (t === 'leeren') return setEingabe('');
    if (t === 'zurueck') return setEingabe((e) => e.slice(0, -1));
    if (t === 'minus' || t === 'plus') return;
    setEingabe((e) => (e.length < 6 ? e + t : e));
  }

  return (
    <main className="hv-seite hv-messen" data-density="regal">
      {kopf}
      {meldung ? <p className="hv-messen-zeile">{meldung.text}</p> : null}
      {fehler ? <Notice tone="danger" title={fehler} kompakt /> : null}
      {schritt === 1 ? (
        <>
          <p className="hv-messen-zeile">Kennung tippen</p>
          <NumPad onTaste={tippen} echo={eingabe || '–'} ohnePlusMinus />
        </>
      ) : schritt === 2 ? (
        <>
          <p className="hv-messen-zeile">Deckel {deckel?.name ?? ''}: stimmen Lochbild und Nummern?</p>
          {deckel ? (
            <Deckel
              reihen={[...deckel.loecher_je_reihe]}
              loecher={toepfe(ort.kennung, deckel, false).map((t) => ({
                nr: t.lochNr,
                zustand: 'frei' as const,
              }))}
            />
          ) : null}
          <div className="hv-messen-speichern">
            <Button variant="secondary" disabled={sendet} onClick={() => void melden(2, false)}>
              Stimmt nicht
            </Button>
            <Button
              className="hv-messen-speichern-knopf"
              disabled={sendet}
              onClick={() => void melden(2, true)}
            >
              Stimmt
            </Button>
          </div>
        </>
      ) : schritt === 3 ? (
        <>
          <p className="hv-messen-zeile">
            Netztopf {(deckel?.topfdurchmesser_mm ?? 0) / 10} cm sitzt im Loch
          </p>
          <div className="hv-messen-speichern">
            <Button variant="secondary" disabled={sendet} onClick={() => void melden(3, false)}>
              Stimmt nicht
            </Button>
            <Button
              className="hv-messen-speichern-knopf"
              disabled={sendet}
              onClick={() => void melden(3, true)}
            >
              Stimmt
            </Button>
          </div>
        </>
      ) : (
        <p className="hv-messen-bestaetigung">
          {schritt === 4 ? 'in Betrieb (Volumen offen)' : 'in Betrieb'}
        </p>
      )}
      {stand.protokoll.some((p) => !p.ok && (p.schritt === 2 || p.schritt === 3)) && schritt <= 3 ? (
        <a
          className="hv-btn hv-btn-secondary"
          href={hashZu({ name: 'gefaess-aendern', code, teil: 'deckel' })}
        >
          Deckel ändern
        </a>
      ) : null}
    </main>
  );
}
