// Heute (Kontext Regal, docs/spec/05_masken.md 3.1): Kopf, Hinweise, Einrichtungs-Checkliste (Plan 18), Ortskarten aus
// der Aufgaben-Rechnung (Plan 27, Plan 30), unten im Daumenbereich «Rundgang starten (n Orte)» und «Stromausfall
// erfassen» (Plan 30).
import { useState } from 'react';
import { useAblaufOffen } from '../../ablauf/offen.ts';
import { standAnzeige } from '../../domain/datenpfad/buendel.ts';
import { kalibrierStand, kalibrierText } from '../../domain/kalibrierung/stand.ts';
import { messFaelligkeit, type Messfaelligkeit } from '../../domain/messung/faelligkeit.ts';
import { heuteGruppiert, nachAnlage } from '../../domain/anlage/gruppen.ts';
import { einstellungenAus, faelligeAufgaben } from '../../domain/aufgaben.ts';
import { rundgangAnlage, rundgangPlan } from '../../domain/rundgang/plan.ts';
import { Aufgabenliste, aufgabenSicher } from './Aufgabenliste.tsx';
import { Ablaeufe } from './Ablaeufe.tsx';
import { Phasenkarten } from './Phasenkarten.tsx';
import { Erntekarten } from './Erntekarten.tsx';
import { umsetzAufgaben } from '../../domain/anzucht/umsetzen.ts';
import { messbareOrte } from '../../domain/ort.ts';
import { tagKurz, ZEITZONE } from '../../domain/zeit.ts';
import { OrtKachel } from '../bausteine/Tile.tsx';
import { kalibrierdaten, messgeraet, messungenIm, zustandVon } from '../bundeldaten.ts';
import { Notice } from '../bausteine/Notice.tsx';
import { Einrichtung } from './Einrichtung.tsx';
import { useBuendel } from '../buendel.tsx';
import { Logo } from '../bausteine/Logo.tsx';
import { useNeueVersion } from '../dienst.tsx';
import { hinweisNeueVersionZeigen } from '../neueVersion.ts';
import { NeueVersionHinweis } from '../NeueVersion.tsx';
import { usePushStand } from '../pushZustand.ts';
import { hashZu } from '../router.ts';

/** Text der Messfälligkeit in der Ortskachel (Übergang bis zu den Karten in I1b) */
function faelligText(f: Messfaelligkeit, rolle: string): string {
  // die Messstelle W hat bis I1b-02 keine eigene Fälligkeit (Runde 1 Befund 9)
  if (rolle === 'messstelle') return 'Messstelle';
  if (f.art === 'keine')
    return f.grund === 'leer' ? 'leer · bereit' : f.grund === 'ruht' ? 'ruht' : 'kein Gefäss';
  if (!f.faellig) return `nächste Messung ${tagKurz(f.faelligAm)}`;
  if (f.tageUeberfaellig === 0) return 'Messen fällig';
  return `seit ${f.tageUeberfaellig} ${f.tageUeberfaellig === 1 ? 'Tag' : 'Tagen'} fällig`;
}

const DATUM = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Zurich',
});

export function Heute() {
  const [jetzt] = useState(() => Date.now());
  const ablaufOffen = useAblaufOffen();
  const { wartet } = useNeueVersion();
  const { buendel, frisch, keinZugang, liest, blockiert } = useBuendel();
  // «Stand: hh:mm» nur, solange in dieser Sitzung kein frisches Laden gelungen ist (Plan 11 D3, TO6)
  const anzeige = liest ? {} : standAnzeige({ buendel, frisch }, new Date(jetzt), ZEITZONE);
  const zeigen = hinweisNeueVersionZeigen({
    route: { name: 'heute' },
    neueVersionWartet: wartet,
    ablaufOffen,
  });
  const ablauf = ablaufOffen === undefined ? 'unbekannt' : ablaufOffen ? 'offen' : 'keiner';
  return (
    <main className="hv-seite" data-density="regal" data-ablauf={ablauf}>
      <header className="hv-seite-kopf hv-heute-kopf">
        <Logo height={32} />
        <nav className="hv-heute-nav" aria-label="Navigation">
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'anlage' })}>
            Anlage öffnen
          </a>
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'saeen' })}>
            Säen
          </a>
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'info' })}>
            Info öffnen
          </a>
          <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'einstellungen' })}>
            Einstellungen öffnen
          </a>
        </nav>
      </header>
      <h1 className="hv-seite-titel">Heute</h1>
      <p>{DATUM.format(jetzt)}</p>
      {buendel ? (
        <p className="hv-num" data-buendel-stand={buendel.stand} hidden={!anzeige.stand}>
          {anzeige.stand}
        </p>
      ) : null}
      {blockiert ? (
        <Notice tone="warn" title="App neu laden">
          Eine ältere Ansicht hält die lokale Datenbank offen. Schliesse sie und lade die App neu.
        </Notice>
      ) : null}
      {keinZugang ? <Notice tone="warn" title="Kein Zugang für dieses Konto" /> : null}
      {buendel && !keinZugang ? <Ablaeufe jetzt={new Date(jetzt)} /> : null}
      {!keinZugang && anzeige.hinweis ? <Notice title={anzeige.hinweis} /> : null}
      {buendel && !keinZugang ? <Einrichtung /> : null}
      {zeigen ? <NeueVersionHinweis /> : null}
      {buendel && !keinZugang ? <PushHinweis /> : null}
      {buendel && !keinZugang ? <Phasenkarten jetzt={new Date(jetzt)} /> : null}
      {buendel && !keinZugang ? <Aufgabenliste jetzt={new Date(jetzt)} /> : null}
      {buendel && !keinZugang ? <Umsetzaufgaben jetzt={new Date(jetzt)} /> : null}
      {buendel && !keinZugang ? <Erntekarten jetzt={new Date(jetzt)} /> : null}
      {buendel ? <Uebersicht jetzt={new Date(jetzt)} /> : null}
      {buendel && !keinZugang ? <RundgangFuss jetzt={new Date(jetzt)} /> : null}
    </main>
  );
}

/** Fuss im Daumenbereich (Plan 30): Rundgang der echten Anlage, ohne echte der ersten (A1), und Stromausfall */
function RundgangFuss({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const teile = buendel?.teile;
  const anlage = rundgangAnlage(teile);
  if (!teile || !anlage) return null;
  const n = aufgabenSicher(
    () =>
      rundgangPlan(
        teile,
        faelligeAufgaben(teile, einstellungenAus(teile), jetzt, ZEITZONE),
        anlage.id,
        jetzt,
        ZEITZONE,
      ).orteZahl,
    0,
  );
  return (
    <nav className="hv-heute-fuss" aria-label="Rundgang">
      {n > 0 ? (
        <a
          className="hv-btn hv-btn-primary hv-btn-block"
          href={hashZu({ name: 'rundgang', kuerzel: anlage.kuerzel })}
        >
          {`Rundgang starten (${String(n)} ${n === 1 ? 'Ort' : 'Orte'})`}
        </a>
      ) : null}
      <a className="hv-btn hv-btn-secondary hv-btn-block" href={hashZu({ name: 'stromausfall' })}>
        Stromausfall erfassen
      </a>
    </nav>
  );
}

/** Push-Stand (Plan 13, R5.5, UC0-AK5): Hinweis «Push nicht eingerichtet» oder «Letzte Erinnerung …» */
function PushHinweis() {
  const { stand } = usePushStand();
  if (!stand || stand.art === 'nicht_unterstuetzt') return null;
  const einrichten = (
    <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
      Push einrichten
    </a>
  );
  if (stand.art === 'nicht_eingerichtet')
    return <Notice tone="warn" title="Push nicht eingerichtet" action={einrichten} kompakt />;
  if (stand.warnung48h)
    return (
      <Notice
        tone="warn"
        title="Seit 48 Stunden keine Erinnerung zugestellt"
        action={
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'push' })}>
            Push prüfen
          </a>
        }
      >
        Akku-Optimierung für Chrome prüfen.
      </Notice>
    );
  return stand.letzteZustellung ? <p>Letzte Erinnerung: {stand.letzteZustellung} zugestellt</p> : null;
}

/** Übergangsliste bis I1b: Kalibrierstand des Messgeräts (nur echt, G5, RR14) und Orte mit Messfälligkeit */
function Uebersicht({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const teile = buendel?.teile;
  const orte = buendel ? messbareOrte(buendel.teile) : [];
  const messungen = messungenIm(buendel);
  // erste fällige Aufgabe je Ort aus der Aufgaben-Rechnung (Plan 27), sonst die Messfälligkeit
  const ersteAufgabe = new Map<string, string>();
  for (const a of teile
    ? aufgabenSicher(() => faelligeAufgaben(teile, einstellungenAus(teile), jetzt, ZEITZONE), [])
    : [])
    if (a.ort && !ersteAufgabe.has(a.ort.platzId)) ersteAufgabe.set(a.ort.platzId, a.titel);
  return (
    <>
      {geraet ? (
        <section className="hv-messen-kopf hv-heute-geraet" aria-label="Messgerät">
          <span className="hv-messen-titel">
            {kalibrierText(
              kalibrierStand(
                kalibrierdaten(buendel),
                { messgeraetId: geraet.id, datenart: 'echt' },
                jetzt,
                ZEITZONE,
              ),
            )}
          </span>
          <a className="hv-btn hv-btn-secondary" href={hashZu({ name: 'kalibrieren' })}>
            Kalibrieren
          </a>
        </section>
      ) : null}
      {orte.length === 0 ? (
        <p>Noch keine Orte erfasst</p>
      ) : (
        // ab zwei echten Anlagen je Anlage eine Gruppe, vorher eine Liste (UC1-AK5, Plan 20)
        (heuteGruppiert(teile) ? nachAnlage(teile, orte) : [{ anlage: undefined, orte }]).map((g) => (
          <section
            key={g.anlage?.id ?? 'alle'}
            className="hv-heute-gruppe"
            aria-label={g.anlage ? `Anlage ${g.anlage.kuerzel}` : 'Orte'}
          >
            {g.anlage ? (
              <h2 className="hv-heute-anlage">
                Anlage {g.anlage.kuerzel} · {g.anlage.name}
              </h2>
            ) : null}
            <div className="hv-orte" aria-label="Orte">
              {g.orte.map((o) => (
                <OrtKachel
                  key={o.platzId}
                  kennung={o.code}
                  zeilen={[
                    ersteAufgabe.get(o.platzId) ??
                      faelligText(
                        messFaelligkeit(
                          {
                            platzId: o.platzId,
                            intervallMessenD: o.intervallMessenD ?? null,
                            ...zustandVon(buendel, o.platzId),
                          },
                          messungen,
                          jetzt,
                          ZEITZONE,
                        ),
                        o.rolle,
                      ),
                  ]}
                  onClick={() => {
                    // Gefäss öffnet die Maske «Gefäss», W die Messmaske (UC1, Plan 20)
                    window.location.hash = hashZu(
                      o.rolle === 'messstelle'
                        ? { name: 'messen', code: o.code }
                        : { name: 'gefaess', code: o.code },
                    );
                  }}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

/** Aufgabe «Umsetzen» je fälligem Satz, Übergangsliste bis zur Aufgaben-Rechnung in I1b-02 (Plan 33 A5) */
function Umsetzaufgaben({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const aufgaben = umsetzAufgaben(buendel?.teile, jetzt, ZEITZONE);
  if (aufgaben.length === 0) return null;
  return (
    <ul className="hv-aufgaben" aria-label="Umsetzen">
      {aufgaben.map((a) => (
        <li key={a.satzId} className="hv-aufgabe hv-aufgabe-umbruch">
          <span className="hv-aufgabe-text">{a.text}</span>
          <a
            className="hv-btn hv-btn-secondary"
            href={hashZu(
              a.wieGeplant
                ? { name: 'umsetzen', satz: a.satzId, wie: 'geplant' }
                : { name: 'umsetzen', satz: a.satzId },
            )}
          >
            {a.wieGeplant ? 'Wie geplant umsetzen' : 'Umsetzen'}
          </a>
        </li>
      ))}
    </ul>
  );
}
