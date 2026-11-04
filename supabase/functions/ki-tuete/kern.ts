// Kern der Edge Function ki-tuete (UC4, Konzept 11.1, 11.3; 04_architektur.md 6; 01_fachregeln.md G2; Plan 14).
// Laufzeitneutral: Datenzugriff, Modell-Rufer und Uhr kommen als Abhängigkeiten; die Hülle index.ts verbindet sie.
// Ablauf: Hauptmodell mit Frist 20 s; bei 429, 5xx, Netzfehler oder Frist genau ein Versuch mit dem Ausweichmodell
// in der Restzeit bis 30 s; vor jedem Request die Tagesgrenze und eine Zeile ki_aufruf. Wirft nie (UC4-AK2).
import { anfrageBauen, type KiEingabe } from '../../../src/domain/ki/anfrage.ts';
import {
  AUFRUFE_JE_TAG,
  AUSWEICHMODELL,
  FRIST_GESAMT_MS,
  FRIST_HAUPT_MS,
  HAUPTMODELL,
  TEXT_MAX_ZEICHEN,
} from '../../../src/domain/ki/modelle.ts';
import { antwortPruefen } from '../../../src/domain/ki/schema.ts';
import { hinweisVonHand, type KiErgebnis, type VonHandGrund } from '../../../src/domain/ki/uebernahme.ts';
import { kalendertag, tagesbeginn, type Zeitzone } from '../../../src/domain/zeit.ts';

export type ModellAntwort =
  | { art: 'ok'; text: string; eingabeTokens: number; ausgabeTokens: number }
  | { art: 'ausweichen'; status?: number }
  | { art: 'fehler'; status?: number };

export type ModellRufer = (
  modell: string,
  anfrage: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<ModellAntwort>;

export interface Zeitgeber {
  jetzt(): Date;
  warten(ms: number, signal: AbortSignal): Promise<void>;
}

export type AufrufStatus = 'ok' | 'ausweichmodell' | 'fehler' | 'zeitueberschreitung';

export interface KiDaten {
  aufrufeSeit(ab: Date): Promise<number>;
  aufrufBeginnen(z: { modell: string; app_version: string }): Promise<string>;
  aufrufBeenden(id: string, z: { status: AufrufStatus; dauer_ms: number }): Promise<void>;
}

export interface Abhaengigkeiten {
  daten: KiDaten;
  modell: ModellRufer;
  zeit: Zeitgeber;
  zeitzone: Zeitzone;
}

const PFAD = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;

/** Körper der Anfrage prüfen (04-6): 1 bis 2 Pfade im Muster <sorte_id>/<uuid>.jpg oder Text bis 8000 Zeichen */
export function anfragePruefen(
  body: unknown,
): { fotopfade: string[]; appVersion: string } | { text: string; appVersion: string } | { fehler: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return { fehler: 'Körper fehlt' };
  const b = body as { fotopfade?: unknown; text?: unknown; app_version?: unknown };
  const appVersion =
    typeof b.app_version === 'string' && b.app_version.trim() !== ''
      ? b.app_version.trim().slice(0, 40)
      : 'ki-tuete';
  if (b.fotopfade !== undefined) {
    const p = b.fotopfade;
    if (!Array.isArray(p) || p.length < 1 || p.length > 2) return { fehler: 'fotopfade: 1 bis 2 Pfade' };
    if (!p.every((x): x is string => typeof x === 'string' && PFAD.test(x) && !x.includes('..')))
      return { fehler: 'fotopfade: Muster <sorte_id>/<uuid>.jpg' };
    return { fotopfade: [...p], appVersion };
  }
  if (typeof b.text === 'string' && b.text.trim() !== '' && b.text.length <= TEXT_MAX_ZEICHEN)
    return { text: b.text, appVersion };
  return { fehler: `fotopfade oder text (1 bis ${TEXT_MAX_ZEICHEN} Zeichen)` };
}

type Versuch = ModellAntwort | { art: 'zeit' };

/** Ein Request gegen eine Frist; die Frist bricht den Request ab, eine Antwort bricht das Warten ab */
async function versuch(
  abh: Abhaengigkeiten,
  modell: string,
  eingabe: KiEingabe,
  frist: number,
): Promise<Versuch> {
  const ruf = new AbortController();
  const uhr = new AbortController();
  const antwort = Promise.resolve()
    .then(() => abh.modell(modell, anfrageBauen(eingabe, modell), ruf.signal))
    .then(
      (a) => ({ fertig: 'antwort' as const, a }),
      () => ({ fertig: 'antwort' as const, a: { art: 'ausweichen' } as ModellAntwort }),
    );
  const ablauf = abh.zeit.warten(frist, uhr.signal).then(() => ({ fertig: 'frist' as const }));
  const erstes = await Promise.race([antwort, ablauf]);
  if (erstes.fertig === 'antwort') {
    uhr.abort();
    return erstes.a;
  }
  ruf.abort();
  return { art: 'zeit' };
}

export async function tueteLesen(
  eingabe: KiEingabe,
  appVersion: string,
  abh: Abhaengigkeiten,
): Promise<KiErgebnis> {
  const start = abh.zeit.jetzt();
  const seit = () => abh.zeit.jetzt().getTime() - start.getTime();
  const vonHand = (grund: VonHandGrund): KiErgebnis => ({
    ergebnis: 'von_hand',
    grund,
    hinweis: hinweisVonHand(grund),
    dauerMs: seit(),
  });
  try {
    const ab = tagesbeginn(kalendertag(start, abh.zeitzone), abh.zeitzone);
    const beenden = async (id: string, status: AufrufStatus, beginn: number) => {
      try {
        await abh.daten.aufrufBeenden(id, { status, dauer_ms: seit() - beginn });
      } catch {
        // Endstatus fehlt dann; das Ergebnis für Tim zählt mehr (UC4-AK2)
      }
    };

    const laeufe: { modell: string; ausweich: boolean }[] = [
      { modell: HAUPTMODELL, ausweich: false },
      { modell: AUSWEICHMODELL, ausweich: true },
    ];
    let letzterGrund: VonHandGrund = 'fehler';
    for (const { modell, ausweich } of laeufe) {
      if (seit() >= FRIST_GESAMT_MS) return vonHand('zeit');
      if ((await abh.daten.aufrufeSeit(ab)) >= AUFRUFE_JE_TAG) return vonHand('grenze');
      const beginn = seit();
      const id = await abh.daten.aufrufBeginnen({ modell, app_version: appVersion });
      // Restzeit erst nach den Datenbankaufrufen, damit die Gesamtfrist von 30 s hält (Prüferbefund 3)
      const rest = Math.max(0, FRIST_GESAMT_MS - seit());
      const r = await versuch(abh, modell, eingabe, ausweich ? rest : Math.min(FRIST_HAUPT_MS, rest));

      if (r.art === 'ok') {
        const p = antwortPruefen(r.text);
        if (!p.ok) {
          await beenden(id, 'fehler', beginn);
          return vonHand('ungueltig');
        }
        await beenden(id, ausweich ? 'ausweichmodell' : 'ok', beginn);
        return {
          ergebnis: 'ok',
          modell,
          felder: p.felder,
          verworfen: p.verworfen,
          dauerMs: seit(),
          ausweichmodell: ausweich,
        };
      }
      if (r.art === 'zeit') {
        await beenden(id, 'zeitueberschreitung', beginn);
        letzterGrund = 'zeit';
        continue;
      }
      await beenden(id, 'fehler', beginn);
      letzterGrund = 'fehler';
      if (r.art === 'fehler') return vonHand('fehler');
    }
    return vonHand(letzterGrund);
  } catch {
    return vonHand('fehler');
  }
}
