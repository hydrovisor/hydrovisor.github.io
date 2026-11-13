// Anlagen (Entscheid 0025, Plan 212): Hauptseite der Leiste unten mit Wahl Indoor oder Outdoor und je Anlage einer Karte
// mit «Anlage <Kürzel> öffnen». Die Belegung je Ebene und Box folgt mit Paket N4 (Plan A3).
import { anlagenAus, plaetzeAus, type AnlageZeile, type Teile } from '../../domain/anlage/teile.ts';
import { Card } from '../bausteine/Card.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu, oeffnen } from '../router.ts';

const DATENART = { echt: '', demo: 'Demo', test: 'Test' } as const;

type Standort = 'indoor' | 'outdoor';

/** Standort einer Anlage; ohne Angabe Indoor (Datenmodell: Vorgabe 'indoor') */
function standortVon(a: AnlageZeile): Standort {
  return a.standort === 'outdoor' ? 'outdoor' : 'indoor';
}

/** «13 Gefässe · 4 Anzuchtorte · Messstelle W» aus den aktiven Plätzen */
function inhalt(teile: Teile, anlageId: string): string {
  const plaetze = plaetzeAus(teile, anlageId);
  const zahl = (rolle: string) => plaetze.filter((p) => p.rolle === rolle).length;
  const g = zahl('gefaess');
  const a = zahl('anzuchtort');
  const w = plaetze.filter((p) => p.rolle === 'messstelle').map((p) => p.kennung);
  const teileText = [
    `${String(g)} ${g === 1 ? 'Gefäss' : 'Gefässe'}`,
    `${String(a)} ${a === 1 ? 'Anzuchtort' : 'Anzuchtorte'}`,
    ...w.map((k) => `Messstelle ${k}`),
  ];
  return teileText.join(' · ');
}

export function Anlagen({ standort = 'indoor' }: { standort?: Standort }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const alle = anlagenAus(teile);
  const zahl = (s: Standort) => alle.filter((a) => standortVon(a) === s).length;
  const anlagen = alle.filter((a) => standortVon(a) === standort);
  return (
    <main className="hv-seite hv-anlagen">
      <h1 className="hv-seite-titel">Anlagen</h1>
      <Choice
        label="Standort"
        zeile
        einzeln
        optionen={[
          { wert: 'indoor', titel: `Indoor · ${String(zahl('indoor'))}` },
          { wert: 'outdoor', titel: `Outdoor · ${String(zahl('outdoor'))}` },
        ]}
        gewaehlt={[standort]}
        onWahl={(wert) => {
          oeffnen(wert === 'outdoor' ? { name: 'anlagen', standort: 'outdoor' } : { name: 'anlagen' });
        }}
      />
      {anlagen.length === 0 ? (
        liest && !buendel ? (
          <p>Daten werden geladen</p>
        ) : (
          <Card
            title={standort === 'outdoor' ? 'Noch keine Outdoor-Anlage' : 'Noch keine Anlage'}
            footer={
              <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'anlage-neu' })}>
                Anlage anlegen
              </a>
            }
          >
            {standort === 'outdoor' ? (
              <p>Die Dachterrasse ist als Anlage ab Sommer 2027 vorgesehen.</p>
            ) : null}
          </Card>
        )
      ) : (
        <ul className="hv-anlagen-liste" aria-label={standort === 'outdoor' ? 'Outdoor' : 'Indoor'}>
          {anlagen.map((a) => (
            <li key={a.id}>
              <Card
                title={`${a.kuerzel} · ${a.name}`}
                {...(DATENART[a.datenart] ? { meta: DATENART[a.datenart] } : {})}
                footer={
                  <a
                    className="hv-btn hv-btn-secondary hv-btn-block"
                    href={hashZu({ name: 'anlage', kuerzel: a.kuerzel })}
                  >
                    {`Anlage ${a.kuerzel} öffnen`}
                  </a>
                }
              >
                {teile ? <p>{inhalt(teile, a.id)}</p> : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
