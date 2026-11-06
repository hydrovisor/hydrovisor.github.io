// Maske «Ansatz» #/ansatz/:code (05_masken.md 3.5; UC7, R4.6, U4, U7, U13, Konzept 11.4; Plan 29): Kopf, Rechnung,
// Abhakliste der Zeilen 0 bis 17, Rückfrage nach einer Pause, Abschluss. Regal-Dichte, nur Antippen. Jeder Tipp
// schreibt zuerst den Ablaufstand in IndexedDB, dann den Vorgang über schreiben(); was nicht gesendet ist, bleibt in
// `ausstehend` und geht beim nächsten Tipp mit derselben client_id erneut hinaus (TO2).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ablaufLesen, ablaufLoeschen, ablaufSchreiben, type AblaufEintrag } from '../../ablauf/speicher.ts';
import { timerSignal, useWachhalten } from '../../ablauf/wachhalten.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { laufendeAnsaetze } from '../../domain/abhakliste/folgen.ts';
import { rechnen, rechnungEingaben } from '../../domain/abhakliste/rechnung.ts';
import {
  abhakbar,
  abhaken,
  abwaehlbar,
  abwaehlen,
  aktiveZeile,
  aufzugAbhaken,
  defsUebernehmen,
  mengeAendern,
  rueckfrage,
  rueckfrageBeantworten,
  standAusSchritten,
  standNeu,
  timerEnde,
  wachBis,
  type AblaufStand,
} from '../../domain/abhakliste/stand.ts';
import {
  abbruchVorgang,
  abschlussVorgang,
  abwahlVorgang,
  kopfVorgang,
  schrittVorgang,
} from '../../domain/abhakliste/vorgaenge.ts';
import { zeilenAus, ZUGABEN } from '../../domain/abhakliste/zeilen.ts';
import type { AnsatzZeile } from '../../domain/bewertung/verlauf.ts';
import type { Schritt } from '../../domain/datenpfad/erfassung.ts';
import { kalibrierStand } from '../../domain/kalibrierung/stand.ts';
import { ortAufloesen, type Ort } from '../../domain/ort.ts';
import { phZielErsteinstellung } from '../../domain/rechner-ph.ts';
import { ecSollIst, restdosis } from '../../domain/rechner-korrektur.ts';
import { bruch, ecText, mlText } from '../../domain/rechner-zahlen.ts';
import type { Teile } from '../../domain/teile.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Checklist, type Zeile as ChecklistZeile } from '../bausteine/Checklist.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { kalibrierdaten, messgeraet } from '../bundeldaten.ts';
import { hashZu, oeffnen } from '../router.ts';
import '../ansatz.css';

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');
/** Uhr der Oberfläche (Date.now nur in der Oberfläche, CLAUDE.md) */
const uhrJetzt = () => new Date(Date.now());
/** Sperre nach dem Öffnen der Bestätigung «Wechsel abbrechen» (U13) */
const SPERRE_MS = 400;

export const ablaufIdAbhakliste = (platzId: string) => `abhakliste:${platzId}`;

export function Ansatz({ code }: { code: string }) {
  const { buendel, liest } = useBuendel();
  const ort = buendel ? ortAufloesen(code, buendel.teile) : undefined;
  if (!ort || ort.rolle !== 'gefaess') {
    return (
      <main className="hv-seite hv-ansatz" data-density="regal">
        <header className="hv-messen-kopf">
          <h1 className="hv-messen-titel">Lösung wechseln</h1>
        </header>
        <p>{liest || !buendel ? 'Daten werden geladen' : `Gefäss ${code} nicht bekannt`}</p>
      </main>
    );
  }
  return <Abhakliste key={ort.platzId} ort={ort} teile={buendel?.teile ?? {}} />;
}

/** laufender Neuansatz dieses Platzes mit Schritten aus dem Bündel (Gerätewechsel) */
function ausBuendel(teile: Teile, platzId: string) {
  const ansaetze = teil(teile, 'naehrloesungsansatz') as unknown as (AnsatzZeile & Zeile)[];
  const schritte = teil(teile, 'ansatz_schritt') as unknown as Parameters<typeof laufendeAnsaetze>[1];
  const laufend = laufendeAnsaetze(ansaetze, schritte).find((a) => a.platzId === platzId);
  if (!laufend) return undefined;
  const kopf = ansaetze.find((a) => a.id === laufend.ansatzId);
  return { laufend, kopf };
}

function Abhakliste({ ort, teile }: { ort: Ort; teile: Teile }) {
  const { buendel } = useBuendel();
  const geraet = messgeraet(buendel);
  const [jetztMs, setJetztMs] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(jetztMs), [jetztMs]);
  const [stand, setStand] = useState<AblaufStand>();
  const [geladen, setGeladen] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const [abbrechenFrage, setAbbrechenFrage] = useState<number>();
  const [mengeOffen, setMengeOffen] = useState(false);
  const [abgeschlossen, setAbgeschlossen] = useState<{ text: string[] }>();
  const sendet = useRef(false);
  const aktivRef = useRef<HTMLDivElement>(null);
  const signalFuer = useRef<number | undefined>(undefined);

  // Uhr: jede Sekunde neu, für Timer und Rückfrage
  useEffect(() => {
    const id = window.setInterval(() => setJetztMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Rechnung aus dem Bündel; ECWasser aus der Frischwassermessung (Zeile 3)
  const minute = Math.floor(jetztMs / 60_000);
  const frischEc = stand?.frischwasser?.ec;
  const eingaben = useMemo(
    () =>
      rechnungEingaben(teile, ort.platzId, new Date(minute * 60_000), ZEITZONE, {
        ...(frischEc !== undefined ? { frischwasserEc: frischEc } : {}),
      }),
    [teile, ort.platzId, frischEc, minute],
  );
  const rechnung = stand?.rechnung ?? rechnen(eingaben);
  const daten = kalibrierdaten(buendel);
  const kalibrierung = geraet
    ? kalibrierStand(daten, { messgeraetId: geraet.id, datenart: ort.datenart }, jetzt, ZEITZONE)
    : ({ art: 'erstkalibrierung' } as const);
  const phZiel = phZielErsteinstellung({
    art: eingaben.phArt,
    ...(eingaben.phBand ? { phBand: eingaben.phBand } : {}),
  });
  const volumen = stand?.volumen ?? eingaben.volumen;

  // Restdosis nach der Kontrollmessung (R4.7)
  const rest = useMemo(() => {
    const ec = stand?.messungen.kontrolle?.ec;
    if (!rechnung || ec === undefined || !stand) return undefined;
    const ist = Object.fromEntries(
      ZUGABEN.map((z) => [z.komponente, stand.zeilen.find((x) => x.nr === z.nr)?.istMl ?? 0]),
    ) as Record<(typeof ZUGABEN)[number]['komponente'], number>;
    return restdosis({
      ecZiel: bruch(rechnung.ecZiel),
      ecIst: ec,
      ecWasser: eingaben.eingabe.ecWasser,
      ist,
      volumen,
      k: eingaben.eingabe.k,
      dosis: rechnung.dosisVerwendet,
    });
  }, [stand, rechnung, eingaben, volumen]);

  const defs = useMemo(
    () =>
      zeilenAus(
        {
          rechnung,
          ersterAnsatz: false,
          volumen,
          kalibrierung,
          festeTermine: daten.festeTermine,
          phZiel,
          ...(rest ? { restdosis: rest } : {}),
          gerechnetFuer: eingaben.gerechnetFuer,
        },
        jetzt,
        ZEITZONE,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- die Zeilen hängen nicht an der Sekunde
    [rechnung, volumen, kalibrierung.art, daten.festeTermine, phZiel, rest, eingaben.gerechnetFuer],
  );

  // Laden: lokaler Stand, sonst laufender Ansatz aus dem Bündel, sonst neu
  useEffect(() => {
    let aktiv = true;
    void (async () => {
      let lokal: AblaufStand | undefined;
      try {
        lokal = await ablaufLesen<AblaufStand & AblaufEintrag>(ablaufIdAbhakliste(ort.platzId));
      } catch {
        lokal = undefined;
      }
      if (!aktiv) return;
      if (lokal) setStand(lokal);
      else {
        const b = ausBuendel(teile, ort.platzId);
        const t = uhrJetzt();
        setStand(
          b
            ? standAusSchritten(
                {
                  platzId: ort.platzId,
                  code: ort.code,
                  ansatzId: b.laufend.ansatzId,
                  defs,
                  schritte: b.laufend.schritte,
                  begonnenAm: text(b.kopf?.['begonnen_am']),
                  volumen: Math.round(Number(b.kopf?.['volumen_l'] ?? 0) * 100),
                },
                t,
              )
            : standNeu({ platzId: ort.platzId, code: ort.code, ansatzId: neueClientId(), defs }, t),
        );
      }
      setGeladen(true);
    })();
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Öffnen
  }, [ort.platzId]);

  // Restdosis und Rechnung in offene Zeilen übernehmen
  const aktuell = stand ? defsUebernehmen(stand, defs) : undefined;

  const aktiv = aktuell ? aktiveZeile(aktuell) : undefined;
  const ende = aktuell && aktiv !== undefined ? timerEnde(aktuell, aktiv) : undefined;
  useWachhalten(geladen && !abgeschlossen, ende ? wachBis(ende) : undefined);
  useEffect(() => {
    if (ende && jetztMs >= ende.getTime() && signalFuer.current !== ende.getTime()) {
      signalFuer.current = ende.getTime();
      if (jetztMs - ende.getTime() < 5_000) timerSignal();
    }
  }, [ende, jetztMs]);

  // die aktive Zeile im Blick halten (A14)
  useEffect(() => {
    aktivRef.current?.querySelector('li[data-zustand="aktiv"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [aktiv]);

  const frage = aktuell ? rueckfrage(aktuell, defs, jetzt, ZEITZONE) : undefined;

  async function weiter(neu: AblaufStand, vorgang: Schritt[]): Promise<void> {
    const alle = [...neu.ausstehend, ...vorgang];
    const mit = { ...neu, ausstehend: alle };
    setStand(mit);
    try {
      await ablaufSchreiben(mit as AblaufStand & AblaufEintrag);
    } catch {
      setFehler('Lokal nicht gespeichert: Speicher des Browsers voll oder gesperrt');
    }
    if (alle.length === 0 || sendet.current) return;
    sendet.current = true;
    const antwort = await schreiben(alle, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    sendet.current = false;
    if (antwort.status === 'gespeichert' || antwort.status === 'abweichend') {
      const fertig = { ...mit, ausstehend: [] };
      setFehler(undefined);
      const abschluss = fertig.zeilen.find((z) => z.nr === 17)?.schrittClientId !== undefined;
      if (abschluss) {
        await ablaufLoeschen(fertig.id).catch(() => undefined);
        setStand(fertig);
        return;
      }
      setStand((s) => (s && s.id === fertig.id ? { ...s, ausstehend: [] } : s));
      await ablaufSchreiben({ ...fertig } as AblaufStand & AblaufEintrag).catch(() => undefined);
    } else setFehler(`${antwort.fehler.text}. Der Haken ist lokal gespeichert, erneut senden.`);
  }

  /** Vorgänge für neu erledigte Zeilen nach dem Kopf; der Kopf selbst beim Haken von Zeile 4 */
  function nachziehen(s: AblaufStand): { stand: AblaufStand; vorgang: Schritt[] } {
    let st = s;
    const vorgang: Schritt[] = [];
    const vier = st.zeilen.find((z) => z.nr === 4);
    if (!st.kopfGeschrieben && vier?.erledigtAm && rechnung) {
      const k = kopfVorgang(
        st,
        {
          volumen,
          stadiumVorschlag: eingaben.stadiumVorschlag ?? rechnung.stadium,
          stadiumGewaehlt: rechnung.stadium,
          pflanzungIds: eingaben.pflanzungIds,
          schnappschuss: {
            ...(eingaben.phBand
              ? {
                  zielbereich: {
                    ph_min: eingaben.phBand.min / 100,
                    ph_max: eingaben.phBand.max / 100,
                    ...(eingaben.eingabe.zielbereich
                      ? {
                          ec_min: eingaben.eingabe.zielbereich.min / 100,
                          ec_max: eingaben.eingabe.zielbereich.max / 100,
                        }
                      : {}),
                  },
                }
              : {}),
            betriebsart: eingaben.phArt,
            k: eingaben.kSchnappschuss,
          },
          ecWasser: eingaben.eingabe.ecWasser,
          rechnung,
          ...(geraet ? { messgeraetId: geraet.id } : {}),
        },
        neueClientId,
      );
      st = { ...k.stand, rechnung };
      vorgang.push(...k.vorgang);
    }
    if (!st.kopfGeschrieben) return { stand: st, vorgang };
    for (const z of [...st.zeilen].sort((a, b) => a.nr - b.nr)) {
      if (z.nr <= 4 || !z.erledigtAm || z.schrittClientId) continue;
      if (z.nr === 17) {
        const a = abschlussVorgang(st, abschlussWerte(st), neueClientId);
        st = a.stand;
        vorgang.push(...a.vorgang);
      } else {
        const r = schrittVorgang(st, z.nr, neueClientId);
        st = r.stand;
        vorgang.push(...r.vorgang);
      }
    }
    return { stand: st, vorgang };
  }

  /** ECSoll_ist der gesamten Ist-Dosis einschliesslich Restdosis (R4.7) */
  function abschlussWerte(s: AblaufStand): { ecErwartetFinal?: number; echt: boolean } {
    const ist = Object.fromEntries(
      ZUGABEN.map((z) => {
        const haupt = s.zeilen.find((x) => x.nr === z.nr)?.istMl ?? 0;
        const restMl =
          s.zeilen.find((x) => x.nr === 15)?.teilschritte?.find((t) => t.komponente === z.komponente)
            ?.sollMl ?? 0;
        return [z.komponente, haupt + restMl];
      }),
    ) as Record<(typeof ZUGABEN)[number]['komponente'], number>;
    if (volumen <= 0) return { echt: eingaben.datenart === 'echt' };
    const e = ecSollIst({ ist, volumen, k: eingaben.eingabe.k, ecWasser: eingaben.eingabe.ecWasser });
    return { ecErwartetFinal: e.gerundet, echt: eingaben.datenart === 'echt' };
  }

  function tippen(nr: number) {
    if (!aktuell) return;
    const t = uhrJetzt();
    const z = aktuell.zeilen.find((x) => x.nr === nr);
    if (z?.erledigtAm !== undefined) {
      if (!abwaehlbar(aktuell, nr)) return;
      const storno = abwahlVorgang(aktuell, nr);
      let neu = abwaehlen(aktuell, nr, t);
      if (nr === 4) {
        // Korrektur = Storno plus neue Zeile: das nächste Abhaken schreibt Kopf und Schritte mit neuen IDs (A4)
        neu = {
          ...neu,
          ansatzId: neueClientId(),
          kopfGeschrieben: false,
          zeilen: neu.zeilen.map((x) => {
            const ohne = { ...x };
            delete ohne.schrittClientId;
            return ohne;
          }),
          ...(neu.frischwasser ? { frischwasser: { ...neu.frischwasser, id: neueClientId() } } : {}),
        };
        delete neu.rechnung;
      }
      void weiter(neu, [...storno]);
      return;
    }
    // vor dem nächsten Tipp: Rückfrage nach einer Pause (R4.6)
    if (rueckfrage(aktuell, defs, t, ZEITZONE)) {
      setJetztMs(t.getTime());
      return;
    }
    if (!abhakbar(aktuell, nr, t)) return;
    const neu = (z?.aufzuege ?? 1) > 1 ? aufzugAbhaken(aktuell, nr, t) : abhaken(aktuell, nr, t);
    setMengeOffen(false);
    const n = nachziehen(neu);
    void weiter(n.stand, n.vorgang);
    if (nr === 17 && n.stand.zeilen.find((x) => x.nr === 17)?.erledigtAm) abschlussZeigen(n.stand);
  }

  function abschlussZeigen(s: AblaufStand) {
    const end = s.messungen.end?.ec;
    const w = abschlussWerte(s);
    const zeilen: string[] = [];
    if (end !== undefined) zeilen.push(`Endmessung EC ${ecText(end)}`);
    if (end !== undefined && w.ecErwartetFinal !== undefined && end > w.ecErwartetFinal + 30)
      zeilen.push('Mehr EC als erwartet: Dosis, Volumen oder Kanne prüfen');
    zeilen.push('Kontrollmessung morgen');
    setAbgeschlossen({ text: zeilen });
  }

  function antworten(antwort: 'ja' | 'nein') {
    if (!aktuell) return;
    const neu = rueckfrageBeantworten(aktuell, antwort, uhrJetzt());
    const n = nachziehen(neu);
    void weiter(n.stand, n.vorgang);
  }

  function abbrechen() {
    if (!aktuell) return;
    const v = abbruchVorgang(aktuell, neueClientId, uhrJetzt());
    void (async () => {
      if (v.length > 0) {
        const antwort = await schreiben([...aktuell.ausstehend, ...v], {
          jetzt: uhrJetzt(),
          zeitzone: ZEITZONE,
        });
        if (antwort.status === 'nicht_gespeichert') {
          setFehler(`${antwort.fehler.text}. Abbruch nicht gespeichert.`);
          return;
        }
      }
      await ablaufLoeschen(aktuell.id).catch(() => undefined);
      oeffnen({ name: 'heute' });
    })();
  }

  function mengeSetzen(ist: number) {
    if (!aktuell || aktiv === undefined) return;
    void weiter(mengeAendern(aktuell, aktiv, ist, uhrJetzt()), []);
  }

  const kopf = (
    <header className="hv-messen-kopf">
      <h1 className="hv-messen-titel">{ort.kennung}</h1>
      <span className="hv-messen-kultur">
        <span>Lösung wechseln</span>
        {eingaben.gerechnetFuer ? <span>{eingaben.gerechnetFuer}</span> : null}
      </span>
      <a className="hv-btn hv-btn-ghost hv-btn-compact" href={hashZu({ name: 'heute' })}>
        Zu Heute
      </a>
    </header>
  );

  if (abgeschlossen) {
    return (
      <main className="hv-seite hv-ansatz" data-density="regal">
        {kopf}
        <Card title="Wechsel abgeschlossen">
          {abgeschlossen.text.map((z) => (
            <p key={z}>{z}</p>
          ))}
        </Card>
        <a className="hv-btn hv-btn-primary hv-btn-block" href={hashZu({ name: 'heute' })}>
          Zu Heute
        </a>
      </main>
    );
  }

  if (!aktuell) {
    return (
      <main className="hv-seite hv-ansatz" data-density="regal">
        {kopf}
        <p>Daten werden geladen</p>
      </main>
    );
  }

  const zeilen: ChecklistZeile[] = defs.map((d) => {
    const z = aktuell.zeilen.find((x) => x.nr === d.nr);
    const zustand: ChecklistZeile['zustand'] =
      z?.erledigtAm !== undefined ? 'erledigt' : d.nr === aktiv ? 'aktiv' : 'offen';
    const istAktiv = zustand === 'aktiv';
    const te = timerEnde(aktuell, d.nr);
    const messzeile = d.messfelder !== undefined;
    const aktion =
      istAktiv && messzeile ? (
        <a
          className="hv-btn hv-btn-secondary hv-btn-compact"
          href={hashZu({ name: 'messen', code: ort.code, zeile: d.nr as 3 | 14 | 17 })}
        >
          Messen
        </a>
      ) : istAktiv && d.nr === 4 ? (
        <a
          className="hv-btn hv-btn-secondary hv-btn-compact"
          href={hashZu({ name: 'gefaess', code: ort.code })}
        >
          Stimmt nicht
        </a>
      ) : istAktiv && (d.sollMl !== undefined || d.nr === 12) && d.nr !== 15 ? (
        <span className="hv-ansatz-aktionen">
          {(z?.aufzuege ?? 1) > 1 ? (
            <span className="hv-num">{`Aufzug ${String((z?.aufzuegeErledigt ?? 0) + 1)} von ${String(z?.aufzuege ?? 1)}`}</span>
          ) : null}
          <Button variant="secondary" size="compact" onClick={() => setMengeOffen((o) => !o)}>
            Menge ändern
          </Button>
        </span>
      ) : istAktiv && d.nr === 15 && (z?.aufzuege ?? 1) > 1 ? (
        <span className="hv-num">{`Teilschritt ${String((z?.aufzuegeErledigt ?? 0) + 1)} von ${String(z?.aufzuege ?? 1)}`}</span>
      ) : undefined;
    const menge =
      z?.istMl !== undefined && z.istMl !== d.sollMl
        ? `Ist ${mlText(z.istMl)}`
        : d.messmittel && d.nr !== 15
          ? undefined
          : undefined;
    return {
      nr: d.nr,
      titel: d.titel,
      ...(menge ? { menge } : {}),
      ...(te && zustand !== 'erledigt' ? { timerEnde: te.getTime() } : {}),
      zustand,
      ...(aktion ? { aktion } : {}),
      ...(d.hinweis ? { hinweis: d.hinweis } : {}),
      ...(zustand === 'erledigt' ? { abwaehlbar: abwaehlbar(aktuell, d.nr) } : {}),
      ...(istAktiv && messzeile && !z?.messungId ? { gesperrt: true } : {}),
      ...(istAktiv && d.nr === 4 && !rechnung ? { gesperrt: true } : {}),
    };
  });
  const aktivZeile = aktuell.zeilen.find((x) => x.nr === aktiv);

  return (
    <main className="hv-seite hv-ansatz" data-density="regal">
      {kopf}
      {fehler ? (
        <Notice kompakt tone="danger">
          {fehler}
        </Notice>
      ) : null}
      {!rechnung && !aktuell.kopfGeschrieben ? (
        <Notice kompakt tone="warn">
          Kein Zielbereich: Ziel-EC in der Maske Gefäss prüfen
        </Notice>
      ) : rechnung && !aktuell.kopfGeschrieben ? (
        <p className="hv-ansatz-rechnung hv-num">
          {`Ziel-EC ${ecText(rechnung.ecZiel)} · Teil-Dosis ${String(rechnung.teilDosis)} %`}
        </p>
      ) : null}
      {frage ? (
        <Card title="Rückfrage">
          <p>{frage.text}</p>
          <div className="hv-ansatz-frage">
            <Button variant="secondary" onClick={() => antworten('nein')}>
              Nein, jetzt geben
            </Button>
            <Button variant="secondary" onClick={() => antworten('ja')}>
              Ja, war schon drin
            </Button>
          </div>
        </Card>
      ) : null}
      {mengeOffen && aktivZeile && aktiv !== undefined ? (
        <Stepper
          label="Ist-Menge"
          wert={aktivZeile.istMl ?? aktivZeile.sollMl ?? 0}
          min={0}
          max={5000}
          onWert={mengeSetzen}
          anzeige={(w) => mlText(w)}
        />
      ) : null}
      <div ref={aktivRef} className="hv-ansatz-liste">
        <Checklist zeilen={zeilen} jetzt={jetztMs} onHaken={tippen} label="Abhakliste Lösungswechsel" />
      </div>
      {abbrechenFrage !== undefined ? (
        <Card title="Wechsel abbrechen?">
          <div className="hv-ansatz-frage">
            <Button variant="secondary" onClick={() => setAbbrechenFrage(undefined)}>
              Weiter wechseln
            </Button>
            <Button variant="danger" disabled={jetztMs - abbrechenFrage < SPERRE_MS} onClick={abbrechen}>
              Wechsel abbrechen
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="ghost"
          onClick={() => {
            setAbbrechenFrage(Date.now());
            window.setTimeout(() => setJetztMs(Date.now()), SPERRE_MS + 10);
          }}
        >
          Wechsel abbrechen
        </Button>
      )}
    </main>
  );
}
