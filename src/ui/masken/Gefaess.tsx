// Maske «Gefäss» (UC1, 05_masken.md 3.3; Plan 20): Kontext Regal. Ohne Scrollen sichtbar: Kopf, Zustand und
// Hauptknopf; darunter der Verlauf als Zahlenreihe mit Ereignismarkern (ohne Diagramm).
import { useState } from 'react';
import { gefaessAnsicht } from '../../domain/anlage/gefaess.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';

function Kopf({ titel, unter }: { titel: string; unter?: string }) {
  return (
    <header className="hv-gefaess-kopf">
      <div>
        <h1 className="hv-gefaess-kennung">{titel}</h1>
        {unter ? <p className="hv-gefaess-unter">{unter}</p> : null}
      </div>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );
}

export function Gefaess({ code }: { code: string }) {
  const { buendel, liest } = useBuendel();
  const [jetzt] = useState(() => new Date(Date.now()));
  const a = buendel ? gefaessAnsicht(buendel.teile, code, jetzt, ZEITZONE) : undefined;
  if (!a)
    return (
      <main className="hv-seite hv-gefaess" data-density="regal">
        <Kopf titel={code} />
        <p>{liest ? 'Daten werden geladen' : `Ort ${code} nicht bekannt`}</p>
      </main>
    );
  // Füllstand nur, wo er gemessen wird (Kratky, R4.10)
  const mitFuellstand = a.verlauf.some((v) => v.fuellstand !== '–');
  return (
    <main className="hv-seite hv-gefaess" data-density="regal">
      <Kopf titel={a.kennung} unter={`Anlage ${a.kuerzel} · ${a.merkmale}`} />
      <section className="hv-gefaess-zustand" aria-label="Zustand">
        {a.pruefstatus || a.loesung ? (
          <p className="hv-gefaess-zeile">
            {a.pruefstatus ? <StatusBadge tone="neutral">{a.pruefstatus}</StatusBadge> : null}
            {a.loesung ? <span>{a.loesung}</span> : null}
          </p>
        ) : null}
        {a.rolle === 'gefaess' ? (
          <dl className="hv-angaben hv-gefaess-angaben">
            <dt>Zielbereich</dt>
            <dd className="hv-num">
              {a.zielbereich
                ? `pH ${a.zielbereich.ph} · EC ${a.zielbereich.ec} · ${a.zielbereich.temp} °C`
                : 'noch kein Zielbereich'}
            </dd>
            <dt>Letzte Messung</dt>
            <dd>
              {a.letzteMessung ? (
                <>
                  <span className="hv-num">{a.letzteMessung.werte}</span>
                  <span className="hv-gefaess-badges">
                    {a.letzteMessung.ton ? <StatusBadge tone={a.letzteMessung.ton} /> : null}
                    {a.letzteMessung.unsicher ? <StatusBadge tone="uncertain" /> : null}
                  </span>
                  <span className="hv-gefaess-trend">
                    {a.letzteMessung.wann}
                    {a.letzteMessung.trend ? ` · ${a.letzteMessung.trend}` : ''}
                  </span>
                </>
              ) : (
                'noch keine Messung'
              )}
            </dd>
            <dt>Dosis</dt>
            <dd className="hv-num">
              {a.dosis.length > 0
                ? a.dosis.map((d) => `${d.komponente} ${d.mlProL}`).join(' · ') + ' ml/L'
                : 'noch keine Dosis'}
            </dd>
          </dl>
        ) : null}
        {a.pflanzen.length > 0 ? (
          <ul className="hv-gefaess-pflanzen" aria-label="Pflanzen">
            {a.pflanzen.map((p) => (
              <li key={p.satzId}>
                {p.anzahl} × {p.sorte} · {p.phase} · seit {p.seitTagen} {p.seitTagen === 1 ? 'Tag' : 'Tagen'}
              </li>
            ))}
          </ul>
        ) : a.rolle === 'gefaess' || a.rolle === 'anzuchtort' ? (
          <p className="hv-gefaess-zeile">Keine Pflanzen</p>
        ) : null}
      </section>
      {a.hauptknopf ? (
        <a
          className="hv-btn hv-btn-primary hv-gefaess-haupt"
          href={hashZu({ name: 'messen', code: a.hauptknopf.code })}
        >
          {a.hauptknopf.text}
        </a>
      ) : null}
      {a.verlauf.length > 0 ? (
        <section aria-labelledby="verlauf-titel" className="hv-gefaess-verlauf">
          <h2 id="verlauf-titel" className="hv-gefaess-h2">
            Verlauf
          </h2>
          <table className="hv-verlauf hv-num">
            <thead>
              <tr>
                <th scope="col">Tag</th>
                <th scope="col">pH</th>
                <th scope="col">EC</th>
                <th scope="col">°C</th>
                {mitFuellstand ? <th scope="col">Füllstand</th> : null}
              </tr>
            </thead>
            <tbody>
              {a.verlauf.map((v, i) => (
                <tr key={i}>
                  <th scope="row">
                    {v.tag} {v.zeit}
                    {v.marker.length > 0 ? (
                      <span className="hv-verlauf-marker"> {v.marker.join(' · ')}</span>
                    ) : null}
                  </th>
                  <td>{v.ph}</td>
                  <td>{v.ec}</td>
                  <td>{v.temp}</td>
                  {mitFuellstand ? <td>{v.fuellstand}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </main>
  );
}
