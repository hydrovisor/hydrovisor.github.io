// Detail einer Sorte (UC4; Konzept 11.3 «Tim sieht jeden ergänzten Wert mit Herkunft», R1.3, R12.3; Plan 37).
// Werte je anwendbarer Phase mit Herkunft und Verlässlichkeit, Saatempfehlungen, Packungen; «Recherche starten»,
// solange die Sorte unvollständig ist.
import { useState } from 'react';
import { rechercheStarten } from '../../daten/ki.ts';
import { wissenSchreiben } from '../../daten/wissen.ts';
import type { RechercheErgebnis } from '../../domain/ki/recherche.ts';
import { sortenDetail } from '../../domain/sorten/liste.ts';
import { APP_VERSION } from '../../konstanten.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../sorten.css';

export function Sorte({ sorte }: { sorte: string }) {
  const { buendel } = useBuendel();
  const [recherche, setRecherche] = useState<RechercheErgebnis | 'laeuft'>();
  const [meldung, setMeldung] = useState<string>();
  const d = buendel ? sortenDetail(buendel.teile, sorte) : undefined;

  async function bestaetigen(id: string) {
    setMeldung(undefined);
    const r = await wissenSchreiben([
      { aktion: 'saatempfehlung_bestaetigen', daten: { saatempfehlung_id: id, app_version: APP_VERSION } },
    ]);
    if (r.status === 'nicht_gespeichert') setMeldung(r.fehler.text);
  }

  return (
    <main className="hv-seite">
      <header className="hv-seite-kopf">
        <h1 className="hv-seite-titel">{d ? d.zeile.name : 'Sorte'}</h1>
        <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'sorten' })}>
          Zu den Sorten
        </a>
      </header>
      {!d ? (
        <p>{buendel ? 'Diese Sorte ist nicht bekannt.' : 'Sorte wird geladen.'}</p>
      ) : (
        <>
          <p className="hv-sorten-info">
            {d.zeile.artName}{' '}
            <StatusBadge tone={d.zeile.vollstaendig ? 'info' : 'neutral'}>
              {d.zeile.vollstaendig ? 'vollständig' : 'unvollständig'}
            </StatusBadge>{' '}
            {d.zeile.pruefauftraege} {d.zeile.pruefauftraege === 1 ? 'Prüfauftrag' : 'Prüfaufträge'}
          </p>
          {!d.zeile.vollstaendig ? (
            <Button
              variant="secondary"
              disabled={recherche === 'laeuft'}
              onClick={() => {
                setRecherche('laeuft');
                void rechercheStarten(sorte).then(setRecherche);
              }}
            >
              Recherche starten
            </Button>
          ) : null}
          {recherche === 'laeuft' ? (
            <Notice tone="info">Recherche läuft. Du kannst die Seite verlassen.</Notice>
          ) : recherche?.ergebnis === 'ok' ? (
            <Notice tone="info">
              {`Ergänzt: ${recherche.werte} Werte und ${recherche.saat} Saatempfehlungen. Offen: ${recherche.offen.length + recherche.offenSaat.length} Prüfaufträge.`}
            </Notice>
          ) : recherche ? (
            <Notice tone="warn">{recherche.hinweis}</Notice>
          ) : null}
          {meldung ? <Notice tone="danger">{meldung}</Notice> : null}
          {d.phasen.map((p) => (
            <Card key={p.phase} title={p.name}>
              <ul className="hv-sorte-werte">
                {p.werte.map((w) => (
                  <li key={w.groesse}>
                    <span className="hv-sorte-wert">
                      {w.groesse}: {w.wert}
                    </span>
                    <span className="hv-sorte-herkunft">
                      {w.herkunft} · {w.verlaesslichkeit}
                      {w.quelle ? (
                        <>
                          {' · '}
                          {w.quelle.link ? (
                            <a href={w.quelle.link} target="_blank" rel="noreferrer">
                              {w.quelle.titel}
                            </a>
                          ) : (
                            w.quelle.titel
                          )}
                        </>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Card title="Saatempfehlungen">
            {d.saat.length === 0 ? <p>Noch keine Saatempfehlung.</p> : null}
            <ul className="hv-sorte-werte">
              {d.saat.map((s) => (
                <li key={s.id}>
                  <span className="hv-sorte-wert">
                    {s.kulturform}: {s.samen} Samen je Schwamm, Klasse {s.klasse}
                  </span>
                  {s.bestaetigtAm ? (
                    <span className="hv-sorte-herkunft">bestätigt am {s.bestaetigtAm}</span>
                  ) : (
                    <Button variant="secondary" size="compact" onClick={() => void bestaetigen(s.id)}>
                      Saatempfehlung bestätigen
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Packungen">
            {d.packungen.length === 0 ? <p>Noch keine Packung.</p> : null}
            <ul className="hv-sorte-werte">
              {d.packungen.map((p) => (
                <li key={p.id}>
                  {p.kaufdatum ? `Gekauft ${p.kaufdatum}` : 'Kaufdatum offen'} · Bestand{' '}
                  {p.bestandKorn ?? '–'} Korn
                  {p.keimfaehigkeit !== null
                    ? ` · Keimfähigkeit ${Math.round(p.keimfaehigkeit * 100)} %`
                    : ''}
                </li>
              ))}
            </ul>
            <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'sorte-neu' })}>
              Packung erfassen
            </a>
          </Card>
        </>
      )}
    </main>
  );
}
