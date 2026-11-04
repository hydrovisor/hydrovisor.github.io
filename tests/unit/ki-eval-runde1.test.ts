// Nachbesserungsrunde 1 zu I0-09 KI-Eval (Issue #14, Plan 14 A7; UC4-AK3, Konzept 8.2 bewertung_eval, 11.3).
// Festlegungen aus dem Prüferbefund:
//   1. defaultWaehlen(a) gibt '' zurück, wenn kein Modell M0 erfüllt (A7: ein Modell ohne M0 wird nie Default);
//      berichtMarkdown nennt dann «kein Default» und «M0».
//   2. Ein gescheiterter Lauf (texte === null) bewertet ALLE Felder der Tüte als «fehlend», auch Felder mit
//      Soll «nicht auf der Tüte».
//   3. berichtMarkdown führt gescheiterte Läufe mit Modell, Tüte und Fehlertext in einer Zeile auf.
//   4. hinweisVonHand('grenze') nennt das «Tageslimit» und nicht mehr «30 Tüten» (es zählen Requests).
//   5. Trockenlauf mit Fake-Rufer, der für ein Modell { art: 'fehler', status: 404 } liefert: Default ist das
//      andere Modell, der Bericht enthält «404».
// Fixtures wie tests/unit/ki-eval.test.ts: erfundene Referenz tests/fixtures/ki/referenz_beispiel.csv und
// aufgezeichnete Antworten tests/fixtures/ki/antworten/; die Claude API wird nie aufgerufen.
import { describe, expect, it } from 'vitest';
import {
  auswerten,
  berichtMarkdown,
  defaultWaehlen,
  referenzLesen,
  type Lauf,
  type Preise,
} from '../../src/domain/ki/eval.ts';
import { hinweisVonHand } from '../../src/domain/ki/uebernahme.ts';
import { KI_FELDER, type KiFeld } from '../../src/domain/ki/schema.ts';
import { evalAblauf } from '../../scripts/ki-eval/ablauf.ts';
import referenzRoh from '../fixtures/ki/referenz_beispiel.csv?raw';

const ZUERICH = 'Europe/Zurich';
const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const PREISE: Preise = {
  [SONNET]: { eingabeJeMio: 3, ausgabeJeMio: 15 },
  [HAIKU]: { eingabeJeMio: 1, ausgabeJeMio: 5 },
};
// 8.1.2027 10:00 Zürich
const STAND = new Date('2027-01-08T09:00:00.000Z');

type Texte = Record<KiFeld, string | null>;

const RICHTIG: Record<string, Texte> = {
  'sorte-eval-a': {
    name: 'Rote Probe',
    art: 'Lactuca sativa',
    keimart: 'licht',
    keimtemperatur: '15-20',
    keimdauer: '7-14',
    kulturdauer: '50-70',
    aussaatfenster: '3-8',
    hersteller: 'Beispiel Saaten',
  },
  'sorte-eval-b': {
    name: 'Gruene Welle',
    art: 'Basilikum',
    keimart: 'licht',
    keimtemperatur: '20-25',
    keimdauer: '5-10',
    kulturdauer: '60-80',
    aussaatfenster: null,
    hersteller: 'Beispiel Saaten',
  },
  'sorte-eval-c': {
    name: 'Kleine Sonne',
    art: 'Tomate',
    keimart: 'dunkel',
    keimtemperatur: '22-26',
    keimdauer: '7-14',
    kulturdauer: null,
    aussaatfenster: '2-4',
    hersteller: null,
  },
};
const TUETEN = Object.keys(RICHTIG);

function lauf(zeile: string, modell: string, aenderung: Partial<Texte> = {}, dauerMs = 5000): Lauf {
  const t = RICHTIG[zeile];
  if (!t) throw new Error(`unbekannte Tüte ${zeile}`);
  return {
    sorteZeileId: zeile,
    modell,
    texte: { ...t, ...aenderung },
    verworfen: [],
    dauerMs,
    eingabeTokens: 2000,
    ausgabeTokens: 300,
  };
}

function gescheitert(zeile: string, modell: string, fehler = 'fehler 404'): Lauf {
  return {
    sorteZeileId: zeile,
    modell,
    texte: null,
    verworfen: [],
    dauerMs: 800,
    eingabeTokens: 0,
    ausgabeTokens: 0,
    fehler,
  };
}

const referenz = () => referenzLesen(referenzRoh);

function modellAus(a: ReturnType<typeof auswerten>, modell: string) {
  const m = a.modelle.find((x) => x.modell === modell);
  if (!m) throw new Error(`Modell ${modell} fehlt in der Auswertung`);
  return m;
}

describe('UC4-AK3 (Auswertung) Runde 1: Default nur mit M0', () => {
  it('11.3 Default: kein Modell erfüllt M0 → defaultWaehlen gibt leeren Text zurück (A7)', () => {
    const a = auswerten(
      referenz(),
      [
        ...TUETEN.map((t) => lauf(t, SONNET, t === 'sorte-eval-a' ? { art: 'Spinat' } : {}, 8000)),
        ...TUETEN.map((t) => lauf(t, HAIKU, t === 'sorte-eval-c' ? { art: 'Paprika' } : {}, 3000)),
      ],
      PREISE,
    );
    expect(modellAus(a, SONNET).m0).toBe(false);
    expect(modellAus(a, HAIKU).m0).toBe(false);
    expect(defaultWaehlen(a)).toBe('');
  });

  it('UC4-AK3 (Auswertung) Bericht ohne M0-Modell nennt «kein Default» und «M0»', () => {
    const a = auswerten(
      referenz(),
      [
        ...TUETEN.map((t) => lauf(t, SONNET, t === 'sorte-eval-a' ? { art: 'Spinat' } : {})),
        ...TUETEN.map((t) => lauf(t, HAIKU, t === 'sorte-eval-c' ? { art: 'Paprika' } : {})),
      ],
      PREISE,
    );
    const md = berichtMarkdown(a, STAND, ZUERICH);
    expect(md).toContain('kein Default');
    expect(md).toContain('M0');
    expect(md).not.toMatch(new RegExp(`Default nach 11\\.3: (${SONNET}|${HAIKU})`));
  });
});

describe('UC4-AK3 (Auswertung) Runde 1: gescheiterte Läufe', () => {
  it('UC4-AK3 (Auswertung) gescheiterter Lauf → alle Felder fehlend, auch Soll «nicht auf der Tüte»', () => {
    const a = auswerten(
      referenz(),
      [lauf('sorte-eval-a', SONNET), gescheitert('sorte-eval-b', SONNET), lauf('sorte-eval-c', SONNET)],
      PREISE,
    );
    const s = modellAus(a, SONNET);
    const b = s.bewertungen['sorte-eval-b'];
    expect(b).toBeDefined();
    for (const feld of KI_FELDER) expect(b?.[feld], feld).toBe('fehlend');
    // sorte-eval-b hat aussaatfenster «nicht auf der Tüte»; zählt trotzdem nicht als richtig
    expect(b?.aussaatfenster).toBe('fehlend');
    expect(s.richtig).toBe(16);
    expect(s.felder).toBe(24);
    expect(s.m0).toBe(false);
  });

  it('UC4-AK3 (Auswertung) gescheiterter Lauf bei allen Tüten → richtig 0, M0 nicht erfüllt', () => {
    const a = auswerten(
      referenz(),
      TUETEN.map((t) => gescheitert(t, SONNET)),
      PREISE,
    );
    const s = modellAus(a, SONNET);
    expect(s.richtig).toBe(0);
    expect(s.quoteGesamt).toBe(0);
    expect(s.m0).toBe(false);
    expect(defaultWaehlen(a)).toBe('');
  });

  it('UC4-AK3 (Auswertung) Bericht führt gescheiterte Läufe mit Modell, Tüte und Fehlertext auf', () => {
    const a = auswerten(
      referenz(),
      [
        gescheitert('sorte-eval-a', SONNET),
        lauf('sorte-eval-b', SONNET),
        lauf('sorte-eval-c', SONNET),
        ...TUETEN.map((t) => lauf(t, HAIKU)),
      ],
      PREISE,
    );
    const zeilen = berichtMarkdown(a, STAND, ZUERICH).split(/\r?\n/);
    const treffer = zeilen.filter(
      (z) => z.includes(SONNET) && z.includes('sorte-eval-a') && z.includes('fehler 404'),
    );
    expect(treffer).toHaveLength(1);
    expect(zeilen.some((z) => z.includes(HAIKU) && z.includes('fehler 404'))).toBe(false);
  });
});

describe('UC4-AK3 (Auswertung) Runde 1: Hinweis bei Tagesgrenze', () => {
  it('11.3 hinweisVonHand(grenze) nennt das Tageslimit, nicht 30 Tüten', () => {
    const h = hinweisVonHand('grenze');
    expect(h).toContain('Tageslimit');
    expect(h).not.toContain('30 Tüten');
    expect(h).toContain('von Hand');
  });
});

describe('UC4-AK3 (Auswertung) Runde 1: Trockenlauf mit Fehler 404', () => {
  const antworten = import.meta.glob<string>('../fixtures/ki/antworten/*.json', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  type Block = { type?: string; text?: string; source?: { data?: string } };

  const ALLE_FOTOS = TUETEN.flatMap((t) => [`${t}-1.jpg`, `${t}-2.jpg`]);

  it('UC4-AK3 (Auswertung) Trockenlauf: Sonnet liefert 404 → Default Haiku, Bericht nennt 404', async () => {
    let uhr = STAND.getTime();
    const r = await evalAblauf({
      referenzCsv: referenzRoh,
      fotos: ALLE_FOTOS.map((name) => ({
        name,
        bytes: new TextEncoder().encode(name.replace(/\.jpg$/, '')),
      })),
      modelle: [SONNET, HAIKU],
      bildWandeln: async (bytes) => bytes,
      rufer: async (modell, anfrage) => {
        uhr += 1000;
        if (modell === SONNET) return { art: 'fehler', status: 404 };
        const inhalt = ((anfrage['messages'] as { content: Block[] }[])[0]?.content ?? []) as Block[];
        const bilder = inhalt.filter((b) => b.type === 'image').map((b) => atob(b.source?.data ?? ''));
        const zeile = (bilder[0] ?? '').replace(/-1$/, '');
        const roh = antworten[`../fixtures/ki/antworten/${zeile}.${modell}.json`];
        if (!roh) throw new Error(`Fixture ${zeile}.${modell} fehlt`);
        const body = JSON.parse(roh) as {
          content: Block[];
          usage: { input_tokens: number; output_tokens: number };
        };
        return {
          art: 'ok',
          text: body.content.find((b) => b.type === 'text')?.text ?? '',
          eingabeTokens: body.usage.input_tokens,
          ausgabeTokens: body.usage.output_tokens,
        };
      },
      zeit: { jetzt: () => new Date(uhr) },
      preise: PREISE,
      zeitzone: ZUERICH,
    });

    const s = modellAus(r.auswertung, SONNET);
    const h = modellAus(r.auswertung, HAIKU);
    expect(s.richtig).toBe(0);
    expect(s.m0).toBe(false);
    expect(h.m0).toBe(true);
    expect(r.defaultModell).toBe(HAIKU);
    expect(r.markdown).toContain('404');
    expect(
      r.markdown
        .split(/\r?\n/)
        .some((z) => z.includes(SONNET) && z.includes('sorte-eval-a') && z.includes('404')),
    ).toBe(true);
  });
});
