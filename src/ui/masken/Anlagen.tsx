// Anlagen (Entscheid 0025, Plan 212 und 216): Hauptseite der Leiste unten mit Wahl Indoor oder Outdoor; je Anlage eine
// Karte mit den Ebenen und ihren Gefässen (belegte, reservierte und freie Töpfe), den Anzuchtboxen mit Inhalt und der
// Messstelle. Ein Tipp öffnet Gefäss oder Box, W die Messmaske; der Fuss öffnet das Regalbild der Anlage.
import { useMemo, type ReactNode } from 'react';
import {
  anlagenBelegung,
  type BoxBelegung,
  type GefaessBelegung,
  type SortenAnzahl,
  type TopfZahlen,
} from '../../domain/anlage/belegung.ts';
import { anlagenAus, type AnlageZeile, type Teile } from '../../domain/anlage/teile.ts';
import { Belegungszeile } from '../bausteine/Belegungszeile.tsx';
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

/** «3 belegt · 1 reserviert · 5 frei», Teile mit 0 entfallen; alles 0: «0 frei» */
function topfText(z: TopfZahlen): string {
  const teile = [
    z.belegt > 0 ? `${String(z.belegt)} belegt` : '',
    z.reserviert > 0 ? `${String(z.reserviert)} reserviert` : '',
    z.frei > 0 ? `${String(z.frei)} frei` : '',
  ].filter(Boolean);
  return teile.length > 0 ? teile.join(' · ') : '0 frei';
}

const sortenText = (s: readonly SortenAnzahl[]) =>
  s.length > 0 ? s.map((x) => `${x.sorte} ${String(x.anzahl)}`).join(' · ') : undefined;

function gefaessZeile(g: GefaessBelegung): string {
  if (g.ohneGefaess) return 'kein Gefäss';
  if (g.loecher === 0) return `${String(g.pflanzen)} ${g.pflanzen === 1 ? 'Pflanze' : 'Pflanzen'}`;
  return topfText(g);
}

function boxZeile(b: BoxBelegung): string {
  return `Anzucht ${b.typ} · ${b.belegt > 0 ? `${String(b.belegt)} von ${String(b.platzzahl)}` : 'leer'}`;
}

function AnlageKarte({ anlage, teile }: { anlage: AnlageZeile; teile: Teile }) {
  const b = useMemo(() => anlagenBelegung(teile, anlage.id), [teile, anlage.id]);
  const gruppe = (titel: string, summe: string | undefined, kinder: ReactNode) => (
    <section className="hv-anlagen-gruppe" key={titel}>
      <div className="hv-anlagen-gruppe-kopf">
        <h4>{titel}</h4>
        {summe ? <span className="hv-anlagen-gruppe-summe">{summe}</span> : null}
      </div>
      <ul aria-label={titel}>{kinder}</ul>
    </section>
  );
  return (
    <Card
      title={`${anlage.kuerzel} · ${anlage.name}`}
      {...(DATENART[anlage.datenart] ? { meta: DATENART[anlage.datenart] } : {})}
      footer={
        <a
          className="hv-btn hv-btn-secondary hv-btn-block"
          href={hashZu({ name: 'anlage', kuerzel: anlage.kuerzel })}
        >
          {`Anlage ${anlage.kuerzel} öffnen`}
        </a>
      }
    >
      <p className="hv-anlagen-summe">{`Töpfe: ${topfText(b)}`}</p>
      {b.ebenen.map((e) =>
        gruppe(
          e.titel,
          topfText(e),
          e.gefaesse.map((g) => {
            const zusatz = sortenText(g.sorten);
            return (
              <li key={g.code}>
                <Belegungszeile
                  kennung={g.kennung}
                  zeile={gefaessZeile(g)}
                  punkte={g.punkte}
                  href={hashZu({ name: 'gefaess', code: g.code })}
                  {...(zusatz ? { zusatz } : {})}
                  {...(g.badge ? { badge: g.badge } : {})}
                />
              </li>
            );
          }),
        ),
      )}
      {b.boxen.length > 0
        ? gruppe(
            'Anzuchtboxen',
            undefined,
            b.boxen.map((x) => {
              const zusatz = sortenText(x.sorten);
              return (
                <li key={x.code}>
                  <Belegungszeile
                    kennung={x.kennung}
                    zeile={boxZeile(x)}
                    href={hashZu({ name: 'gefaess', code: x.code })}
                    {...(zusatz ? { zusatz } : {})}
                  />
                </li>
              );
            }),
          )
        : null}
      {b.messstellen.length > 0
        ? gruppe(
            'Messstelle',
            undefined,
            b.messstellen.map((w) => (
              <li key={w.code}>
                <Belegungszeile
                  kennung={w.kennung}
                  zeile="Leitungswasser"
                  href={hashZu({ name: 'messen', code: w.code })}
                />
              </li>
            )),
          )
        : null}
    </Card>
  );
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
              <AnlageKarte anlage={a} teile={teile} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
