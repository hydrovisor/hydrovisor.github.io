// Auswertung des KI-Eval (Issue #14, Plan 14 Testliste; UC4-AK3, Konzept 8.2 bewertung_eval, 11.3 Default,
// 12.6, 13.5 M0). Der echte Lauf mit der Claude API ist [Eval] und läuft nur an Tims PC; hier nur die
// Auswertungslogik und ein Trockenlauf mit Fake-Rufer, Fake-Bildwandler und virtueller Uhr.
// Fixtures: tests/fixtures/ki/referenz_beispiel.csv (drei erfundene Tüten) und tests/fixtures/ki/antworten/
// (aufgezeichnete Antwortkörper <zeile_id>.<modell>.json). Die Referenzdatei data/eval/ wird nie gelesen.
//
// Vorausgesetzt (Plan 14, Schnittstellen; offen gelassene Teile hier festgelegt):
//   src/domain/ki/eval.ts
//     Bewertung, NICHT_AUF_DER_TUETE, Referenzzeile, Lauf, Preise, referenzLesen(csv), normalform(feld, wert),
//     feldBewerten(feld, soll, ist), auswerten(referenz, laeufe, preise), defaultWaehlen(a),
//     berichtMarkdown(a, stand, zeitzone)
//     referenzLesen: Fehlermeldung nennt die Zeilennummer der Datei (Kopf = Zeile 1).
//     interface Auswertung {
//       tueten: string[];                    // sorteZeileId der Läufe in der Reihenfolge des ersten Auftretens
//       modelle: ModellAuswertung[];         // Reihenfolge des ersten Auftretens in laeufe
//     }
//     interface ModellAuswertung {
//       modell: string;
//       bewertungen: Record<string, Record<KiFeld, Bewertung>>;   // je sorteZeileId
//       richtig: number; felder: number;     // Anzahl richtig, Anzahl bewertet (nur Tüten der Läufe)
//       quoteGesamt: number;                 // richtig / felder, Anteil 0..1
//       quoteJeFeld: Record<KiFeld, number>; // Anteil 0..1 über die Tüten
//       schwelle80: Record<KiFeld, boolean>; // quoteJeFeld >= 0.8
//       m0: boolean;                         // name, art, keimart bei allen Tüten richtig
//       dauerMedianMs: number; dauerMaxMs: number;
//       kostenJeTueteUsd: number;            // Mittel über die Tüten: (ein × eingabeJeMio + aus × ausgabeJeMio) / 1e6
//     }
//     berichtMarkdown: erste Zeile beginnt mit «UC4-AK3 [Eval]», Stand als Datum in der Zeitzone (T.M.JJJJ),
//     Warnung (Wort «Warnung») bei Kosten je Tüte über 0.05 USD.
//   scripts/ki-eval/ablauf.ts (ohne Node-Abhängigkeit; die Hülle scripts/ki-eval.ts liest Dateien und Umgebung)
//     evalAblauf(e: {
//       referenzCsv: string;
//       fotos: readonly { name: string; bytes: Uint8Array }[];   // <zeile_id>-1.jpg, <zeile_id>-2.jpg
//       modelle: readonly string[];
//       rufer: ModellRufer;                                      // aus supabase/functions/ki-tuete/kern.ts
//       bildWandeln: (bytes: Uint8Array) => Promise<Uint8Array>; // Canvas-Verkleinerung, im Test Fake
//       zeit: { jetzt(): Date };
//       preise: Preise;
//       zeitzone: string;
//     }): Promise<{ auswertung: Auswertung; defaultModell: string; markdown: string }>
//     Je Tüte und Modell genau ein Aufruf mit anfrageBauen({ art: 'bilder', bilder: [Seite 1, Seite 2] }, modell),
//     ohne Ausweichen; dauerMs aus zeit.jetzt(). Fehlt zu einer Tüte mit Fotos die Referenz oder ein Feld der
//     Referenz, bricht der Ablauf vor dem ersten Aufruf mit einem Fehler ab, der die zeile_id nennt.
import { describe, expect, it } from 'vitest';
import {
  NICHT_AUF_DER_TUETE,
  auswerten,
  berichtMarkdown,
  defaultWaehlen,
  feldBewerten,
  normalform,
  referenzLesen,
  type Lauf,
  type Preise,
} from '../../src/domain/ki/eval.ts';
import type { KiFeld } from '../../src/domain/ki/schema.ts';
import { evalAblauf } from '../../scripts/ki-eval/ablauf.ts';
import referenzRoh from '../fixtures/ki/referenz_beispiel.csv?raw';

const ZUERICH = 'Europe/Zurich';
const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const PREISE: Preise = {
  [SONNET]: { eingabeJeMio: 3, ausgabeJeMio: 15 },
  [HAIKU]: { eingabeJeMio: 1, ausgabeJeMio: 5 },
};

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

function texte(zeile: string, aenderung: Partial<Texte> = {}): Texte {
  const t = RICHTIG[zeile];
  if (!t) throw new Error(`unbekannte Tüte ${zeile}`);
  return { ...t, ...aenderung };
}

function lauf(
  zeile: string,
  modell: string,
  aenderung: Partial<Texte> = {},
  weiter: { dauerMs?: number; ein?: number; aus?: number } = {},
): Lauf {
  return {
    sorteZeileId: zeile,
    modell,
    texte: texte(zeile, aenderung),
    verworfen: [],
    dauerMs: weiter.dauerMs ?? 5000,
    eingabeTokens: weiter.ein ?? 2000,
    ausgabeTokens: weiter.aus ?? 300,
  };
}

const referenz = () => referenzLesen(referenzRoh);

function modellAus(a: ReturnType<typeof auswerten>, modell: string) {
  const m = a.modelle.find((x) => x.modell === modell);
  if (!m) throw new Error(`Modell ${modell} fehlt in der Auswertung`);
  return m;
}

describe('UC4-AK3 (Auswertung) Bewertung je Feld', () => {
  it('UC4-AK3 (Auswertung) nicht auf der Tüte und null → richtig; Wert → erfunden', () => {
    expect(NICHT_AUF_DER_TUETE).toBe('nicht auf der Tüte');
    expect(feldBewerten('hersteller', NICHT_AUF_DER_TUETE, null)).toBe('richtig');
    expect(feldBewerten('aussaatfenster', NICHT_AUF_DER_TUETE, '4-9')).toBe('erfunden');
    expect(feldBewerten('kulturdauer', 'Nicht auf der Tüte', null)).toBe('richtig');
  });

  it('UC4-AK3 (Auswertung) Soll mit Wert und null → fehlend; anderer Wert → falsch', () => {
    expect(feldBewerten('name', 'Rote Probe', null)).toBe('fehlend');
    expect(feldBewerten('name', 'Rote Probe', 'Rote Perle')).toBe('falsch');
    expect(feldBewerten('keimdauer', '7-14', '7-10')).toBe('falsch');
    expect(feldBewerten('name', 'Rote Probe', 'Rote Probe')).toBe('richtig');
  });

  it('UC4-AK3 (Auswertung) Normalform: «Dunkelkeimer» gegen «dunkel», «18 bis 22 °C» gegen «18-22», Umlaute, Alternativen mit |', () => {
    expect(feldBewerten('keimart', 'Dunkelkeimer', 'dunkel')).toBe('richtig');
    expect(feldBewerten('keimart', 'Lichtkeimer', 'licht')).toBe('richtig');
    expect(feldBewerten('keimart', 'Lichtkeimer', 'dunkel')).toBe('falsch');
    expect(normalform('keimart', 'Dunkelkeimer')).toBe(normalform('keimart', 'dunkel'));
    expect(feldBewerten('keimtemperatur', '18 bis 22 °C', '18-22')).toBe('richtig');
    expect(feldBewerten('keimdauer', '5 bis 10 Tage', '5-10')).toBe('richtig');
    expect(feldBewerten('keimtemperatur', '18 bis 22 °C', '18-24')).toBe('falsch');
    expect(normalform('keimtemperatur', '18 bis 22 °C')).toBe(normalform('keimtemperatur', '18-22'));
    expect(feldBewerten('name', 'Grüne Welle', 'Gruene Welle')).toBe('richtig');
    expect(feldBewerten('name', 'Grüne Welle', 'grüne welle.')).toBe('richtig');
    expect(feldBewerten('hersteller', 'Strauß Saaten', 'Strauss Saaten')).toBe('richtig');
    expect(normalform('name', 'Grüne Welle')).toBe(normalform('name', 'GRUENE  WELLE'));
    expect(feldBewerten('art', 'Salat|Lactuca sativa', 'Lactuca sativa')).toBe('richtig');
    expect(feldBewerten('art', 'Salat|Lactuca sativa', 'Salat')).toBe('richtig');
    expect(feldBewerten('art', 'Salat|Lactuca sativa', 'Rucola')).toBe('falsch');
    expect(feldBewerten('art', 'Salat|Lactuca sativa', null)).toBe('fehlend');
  });

  it('UC4-AK3 (Auswertung) referenzLesen: unbekanntes Feld und doppelte Zeile mit Zeilennummer abgelehnt', () => {
    const r = referenz();
    expect(r).toHaveLength(24);
    expect(r[0]).toEqual({ sorteZeileId: 'sorte-eval-a', feld: 'name', soll: 'Rote Probe' });
    expect(r).toContainEqual({ sorteZeileId: 'sorte-eval-a', feld: 'art', soll: 'Salat|Lactuca sativa' });
    expect(r).toContainEqual({ sorteZeileId: 'sorte-eval-c', feld: 'hersteller', soll: NICHT_AUF_DER_TUETE });

    const kopf = 'sorte_zeile_id,feld,soll';
    expect(() =>
      referenzLesen([kopf, 'sorte-eval-a,name,Rote Probe', 'sorte-eval-a,ph,6.0'].join('\n')),
    ).toThrow(/\b3\b/);
    expect(() =>
      referenzLesen(
        [kopf, 'sorte-eval-a,name,Rote Probe', 'sorte-eval-a,art,Salat', 'sorte-eval-a,name,Rote Perle'].join(
          '\r\n',
        ),
      ),
    ).toThrow(/\b4\b/);
  });
});

describe('UC4-AK3 (Auswertung) Quoten, M0, Default', () => {
  it('UC4-AK3 (Auswertung) M0: name, art, keimart bei 3 von 3 richtig → erfüllt; eine falsche Art → nicht erfüllt', () => {
    const laeufe = [
      ...TUETEN.map((t) => lauf(t, SONNET, t === 'sorte-eval-a' ? { kulturdauer: '40-60' } : {})),
      ...TUETEN.map((t) => lauf(t, HAIKU, t === 'sorte-eval-c' ? { art: 'Paprika' } : {})),
    ];
    const a = auswerten(referenz(), laeufe, PREISE);
    expect(a.tueten).toEqual(TUETEN);
    expect(modellAus(a, SONNET).m0).toBe(true);
    expect(modellAus(a, HAIKU).m0).toBe(false);
    expect(modellAus(a, HAIKU).bewertungen['sorte-eval-c']?.art).toBe('falsch');

    const fehlendeKeimart = auswerten(
      referenz(),
      TUETEN.map((t) => lauf(t, SONNET, t === 'sorte-eval-b' ? { keimart: null } : {})),
      PREISE,
    );
    expect(modellAus(fehlendeKeimart, SONNET).m0).toBe(false);
  });

  it('UC4-AK3 (Auswertung) Trefferquote je Feld, Schwelle 80 %, Kosten je Tüte aus Token und Preisen', () => {
    const kopfUndD = [
      referenzRoh.trimEnd(),
      'sorte-eval-d,name,Weisse Spitze',
      'sorte-eval-d,art,Rettich',
      'sorte-eval-d,keimart,indifferent',
    ].join('\n');
    const laeufe = [
      lauf('sorte-eval-a', HAIKU, {}, { dauerMs: 4000 }),
      lauf('sorte-eval-b', HAIKU, { aussaatfenster: '4-9' }, { dauerMs: 9000 }),
      lauf('sorte-eval-c', HAIKU, { keimtemperatur: null }, { dauerMs: 6000 }),
    ];
    const m = modellAus(auswerten(referenzLesen(kopfUndD), laeufe, PREISE), HAIKU);
    expect(m.bewertungen['sorte-eval-b']?.aussaatfenster).toBe('erfunden');
    expect(m.bewertungen['sorte-eval-c']?.keimtemperatur).toBe('fehlend');
    expect(m.bewertungen['sorte-eval-c']?.hersteller).toBe('richtig');
    expect(m.richtig).toBe(22);
    expect(m.felder).toBe(24);
    expect(m.quoteGesamt).toBeCloseTo(22 / 24, 6);
    expect(m.quoteJeFeld.name).toBeCloseTo(1, 6);
    expect(m.quoteJeFeld.aussaatfenster).toBeCloseTo(2 / 3, 6);
    expect(m.quoteJeFeld.keimtemperatur).toBeCloseTo(2 / 3, 6);
    expect(m.schwelle80.name).toBe(true);
    expect(m.schwelle80.aussaatfenster).toBe(false);
    expect(m.dauerMedianMs).toBe(6000);
    expect(m.dauerMaxMs).toBe(9000);
    // Haiku 1 / 5 USD je Mio: 2000 × 1 + 300 × 5 = 3500 / 1e6
    expect(m.kostenJeTueteUsd).toBeCloseTo(0.0035, 9);

    const s = modellAus(
      auswerten(
        referenz(),
        TUETEN.map((t) => lauf(t, SONNET)),
        PREISE,
      ),
      SONNET,
    );
    // Sonnet 3 / 15 USD je Mio: 2000 × 3 + 300 × 15 = 10 500 / 1e6
    expect(s.kostenJeTueteUsd).toBeCloseTo(0.0105, 9);
    expect(s.quoteGesamt).toBeCloseTo(1, 6);
  });

  it('11.3 Default: höhere Quote gewinnt; Gleichstand (≤ 1 Feld) → schnellere; ohne M0 nie Default', () => {
    // Sonnet 24 richtig, Haiku 22 richtig und schneller: Unterschied 2 Felder → höhere Quote
    const deutlich = auswerten(
      referenz(),
      [
        ...TUETEN.map((t) => lauf(t, SONNET, {}, { dauerMs: 8000 })),
        ...TUETEN.map((t) =>
          lauf(t, HAIKU, t === 'sorte-eval-a' ? { kulturdauer: '40-60', keimdauer: '5-9' } : {}, {
            dauerMs: 3000,
          }),
        ),
      ],
      PREISE,
    );
    expect(defaultWaehlen(deutlich)).toBe(SONNET);

    // Sonnet 24, Haiku 23 und schneller: höchstens 1 Feld auseinander → kleinere Median-Dauer
    const knapp = auswerten(
      referenz(),
      [
        ...TUETEN.map((t) => lauf(t, SONNET, {}, { dauerMs: 8000 })),
        ...TUETEN.map((t) =>
          lauf(t, HAIKU, t === 'sorte-eval-b' ? { kulturdauer: '50-80' } : {}, { dauerMs: 3000 }),
        ),
      ],
      PREISE,
    );
    expect(defaultWaehlen(knapp)).toBe(HAIKU);

    // Haiku 23 mit falscher Art (ohne M0), Sonnet 21 mit M0 → Sonnet trotz tieferer Quote
    const ohneM0 = auswerten(
      referenz(),
      [
        ...TUETEN.map((t) =>
          lauf(
            t,
            SONNET,
            t === 'sorte-eval-c' ? { keimdauer: '5-9', aussaatfenster: '3-5', keimtemperatur: '20-24' } : {},
          ),
        ),
        ...TUETEN.map((t) =>
          lauf(t, HAIKU, t === 'sorte-eval-a' ? { art: 'Spinat' } : {}, { dauerMs: 2000 }),
        ),
      ],
      PREISE,
    );
    expect(modellAus(ohneM0, HAIKU).richtig).toBe(23);
    expect(modellAus(ohneM0, SONNET).richtig).toBe(21);
    expect(defaultWaehlen(ohneM0)).toBe(SONNET);
  });
});

describe('UC4-AK3 (Auswertung) Bericht und Trockenlauf', () => {
  it('UC4-AK3 (Auswertung) Bericht beginnt mit «UC4-AK3 [Eval]», enthält keinen Schlüssel und keine Bilddaten', () => {
    const a = auswerten(
      referenz(),
      [...TUETEN.map((t) => lauf(t, SONNET)), ...TUETEN.map((t) => lauf(t, HAIKU))],
      PREISE,
    );
    // 31.12.2026 23:30 UTC = 1.1.2027 00:30 Zürich
    const md = berichtMarkdown(a, new Date('2026-12-31T23:30:00.000Z'), ZUERICH);
    expect(md.split(/\r?\n/)[0]).toMatch(/^UC4-AK3 \[Eval\]/);
    expect(md).toContain(SONNET);
    expect(md).toContain(HAIKU);
    expect(md).toContain('M0');
    expect(md).toContain('1.1.2027');
    expect(md).not.toMatch(/sk-ant/i);
    expect(md).not.toMatch(/x-api-key/i);
    expect(md).not.toMatch(/[A-Za-z0-9+/]{120,}/);
    expect(md).not.toMatch(/Warnung/);

    const teuer = auswerten(
      referenz(),
      TUETEN.map((t) => lauf(t, SONNET, {}, { ein: 10_000, aus: 2_000 })),
      PREISE,
    );
    // 10 000 × 3 + 2 000 × 15 = 60 000 / 1e6 = 0.06 USD je Tüte > 0.05
    expect(modellAus(teuer, SONNET).kostenJeTueteUsd).toBeCloseTo(0.06, 9);
    expect(berichtMarkdown(teuer, new Date('2026-12-31T23:30:00.000Z'), ZUERICH)).toMatch(/Warnung/);
  });

  const antworten = import.meta.glob<string>('../fixtures/ki/antworten/*.json', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  type Block = { type?: string; text?: string; source?: { data?: string } };

  function trocken(fotonamen: readonly string[]) {
    let uhr = Date.parse('2027-01-08T09:00:00.000Z');
    const gewandelt: string[] = [];
    const aufrufe: { modell: string; bilder: string[] }[] = [];
    const ablauf = evalAblauf({
      referenzCsv: referenzRoh,
      fotos: fotonamen.map((name) => ({ name, bytes: new TextEncoder().encode(name.replace(/\.jpg$/, '')) })),
      modelle: [SONNET, HAIKU],
      bildWandeln: async (bytes) => {
        gewandelt.push(new TextDecoder().decode(bytes));
        return bytes;
      },
      rufer: async (modell, anfrage) => {
        const inhalt = ((anfrage['messages'] as { content: Block[] }[])[0]?.content ?? []) as Block[];
        const bilder = inhalt.filter((b) => b.type === 'image').map((b) => atob(b.source?.data ?? ''));
        aufrufe.push({ modell: String(anfrage['model']), bilder });
        const zeile = (bilder[0] ?? '').replace(/-1$/, '');
        const roh = antworten[`../fixtures/ki/antworten/${zeile}.${modell}.json`];
        if (!roh) return { art: 'fehler', status: 404 };
        const body = JSON.parse(roh) as {
          content: Block[];
          usage: { input_tokens: number; output_tokens: number };
        };
        uhr += modell === SONNET ? 6000 : 3000;
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
    return { ablauf, gewandelt, aufrufe };
  }

  const ALLE_FOTOS = TUETEN.flatMap((t) => [`${t}-1.jpg`, `${t}-2.jpg`]);

  it('UC4-AK3 (Auswertung) Trockenlauf mit erfundener Beispiel-Referenz und drei aufgezeichneten Antworten ergibt den erwarteten Bericht', async () => {
    expect(Object.keys(antworten)).toHaveLength(6);
    const { ablauf, gewandelt, aufrufe } = trocken([...ALLE_FOTOS].reverse());
    const r = await ablauf;

    expect(new Set(gewandelt)).toEqual(new Set(ALLE_FOTOS.map((n) => n.replace(/\.jpg$/, ''))));
    expect(aufrufe).toHaveLength(6);
    for (const t of TUETEN) {
      for (const m of [SONNET, HAIKU]) {
        expect(aufrufe).toContainEqual({ modell: m, bilder: [`${t}-1`, `${t}-2`] });
      }
    }

    const s = modellAus(r.auswertung, SONNET);
    const h = modellAus(r.auswertung, HAIKU);
    expect(s.richtig).toBe(24);
    expect(h.richtig).toBe(22);
    expect(h.bewertungen['sorte-eval-b']?.aussaatfenster).toBe('erfunden');
    expect(h.bewertungen['sorte-eval-c']?.keimtemperatur).toBe('fehlend');
    expect(s.m0).toBe(true);
    expect(h.m0).toBe(true);
    expect(s.dauerMedianMs).toBe(6000);
    expect(h.dauerMedianMs).toBe(3000);
    expect(s.kostenJeTueteUsd).toBeCloseTo(0.0105, 9);
    expect(h.kostenJeTueteUsd).toBeCloseTo(0.00325, 9);
    expect(r.defaultModell).toBe(SONNET);
    expect(r.markdown.split(/\r?\n/)[0]).toMatch(/^UC4-AK3 \[Eval\]/);
    expect(r.markdown).toContain('8.1.2027');
    expect(r.markdown).not.toMatch(/[A-Za-z0-9+/]{120,}/);
  });

  it('UC4-AK3 (Auswertung) Trockenlauf: Foto ohne Referenz oder fehlendes Feld → Abbruch vor dem ersten Aufruf', async () => {
    const ohneReferenz = trocken([...ALLE_FOTOS, 'sorte-eval-x-1.jpg', 'sorte-eval-x-2.jpg']);
    await expect(ohneReferenz.ablauf).rejects.toThrow(/sorte-eval-x/);
    expect(ohneReferenz.aufrufe).toHaveLength(0);

    const ohneFeld = evalAblauf({
      referenzCsv: referenzRoh
        .split(/\r?\n/)
        .filter((z) => !z.startsWith('sorte-eval-b,hersteller,'))
        .join('\n'),
      fotos: ALLE_FOTOS.map((name) => ({ name, bytes: new TextEncoder().encode(name) })),
      modelle: [SONNET],
      bildWandeln: async (bytes) => bytes,
      rufer: async () => {
        throw new Error('kein Aufruf erwartet');
      },
      zeit: { jetzt: () => new Date('2027-01-08T09:00:00.000Z') },
      preise: PREISE,
      zeitzone: ZUERICH,
    });
    await expect(ohneFeld).rejects.toThrow(/sorte-eval-b/);
  });
});
