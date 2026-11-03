// Musterseite des Design Systems (Plan 17): alle Bausteine in beiden Themen, ohne Daten.
// Kontext Schreibtisch; die Regal-Bausteine stehen in einem Bereich mit data-density="regal".
import { useState } from 'react';
import { BASIS_URL } from '../../adressen.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Checklist } from '../bausteine/Checklist.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { TextField } from '../bausteine/TextField.tsx';
import { Ergebnis, MesswertKachel, OrtKachel } from '../bausteine/Tile.tsx';
import { hashZu } from '../router.ts';

// feste Uhr der Musterseite, damit der Timer immer gleich aussieht
const JETZT = Date.UTC(2026, 11, 14, 17, 40);

function Etikett({
  code,
  kennung,
  zeilen,
  klein,
}: {
  code: string;
  kennung: string;
  zeilen: string[];
  klein?: boolean;
}) {
  return (
    <div className={klein ? 'hv-label hv-label-small' : 'hv-label'} data-testid="etikett">
      <div className="hv-label-qr-col">
        <div className="hv-label-qr hv-label-qr-placeholder" title={`${BASIS_URL}#/e/${code}`}>
          QR
        </div>
        <span className="hv-label-code">{code}</span>
      </div>
      <div className="hv-label-text">
        <span className="hv-label-id">{kennung}</span>
        {zeilen.map((z) => (
          <span key={z} className="hv-label-line">
            {z}
          </span>
        ))}
      </div>
    </div>
  );
}

function Regalbereich() {
  const [echo, setEcho] = useState('');
  function taste(t: Taste) {
    if (t === 'leeren') setEcho('');
    else if (t === 'zurueck') setEcho((e) => e.slice(0, -1));
    else if (/^[0-9.]$/.test(t)) setEcho((e) => (e + t).slice(-6));
  }
  return (
    <div className="hv-muster-regal" data-density="regal">
      <h3 className="hv-muster-titel">Dichte «regal»</h3>
      <div className="hv-muster-kacheln">
        <MesswertKachel
          bezeichnung="pH"
          wert="6.7"
          ton="warn"
          trend="vorher 6.4 ↗"
          spur={{ von: 30, bis: 60, vorher: 48, neu: 66 }}
        />
        <MesswertKachel
          bezeichnung="EC mS/cm"
          wert="1.4"
          ton="ok"
          trend="vorher 1.3"
          spur={{ von: 35, bis: 65, vorher: 42, neu: 50 }}
          aktiv
        />
        <MesswertKachel bezeichnung="°C" trend="vorher 20.5" spur={{ von: 30, bis: 70, vorher: 45 }} />
      </div>
      <NumPad onTaste={taste} echo={echo} speichern={<Button block>Messwert speichern</Button>} />
      <Ergebnis ton="ok" />
      <Ergebnis ton="warn" />
      <Ergebnis ton="danger" />
      <div className="hv-muster-orte">
        <OrtKachel kennung="2.3" zeilen={['Salat', 'Lösung 12/14 Tage']} badge={<StatusBadge tone="ok" />} />
        <OrtKachel
          kennung="A1"
          zeilen={['leer · bereit']}
          badge={<StatusBadge tone="neutral">Keimung</StatusBadge>}
        />
        <OrtKachel kennung="W" zeilen={['Messstelle']} badge={<StatusBadge tone="uncertain" />} />
        <OrtKachel kennung="4.1" zeilen={['in Prüfung']} badge={<StatusBadge tone="danger" />} />
      </div>
      <Checklist
        jetzt={JETZT}
        zeilen={[
          { nr: 4, titel: 'Gerechnet für: 6 × Salat Wachstum', zustand: 'erledigt' },
          {
            nr: 5,
            titel: 'Micro: schütteln, einzeln einrühren',
            menge: '7.0 ml · 20-ml-Spritze',
            zustand: 'aktiv',
          },
          { nr: 11, titel: 'Timer 15 min', timerEnde: JETZT + 14 * 60_000 + 32_000, zustand: 'offen' },
        ]}
      />
      <Deckel
        reihen={[2, 2, 2]}
        loecher={[
          { nr: 1, text: '2.3.1', zustand: 'belegt' },
          { nr: 2, text: '2.3.2', zustand: 'belegt' },
          { nr: 4, zustand: 'reserviert' },
          { nr: 5, zustand: 'gewaehlt' },
        ]}
      />
    </div>
  );
}

function Thema({ id, name }: { id: 'light' | 'dark'; name: string }) {
  return (
    <section
      className="hv-muster-thema"
      data-theme={id}
      data-testid={`muster-${id}`}
      aria-label={`Thema ${name}`}
    >
      <h2 className="hv-muster-titel">Thema {name}</h2>
      <Logo height={32} />
      <div className="hv-muster-reihe">
        <Button>Messwert speichern</Button>
        <Button variant="secondary">Abbrechen</Button>
        <Button variant="ghost">Verlauf öffnen</Button>
        <Button variant="danger" size="compact">
          Gefäss entfernen
        </Button>
      </div>
      <div className="hv-muster-reihe">
        <StatusBadge tone="ok" />
        <StatusBadge tone="warn" />
        <StatusBadge tone="danger" />
        <StatusBadge tone="stale" />
        <StatusBadge tone="uncertain" />
        <StatusBadge tone="info">Erinnerung</StatusBadge>
      </div>
      <Card title="Ebene 2 · Salat" meta="Zuletzt gemessen 14:20">
        <span>
          <span className="hv-num" style={{ fontSize: 'var(--text-value-size)', fontWeight: 700 }}>
            1.4
          </span>{' '}
          <span style={{ color: 'var(--ink-muted)' }}>mS/cm</span>
        </span>
      </Card>
      <Notice tone="warn" title="Kalibrierung überfällig">
        Werte gelten als unsicher, bis du das Messgerät kalibrierst.
      </Notice>
      <TextField label="Kannengrösse" unit="l" hint="1 bis 12 l" defaultValue="10" inputMode="decimal" />
      <Regalbereich />
    </section>
  );
}

export function Muster() {
  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">Musterseite</h1>
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'info' })}>
          Info öffnen
        </a>
      </header>
      <p>Alle Bausteine des Design Systems in beiden Themen, ohne Daten (DS-01).</p>
      <Thema id="light" name="Hell" />
      <Thema id="dark" name="Dunkel" />
      <section className="hv-muster-druck" aria-label="Druckvorlagen">
        <h2 className="hv-muster-titel">Druck (in beiden Themen schwarz auf weiss)</h2>
        <div className="hv-muster-schieben">
          <div className="hv-sheet hv-sheet-test" data-testid="bogen">
            <div className="hv-sheet-cell" />
            <div className="hv-sheet-cell">
              <Etikett
                code="R-2.3"
                kennung="2.3"
                zeilen={['Indoor-Regal · DWC · 9 l', 'Deckel D2 · 6 × 5 cm']}
              />
            </div>
            <div className="hv-sheet-cell">
              <Etikett code="R-4.1" kennung="4.1" zeilen={['Indoor-Regal · Station', '4 × 8 cm']} />
            </div>
            <div className="hv-sheet-cell">
              <Etikett code="R-A1" kennung="A1" zeilen={['Lichtkeimer', 'Deckel zu']} klein />
            </div>
          </div>
          <div className="hv-blatt" data-testid="notfallblatt">
            <h3 className="hv-blatt-titel">Stand je Gefäss</h3>
            <span className="hv-blatt-meta">Indoor-Regal · Stand 14.12.2026, 18:40</span>
            <table className="hv-blatt-tabelle">
              <thead>
                <tr>
                  <th>Gefäss</th>
                  <th>Betriebsart</th>
                  <th>Zielbereich</th>
                  <th>Dosis je Kanne</th>
                  <th>Letzte Messung</th>
                  <th>Nächster Wechsel</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="hv-blatt-kennung">2.3</td>
                  <td>DWC</td>
                  <td>pH 5.5–6.5 · EC 1.0–1.4</td>
                  <td>Micro 3.5 ml · Grow 3.5 ml · Bloom 3.5 ml</td>
                  <td>14.12. · pH 6.1 · EC 1.3 · 20.5 °C</td>
                  <td>21.12.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="hv-blatt" data-testid="vertretungsblatt">
            <h3 className="hv-blatt-titel">Vertretung</h3>
            <ol className="hv-blatt-regeln">
              <li>Nur Leitungswasser bis zur Marke nachfüllen.</li>
              <li>Pumpen und Licht prüfen.</li>
              <li className="hv-blatt-verboten">Keinen Dünger geben.</li>
              <li>Bei Fragen: Telefonnummer aus den Einstellungen.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
