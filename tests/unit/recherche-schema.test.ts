// Schemas, Anfragen und Antworten der Recherche (Issue #37, Plan 37 Testliste; UC4-AK7; Konzept 9.2, 11.3; Erratum E8).
// Aufgezeichnete Antworten in tests/fixtures/ki/recherche/ (erfundene Quellen unter example.invalid); kein Netz.
//
// Vorausgesetzt (Plan 37, Domänenfunktionen):
//   src/domain/ki/recherche.ts
//     RECHERCHE_SCHEMA, PRUEF_SCHEMA (eingefroren)
//     rechercheAnfrageBauen(auftrag: { art: { name_de, name_wiss }, sorte: { name }, luecken, saat }, modell)
//     rechercheAntwortPruefen(text) → { ok: true; werte; saat } | { ok: false }
//       Antwort-JSON: { werte: WertKandidat[], saat: SaatKandidat[] } (Felder siehe recherche-validator.test.ts)
//     pruefAnfrageBauen(kandidaten: { id, link, fundstelle, kurzzitat, wert }[], modell)
//     pruefAntwortPruefen(text, ids) → { ok: true; belegt: ReadonlySet<string>; gruende } | { ok: false }
//       Antwort-JSON: { pruefungen: { id, belegt, grund }[] }
//     letzterTextblock(body) → { text, eingabeTokens, ausgabeTokens, stopReason } | undefined
//     quelleId(link) → 'recherche-' + 8 Hexzeichen (FNV-1a der normalisierten Adresse, A19)
//   src/domain/ki/modelle.ts RECHERCHE_MAX_TOKENS = 8000, SUCHEN_MAX = 5, werkzeugeFuer(modell)
import { describe, expect, it } from 'vitest';
import {
  PRUEF_SCHEMA,
  RECHERCHE_SCHEMA,
  letzterTextblock,
  pruefAnfrageBauen,
  pruefAntwortPruefen,
  quelleId,
  rechercheAnfrageBauen,
  rechercheAntwortPruefen,
} from '../../src/domain/ki/recherche.ts';
import { RECHERCHE_MAX_TOKENS, SUCHEN_MAX, werkzeugeFuer } from '../../src/domain/ki/modelle.ts';
import gueltigRoh from '../fixtures/ki/recherche/antwort_gueltig.json?raw';
import ungueltigRoh from '../fixtures/ki/recherche/antwort_ungueltig.json?raw';
import pauseRoh from '../fixtures/ki/recherche/antwort_pause_turn.json?raw';
import belegtRoh from '../fixtures/ki/recherche/pruefer_belegt.json?raw';

const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';

type Block = { type: string; text?: string };
const letzterText = (roh: string): string => {
  const bloecke = (JSON.parse(roh) as { content: Block[] }).content.filter((b) => b.type === 'text');
  const t = bloecke[bloecke.length - 1]?.text;
  if (t === undefined) throw new Error('Fixture ohne Textblock');
  return t;
};

const AUFTRAG = {
  art: { name_de: 'Testsalat', name_wiss: 'Testus lactucoides' },
  sorte: { name: 'Testsorte Rot' },
  luecken: [
    { id: 'wachstum.ec', phase: 'wachstum', groesse: 'ec' },
    { id: 'wachstum.ph', phase: 'wachstum', groesse: 'ph' },
  ],
  saat: ['schnitt'],
} as Parameters<typeof rechercheAnfrageBauen>[0];

const KANDIDATEN = [
  {
    id: 'w1',
    link: 'https://forschung.example.invalid/blattsalat-dwc',
    fundstelle: 'Tabelle 2',
    kurzzitat: 'Im DWC-System lag die Leitfähigkeit zwischen 1.2 und 1.6 mS/cm.',
    wert: 'EC Wachstum 1.2–1.6 mS/cm',
  },
  {
    id: 'w2',
    link: 'https://hersteller.example.invalid/nft-anleitung',
    fundstelle: 'Abschnitt 4',
    kurzzitat: 'Für Blattgemüse im NFT halten wir den pH-Wert bei 5.8 bis 6.2.',
    wert: 'pH Wachstum 5.8–6.2',
  },
  {
    id: 's1',
    link: 'https://forschung.example.invalid/saatmenge',
    fundstelle: 'Seite 3',
    kurzzitat: 'Drei Samen je Steinwollwürfel.',
    wert: 'Schnitt: 3 Samen je Schwamm',
  },
];

type Werkzeug = Record<string, unknown> & { type: string; name?: string };
const werkzeuge = (a: Record<string, unknown>): Werkzeug[] => (a['tools'] as Werkzeug[] | undefined) ?? [];

describe('UC4-AK7 Schema und Anfragen der Recherche (11.3)', () => {
  it('UC4-AK7 (Schema) gültige Antwort mit Kandidaten; unbekanntes Feld verworfen; ungültiges JSON → ok false', () => {
    expect(Object.isFrozen(RECHERCHE_SCHEMA)).toBe(true);
    expect(Object.isFrozen(PRUEF_SCHEMA)).toBe(true);

    const r = rechercheAntwortPruefen(letzterText(gueltigRoh));
    if (!r.ok) throw new Error('gültige Fixture verworfen');
    expect(r.werte.map((w) => w.id)).toEqual(['w1', 'w2']);
    expect(r.saat.map((s) => s.id)).toEqual(['s1']);
    expect(r.werte[0]).toMatchObject({
      phase: 'wachstum',
      groesse: 'ec',
      ec_einheit: 'mS/cm',
      system: 'dwc',
    });

    const roh = JSON.parse(letzterText(gueltigRoh)) as { werte: Record<string, unknown>[] };
    const mitFremdfeld = JSON.stringify({
      ...roh,
      zusammenfassung: 'frei erfunden',
      werte: roh.werte.map((w) => ({ ...w, ph_geschaetzt: 6.1 })),
    });
    const f = rechercheAntwortPruefen(mitFremdfeld);
    if (!f.ok) throw new Error('Antwort mit Fremdfeld ganz verworfen');
    expect(f).not.toHaveProperty('zusammenfassung');
    for (const w of f.werte) expect(w).not.toHaveProperty('ph_geschaetzt');

    expect(rechercheAntwortPruefen(letzterText(ungueltigRoh)).ok).toBe(false);
    expect(rechercheAntwortPruefen('').ok).toBe(false);
    expect(rechercheAntwortPruefen('[]').ok).toBe(false);
    expect(rechercheAntwortPruefen('{"werte":"keine"}').ok).toBe(false);
  });

  it('UC4-AK7 (Schema) Anfrage mit web_search, max_uses 5, output_config json_schema, ohne temperature, top_p, top_k', () => {
    for (const [modell, version] of [
      [SONNET, 'web_search_20260209'],
      [HAIKU, 'web_search_20250305'],
    ] as const) {
      const a = rechercheAnfrageBauen(AUFTRAG, modell);
      expect(a['model']).toBe(modell);
      expect(a['max_tokens']).toBe(RECHERCHE_MAX_TOKENS);
      expect(RECHERCHE_MAX_TOKENS).toBe(8000);
      const suche = werkzeuge(a).filter((w) => w.name === 'web_search');
      expect(suche, modell).toHaveLength(1);
      expect(suche[0]).toMatchObject({ type: version, name: 'web_search', max_uses: SUCHEN_MAX });
      expect(SUCHEN_MAX).toBe(5);
      expect(werkzeuge(a).some((w) => w.name === 'web_fetch')).toBe(false);
      expect(a['output_config']).toEqual({
        effort: 'low',
        format: { type: 'json_schema', schema: RECHERCHE_SCHEMA },
      });
      for (const verboten of ['temperature', 'top_p', 'top_k']) expect(a).not.toHaveProperty(verboten);
      const text = JSON.stringify(a['messages']) + JSON.stringify(a['system'] ?? '');
      expect(text).toContain('Testus lactucoides');
      expect(text).toContain('Testsorte Rot');
      expect(text.toLowerCase()).toContain('hydropon');
      expect(text).toMatch(/wachstum/);
    }
    expect(JSON.stringify(werkzeugeFuer(SONNET))).toContain('web_search_20260209');
    expect(JSON.stringify(werkzeugeFuer(SONNET))).toContain('web_fetch_20260209');
    expect(JSON.stringify(werkzeugeFuer(HAIKU))).toContain('web_search_20250305');
    expect(JSON.stringify(werkzeugeFuer(HAIKU))).toContain('web_fetch_20250910');
    expect(JSON.stringify(werkzeugeFuer(HAIKU))).not.toContain('20260209');
  });

  it('UC4-AK7 (Schema) Prüfanfrage nur mit den Domains der Kandidaten; Prüfantwort mit unbekannter id ok false', () => {
    for (const [modell, version] of [
      [SONNET, 'web_fetch_20260209'],
      [HAIKU, 'web_fetch_20250910'],
    ] as const) {
      const a = pruefAnfrageBauen(KANDIDATEN, modell);
      const abruf = werkzeuge(a).filter((w) => w.name === 'web_fetch');
      expect(abruf, modell).toHaveLength(1);
      expect(abruf[0]?.type).toBe(version);
      expect([...((abruf[0]?.['allowed_domains'] as string[]) ?? [])].sort()).toEqual([
        'forschung.example.invalid',
        'hersteller.example.invalid',
      ]);
      expect(abruf[0]?.['max_uses']).toBe(3);
      expect(werkzeuge(a).some((w) => w.name === 'web_search')).toBe(false);
      expect(JSON.stringify(a)).not.toContain('citations');
      expect(a['output_config']).toEqual({
        effort: 'low',
        format: { type: 'json_schema', schema: PRUEF_SCHEMA },
      });
      for (const verboten of ['temperature', 'top_p', 'top_k']) expect(a).not.toHaveProperty(verboten);
      for (const k of KANDIDATEN) expect(JSON.stringify(a['messages'])).toContain(k.kurzzitat);
    }

    const ids = ['w1', 'w2', 's1'];
    const p = pruefAntwortPruefen(letzterText(belegtRoh), ids);
    if (!p.ok) throw new Error('Prüfantwort verworfen');
    expect([...p.belegt].sort()).toEqual(['s1', 'w1', 'w2']);

    const teil = pruefAntwortPruefen(
      JSON.stringify({
        pruefungen: [
          { id: 'w1', belegt: true, grund: 'steht in Tabelle 2' },
          { id: 'w2', belegt: false, grund: 'Zitat nicht gefunden' },
        ],
      }),
      ids,
    );
    if (!teil.ok) throw new Error('Teilantwort verworfen');
    expect([...teil.belegt]).toEqual(['w1']);
    expect(teil.gruende['w2']).toBe('Zitat nicht gefunden');

    const fremd = JSON.stringify({ pruefungen: [{ id: 'x9', belegt: true, grund: 'erfunden' }] });
    expect(pruefAntwortPruefen(fremd, ids).ok).toBe(false);
    expect(pruefAntwortPruefen('kein JSON', ids).ok).toBe(false);
  });

  it('UC4-AK7 (Schema) letzterTextblock nimmt den letzten Textblock nach server_tool_use und web_search_tool_result', () => {
    const r = letzterTextblock(JSON.parse(gueltigRoh));
    expect(r?.text).toBe(letzterText(gueltigRoh));
    expect(r?.text).not.toBe('Ich suche hydroponische Quellen.');
    expect(r).toMatchObject({ eingabeTokens: 5200, ausgabeTokens: 900, stopReason: 'end_turn' });

    const pause = letzterTextblock(JSON.parse(pauseRoh));
    expect(pause?.stopReason).toBe('pause_turn');

    expect(
      letzterTextblock({ content: [{ type: 'server_tool_use', id: 'x', name: 'web_search' }] }),
    ).toBeUndefined();
    expect(letzterTextblock(null)).toBeUndefined();
    expect(letzterTextblock({ type: 'error' })).toBeUndefined();
  });

  it('UC4-AK7 (Schema) quelleId gleich für gleiche Adresse mit und ohne abschliessenden Schrägstrich', () => {
    const a = quelleId('https://forschung.example.invalid/blattsalat-dwc');
    expect(a).toMatch(/^recherche-[0-9a-f]{8}$/);
    expect(quelleId('https://forschung.example.invalid/blattsalat-dwc/')).toBe(a);
    expect(quelleId('https://Forschung.Example.invalid/blattsalat-dwc')).toBe(a);
    expect(quelleId('https://forschung.example.invalid/blattsalat-dwc#tabelle-2')).toBe(a);
    expect(quelleId('https://forschung.example.invalid/blattsalat-nft')).not.toBe(a);
    expect(quelleId('https://forschung.example.invalid/blattsalat-dwc')).toBe(a);
  });

  it('UC4-AK7 (Schema) B5 Prüfanfrage: max_uses höchstens 10, sonst die Zahl der Links', () => {
    const viele = Array.from({ length: 12 }, (_, i) => ({
      id: `w${i + 1}`,
      link: `https://forschung.example.invalid/quelle-${i + 1}`,
      fundstelle: 'Tabelle 1',
      kurzzitat: `Zitat ${i + 1}`,
      wert: 'pH Wachstum 5.8–6.2',
    }));
    const abruf = (k: typeof viele) =>
      werkzeuge(pruefAnfrageBauen(k, SONNET)).find((w) => w.name === 'web_fetch')?.['max_uses'];
    expect(abruf(viele)).toBe(10);
    expect(abruf(viele.slice(0, 2))).toBe(2);
  });
});
