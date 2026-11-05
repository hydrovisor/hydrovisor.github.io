// Notfall- und Vertretungsblatt (Druck, Plan 32; Konzept 11.7; design-system/components/Notfallblatt.md): derselbe
// Druckweg wie der Etikettenbogen. Die Telefonnummer kommt nur online aus der Datenbank (Annahme 12).
import { useEffect, useState } from 'react';
import { einstellungSchreiben } from '../../daten/schreiben.ts';
import {
  notfallblatt,
  vertretungKontakt,
  VERTRETUNG_REGELN,
} from '../../domain/einstellungen/notfallblatt.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

type Zeile = Record<string, unknown>;

/** gewählte Anlage, sonst die erste echte, sonst die erste aktive */
function anlageWahl(
  teile: Record<string, readonly unknown[]> | undefined,
  kuerzel?: string,
): string | undefined {
  const anlagen = ((teile?.['anlage'] ?? []) as Zeile[]).filter(
    (a) => a['aktiv'] === true && (a['storniert_am'] ?? null) === null,
  );
  if (kuerzel && anlagen.some((a) => a['kuerzel'] === kuerzel)) return kuerzel;
  const echt = anlagen.find((a) => a['datenart'] === 'echt') ?? anlagen[0];
  return echt ? String(echt['kuerzel']) : undefined;
}

export function Notfallblatt({ kuerzel }: { kuerzel?: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const anlage = anlageWahl(teile, kuerzel);
  const einstellungId = (teile?.['einstellung']?.[0] as Zeile | undefined)?.['id'];
  const [telefon, setTelefon] = useState<string | null>(null);
  const [geoeffnet] = useState(() => Date.now());

  useEffect(() => {
    if (typeof einstellungId !== 'string') return;
    let aktiv = true;
    void einstellungSchreiben.lesen('einstellung', einstellungId, 'id,telefon_vertretung').then((r) => {
      if (aktiv && r.status === 'gespeichert') {
        const t = r.zeile?.['telefon_vertretung'];
        setTelefon(typeof t === 'string' ? t : null);
      }
    });
    return () => {
      aktiv = false;
    };
  }, [einstellungId]);

  if (!teile || !anlage) {
    return (
      <main className="hv-druck">
        <p className="hv-druck-steuerung">{liest ? 'Daten werden geladen' : 'Keine Anlage gefunden'}</p>
      </main>
    );
  }
  const blatt = notfallblatt(teile, anlage, new Date(geoeffnet), ZEITZONE);

  return (
    <main className="hv-druck">
      <div className="hv-druck-steuerung">
        <Button onClick={() => window.print()}>Drucken</Button>
        <a className="hv-btn hv-btn-ghost" href={hashZu({ name: 'einstellungen' })}>
          Zu den Einstellungen
        </a>
      </div>
      <div className="hv-druck-vorschau">
        <section className="hv-blatt" aria-label="Stand je Gefäss">
          <h2 className="hv-blatt-titel">Stand je Gefäss</h2>
          <p className="hv-blatt-meta">{`Anlage ${blatt.anlage} · ${blatt.stand} · Kanne ${blatt.kanne.toFixed(1)} l`}</p>
          <table className="hv-blatt-tabelle">
            <thead>
              <tr>
                <th>Kennung</th>
                <th>Betriebsart</th>
                <th>Zielbereich</th>
                <th>Dosis je Kanne</th>
                <th>Letzte Messung</th>
                <th>Nächster Wechsel</th>
              </tr>
            </thead>
            <tbody>
              {blatt.zeilen.map((z) => (
                <tr key={z.kennung}>
                  <td className="hv-blatt-kennung">{z.kennung}</td>
                  <td>{z.betriebsart}</td>
                  <td>{z.zielbereich}</td>
                  <td>{z.dosisJeKanne}</td>
                  <td>{z.letzteMessung}</td>
                  <td>{z.naechsterWechsel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="hv-blatt" aria-label="Vertretung">
          <h2 className="hv-blatt-titel">Vertretung</h2>
          <ol className="hv-blatt-regeln">
            {VERTRETUNG_REGELN.map((r) => (
              <li key={r} className={r.startsWith('Keinen Dünger') ? 'hv-blatt-verboten' : undefined}>
                {r}
              </li>
            ))}
            <li>{vertretungKontakt(telefon)}</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
