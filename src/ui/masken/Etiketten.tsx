// Etiketten drucken #/etiketten?a=<Kürzel> (UC14, 05_masken.md 4 «Etiketten»; Plan 22): Kontext Schreibtisch
// (48 dp). Liste je Anlage mit Stand, Auswahl, Startfeld, Druckversatz X/Y und Testbogen; öffnet die Druckansicht.
import { useState } from 'react';
import { kuerzelAenderbar } from '../../domain/anlage/kuerzel.ts';
import { anlagenAus } from '../../domain/anlage/teile.ts';
import { druckEingabePruefen } from '../../domain/etikett/bogen.ts';
import { etikettListe } from '../../domain/etikett/etikett.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { useBuendel } from '../buendel.tsx';
import { druckversatzLesen, druckversatzMerken } from '../druckversatz.ts';
import { hashZu, oeffnen } from '../router.ts';

const DATENART = { echt: '', demo: 'Demo', test: 'Test' } as const;
const zahl = (text: string) => Number(text.trim().replace(',', '.'));

export function Etiketten({ kuerzel, codes }: { kuerzel?: string; codes?: string[] }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const anlagen = anlagenAus(teile);
  const anlage = anlagen.find((a) => a.kuerzel === kuerzel) ?? anlagen[0];
  const liste = anlage ? etikettListe(teile, anlage.id, ZEITZONE) : [];

  // Auswahl: aus der Adresse, sonst alle «nicht gedruckt» (A11); null = noch nicht angefasst
  const [gewaehlt, setGewaehlt] = useState<ReadonlySet<string> | null>(null);
  const auswahl =
    gewaehlt ??
    new Set(codes && codes.length > 0 ? codes : liste.filter((z) => !z.gedruckt).map((z) => z.code));
  const [versatz] = useState(() => druckversatzLesen());
  const [startfeld, setStartfeld] = useState('1');
  const [versatzX, setVersatzX] = useState(() => String(versatz.x));
  const [versatzY, setVersatzY] = useState(() => String(versatz.y));
  const [testbogen, setTestbogen] = useState(false);
  const [geprueft, setGeprueft] = useState(false);

  const eingabe = { startfeld: zahl(startfeld), versatzX: zahl(versatzX), versatzY: zahl(versatzY) };
  const verstoesse = druckEingabePruefen(eingabe);
  const fehler = (feld: string) => (geprueft ? verstoesse.find((v) => v.feld === feld)?.grund : undefined);
  const gewaehlteCodes = liste.filter((z) => auswahl.has(z.code)).map((z) => z.code);

  function umschalten(code: string, an: boolean) {
    const neu = new Set(auswahl);
    if (an) neu.add(code);
    else neu.delete(code);
    setGewaehlt(neu);
  }

  function druckansicht() {
    setGeprueft(true);
    if (!anlage || verstoesse.length > 0 || gewaehlteCodes.length === 0) return;
    druckversatzMerken({ x: eingabe.versatzX, y: eingabe.versatzY });
    oeffnen({
      name: 'druck-etiketten',
      kuerzel: anlage.kuerzel,
      codes: gewaehlteCodes,
      start: eingabe.startfeld,
      versatzX: eingabe.versatzX,
      versatzY: eingabe.versatzY,
      test: testbogen,
    });
  }

  return (
    <main className="hv-seite hv-etiketten">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Etiketten</h1>
        <a
          className="hv-btn hv-btn-ghost hv-btn-compact"
          href={hashZu(anlage ? { name: 'anlage', kuerzel: anlage.kuerzel } : { name: 'heute' })}
        >
          {anlage ? 'Zur Anlage' : 'Zu Heute'}
        </a>
      </header>
      {anlagen.length > 1 ? (
        <nav className="hv-anlage-wahl" aria-label="Anlagen">
          {anlagen.map((a) => (
            <a
              key={a.id}
              className={`hv-btn hv-btn-compact ${a.id === anlage?.id ? 'hv-btn-primary' : 'hv-btn-secondary'}`}
              aria-current={a.id === anlage?.id ? 'page' : undefined}
              href={hashZu({ name: 'etiketten', kuerzel: a.kuerzel })}
            >
              {a.kuerzel}
              {DATENART[a.datenart] ? ` · ${DATENART[a.datenart]}` : ''}
            </a>
          ))}
        </nav>
      ) : null}
      {!anlage ? (
        <p>{liest ? 'Daten werden geladen' : 'Noch keine Anlage erfasst'}</p>
      ) : (
        <>
          {kuerzelAenderbar(teile, anlage.id) ? (
            <Notice
              tone="info"
              title={`Nach dem ersten Druck ist das Kürzel ${anlage.kuerzel} fest`}
              kompakt
            />
          ) : null}
          <fieldset className="hv-anlage-feldgruppe">
            <legend>Etiketten {anlage.kuerzel}</legend>
            <div className="hv-etiketten-alle">
              <Button variant="secondary" onClick={() => setGewaehlt(new Set(liste.map((z) => z.code)))}>
                Alle wählen
              </Button>
            </div>
            <ul className="hv-etiketten-liste">
              {liste.map((z) => (
                <li key={z.code}>
                  <label className="hv-anlage-wahlfeld">
                    <input
                      type="checkbox"
                      checked={auswahl.has(z.code)}
                      onChange={(e) => umschalten(z.code, e.target.checked)}
                    />
                    <span className="hv-etiketten-kennung">
                      {z.kennung} · {z.art}
                    </span>
                    <span className="hv-etiketten-stand">{z.stand}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="hv-anlage-zweispaltig">
            <TextField
              label="Startfeld"
              hint="1 bis 21, links oben beginnt Feld 1"
              inputMode="numeric"
              value={startfeld}
              error={fehler('startfeld')}
              onChange={(e) => setStartfeld(e.target.value)}
            />
            <TextField
              label="Druckversatz X"
              unit="mm"
              inputMode="decimal"
              value={versatzX}
              error={fehler('versatzX')}
              onChange={(e) => setVersatzX(e.target.value)}
            />
            <TextField
              label="Druckversatz Y"
              unit="mm"
              inputMode="decimal"
              value={versatzY}
              error={fehler('versatzY')}
              onChange={(e) => setVersatzY(e.target.value)}
            />
          </div>
          <label className="hv-anlage-wahlfeld">
            <input type="checkbox" checked={testbogen} onChange={(e) => setTestbogen(e.target.checked)} />
            <span>Testbogen auf Normalpapier</span>
          </label>
          {geprueft && gewaehlteCodes.length === 0 ? (
            <Notice tone="warn" title="Wähle mindestens ein Etikett" kompakt />
          ) : null}
          <Button onClick={druckansicht}>Druckansicht öffnen</Button>
        </>
      )}
    </main>
  );
}
