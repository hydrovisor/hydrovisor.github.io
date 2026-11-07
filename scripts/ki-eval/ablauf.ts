// Ablauf des KI-Eval ohne Node-Abhängigkeit (UC4-AK3, Konzept 11.3, 12.6; Plan 14). Die Hülle scripts/ki-eval.ts
// liest Dateien und Umgebung; hier je Tüte und Modell genau ein Aufruf ohne Ausweichen, dann Auswertung und Bericht.
import { anfrageBauen } from '../../src/domain/ki/anfrage.ts';
import {
  auswerten,
  berichtMarkdown,
  defaultWaehlen,
  referenzLesen,
  type Auswertung,
  type Lauf,
  type Preise,
} from '../../src/domain/ki/eval.ts';
import { FRIST_GESAMT_MS } from '../../src/domain/ki/modelle.ts';
import { KI_FELDER, antwortPruefen, feldTexte } from '../../src/domain/ki/schema.ts';
import type { ModellRufer } from '../../supabase/functions/ki-tuete/kern.ts';

export interface EvalEingabe {
  referenzCsv: string;
  fotos: readonly { name: string; bytes: Uint8Array }[];
  modelle: readonly string[];
  rufer: ModellRufer;
  bildWandeln: (bytes: Uint8Array) => Promise<Uint8Array>;
  zeit: { jetzt(): Date };
  preise: Preise;
  zeitzone: string;
}

const FOTO = /^(.+)-([12])\.(jpe?g|png)$/i;

function base64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
}

/** Fotos je Tüte: <zeile_id>-1 (Vorderseite) und -2 (Rückseite) */
export function fotosJeTuete(fotos: EvalEingabe['fotos']): Map<string, Uint8Array[]> {
  const je = new Map<string, Map<number, Uint8Array>>();
  for (const f of fotos) {
    const m = FOTO.exec(f.name);
    if (!m) continue;
    const id = m[1] ?? '';
    const seiten = je.get(id) ?? new Map<number, Uint8Array>();
    seiten.set(Number(m[2]), f.bytes);
    je.set(id, seiten);
  }
  return new Map(
    [...je.keys()].sort().map((id) => {
      const seiten = je.get(id) ?? new Map<number, Uint8Array>();
      return [id, [...seiten.keys()].sort().map((s) => seiten.get(s) ?? new Uint8Array())];
    }),
  );
}

/** Voraussetzungen vor jedem Lauf; Meldungen einzeilig ohne Stapelspur (Plan 37) */
export function evalVoraussetzungen(e: {
  referenzPfad: string;
  referenzVorhanden: boolean;
  fotoPfad: string;
  fotos: readonly string[] | undefined;
}): { ok: true; tueten: number } | { ok: false; meldung: string } {
  if (!e.referenzVorhanden) return { ok: false, meldung: `Referenzdatei fehlt: ${e.referenzPfad}` };
  if (e.fotos === undefined) return { ok: false, meldung: `Fotoordner fehlt: ${e.fotoPfad}` };
  const tueten = fotosJeTuete(e.fotos.map((name) => ({ name, bytes: new Uint8Array() }))).size;
  if (tueten === 0)
    return { ok: false, meldung: `Keine Fotos <zeile_id>-1.jpg und <zeile_id>-2.jpg in ${e.fotoPfad}` };
  return { ok: true, tueten };
}

export async function evalAblauf(
  e: EvalEingabe,
): Promise<{ auswertung: Auswertung; defaultModell: string; markdown: string }> {
  const referenz = referenzLesen(e.referenzCsv);
  const tueten = fotosJeTuete(e.fotos);
  if (tueten.size === 0) throw new Error('Keine Fotos <zeile_id>-1.jpg und <zeile_id>-2.jpg gefunden');
  // Vor dem ersten Aufruf: jede Tüte mit Fotos braucht alle acht Felder in der Referenz
  for (const id of tueten.keys()) {
    const fehlend = KI_FELDER.filter((f) => !referenz.some((r) => r.sorteZeileId === id && r.feld === f));
    if (fehlend.length > 0) throw new Error(`Referenz für ${id} unvollständig: ${fehlend.join(', ')}`);
  }

  const laeufe: Lauf[] = [];
  for (const [id, seiten] of tueten) {
    const bilder: { base64: string }[] = [];
    for (const s of seiten) bilder.push({ base64: base64(await e.bildWandeln(s)) });
    for (const modell of e.modelle) {
      const start = e.zeit.jetzt().getTime();
      const lauf: Lauf = {
        sorteZeileId: id,
        modell,
        texte: null,
        verworfen: [],
        dauerMs: 0,
        eingabeTokens: 0,
        ausgabeTokens: 0,
      };
      try {
        const a = await e.rufer(
          modell,
          anfrageBauen({ art: 'bilder', bilder }, modell),
          AbortSignal.timeout(FRIST_GESAMT_MS),
        );
        if (a.art === 'ok') {
          lauf.eingabeTokens = a.eingabeTokens;
          lauf.ausgabeTokens = a.ausgabeTokens;
          const p = antwortPruefen(a.text);
          if (p.ok) {
            lauf.texte = feldTexte(p.felder);
            lauf.verworfen = p.verworfen;
          } else lauf.fehler = p.grund;
        } else lauf.fehler = `${a.art}${a.status === undefined ? '' : ` ${a.status}`}`;
      } catch (f) {
        lauf.fehler = f instanceof Error ? f.message : String(f);
      }
      lauf.dauerMs = e.zeit.jetzt().getTime() - start;
      laeufe.push(lauf);
    }
  }

  const auswertung = auswerten(referenz, laeufe, e.preise);
  return {
    auswertung,
    defaultModell: defaultWaehlen(auswertung),
    markdown: berichtMarkdown(auswertung, e.zeit.jetzt(), e.zeitzone),
  };
}
