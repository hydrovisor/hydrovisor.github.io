// Maske «Ansatz» #/ansatz/:code (05_masken.md 3.5; UC7, R4.4 bis R4.8, U4, U7, U13, Konzept 11.4; Plan 29): Kopf,
// Rechnung, Abhakliste der Zeilen 0 bis 17, Rückfrage nach einer Pause, Abschluss. Regal-Dichte, nur Antippen.
// Jeder Tipp schreibt zuerst den Ablaufstand in IndexedDB, dann den Vorgang über schreiben(). Was nicht gesendet ist,
// bleibt in `ausstehend` und geht beim nächsten Tipp, beim Öffnen und beim Sichtbarwerden mit derselben client_id
// erneut hinaus (TO2, Prüferbefunde 1 und 2). Gesendet wird immer nur ein Paket zugleich; danach fällt genau dieses
// Paket aus `ausstehend`, später angehängte Vorgänge bleiben und gehen gleich hinterher.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ablaufLesen, ablaufLoeschen, ablaufSchreiben, type AblaufEintrag } from '../../ablauf/speicher.ts';
import { timerSignal, useWachhalten } from '../../ablauf/wachhalten.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import { laufendeAnsaetze } from '../../domain/abhakliste/folgen.ts';
import { erstAnsatzAm, rechnen, rechnungEingaben } from '../../domain/abhakliste/rechnung.ts';
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
  type AblaufMessung,
  type AblaufStand,
} from '../../domain/abhakliste/stand.ts';
import {
  abbruchVorgang,
  abschlussVorgang,
  abwahlVorgang,
  kopfVorgang,
  leitkulturGewaehltVorgang,
  schrittVorgang,
} from '../../domain/abhakliste/vorgaenge.ts';
import { zeile4Sperre, zeilenAus, ZUGABEN } from '../../domain/abhakliste/zeilen.ts';
import type { AnsatzZeile } from '../../domain/bewertung/verlauf.ts';
import type { Schritt } from '../../domain/datenpfad/erfassung.ts';
import { pruefschritt4Vorgang, volumenVorschlag } from '../../domain/etikett/pruefung.ts';
import { kalibrierStand } from '../../domain/kalibrierung/stand.ts';
import { ortAufloesen, type Ort } from '../../domain/ort.ts';
import { ecWasser, type Stadium } from '../../domain/rechner.ts';
import { phZielErsteinstellung } from '../../domain/rechner-ph.ts';
import { doppeltDosiert, ecSollIst, kVorschlag, restdosis } from '../../domain/rechner-korrektur.ts';
import { bruch, ecText, mlText, type Mengen } from '../../domain/rechner-zahlen.ts';
import type { Teile } from '../../domain/teile.ts';
import { ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { Card } from '../bausteine/Card.tsx';
import { Checklist, type Zeile as ChecklistZeile } from '../bausteine/Checklist.tsx';
import { Choice } from '../bausteine/Choice.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { Stepper } from '../bausteine/Stepper.tsx';
import { useBuendel } from '../buendel.tsx';
import { kalibrierdaten, messgeraet } from '../bundeldaten.ts';
import { hashZu, oeffnen } from '../router.ts';
import '../ansatz.css';

type Zeile = Record<string, unknown>;
const teil = (t: Teile, name: string) => (t[name] ?? []) as readonly Zeile[];
const text = (x: unknown) => (typeof x === 'string' ? x : '');
const hundertstel = (x: unknown) =>
  x === null || x === undefined || x === '' ? undefined : Math.round(Number(x) * 100);
/** Uhr der Oberfläche (Date.now nur in der Oberfläche, CLAUDE.md) */
const uhrJetzt = () => new Date(Date.now());
/** Sperre nach dem Öffnen der Bestätigung «Wechsel abbrechen» (U13) */
const SPERRE_MS = 400;

const STADIEN: readonly { wert: Stadium; titel: string }[] = [
  { wert: 'echte_blaetter', titel: '1. echte Blätter' },
  { wert: 'wachstum', titel: 'Wachstum' },
  { wert: 'vorbluete', titel: 'Vorblüte' },
  { wert: 'bluete_frucht', titel: 'Blüte und Frucht' },
];

/** client_id der Ereignisse eines Vorgangs (Prüfschritt 4) */
const ereignisIds = (v: readonly Schritt[]) =>
  v
    .filter((x) => x.art === 'neu' && x.tabelle === 'ereignis')
    .map((x) => (x.art === 'neu' ? x.felder.client_id : ''));

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

/** laufender Neuansatz dieses Platzes mit Schritten und Messungen aus dem Bündel (Gerätewechsel, A13) */
function ausBuendel(teile: Teile, platzId: string) {
  const ansaetze = teil(teile, 'naehrloesungsansatz') as unknown as (AnsatzZeile & Zeile)[];
  const schritte = teil(teile, 'ansatz_schritt') as unknown as Parameters<typeof laufendeAnsaetze>[1];
  const laufend = laufendeAnsaetze(ansaetze, schritte).find((a) => a.platzId === platzId);
  if (!laufend) return undefined;
  const kopf = ansaetze.find((a) => a.id === laufend.ansatzId);
  const messung = (art: string): AblaufMessung | undefined => {
    const m = teil(teile, 'messung')
      .filter((x) => x['ansatz_id'] === laufend.ansatzId && x['messart'] === art && !x['storniert_am'])
      .sort((a, b) => Date.parse(text(b['gilt_ab'])) - Date.parse(text(a['gilt_ab'])))[0];
    if (!m) return undefined;
    const ph = hundertstel(m['ph']);
    const ec = hundertstel(m['ec']);
    const temperatur = hundertstel(m['temperatur']);
    return {
      id: text(m['id']),
      giltAb: text(m['gilt_ab']),
      ...(ph !== undefined ? { ph } : {}),
      ...(ec !== undefined ? { ec } : {}),
      ...(temperatur !== undefined ? { temperatur } : {}),
    };
  };
  return {
    laufend,
    kopf,
    frischwasser: messung('frischwasser'),
    kontrolle: messung('kontrolle_ansatz'),
    end: messung('end_ansatz'),
  };
}

/** Ziffernblock für «Menge ändern» und die Ziel-EC (R4.6 «öffnet den Ziffernblock», Prüferbefund 8) */
function ZahlEingabe({
  titel,
  start,
  dezimalen,
  schritt,
  onFertig,
}: {
  titel: string;
  start: number;
  dezimalen: number;
  schritt: number;
  onFertig: (wert: number | undefined) => void;
}) {
  const [puffer, setPuffer] = useState(start.toFixed(dezimalen));
  function tippen(t: Taste) {
    if (t === 'weiter') {
      const w = Number(puffer);
      onFertig(puffer === '' || !Number.isFinite(w) ? undefined : w);
      return;
    }
    setPuffer((p) => {
      if (t === 'leeren') return '';
      if (t === 'zurueck') return p.slice(0, -1);
      if (t === 'minus' || t === 'plus') {
        const w = Math.max(0, (Number(p) || 0) + (t === 'plus' ? schritt : -schritt));
        return w.toFixed(dezimalen);
      }
      if (t === '.') return p.includes('.') || dezimalen === 0 ? p : `${p || '0'}.`;
      const [, nach = ''] = p.split('.');
      if (p.includes('.') && nach.length >= dezimalen) return p;
      return p.length >= 6 ? p : `${p}${t}`;
    });
  }
  return (
    <div className="hv-ansatz-zahl">
      <p className="hv-ansatz-zahl-titel">{titel}</p>
      <NumPad
        onTaste={tippen}
        echo={puffer || '–'}
        schritt={schritt}
        speichern={
          <div className="hv-ansatz-frage">
            <Button variant="secondary" onClick={() => onFertig(undefined)}>
              Abbrechen
            </Button>
            <Button onClick={() => tippen('weiter')}>Übernehmen</Button>
          </div>
        }
      />
    </div>
  );
}

function Abhakliste({ ort, teile: teileBuendel }: { ort: Ort; teile: Teile }) {
  const { buendel } = useBuendel();
  // Tims Wahl der Leitkultur wirkt sofort, auch ohne Netz (R2.3 Stufe 4; Plan 34 A9): bis das Bündel sie enthält,
  // steht sie als lokale Zeile im Teil ereignis_platz
  const [leitkulturWahl, setLeitkulturWahl] = useState<{ id: string; artId: string; giltAb: string }>();
  const teile = useMemo<Teile>(
    () =>
      leitkulturWahl
        ? {
            ...teileBuendel,
            ereignis_platz: [
              ...(teileBuendel['ereignis_platz'] ?? []),
              {
                id: leitkulturWahl.id,
                typ: 'leitkultur_gewaehlt',
                platz_id: ort.platzId,
                daten: { art_id: leitkulturWahl.artId },
                gilt_ab: leitkulturWahl.giltAb,
                storniert_am: null,
              },
            ],
          }
        : teileBuendel,
    [teileBuendel, leitkulturWahl, ort.platzId],
  );
  const geraet = messgeraet(buendel);
  const [jetztMs, setJetztMs] = useState(() => Date.now());
  const jetzt = useMemo(() => new Date(jetztMs), [jetztMs]);
  const [stand, setStandRoh] = useState<AblaufStand>();
  const standRef = useRef<AblaufStand | undefined>(undefined);
  const [geladen, setGeladen] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const [abbrechenFrage, setAbbrechenFrage] = useState<number>();
  const [eingabe, setEingabe] = useState<'menge' | 'ziel_ec'>();
  const [zielEc, setZielEc] = useState<number>();
  const [stadiumWahl, setStadiumWahl] = useState<Stadium>();
  const [kannen, setKannen] = useState<number>();
  const [volumenFrage, setVolumenFrage] = useState<{ gezaehlt: number; betrieb: number; text: string }>();
  const [abgeschlossen, setAbgeschlossen] = useState<{ text: string[] }>();
  const sendet = useRef(false);
  const aktivRef = useRef<HTMLDivElement>(null);
  const signalFuer = useRef<number | undefined>(undefined);

  function setStand(s: AblaufStand) {
    standRef.current = s;
    setStandRoh(s);
  }

  // Uhr: jede Sekunde neu, für Timer und Rückfrage
  useEffect(() => {
    const id = window.setInterval(() => setJetztMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ersterAnsatz = erstAnsatzAm(teile, ort.platzId);
  const minute = Math.floor(jetztMs / 60_000);
  const frischEc = stand?.frischwasser?.ec;
  const volumenFest = stand?.volumen;
  const eingaben = useMemo(
    () =>
      rechnungEingaben(teile, ort.platzId, new Date(minute * 60_000), ZEITZONE, {
        ...(frischEc !== undefined ? { frischwasserEc: frischEc } : {}),
        ...(zielEc !== undefined ? { zielEcGewaehlt: zielEc } : {}),
        ...(stadiumWahl ? { stadiumGewaehlt: stadiumWahl } : {}),
        ...(volumenFest !== undefined ? { volumen: volumenFest } : {}),
      }),
    [teile, ort.platzId, frischEc, minute, zielEc, stadiumWahl, volumenFest],
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
  const uEc = geraet ? Math.round(geraet.u_ec * 100) : 10;
  // Hinweise der Frischwassermessung (R4.6 Zeile 3) und des Rechners (Prüferbefund 9)
  const wasserHinweise = ecWasser({
    frischwasser: frischEc,
    letzteW: hundertstel(teil(teile, 'v_ec_wasser')[0]?.['ec']),
  }).hinweise;

  /** Ist-Mengen der Zeilen 5, 7, 9 (Teil-Dosis) */
  const istTeil = (s: AblaufStand): Mengen =>
    Object.fromEntries(
      ZUGABEN.map((z) => [z.komponente, s.zeilen.find((x) => x.nr === z.nr)?.istMl ?? 0]),
    ) as unknown as Mengen;

  // Restdosis und Prüfung «doppelt dosiert» nach der Kontrollmessung (R4.7, R4.8)
  const kontrolleEc = stand?.messungen.kontrolle?.ec;
  const folgeKontrolle = useMemo(() => {
    if (!rechnung || kontrolleEc === undefined || !stand) return undefined;
    const ist = istTeil(stand);
    const soll = ecSollIst({ ist, volumen, k: eingaben.eingabe.k, ecWasser: eingaben.eingabe.ecWasser });
    const rest = restdosis({
      ecZiel: bruch(rechnung.ecZiel),
      ecIst: kontrolleEc,
      ecWasser: eingaben.eingabe.ecWasser,
      ist,
      volumen,
      k: eingaben.eingabe.k,
      dosis: rechnung.dosisVerwendet,
    });
    const doppelt = doppeltDosiert({
      kontrolle: kontrolleEc,
      ecSollIstTeil: soll.gerundet,
      teilwechsel: {
        volumen,
        ecIst: kontrolleEc,
        ecZiel: rechnung.ecZiel,
        ecWasser: eingaben.eingabe.ecWasser,
      },
    });
    return { rest, doppelt, soll };
  }, [stand, rechnung, eingaben, volumen, kontrolleEc]);

  const defs = useMemo(
    () =>
      zeilenAus(
        {
          rechnung,
          ersterAnsatz,
          volumen,
          kalibrierung,
          festeTermine: daten.festeTermine,
          phZiel,
          ...(folgeKontrolle ? { restdosis: folgeKontrolle.rest } : {}),
          gerechnetFuer: eingaben.gerechnetFuer,
        },
        jetzt,
        ZEITZONE,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- die Zeilen hängen nicht an der Sekunde
    [
      rechnung,
      ersterAnsatz,
      volumen,
      kalibrierung.art,
      daten.festeTermine,
      phZiel,
      folgeKontrolle,
      eingaben.gerechnetFuer,
    ],
  );

  /** ein Paket senden; danach fällt genau dieses Paket aus `ausstehend` (Prüferbefund 1) */
  async function nachsenden(): Promise<void> {
    const s = standRef.current;
    if (sendet.current || !s || s.ausstehend.length === 0) return;
    sendet.current = true;
    const paket = s.ausstehend;
    const antwort = await schreiben(paket, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
    sendet.current = false;
    const aktuell = standRef.current;
    if (!aktuell) return;
    if (antwort.status === 'nicht_gespeichert') {
      setFehler(`${antwort.fehler.text}. Lokal gespeichert, nicht gesendet.`);
      return;
    }
    setFehler(undefined);
    const neu = { ...aktuell, ausstehend: aktuell.ausstehend.slice(paket.length) };
    setStand(neu);
    const fertig = neu.ausstehend.length === 0 && neu.zeilen.find((z) => z.nr === 17)?.schrittClientId;
    if (fertig) await ablaufLoeschen(neu.id).catch(() => undefined);
    else await ablaufSchreiben(neu as AblaufStand & AblaufEintrag).catch(() => undefined);
    if (neu.ausstehend.length > 0) await nachsenden();
  }

  async function weiter(neu: AblaufStand, vorgang: readonly Schritt[]): Promise<void> {
    // angehängt an den neuesten Stand, nie an einen älteren (Prüferbefund 1)
    const mit = { ...neu, ausstehend: [...(standRef.current?.ausstehend ?? []), ...vorgang] };
    setStand(mit);
    try {
      await ablaufSchreiben(mit as AblaufStand & AblaufEintrag);
    } catch {
      setFehler('Lokal nicht gespeichert: Speicher des Browsers voll oder gesperrt');
    }
    await nachsenden();
  }

  // Laden: lokaler Stand, sonst laufender Ansatz aus dem Bündel, sonst neu; danach Ausstehendes senden
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
        if (b) {
          const s = standAusSchritten(
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
          );
          // Messungen des Ansatzes aus dem Bündel: Restdosis und Abschluss auch nach einem Gerätewechsel (Befund 10)
          setStand({
            ...s,
            ...(b.frischwasser ? { frischwasser: b.frischwasser } : {}),
            messungen: {
              ...(b.kontrolle ? { kontrolle: b.kontrolle } : {}),
              ...(b.end ? { end: b.end } : {}),
            },
          });
        } else
          setStand(standNeu({ platzId: ort.platzId, code: ort.code, ansatzId: neueClientId(), defs }, t));
      }
      setGeladen(true);
      await nachsenden();
    })();
    const beiSichtbar = () => {
      if (document.visibilityState === 'visible') void nachsenden();
    };
    document.addEventListener('visibilitychange', beiSichtbar);
    window.addEventListener('online', beiSichtbar);
    return () => {
      aktiv = false;
      document.removeEventListener('visibilitychange', beiSichtbar);
      window.removeEventListener('online', beiSichtbar);
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

  /** ECSoll_ist der gesamten Ist-Dosis einschliesslich Restdosis (R4.7) und k-Vorschlag nach der Endmessung */
  function abschlussWerte(s: AblaufStand): {
    ecErwartetFinal?: number;
    kVorschlag?: number;
    echt: boolean;
    banner: boolean;
    kText?: string;
  } {
    const echt = eingaben.datenart === 'echt';
    const teilIst = istTeil(s);
    const gesamt = Object.fromEntries(
      ZUGABEN.map((z) => {
        const restMl =
          s.zeilen.find((x) => x.nr === 15)?.teilschritte?.find((t) => t.komponente === z.komponente)
            ?.sollMl ?? 0;
        return [z.komponente, teilIst[z.komponente] + restMl];
      }),
    ) as unknown as Mengen;
    if (volumen <= 0 || !rechnung) return { echt, banner: false };
    const k = eingaben.eingabe.k;
    const wasser = eingaben.eingabe.ecWasser;
    const final = ecSollIst({ ist: gesamt, volumen, k, ecWasser: wasser });
    const teil = ecSollIst({ ist: teilIst, volumen, k, ecWasser: wasser });
    const kontrolle = s.messungen.kontrolle?.ec;
    const end = s.messungen.end?.ec;
    if (kontrolle === undefined) return { ecErwartetFinal: final.gerundet, echt, banner: false };
    const v = kVorschlag({
      kontrolle,
      ecSollIstKontrolle: teil.gerundet,
      istDosis: teil.istDosis,
      endmessung: end,
      ecSollIstGesamt: final.gerundet,
      ecWasser: wasser,
      k,
      dosis: rechnung.dosisVerwendet,
      uEc,
      unsicher: kalibrierung.art !== 'gueltig',
      datenart: eingaben.datenart,
    });
    return {
      ecErwartetFinal: final.gerundet,
      echt,
      banner: v.art === 'banner',
      ...(v.art === 'vorschlag'
        ? {
            kVorschlag: v.kIst,
            kText: `k-Vorschlag ${(v.kIst / 1000).toFixed(3)} (bisher ${(Object.values(k)[0] ?? 0) / 1000})`,
          }
        : {}),
    };
  }

  /** Vorgänge für neu erledigte Zeilen nach dem Kopf; der Kopf selbst beim Haken von Zeile 4 */
  function nachziehen(s: AblaufStand): { stand: AblaufStand; vorgang: Schritt[] } {
    let st = s;
    const vorgang: Schritt[] = [];
    const vier = st.zeilen.find((z) => z.nr === 4);
    if (!st.kopfGeschrieben && vier?.erledigtAm && rechnung) {
      const zb = eingaben.eingabe.zielbereich;
      const k = kopfVorgang(
        st,
        {
          volumen,
          stadiumVorschlag: eingaben.stadiumVorschlag ?? rechnung.stadium,
          stadiumGewaehlt: rechnung.stadium,
          pflanzungIds: eingaben.pflanzungIds,
          ...(eingaben.leitkultur.art === 'art' ? { leitkulturArtId: eingaben.leitkultur.artId } : {}),
          schnappschuss: {
            ...(eingaben.phBand || zb
              ? {
                  zielbereich: {
                    ...(eingaben.phBand
                      ? { ph_min: eingaben.phBand.min / 100, ph_max: eingaben.phBand.max / 100 }
                      : {}),
                    ...(zb ? { ec_min: zb.min / 100, ec_max: zb.max / 100 } : {}),
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

  function tippen(nr: number) {
    if (!aktuell) return;
    const t = uhrJetzt();
    const z = aktuell.zeilen.find((x) => x.nr === nr);
    if (z?.erledigtAm !== undefined) {
      if (!abwaehlbar(aktuell, nr)) return;
      const storno: Schritt[] = [...abwahlVorgang(aktuell, nr)];
      // Abwahl von Zeile 2: Prüfschritt 4 stornieren (Korrektur = Storno plus neue Zeile, Prüfer R2-7)
      if (nr === 2 && aktuell.pruefschritt4Ids) {
        for (const id of aktuell.pruefschritt4Ids)
          storno.push({ art: 'storno', tabelle: 'ereignis', clientId: id, grund: 'korrektur' });
        setVolumenFrage(undefined);
      }
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
      void weiter(neu, storno);
      return;
    }
    // vor dem nächsten Tipp: Rückfrage nach einer Pause (R4.6)
    if (rueckfrage(aktuell, defs, t, ZEITZONE)) {
      setJetztMs(t.getTime());
      return;
    }
    if (!abhakbar(aktuell, nr, t)) return;
    let neu = (z?.aufzuege ?? 1) > 1 ? aufzugAbhaken(aktuell, nr, t) : abhaken(aktuell, nr, t);
    setEingabe(undefined);
    const extra: Schritt[] = [];
    // erster Ansatz: Kannen gezählt in Zeile 2 → Prüfschritt 4 und Volumen der Rechnung (R4.4, Plan 21 A2)
    if (nr === 2 && ersterAnsatz && neu.zeilen.find((x) => x.nr === 2)?.erledigtAm) {
      const betrieb = eingaben.volumen / 100;
      const gezaehlt = kannen !== undefined ? kannen / 2 : betrieb;
      const vorschlag = volumenVorschlag(gezaehlt, betrieb);
      neu = { ...neu, volumen: Math.round(gezaehlt * 100) };
      // mehr als 10 % Abweichung: Korrekturvorschlag mit Ja/Nein statt stiller Übernahme (R9.3, Prüfer R2-1)
      if (vorschlag) setVolumenFrage({ gezaehlt, betrieb, text: vorschlag.text });
      else {
        const v = pruefschritt4Vorgang(teile, ort.platzId, gezaehlt, false, neueClientId, t);
        extra.push(...v);
        neu = { ...neu, pruefschritt4Ids: ereignisIds(v) };
      }
    }
    const n = nachziehen(neu);
    void weiter(n.stand, [...extra, ...n.vorgang]);
    if (nr === 17 && n.stand.zeilen.find((x) => x.nr === 17)?.erledigtAm) abschlussZeigen(n.stand);
  }

  function abschlussZeigen(s: AblaufStand) {
    const end = s.messungen.end?.ec;
    const w = abschlussWerte(s);
    const zeilen: string[] = [];
    if (end !== undefined && rechnung) {
      const abw = end - rechnung.ecZiel;
      zeilen.push(
        `Endmessung EC ${ecText(end)}, Ziel ${ecText(rechnung.ecZiel)} (${ecText(abw, { vorzeichen: true })})`,
      );
    }
    if (w.banner) zeilen.push('Mehr EC als erwartet: Dosis, Volumen oder Kanne prüfen');
    else if (w.kText) zeilen.push(w.kText);
    zeilen.push('Kontrollmessung morgen');
    setAbgeschlossen({ text: zeilen });
  }

  /** Antwort auf «Betriebsvolumen auf 8.0 l ändern»: Prüfschritt 4 in beiden Fällen, Übernahme nur nach Ja */
  function volumenAntwort(uebernehmen: boolean) {
    const s = standRef.current;
    if (!volumenFrage || !s) return;
    const v = pruefschritt4Vorgang(
      teile,
      ort.platzId,
      volumenFrage.gezaehlt,
      uebernehmen,
      neueClientId,
      uhrJetzt(),
    );
    setVolumenFrage(undefined);
    void weiter({ ...s, pruefschritt4Ids: ereignisIds(v) }, v);
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
      const alle = [...(standRef.current?.ausstehend ?? []), ...v];
      if (alle.length > 0) {
        const antwort = await schreiben(alle, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
        if (antwort.status === 'nicht_gespeichert') {
          setFehler(`${antwort.fehler.text}. Abbruch nicht gespeichert.`);
          return;
        }
      }
      await ablaufLoeschen(aktuell.id).catch(() => undefined);
      oeffnen({ name: 'heute' });
    })();
  }

  /** Leitkultur im Gleichstand wählen: Ereignis leitkultur_gewaehlt über schreiben(), danach rechnet die Maske neu */
  function leitkulturWaehlen(artId: string): void {
    const giltAb = uhrJetzt();
    const v = leitkulturGewaehltVorgang(ort.platzId, artId, neueClientId, giltAb);
    const id = v[0]?.art === 'neu' ? String(v[0].felder['id']) : neueClientId();
    setLeitkulturWahl({ id, artId, giltAb: giltAb.toISOString() });
    void schreiben(v, { jetzt: giltAb, zeitzone: ZEITZONE }).then((antwort) => {
      if (antwort.status === 'nicht_gespeichert')
        setFehler(`${antwort.fehler.text}. Leitkultur nicht gespeichert.`);
    });
  }
  const artName = (artId: string) =>
    String(teil(teile, 'art').find((a) => a['art_id'] === artId)?.['name_de'] ?? artId);

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
        {fehler ? (
          <Notice
            kompakt
            tone="danger"
            action={
              <Button variant="secondary" size="compact" onClick={() => void nachsenden()}>
                Erneut senden
              </Button>
            }
          >
            {fehler}
          </Notice>
        ) : null}
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

  const aktivZeile = aktuell.zeilen.find((x) => x.nr === aktiv);
  if (eingabe === 'menge' && aktivZeile && aktiv !== undefined)
    return (
      <main className="hv-seite hv-ansatz" data-density="regal">
        {kopf}
        <ZahlEingabe
          titel={`Ist-Menge Zeile ${String(aktiv)} in ml`}
          start={(aktivZeile.istMl ?? aktivZeile.sollMl ?? 0) / 10}
          dezimalen={1}
          schritt={0.1}
          onFertig={(w) => {
            setEingabe(undefined);
            if (w !== undefined)
              void weiter(mengeAendern(aktuell, aktiv, Math.round(w * 10), uhrJetzt()), []);
          }}
        />
      </main>
    );
  if (eingabe === 'ziel_ec')
    return (
      <main className="hv-seite hv-ansatz" data-density="regal">
        {kopf}
        <ZahlEingabe
          titel="Ziel-EC in mS/cm"
          start={(zielEc ?? 120) / 100}
          dezimalen={2}
          schritt={0.1}
          onFertig={(w) => {
            setEingabe(undefined);
            if (w !== undefined && w > 0) setZielEc(Math.round(w * 100));
          }}
        />
      </main>
    );

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
      ) : istAktiv && d.nr === 2 && ersterAnsatz ? (
        <Stepper
          label="Frischwasser gezählt"
          wert={kannen ?? Math.round((eingaben.volumen / 100) * 2)}
          min={1}
          max={200}
          onWert={setKannen}
          anzeige={(w) => `${(w / 2).toFixed(1)} l`}
        />
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
          <Button variant="secondary" size="compact" onClick={() => setEingabe('menge')}>
            Menge ändern
          </Button>
        </span>
      ) : istAktiv && d.nr === 15 && (z?.aufzuege ?? 1) > 1 ? (
        <span className="hv-num">{`Teilschritt ${String((z?.aufzuegeErledigt ?? 0) + 1)} von ${String(z?.aufzuege ?? 1)}`}</span>
      ) : undefined;
    // R4.8 in Zeile 15: «möglicherweise doppelt dosiert» und das Angebot Teilwechsel
    const doppelt = d.nr === 15 ? folgeKontrolle?.doppelt : undefined;
    // Zeile 4 gesperrt: sagen, was oben fehlt, weil die Liste zur aktiven Zeile scrollt und die Karten über ihr am
    // Honor nicht zu sehen sind (#123)
    const sperre4 =
      istAktiv && d.nr === 4 ? zeile4Sperre(eingaben.leitkultur.art, rechnung !== undefined) : undefined;
    const hinweis: ReactNode = sperre4 ? (
      <span className="hv-ansatz-sperre">
        {sperre4}
        <Button
          variant="secondary"
          size="compact"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Nach oben springen
        </Button>
      </span>
    ) : doppelt?.hinweis === true ? (
      `Möglicherweise doppelt dosiert${doppelt.angebot?.art === 'absaugen' ? `: ${doppelt.angebot.text}` : ''}`
    ) : (
      d.hinweis
    );
    const menge = z?.istMl !== undefined && z.istMl !== d.sollMl ? `Ist ${mlText(z.istMl)}` : undefined;
    return {
      nr: d.nr,
      titel: d.titel,
      ...(menge ? { menge } : {}),
      ...(te && zustand !== 'erledigt' ? { timerEnde: te.getTime() } : {}),
      zustand,
      ...(aktion ? { aktion } : {}),
      ...(hinweis ? { hinweis } : {}),
      ...(zustand === 'erledigt' ? { abwaehlbar: abwaehlbar(aktuell, d.nr) } : {}),
      ...(istAktiv && messzeile && !z?.messungId ? { gesperrt: true } : {}),
      // R2.3 Gleichstand (Runde 1 Befund 7) und RF7 ohne Rechnung: Zeile 4 gesperrt, der Hinweis nennt den Grund
      ...(sperre4 ? { gesperrt: true } : {}),
    };
  });
  const hinweise = [...wasserHinweise, ...(rechnung?.hinweise ?? [])].map((h) => h.text);
  const zb = eingaben.eingabe.zielbereich;

  return (
    <main className="hv-seite hv-ansatz" data-density="regal">
      {kopf}
      {fehler ? (
        <Notice
          kompakt
          tone="danger"
          action={
            <Button variant="secondary" size="compact" onClick={() => void nachsenden()}>
              Erneut senden
            </Button>
          }
        >
          {fehler}
        </Notice>
      ) : null}
      {!aktuell.kopfGeschrieben && eingaben.leitkultur.art === 'wahl_noetig' ? (
        <Card title="Leitkultur wählen">
          <p>Gleichstand: Wähle die Art, nach der Zielbereich und Stadium gelten</p>
          <Choice
            label="Leitkultur wählen"
            optionen={eingaben.leitkultur.kandidaten.map((a) => ({ wert: a, titel: artName(a) }))}
            gewaehlt={[]}
            onWahl={leitkulturWaehlen}
          />
        </Card>
      ) : null}
      {!aktuell.kopfGeschrieben ? (
        <Card title="Rechnung">
          {!rechnung ? (
            // RF7: ohne Zielbereich Ziel-EC von Hand, Stadium mit Vorschlag Wachstum
            <>
              <p>Kein Zielbereich: Ziel-EC und Stadium wählen</p>
              <Choice
                label="Stadium"
                zeile
                optionen={STADIEN}
                gewaehlt={[stadiumWahl ?? eingaben.stadiumVorschlag ?? 'wachstum']}
                onWahl={(w) => setStadiumWahl(w as Stadium)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setStadiumWahl((s) => s ?? eingaben.stadiumVorschlag ?? 'wachstum');
                  setEingabe('ziel_ec');
                }}
              >
                Ziel-EC eingeben
              </Button>
            </>
          ) : (
            <>
              <p className="hv-ansatz-rechnung hv-num">
                {`${zb ? `Zielbereich ${ecText(zb.min)} bis ${ecText(zb.max)} · ` : ''}Ziel-EC ${ecText(rechnung.ecZiel)} · Teil-Dosis ${String(rechnung.teilDosis)} %${rechnung.teilDosis < 100 ? ' bis k stabil' : ''}`}
              </p>
              <Choice
                label="Stadium"
                zeile
                optionen={STADIEN}
                gewaehlt={[rechnung.stadium]}
                onWahl={(w) => setStadiumWahl(w as Stadium)}
              />
            </>
          )}
        </Card>
      ) : null}
      {hinweise.slice(0, 2).map((h) => (
        <Notice key={h} kompakt tone="warn">
          {h}
        </Notice>
      ))}
      {volumenFrage ? (
        <Card title="Gezählt weicht ab">
          <p>{`${volumenFrage.gezaehlt.toFixed(1)} l statt ${volumenFrage.betrieb.toFixed(1)} l gezählt. ${volumenFrage.text}?`}</p>
          <div className="hv-ansatz-frage">
            <Button variant="secondary" onClick={() => volumenAntwort(false)}>
              Nein, beibehalten
            </Button>
            <Button variant="secondary" onClick={() => volumenAntwort(true)}>
              Ja, ändern
            </Button>
          </div>
        </Card>
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
