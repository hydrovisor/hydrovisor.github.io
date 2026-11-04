// Anfrage an die Messages-API und Auslesen der Antwort (Issue #14, Plan 14 Testliste; Konzept 11.3, 16.4;
// 04_architektur.md 6). Kein Netz: geprüft wird nur der gebaute Körper und ein aufgezeichneter Antwortkörper.
//
// Vorausgesetzt (Plan 14, Schnittstellen):
//   src/domain/ki/anfrage.ts
//     KiEingabe, ANWEISUNG, anfrageBauen(eingabe, modell): Record<string, unknown>, antwortAuslesen(body)
//   Die genauen Parameternamen für Structured Outputs und Denkstufe prüft der Lead an der API-Dokumentation (16.4);
//   die Tests verlangen deshalb nur: TUETEN_SCHEMA steht unverändert irgendwo im Körper, der Wert 'low' steht im
//   Körper, keine Sampling-Parameter. Bilder als Inhaltsblöcke { type: 'image', source: { type: 'base64',
//   media_type: 'image/jpeg', data } } in der Reihenfolge der Eingabe, alle in genau einer Nachricht (role user).
//   ANWEISUNG steht im system-Feld oder als Textblock derselben Nachricht.
//   antwortAuslesen nimmt den ersten Block vom Typ text (Denkblöcke werden übersprungen) und usage.
import { describe, expect, it } from 'vitest';
import { ANWEISUNG, anfrageBauen, antwortAuslesen } from '../../src/domain/ki/anfrage.ts';
import { TUETEN_SCHEMA } from '../../src/domain/ki/schema.ts';
import gueltigRoh from '../fixtures/ki/antwort_gueltig.json?raw';

const MODELL = 'claude-sonnet-5-5';
const VORNE = '/9j/4AAQSkZJRgABAQAAAQABAAD/vorne';
const HINTEN = '/9j/4AAQSkZJRgABAQAAAQABAAD/hinten';

type Block = { type?: string; text?: string; source?: { type?: string; media_type?: string; data?: string } };
type Nachricht = { role?: string; content?: Block[] | string };

function nachrichten(body: Record<string, unknown>): Nachricht[] {
  return body['messages'] as Nachricht[];
}

function bloecke(n: Nachricht | undefined): Block[] {
  if (!n) return [];
  return typeof n.content === 'string' ? [{ type: 'text', text: n.content }] : (n.content ?? []);
}

function enthaeltWert(wert: unknown, gesucht: unknown): boolean {
  if (JSON.stringify(wert) === JSON.stringify(gesucht)) return true;
  if (wert && typeof wert === 'object') return Object.values(wert).some((w) => enthaeltWert(w, gesucht));
  return false;
}

function systemText(body: Record<string, unknown>): string {
  const s = body['system'];
  if (typeof s === 'string') return s;
  if (Array.isArray(s)) return s.map((b: Block) => b.text ?? '').join('\n');
  return '';
}

const bildAnfrage = () =>
  anfrageBauen({ art: 'bilder', bilder: [{ base64: VORNE }, { base64: HINTEN }] }, MODELL);

describe('11.3 Anfrage an die Messages-API', () => {
  it('11.3 Anfrage mit Modell, max_tokens 2000, Schema und Denkstufe low', () => {
    const body = bildAnfrage();
    expect(body['model']).toBe(MODELL);
    expect(body['max_tokens']).toBe(2000);
    expect(enthaeltWert(body, TUETEN_SCHEMA)).toBe(true);
    expect(enthaeltWert(body, 'low')).toBe(true);
    expect(anfrageBauen({ art: 'text', text: 'Rote Probe' }, 'claude-haiku-5-5')['model']).toBe(
      'claude-haiku-5-5',
    );
  });

  it('11.3 keine Sampling-Parameter', () => {
    for (const body of [bildAnfrage(), anfrageBauen({ art: 'text', text: 'Rote Probe' }, MODELL)]) {
      expect(body).not.toHaveProperty('temperature');
      expect(body).not.toHaveProperty('top_p');
      expect(body).not.toHaveProperty('top_k');
    }
  });

  it('11.3 zwei Bilder und Anweisung in einer Nachricht, JPEG', () => {
    const body = bildAnfrage();
    const liste = nachrichten(body);
    expect(liste).toHaveLength(1);
    expect(liste[0]?.role).toBe('user');
    const inhalt = bloecke(liste[0]);
    const bilder = inhalt.filter((b) => b.type === 'image');
    expect(bilder.map((b) => b.source)).toEqual([
      { type: 'base64', media_type: 'image/jpeg', data: VORNE },
      { type: 'base64', media_type: 'image/jpeg', data: HINTEN },
    ]);
    const texte = inhalt.filter((b) => b.type === 'text').map((b) => b.text ?? '');
    expect([systemText(body), ...texte].some((t) => t.includes(ANWEISUNG))).toBe(true);
    expect(ANWEISUNG.length).toBeGreaterThan(0);
  });

  it('11.3 Text statt Bild', () => {
    const text = 'Salat Rote Probe, Lichtkeimer, Keimung bei 15 bis 20 °C in 7 bis 14 Tagen';
    const body = anfrageBauen({ art: 'text', text }, MODELL);
    const liste = nachrichten(body);
    expect(liste).toHaveLength(1);
    const inhalt = bloecke(liste[0]);
    expect(inhalt.some((b) => b.type === 'image')).toBe(false);
    expect(inhalt.some((b) => b.type === 'text' && (b.text ?? '').includes(text))).toBe(true);
  });

  it('11.3 antwortAuslesen: Text und Token aus dem aufgezeichneten Körper; unbekannter Körper → undefined', () => {
    const body = JSON.parse(gueltigRoh) as { content: Block[] };
    const erwarteterText = body.content.find((b) => b.type === 'text')?.text;
    expect(antwortAuslesen(body)).toEqual({ text: erwarteterText, eingabeTokens: 2100, ausgabeTokens: 310 });
    expect(antwortAuslesen(undefined)).toBeUndefined();
    expect(antwortAuslesen(null)).toBeUndefined();
    expect(antwortAuslesen({})).toBeUndefined();
    expect(antwortAuslesen({ content: [], usage: { input_tokens: 1, output_tokens: 1 } })).toBeUndefined();
    expect(
      antwortAuslesen({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }),
    ).toBeUndefined();
  });
});
