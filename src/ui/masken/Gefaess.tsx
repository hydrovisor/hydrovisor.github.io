// Maske «Gefäss» (UC1, 05_masken.md 3.3; Plan 20): Kontext Regal. Ohne Scrollen sichtbar: Kopf, Zustand und
// Hauptknopf; darunter der Verlauf als Zahlenreihe mit Ereignismarkern (ohne Diagramm).
import { useState } from 'react';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { leerenVorgang } from '../../domain/anlage/aendern.ts';
import { gefaessAnsicht, type Gefaessansicht } from '../../domain/anlage/gefaess.ts';
import { ereignisseAm, ms, type Teile } from '../../domain/anlage/teile.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { kuerzlichBeendet } from '../../domain/phasen/ende.ts';
import { pflanzungVonSatz } from '../../domain/phasen/fragen.ts';
import { PROFILENDE, type Kulturform } from '../../domain/phasen/profil.ts';
import { deckelReihen, lochArt, lochName, lochText } from '../../domain/pflanzung/topf.ts';
import { Button } from '../bausteine/Button.tsx';
import { Deckel } from '../bausteine/Deckel.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { jetzt } from '../bundeldaten.ts';
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
  const [zeitpunkt] = useState(() => jetzt());
  const a = buendel ? gefaessAnsicht(buendel.teile, code, zeitpunkt, ZEITZONE) : undefined;
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
      {a.entfernt ? <Notice tone="warn" title={a.entfernt} kompakt /> : null}
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
              <li key={p.satzId} className={p.keimung ? 'hv-gefaess-pflanze' : undefined}>
                {buendel &&
                pflanzungVonSatz(buendel.teile, p.satzId) &&
                !phaseOffen(buendel.teile, p.satzId) ? (
                  // am Profilende führt die Satzzeile selbst zur Pflanzenansicht (Ernte, Kulturfrage; Plan 38 A10),
                  // ohne zusätzlichen Knopf, damit der Kopf ohne Scrollen bleibt (UC1-AK2)
                  <a
                    className="hv-gefaess-satzlink"
                    href={hashZu({
                      name: 'pflanze',
                      pflanzung: pflanzungVonSatz(buendel.teile, p.satzId) ?? '',
                    })}
                  >
                    {p.anzahl} × {p.sorte} · {p.phase} · seit {p.seitTagen}{' '}
                    {p.seitTagen === 1 ? 'Tag' : 'Tagen'}
                  </a>
                ) : (
                  <span>
                    {p.anzahl} × {p.sorte} · {p.phase} · seit {p.seitTagen}{' '}
                    {p.seitTagen === 1 ? 'Tag' : 'Tagen'}
                  </span>
                )}
                {p.keimung ? (
                  <a
                    className="hv-btn hv-btn-secondary hv-btn-compact"
                    href={hashZu({ name: 'keimung', satz: p.satzId })}
                  >
                    Keimung prüfen
                  </a>
                ) : null}
                {/* nur solange ein Phasenwechsel möglich ist (A, Plan 35): am Profilende kein Knopf, Kopf bleibt ohne Scrollen */}
                {buendel &&
                pflanzungVonSatz(buendel.teile, p.satzId) &&
                phaseOffen(buendel.teile, p.satzId) ? (
                  <a
                    className="hv-btn hv-btn-secondary hv-btn-compact"
                    href={hashZu({
                      name: 'pflanze',
                      pflanzung: pflanzungVonSatz(buendel.teile, p.satzId) ?? '',
                    })}
                  >
                    Phase
                  </a>
                ) : null}
                {p.umsetzen ? (
                  <a
                    className="hv-btn hv-btn-secondary hv-btn-compact"
                    href={hashZu({ name: 'umsetzen', satz: p.satzId })}
                  >
                    Umsetzen
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : a.rolle === 'gefaess' || a.rolle === 'anzuchtort' ? (
          <p className="hv-gefaess-zeile">Keine Pflanzen</p>
        ) : null}
        {a.zielbereichPflanzen ? <p className="hv-gefaess-zeile hv-num">{a.zielbereichPflanzen}</p> : null}
      </section>
      {a.hauptknopf && !a.entfernt ? (
        <a
          className="hv-btn hv-btn-primary hv-gefaess-haupt"
          href={hashZu({ name: 'messen', code: a.hauptknopf.code })}
        >
          {a.hauptknopf.text}
        </a>
      ) : null}
      {a.nebenknoepfe.length > 0 && buendel ? <Nebenknoepfe a={a} teile={buendel.teile} /> : null}
      {/* Deckelgrafik darf scrollen; Kopf, Zustand und Hauptknopf bleiben oben (UC1-AK2) */}
      {a.deckel.length > 0 && buendel ? <DeckelAnsicht a={a} teile={buendel.teile} /> : null}
      {buendel ? <KuerzlichBeendet code={a.code} teile={buendel.teile} jetzt={zeitpunkt} /> : null}
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

/** Nebenknöpfe (Plan 21): Prüfen und Ändern führen in ihre Masken, Leeren und Wiederherstellen schreiben sofort */
function Nebenknoepfe({ a, teile }: { a: Gefaessansicht; teile: Teile }) {
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string>();
  // je Handlung derselbe Vorgang bis zum Erfolg: eine Wiederholung sendet dieselbe Client-UUID (Prüfer Runde 1, Befund 3)
  const [vorgaenge, setVorgaenge] = useState<Record<string, Vorgang>>({});
  const platzId = ortAufloesen(a.code, (teile ?? {}) as Record<string, readonly unknown[]>)?.platzId;
  async function senden(art: string, bauen: () => Vorgang) {
    const vorgang = vorgaenge[art] ?? bauen();
    setVorgaenge((v) => ({ ...v, [art]: vorgang }));
    setSendet(true);
    const antwort = await schreiben(vorgang, { jetzt: jetzt(), zeitzone: ZEITZONE });
    setSendet(false);
    setFehler(antwort.status === 'nicht_gespeichert' ? antwort.fehler.text : undefined);
    if (antwort.status === 'gespeichert')
      setVorgaenge((v) => Object.fromEntries(Object.entries(v).filter(([k]) => k !== art)));
  }
  return (
    <nav className="hv-gefaess-neben" aria-label="Weitere Handlungen">
      {a.nebenknoepfe.map((k) =>
        k.art === 'pruefen' ? (
          <a key={k.art} className="hv-btn hv-btn-secondary" href={hashZu({ name: 'pruefen', code: a.code })}>
            {k.text}
          </a>
        ) : k.art === 'wechseln' ? (
          <a key={k.art} className="hv-btn hv-btn-secondary" href={hashZu({ name: 'ansatz', code: a.code })}>
            {k.text}
          </a>
        ) : k.art === 'aendern' ? (
          <a
            key={k.art}
            className="hv-btn hv-btn-secondary"
            href={hashZu({ name: 'gefaess-aendern', code: a.code })}
          >
            {k.text}
          </a>
        ) : k.art === 'saeen' ? (
          <a
            key={k.art}
            className="hv-btn hv-btn-secondary"
            href={hashZu(
              a.rolle === 'anzuchtort'
                ? { name: 'saeen', box: a.code, von: 'gefaess' }
                : { name: 'saeen', ziel: a.code, von: 'gefaess' },
            )}
          >
            {k.text}
          </a>
        ) : k.art === 'leeren' ? (
          <Button
            key={k.art}
            variant="secondary"
            disabled={sendet || !platzId}
            onClick={() =>
              platzId && void senden('leeren', () => leerenVorgang(platzId, neueClientId(), jetzt()))
            }
          >
            {k.text}
          </Button>
        ) : (
          <Button
            key={k.art}
            variant="secondary"
            disabled={sendet || !platzId}
            onClick={() => {
              // Wiederherstellen = Storno des Ereignisses entfernt (Plan 21 A10)
              const e = platzId
                ? ereignisseAm(teile, platzId, 'entfernt').sort((x, y) => ms(y.gilt_ab) - ms(x.gilt_ab))[0]
                : undefined;
              const clientId = (e as { client_id?: string | null } | undefined)?.client_id ?? e?.id;
              if (clientId)
                void senden('wiederherstellen', () => [
                  { art: 'storno', tabelle: 'ereignis', clientId, grund: 'rueckgaengig' },
                ]);
            }}
          >
            {k.text}
          </Button>
        ),
      )}
      {fehler ? <Notice tone="danger" title={fehler} kompakt /> : null}
    </nav>
  );
}

/** Beendete Pflanzungen der letzten 7 Tage mit Link zur Pflanzenansicht (Plan 38 A10, Wiederherstellen) */
function KuerzlichBeendet({ code, teile, jetzt: zeit }: { code: string; teile: Teile; jetzt: Date }) {
  const platzId = ortAufloesen(code, teile as Record<string, readonly unknown[]>)?.platzId;
  const liste = platzId ? kuerzlichBeendet(teile, platzId, zeit, ZEITZONE) : [];
  if (liste.length === 0) return null;
  return (
    <section className="hv-gefaess-beendet">
      <h2 className="hv-gefaess-h2">Kürzlich beendet</h2>
      <ul className="hv-aufgaben" aria-label="Kürzlich beendet">
        {liste.map((b) => (
          <li key={b.pflanzungId} className="hv-aufgabe hv-aufgabe-umbruch">
            <a
              className="hv-btn hv-btn-secondary hv-btn-compact"
              href={hashZu({ name: 'pflanze', pflanzung: b.pflanzungId })}
            >
              {b.text}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Phase der Sicht noch vor dem Profilende (R1.2): nur dann ein Knopf «Phase» (A, Plan 35) */
function phaseOffen(teile: Teile, satzId: string): boolean {
  const satz = (teile?.['satz'] ?? []).find((x) => (x as { id: string }).id === satzId) as
    { kulturform: string } | undefined;
  const zustand = (teile?.['v_pflanzung_zustand'] ?? []).find(
    (z) =>
      (z as { satz_id: string; status: string }).satz_id === satzId &&
      (z as { status: string }).status === 'aktiv',
  ) as { phase: string } | undefined;
  if (!satz || !zustand) return false;
  return zustand.phase !== (PROFILENDE[satz.kulturform as Kulturform] ?? 'wachstum');
}

/** Deckel des Gefässes mit Töpfen (Plan 33): Tipp auf einen Topf zeigt «Topf 2.3.1 · Eichblatt» und «Verschieben» */
function DeckelAnsicht({ a, teile }: { a: Gefaessansicht; teile: Teile }) {
  const [gewaehlt, setGewaehlt] = useState<number>();
  const platzId = ortAufloesen(a.code, teile as Record<string, readonly unknown[]>)?.platzId;
  if (!platzId) return null;
  const loch = a.deckel.find((l) => l.lochNr === gewaehlt);
  const verschiebbar = loch?.kennung !== undefined && !loch.ziel;
  return (
    <section className="hv-gefaess-deckel" aria-label="Deckel">
      <Deckel
        reihen={deckelReihen(teile, platzId)}
        loecher={a.deckel.map((l) => ({
          nr: l.lochNr,
          zustand: l.zustand,
          zustandName: lochName(l) || 'kein Topf',
          ...(lochText(l) !== undefined ? { text: lochText(l) as string } : {}),
          // gewählter Quelltopf umrandet (Runde 1 Befund 5)
          ...(l.lochNr === gewaehlt ? { art: 'markiert' as const } : lochArt(l) ? { art: lochArt(l) } : {}),
        }))}
        onLoch={(nr) => setGewaehlt(nr === gewaehlt ? undefined : nr)}
      />
      {loch && verschiebbar ? (
        <div className="hv-gefaess-topf">
          <span>{`Topf ${loch.kennung ?? ''}${loch.sorte ? ` · ${loch.sorte}` : ''}`}</span>
          <a
            className="hv-btn hv-btn-secondary hv-btn-compact"
            href={hashZu({ name: 'verschieben', topf: `${a.kuerzel}-${loch.kennung ?? ''}` })}
          >
            Verschieben
          </a>
        </div>
      ) : null}
    </section>
  );
}
