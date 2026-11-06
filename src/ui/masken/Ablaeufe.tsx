// Laufende Abläufe oben in Heute (Plan 29; Loesungswechsel-AK3, Rundgang-AK3, A17): je offenem Wechsel und je offener
// Nachmessung eine Zeile mit «Fortsetzen» bzw. «Messen». Quelle: Speicher «ablaeufe» und das Bündel (Gerätewechsel).
import { useEffect, useState } from 'react';
import { ablaufLoeschen, offeneAblaeufe, type AblaufEintrag } from '../../ablauf/speicher.ts';
import { laufendeAnsaetze, offeneNachmessungen } from '../../domain/abhakliste/folgen.ts';
import { aktiveZeile, timerEnde, type AblaufStand } from '../../domain/abhakliste/stand.ts';
import type { AnsatzZeile } from '../../domain/bewertung/verlauf.ts';
import { messbareOrte } from '../../domain/ort.ts';
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
  knopf: 'Fortsetzen' | 'Messen';
  lokalId?: string;
  alt: boolean;
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

export function Ablaeufe({ jetzt }: { jetzt: Date }) {
  const { buendel } = useBuendel();
  const [lokal, setLokal] = useState<AblaufEintrag[]>([]);
  const [stand, setStand] = useState(0);
  useEffect(() => {
    let aktiv = true;
    const lesen = () =>
      offeneAblaeufe().then(
        (e) => aktiv && setLokal(e),
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
    });
  }
  const ansaetze = (teile['naehrloesungsansatz'] ?? []) as (AnsatzZeile & { timer_ende?: string | null })[];
  const schritte = (teile['ansatz_schritt'] ?? []) as Parameters<typeof laufendeAnsaetze>[1];
  for (const l of laufendeAnsaetze(ansaetze, schritte)) {
    if (wechselOrte.has(l.platzId)) continue;
    const ort = codeVon(l.platzId);
    if (!ort) continue;
    const naechste = Math.min(17, Math.max(...l.schritte.map((x) => x.nr)) + 1);
    eintraege.push({
      schluessel: `buendel:${l.ansatzId}`,
      text: `${ort.kennung} Wechsel läuft · Zeile ${String(naechste)}`,
      ziel: hashZu({ name: 'ansatz', code: ort.code }),
      knopf: 'Fortsetzen',
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
  if (eintraege.length === 0) return null;
  return (
    <ul className="hv-ablaeufe" aria-label="Laufende Abläufe">
      {eintraege.map((e) => (
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
      ))}
    </ul>
  );
}
