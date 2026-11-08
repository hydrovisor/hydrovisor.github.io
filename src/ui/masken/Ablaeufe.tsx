// Laufende Abläufe oben in Heute (Plan 29; Loesungswechsel-AK3, Rundgang-AK3, A17): je offenem Wechsel und je offener
// Nachmessung eine Zeile mit «Fortsetzen» bzw. «Messen». Quelle: Speicher «ablaeufe» und das Bündel (Gerätewechsel).
// Wechselblock (R5.6, Plan 139): bilden 2 oder 3 laufende oder fällige Ansätze einer Anlage einen Block, stehen ihre
// Zeilen im Abschnitt «Wechselblock» mit «Nächster Schritt» oben; laufende behalten ihre Zeile «Wechsel läuft» (A9).
import { useEffect, useState } from 'react';
import { ablaufLoeschen, offeneAblaeufe, type AblaufEintrag } from '../../ablauf/speicher.ts';
import {
  blockText,
  buendelZeile,
  naechsterText,
  wechselblock,
  type Wechselblock,
} from '../../domain/abhakliste/block.ts';
import { laufendeAnsaetze, offeneNachmessungen } from '../../domain/abhakliste/folgen.ts';
import { aktiveZeile, timerEnde, type AblaufStand } from '../../domain/abhakliste/stand.ts';
import type { Aufgabe } from '../../domain/aufgaben.ts';
import type { AnsatzZeile } from '../../domain/bewertung/verlauf.ts';
import { messbareOrte } from '../../domain/ort.ts';
import { fortschritt, standGueltig, type RundgangStand } from '../../domain/rundgang/ablauf.ts';
import { uhrzeit, ZEITZONE } from '../../domain/zeit.ts';
import { Button } from '../bausteine/Button.tsx';
import { useBuendel } from '../buendel.tsx';
import { hashZu } from '../router.ts';
import '../ansatz.css';

const TAG_MS = 24 * 60 * 60 * 1000;

interface Eintrag {
  schluessel: string;
  text: string;
  ziel: string;
  knopf: 'Fortsetzen' | 'Messen' | 'Beginnen';
  lokalId?: string;
  alt: boolean;
  /** Platz eines Wechsels, für die Zuordnung zum Block */
  platzId?: string;
}

/** «Zeile 7 Grow», «Zeile 11 · weiter ab 19:02», «Zeile 14 · messen ab 19:12» (Use Case Lösungswechsel) */
function wasAktiv(s: AblaufStand, nr: number | undefined): string {
  if (nr === undefined) return 'Zeile 17';
  const z = s.zeilen.find((x) => x.nr === nr);
  const ende = timerEnde(s, nr);
  if (ende) return `Zeile ${String(nr)} · weiter ab ${uhrzeit(ende, ZEITZONE)}`;
  const vor = timerEnde(s, nr - 1);
  if ((nr === 14 || nr === 17) && vor) return `Zeile ${String(nr)} · messen ab ${uhrzeit(vor, ZEITZONE)}`;
  return z?.zugabe ? `Zeile ${String(nr)} ${z.zugabe}` : `Zeile ${String(nr)}`;
}

export function Ablaeufe({ jetzt, faellig = [] }: { jetzt: Date; faellig?: readonly Aufgabe[] }) {
  const { buendel } = useBuendel();
  const [lokal, setLokal] = useState<AblaufEintrag[]>([]);
  const [stand, setStand] = useState(0);
  useEffect(() => {
    let aktiv = true;
    const lesen = () =>
      offeneAblaeufe().then(
        (e) => {
          // Rundgang von gestern gilt nicht mehr und blockiert sonst den Versionshinweis (Plan 30 A6)
          const alt = e.filter(
            (x) => x.art === 'rundgang' && !standGueltig(x as unknown as RundgangStand, new Date(), ZEITZONE),
          );
          for (const x of alt) void ablaufLoeschen(x.id).catch(() => undefined);
          if (aktiv) setLokal(e.filter((x) => !alt.includes(x)));
        },
        () => undefined,
      );
    void lesen();
    const beiSichtbar = () => document.visibilityState === 'visible' && void lesen();
    document.addEventListener('visibilitychange', beiSichtbar);
    return () => {
      aktiv = false;
      document.removeEventListener('visibilitychange', beiSichtbar);
    };
  }, [stand]);

  const teile = buendel?.teile ?? {};
  const orte = messbareOrte(teile);
  const codeVon = (platzId: string) => orte.find((o) => o.platzId === platzId);
  const eintraege: Eintrag[] = [];
  const wechselOrte = new Set<string>();

  for (const e of lokal) {
    if (e.art !== 'abhakliste' || !e.platzId) continue;
    const s = e as unknown as AblaufStand;
    const ort = codeVon(s.platzId);
    const code = ort?.code ?? s.code;
    wechselOrte.add(s.platzId);
    const nr = aktiveZeile(s);
    eintraege.push({
      schluessel: e.id,
      text: `${ort?.kennung ?? code} Wechsel läuft · ${wasAktiv(s, nr)}`,
      ziel: hashZu({ name: 'ansatz', code }),
      knopf: 'Fortsetzen',
      lokalId: e.id,
      alt: jetzt.getTime() - Date.parse(s.letzteAktionAm) > TAG_MS,
      platzId: s.platzId,
    });
  }
  const ansaetze = (teile['naehrloesungsansatz'] ?? []) as (AnsatzZeile & { timer_ende?: string | null })[];
  const schritte = (teile['ansatz_schritt'] ?? []) as Parameters<typeof laufendeAnsaetze>[1];
  for (const l of laufendeAnsaetze(ansaetze, schritte)) {
    if (wechselOrte.has(l.platzId)) continue;
    const ort = codeVon(l.platzId);
    if (!ort) continue;
    const { zeile: naechste, timerEnde: ende } = buendelZeile(
      l.schritte,
      ansaetze.find((a) => a.id === l.ansatzId)?.timer_ende,
    );
    const weiter = ende ? ` · weiter ab ${uhrzeit(new Date(ende), ZEITZONE)}` : '';
    eintraege.push({
      schluessel: `buendel:${l.ansatzId}`,
      text: `${ort.kennung} Wechsel läuft · Zeile ${String(naechste)}${weiter}`,
      ziel: hashZu({ name: 'ansatz', code: ort.code }),
      knopf: 'Fortsetzen',
      alt: false,
      platzId: l.platzId,
    });
  }
  // Rundgang (Plan 30): offener Stand von heute mit «Fortsetzen»; ein Stand von gestern gilt nicht mehr (A6)
  for (const e of lokal) {
    if (e.art !== 'rundgang') continue;
    const r = e as unknown as RundgangStand;
    if (r.schritt.art === 'abschluss' || !standGueltig(r, jetzt, ZEITZONE)) continue;
    const kuerzel = (teile['anlage'] ?? []).find((a) => (a as { id?: string }).id === r.anlageId) as
      { kuerzel?: string } | undefined;
    if (!kuerzel?.kuerzel) continue;
    const f = fortschritt(r);
    eintraege.push({
      schluessel: e.id,
      text: `Rundgang läuft · ${String(f.fertig)} von ${String(f.von)}`,
      ziel: hashZu({ name: 'rundgang', kuerzel: kuerzel.kuerzel }),
      knopf: 'Fortsetzen',
      lokalId: e.id,
      alt: false,
    });
  }
  // Nachmessen: aus dem Bündel und aus dem lokalen Eintrag, je Ansatz einmal
  const messungen = (teile['messung'] ?? []) as Parameters<typeof offeneNachmessungen>[1];
  const nachmessen = new Map<string, { platzId: string; faelligAb: string; lokalId?: string }>();
  for (const n of offeneNachmessungen(ansaetze, messungen, jetzt)) nachmessen.set(n.ansatzId, n);
  for (const e of lokal) {
    if (e.art !== 'nachmessen' || !e.platzId || typeof e['ansatzId'] !== 'string') continue;
    const erledigt = messungen.some(
      (m) => m.messart === 'nachmessen' && m.ansatz_id === e['ansatzId'] && m.storniert_am === null,
    );
    if (!erledigt)
      nachmessen.set(e['ansatzId'], {
        platzId: e.platzId,
        faelligAb: String(e['faelligAb']),
        lokalId: e.id,
      });
  }
  for (const [ansatzId, n] of nachmessen) {
    const ort = codeVon(n.platzId);
    if (!ort) continue;
    eintraege.push({
      schluessel: `nachmessen:${ansatzId}`,
      text: `${ort.kennung} Nachmessen ab ${uhrzeit(new Date(n.faelligAb), ZEITZONE)}`,
      ziel: hashZu({ name: 'messen', code: ort.code, nachmessen: ansatzId }),
      knopf: 'Messen',
      ...(n.lokalId ? { lokalId: n.lokalId } : {}),
      // ab 24 h auch hier «Abbrechen», sonst blockiert der Eintrag den Versionshinweis (Risiko 4)
      alt: jetzt.getTime() - Date.parse(n.faelligAb) > TAG_MS,
    });
  }
  const bloecke = wechselblock(
    {
      teile,
      aufgaben: faellig,
      lokal: lokal.filter((e) => e.art === 'abhakliste' && e.platzId) as unknown as AblaufStand[],
    },
    jetzt,
    ZEITZONE,
  );
  const imBlock = new Set(bloecke.flatMap((b) => b.glieder.map((g) => g.platzId)));
  const uebrige = eintraege.filter((e) => !e.platzId || !imBlock.has(e.platzId));
  const blockZeilen = (b: Wechselblock): Eintrag[] =>
    b.glieder.map(
      (g) =>
        eintraege.find((e) => e.platzId === g.platzId) ?? {
          schluessel: `block:${g.platzId}`,
          text: blockText(g, ZEITZONE),
          ziel: hashZu({ name: 'ansatz', code: g.code }),
          knopf: 'Beginnen',
          alt: false,
          platzId: g.platzId,
        },
    );
  if (uebrige.length === 0 && bloecke.length === 0) return null;
  return (
    <>
      {bloecke.map((b) => {
        const kopf = naechsterText(b.naechster, ZEITZONE);
        return (
          <section key={b.anlageId} className="hv-block" aria-label="Wechselblock">
            {kopf ? (
              <div className="hv-ablauf-zeile hv-block-naechster">
                <span className="hv-ablauf-text hv-num">{kopf}</span>
                {b.naechster.art === 'schritt' ? (
                  <a
                    className="hv-btn hv-btn-primary"
                    href={hashZu({ name: 'ansatz', code: b.naechster.code })}
                  >
                    Weiter
                  </a>
                ) : null}
              </div>
            ) : null}
            <ul className="hv-block-glieder">
              {blockZeilen(b).map((e) => (
                <li key={e.schluessel}>
                  <a className="hv-btn hv-btn-secondary hv-btn-zweizeilig hv-btn-block" href={e.ziel}>
                    {e.knopf}
                    <small className="hv-num">{e.text}</small>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {uebrige.length > 0 ? (
        <ul className="hv-ablaeufe" aria-label="Laufende Abläufe">
          {uebrige.map(zeile)}
        </ul>
      ) : null}
    </>
  );

  function zeile(e: Eintrag) {
    return (
      <li key={e.schluessel} className="hv-ablauf-zeile">
        <span className="hv-ablauf-text hv-num">{e.text}</span>
        <a className="hv-btn hv-btn-primary hv-btn-compact" href={e.ziel}>
          {e.knopf}
        </a>
        {e.alt && e.lokalId ? (
          <Button
            variant="ghost"
            size="compact"
            onClick={() => {
              void ablaufLoeschen(e.lokalId as string).then(() => setStand((x) => x + 1));
            }}
          >
            Abbrechen
          </Button>
        ) : null}
      </li>
    );
  }
}
