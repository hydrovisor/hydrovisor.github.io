// Anlagenübersicht als Regalbild (UC1, E-F4-1, 05_masken.md 4 «Anlage»; Plan 20): Kontext Schreibtisch, ohne
// Scrollen auf 360 × 640; Auswahl, sobald es mehr als eine Anlage gibt (A5). Ein Tipp öffnet Gefäss oder Messen.
import { useState } from 'react';
import { kuerzelAenderbar } from '../../domain/anlage/kuerzel.ts';
import { anlagenAus } from '../../domain/anlage/teile.ts';
import { regalbild } from '../../domain/anlage/uebersicht.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { OrtKachel } from '../bausteine/Tile.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

const DATENART = { echt: '', demo: 'Demo', test: 'Test' } as const;

export function Anlage({ kuerzel }: { kuerzel?: string }) {
  const { buendel, liest } = useBuendel();
  const [jetzt] = useState(() => new Date(Date.now()));
  const teile = buendel?.teile;
  const anlagen = anlagenAus(teile);
  const anlage = anlagen.find((a) => a.kuerzel === kuerzel) ?? anlagen[0];
  const zeilen = anlage ? regalbild(teile, anlage.id, jetzt, ZEITZONE) : [];
  return (
    <main className="hv-seite hv-anlage">
      <header className="hv-seite-kopf">
        <h1 className="hv-anlage-titel">{anlage ? `Anlage ${anlage.kuerzel}` : 'Anlage'}</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </header>
      {anlagen.length > 1 ? (
        <nav className="hv-anlage-wahl" aria-label="Anlagen">
          {anlagen.map((a) => (
            <a
              key={a.id}
              className={`hv-btn hv-btn-compact ${a.id === anlage?.id ? 'hv-btn-primary' : 'hv-btn-secondary'}`}
              aria-current={a.id === anlage?.id ? 'page' : undefined}
              href={hashZu({ name: 'anlage', kuerzel: a.kuerzel })}
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
        <ol className="hv-regal" aria-label={`Regalbild ${anlage.name}`}>
          {zeilen.map((z) => (
            <li key={z.titel} className="hv-regal-zeile">
              <span className="hv-regal-titel">{z.titel}</span>
              <ul className="hv-regal-orte" aria-label={z.titel}>
                {z.orte.map((o) => (
                  <li key={o.code}>
                    <OrtKachel
                      kennung={o.kennung}
                      zeilen={o.zeilen}
                      messstelle={o.rolle === 'messstelle'}
                      {...(o.badge ? { badge: <StatusBadge tone="neutral">{o.badge}</StatusBadge> } : {})}
                      onClick={() => {
                        window.location.hash = hashZu(
                          o.ziel === 'messen'
                            ? { name: 'messen', code: o.code }
                            : { name: 'gefaess', code: o.code },
                        );
                      }}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {anlage ? (
        <p className="hv-anlage-info">
          {anlage.name} · Kürzel {anlage.kuerzel}
          {kuerzelAenderbar(teile, anlage.id)
            ? ' (änderbar bis zum ersten Etikettendruck)'
            : ' (fest seit dem ersten Etikettendruck)'}
        </p>
      ) : null}
      <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'anlage-neu' })}>
        Anlage anlegen
      </a>
    </main>
  );
}
