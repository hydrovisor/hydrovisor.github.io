// Rundgang am Regal (Plan 30; UC8 Ablauf 2, Ablauf Rundgang; Konzept 6.2, 11.4): je Ebene der Sammel-Tipp der
// Kurzprüfung, je Ort die Kennung (1 s), die Messmaske im Modus rundgang, bei Bedarf Nachfüllen, bei Abweichung der
// Halt; am Ende die Abschlussliste. Der Stand liegt nach jedem Tipp im Ablaufspeicher (Fortsetzen nach Neuladen).
import { useEffect, useRef, useState } from 'react';
import { ablaufLesen, ablaufLoeschen, ablaufSchreiben, type AblaufEintrag } from '../../ablauf/speicher.ts';
import { useWachhalten } from '../../ablauf/wachhalten.ts';
import { gefaessAm, zeilen } from '../../domain/anlage/teile.ts';
import { einstellungenAus, faelligeAufgaben } from '../../domain/aufgaben.ts';
import { abschlussKopf, abschlussliste } from '../../domain/rundgang/abschluss.ts';
import {
  aktuellerOrt,
  amEnde,
  fortschritt,
  nachKurzpruefung,
  nachMessung,
  nachNachfuellen,
  naechsterSchritt,
  rundgangBeenden,
  rundgangId,
  rundgangStart,
  standGueltig,
  type RundgangStand,
} from '../../domain/rundgang/ablauf.ts';
import { kurzpruefungVorgang } from '../../domain/rundgang/kurzpruefung.ts';
import {
  kannenWahl,
  kratkyErgebnis,
  kratkySchritt,
  nachfuellSchritt,
  nachfuellVorgang,
  type MessungZeile,
} from '../../domain/rundgang/nachfuellen.ts';
import { rundgangPlan, type RundgangEbene, type RundgangOrt } from '../../domain/rundgang/plan.ts';
import { ortAufloesen } from '../../domain/ort.ts';
import { HINWEIS } from '../../domain/rechner.ts';
import { kalendertag, ZEITZONE } from '../../domain/zeit.ts';
import { neueClientId, schreiben } from '../../daten/schreiben.ts';
import type { Vorgang } from '../../domain/datenpfad/erfassung.ts';
import { Button } from '../bausteine/Button.tsx';
import { Notice } from '../bausteine/Notice.tsx';
import { NumPad, type Taste } from '../bausteine/NumPad.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu, oeffnen } from '../router.ts';
import { Messmaske, type RundgangMessung } from './Messen.tsx';
import type { Groesse } from '../../domain/messung/eingabe.ts';
import '../rundgang.css';

const uhrJetzt = () => new Date(Date.now());
const kennung = (code: string) => code.slice(code.indexOf('-') + 1);
const KOMPONENTE: Readonly<Record<string, string>> = {
  grow: 'Grow',
  micro_hard_water: 'Micro',
  bloom: 'Bloom',
};
/** Kennung zwischen zwei Orten (Konzept 6.2) */
const KENNUNG_MS = 1000;

type Ergebnis = Awaited<ReturnType<typeof schreiben>>;

function Rahmen({
  titel,
  children,
  beenden,
}: {
  titel: string;
  children: React.ReactNode;
  beenden?: () => void;
}) {
  return (
    <main className="hv-seite hv-rundgang" data-density="regal">
      <header className="hv-messen-kopf">
        <h1 className="hv-messen-titel">{titel}</h1>
        {beenden ? (
          <Button variant="ghost" size="compact" onClick={beenden}>
            Rundgang beenden
          </Button>
        ) : null}
      </header>
      {children}
    </main>
  );
}

export function Rundgang({ kuerzel }: { kuerzel: string }) {
  const { buendel, liest } = useBuendel();
  const teile = buendel?.teile;
  const anlage = zeilen<{ id: string; kuerzel: string; storniert_am?: string | null }>(teile, 'anlage').find(
    (a) => a.kuerzel === kuerzel && (a.storniert_am ?? null) === null,
  );
  const [stand, setStand] = useState<RundgangStand>();
  const [fehler, setFehler] = useState<string>();
  const [sendet, setSendet] = useState(false);
  // «Jetzt korrigieren» mit pH-Vorschlag: Messmaske im Modus Korrektur, der Rundgang steht schon beim nächsten Schritt
  // (Plan 113 A8; der Zustand lebt nur in der Maske)
  const [korrektur, setKorrektur] = useState<{
    code: string;
    messungId: string;
    giltAb: string;
    werte: Partial<Record<Groesse, number>>;
  }>();
  const sperre = useRef(false);
  const anlageId = anlage?.id;

  // Stand laden oder neu beginnen (einmal je Anlage und Bündel-Verfügbarkeit)
  useEffect(() => {
    if (!anlageId || !teile || stand) return;
    let aktiv = true;
    const jetzt = uhrJetzt();
    const id = rundgangId(anlageId, kalendertag(jetzt, ZEITZONE));
    void ablaufLesen<RundgangStand & AblaufEintrag>(id)
      .catch(() => undefined)
      .then((gespeichert) => {
        if (!aktiv) return;
        if (gespeichert && standGueltig(gespeichert, jetzt, ZEITZONE)) {
          setStand(
            gespeichert.schritt.art === 'kennung' ? naechsterSchritt(gespeichert, jetzt) : gespeichert,
          );
          return;
        }
        const plan = rundgangPlan(
          teile,
          faelligeAufgaben(teile, einstellungenAus(teile), jetzt, ZEITZONE),
          anlageId,
          jetzt,
          ZEITZONE,
        );
        const neu = rundgangStart(plan, jetzt);
        setStand(neu);
        void ablaufSchreiben(neu as unknown as AblaufEintrag).catch(() => undefined);
      });
    return () => {
      aktiv = false;
    };
  }, [anlageId, teile, stand]);

  useWachhalten(stand !== undefined && stand.schritt.art !== 'abschluss');

  // Kennung 1 s, dann der Schritt des Orts ohne Tipp
  useEffect(() => {
    if (stand?.schritt.art !== 'kennung') return;
    const t = window.setTimeout(() => weiter(naechsterSchritt(stand, uhrJetzt())), KENNUNG_MS);
    return () => window.clearTimeout(t);
  });

  function weiter(neu: RundgangStand) {
    setStand(neu);
    void ablaufSchreiben(neu as unknown as AblaufEintrag).catch(() => undefined);
  }

  /** Vorgang schreiben, danach `dann`; bei Fehler bleibt der Schritt stehen */
  async function senden(vorgang: Vorgang, dann: () => void) {
    if (sperre.current) return;
    sperre.current = true;
    setSendet(true);
    try {
      const r: Ergebnis =
        vorgang.length === 0
          ? ({ status: 'gespeichert' } as Ergebnis)
          : await schreiben(vorgang, { jetzt: uhrJetzt(), zeitzone: ZEITZONE });
      if (r.status === 'nicht_gespeichert') {
        setFehler(r.fehler.text);
        return;
      }
      setFehler(undefined);
      dann();
    } finally {
      sperre.current = false;
      setSendet(false);
    }
  }

  const beenden = () => stand && weiter(rundgangBeenden(stand, uhrJetzt()));
  const fehlerHinweis = fehler ? <Notice kompakt tone="danger" title={fehler} /> : null;

  if (!teile || !anlage || !stand)
    return (
      <Rahmen titel="Rundgang">
        <p>{liest || (teile && anlage) ? 'Daten werden geladen' : `Anlage ${kuerzel} nicht bekannt`}</p>
      </Rahmen>
    );

  if (korrektur) {
    const ort = ortAufloesen(korrektur.code, teile);
    if (ort)
      return (
        <Messmaske
          key={`korrektur|${korrektur.messungId}`}
          ort={ort}
          modus={{
            korrektur: {
              messungId: korrektur.messungId,
              giltAb: korrektur.giltAb,
              werte: korrektur.werte,
              onWeiter: () => setKorrektur(undefined),
            },
          }}
        />
      );
  }

  const s = stand.schritt;
  const { fertig, von } = fortschritt(stand);

  if (s.art === 'kurzpruefung') {
    const ebene = stand.plan.ebenen[s.ebene] as RundgangEbene;
    return (
      <Kurzpruefung
        ebene={ebene}
        titel={`Rundgang · ${String(fertig)} von ${String(von)}`}
        sendet={sendet}
        fehler={fehlerHinweis}
        beenden={beenden}
        onSpeichern={(abw) => {
          const jetzt = uhrJetzt();
          const vorgang = kurzpruefungVorgang(ebene, abw, neueClientId, jetzt);
          const ergebnisse = vorgang.map((x) => {
            const f = x.felder as unknown as {
              platz_id?: string;
              bereich_id?: string;
              daten: { punkt: string; ok: boolean };
            };
            return {
              platzId: f.platz_id ?? null,
              bereichId: f.bereich_id ?? null,
              punkt: f.daten.punkt,
              ok: f.daten.ok,
            };
          });
          void senden(vorgang, () => weiter(nachKurzpruefung(stand, ergebnisse, jetzt)));
        }}
      />
    );
  }

  if (s.art === 'kennung') {
    const ort = aktuellerOrt(stand);
    return (
      <main className="hv-seite hv-rundgang" data-density="regal">
        <div className="hv-kennung" role="status">
          <span className="hv-kennung-code">{kennung(ort?.code ?? '')}</span>
          <span className="hv-kennung-zeile">Sonde abspülen</span>
        </div>
      </main>
    );
  }

  if (s.art === 'messen') {
    const rOrt = aktuellerOrt(stand) as RundgangOrt;
    const ort = ortAufloesen(rOrt.code, teile);
    if (!ort) return <Rahmen titel={rOrt.code}>{`Ort ${rOrt.code} nicht bekannt`}</Rahmen>;
    return (
      <Messmaske
        key={`${rOrt.platzId}|${stand.id}`}
        ort={ort}
        modus={{
          rundgang: {
            nachfuellenAngebot: rOrt.nachfuellen,
            ...(rOrt.messAufgabe
              ? { warFaelligAm: rOrt.messAufgabe.faelligAm, aufgabeSchluessel: rOrt.messAufgabe.schluessel }
              : {}),
            onGespeichert: (m: RundgangMessung) =>
              weiter(
                nachMessung(
                  stand,
                  {
                    messungId: m.messungId,
                    werte: m.werte,
                    bewertungen: m.bewertungen,
                    ...(m.fuellstand ? { fuellstand: m.fuellstand } : {}),
                    nachfuellen: m.nachfuellen,
                  },
                  new Date(m.giltAb),
                ),
              ),
          },
        }}
      />
    );
  }

  const rOrt = aktuellerOrt(stand);
  const ergebnis = stand.orte.find((o) => o.platzId === rOrt?.platzId);
  const messung: MessungZeile | undefined =
    rOrt && ergebnis?.messungId
      ? {
          id: ergebnis.messungId,
          platz_id: rOrt.platzId,
          gilt_ab: stand.letzteAktionAm,
          ansatz_id: null,
          ...(ergebnis.werte?.ec !== undefined ? { ec: ergebnis.werte.ec / 100 } : {}),
          ...(ergebnis.fuellstand ? { fuellstand: ergebnis.fuellstand } : {}),
        }
      : undefined;

  if (s.art === 'nachfuellen' && rOrt) {
    const g = gefaessAm(teile, rOrt.platzId);
    const volumenL = Number(g?.betriebsvolumen_l ?? 0);
    const kanne = Number(
      zeilen<{ kannengroesse_l?: number | string | null }>(teile, 'einstellung')[0]?.kannengroesse_l ?? 10,
    );
    return (
      <Nachfuellen
        code={rOrt.code}
        kannen={kannenWahl(volumenL, kanne)}
        kanne={kanne}
        volumenL={volumenL}
        rechnen={(liter) =>
          messung ? nachfuellSchritt(teile, rOrt.platzId, messung, liter, uhrJetzt(), ZEITZONE) : undefined
        }
        sendet={sendet}
        fehler={fehlerHinweis}
        onNachgefuellt={(liter, r) => {
          const jetzt = uhrJetzt();
          const aufgabe = rOrt.aufgaben.find((a) => a.typ === 'messen_nachfuellen');
          void senden(
            nachfuellVorgang(
              {
                platzId: rOrt.platzId,
                liter,
                ...(r ? { ergebnis: r } : {}),
                ...(aufgabe ? { aufgabe } : {}),
                volumenL,
              },
              neueClientId,
              jetzt,
            ),
            () => weiter(nachNachfuellen(stand, liter, jetzt)),
          );
        }}
      />
    );
  }

  if (s.art === 'nachfuellen_kratky' && rOrt) {
    const g = gefaessAm(teile, rOrt.platzId);
    const volumenL = Number(g?.betriebsvolumen_l ?? 0);
    const k = messung ? kratkySchritt(teile, rOrt.platzId, messung, ZEITZONE) : undefined;
    const hoechstens = k && 'hoechstensLiter' in k ? k.hoechstensLiter / 10 : undefined;
    const text =
      k?.art === 'nur_wasser'
        ? `Nur Wasser, höchstens ${(k.hoechstensLiter / 10).toFixed(1)} l`
        : k?.art === 'halbe_konzentration'
          ? `Halbe Konzentration ${(k.dMlL / 100).toFixed(2)} ml/L, höchstens ${(k.hoechstensLiter / 10).toFixed(1)} l`
          : 'Nach Bedarf nachfüllen';
    const aufgabe = rOrt.aufgaben.find((a) => a.typ === 'nachfuellen_kratky');
    return (
      <KratkyNachfuellen
        code={rOrt.code}
        text={text}
        {...(hoechstens !== undefined ? { hoechstens } : {})}
        sendet={sendet}
        fehler={fehlerHinweis}
        onNachgefuellt={(liter) => {
          const jetzt = uhrJetzt();
          // halbe Konzentration: Positionen mit dem gegebenen Dünger (Prüfer Runde 1 Befund 3)
          const ergebnis = messung
            ? kratkyErgebnis(teile, rOrt.platzId, messung, liter, ZEITZONE)
            : undefined;
          void senden(
            nachfuellVorgang(
              {
                platzId: rOrt.platzId,
                liter,
                ...(ergebnis ? { ergebnis } : {}),
                ...(aufgabe ? { aufgabe } : {}),
                volumenL,
              },
              neueClientId,
              jetzt,
            ),
            () => weiter(nachNachfuellen(stand, liter, jetzt)),
          );
        }}
      />
    );
  }

  if (s.art === 'halt' && rOrt) {
    const zeilenOrt = abschlussliste(stand, { teile, zeitzone: ZEITZONE }).filter(
      (z) => z.platzId === rOrt.platzId,
    );
    const korrigieren = zeilenOrt.find((z) => z.knopf.route === 'messen') ?? zeilenOrt[0];
    return (
      <Rahmen titel={rOrt.code} beenden={beenden}>
        <ul className="hv-rundgang-liste" aria-label="Abweichungen">
          {zeilenOrt.map((z) => (
            <li key={`${z.art}|${z.groesse ?? ''}|${z.text}`} className="hv-aufgabe hv-aufgabe-umbruch">
              <span className="hv-aufgabe-text">
                {z.text}
                {z.massnahme ? (
                  <>
                    <br />
                    <small>{z.massnahme}</small>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <div className="hv-rundgang-fuss">
          <Button block onClick={() => weiter(amEnde(stand, uhrJetzt()))}>
            Am Ende korrigieren
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() => {
              // beim Halt nach nachMessung() ist letzteAktionAm das gilt_ab der Messung; nach nachNachfuellen() die Zeit
              // des Nachfüllens (Abweichung um Minuten, nur für die Anzeige «Gespeichert hh:mm», Prüfer Runde 2 R1)
              const giltAb = stand.letzteAktionAm;
              weiter(amEnde(stand, uhrJetzt()));
              // pH über dem Ziel: direkt ins Angebot «pH-Minus gegeben» ohne neue Messung (Plan 113, Rundgang-AK3)
              if (korrigieren?.knopf.route === 'messen' && ergebnis?.messungId && ergebnis.werte)
                setKorrektur({
                  code: rOrt.code,
                  messungId: ergebnis.messungId,
                  giltAb,
                  werte: ergebnis.werte,
                });
              else
                oeffnen(
                  korrigieren?.knopf.route === 'messen'
                    ? { name: 'messen', code: rOrt.code }
                    : { name: 'gefaess', code: rOrt.code },
                );
            }}
          >
            Jetzt korrigieren
          </Button>
        </div>
      </Rahmen>
    );
  }

  // Abschluss
  const liste = abschlussliste(stand, { teile, zeitzone: ZEITZONE });
  return (
    <Rahmen titel="Rundgang fertig">
      <p className="hv-rundgang-kopf hv-num">{abschlussKopf(stand, liste)}</p>
      {liste.length > 0 ? (
        <ul className="hv-rundgang-liste" aria-label="Abschlussliste">
          {liste.map((z) => (
            <li
              key={`${z.platzId}|${z.art}|${z.groesse ?? ''}|${z.text}`}
              className="hv-aufgabe hv-aufgabe-umbruch"
            >
              <span className="hv-aufgabe-text">
                {z.text}
                {z.massnahme ? (
                  <>
                    <br />
                    <small>{z.massnahme}</small>
                  </>
                ) : null}
              </span>
              <a
                className="hv-btn hv-btn-secondary"
                href={hashZu(
                  z.knopf.route === 'messen'
                    ? { name: 'messen', code: z.code }
                    : z.knopf.route === 'anlage'
                      ? { name: 'anlage', kuerzel }
                      : { name: 'gefaess', code: z.code },
                )}
              >
                {z.knopf.text}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        block
        onClick={() => {
          void ablaufLoeschen(stand.id)
            .catch(() => undefined)
            .then(() => oeffnen({ name: 'heute' }));
        }}
      >
        Zu Heute
      </Button>
    </Rahmen>
  );
}

/** Sammel-Tipp der Ebene: «Alles ok» oder Ausnahmen einzeln (Wort und Symbol, nicht nur Farbe) */
function Kurzpruefung({
  ebene,
  titel,
  sendet,
  fehler,
  beenden,
  onSpeichern,
}: {
  ebene: RundgangEbene;
  titel: string;
  sendet: boolean;
  fehler: React.ReactNode;
  beenden: () => void;
  onSpeichern: (abweichungen: ReadonlySet<string>) => void;
}) {
  const [abw, setAbw] = useState<ReadonlySet<string>>(new Set());
  const umschalten = (key: string) =>
    setAbw((alt) => {
      const neu = new Set(alt);
      if (neu.has(key)) neu.delete(key);
      else neu.add(key);
      return neu;
    });
  return (
    <Rahmen titel={titel} beenden={beenden}>
      {fehler}
      <h2 className="hv-rundgang-ebene">{`${ebene.name} · Pumpen laufen, Licht an, Lüfter läuft`}</h2>
      {ebene.mitLichtLuefter && ebene.bereichId !== null ? (
        <div className="hv-rundgang-kannen" role="group" aria-label="Licht und Lüfter">
          {(
            [
              ['licht', 'Licht an'],
              ['luefter', 'Lüfter läuft'],
            ] as const
          ).map(([punkt, text]) => {
            const key = `${String(ebene.bereichId)}|${punkt}`;
            const ab = abw.has(key);
            return (
              <Button
                key={key}
                variant="secondary"
                className="hv-rundgang-punkt"
                aria-pressed={ab}
                onClick={() => umschalten(key)}
              >
                <span>{text}</span>
                <span className="hv-rundgang-urteil">{ab ? '✗' : '✓'}</span>
              </Button>
            );
          })}
        </div>
      ) : null}
      <ul className="hv-rundgang-liste" aria-label="Kurzprüfung">
        {ebene.kurzpruefung.map((z) => {
          const key = `${z.platzId}|${z.punkt}`;
          const ab = abw.has(key);
          return (
            <li key={key}>
              <Button
                variant="secondary"
                block
                className="hv-rundgang-punkt"
                aria-pressed={ab}
                onClick={() => umschalten(key)}
              >
                <span>{`${kennung(z.code)} ${z.text}`}</span>
                <span className="hv-rundgang-urteil">
                  {ab ? '✗ Abweichung' : '✓ ok'}
                  {z.vermerk
                    ? z.vermerk === 'mitmarkiert'
                      ? ' · Pumpe mitmarkiert'
                      : ' · Belüftung prüfen'
                    : ''}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="hv-rundgang-fuss">
        <Button block disabled={sendet} onClick={() => onSpeichern(abw)}>
          {abw.size === 0
            ? 'Alles ok'
            : `Speichern mit ${String(abw.size)} Abweichung${abw.size === 1 ? '' : 'en'}`}
        </Button>
      </div>
    </Rahmen>
  );
}

/** Liter über den Ziffernblock: höchstens eine Nachkommastelle, höchstens vier Zeichen */
function literTippen(alt: string, t: Taste): string {
  if (t === 'leeren') return '';
  if (t === 'zurueck') return alt.slice(0, -1);
  if (t === '.') return alt.includes('.') || alt === '' ? alt : `${alt}.`;
  if (/^\d$/.test(t)) return /\.\d$/.test(alt) || alt.length >= 4 ? alt : `${alt}${t}`;
  return alt;
}

/** Nachfüllen DWC, Konstantpegel, Station (R4.9): Kannen wählen, Dosis je Komponente, «Nachgefüllt» */
function Nachfuellen({
  code,
  kannen,
  kanne,
  volumenL,
  rechnen,
  sendet,
  fehler,
  onNachgefuellt,
}: {
  code: string;
  kannen: number[];
  kanne: number;
  volumenL: number;
  rechnen: (liter: number) => ReturnType<typeof nachfuellSchritt> | undefined;
  sendet: boolean;
  fehler: React.ReactNode;
  onNachgefuellt: (
    liter: number,
    r: Extract<ReturnType<typeof nachfuellSchritt>, { mengen: unknown }> | undefined,
  ) => void;
}) {
  const [anzahl, setAnzahl] = useState<number>();
  const [teil, setTeil] = useState<string>();
  // Liter sind die Wahrheit (R4.9): ganze Kannen plus Teilkanne in Litern (Prüfer Runde 1 Befund 1)
  const summe = (anzahl ?? 0) * kanne + Number(teil ?? 0);
  const liter = summe > 0 ? Math.round(summe * 10) / 10 : undefined;
  // Teilkanne kleiner als eine Kanne, Nachfüllwasser höchstens das Betriebsvolumen (Prüfer Runde 2 N3)
  const zuViel =
    Number(teil ?? 0) >= kanne
      ? `Teilkanne kleiner als ${String(kanne)} l eingeben`
      : volumenL > 0 && summe > volumenL
        ? `Höchstens ${String(volumenL)} l, das Betriebsvolumen`
        : undefined;
  const r = liter === undefined ? undefined : rechnen(liter);
  const ergebnis = r && 'mengen' in r ? r : undefined;
  return (
    <Rahmen titel={`${code} nachfüllen`}>
      {fehler}
      <h2 className="hv-rundgang-ebene">Wie viele Kannen?</h2>
      <div className="hv-rundgang-kannen" role="group" aria-label="Kannen">
        {kannen.map((n) => (
          <Button
            key={n}
            variant="secondary"
            aria-pressed={anzahl === n}
            onClick={() => setAnzahl((alt) => (alt === n ? undefined : n))}
          >
            {String(n)}
          </Button>
        ))}
        <Button
          variant="secondary"
          aria-pressed={teil !== undefined}
          onClick={() => setTeil((alt) => (alt === undefined ? '' : undefined))}
        >
          Teilkanne
        </Button>
      </div>
      {teil !== undefined ? (
        <NumPad
          onTaste={(t) => setTeil((alt) => literTippen(alt ?? '', t))}
          echo={teil === '' ? 'Teilkanne in Litern' : `+ ${teil} l`}
          ohnePlusMinus
        />
      ) : null}
      {liter !== undefined ? (
        r && 'art' in r && r.art === 'neue_messung_noetig' ? (
          <Notice
            kompakt
            tone="warn"
            title="Neue Messung nötig: Dosis ohne Messung von heute nicht rechenbar"
          />
        ) : ergebnis ? (
          <div className="hv-rundgang-dosis hv-num" aria-label="Dosis">
            <p>{`${String(liter)} l nachfüllen`}</p>
            {ergebnis.nurWasser ? (
              <p>Nur Wasser</p>
            ) : (
              Object.entries(ergebnis.mengen).map(([c, zehntel]) => (
                <p key={c}>{`${KOMPONENTE[c] ?? c} ${(zehntel / 10).toFixed(1)} ml`}</p>
              ))
            )}
            {ergebnis.hinweise
              .filter((h) => h.code !== 'nur_wasser')
              .map((h) => (
                <p key={h.code}>
                  <small>{h.text || HINWEIS[h.code]}</small>
                </p>
              ))}
          </div>
        ) : null
      ) : null}
      {zuViel ? <Notice kompakt tone="warn" title={zuViel} /> : null}
      <div className="hv-rundgang-fuss">
        <Button
          block
          disabled={sendet || liter === undefined || zuViel !== undefined}
          onClick={() => liter !== undefined && onNachgefuellt(liter, ergebnis)}
        >
          Nachgefüllt
        </Button>
      </div>
    </Rahmen>
  );
}

/** Nachfüllen Kratky (R4.10): Anzeige aus kratkyNachfuellen(), Menge in Litern über den Ziffernblock */
function KratkyNachfuellen({
  code,
  text,
  hoechstens,
  sendet,
  fehler,
  onNachgefuellt,
}: {
  code: string;
  text: string;
  hoechstens?: number;
  sendet: boolean;
  fehler: React.ReactNode;
  onNachgefuellt: (liter: number) => void;
}) {
  const [eingabe, setEingabe] = useState('');
  const liter = Number(eingabe);
  const zuViel = hoechstens !== undefined && liter > hoechstens;
  const tippen = (t: Taste) => setEingabe((alt) => literTippen(alt, t));
  return (
    <Rahmen titel={`${code} Nachfüllen Kratky`}>
      {fehler}
      <p className="hv-rundgang-ebene">{text}</p>
      {zuViel ? (
        <Notice kompakt tone="warn" title={`Höchstens ${String(hoechstens)} l, sonst fehlt die Luftzone`} />
      ) : null}
      <NumPad
        onTaste={tippen}
        echo={eingabe === '' ? 'Liter' : `${eingabe} l`}
        ohnePlusMinus
        speichern={
          <Button block disabled={sendet || !(liter > 0) || zuViel} onClick={() => onNachgefuellt(liter)}>
            Nachgefüllt
          </Button>
        }
      />
    </Rahmen>
  );
}
