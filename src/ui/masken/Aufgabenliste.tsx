// Aufgaben in Heute (Plan 27, Plan 30): die fälligen Aufgaben aus faelligeAufgaben() als Ortskarten in Laufweg-
// Reihenfolge (heuteKarten()), darüber die Hervorhebung «Ausserhalb» ohne Umsortieren und der Hinweis «Daten
// unvollständig»; Aufgaben ohne Ort (pH-Kontrolle, Stromausfall an der Anlage) in der Liste «Aufgaben». Zeilen und
// Tasten kommen aus dem Baustein Aufgabenzeile (Plan 225), derselbe wie in der Maske Gefäss: Tasten nach
// aufgabenTasten(), Schreiben über schreiben() (11.4), Meldung mit «Rückgängig machen» (Plan 224), Sperre 400 ms nach
// einer Aktion (U13). Umsetzen bleibt in der eigenen Liste aus Plan 33, das Messgerät im Kopf der Übersicht.
import { einstellungenAus, fehlendeTeile, naechsteAufgabe, type Aufgabe } from '../../domain/aufgaben.ts';
import { ANDERSWO } from '../../domain/aufgaben-folge.ts';
import { heuteZeilen } from '../../domain/pflanzung/keimbox.ts';
import { ausserhalbOrte, heuteKarten } from '../../domain/rundgang/heute.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Aufgabenzeile, KeimBoxZeile, useAufgabenAktionen } from '../Aufgabenzeilen.tsx';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { StatusBadge } from '../bausteine/StatusBadge.tsx';
import { useBuendel } from '../buendel.tsx';
import { startzeitMerken } from '../startzeit.ts';
import '../rundgang.css';

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

/** Aufgaben ohne Absturz der Maske: ein Fehler der Rechnung zeigt Heute ohne Liste und meldet ihn in der Konsole */
export function aufgabenSicher<T>(rechnen: () => T, sonst: T): T {
  try {
    return rechnen();
  } catch (fehler) {
    console.error('Aufgaben-Rechnung', fehler);
    return sonst;
  }
}

function wochentag(tag: string): string {
  const [j, m, d] = tag.split('-').map(Number) as [number, number, number];
  return WOCHENTAG[new Date(Date.UTC(j, m - 1, d)).getUTCDay()] ?? '';
}

export function Aufgabenliste({ jetzt, faellig }: { jetzt: Date; faellig: readonly Aufgabe[] }) {
  const { buendel } = useBuendel();
  const aktionen = useAufgabenAktionen(faellig, jetzt);
  const { weg, fehler } = aktionen;
  const teile = buendel?.teile;
  if (!teile) return null;
  const einstellungen = einstellungenAus(teile);
  // einmal je Render in Heute gerechnet (Prüfer Runde 1 Befund 10)
  const alle = faellig.filter((a) => !weg.has(a.schluessel));
  const liste = alle.filter((a) => !ANDERSWO.has(a.typ));
  const karten = heuteKarten(teile, liste);
  const ohneOrt = liste.filter((a) => !a.ort);
  // auch Aufgaben an der Anlage mit Gewicht ausserhalb (Stromausfall, Prüfer Runde 1 Befund 9)
  const ausserhalb = [
    ...ohneOrt.filter((a) => a.gewicht === 'ausserhalb').map((a) => a.titel),
    ...ausserhalbOrte(karten),
  ];
  const fehlt = fehlendeTeile(teile);
  startzeitMerken();

  if (alle.length === 0) {
    const n = aufgabenSicher(() => naechsteAufgabe(teile, einstellungen, jetzt, ZEITZONE), undefined);
    return (
      <p className="hv-aufgaben-leer">
        {n
          ? `Heute nichts zu tun · nächste: ${wochentag(n.anzeigeAb)}, ${n.titel}${n.ort ? ` ${n.ort.kennung}` : ''}`
          : 'Heute nichts zu tun'}
      </p>
    );
  }
  const zeile = (a: Aufgabe) => <Aufgabenzeile key={a.schluessel} a={a} wo="heute" aktionen={aktionen} />;

  return (
    <>
      {fehlt.length > 0 ? (
        <Notice
          kompakt
          tone="warn"
          title="Daten unvollständig"
          action={
            <Button variant="secondary" size="compact" onClick={() => window.location.reload()}>
              Neu laden
            </Button>
          }
        >
          Es fehlen Teile der Daten, Heute zeigt vielleicht zu wenige Aufgaben.
        </Notice>
      ) : null}
      {fehler ? <Notice tone="warn" title={fehler} /> : null}
      {ausserhalb.length > 0 ? (
        <Notice
          tone="danger"
          title={`Ausserhalb: ${ausserhalb.join(', ')}`}
          action={<StatusBadge tone="danger" />}
        />
      ) : null}
      {ohneOrt.length > 0 ? (
        <ul className="hv-aufgaben" aria-label="Aufgaben">
          {ohneOrt.map(zeile)}
        </ul>
      ) : null}
      {karten.map((k) => {
        const aufgaben = k.aufgaben.filter((a) => !weg.has(a.schluessel));
        if (aufgaben.length === 0) return null;
        return (
          <section key={k.platzId} className="hv-ortskarte" aria-label={k.code}>
            <h2 className="hv-ortskarte-kopf">
              {k.code}
              {k.ausserhalb ? <StatusBadge tone="danger" /> : null}
            </h2>
            <ul className="hv-aufgaben">
              {/* fällige «Keimung prüfen» einer Anzuchtbox als eine Zeile (Plan 227); die Rechnung bleibt je Satz */}
              {heuteZeilen(aufgaben).map((z) =>
                z.art === 'keimbox' ? (
                  <KeimBoxZeile key={z.box.schluessel} box={z.box} aktionen={aktionen} />
                ) : (
                  zeile(z.aufgabe)
                ),
              )}
            </ul>
          </section>
        );
      })}
    </>
  );
}
